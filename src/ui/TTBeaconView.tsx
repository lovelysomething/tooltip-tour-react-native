import React, { useEffect, useRef } from 'react'
import { Text, Animated, StyleSheet, View } from 'react-native'

interface Props {
  /** Shared animated frame from TTLauncherView — beacon glides in sync with the spotlight. */
  ax: Animated.Value
  ay: Animated.Value
  aw: Animated.Value
  ah: Animated.Value
  stepNumber: number
  /** "numbered" (default) | "dot" | "ring" */
  beaconStyle?: string
  bgColor?: string
  textColor?: string
}

/**
 * Beacon shown at the bottom-centre edge of the target during a tour step.
 * Position is derived from the launcher's shared animated frame, so it glides
 * with the spotlight. The pulse uses the JS driver (useNativeDriver:false) to
 * match the position values — mixing native + JS drivers on one node throws.
 */
export function TTBeaconView({
  ax, ay, aw, ah, stepNumber,
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
        // JS driver (not native) so it can sit on the same node as the JS-driven position
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 600, useNativeDriver: false }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [])

  // Bottom-centre of the target, offset so the beacon straddles the edge.
  const tx = Animated.subtract(Animated.add(ax, Animated.divide(aw, 2)), SIZE / 2)
  const ty = Animated.subtract(Animated.add(ay, ah), SIZE / 2)

  const pulseScale   = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] })
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] })

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {/* Pulse ring */}
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
      {/* Beacon body */}
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
