import type { TemplateDef } from './types'
import { BusinessLines, CustomerLines, FooterText, Logo, ShipTo, TotalsTable, amountDue, hasShipping, justify, logoAlign, metaRows, standardColumns, tailBlocks } from './shared'

/** Modern Minimal — generous white space, hairlines only, light typographic hierarchy. */
const minimal: TemplateDef = {
  meta: { id: 'minimal', name: 'Modern Minimal', description: 'Airy layout, hairline rules and elegant typography.', bestFor: 'Consultants, designers' },
  accent: '#0692F4',
  pad: { x: 68, top: 68, bottom: 68 },
  gap: 26,
  rootClass: 'font-sans text-[11.5px] leading-[1.6] text-[#374151]',
  Header: ({ ctx }) => (
    <div className="pb-10">
      <div className="flex mb-10" style={{ justifyContent: justify(logoAlign(ctx)) }}><Logo ctx={ctx} max={70} /></div>
      <div className="flex justify-between items-end gap-8">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-[#9ca3af]">{ctx.inv.title || 'Invoice'}</div>
          <div className="text-[26px] font-light text-[#111827] mt-1">{ctx.inv.number}</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-[0.2em] text-[#9ca3af]">Amount due</div>
          <div className="text-[26px] font-light text-[#111827] mt-1 tabular-nums">{amountDue(ctx)}</div>
        </div>
      </div>
      <div className="h-px bg-[#e5e7eb] my-8" />
      <div className="grid grid-cols-3 gap-8">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.16em] text-[#9ca3af] mb-2">From</div>
          <BusinessLines ctx={ctx} nameClass="text-[#111827] font-medium" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.16em] text-[#9ca3af] mb-2">Billed to</div>
          <CustomerLines ctx={ctx} nameClass="text-[#111827] font-medium" />
          {hasShipping(ctx) && <><div className="text-[10px] uppercase tracking-[0.16em] text-[#9ca3af] mt-3 mb-1">Ship to</div><ShipTo ctx={ctx} /></>}
        </div>
        <div className="min-w-0 space-y-2">
          {metaRows(ctx, { number: false }).map(([k, v]) => (
            <div key={k}><div className="text-[10px] uppercase tracking-[0.16em] text-[#9ca3af]">{k}</div><div className="text-[#111827] break-words whitespace-pre-line">{v}</div></div>
          ))}
        </div>
      </div>
    </div>
  ),
  ContHeader: ({ ctx, page }) => <div className="text-[10px] uppercase tracking-[0.16em] text-[#9ca3af] mb-6">{ctx.inv.number} — page {page}</div>,
  columns: (ctx) => standardColumns(ctx, { nameClass: 'text-[#111827]' }),
  table: {
    className: 'w-full',
    theadClass: '',
    thClass: 'pb-3 text-[10px] font-normal uppercase tracking-[0.16em] text-[#9ca3af] border-b border-[#e5e7eb]',
    tdClass: 'py-3.5 align-top border-b border-[#f3f4f6]',
  },
  summary: (ctx) => [
    <TotalsTable key="t" ctx={ctx} width={280} rowClass="" strongClass="text-[#111827] text-[14px] font-medium [&>td]:pt-3 [&>td]:border-t [&>td]:border-[#e5e7eb]" />,
    ...tailBlocks(ctx, { titleClass: 'text-[10px] uppercase tracking-[0.16em] text-[#9ca3af] mb-2', labelClass: 'text-[#9ca3af]', thanksClass: 'text-[#111827]' }),
  ],
  Footer: ({ ctx, page, pageCount }) => <FooterText ctx={ctx} page={page} pageCount={pageCount} className="text-[10px] text-[#9ca3af]" />,
}
export default minimal
