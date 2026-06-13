import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { TTStep, TTConfig } from '../networking/TTNetworkClient'
import { parseColor } from './utils'

interface Props {
  step: TTStep
  stepIndex: number
  totalSteps: number
  config: TTConfig
  onNext: () => void
  onBack: () => void
  onDismiss: () => void
}

export function TTStepCardView({ step, stepIndex, totalSteps, config, onNext, onBack, onDismiss }: Props) {
  const st          = config.styles
  const accent      = parseColor(st?.fab?.bg_color)           ?? '#1925AA'
  const cardBg      = parseColor(st?.card?.bg_color)          ?? '#ffffff'
  const cardRadius  = st?.card?.border_radius                 ?? 16
  const titleColor  = parseColor(st?.type?.title_color)       ?? '#0D0A1C'
  const bodyColor   = parseColor(st?.type?.body_color)        ?? 'rgba(13,10,28,0.6)'
  const dotInactive = parseColor(st?.type?.dot_inactive_color) ?? 'rgba(13,10,28,0.15)'
  const btnBg       = parseColor(st?.btn?.bg_color)           ?? accent
  const btnText     = parseColor(st?.btn?.text_color)         ?? '#ffffff'
  const btnRadius   = st?.btn?.border_radius                  ?? 8
  const isLast      = stepIndex === totalSteps - 1

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderRadius: cardRadius }]}>
      {/* Top row: STEP X OF X label + close */}
      <View style={styles.topRow}>
        <Text style={[styles.stepLabel, { color: accent }]}>
          STEP {stepIndex + 1} OF {totalSteps}
        </Text>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {!!step.title   && <Text style={[styles.title, { color: titleColor }]}>{step.title}</Text>}
      {!!step.content && <Text style={[styles.body, { color: bodyColor }]}>{step.content}</Text>}

      {/* Dot progress — pill for active, small circle for others */}
      <View style={styles.dotRow}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === stepIndex
                ? { width: 20, backgroundColor: btnBg }
                : { backgroundColor: dotInactive },
            ]}
          />
        ))}
      </View>

      {/* Navigation: full-width Next on step 1; Prev + Next side-by-side after */}
      {stepIndex === 0 ? (
        <TouchableOpacity
          style={[styles.nextBtnFull, { backgroundColor: btnBg, borderRadius: btnRadius }]}
          onPress={onNext}
        >
          <Text style={[styles.nextBtnText, { color: btnText }]}>{isLast ? 'Done ✓' : 'Next →'}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.prevBtn, { borderRadius: btnRadius }]}
            onPress={onBack}
          >
            <Text style={[styles.prevBtnText, { color: btnBg }]}>← Prev</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextBtnHalf, { backgroundColor: btnBg, borderRadius: btnRadius }]}
            onPress={onNext}
          >
            <Text style={[styles.nextBtnText, { color: btnText }]}>{isLast ? 'Done ✓' : 'Next →'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    marginHorizontal: 16,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  topRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10,
  },
  stepLabel: {
    fontSize: 11, fontWeight: '800', letterSpacing: 1.5,
  },
  closeBtn: { fontSize: 14, color: 'rgba(13,10,28,0.35)', fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 8, letterSpacing: -0.4 },
  body:  { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  dotRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  navRow: { flexDirection: 'row', gap: 8 },
  prevBtn: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    backgroundColor: 'rgba(13,10,28,0.05)',
  },
  prevBtnText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  nextBtnFull: { paddingVertical: 14, alignItems: 'center' },
  nextBtnHalf: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  nextBtnText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
})
