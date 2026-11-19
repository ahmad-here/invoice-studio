import { useEffect, useRef, useState } from 'react'
import type { Invoice, UserPreferences } from '@/types/invoice'
import { PAGE_PX } from '@/templates/types'
import { InvoiceDocument } from './InvoiceDocument'

/** Invoice pages scaled to fit the container width (never upscaled beyond `maxScale`). */
export function ScaledPreview({ invoice, prefs, maxScale = 1, pageGap = 24, onlyFirstPage = false, className, zoom = 1 }: { invoice: Invoice; prefs: Pick<UserPreferences, 'dateFormat' | 'locale'>; maxScale?: number; pageGap?: number; onlyFirstPage?: boolean; className?: string; zoom?: number }) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  const [height, setHeight] = useState(0)
  const pageW = (PAGE_PX[invoice.paperSize] ?? PAGE_PX.A4).w
  const pageH = (PAGE_PX[invoice.paperSize] ?? PAGE_PX.A4).h

  useEffect(() => {
    const o = outer.current, i = inner.current
    if (!o || !i) return
    const ro = new ResizeObserver(() => {
      setScale(Math.min(maxScale, o.clientWidth / pageW))
      setHeight(i.offsetHeight)
    })
    ro.observe(o)
    ro.observe(i)
    return () => ro.disconnect()
  }, [pageW, maxScale])

  const h = onlyFirstPage ? pageH : height
  const s = scale * zoom
  return (
    <div ref={outer} className={className} style={{ overflow: onlyFirstPage ? 'hidden' : zoom > 1 ? 'auto' : undefined }}>
      <div style={{ height: s ? h * s : undefined, width: zoom > 1 ? pageW * s : undefined }}>
      <div ref={inner} className="preview-page" style={{ width: pageW, transform: `scale(${s || 0.0001})`, transformOrigin: 'top left', visibility: scale ? 'visible' : 'hidden' }}>
        <InvoiceDocument invoice={invoice} prefs={prefs} pageGap={pageGap} />
      </div>
      </div>
    </div>
  )
}
