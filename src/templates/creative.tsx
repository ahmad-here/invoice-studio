import type { TemplateDef } from './types'
import { BusinessLines, CustomerLines, FooterText, Logo, ShipTo, amountDue, hasShipping, justify, logoAlign, metaRows, standardColumns, tailBlocks, totalsRows, cx } from './shared'

/** Creative Studio — accent side band, bold display heading, rounded summary card. */
const creative: TemplateDef = {
  meta: { id: 'creative', name: 'Creative Studio', description: 'Bold display heading, side accent band and rounded total card.', bestFor: 'Studios, photographers, creatives' },
  accent: '#BB2631',
  pad: { x: 60, top: 54, bottom: 60 },
  gap: 20,
  rootClass: 'font-sans text-[11.5px] leading-[1.55] text-[#202938]',
  Background: ({ ctx }) => <div className="absolute left-0 top-0 bottom-0 w-[14px]" style={{ background: ctx.accent }} />,
  Header: ({ ctx }) => (
    <div className="pb-7">
      <div className="flex justify-between items-start gap-6">
        <div className="text-[46px] font-black leading-[0.95] tracking-[-0.02em]">{ctx.inv.title || 'Invoice'}<span style={{ color: ctx.accent }}>.</span></div>
        <div className="flex-1 flex" style={{ justifyContent: justify(logoAlign(ctx) === 'left' ? 'right' : logoAlign(ctx)) }}><Logo ctx={ctx} max={84} /></div>
      </div>
      <div className="mt-2 text-[13px] text-[#6b7280]">#{ctx.inv.number}</div>
      <div className="grid grid-cols-2 gap-8 mt-8">
        <div className="min-w-0">
          <div className="text-[11px] font-bold mb-1" style={{ color: ctx.accent }}>Hello,</div>
          <CustomerLines ctx={ctx} nameClass="text-[16px] font-bold" />
          {hasShipping(ctx) && <div className="mt-2"><span className="text-[10px] font-bold uppercase text-[#6b7280]">Ship to </span><ShipTo ctx={ctx} /></div>}
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-bold mb-1" style={{ color: ctx.accent }}>From</div>
          <BusinessLines ctx={ctx} nameClass="text-[13px] font-bold" />
        </div>
      </div>
      <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3">
        {metaRows(ctx, { number: false }).map(([k, v]) => (
          <div key={k} className="min-w-0 max-w-[45%]"><div className="text-[10px] font-bold uppercase tracking-wide text-[#6b7280]">{k}</div><div className="font-semibold break-words whitespace-pre-line">{v}</div></div>
        ))}
      </div>
    </div>
  ),
  ContHeader: ({ ctx, page }) => <div className="mb-5 text-[13px] font-black">{ctx.inv.title || 'Invoice'}<span style={{ color: ctx.accent }}>.</span> <span className="font-normal text-[#6b7280] text-[11px]">#{ctx.inv.number} · page {page}</span></div>,
  columns: (ctx) => standardColumns(ctx, { nameClass: 'font-bold' }),
  table: {
    className: 'w-full',
    theadClass: '',
    thClass: 'pb-2 text-[10px] font-bold uppercase tracking-wide text-[#6b7280] border-b-2 border-[#202938]',
    tdClass: 'py-3 align-top border-b border-dashed border-[#d1d5db]',
  },
  summary: (ctx) => [
    <div key="t" className="flex justify-end">
      <div className="w-[330px] rounded-2xl bg-[#F7F9FC] p-5">
        {totalsRows(ctx).filter((r) => !r.strong).map((r, i) => (
          <div key={i} className={cx('flex justify-between py-1', r.muted && 'text-[#6b7280]')}><span>{r.label}</span><span className="tabular-nums">{r.value}</span></div>
        ))}
        <div className="mt-3 rounded-xl px-4 py-3 text-[var(--on-accent)] flex justify-between items-baseline" style={{ background: ctx.accent }}>
          <span className="font-bold">{ctx.totals.amountPaid ? 'Balance due' : 'Total due'}</span>
          <span className="text-[18px] font-black tabular-nums">{amountDue(ctx)}</span>
        </div>
      </div>
    </div>,
    ...tailBlocks(ctx, { titleClass: 'text-[11px] font-bold mb-1 text-[var(--accent)]', labelClass: 'text-[#6b7280]', thanksClass: 'text-[18px] font-black' }),
  ],
  Footer: ({ ctx, page, pageCount }) => <FooterText ctx={ctx} page={page} pageCount={pageCount} className="text-[10px] text-[#6b7280]" />,
}
export default creative
