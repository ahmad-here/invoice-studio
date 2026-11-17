import { memo, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { Invoice, UserPreferences } from '@/types/invoice'
import { calculateTotals } from '@/lib/calc'
import { formatMoney } from '@/lib/money'
import { formatDate } from '@/lib/dates'
import { useTemplate } from '@/templates/registry'
import { PAGE_PX, type RenderCtx, type TemplateDef, type Column } from '@/templates/types'

export interface PagePlan { rows: [number, number]; summary: number[]; first: boolean }

export function buildCtx(inv: Invoice, prefs: Pick<UserPreferences, 'dateFormat' | 'locale'>, tpl: TemplateDef): RenderCtx {
  const totals = calculateTotals(inv)
  return {
    inv,
    totals,
    prefs,
    money: (m) => formatMoney(m, inv.currency),
    date: (iso) => formatDate(iso, prefs.dateFormat, prefs.locale),
    accent: inv.accentColor || tpl.accent,
    has: {
      sku: inv.items.some((i) => i.sku),
      unit: inv.items.some((i) => i.unit),
      discount: totals.itemDiscounts > 0,
      tax: inv.items.some((i) => i.taxRate > 0),
      description: inv.items.some((i) => i.description),
    },
  }
}

/**
 * Greedy pagination from measured block heights.
 * Page 1 starts with the full header; later pages with the continuation header.
 * Table head repeats on every page that contains rows. Summary blocks never split.
 */
export function paginate(m: { avail: number; header: number; cont: number; thead: number; rows: number[]; summary: number[] }, gap: number): PagePlan[] {
  const pages: PagePlan[] = []
  let cur: PagePlan = { rows: [0, 0], summary: [], first: true }
  let used = m.header
  let hasRows = false
  const newPage = () => {
    pages.push(cur)
    cur = { rows: [cur.rows[1], cur.rows[1]], summary: [], first: false }
    used = m.cont
    hasRows = false
  }
  m.rows.forEach((h, i) => {
    const need = h + (hasRows ? 0 : m.thead)
    const empty = used <= (cur.first ? m.header : m.cont) && !hasRows
    if (used + need > m.avail && !empty) newPage()
    cur.rows = [cur.rows[0], i + 1]
    used += need
    hasRows = true
  })
  m.summary.forEach((h, i) => {
    const need = h + gap
    const empty = !hasRows && cur.summary.length === 0 && used <= (cur.first ? m.header : m.cont)
    if (used + need > m.avail && !empty) newPage()
    cur.summary.push(i)
    used += need
  })
  pages.push(cur)
  return pages
}

interface Props {
  invoice: Invoice
  prefs: Pick<UserPreferences, 'dateFormat' | 'locale'>
  /** gap between pages in px (preview only) */
  pageGap?: number
  className?: string
  /** Fires after layout is final with the page elements (for PDF capture). */
  onReady?: (pages: HTMLElement[]) => void
  pageClassName?: string
}

function ItemsTable({ tpl, ctx, cols, from, to, withHead = true }: { tpl: TemplateDef; ctx: RenderCtx; cols: Column[]; from: number; to: number; withHead?: boolean }) {
  const t = tpl.table
  const align = (a?: string) => (a === 'right' ? 'right' : a === 'center' ? 'center' : 'left') as CSSProperties['textAlign']
  return (
    <table className={t.className} style={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}>
      <colgroup>{cols.map((c) => <col key={c.key} style={{ width: c.width }} />)}</colgroup>
      {withHead && (
        <thead className={t.theadClass}>
          <tr>{cols.map((c) => <th key={c.key} className={t.thClass} style={{ textAlign: align(c.align) }}>{c.label}</th>)}</tr>
        </thead>
      )}
      <tbody>
        {ctx.inv.items.slice(from, to).map((it, k) => {
          const i = from + k
          return (
            <tr key={it.id} className={t.rowClass?.(i)} data-row>
              {cols.map((c) => (
                <td key={c.key} className={t.tdClass} style={{ textAlign: align(c.align), fontVariantNumeric: c.align === 'right' ? 'tabular-nums' : undefined }}>
                  {c.render(it, ctx.totals.lines[i], i)}
                </td>
              ))}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function Page({ tpl, ctx, size, page, pageCount, children, className }: { tpl: TemplateDef; ctx: RenderCtx; size: { w: number; h: number }; page: number; pageCount: number; children: ReactNode; className?: string }) {
  const Bg = tpl.Background
  return (
    <div
      className={`invoice-page relative overflow-hidden bg-white ${tpl.rootClass} ${className ?? ''}`}
      style={{ width: size.w, height: size.h, ['--accent' as string]: ctx.accent }}
      data-page={page}
    >
      {Bg && <Bg ctx={ctx} page={page} pageCount={pageCount} />}
      <div style={{ position: 'absolute', left: tpl.pad.x, right: tpl.pad.x, top: tpl.pad.top }}>{children}</div>
      <div style={{ position: 'absolute', left: tpl.pad.x, right: tpl.pad.x, bottom: Math.min(28, tpl.pad.bottom / 2.2) }}>
        <tpl.Footer ctx={ctx} page={page} pageCount={pageCount} />
      </div>
    </div>
  )
}

function DocumentInner({ invoice, prefs, pageGap = 24, className, onReady, pageClassName }: Props) {
  const tpl = useTemplate(invoice.template)
  const ctx = useMemo(() => (tpl ? buildCtx(invoice, prefs, tpl) : null), [invoice, prefs, tpl])
  const size = PAGE_PX[invoice.paperSize] ?? PAGE_PX.A4
  const measureRef = useRef<HTMLDivElement>(null)
  const pagesRef = useRef<HTMLDivElement>(null)
  const [plan, setPlan] = useState<{ key: string; pages: PagePlan[] } | null>(null)
  const cols = useMemo(() => (tpl && ctx ? tpl.columns(ctx) : []), [tpl, ctx])
  const summary = useMemo(() => (tpl && ctx ? tpl.summary(ctx) : []), [tpl, ctx])
  const key = useMemo(() => `${invoice.template}|${invoice.paperSize}|${invoice.updatedAt}|${invoice.items.length}|${summary.length}`, [invoice, summary.length])

  // Measure → paginate. Re-runs when content changes and when images (logo) finish loading.
  useLayoutEffect(() => {
    const root = measureRef.current
    if (!root || !tpl || !ctx) return
    const measure = () => {
      if (root.getBoundingClientRect().width === 0) return // hidden (e.g. print media / display:none)
      const q = (s: string) => root.querySelector<HTMLElement>(s)
      const h = (el: HTMLElement | null) => (el ? el.getBoundingClientRect().height : 0)
      const pages = paginate({
        avail: size.h - tpl.pad.top - tpl.pad.bottom,
        header: h(q('[data-m="header"]')),
        cont: h(q('[data-m="cont"]')),
        thead: h(q('[data-m="table"] thead')),
        rows: [...root.querySelectorAll<HTMLElement>('[data-m="table"] tr[data-row]')].map(h),
        summary: [...root.querySelectorAll<HTMLElement>('[data-m="summary"] > div')].map((e) => h(e)),
      }, tpl.gap)
      setPlan((prev) => (prev && prev.key === key && JSON.stringify(prev.pages) === JSON.stringify(pages) ? prev : { key, pages }))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    const imgs = [...root.querySelectorAll('img')].filter((i) => !i.complete)
    imgs.forEach((i) => i.addEventListener('load', measure, { once: true }))
    return () => { ro.disconnect(); imgs.forEach((i) => i.removeEventListener('load', measure)) }
  }, [tpl, ctx, key, size.h])

  const ready = !!(plan && plan.key === key && tpl && ctx)
  useLayoutEffect(() => {
    if (!ready || !onReady || !pagesRef.current) return
    const els = [...pagesRef.current.querySelectorAll<HTMLElement>('.invoice-page')]
    const imgs = [...pagesRef.current.querySelectorAll('img')]
    Promise.all(imgs.map((i) => (i.complete ? Promise.resolve() : new Promise((r) => { i.onload = i.onerror = r }))))
      .then(() => document.fonts?.ready)
      .then(() => onReady(els))
  }, [ready, onReady, plan])

  if (!tpl || !ctx) return <div className="flex items-center justify-center text-sm text-[#6B7280]" style={{ height: size.h / 3 }}>Loading template…</div>

  const contentW = size.w - tpl.pad.x * 2
  const pages = plan?.pages ?? [{ rows: [0, invoice.items.length] as [number, number], summary: summary.map((_, i) => i), first: true }]
  const H = tpl.Header
  const C = tpl.ContHeader

  return (
    <div className={className} style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Hidden measurement layer at true content width */}
      <div aria-hidden ref={measureRef} className={tpl.rootClass} style={{ position: 'absolute', left: -100000, top: 0, width: contentW, visibility: 'hidden', pointerEvents: 'none', ['--accent' as string]: ctx.accent }}>
        <div data-m="header"><H ctx={ctx} /></div>
        <div data-m="cont"><C ctx={ctx} page={2} /></div>
        <div data-m="table"><ItemsTable tpl={tpl} ctx={ctx} cols={cols} from={0} to={invoice.items.length} /></div>
        <div data-m="summary">{summary.map((b, i) => <div key={i}>{b}</div>)}</div>
      </div>
      <div ref={pagesRef} className="invoice-pages flex flex-col items-center" style={{ gap: pageGap }}>
        {pages.map((p, pi) => (
          <Page key={pi} tpl={tpl} ctx={ctx} size={size} page={pi + 1} pageCount={pages.length} className={pageClassName}>
            {p.first ? <H ctx={ctx} /> : <C ctx={ctx} page={pi + 1} />}
            {p.rows[1] > p.rows[0] && <ItemsTable tpl={tpl} ctx={ctx} cols={cols} from={p.rows[0]} to={p.rows[1]} />}
            {p.summary.map((si) => <div key={si} style={{ paddingTop: tpl.gap }}>{summary[si]}</div>)}
          </Page>
        ))}
      </div>
    </div>
  )
}

export const InvoiceDocument = memo(DocumentInner)
