import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  Modal, Animated, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { TTViewRegistry } from '../TTViewRegistry'
import { TTNetworkClient } from '../networking/TTNetworkClient'
import { TooltipTour } from '../TooltipTour'

type InspectorMode = 'navigate' | 'highlight'
type InspectorPhase = 'tapping' | 'confirming' | 'done'

interface Props {
  sessionId: string
  baseURL: string
  mode: 'element' | 'page'
  onEnd: () => void
}

const BRAND = '#1925AA'

/**
 * Visual inspector overlay — Navigate + Highlight only (no Select).
 * Mirrors iOS TTInspector.swift and Android TTInspector.kt.
 *
 * Activated via deep link: tooltiptour://inspect?session=xxx&base=...&mode=element
 */
export function TTInspectorView({ sessionId, baseURL, mode, onEnd }: Props) {
  const [inspMode, setInspMode]   = useState<InspectorMode>('navigate')
  const [phase, setPhase]         = useState<InspectorPhase>('tapping')
  const [capturedId, setCapturedId] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [frames, setFrames]         = useState<Map<string, { x: number; y: number; width: number; height: number }>>(new Map())

  const client = useRef(new TTNetworkClient(baseURL, '')).current

  // Refresh frames whenever we enter Highlight mode
  useEffect(() => {
    if (inspMode === 'highlight') {
      void TTViewRegistry.refreshAll().then(() => {
        setFrames(new Map(TTViewRegistry.allFrames()))
      })
    }
  }, [inspMode])

  // Auto-refresh frames on an interval in Highlight mode to handle scrolling
  useEffect(() => {
    if (inspMode !== 'highlight') return
    const interval = setInterval(async () => {
      await TTViewRegistry.refreshAll()
      setFrames(new Map(TTViewRegistry.allFrames()))
    }, 600)
    return () => clearInterval(interval)
  }, [inspMode])

  function tapChip(id: string) {
    if (phase !== 'tapping') return
    setCapturedId(id)
    setIdentifier(id !== 'unknown' ? id : '')
    setPhase('confirming')
  }

  function retry() {
    setCapturedId('')
    setIdentifier('')
    setPhase('tapping')
    setInspMode('navigate')
  }

  async function submit() {
    if (!identifier.trim()) return
    setPhase('done')
    await client.updateInspectorSession(sessionId, identifier.trim(), identifier.trim())
    setTimeout(() => {
      setPhase('tapping')
      setInspMode('navigate')
      setCapturedId('')
      setIdentifier('')
    }, 1200)
  }

  function capturePage() {
    const page = TooltipTour.currentPage ?? 'screen'
    setCapturedId(page)
    setIdentifier(page)
    setPhase('confirming')
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">

      {/* ── Highlight chips ── */}
      {inspMode === 'highlight' && phase === 'tapping' && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {Array.from(frames.entries()).map(([id, rect]) => (
            <TouchableOpacity
              key={id}
              onPress={() => tapChip(id)}
              style={[styles.chip, {
                left: rect.x, top: rect.y,
                width: rect.width, height: rect.height,
              }]}
              activeOpacity={0.7}
            >
              <View style={styles.chipBorder} />
              <View style={styles.chipLabel}>
                <Text style={styles.chipLabelText} numberOfLines={1}>{id}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Dim + confirm card ── */}
      {(phase === 'confirming' || phase === 'done') && (
        <TouchableOpacity
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
          onPress={retry}
          activeOpacity={1}
        />
      )}

      {/* ── Bottom sheet confirm card ── */}
      {(phase === 'confirming' || phase === 'done') && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.cardWrap}
        >
          <View style={styles.card}>
            <Text style={[styles.cardSuper, { color: BRAND }]}>
              {phase === 'done' ? 'SENT TO DASHBOARD ✓' : 'SET IDENTIFIER'}
            </Text>
            <Text style={styles.cardTitle}>
              {phase === 'done'
                ? identifier
                : mode === 'page' ? 'Page identified as' : 'Name this element'}
            </Text>
            {phase === 'confirming' && (
              <>
                <TextInput
                  style={[styles.identifierInput, { color: BRAND, borderColor: `${BRAND}22` }]}
                  value={identifier}
                  onChangeText={setIdentifier}
                  placeholder="e.g. loginButton or welcomeTitle"
                  placeholderTextColor={`${BRAND}59`}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={submit}
                />
                <View style={styles.cardButtons}>
                  <TouchableOpacity style={styles.retryBtn} onPress={retry}>
                    <Text style={styles.retryBtnText}>RETRY</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sendBtn, { backgroundColor: BRAND, opacity: identifier.trim() ? 1 : 0.4 }]}
                    onPress={submit}
                    disabled={!identifier.trim()}
                  >
                    <Text style={styles.sendBtnText}>SEND TO SITE →</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      )}

      {/* ── Top banner ── */}
      <View style={styles.banner} pointerEvents="box-none">
        <View style={[styles.bannerInner, { backgroundColor: BRAND }]}>
          {mode === 'page' ? (
            <>
              <Text style={styles.bannerPageText}>Navigate to your screen</Text>
              <TouchableOpacity onPress={capturePage}>
                <Text style={styles.bannerTabActive}>SET PAGE</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.tabRow} pointerEvents="box-none">
              {(['navigate', 'highlight'] as const).map(m => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setInspMode(m)}
                  style={[styles.tab, inspMode === m && styles.tabActive]}
                >
                  <Text style={[styles.tabText, inspMode === m && styles.tabTextActive]}>
                    {m === 'navigate' ? 'Navigate' : 'Highlight'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TouchableOpacity onPress={onEnd} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingTop: Platform.OS === 'ios' ? 52 : 28,
    paddingHorizontal: 16,
  },
  bannerInner: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 0, paddingHorizontal: 16, height: 48,
  },
  tabRow: { flex: 1, flexDirection: 'row', gap: 4 },
  tab: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 0,
  },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.28)' },
  tabText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  tabTextActive: { color: '#fff' },
  bannerPageText: { flex: 1, color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  bannerTabActive: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  closeBtn: { marginLeft: 8, padding: 8 },
  closeBtnText: { color: 'rgba(255,255,255,0.7)', fontSize: 16 },

  // Highlight chips
  chip: { position: 'absolute' },
  chipBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2, borderColor: 'rgba(59,130,246,0.6)',
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  chipLabel: {
    position: 'absolute', top: 4, left: 4,
    backgroundColor: 'rgba(59,130,246,0.85)',
    paddingHorizontal: 6, paddingVertical: 2,
    maxWidth: 150,
  },
  chipLabelText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Confirm card
  cardWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  card: {
    backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48,
  },
  cardSuper: {
    fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4,
  },
  cardTitle: {
    fontSize: 20, fontWeight: '900', color: '#0D0A1C', marginBottom: 16,
  },
  identifierInput: {
    fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: 'rgba(25,37,170,0.06)',
    paddingHorizontal: 16, paddingVertical: 12, marginBottom: 0,
  },
  cardButtons: { flexDirection: 'row', marginTop: 0 },
  retryBtn: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    backgroundColor: 'rgba(13,10,28,0.04)',
  },
  retryBtnText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, color: 'rgba(13,10,28,0.4)' },
  sendBtn: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
  },
  sendBtnText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, color: '#fff' },
})
