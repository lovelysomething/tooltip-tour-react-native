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
 */
export function TTBeaconView({
  x, y, width, height, stepNumber,
  beaconStyle = 'numbered',
  bgColor = '#1925AA',
  textColor = '#fff',
}: Props) {
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

  // Glide to new positions instead of jumping — matches the spotlight's 300ms ease
  const posX = useRef(new Animated.Value(x + width / 2)).current
  const posY = useRef(new Animated.Value(y + height)).current
  const firstRender = useRef(true)

  useEffect(() => {
    const cx = x + width / 2
    const cy = y + height
    if (firstRender.current) {
      firstRender.current = false
      posX.setValue(cx)
      posY.setValue(cy)
      return
    }
    Animated.parallel([
      Animated.timing(posX, { toValue: cx, duration: 300, useNativeDriver: false }),
      Animated.timing(posY, { toValue: cy, duration: 300, useNativeDriver: false }),
    ]).start()
  }, [x, y, width, height])

  const pulseScale   = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] })
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] })

  // Size per style — mirrors the web embed: dot 12px, ring 20px, numbered 28px
  const SIZE = beaconStyle === 'dot' ? 12 : beaconStyle === 'ring' ? 20 : 28

  const badgeLeft = Animated.subtract(posX, SIZE / 2)
  const badgeTop  = Animated.subtract(posY, SIZE / 2)

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {/* Pulse ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            left: badgeLeft,
            top:  badgeTop,
            width: SIZE, height: SIZE,
            borderRadius: SIZE / 2,
            borderColor: bgColor,
            transform: [{ scale: pulseScale }],
            opacity: pulseOpacity,
          },
        ]}
      />
      {/* Beacon body */}
      <Animated.View
        style={[
          styles.badge,
          {
            left: badgeLeft,
            top:  badgeTop,
            width: SIZE, height: SIZE, borderRadius: SIZE / 2,
            backgroundColor: beaconStyle === 'ring' ? 'transparent' : bgColor,
            borderWidth: beaconStyle === 'ring' ? 2 : 0,
            borderColor: bgColor,
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
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  badge: {
    position: 'absolute',
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12, fontWeight: '800',
  },
})
