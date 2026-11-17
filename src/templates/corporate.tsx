import type { TemplateDef } from './types'
import { BusinessLines, CustomerLines, FooterText, Logo, ShipTo, hasShipping, metaRows, standardColumns, tailBlocks, totalsRows, cx } from './shared'

/** Corporate Blue — solid branded header band, blue table head and total bar. */
const corporate: TemplateDef = {
  meta: { id: 'corporate', name: 'Corporate Blue', description: 'Branded blue header band with an organised financial summary.', bestFor: 'Agencies, B2B companies' },
  accent: '#0692F4',
  pad: { x: 48, top: 0, bottom: 60 },
  gap: 18,
  rootClass: 'font-sans text-[11.5px] leading-[1.5] text-[#202938]',
  Header: ({ ctx }) => (
    <div className="pb-6">
      <div className="-mx-[48px] px-[48px] pt-10 pb-8 text-[var(--on-accent)] flex justify-between items-start gap-8" style={{ background: ctx.accent }}>
        <div className="min-w-0">
          {ctx.inv.business.logo && <div className="bg-white rounded-md p-2 inline-block mb-3"><Logo ctx={ctx} max={56} /></div>}
          <div className="text-[18px] font-bold">{ctx.inv.business.name}</div>
          <BusinessLines ctx={ctx} showName={false} className="text-[11px] text-[var(--on-accent)]" />
        </div>
        <div className="text-right shrink-0">
          <div className="text-[34px] font-extrabold uppercase leading-none tracking-wide">{ctx.inv.title || 'Invoice'}</div>
          <div className="mt-2 text-[13px] text-[var(--on-accent)]">No. {ctx.inv.number}</div>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_1fr_1.1fr] gap-6 pt-7">
        <div className="min-w-0">
          <div className="text-[10.5px] font-bold uppercase tracking-wider mb-1" style={{ color: ctx.accent }}>Bill to</div>
          <CustomerLines ctx={ctx} nameClass="font-semibold text-[13px]" />
        </div>
        <div className="min-w-0">
          {hasShipping(ctx) && <><div className="text-[10.5px] font-bold uppercase tracking-wider mb-1" style={{ color: ctx.accent }}>Ship to</div><ShipTo ctx={ctx} /></>}
        </div>
        <div className="rounded-md bg-[#EAF5FF] p-3">
          {metaRows(ctx, { number: false }).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 py-0.5"><span className="text-[#6b7280]">{k}</span><span className="font-semibold text-[#202938] text-right break-words min-w-0 whitespace-pre-line">{v}</span></div>
          ))}
        </div>
      </div>
    </div>
  ),
  ContHeader: ({ ctx, page }) => (
    <div className="-mx-[48px] px-[48px] py-3 mb-5 text-[var(--on-accent)] text-[11px] flex justify-between" style={{ background: ctx.accent }}><span className="font-semibold">{ctx.inv.business.name}</span><span>Invoice {ctx.inv.number} · page {page}</span></div>
  ),
  columns: (ctx) => standardColumns(ctx, { index: true }),
  table: {
    className: 'w-full',
    theadClass: 'text-[var(--on-accent)] [&_th]:bg-[var(--accent)]',
    thClass: 'px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wide',
    tdClass: 'px-3 py-2.5 align-top border-b border-[#e5e7eb]',
    rowClass: (i) => (i % 2 ? 'bg-[#F7F9FC]' : ''),
  },
  summary: (ctx) => [
    <div key="t" className="ml-auto w-[320px]">
      {totalsRows(ctx).map((r, i) => (
        <div key={i} className={cx('flex justify-between px-3 py-1.5', r.strong ? 'text-[var(--on-accent)] font-bold text-[13.5px] mt-1 rounded-sm' : 'border-b border-[#e5e7eb]', r.muted && 'text-[#6b7280]')} style={r.strong ? { background: ctx.accent } : undefined}>
          <span>{r.label}</span><span className="tabular-nums whitespace-nowrap">{r.value}</span>
        </div>
      ))}
    </div>,
    ...tailBlocks(ctx, { titleClass: 'text-[10.5px] font-bold uppercase tracking-wider mb-1 text-[var(--accent)]', labelClass: 'text-[#6b7280]', thanksClass: 'font-semibold text-[var(--accent)]' }),
  ],
  Footer: ({ ctx, page, pageCount }) => <FooterText ctx={ctx} page={page} pageCount={pageCount} className="border-t-2 border-[var(--accent)] pt-2 text-[10px] text-[#6b7280]" />,
}
export default corporate
