import React, { useRef, useEffect } from 'react'
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

  const fabBg        = parseColor(config.styles?.fab?.bg_color) ?? '#3730A3'
  const btnRadius    = config.styles?.btn?.border_radius ?? 8
  const title        = config.welcomeTitle   ?? config.name ?? 'Welcome'
  const subtitle     = config.welcomeMessage ?? 'Learn how to get the most out of this screen.'
  const startLabel   = (config as any).startLabel    ?? 'Start tour'
  const dismissLabel = (config as any).dismissLabel  ?? 'Maybe later'

  // ── Separate animations: backdrop fades, card slides ─────────────────────
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const cardTranslateY  = useRef(new Animated.Value(400)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1, duration: 220, useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 0, duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      backdropOpacity.setValue(0)
      cardTranslateY.setValue(400)
    }
  }, [visible])

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onDismiss}>
      {/* Backdrop fades in separately */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onDismiss} />
      </Animated.View>

      {/* Card slides up independently */}
      <Animated.View
        style={[
          styles.card,
          { maxWidth: Math.min(width, 480), transform: [{ translateY: cardTranslateY }] },
        ]}
      >
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
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  card: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
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
