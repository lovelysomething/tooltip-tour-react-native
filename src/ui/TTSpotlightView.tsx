import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated, Easing, useWindowDimensions } from 'react-native'
import Svg, { Defs, Mask, Rect } from 'react-native-svg'

const AnimatedRect = Animated.createAnimatedComponent(Rect)

interface Frame { x: number; y: number; width: number; height: number }

interface Props {
  frame: Frame | null
  cornerRadius?: number
  padding?: number
}

/**
 * Full-screen dim overlay with a transparent cutout over the target element.
 * Uses react-native-svg for the mask — no native modules needed.
 *
 * The cutout rect's x/y/width/height are Animated.Values fed straight to an
 * AnimatedRect, so frame changes glide (300ms ease) by updating the native
 * SVG node directly — NO setState / React re-render per frame, which is what
 * made the earlier listener-driven version stutter on Android.
 * Mirrors the web embed's `transition: all .3s` and iOS's withAnimation glide.
 */
export function TTSpotlightView({ frame, cornerRadius = 10, padding = 8 }: Props) {
  const { width, height } = useWindowDimensions()

  const ax = useRef(new Animated.Value(frame ? frame.x - padding : 0)).current
  const ay = useRef(new Animated.Value(frame ? frame.y - padding : 0)).current
  const aw = useRef(new Animated.Value(frame ? frame.width  + padding * 2 : 0)).current
  const ah = useRef(new Animated.Value(frame ? frame.height + padding * 2 : 0)).current
  const firstFrame = useRef(true)

  useEffect(() => {
    if (!frame) return
    const tx = frame.x - padding
    const ty = frame.y - padding
    const tw = frame.width  + padding * 2
    const th = frame.height + padding * 2

    if (firstFrame.current) {
      firstFrame.current = false
      ax.setValue(tx); ay.setValue(ty); aw.setValue(tw); ah.setValue(th)
      return
    }
    // JS-driven (SVG props can't use the native driver) but no setState — the
    // AnimatedRect updates its native node directly, so this stays smooth.
    Animated.parallel([
      Animated.timing(ax, { toValue: tx, duration: 300, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
      Animated.timing(ay, { toValue: ty, duration: 300, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
      Animated.timing(aw, { toValue: tw, duration: 300, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
      Animated.timing(ah, { toValue: th, duration: 300, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
    ]).start()
  }, [frame?.x, frame?.y, frame?.width, frame?.height])

  if (!frame) {
    return <View style={[StyleSheet.absoluteFill, styles.dimFull]} pointerEvents="none" />
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <Mask id="cutout">
            {/* White = visible, Black = transparent in mask */}
            <Rect width={width} height={height} fill="white" />
            <AnimatedRect
              x={ax} y={ay} width={aw} height={ah}
              rx={cornerRadius} ry={cornerRadius}
              fill="black"
            />
          </Mask>
        </Defs>
        <Rect
          width={width} height={height}
          fill="rgba(0,0,0,0.6)"
          mask="url(#cutout)"
        />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  dimFull: { backgroundColor: 'rgba(0,0,0,0.5)' },
})
