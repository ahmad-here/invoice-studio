import type { CSSProperties, ReactNode } from 'react'
import type { Column, RenderCtx } from './types'
import type { CustomField, Customer, Invoice } from '@/types/invoice'
import { formatDate } from '@/lib/dates'
import { formatNumber } from '@/lib/money'
import { safeUrl } from '@/lib/sanitize'

/* ------------------------------ helpers ------------------------------ */

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')
export const pct = (n: number) => `${formatNumber(n, 'en-US', 3)}%`

export const STATUS_LABEL: Record<Invoice['status'], string> = {
  draft: 'Draft', sent: 'Unpaid', paid: 'Paid', overdue: 'Overdue', cancelled: 'Cancelled',
}

/** Logo with preserved aspect ratio; width set by user, max height capped so it can't take over the page. */
export function Logo({ ctx, max = 90, style }: { ctx: RenderCtx; max?: number; style?: CSSProperties }) {
  const l = ctx.inv.business.logo
  if (!l) return null
  const ratio = l.height / l.width || 1
  let w = l.size
  if (w * ratio > max) w = max / ratio
  return <img src={l.dataUrl} alt="" width={Math.round(w)} height={Math.round(w * ratio)} style={{ display: 'block', objectFit: 'contain', ...style }} />
}
export const logoAlign = (ctx: RenderCtx) => ctx.inv.business.logo?.position ?? 'left'
export const justify = (p: 'left' | 'center' | 'right') => (p === 'left' ? 'flex-start' : p === 'center' ? 'center' : 'flex-end')

/** Multi-line text with preserved line breaks and safe wrapping of long words. */
export const Lines = ({ text, className }: { text: string; className?: string }) =>
  text ? <div className={cx('whitespace-pre-line break-words', className)}>{text}</div> : null

export function BusinessLines({ ctx, className, nameClass, showName = true }: { ctx: RenderCtx; className?: string; nameClass?: string; showName?: boolean }) {
  const b = ctx.inv.business
  return (
    <div className={cx('break-words', className)}>
      {showName && b.name && <div className={nameClass}>{b.name}</div>}
      <Lines text={b.address} />
      {b.email && <div>{b.email}</div>}
      {b.phone && <div>{b.phone}</div>}
      {b.website && <div>{b.website}</div>}
      {b.taxNumber && <div>Tax No: {b.taxNumber}</div>}
      {b.vatNumber && <div>VAT: {b.vatNumber}</div>}
      <Lines text={b.extra} />
    </div>
  )
}

const shown = (c: Customer, k: Exclude<keyof Customer, 'hidden'>) => !c.hidden.includes(k) && !!c[k]

export function CustomerLines({ ctx, className, nameClass }: { ctx: RenderCtx; className?: string; nameClass?: string }) {
  const c = ctx.inv.customer
  return (
    <div className={cx('break-words', className)}>
      {c.name && <div className={nameClass}>{c.name}</div>}
      {shown(c, 'company') && <div>{c.company}</div>}
      {shown(c, 'billingAddress') && <Lines text={c.billingAddress} />}
      {shown(c, 'email') && <div>{c.email}</div>}
      {shown(c, 'phone') && <div>{c.phone}</div>}
      {shown(c, 'taxId') && <div>Tax ID: {c.taxId}</div>}
      {shown(c, 'reference') && <div>Ref: {c.reference}</div>}
    </div>
  )
}
export const hasShipping = (ctx: RenderCtx) => shown(ctx.inv.customer, 'shippingAddress')
export const ShipTo = ({ ctx, className }: { ctx: RenderCtx; className?: string }) =>
  hasShipping(ctx) ? <Lines text={ctx.inv.customer.shippingAddress} className={className} /> : null

/** Invoice meta rows: number, dates, terms, PO, reference + visible custom fields. */
export function metaRows(ctx: RenderCtx, opts: { number?: boolean; custom?: boolean } = {}): [string, string][] {
  const i = ctx.inv
  const rows: [string, string][] = []
  if (opts.number !== false) rows.push(['Invoice No.', i.number])
  rows.push(['Issue date', ctx.date(i.issueDate)])
  if (i.dueDate) rows.push(['Due date', ctx.date(i.dueDate)])
  if (i.poNumber) rows.push(['PO number', i.poNumber])
  if (i.reference) rows.push(['Reference', i.reference])
  if (opts.custom !== false) for (const f of visibleFields(i.customFields)) rows.push([f.label, fieldValue(f, ctx)])
  return rows
}

