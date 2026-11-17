import type { TemplateDef } from './types'
import { BusinessLines, CustomerLines, FooterText, Logo, MetaTable, ShipTo, hasShipping, justify, logoAlign, metaRows, standardColumns, tailBlocks, totalsRows, cx } from './shared'

/** Elegant Dark Accent — white document, charcoal headings and a dark grand-total row. */
const elegant: TemplateDef = {
  meta: { id: 'elegant', name: 'Elegant Dark Accent', description: 'Sophisticated charcoal headings with restrained contrast.', bestFor: 'Boutiques, architects, hospitality' },
  accent: '#1f2937',
  pad: { x: 58, top: 0, bottom: 60 },
  gap: 20,
  rootClass: 'font-sans text-[11.5px] leading-[1.55] text-[#374151]',
  Header: ({ ctx }) => (
    <div className="pb-7">
      <div className="h-[6px] -mx-[58px] mb-10" style={{ background: ctx.accent }} />
      <div className="flex justify-between items-start gap-8">
        <div className="min-w-0">
          <div className="flex mb-3" style={{ justifyContent: justify(logoAlign(ctx) === 'right' ? 'left' : logoAlign(ctx)) }}><Logo ctx={ctx} max={64} /></div>
          <div className="font-serif text-[22px] text-[var(--accent)]">{ctx.inv.business.name}</div>
          <BusinessLines ctx={ctx} showName={false} className="text-[10.5px] text-[#6b7280] mt-1" />
        </div>
        <div className="text-right shrink-0">
          <div className="font-serif text-[40px] leading-none text-[var(--accent)]">{ctx.inv.title || 'Invoice'}</div>
          <div className="mt-3"><MetaTable rows={metaRows(ctx, { custom: false })} className="ml-auto" labelClass="text-[#6b7280] text-left" valueClass="text-right text-[#202938] font-medium" /></div>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-8 border-t border-[#e5e7eb] pt-6">
        <div className="min-w-0">
          <div className="font-serif text-[13px] text-[var(--accent)] mb-1">Billed to</div>
          <CustomerLines ctx={ctx} nameClass="font-semibold text-[var(--accent)]" />
          {hasShipping(ctx) && <><div className="font-serif text-[13px] text-[var(--accent)] mt-3 mb-1">Shipped to</div><ShipTo ctx={ctx} /></>}
        </div>
        <div className="min-w-0">
          {ctx.inv.customFields.some((f) => f.visible && f.label && f.value) && <>
            <div className="font-serif text-[13px] text-[var(--accent)] mb-1">Details</div>
            <MetaTable rows={metaRows(ctx, { number: false }).slice(metaRows(ctx, { number: false, custom: false }).length)} labelClass="text-[#6b7280]" />
          </>}
        </div>
      </div>
    </div>
  ),
  ContHeader: ({ ctx, page }) => <div className="pt-10 mb-5 flex justify-between text-[11px]"><span className="font-serif text-[15px] text-[var(--accent)]">{ctx.inv.title || 'Invoice'} {ctx.inv.number}</span><span className="text-[#6b7280]">Page {page}</span></div>,
  columns: (ctx) => standardColumns(ctx, { nameClass: 'font-medium text-[var(--accent)]' }),
  table: {
    className: 'w-full',
    theadClass: 'text-[var(--on-accent)] [&_th]:bg-[var(--accent)]',
    thClass: 'px-3 py-2.5 text-[10px] font-medium uppercase tracking-[0.12em]',
    tdClass: 'px-3 py-3 align-top border-b border-[#e5e7eb]',
  },
  summary: (ctx) => [
    <div key="t" className="ml-auto w-[300px]">
      {totalsRows(ctx).map((r, i) => (
        <div key={i} className={cx('flex justify-between px-3 py-1.5', r.strong ? 'bg-[var(--accent)] text-[var(--on-accent)] font-semibold text-[13.5px]' : '', r.muted && 'text-[#6b7280]')}>
          <span className={r.strong ? 'font-serif' : ''}>{r.label}</span><span className="tabular-nums whitespace-nowrap">{r.value}</span>
        </div>
      ))}
    </div>,
    ...tailBlocks(ctx, { titleClass: 'font-serif text-[13px] text-[var(--accent)] mb-1', labelClass: 'text-[#6b7280]', thanksClass: 'font-serif text-[16px] text-[var(--accent)]' }),
  ],
  Footer: ({ ctx, page, pageCount }) => <FooterText ctx={ctx} page={page} pageCount={pageCount} className="border-t border-[var(--accent)] pt-2 text-[10px] text-[#6b7280]" />,
}
export default elegant
