import React from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Animated, Easing, useWindowDimensions,
} from 'react-native'
import { TTConfig } from '../networking/TTNetworkClient'
import { parseColor } from './utils'

interface Props {
  config: TTConfig
  visible: boolean
  onStart: () => void
  onDismiss: () => void          // minimise → show FAB
  onDontShowAgain: () => void    // permanent dismiss
}

export function TTWelcomeCardView({ config, visible, onStart, onDismiss, onDontShowAgain }: Props) {
  const { width } = useWindowDimensions()

  const fabBg       = parseColor(config.styles?.fabBgColor) ?? '#3730A3'
  const btnRadius   = config.styles?.btnBorderRadius ?? 8
  const title       = (config as any).welcomeTitle  ?? config.name
  const subtitle    = (config as any).welcomeBody   ?? 'Learn how to get the most out of this screen.'
  const startLabel  = (config as any).startLabel    ?? 'Start tour'
  const dismissLabel = (config as any).dismissLabel ?? 'Maybe later'

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onDismiss}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onDismiss} />
      <View style={[styles.card, { maxWidth: Math.min(width, 480) }]}>
        <View style={styles.handle} />

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{subtitle}</Text>

        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: fabBg, borderRadius: btnRadius }]}
          onPress={onStart}
          activeOpacity={0.85}
        >
          <Text style={styles.startBtnText}>{startLabel}</Text>
        </TouchableOpacity>

        <View style={styles.secondaryRow}>
          <TouchableOpacity onPress={onDismiss}>
            <Text style={styles.secondaryBtn}>{dismissLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDontShowAgain}>
            <Text style={styles.secondaryBtn}>Don't show again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 48,
    alignSelf: 'center',
    width: '100%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22, fontWeight: '800', color: '#0D0A1C',
    marginBottom: 10, letterSpacing: -0.5,
  },
  body: {
    fontSize: 15, color: 'rgba(13,10,28,0.6)',
    lineHeight: 22, marginBottom: 24,
  },
  startBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  startBtnText: {
    color: '#fff', fontSize: 15, fontWeight: '700',
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryBtn: {
    fontSize: 13, color: 'rgba(13,10,28,0.4)', fontWeight: '600',
  },
})
