import type { TemplateDef } from './types'
import { BusinessLines, Cap, CustomerLines, FooterText, Logo, PaymentBlock, amountDue, docTitle, findField, hasPayment, otherFieldRows, qtyText, tailBlocks, totalsRows, cx } from './shared'

const USED = [/service address|property|location/i, /visit|service date|date of service/i, /frequency|schedule/i, /technician|cleaner|team|crew/i]

/** Home Services / Cleaning — service address and visit date up front, friendly rounded layout. */
const homeservice: TemplateDef = {
  meta: { id: 'homeservice', name: 'Home Services / Cleaning', description: 'Service address and visit date up front with a friendly layout.', bestFor: 'Cleaning, plumbing, landscaping, repairs', category: 'Industry', fields: ['Service address', 'Service date', 'Frequency', 'Technician'] },
  accent: '#1098AD',
  pad: { x: 50, top: 46, bottom: 56 },
  gap: 16,
  rootClass: 'font-sans text-[11px] leading-[1.55] text-[#212529]',
  Header: ({ ctx }) => {
    const c = ctx.inv.customer
    const addr = findField(ctx, /service address|property|location/i) || (!c.hidden.includes('shippingAddress') && c.shippingAddress) || (!c.hidden.includes('billingAddress') && c.billingAddress) || ''
    return (
      <div className="pb-5">
        <div className="flex items-center justify-between gap-6 rounded-2xl px-5 py-4" style={{ background: ctx.accent, color: ctx.onAccent }}>
          <div className="flex min-w-0 items-center gap-3">
            {ctx.inv.business.logo && <div className="rounded-xl bg-white p-1.5"><Logo ctx={ctx} max={42} /></div>}
            <div className="min-w-0"><div className="truncate text-[16px] font-bold">{ctx.inv.business.name}</div><div className="text-[10.5px] opacity-90">{[ctx.inv.business.phone, ctx.inv.business.email].filter(Boolean).join(' · ')}</div></div>
          </div>
          <div className="shrink-0 text-right"><div className="text-[18px] font-extrabold">{docTitle(ctx, 'Service Invoice')}</div><div className="text-[10.5px] opacity-90">#{ctx.inv.number} · {ctx.date(ctx.inv.issueDate)}</div></div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {([['Service address', addr], ['Service date', findField(ctx, /visit|service date|date of service/i) || ctx.date(ctx.inv.issueDate)], ['Technician', findField(ctx, /technician|cleaner|team|crew/i) || findField(ctx, /frequency|schedule/i)]] as [string, string][]).map(([k, v]) => (
            <div key={k} className="min-w-0 rounded-xl bg-[#E3FAFC] px-3 py-2.5"><Cap>{k === 'Technician' && !findField(ctx, /technician|cleaner|team|crew/i) && findField(ctx, /frequency|schedule/i) ? 'Frequency' : k}</Cap><div className="whitespace-pre-line font-semibold [overflow-wrap:anywhere]">{v || '—'}</div></div>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-6">
          <div className="min-w-0"><Cap className="mb-1">Customer</Cap><CustomerLines ctx={ctx} nameClass="font-semibold text-[12px]" /></div>
          <div className="min-w-0"><Cap className="mb-1">From</Cap><BusinessLines ctx={ctx} showName={false} className="text-[#495057]" />
            {otherFieldRows(ctx, USED).map(([k, v]) => <div key={k}><span className="text-[#6b7280]">{k}: </span>{v}</div>)}</div>
        </div>
      </div>
    )
  },
  ContHeader: ({ ctx, page }) => <div className="mb-4 flex justify-between rounded-xl bg-[#E3FAFC] px-4 py-2 text-[10.5px]"><b className="min-w-0 truncate">{ctx.inv.business.name}</b><span className="shrink-0">#{ctx.inv.number} · page {page}</span></div>,
  columns: (ctx) => [
    { key: 'd', label: 'Service', render: (it) => <div className="[overflow-wrap:anywhere]"><div className="font-semibold">{it.name || ' '}</div>{it.description && <div className="whitespace-pre-line text-[10px] text-[#6b7280]">{it.description}</div>}</div> },
    { key: 'q', label: 'Qty / hrs', align: 'right', width: '16%', render: (it) => qtyText(ctx, it) },
    { key: 'r', label: 'Price', align: 'right', width: '15%', render: (it) => ctx.money(it.unitPrice) },
    { key: 'a', label: 'Total', align: 'right', width: '16%', render: (_i, l) => <b>{ctx.money(l.total)}</b> },
  ],
  table: { className: 'w-full', theadClass: '', thClass: 'px-3 pb-2 text-[10px] font-semibold uppercase tracking-wide text-[#6b7280]', tdClass: 'px-3 py-2.5 align-top border-t border-[#e9ecef]' },
  summary: (ctx) => [
    <div key="t" className="grid grid-cols-[1fr_280px] items-start gap-6">
      <div className="min-w-0">{hasPayment(ctx) && <PaymentBlock ctx={ctx} className="rounded-xl border border-[#e9ecef] p-3" titleClass="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#6b7280] mb-1" labelClass="text-[#6b7280]" title="How to pay" />}</div>
      <div className="overflow-hidden rounded-xl border border-[#e9ecef]">
        {totalsRows(ctx).map((r, i) => <div key={i} className={cx('flex justify-between gap-3 px-4 py-1.5', r.muted && 'text-[#6b7280]')}><span>{r.label}</span><span className="tabular-nums">{r.value}</span></div>)}
        <div className="flex items-baseline justify-between px-4 py-3" style={{ background: ctx.accent, color: ctx.onAccent }}><span className="font-semibold">Amount due</span><span className="text-[17px] font-extrabold tabular-nums">{amountDue(ctx)}</span></div>
      </div>
    </div>,
    ...tailBlocks(ctx, { titleClass: 'text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#6b7280] mb-1', labelClass: 'text-[#6b7280]', thanksClass: 'text-center text-[13px] font-semibold text-[var(--accent)]', payment: false }),
  ],
  Footer: ({ ctx, page, pageCount }) => <FooterText ctx={ctx} page={page} pageCount={pageCount} className="text-[9.5px] text-[#6b7280]" />,
}
export default homeservice
