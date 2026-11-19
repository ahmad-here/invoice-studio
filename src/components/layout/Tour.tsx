import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { Sparkles, X } from 'lucide-react'
import { Button } from '@/components/common/ui'
import { LS } from '@/lib/storageKeys'

const KEY = LS.tourDone
const EVT = 'invoice-studio:start-tour'

interface Step { target?: string; title: string; body: string }
const STEPS: Step[] = [
  { title: 'Welcome to Invoice Studio', body: 'Create professional invoices in minutes — free, private and with no sign-up. Here’s a one-minute tour of the essentials.' },
  { target: 'nav-create', title: 'Create an invoice', body: 'Fill in customer, items, tax and payment details step by step while a live A4 preview updates beside you. Unsaved work is autosaved.' },
  { target: 'nav-templates', title: '21 professional templates', body: 'Preview every design and switch at any time — your invoice data stays exactly the same.' },
  { target: 'nav-bulk', title: 'Bulk generate', body: 'Upload a CSV or JSON file to create hundreds of invoices at once, then download them as a ZIP or one combined PDF.' },
  { target: 'nav-invoices', title: 'Saved invoices', body: 'Search, filter, duplicate, re-download or print anything you’ve saved.' },
  { target: 'nav-business', title: 'Add your business once', body: 'Save your business name, logo, tax numbers and bank details in My business — every new invoice is filled in automatically.' },
  { target: 'nav-settings', title: 'Defaults & backup', body: 'Set your currency, tax, numbering and template defaults, and back up your data.' },
  { title: 'Your data stays on this device', body: 'Nothing is uploaded. Install the app for offline use, and export a backup from Settings now and then. You can replay this tour from the Support page.' },
]

const done = () => { try { return localStorage.getItem(KEY) === '1' } catch { return false } }
const markDone = () => { try { localStorage.setItem(KEY, '1') } catch { /* storage unavailable */ } }
export const startTour = () => window.dispatchEvent(new Event(EVT))

/** First-visit walkthrough with spotlight; skippable at every step (Esc also skips). */
export function Tour() {
  const [step, setStep] = useState<number | null>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const loc = useLocation()
  const nav = useNavigate()
  const cardRef = useRef<HTMLDivElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const on = () => { if (loc.pathname !== '/') nav('/'); setStep(0) }
    window.addEventListener(EVT, on)
    return () => window.removeEventListener(EVT, on)
  }, [loc.pathname, nav])

  useEffect(() => {
    if (!done() && loc.pathname === '/' && !navigator.webdriver) { const t = setTimeout(() => setStep(0), 600); return () => clearTimeout(t) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const finish = useCallback(() => { markDone(); setStep(null); returnFocus.current?.focus?.() }, [])

  const measure = useCallback(() => {
    if (step === null) return
    const t = STEPS[step].target
    if (!t) { setRect(null); return }
    const el = [...document.querySelectorAll<HTMLElement>(`[data-tour="${t}"]`)].find((e) => e.offsetParent !== null)
    setRect(el ? el.getBoundingClientRect() : null)
  }, [step])

  useLayoutEffect(() => {
    measure()
    if (step === null) return
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => { window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true) }
  }, [measure, step])

  useEffect(() => {
    if (step === null) return
    if (!returnFocus.current) returnFocus.current = document.activeElement as HTMLElement | null
    cardRef.current?.querySelector<HTMLElement>('[data-primary]')?.focus()
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish()
      if (e.key === 'Tab' && cardRef.current) {
        const f = [...cardRef.current.querySelectorAll<HTMLElement>('button')]
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault() }
        else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault() }
        else if (!cardRef.current.contains(document.activeElement)) { first.focus(); e.preventDefault() }
      }
      if (e.key === 'ArrowRight') setStep((s) => (s !== null && s < STEPS.length - 1 ? s + 1 : s))
      if (e.key === 'ArrowLeft') setStep((s) => (s ? s - 1 : s))
    }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [step, finish])

  if (step === null) return null
  const s = STEPS[step]
  const last = step === STEPS.length - 1
  const pad = 6
  const W = Math.min(340, window.innerWidth - 32)
  let style: React.CSSProperties = { left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: W }
  if (rect) {
    const below = rect.bottom + 14 + 200 < window.innerHeight
    const left = Math.min(Math.max(16, rect.left + rect.width / 2 - W / 2), window.innerWidth - W - 16)
    style = below ? { left, top: rect.bottom + 14, width: W } : { left, bottom: window.innerHeight - rect.top + 14, width: W }
  }

  return createPortal(
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-body">
      {rect ? (
        <div className="pointer-events-none fixed rounded-xl ring-2 ring-primary transition-all duration-200" style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, boxShadow: '0 0 0 9999px rgb(32 41 56 / 0.55)' }} />
      ) : <div className="fixed inset-0 bg-ink/55" />}
      <div ref={cardRef} className="fixed rounded-2xl bg-white p-5 shadow-xl" style={style}>
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            {!s.target && <Sparkles className="size-5 text-primary" />}
            <h2 id="tour-title" className="text-base font-semibold text-ink">{s.title}</h2>
          </div>
          <button aria-label="Skip tour" onClick={finish} className="-m-1.5 flex size-9 items-center justify-center rounded-lg text-muted hover:bg-canvas hover:text-ink"><X className="size-5" /></button>
        </div>
        <p id="tour-body" className="text-sm leading-relaxed text-muted">{s.body}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1" role="img" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
            {STEPS.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-primary' : 'w-1.5 bg-line-strong'}`} />)}
          </div>
          <div className="flex gap-2">
            {step === 0 ? <Button size="sm" variant="ghost" onClick={finish}>Skip tour</Button> : <Button size="sm" variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>}
            <Button size="sm" variant="primary" data-primary onClick={() => (last ? finish() : setStep(step + 1))}>{step === 0 ? 'Start tour' : last ? 'Get started' : 'Next'}</Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
