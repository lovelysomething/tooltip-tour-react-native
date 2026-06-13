import React from 'react'
import Svg, { Path, Circle, Rect, Polygon, Polyline, Line } from 'react-native-svg'

/**
 * 24 stroke icons — identical to iOS TTIcons.swift, Android TTIcons.kt and the web SVGs.
 * Feather-style 24×24 grid, 2px round stroke.
 */
const ICONS: Record<string, React.ReactNode> = {
  question: <>
    <Circle cx={12} cy={12} r={10} />
    <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <Line x1={12} y1={17} x2={12.01} y2={17} />
  </>,
  compass: <>
    <Circle cx={12} cy={12} r={10} />
    <Polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </>,
  map: <>
    <Polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6" />
    <Line x1={9} y1={3} x2={9} y2={18} />
    <Line x1={15} y1={6} x2={15} y2={21} />
  </>,
  lightbulb: <>
    <Line x1={9} y1={18} x2={15} y2={18} />
    <Line x1={10} y1={22} x2={14} y2={22} />
    <Path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
  </>,
  sparkle: <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />,
  search: <>
    <Circle cx={11} cy={11} r={8} />
    <Line x1={21} y1={21} x2={16.65} y2={16.65} />
  </>,
  book: <>
    <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </>,
  rocket: <>
    <Path d="M22 2L11 13" />
    <Path d="M22 2L15 22l-4-9-9-4 20-7z" />
  </>,
  chat: <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  info: <>
    <Circle cx={12} cy={12} r={10} />
    <Line x1={12} y1={16} x2={12} y2={12} />
    <Line x1={12} y1={8} x2={12.01} y2={8} />
  </>,
  play: <>
    <Circle cx={12} cy={12} r={10} />
    <Polygon points="10 8 16 12 10 16 10 8" />
  </>,
  guide: <>
    <Circle cx={12} cy={12} r={10} />
    <Polyline points="12 8 16 12 12 16" />
    <Line x1={8} y1={12} x2={16} y2={12} />
  </>,
  flag: <Path d="M4 22V3h15v10H4" />,
  bell: <>
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </>,
  gift: <>
    <Rect x={2} y={7} width={20} height={2} />
    <Rect x={3} y={9} width={18} height={13} />
    <Line x1={12} y1={7} x2={12} y2={22} />
    <Path d="M12 7C10 7 8 5.5 8 3c0-1.5 3 1 4 4z" />
    <Path d="M12 7c2 0 4-1.5 4-4 0-1.5-3 1-4 4z" />
  </>,
  check: <>
    <Circle cx={12} cy={12} r={10} />
    <Polyline points="8 12 11 15 16 9.5" />
  </>,
  heart: <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
  lock: <>
    <Rect x={3} y={11} width={18} height={11} rx={2} />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </>,
  settings: <>
    <Line x1={4} y1={21} x2={4} y2={14} />
    <Line x1={4} y1={10} x2={4} y2={3} />
    <Line x1={12} y1={21} x2={12} y2={12} />
    <Line x1={12} y1={8} x2={12} y2={3} />
    <Line x1={20} y1={21} x2={20} y2={16} />
    <Line x1={20} y1={12} x2={20} y2={3} />
    <Circle cx={4} cy={12} r={2} />
    <Circle cx={12} cy={10} r={2} />
    <Circle cx={20} cy={14} r={2} />
  </>,
  trophy: <>
    <Path d="M6 3h12v7a6 6 0 0 1-12 0V3z" />
    <Path d="M6 5C2 5 2 9 3 9h3" />
    <Path d="M18 5c4 0 4 4 3 4h-3" />
    <Line x1={12} y1={17} x2={12} y2={21} />
    <Line x1={8} y1={21} x2={16} y2={21} />
  </>,
  zap: <Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  eye: <>
    <Path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
    <Circle cx={12} cy={12} r={3} />
  </>,
  cursor: <Path d="M5 3l14 9-8 2-2 8z" />,
  chart: <>
    <Line x1={18} y1={20} x2={18} y2={10} />
    <Line x1={12} y1={20} x2={12} y2={4} />
    <Line x1={6} y1={20} x2={6} y2={14} />
    <Line x1={2} y1={20} x2={22} y2={20} />
  </>,
}

interface Props {
  icon?: string | null
  color: string
  size: number
}

/** Renders the named icon, falling back to the question mark — mirrors TTIcon.from() on iOS/Android. */
export function TTIconView({ icon, color, size }: Props) {
  const glyph = ICONS[icon ?? ''] ?? ICONS.question
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {glyph}
    </Svg>
  )
}
