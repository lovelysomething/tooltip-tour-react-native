import React from 'react'
import { View, StyleSheet, Animated, useWindowDimensions } from 'react-native'
import Svg, { Defs, Mask, Rect } from 'react-native-svg'

const AnimatedRect = Animated.createAnimatedComponent(Rect)

interface Props {
  /** Shared animated cutout geometry, owned + animated by TTLauncherView so the
      spotlight, beacon and step card all glide off the SAME values, in sync. */
  ax: Animated.Value
  ay: Animated.Value
  aw: Animated.Value
  ah: Animated.Value
  visible: boolean
  cornerRadius?: number
}

/**
 * Full-screen dim overlay with a transparent cutout over the target element.
 * The cutout rect is an AnimatedRect fed by the launcher's shared animated
 * frame, so it updates the native SVG node directly with no React re-render.
 */
export function TTSpotlightView({ ax, ay, aw, ah, visible, cornerRadius = 10 }: Props) {
  const { width, height } = useWindowDimensions()

  if (!visible) {
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
