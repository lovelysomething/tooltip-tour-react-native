/** Parse a CSS color string (hex or rgb/rgba) to a React Native color string. Returns null on failure. */
export function parseColor(hex: string | null | undefined): string | null {
  if (!hex?.trim()) return null
  const s = hex.trim()
  // rgb()/rgba() are valid RN color strings — pass through (mirrors iOS UIColor(hex:) handling)
  if (/^rgba?\(/i.test(s)) return s
  const normalized = s.startsWith('#') ? s : `#${s}`
  // Basic validation: #RGB, #RRGGBB, #RRGGBBAA
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(normalized)) {
    return normalized
  }
  return null
}
