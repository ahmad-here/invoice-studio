import { createRoot } from 'react-dom/client'
import type { Invoice, UserPreferences } from '@/types/invoice'
import { InvoiceDocument } from '@/components/invoice/InvoiceDocument'
import { loadTemplate } from '@/templates/registry'
import { PAGE_PX } from '@/templates/types'
import { combinedPdfBlob, invoiceToPdfBlob } from '@/services/pdf/pdf'
import { isNative, saveFile } from '@/services/files'

/**
 * Print only the invoice: renders the exact paginated pages into #print-root and opens the
 * native print dialog. Print CSS hides the app (see styles/index.css) and sets @page size.
 * Android WebView has no window.print(), so on native we hand the PDF to the share sheet.
 */
let activeCleanup: (() => void) | null = null

export function printInvoice(inv: Invoice, prefs: Pick<UserPreferences, 'dateFormat' | 'locale'>): Promise<void> {
  return printInvoices([inv], prefs)
}

/** Print several invoices in one print job (one after another). Page size follows the first invoice. */
export async function printInvoices(list: Invoice[], prefs: Pick<UserPreferences, 'dateFormat' | 'locale'>): Promise<void> {
  if (!list.length) return
  const inv = list[0]
  if (isNative()) {
    const blob = list.length === 1 ? await invoiceToPdfBlob(inv, prefs) : await combinedPdfBlob(list, prefs)
    await saveFile(blob, list.length === 1 ? `Invoice-${inv.number}.pdf` : `Invoices-${list.length}.pdf`)
    return
  }
  await Promise.all([...new Set(list.map((i) => i.template))].map(loadTemplate))
  activeCleanup?.()
  const host = document.createElement('div')
  host.id = 'print-root'
  document.body.appendChild(host)
  const { mm } = PAGE_PX[inv.paperSize]
  const style = document.createElement('style')
  style.id = 'print-page-style'
  style.textContent = `@page { size: ${mm[0]}mm ${mm[1]}mm; margin: 0; }`
  document.head.appendChild(style)
  const root = createRoot(host)
  const cleanup = () => {
    if (activeCleanup !== cleanup) return
    activeCleanup = null
    root.unmount()
    host.remove()
    style.remove()
    window.removeEventListener('afterprint', cleanup)
  }
  activeCleanup = cleanup
  await new Promise<void>((resolve) => {
    let left = list.length
    const t = setTimeout(resolve, 8000 + list.length * 500)
    const ready = () => { if (--left === 0) { clearTimeout(t); resolve() } }
    root.render(<>{list.map((i) => <InvoiceDocument key={i.id} invoice={i} prefs={prefs} pageGap={0} onReady={ready} />)}</>)
  })
  await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 50)))
  if (activeCleanup !== cleanup) return // a newer print request replaced this one
  window.addEventListener('afterprint', cleanup)
  window.print()
  // Safari/Firefox may not fire afterprint reliably
  setTimeout(() => { if (!matchMedia('print').matches) cleanup() }, 60_000)
}
