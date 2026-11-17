/** Strip control chars and cap length. React escapes text on render, so imported HTML is never interpreted. */
export function cleanText(v: unknown, max = 5000): string {
  if (v === null || v === undefined) return ''
  // eslint-disable-next-line no-control-regex
  return String(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, max)
}

/** Safe filename: no path separators, reserved chars or leading dots. */
export function safeFilename(name: string, fallback = 'invoice'): string {
  const s = cleanText(name, 150)
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/^[.\s-]+/, '')
    .trim()
  return s || fallback
}

/** Only allow http(s)/mailto links in invoices. */
export function safeUrl(url: string): string | null {
  const t = (url ?? '').trim()
  if (!t) return null
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(t) ? t : `https://${t}`)
    return ['http:', 'https:', 'mailto:'].includes(u.protocol) ? u.href : null
  } catch {
    return null
  }
}

/** Only raster data URLs are ever stored for logos (SVG is rasterised on upload). */
export const LOGO_DATA_URL = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/

export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
