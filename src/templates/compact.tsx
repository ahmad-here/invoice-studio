import type { TemplateDef } from './types'
import { BusinessLines, CustomerLines, FooterText, Logo, ShipTo, TotalsTable, hasShipping, metaRows, standardColumns, tailBlocks } from './shared'

/** Compact — space-efficient, small type, dense zebra table. Fits many items per page. */
const compact: TemplateDef = {
  meta: { id: 'compact', name: 'Compact Invoice', description: 'Dense, space-efficient layout for long item lists.', bestFor: 'Wholesale, long invoices' },
  accent: '#0692F4',
  pad: { x: 36, top: 34, bottom: 44 },
  gap: 10,
  rootClass: 'font-sans text-[10px] leading-[1.4] text-[#202938]',
  Header: ({ ctx }) => (
    <div className="pb-3">
      <div className="flex items-center justify-between gap-4 border-b pb-2" style={{ borderColor: ctx.accent }}>
        <div className="flex items-center gap-3 min-w-0">
          <Logo ctx={ctx} max={36} />
          <div className="text-[14px] font-bold truncate">{ctx.inv.business.name}</div>
        </div>
        <div className="text-[16px] font-bold uppercase tracking-wide" style={{ color: ctx.accent }}>{ctx.inv.title || 'Invoice'} <span className="text-[#202938]">{ctx.inv.number}</span></div>
      </div>
      <div className="grid grid-cols-4 gap-3 pt-2">
        <div className="min-w-0"><div className="font-bold text-[#6b7280] uppercase text-[8.5px]">From</div><BusinessLines ctx={ctx} showName={false} /></div>
        <div className="min-w-0"><div className="font-bold text-[#6b7280] uppercase text-[8.5px]">Bill to</div><CustomerLines ctx={ctx} nameClass="font-semibold" /></div>
        <div className="min-w-0">{hasShipping(ctx) && <><div className="font-bold text-[#6b7280] uppercase text-[8.5px]">Ship to</div><ShipTo ctx={ctx} /></>}</div>
        <div className="min-w-0">
          {metaRows(ctx, { number: false }).map(([k, v]) => <div key={k} className="flex justify-between gap-2"><span className="text-[#6b7280]">{k}</span><span className="font-medium text-right break-words min-w-0">{v}</span></div>)}
        </div>
      </div>
    </div>
  ),
  ContHeader: ({ ctx, page }) => <div className="mb-2 flex justify-between text-[9px] text-[#6b7280] border-b pb-1"><b className="text-[#202938]">{ctx.inv.number}</b><span>page {page}</span></div>,
  columns: (ctx) => standardColumns(ctx, { index: true, descClass: 'text-[9px] text-[#6b7280]' }),
  table: {
    className: 'w-full border-collapse',
    theadClass: 'bg-[#EAF5FF]',
    thClass: 'px-1.5 py-1 text-[8.5px] font-bold uppercase',
    tdClass: 'px-1.5 py-[3px] align-top',
    rowClass: (i) => (i % 2 ? 'bg-[#F7F9FC]' : ''),
  },
  summary: (ctx) => [
    <TotalsTable key="t" ctx={ctx} width={240} rowClass="[&>td]:py-0.5" strongClass="font-bold text-[11px] border-t border-[#202938]" />,
    ...tailBlocks(ctx, { titleClass: 'font-bold uppercase text-[8.5px] text-[#6b7280]', labelClass: 'text-[#6b7280]', thanksClass: 'font-semibold' }),
  ],
  Footer: ({ ctx, page, pageCount }) => <FooterText ctx={ctx} page={page} pageCount={pageCount} className="text-[8.5px] text-[#6b7280] border-t pt-1" />,
}
export default compact