export const visibleFields = (f: CustomField[]) => f.filter((x) => x.visible && x.label && x.value)
export function fieldValue(f: CustomField, ctx: Pick<RenderCtx, 'date'>): string {
  if (f.type === 'date') return ctx.date(f.value)
  if (f.type === 'number') { const n = Number(f.value); return Number.isFinite(n) ? formatNumber(n) : f.value }
  if (f.type === 'url') return safeUrl(f.value)?.replace(/^https?:\/\//, '').replace(/\/$/, '') ?? f.value
  return f.value
}

export function MetaTable({ rows, className, labelClass, valueClass }: { rows: [string, string][]; className?: string; labelClass?: string; valueClass?: string }) {
  return (
    <table className={cx('border-collapse', className)}>
      <tbody>
        {rows.map(([k, v], i) => (
          <tr key={i}>
            <td className={cx('pr-4 py-[2px] align-top whitespace-nowrap', labelClass)}>{k}</td>
            <td className={cx('py-[2px] align-top break-words whitespace-pre-line', valueClass)}>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ------------------------------ items ------------------------------ */

export function ItemName({ ctx, item, nameClass, descClass, showSku = false }: { ctx: RenderCtx; item: Invoice['items'][number]; nameClass?: string; descClass?: string; showSku?: boolean }) {
  return (
    <div className="break-words">
      <div className={nameClass}>{item.name || ' '}</div>
      {showSku && item.sku && <div className={cx('text-[10px] opacity-70', descClass)}>SKU {item.sku}</div>}
      {ctx.has.description && item.description && <div className={cx('whitespace-pre-line', descClass)}>{item.description}</div>}
    </div>
  )
}

export function qtyText(ctx: RenderCtx, item: Invoice['items'][number]) {
  return `${formatNumber(item.quantity, ctx.prefs.locale)}${item.unit ? ` ${item.unit}` : ''}`
}
export function discountText(ctx: RenderCtx, item: Invoice['items'][number], line: { discount: number }) {
  if (!line.discount) return '—'
  return item.discount.type === 'percent' ? pct(item.discount.value) : ctx.money(line.discount)
}

/** Standard column set used by most templates. */
export function standardColumns(ctx: RenderCtx, o: { index?: boolean; descClass?: string; nameClass?: string; sku?: boolean } = {}): Column[] {
  const cols: Column[] = []
  if (o.index) cols.push({ key: 'n', label: '#', width: '5%', render: (_i, _l, idx) => idx + 1 })
  cols.push({ key: 'item', label: 'Description', render: (it) => <ItemName ctx={ctx} item={it} nameClass={o.nameClass ?? 'font-medium'} descClass={o.descClass ?? 'text-[11px] opacity-70 mt-0.5'} showSku={o.sku ?? true} /> })
  cols.push({ key: 'qty', label: 'Qty', align: 'right', width: ctx.has.unit ? '11%' : '8%', render: (it) => qtyText(ctx, it) })
  cols.push({ key: 'price', label: 'Rate', align: 'right', width: '15%', render: (it) => ctx.money(it.unitPrice) })
  if (ctx.has.discount) cols.push({ key: 'disc', label: 'Disc.', align: 'right', width: '10%', render: (it, l) => discountText(ctx, it, l) })
  if (ctx.has.tax && ctx.inv.taxMode === 'item') cols.push({ key: 'tax', label: 'Tax', align: 'right', width: '8%', render: (it) => pct(it.taxRate) })
  cols.push({ key: 'amt', label: 'Amount', align: 'right', width: '16%', render: (_i, l) => ctx.money(l.total) })
  return cols
}

/* ------------------------------ totals ------------------------------ */

export function totalsRows(ctx: RenderCtx): { label: string; value: string; strong?: boolean; muted?: boolean }[] {
  const t = ctx.totals
  const i = ctx.inv
  const rows: { label: string; value: string; strong?: boolean; muted?: boolean }[] = [{ label: 'Subtotal', value: ctx.money(t.subtotal) }]
  if (t.itemDiscounts) rows.push({ label: 'Item discounts', value: `−${ctx.money(t.itemDiscounts)}` })
  if (t.invoiceDiscount) rows.push({ label: i.invoiceDiscount.type === 'percent' ? `Discount (${pct(i.invoiceDiscount.value)})` : 'Discount', value: `−${ctx.money(t.invoiceDiscount)}` })
  if (i.taxMode === 'invoice') {
    if (t.tax || i.invoiceTaxRate) rows.push({ label: `Tax (${pct(i.invoiceTaxRate)})`, value: ctx.money(t.tax) })
  } else {
    for (const b of t.taxBreakdown) rows.push({ label: `Tax ${pct(b.rate)}`, value: ctx.money(b.amount) })
  }
  if (t.shipping) rows.push({ label: 'Shipping', value: ctx.money(t.shipping) })
  if (t.adjustment) rows.push({ label: i.adjustmentLabel || 'Adjustment', value: ctx.money(t.adjustment) })
  rows.push({ label: 'Total', value: ctx.money(t.grandTotal), strong: true })
  if (t.amountPaid) {
    rows.push({ label: 'Amount paid', value: `−${ctx.money(t.amountPaid)}`, muted: true })
    rows.push({ label: 'Balance due', value: ctx.money(t.balanceDue), strong: true })
  }
  return rows
}

export function TotalsTable({ ctx, className, rowClass, strongClass, width = 300 }: { ctx: RenderCtx; className?: string; rowClass?: string; strongClass?: string; width?: number }) {
  return (
    <table className={cx('border-collapse ml-auto', className)} style={{ width }}>
      <tbody>
        {totalsRows(ctx).map((r, i) => (
          <tr key={i} className={r.strong ? strongClass : rowClass}>
            <td className={cx('py-1 pr-4', r.muted && 'opacity-70')}>{r.label}</td>
            <td className={cx('py-1 text-right tabular-nums whitespace-nowrap', r.muted && 'opacity-70')}>{r.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** The headline amount: balance due if something was paid, else grand total. */
export const amountDue = (ctx: RenderCtx) => ctx.money(ctx.totals.amountPaid ? ctx.totals.balanceDue : ctx.totals.grandTotal)

/* ------------------------------ sections ------------------------------ */

export function hasPayment(ctx: RenderCtx) {
  const p = ctx.inv.payment
  return p.visible && !!(p.method || p.bankName || p.accountHolder || p.accountNumber || p.iban || p.swift || p.instructions || p.link)
}

export function PaymentBlock({ ctx, title = 'Payment details', titleClass, className, labelClass }: { ctx: RenderCtx; title?: string; titleClass?: string; className?: string; labelClass?: string }) {
  if (!hasPayment(ctx)) return null
  const p = ctx.inv.payment
  const rows: [string, string][] = (
    [['Method', p.method], ['Bank', p.bankName], ['Account name', p.accountHolder], ['Account no.', p.accountNumber], ['IBAN', p.iban], ['SWIFT/BIC', p.swift]] as [string, string][]
  ).filter(([, v]) => v)
  const link = safeUrl(p.link)
  return (
    <div className={className}>
      {title && <div className={titleClass}>{title}</div>}
      {rows.length > 0 && <MetaTable rows={rows} labelClass={labelClass} />}
      <Lines text={p.instructions} className="mt-1" />
      {link && <div className="mt-1 break-all">Pay online: {link}</div>}
    </div>
  )
}

export function textSections(ctx: RenderCtx) {
  const i = ctx.inv
  return ([
    ['Notes', i.notes],
    ['Payment terms', i.terms],
    ['Terms & conditions', i.conditions],
  ] as const).filter(([, s]) => s.visible && s.text.trim())
}

/** Renders a titled text block. Each becomes its own pagination block so long terms can flow to the next page. */
export function TextBlock({ title, text, titleClass, className }: { title: string; text: string; titleClass?: string; className?: string }) {
  return (
    <div className={className}>
      <div className={titleClass}>{title}</div>
      <Lines text={text} />
    </div>
  )
}

export function CustomSectionBlock({ ctx, section, titleClass, className, labelClass }: { ctx: RenderCtx; section: Invoice['customSections'][number]; titleClass?: string; className?: string; labelClass?: string }) {
  const f = visibleFields(section.fields)
  return (
    <div className={className}>
      <div className={titleClass}>{section.title}</div>
      {f.some((x) => x.type === 'multiline')
        ? f.map((x) => <div key={x.id} className="mb-1"><span className={labelClass}>{x.label}: </span><span className="whitespace-pre-line break-words">{fieldValue(x, ctx)}</span></div>)
        : <MetaTable rows={f.map((x) => [x.label, fieldValue(x, ctx)])} labelClass={labelClass} />}
    </div>
  )
}
export const visibleSections = (ctx: RenderCtx) => ctx.inv.customSections.filter((s) => s.visible && s.title && visibleFields(s.fields).length)

/** Standard tail blocks shared by templates: custom sections, notes/terms, thank-you. */
export function tailBlocks(ctx: RenderCtx, s: { titleClass: string; labelClass?: string; blockClass?: string; thanksClass?: string; payment?: boolean }): ReactNode[] {
  const out: ReactNode[] = []
  if (s.payment !== false && hasPayment(ctx)) out.push(<PaymentBlock key="pay" ctx={ctx} titleClass={s.titleClass} labelClass={s.labelClass} className={s.blockClass} />)
  for (const sec of visibleSections(ctx)) out.push(<CustomSectionBlock key={sec.id} ctx={ctx} section={sec} titleClass={s.titleClass} labelClass={s.labelClass} className={s.blockClass} />)
  for (const [title, sec] of textSections(ctx)) out.push(<TextBlock key={title} title={title} text={sec.text} titleClass={s.titleClass} className={s.blockClass} />)
  if (ctx.inv.thankYou.visible && ctx.inv.thankYou.text.trim()) out.push(<div key="ty" className={s.thanksClass}>{ctx.inv.thankYou.text}</div>)
  return out
}

export function FooterText({ ctx, page, pageCount, className }: { ctx: RenderCtx; page: number; pageCount: number; className?: string }) {
  const f = ctx.inv.footer
  return (
    <div className={cx('flex justify-between gap-6 items-end', className)}>
      <div className="whitespace-pre-line break-words min-w-0">{f.visible ? f.text : ''}</div>
      {pageCount > 1 && <div className="whitespace-nowrap shrink-0">Page {page} of {pageCount}</div>}
    </div>
  )
}

export const fmtDate = (iso: string, ctx: Pick<RenderCtx, 'prefs'>) => formatDate(iso, ctx.prefs.dateFormat, ctx.prefs.locale)
