import type { Logo } from '@/types/invoice'

export const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
export const LOGO_MAX_BYTES = 2 * 1024 * 1024
const MAX_SIDE = 640

/**
 * Validate and normalise a logo upload. Every format (including SVG) is rasterised to PNG via a
 * canvas: SVG loaded through <img> cannot run scripts, and the stored result contains no SVG at all.
 */
export async function processLogo(file: File, prev?: Logo): Promise<Logo> {
  const okType = LOGO_TYPES.includes(file.type) || /\.(png|jpe?g|svg|webp)$/i.test(file.name)
  if (!okType) throw new Error('Please upload a PNG, JPG, SVG or WebP image.')
  if (file.size > LOGO_MAX_BYTES) throw new Error('Logo must be 2 MB or smaller.')
  const isSvg = file.type === 'image/svg+xml' || /\.svg$/i.test(file.name)
  const blob = isSvg ? new Blob([await file.text()], { type: 'image/svg+xml' }) : file
  const url = URL.createObjectURL(blob)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('This image could not be read. Try another file.'))
      i.src = url
    })
    let w = img.naturalWidth || 400
    let h = img.naturalHeight || 200
    if (!w || !h) throw new Error('Image has no size.')
    const scale = Math.min(1, MAX_SIDE / Math.max(w, h))
    // SVGs without intrinsic size: upscale for crispness
    const s = isSvg ? MAX_SIDE / Math.max(w, h) : scale
    w = Math.max(1, Math.round(w * s))
    h = Math.max(1, Math.round(h * s))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported.')
    ctx.drawImage(img, 0, 0, w, h)
    const dataUrl = canvas.toDataURL('image/png')
    return { dataUrl, width: w, height: h, size: prev?.size ?? 140, position: prev?.position ?? 'left' }
  } finally {
    URL.revokeObjectURL(url)
  }
}
