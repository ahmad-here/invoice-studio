import type { TemplateDef } from './types'
import { BusinessLines, CustomerLines, FooterText, Logo, MetaTable, ShipTo, TotalsTable, hasShipping, justify, logoAlign, metaRows, standardColumns, tailBlocks } from './shared'

/** Classic Professional — traditional corporate layout, bordered table, structured blocks. */
const classic: TemplateDef = {
  meta: { id: 'classic', name: 'Classic Professional', description: 'Traditional corporate layout with a bordered item table.', bestFor: 'Any business' },
  accent: '#202938',
  pad: { x: 56, top: 52, bottom: 64 },
  gap: 18,
  rootClass: 'font-sans text-[12px] leading-[1.5] text-[#202938]',
  Header: ({ ctx }) => (
    <div className="pb-6">
      {logoAlign(ctx) === 'center' && <div className="flex mb-4" style={{ justifyContent: justify('center') }}><Logo ctx={ctx} /></div>}
      <div className="flex items-start justify-between gap-8 border-b-2 pb-5" style={{ borderColor: ctx.accent }}>
        <div className="min-w-0 flex-1">
          {logoAlign(ctx) === 'left' && <div className="mb-3"><Logo ctx={ctx} /></div>}
          <BusinessLines ctx={ctx} nameClass="text-[16px] font-bold mb-0.5" className="text-[11.5px] text-[#4b5563]" />
        </div>
        <div className="text-right min-w-0 max-w-[55%]">
          {logoAlign(ctx) === 'right' && <div className="flex justify-end mb-3"><Logo ctx={ctx} /></div>}
          <div className="text-[30px] font-bold tracking-[0.06em] uppercase leading-none">{ctx.inv.title || 'Invoice'}</div>
          <div className="mt-2 text-[13px] font-semibold">{ctx.inv.number}</div>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_1fr_auto] gap-6 pt-5">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#6b7280] mb-1">Bill to</div>
          <CustomerLines ctx={ctx} nameClass="font-semibold text-[13px]" />
        </div>
        <div className="min-w-0">
          {hasShipping(ctx) && <>
            <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#6b7280] mb-1">Ship to</div>
            <ShipTo ctx={ctx} />
          </>}
        </div>
        <MetaTable rows={metaRows(ctx, { number: false })} labelClass="text-[#6b7280]" valueClass="font-medium text-right" />
      </div>
    </div>
  ),
  ContHeader: ({ ctx, page }) => (
    <div className="flex justify-between border-b pb-2 mb-4 text-[11px] text-[#6b7280]"><span className="min-w-0 truncate font-semibold text-[#202938]">{ctx.inv.business.name}</span><span className="shrink-0">{ctx.inv.number} · continued (page {page})</span></div>
  ),
  columns: (ctx) => standardColumns(ctx),
  table: {
    className: 'w-full border border-[#d1d5db]',
    theadClass: 'bg-[#f3f4f6]',
    thClass: 'px-3 py-2 text-[10.5px] font-bold uppercase tracking-[0.05em] border-b border-[#d1d5db]',
    tdClass: 'px-3 py-2 align-top border-b border-[#e5e7eb]',
  },
  summary: (ctx) => [
    <div key="t" className="flex justify-end"><TotalsTable ctx={ctx} className="border border-[#d1d5db]" rowClass="[&>td]:px-3 border-b border-[#e5e7eb]" strongClass="[&>td]:px-3 font-bold text-[13px] bg-[#f3f4f6] border-b border-[#d1d5db]" /></div>,
    ...tailBlocks(ctx, { titleClass: 'text-[10px] font-bold uppercase tracking-[0.08em] text-[#6b7280] mb-1', labelClass: 'text-[#6b7280]', thanksClass: 'pt-2 text-center font-semibold' }),
  ],
  Footer: ({ ctx, page, pageCount }) => <FooterText ctx={ctx} page={page} pageCount={pageCount} className="border-t border-[#e5e7eb] pt-2 text-[10px] text-[#6b7280]" />,
}
export default classic
