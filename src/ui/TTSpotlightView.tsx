import React, { useEffect, useRef, useState } from 'react'
import { View, StyleSheet, Animated, Easing, useWindowDimensions } from 'react-native'
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
 * Frame changes animate smoothly (300ms ease) — mirrors the web embed's
 * `transition: all .3s` spotlight and the iOS withAnimation glide.
 * Falls back to a plain dark overlay if the frame is null (between steps).
 */
export function TTSpotlightView({ frame, cornerRadius = 10, padding = 8 }: Props) {
  const { width, height } = useWindowDimensions()

  // Animated interpolation between the previous and incoming frame.
  // SVG mask children can't take Animated props reliably on Android, so we
  // drive a JS timing value and re-render with the interpolated frame.
  const [drawn, setDrawn] = useState<Frame | null>(frame)
  const fromRef = useRef<Frame | null>(frame)
  const anim    = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const from = fromRef.current
    if (!frame) { fromRef.current = null; setDrawn(null); return }
    if (!from) {
      // First appearance — no glide, just show it
      fromRef.current = frame
      setDrawn(frame)
      return
    }
    if (from.x === frame.x && from.y === frame.y &&
        from.width === frame.width && from.height === frame.height) return

    anim.setValue(0)
    const id = anim.addListener(({ value: t }) => {
      setDrawn({
        x:      from.x      + (frame.x      - from.x)      * t,
        y:      from.y      + (frame.y      - from.y)      * t,
        width:  from.width  + (frame.width  - from.width)  * t,
        height: from.height + (frame.height - from.height) * t,
      })
    })
    Animated.timing(anim, {
      toValue: 1, duration: 300,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      anim.removeListener(id)
      fromRef.current = frame
      setDrawn(frame)
    })
    return () => anim.removeListener(id)
  }, [frame?.x, frame?.y, frame?.width, frame?.height])

  if (!drawn) {
    return <View style={[StyleSheet.absoluteFill, styles.dimFull]} pointerEvents="none" />
  }

  const cx = drawn.x - padding
  const cy = drawn.y - padding
  const cw = drawn.width  + padding * 2
  const ch = drawn.height + padding * 2

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
