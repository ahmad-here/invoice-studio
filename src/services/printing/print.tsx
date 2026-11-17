import { createRoot } from 'react-dom/client'
import type { Invoice, UserPreferences } from '@/types/invoice'
import { InvoiceDocument } from '@/components/invoice/InvoiceDocument'
import { loadTemplate } from '@/templates/registry'
import { PAGE_PX } from '@/templates/types'
import { invoiceToPdfBlob } from '@/services/pdf/pdf'
import { isNative, saveFile } from '@/services/files'

/**
 * Print only the invoice: renders the exact paginated pages into #print-root and opens the
 * native print dialog. Print CSS hides the app (see styles/index.css) and sets @page size.
 * Android WebView has no window.print(), so on native we hand the PDF to the share sheet.
 */
let activeCleanup: (() => void) | null = null

export async function printInvoice(inv: Invoice, prefs: Pick<UserPreferences, 'dateFormat' | 'locale'>): Promise<void> {
  if (isNative()) {
    const blob = await invoiceToPdfBlob(inv, prefs)
    await saveFile(blob, `Invoice-${inv.number}.pdf`)
    return
  }
  await loadTemplate(inv.template)
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
    const t = setTimeout(resolve, 8000)
    root.render(<InvoiceDocument invoice={inv} prefs={prefs} pageGap={0} onReady={() => { clearTimeout(t); resolve() }} />)
  })
  await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 50)))
  if (activeCleanup !== cleanup) return // a newer print request replaced this one
  window.addEventListener('afterprint', cleanup)
  window.print()
  // Safari/Firefox may not fire afterprint reliably
  setTimeout(() => { if (!matchMedia('print').matches) cleanup() }, 60_000)
}
