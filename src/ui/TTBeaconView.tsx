import React, { useEffect, useRef } from 'react'
import { Text, Animated, StyleSheet, View } from 'react-native'

interface Props {
  x: number
  y: number
  width: number
  height: number
  stepNumber: number
  /** "numbered" (default) | "dot" | "ring" — mirrors the web/iOS/Android beacon styles */
  beaconStyle?: string
  bgColor?: string
  textColor?: string
}

/**
 * Animated beacon shown over the target element during a tour step.
 * Pulses outward from the element edge and glides (300ms) when the
 * target frame changes — mirrors iOS TTBeaconView and the web embed.
 *
 * Everything runs on the native driver: position is driven via
 * translateX/translateY (layout props like left/top are NOT supported by
 * the native animated module and mixing drivers on one node throws).
 */
export function TTBeaconView({
  x, y, width, height, stepNumber,
  beaconStyle = 'numbered',
  bgColor = '#1925AA',
  textColor = '#fff',
}: Props) {
  // Size per style — mirrors the web embed: dot 12px, ring 20px, numbered 28px
  const SIZE = beaconStyle === 'dot' ? 12 : beaconStyle === 'ring' ? 20 : 28

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

  // Glide to new positions instead of jumping. We translate from the view's
  // origin (0,0) to the target's bottom-centre, offset by half the beacon size.
  const tx = useRef(new Animated.Value(x + width / 2 - SIZE / 2)).current
  const ty = useRef(new Animated.Value(y + height - SIZE / 2)).current
  const firstRender = useRef(true)

  useEffect(() => {
    const targetX = x + width / 2 - SIZE / 2
    const targetY = y + height - SIZE / 2
    if (firstRender.current) {
      firstRender.current = false
      tx.setValue(targetX)
      ty.setValue(targetY)
      return
    }
    Animated.parallel([
      Animated.timing(tx, { toValue: targetX, duration: 300, useNativeDriver: true }),
      Animated.timing(ty, { toValue: targetY, duration: 300, useNativeDriver: true }),
    ]).start()
  }, [x, y, width, height, SIZE])

  const pulseScale   = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] })
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] })

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {/* Pulse ring — translate (glide) + scale (pulse), all native driver */}
      <Animated.View
        style={[
          styles.beacon,
          {
            width: SIZE, height: SIZE, borderRadius: SIZE / 2,
            borderWidth: 2, borderColor: bgColor,
            transform: [{ translateX: tx }, { translateY: ty }, { scale: pulseScale }],
            opacity: pulseOpacity,
          },
        ]}
      />
      {/* Beacon body — glide only */}
      <Animated.View
        style={[
          styles.beacon,
          {
            width: SIZE, height: SIZE, borderRadius: SIZE / 2,
            backgroundColor: beaconStyle === 'ring' ? 'transparent' : bgColor,
            borderWidth: beaconStyle === 'ring' ? 2 : 0,
            borderColor: bgColor,
            alignItems: 'center', justifyContent: 'center',
            transform: [{ translateX: tx }, { translateY: ty }],
          },
        ]}
      >
        {beaconStyle === 'numbered' && (
          <Text style={[styles.badgeText, { color: textColor }]}>{stepNumber}</Text>
        )}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  beacon: {
    position: 'absolute',
    left: 0, top: 0,
  },
  badgeText: {
    fontSize: 12, fontWeight: '800',
  },
})
