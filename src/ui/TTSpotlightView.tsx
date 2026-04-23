import React from 'react'
import { View, StyleSheet, useWindowDimensions } from 'react-native'
import Svg, { Defs, Mask, Rect, Rect as SvgRect } from 'react-native-svg'

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
 * Falls back to a plain dark overlay if the frame is null (between steps).
 */
export function TTSpotlightView({ frame, cornerRadius = 10, padding = 8 }: Props) {
  const { width, height } = useWindowDimensions()

  if (!frame) {
    return <View style={[StyleSheet.absoluteFill, styles.dimFull]} pointerEvents="none" />
  }

  const cx = frame.x - padding
  const cy = frame.y - padding
  const cw = frame.width  + padding * 2
  const ch = frame.height + padding * 2

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <Mask id="cutout">
            {/* White = visible, Black = transparent in mask */}
            <Rect width={width} height={height} fill="white" />
            <SvgRect
              x={cx} y={cy} width={cw} height={ch}
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
