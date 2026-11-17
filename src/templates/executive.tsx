import type { TemplateDef } from './types'
import { BusinessLines, CustomerLines, FooterText, Logo, MetaTable, ShipTo, TotalsTable, amountDue, hasShipping, justify, logoAlign, metaRows, standardColumns, tailBlocks } from './shared'

/** Executive — refined serif typography, double rules, prominent invoice number. */
const executive: TemplateDef = {
  meta: { id: 'executive', name: 'Executive', description: 'Premium serif typography with a prominent invoice number.', bestFor: 'Law firms, finance, premium services' },
  accent: '#7a5c2e',
  pad: { x: 64, top: 56, bottom: 64 },
  gap: 20,
  rootClass: 'font-serif text-[12px] leading-[1.55] text-[#1f2937]',
  Header: ({ ctx }) => (
    <div className="pb-7">
      <div className="flex mb-4" style={{ justifyContent: justify(logoAlign(ctx) === 'left' ? 'center' : logoAlign(ctx)) }}><Logo ctx={ctx} max={80} /></div>
      <div className="text-center">
        <div className="text-[20px] tracking-[0.12em] uppercase">{ctx.inv.business.name}</div>
        <BusinessLines ctx={ctx} showName={false} className="text-[10.5px] text-[#6b7280] mt-1 [&>div]:inline [&>div:not(:last-child)]:after:content-['_·_']" />
      </div>
      <div className="mt-6 border-y-[3px] border-double py-4 flex items-center justify-between gap-6" style={{ borderColor: ctx.accent }}>
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#6b7280]">{ctx.inv.title || 'Invoice'}</div>
          <div className="text-[30px] leading-tight tracking-[0.04em]" style={{ color: ctx.accent }}>№ {ctx.inv.number}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#6b7280]">Amount due</div>
          <div className="text-[22px] tabular-nums">{amountDue(ctx)}</div>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_1fr_auto] gap-8 mt-6">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#6b7280] mb-1.5">Bill to</div>
          <CustomerLines ctx={ctx} nameClass="text-[14px]" />
        </div>
        <div className="min-w-0">{hasShipping(ctx) && <><div className="text-[10px] uppercase tracking-[0.25em] text-[#6b7280] mb-1.5">Ship to</div><ShipTo ctx={ctx} /></>}</div>
        <MetaTable rows={metaRows(ctx, { number: false })} labelClass="text-[#6b7280] italic" valueClass="text-right" />
      </div>
    </div>
  ),
  ContHeader: ({ ctx, page }) => <div className="text-center text-[10px] uppercase tracking-[0.25em] text-[#6b7280] border-b pb-2 mb-5">{ctx.inv.business.name} · № {ctx.inv.number} · page {page}</div>,
  columns: (ctx) => standardColumns(ctx, { descClass: 'text-[11px] italic text-[#6b7280] mt-0.5' }),
  table: {
    className: 'w-full',
    theadClass: '',
    thClass: 'py-2 text-[10px] font-normal uppercase tracking-[0.2em] text-[#6b7280] border-b-2 border-[var(--accent)]',
    tdClass: 'py-3 align-top border-b border-[#e5e7eb]',
  },
  summary: (ctx) => [
    <TotalsTable key="t" ctx={ctx} width={300} strongClass="text-[15px] [&>td]:border-y-[3px] [&>td]:border-double [&>td]:border-[var(--accent)] [&>td]:py-2" />,
    ...tailBlocks(ctx, { titleClass: 'text-[10px] uppercase tracking-[0.25em] text-[#6b7280] mb-1.5', labelClass: 'text-[#6b7280] italic', thanksClass: 'text-center italic text-[14px] pt-3' }),
  ],
  Footer: ({ ctx, page, pageCount }) => <FooterText ctx={ctx} page={page} pageCount={pageCount} className="text-[10px] text-[#6b7280] italic" />,
}
export default executive
