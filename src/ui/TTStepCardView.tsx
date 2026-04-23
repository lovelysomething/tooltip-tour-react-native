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
  const fabBg    = parseColor(config.styles?.fabBgColor) ?? '#1925AA'
  const btnRadius = config.styles?.btnBorderRadius ?? 8
  const isLast   = stepIndex === totalSteps - 1
  const isFirst  = stepIndex === 0

  return (
    <View style={styles.card}>
      {/* Progress + close row */}
      <View style={styles.topRow}>
        <Text style={styles.counter}>{stepIndex + 1} / {totalSteps}</Text>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { backgroundColor: fabBg, width: `${((stepIndex + 1) / totalSteps) * 100}%` as any }]} />
      </View>

      {/* Content */}
      {!!step.title && <Text style={styles.title}>{step.title}</Text>}
      {!!step.body  && <Text style={styles.body}>{step.body}</Text>}

      {/* Navigation */}
      <View style={styles.navRow}>
        {!isFirst ? (
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: fabBg, borderRadius: btnRadius }]}
          onPress={onNext}
        >
          <Text style={styles.nextBtnText}>{isLast ? 'Done' : 'Next →'}</Text>
        </TouchableOpacity>
      </View>
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
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  counter: { fontSize: 12, fontWeight: '700', color: 'rgba(13,10,28,0.4)', letterSpacing: 0.5 },
  closeBtn: { fontSize: 14, color: 'rgba(13,10,28,0.4)', fontWeight: '700' },
  progressTrack: { height: 3, backgroundColor: 'rgba(13,10,28,0.08)', borderRadius: 2, marginBottom: 16, overflow: 'hidden' },
  progressFill:  { height: 3, borderRadius: 2 },
  title: { fontSize: 18, fontWeight: '800', color: '#0D0A1C', marginBottom: 8, letterSpacing: -0.3 },
  body:  { fontSize: 14, color: 'rgba(13,10,28,0.6)', lineHeight: 20, marginBottom: 20 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backText: { fontSize: 13, color: 'rgba(13,10,28,0.4)', fontWeight: '600' },
  nextBtn:  { paddingVertical: 10, paddingHorizontal: 20 },
  nextBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
})
