import { Capacitor } from '@capacitor/core'
import { safeFilename } from '@/lib/sanitize'

export const isNative = () => Capacitor.isNativePlatform()

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '')
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}

/**
 * Save a file. Web: triggers a browser download. Android: writes to app cache (no storage permission)
 * and opens the system share sheet. Resolves false if the user dismissed the sheet.
 */
export async function saveFile(blob: Blob, filename: string): Promise<boolean> {
  const name = safeFilename(filename, 'download')
  if (isNative()) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')])
    const res = await Filesystem.writeFile({ path: name, data: await blobToBase64(blob), directory: Directory.Cache })
    try {
      await Share.share({ title: name, url: res.uri, dialogTitle: 'Save or share' })
      return true
    } catch (e) {
      if (/cancel/i.test((e as Error).message ?? '')) return false
      throw e
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
  return true
}

export const saveText = (text: string, filename: string, type: string): Promise<boolean> => saveFile(new Blob([text], { type }), filename)

export function readFileText(file: File): Promise<string> {
  return file.text()
}

/** Expand a filename pattern: {number} {customer} {date} {status}. */
export function applyPattern(pattern: string, v: { number: string; customer: string; date: string; status: string }) {
  const out = (pattern || 'Invoice-{number}')
    .replace(/\{number\}/g, v.number)
    .replace(/\{customer\}/g, v.customer)
    .replace(/\{date\}/g, v.date)
    .replace(/\{status\}/g, v.status)
  return safeFilename(out, `Invoice-${v.number}`)
}
