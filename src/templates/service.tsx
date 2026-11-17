import type { TemplateDef } from './types'
import { BusinessLines, CustomerLines, FooterText, Logo, ShipTo, TotalsTable, amountDue, discountText, fieldValue, hasShipping, justify, logoAlign, metaRows, pct, qtyText, tailBlocks, visibleFields } from './shared'

/** Service Invoice — freelancer-focused: project details panel, service descriptions emphasised. */
const service: TemplateDef = {
  meta: { id: 'service', name: 'Service Invoice', description: 'Project details up front; service descriptions take centre stage.', bestFor: 'Freelancers, contractors' },
  accent: '#0692F4',
  pad: { x: 56, top: 52, bottom: 60 },
  gap: 20,
  rootClass: 'font-sans text-[11.5px] leading-[1.55] text-[#202938]',
  Header: ({ ctx }) => {
    const fields = visibleFields(ctx.inv.customFields)
    return (
      <div className="pb-6">
        <div className="flex justify-between items-start gap-8">
          <div className="min-w-0">
            <div className="flex mb-3" style={{ justifyContent: justify(logoAlign(ctx) === 'right' ? 'left' : logoAlign(ctx)) }}><Logo ctx={ctx} max={64} /></div>
            <BusinessLines ctx={ctx} nameClass="text-[15px] font-bold" className="text-[11px] text-[#4b5563]" />
          </div>
          <div className="text-right shrink-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">{ctx.inv.title || 'Invoice'}</div>
            <div className="text-[22px] font-bold">{ctx.inv.number}</div>
            <div className="mt-3 text-[11px] text-[#6b7280]">Amount due</div>
            <div className="text-[22px] font-bold tabular-nums" style={{ color: ctx.accent }}>{amountDue(ctx)}</div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-[1fr_1.3fr] gap-6">
          <div className="min-w-0">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#6b7280] mb-1">Client</div>
            <CustomerLines ctx={ctx} nameClass="font-bold text-[13px]" />
            {hasShipping(ctx) && <><div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#6b7280] mt-3 mb-1">Site / delivery</div><ShipTo ctx={ctx} /></>}
          </div>
          <div className="rounded-lg border border-[#E5E7EB] border-l-4 p-4" style={{ borderLeftColor: ctx.accent }}>
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#6b7280] mb-2">Project details</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {[...metaRows(ctx, { number: false, custom: false }), ...fields.map((f) => [f.label, fieldValue(f, ctx)] as [string, string])].map(([k, v]) => (
                <div key={k} className="min-w-0"><div className="text-[10px] text-[#6b7280]">{k}</div><div className="font-semibold break-words whitespace-pre-line">{v}</div></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  },
  ContHeader: ({ ctx, page }) => <div className="mb-4 text-[11px] text-[#6b7280] flex justify-between"><b className="text-[#202938]">{ctx.inv.number}</b><span>Page {page}</span></div>,
  columns: (ctx) => [
    { key: 'item', label: 'Service', render: (it) => (
      <div className="break-words">
        <div className="font-semibold text-[12.5px]">{it.name || ' '}</div>
        {it.description && <div className="whitespace-pre-line text-[#4b5563] mt-0.5">{it.description}</div>}
      </div>
    ) },
    { key: 'qty', label: ctx.has.unit ? 'Qty' : 'Hours', align: 'right', width: '11%', render: (it) => qtyText(ctx, it) },
    { key: 'rate', label: 'Rate', align: 'right', width: '15%', render: (it) => ctx.money(it.unitPrice) },
    ...(ctx.has.discount ? [{ key: 'd', label: 'Disc.', align: 'right' as const, width: '10%', render: (it: typeof ctx.inv.items[number], l: { discount: number }) => discountText(ctx, it, l) }] : []),
    ...(ctx.has.tax && ctx.inv.taxMode === 'item' ? [{ key: 't', label: 'Tax', align: 'right' as const, width: '8%', render: (it: typeof ctx.inv.items[number]) => pct(it.taxRate) }] : []),
    { key: 'amt', label: 'Amount', align: 'right', width: '16%', render: (_it, l) => <span className="font-semibold">{ctx.money(l.total)}</span> },
  ],
  table: {
    className: 'w-full',
    theadClass: '',
    thClass: 'py-2 px-2 text-[10.5px] font-semibold uppercase tracking-wider text-[#6b7280] border-b-2 border-[#202938]',
    tdClass: 'py-3.5 px-2 align-top border-b border-[#E5E7EB]',
  },
  summary: (ctx) => [
    <TotalsTable key="t" ctx={ctx} width={300} strongClass="font-bold text-[14px] [&>td]:border-t-2 [&>td]:border-[#202938] [&>td]:pt-2" />,
    ...tailBlocks(ctx, { titleClass: 'text-[10.5px] font-semibold uppercase tracking-wider text-[#6b7280] mb-1', labelClass: 'text-[#6b7280]', thanksClass: 'font-semibold', blockClass: '' }),
  ],
  Footer: ({ ctx, page, pageCount }) => <FooterText ctx={ctx} page={page} pageCount={pageCount} className="text-[10px] text-[#6b7280]" />,
}
export default service
