import type { TemplateDef } from './types'
import { CustomerLines, FooterText, Lines, Logo, ShipTo, amountDue, hasShipping, metaRows, standardColumns, tailBlocks, totalsRows, cx } from './shared'

/** Highlight — accent total bar up top, labelled info columns, item rows as soft rounded cards. */
const Label = ({ children }: { children: React.ReactNode }) => <div className="text-[9.5px] font-medium uppercase tracking-[0.06em] text-[#6b7280] mb-0.5">{children}</div>

const highlight: TemplateDef = {
  meta: { id: 'highlight', name: 'Highlight', description: 'Bold total-amount bar with soft card rows.', bestFor: 'Agencies, SaaS, modern brands' },
  accent: '#0692F4',
  pad: { x: 52, top: 48, bottom: 58 },
  gap: 18,
  rootClass: 'font-sans text-[11px] leading-[1.5] text-[#202938]',
  Header: ({ ctx }) => {
    const b = ctx.inv.business
    return (
      <div className="pb-6">
        <div className="grid grid-cols-[1.1fr_1fr_1fr] gap-6 items-start">
          <div className="min-w-0">
            <Logo ctx={ctx} max={46} style={{ marginBottom: 6 }} />
            <div className="text-[17px] font-extrabold tracking-tight [overflow-wrap:anywhere]">{b.name}</div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">{ctx.inv.title || 'Invoice'} · {ctx.inv.number}</div>
          </div>
          <div className="min-w-0">
            <Label>Company</Label>
            <div className="font-medium [overflow-wrap:anywhere]">{b.name}</div>
            {b.email && <div className="text-[#4b5563] [overflow-wrap:anywhere]">{b.email}</div>}
            {b.phone && <div className="text-[#4b5563]">{b.phone}</div>}
            {b.taxNumber && <div className="text-[#4b5563]">Tax No: {b.taxNumber}</div>}
            {b.vatNumber && <div className="text-[#4b5563]">VAT: {b.vatNumber}</div>}
          </div>
          <div className="min-w-0">
            <Label>Address</Label>
            <Lines text={b.address} className="text-[#4b5563] [overflow-wrap:anywhere]" />
            {b.website && <div className="text-[#4b5563] [overflow-wrap:anywhere]">{b.website}</div>}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-xl px-5 py-3.5" style={{ background: ctx.accent, color: ctx.onAccent }}>
          <span className="text-[12px] font-semibold">{ctx.totals.amountPaid ? 'Balance due' : 'Total amount'}</span>
          <span className="text-[22px] font-extrabold tabular-nums">{amountDue(ctx)}</span>
        </div>

        <div className="mt-6 grid grid-cols-[1.1fr_1fr_1fr] gap-6">
          <div className="min-w-0">
            <Label>Client</Label>
            <CustomerLines ctx={ctx} nameClass="font-semibold text-[12.5px]" />
          </div>
          <div className="min-w-0">
            {hasShipping(ctx) ? <><Label>Ship to</Label><ShipTo ctx={ctx} className="text-[#4b5563] [overflow-wrap:anywhere]" /></> : null}
          </div>
          <div className="min-w-0 space-y-1.5">
            {metaRows(ctx, { number: false }).map(([k, v]) => (
              <div key={k} className="min-w-0"><Label>{k}</Label><div className="font-medium [overflow-wrap:anywhere] whitespace-pre-line">{v}</div></div>
            ))}
          </div>
        </div>
      </div>
    )
  },
  ContHeader: ({ ctx, page }) => (
    <div className="mb-4 flex items-center justify-between rounded-lg px-4 py-2 text-[10.5px]" style={{ background: ctx.accent, color: ctx.onAccent }}>
      <b className="min-w-0 truncate">{ctx.inv.business.name}</b><span className="shrink-0">{ctx.inv.number} · page {page}</span>
    </div>
  ),
  columns: (ctx) => standardColumns(ctx, { nameClass: 'font-semibold', descClass: 'text-[10px] text-[#6b7280] mt-0.5' }),
  table: {
    className: 'w-full',
    theadClass: '',
    thClass: 'px-3 pb-2 text-[10px] font-semibold text-[var(--accent)]',
    // Soft card rows: tinted cells separated by white bottom borders (keeps row heights measurable)
    tdClass: 'px-3 py-2.5 align-top bg-[#F3F7FC] border-b-[6px] border-white first:rounded-l-lg last:rounded-r-lg',
  },
  summary: (ctx) => [
    <div key="t" className="ml-auto w-[290px]">
      {totalsRows(ctx).map((r, i) => (
        <div key={i} className={cx('flex justify-between gap-4 px-3 py-1.5', r.strong ? 'mt-1 rounded-lg font-bold text-[13px]' : '', r.muted && 'text-[#6b7280]')}
          style={r.strong ? { background: ctx.accent, color: ctx.onAccent } : undefined}>
          <span>{r.label}</span><span className="tabular-nums whitespace-nowrap">{r.value}</span>
        </div>
      ))}
    </div>,
    ...tailBlocks(ctx, { titleClass: 'text-[9.5px] font-medium uppercase tracking-[0.06em] text-[#6b7280] mb-1', labelClass: 'text-[#6b7280]', blockClass: 'rounded-xl border border-[#E5E7EB] p-3', thanksClass: 'font-semibold text-[var(--accent)]' }),
  ],
  Footer: ({ ctx, page, pageCount }) => <FooterText ctx={ctx} page={page} pageCount={pageCount} className="text-[9.5px] text-[#6b7280]" />,
}
export default highlight
