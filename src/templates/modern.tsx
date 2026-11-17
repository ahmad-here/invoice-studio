import type { TemplateDef } from './types'
import { BusinessLines, CustomerLines, FooterText, Logo, PaymentBlock, ShipTo, amountDue, hasPayment, hasShipping, justify, logoAlign, metaRows, standardColumns, tailBlocks, totalsRows, cx, STATUS_LABEL } from './shared'

/** Modern Business — light-blue panel, amount-due card, totals and payment side by side. */
const modern: TemplateDef = {
  meta: { id: 'modern', name: 'Modern Business', description: 'Contemporary panels with a distinctive amount-due card.', bestFor: 'Startups, SaaS, tech services' },
  accent: '#0692F4',
  pad: { x: 48, top: 44, bottom: 56 },
  gap: 18,
  rootClass: 'font-sans text-[11.5px] leading-[1.5] text-[#202938]',
  Header: ({ ctx }) => (
    <div className="pb-6">
      <div className="flex justify-between items-center gap-6">
        <div className="flex items-center gap-3 min-w-0" style={{ justifyContent: justify(logoAlign(ctx) === 'right' ? 'left' : logoAlign(ctx)) }}>
          <Logo ctx={ctx} max={48} />
          <div className="text-[16px] font-bold truncate">{ctx.inv.business.name}</div>
        </div>
        <div className="text-[11px] text-[#6b7280] shrink-0">{ctx.inv.title || 'Invoice'} <b className="text-[#202938]">{ctx.inv.number}</b></div>
      </div>
      <div className="mt-6 rounded-2xl bg-[#EAF5FF] p-6 grid grid-cols-[1fr_1fr_auto] gap-6">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280] mb-1">Billed to</div>
          <CustomerLines ctx={ctx} nameClass="font-bold text-[13px]" />
          {hasShipping(ctx) && <><div className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280] mt-2 mb-0.5">Ship to</div><ShipTo ctx={ctx} /></>}
        </div>
        <div className="min-w-0 space-y-1.5">
          {metaRows(ctx, { number: false }).map(([k, v]) => <div key={k}><span className="text-[#6b7280]">{k}: </span><span className="font-semibold break-words whitespace-pre-line">{v}</span></div>)}
        </div>
        <div className="rounded-xl bg-white px-5 py-4 text-right shadow-[0_1px_3px_rgba(0,0,0,0.08)] self-start min-w-[170px]">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280]">Amount due</div>
          <div className="text-[22px] font-extrabold tabular-nums" style={{ color: ctx.accent }}>{amountDue(ctx)}</div>
          <div className="text-[10px] text-[#6b7280]">{ctx.inv.status === 'paid' ? 'Paid in full' : `Due ${ctx.date(ctx.inv.dueDate)}`}</div>
          {ctx.inv.status !== 'draft' && ctx.inv.status !== 'sent' && <div className={cx('mt-1 text-[10px] font-bold uppercase', ctx.inv.status === 'overdue' ? 'text-[#BB2631]' : 'text-[#6b7280]')}>{STATUS_LABEL[ctx.inv.status]}</div>}
        </div>
      </div>
      <div className="mt-4 text-[10.5px] text-[#6b7280]"><BusinessLines ctx={ctx} showName={false} className="[&>div]:inline [&>div:not(:last-child)]:after:content-['_·_']" /></div>
    </div>
  ),
  ContHeader: ({ ctx, page }) => <div className="mb-4 rounded-lg bg-[#EAF5FF] px-4 py-2 text-[11px] flex justify-between"><b>{ctx.inv.business.name}</b><span className="text-[#6b7280]">{ctx.inv.number} · page {page}</span></div>,
  columns: (ctx) => standardColumns(ctx),
  table: {
    className: 'w-full',
    theadClass: '',
    thClass: 'px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#6b7280] border-b border-[#E5E7EB]',
    tdClass: 'px-3 py-3 align-top border-b border-[#F3F4F6]',
  },
  summary: (ctx) => [
    <div key="t" className="grid grid-cols-[1fr_300px] gap-6 items-start">
      <div className="min-w-0">{hasPayment(ctx) && <PaymentBlock ctx={ctx} className="rounded-xl border border-[#E5E7EB] p-4" titleClass="text-[10px] font-semibold uppercase tracking-wider mb-1 text-[var(--accent)]" labelClass="text-[#6b7280]" />}</div>
      <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
        {totalsRows(ctx).map((r, i) => (
          <div key={i} className={cx('flex justify-between px-4 py-1.5', r.strong ? 'bg-[var(--accent)] text-[var(--on-accent)] font-bold text-[13px] py-2.5' : '', r.muted && 'text-[#6b7280]')}>
            <span>{r.label}</span><span className="tabular-nums">{r.value}</span>
          </div>
        ))}
      </div>
    </div>,
    ...tailBlocks(ctx, { titleClass: 'text-[10px] font-semibold uppercase tracking-wider mb-1 text-[#6b7280]', labelClass: 'text-[#6b7280]', thanksClass: 'font-semibold text-[var(--accent)]', payment: false }),
  ],
  Footer: ({ ctx, page, pageCount }) => <FooterText ctx={ctx} page={page} pageCount={pageCount} className="text-[10px] text-[#6b7280]" />,
}
export default modern
