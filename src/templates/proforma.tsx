import type { TemplateDef } from './types'
import { BusinessLines, Cap, CustomerLines, DetailGrid, FooterText, Logo, ShipTo, hasShipping, docTitle, findField, otherFieldRows, standardColumns, tailBlocks, totalsRows, cx } from './shared'

const USED = [/deliver|delivery/i, /incoterm|shipping terms/i, /valid/i]

/** Proforma — a quote formatted as an invoice: validity date, estimated total, not-a-tax-invoice notice. */
const proforma: TemplateDef = {
  meta: { id: 'proforma', name: 'Proforma Invoice', description: 'Advance quote with validity date, estimated total and terms.', bestFor: 'Advance payments, quotes, import licences', category: 'Document', fields: ['Delivery date', 'Delivery terms'] },
  accent: '#0B7285',
  pad: { x: 54, top: 50, bottom: 58 },
  gap: 18,
  rootClass: 'font-sans text-[11px] leading-[1.55] text-[#202938]',
  Header: ({ ctx }) => (
    <div className="pb-6">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0"><Logo ctx={ctx} max={52} style={{ marginBottom: 8 }} /><BusinessLines ctx={ctx} nameClass="text-[15px] font-bold" className="text-[#4b5563]" /></div>
        <div className="shrink-0 text-right">
          <div className="text-[24px] font-extrabold tracking-tight" style={{ color: ctx.accent }}>{docTitle(ctx, 'Proforma Invoice')}</div>
          <div className="mt-1 text-[11px]">Ref. <b>PF-{ctx.inv.number}</b></div>
          <div className="mt-2 inline-block rounded-full border px-3 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide" style={{ borderColor: ctx.accent, color: ctx.accent }}>Quotation · not a tax invoice</div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="min-w-0 rounded-lg border border-[#e5e7eb] p-3"><Cap className="mb-1">Prepared for</Cap><CustomerLines ctx={ctx} nameClass="font-semibold text-[12px]" />{hasShipping(ctx) && <div className="mt-2"><Cap>Deliver to</Cap><ShipTo ctx={ctx} /></div>}</div>
        <div className="min-w-0 rounded-lg bg-[#E6F6F8] p-3">
          <DetailGrid rows={[
            ['Issue date', ctx.date(ctx.inv.issueDate)],
            ['Valid until', ctx.inv.dueDate ? ctx.date(ctx.inv.dueDate) : findField(ctx, /valid/i)],
            ['Est. delivery', findField(ctx, /deliver(y)? date|delivery/i)],
            ['Delivery terms', findField(ctx, /incoterm|delivery terms|shipping terms/i)],
            ...(ctx.inv.poNumber ? [['Buyer ref.', ctx.inv.poNumber] as [string, string]] : []),
            ...otherFieldRows(ctx, USED),
          ].filter(([, v]) => v) as [string, string][]} />
        </div>
      </div>
    </div>
  ),
  ContHeader: ({ ctx, page }) => <div className="mb-4 flex justify-between text-[10.5px] text-[#6b7280]"><b className="min-w-0 truncate text-[#202938]">Proforma PF-{ctx.inv.number}</b><span className="shrink-0">Page {page}</span></div>,
  columns: (ctx) => standardColumns(ctx, { nameClass: 'font-semibold' }).map((c) => (c.key === 'amt' ? { ...c, label: 'Est. amount' } : c)),
  table: { className: 'w-full', theadClass: 'bg-[#E6F6F8]', thClass: 'px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[#0B7285]', tdClass: 'px-3 py-2.5 align-top border-b border-[#e5e7eb]' },
  summary: (ctx) => [
    <div key="t" className="ml-auto w-[300px]">
      {totalsRows(ctx).map((r, i) => (
        <div key={i} className={cx('flex justify-between gap-4 px-3 py-1.5', r.strong ? 'mt-1 rounded-md font-bold text-[13px]' : 'border-b border-[#f3f4f6]', r.muted && 'text-[#6b7280]')} style={r.strong ? { background: ctx.accent, color: ctx.onAccent } : undefined}>
          <span>{r.strong && r.label === 'Total' ? 'Estimated total' : r.label}</span><span className="tabular-nums whitespace-nowrap">{r.value}</span>
        </div>
      ))}
    </div>,
    <div key="note" className="rounded-lg border border-dashed border-[#9ca3af] px-4 py-3 text-[10.5px] text-[#4b5563]">This proforma invoice is a quotation issued in advance of supply. It is not a demand for payment for tax purposes; a final invoice will be issued on delivery. Prices are valid until the date shown.</div>,
    ...tailBlocks(ctx, { titleClass: 'text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#6b7280] mb-1', labelClass: 'text-[#6b7280]', thanksClass: 'font-semibold' }),
  ],
  Footer: ({ ctx, page, pageCount }) => <FooterText ctx={ctx} page={page} pageCount={pageCount} className="text-[9.5px] text-[#6b7280]" />,
}
export default proforma
