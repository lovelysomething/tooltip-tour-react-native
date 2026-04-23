/** Parse a CSS hex color string to a React Native color string. Returns null on failure. */
export function parseColor(hex: string | null | undefined): string | null {
  if (!hex?.trim()) return null
  const s = hex.trim()
  const normalized = s.startsWith('#') ? s : `#${s}`
  // Basic validation: #RGB, #RRGGBB, #RRGGBBAA
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(normalized)) {
    return normalized
  }
  return null
}
