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

/**
 * Initial launch card — layout mirrors iOS/Android TTWelcomeCardView exactly:
 * floating white card near the bottom (centered text, CTA, "Don't show again"),
 * then a gap and an X dismiss circle below the card.
 */
export function TTWelcomeCardView({ config, visible, onStart, onDismiss, onDontShowAgain }: Props) {
  const { width } = useWindowDimensions()

  const st          = config.styles
  const cardBg      = parseColor(st?.card?.bg_color)    ?? '#ffffff'
  const cardRadius  = st?.card?.border_radius           ?? 16
  const titleColor  = parseColor(st?.type?.title_color) ?? '#0D0A1C'
  const bodyColor   = parseColor(st?.type?.body_color)  ?? '#6B7280'
  const btnBg       = parseColor(st?.btn?.bg_color)     ?? '#3730A3'
  const btnText     = parseColor(st?.btn?.text_color)   ?? '#ffffff'
  const btnRadius   = st?.btn?.border_radius            ?? 8

  const title    = config.welcomeTitle   ?? config.name ?? 'Welcome'
  const subtitle = config.welcomeMessage ?? 'Learn how to get the most out of this screen.'

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

      {/* Card + X circle slide up together */}
      <Animated.View
        style={[styles.wrap, { transform: [{ translateY: cardTranslateY }] }]}
        pointerEvents="box-none"
      >
        <View style={[
          styles.card,
          {
            backgroundColor: cardBg,
            borderRadius: cardRadius,
            maxWidth: Math.min(width - 40, 480),
          },
        ]}>
          {!!title && (
            <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
          )}
          {!!subtitle && (
            <Text style={[styles.body, { color: bodyColor }]}>{subtitle}</Text>
          )}

          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: btnBg, borderRadius: btnRadius }]}
            onPress={onStart}
            activeOpacity={0.85}
          >
            <Text style={[styles.startBtnText, { color: btnText }]}>Yes, show me around!</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onDontShowAgain} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}>
            <Text style={styles.dontShowText}>Don't show again</Text>
          </TouchableOpacity>
        </View>

        {/* X dismiss circle below the card, centred — matches iOS/Android */}
        <TouchableOpacity style={styles.dismissCircle} onPress={onDismiss} activeOpacity={0.8}>
          <Text style={styles.dismissX}>✕</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  wrap: {
    position: 'absolute',
    bottom: 48, left: 0, right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  title: {
    fontSize: 18, fontWeight: '700', textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    fontSize: 14, textAlign: 'center', lineHeight: 20,
    marginBottom: 20,
  },
  startBtn: {
    width: '100%',
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 6,
  },
  startBtnText: {
    fontSize: 14, fontWeight: '700',
  },
  dontShowText: {
    fontSize: 14, color: '#9CA3B0', paddingVertical: 4,
  },
  dismissCircle: {
    marginTop: 16,
    width: 36, height: 36, borderRadius: 18,
    // Black translucent circle with a white X — matches iOS/Android.
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  dismissX: {
    fontSize: 13, fontWeight: '700', color: '#ffffff',
  },
})
