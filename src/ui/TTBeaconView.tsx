import React, { useEffect, useRef } from 'react'
import { View, Text, Animated, StyleSheet } from 'react-native'

interface Props {
  x: number
  y: number
  width: number
  height: number
  stepNumber: number
  color?: string
}

/**
 * Animated beacon shown over the target element during a tour step.
 * Pulses outward from the element center — mirrors iOS TTBeaconView.
 */
export function TTBeaconView({ x, y, width, height, stepNumber, color = '#1925AA' }: Props) {
  const pulse = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [])

  const pulseScale  = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] })
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] })

  // Anchor the badge at the bottom-centre edge so it points toward the step card
  const cx = x + width / 2
  const cy = y + height
  const BEACON = 28

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {/* Pulse ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            left: cx - BEACON / 2,
            top:  cy - BEACON / 2,
            width: BEACON, height: BEACON,
            borderRadius: BEACON / 2,
            borderColor: color,
            transform: [{ scale: pulseScale }],
            opacity: pulseOpacity,
          },
        ]}
      />
      {/* Step number badge */}
      <View style={[styles.badge, { left: cx - 14, top: cy - 14, backgroundColor: color }]}>
        <Text style={styles.badgeText}>{stepNumber}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  badge: {
    position: 'absolute',
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: {
    color: '#fff', fontSize: 12, fontWeight: '800',
  },
})
