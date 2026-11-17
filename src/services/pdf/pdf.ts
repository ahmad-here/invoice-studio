import type { jsPDF as JsPDF } from 'jspdf'
import type { Invoice, PaperSize, UserPreferences } from '@/types/invoice'
import { PAGE_PX } from '@/templates/types'
import { renderOffscreen } from './render'

type Prefs = Pick<UserPreferences, 'dateFormat' | 'locale'>

const fontCss = new Map<string, Promise<string>>()
let libs: Promise<[typeof import('jspdf'), typeof import('html-to-image')]> | null = null
const loadLibs = () => (libs ??= Promise.all([import('jspdf'), import('html-to-image')]))

const FORMAT: Record<PaperSize, string> = { A4: 'a4', Letter: 'letter', Legal: 'legal' }

/** Rasterise page elements at 2× into JPEG pages. Fonts are embedded once and reused (fast for bulk). */
async function addPages(doc: JsPDF | null, pages: HTMLElement[], paper: PaperSize, fontKey: string): Promise<JsPDF> {
  const [{ jsPDF }, h2i] = await loadLibs()
  if (!fontCss.has(fontKey)) fontCss.set(fontKey, h2i.getFontEmbedCSS(pages[0]).catch(() => ''))
  const fontEmbedCSS = await fontCss.get(fontKey)!
  const { mm, w, h } = PAGE_PX[paper]
  let pdf = doc
  for (const el of pages) {
    const canvas = await h2i.toCanvas(el, { pixelRatio: 2, backgroundColor: '#ffffff', fontEmbedCSS, width: w, height: h, cacheBust: false })
    const data = canvas.toDataURL('image/jpeg', 0.88)
    if (!pdf) pdf = new jsPDF({ unit: 'mm', format: FORMAT[paper], compress: true })
    else pdf.addPage(FORMAT[paper], 'portrait')
    pdf.addImage(data, 'JPEG', 0, 0, mm[0], mm[1], undefined, 'FAST')
    canvas.width = canvas.height = 0 // release memory early
  }
  return pdf!
}

function setMeta(pdf: JsPDF, inv: Invoice) {
  pdf.setProperties({ title: `Invoice ${inv.number}`, subject: `Invoice ${inv.number}`, author: inv.business.name || 'Invoice Studio', creator: 'Invoice Studio' })
}

export async function invoiceToPdfBlob(inv: Invoice, prefs: Prefs): Promise<Blob> {
  const { pages, cleanup } = await renderOffscreen(inv, prefs)
  try {
    const pdf = await addPages(null, pages, inv.paperSize, inv.template)
    setMeta(pdf, inv)
    return pdf.output('blob')
  } finally {
    cleanup()
  }
}

/** One PDF with every invoice; each invoice keeps its own paper size. */
export async function combinedPdfBlob(list: Invoice[], prefs: Prefs, onProgress?: (done: number) => void, signal?: AbortSignal): Promise<Blob> {
  let pdf: JsPDF | null = null
  for (let i = 0; i < list.length; i++) {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError')
    const { pages, cleanup } = await renderOffscreen(list[i], prefs)
    try {
      pdf = await addPages(pdf, pages, list[i].paperSize, list[i].template)
    } finally {
      cleanup()
    }
    onProgress?.(i + 1)
    await yieldToBrowser()
  }
  if (!pdf) throw new Error('Nothing to export')
  pdf.setProperties({ title: 'Invoices', creator: 'Invoice Studio' })
  return pdf.output('blob')
}

export const yieldToBrowser = () => new Promise<void>((r) => setTimeout(r, 0))
