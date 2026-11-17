import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import type { Invoice, UserPreferences } from '@/types/invoice'
import { InvoiceDocument } from '@/components/invoice/InvoiceDocument'
import { loadTemplate } from '@/templates/registry'

/**
 * Render an invoice off-screen at true size and resolve with its page elements once layout,
 * images and fonts are settled. Call cleanup() when done to free DOM and memory.
 */
export async function renderOffscreen(invoice: Invoice, prefs: Pick<UserPreferences, 'dateFormat' | 'locale'>): Promise<{ pages: HTMLElement[]; cleanup: () => void }> {
  await loadTemplate(invoice.template)
  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText = 'position:fixed;left:-20000px;top:0;pointer-events:none;z-index:-1;'
  document.body.appendChild(host)
  const root = createRoot(host)
  const cleanup = () => { root.unmount(); host.remove() }
  try {
    const pages = await new Promise<HTMLElement[]>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Rendering timed out')), 20000)
      flushSync(() => {
        root.render(<InvoiceDocument invoice={invoice} prefs={prefs} pageGap={0} onReady={(p) => { clearTimeout(timer); resolve(p) }} />)
      })
    })
    // allow one more frame for the final paginated layout to commit
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    return { pages, cleanup }
  } catch (e) {
    cleanup()
    throw e
  }
}
