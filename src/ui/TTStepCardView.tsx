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
  const fabBg     = parseColor(config.styles?.fabBgColor) ?? '#1925AA'
  const btnRadius = config.styles?.btnBorderRadius ?? 8
  const isLast    = stepIndex === totalSteps - 1

  return (
    <View style={styles.card}>
      {/* Top row: STEP X OF X label + close */}
      <View style={styles.topRow}>
        <Text style={[styles.stepLabel, { color: fabBg }]}>
          STEP {stepIndex + 1} OF {totalSteps}
        </Text>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {!!step.title   && <Text style={styles.title}>{step.title}</Text>}
      {!!step.content && <Text style={styles.body}>{step.content}</Text>}

      {/* Dot progress — pill for active, small circle for others */}
      <View style={styles.dotRow}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === stepIndex
                ? { width: 20, backgroundColor: fabBg }
                : { backgroundColor: 'rgba(13,10,28,0.15)' },
            ]}
          />
        ))}
      </View>

      {/* Full-width Next / Done button */}
      <TouchableOpacity
        style={[styles.nextBtn, { backgroundColor: fabBg, borderRadius: btnRadius }]}
        onPress={onNext}
      >
        <Text style={styles.nextBtnText}>{isLast ? 'Done ✓' : 'Next →'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
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
  title: { fontSize: 20, fontWeight: '800', color: '#0D0A1C', marginBottom: 8, letterSpacing: -0.4 },
  body:  { fontSize: 14, color: 'rgba(13,10,28,0.6)', lineHeight: 20, marginBottom: 16 },
  dotRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  dot: {
    width: 7, height: 7, borderRadius: 4,
  },
  nextBtn:  { paddingVertical: 14, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
})
