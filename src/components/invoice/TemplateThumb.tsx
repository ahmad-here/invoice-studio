import { useEffect, useRef, useState } from 'react'
import type { Invoice } from '@/types/invoice'
import { ScaledPreview } from './ScaledPreview'

/** First-page thumbnail that only renders once scrolled into view (keeps galleries light). */
export function TemplateThumb({ invoice }: { invoice: Invoice }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect() } }, { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className="aspect-[210/297] w-full overflow-hidden bg-white pointer-events-none select-none" aria-hidden>
      {visible && <ScaledPreview invoice={invoice} prefs={{ dateFormat: 'D MMM YYYY', locale: 'en-US' }} onlyFirstPage pageGap={0} />}
    </div>
  )
}
