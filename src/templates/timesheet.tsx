import type { TemplateDef } from './types'
import { BusinessLines, Cap, CustomerLines, DetailGrid, FooterText, Logo, TotalsTable, amountDue, baseMetaRows, docTitle, findField, otherFieldRows, tailBlocks, totalQty } from './shared'
import { formatNumber } from '@/lib/money'

const USED = [/period|billing period/i, /project/i]

/** Hourly Timesheet — tasks × hours × rate, total hours and effective rate highlighted. */
const timesheet: TemplateDef = {
  meta: { id: 'timesheet', name: 'Hourly Timesheet', description: 'Tasks, hours and hourly rate with total hours highlighted.', bestFor: 'Freelancers, consultants, hourly billing', category: 'Industry', fields: ['Billing period', 'Project'] },
  accent: '#7048E8',
  pad: { x: 56, top: 52, bottom: 58 },
  gap: 18,
  rootClass: 'font-sans text-[11px] leading-[1.55] text-[#202938]',
  Header: ({ ctx }) => {
    const hours = totalQty(ctx)
    return (
      <div className="pb-6">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0"><Logo ctx={ctx} max={48} style={{ marginBottom: 8 }} /><BusinessLines ctx={ctx} nameClass="text-[15px] font-bold" className="text-[#4b5563]" /></div>
          <div className="shrink-0 text-right">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: ctx.accent }}>{docTitle(ctx, 'Timesheet Invoice')}</div>
            <div className="text-[20px] font-bold">#{ctx.inv.number}</div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[['Total hours', formatNumber(hours, ctx.prefs.locale, 2)], ['Effective rate', hours > 0 ? `${ctx.money(Math.round(ctx.totals.subtotal / hours))}/hr` : '—'], [ctx.totals.amountPaid ? 'Balance due' : 'Amount due', amountDue(ctx)]].map(([k, v], i) => (
            <div key={k} className="rounded-xl px-4 py-3" style={i === 2 ? { background: ctx.accent, color: ctx.onAccent } : { background: '#F4F1FE' }}>
              <div className={`text-[10px] font-semibold uppercase tracking-wide ${i === 2 ? '' : 'text-[#6b7280]'}`}>{k}</div>
              <div className="text-[18px] font-bold tabular-nums">{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div className="min-w-0"><Cap className="mb-1">Client</Cap><CustomerLines ctx={ctx} nameClass="font-semibold text-[12px]" /></div>
          <DetailGrid rows={[...baseMetaRows(ctx), ['Billing period', findField(ctx, /period/i)], ['Project', findField(ctx, /project/i)], ...otherFieldRows(ctx, USED)].filter(([, v]) => v) as [string, string][]} />
        </div>
      </div>
    )
  },
  ContHeader: ({ ctx, page }) => <div className="mb-4 flex justify-between text-[10.5px] text-[#6b7280]"><b className="min-w-0 truncate text-[#202938]">{ctx.inv.business.name} · Timesheet #{ctx.inv.number}</b><span className="shrink-0">Page {page}</span></div>,
  columns: (ctx) => [
    { key: 'n', label: '#', width: '5%', render: (_i, _l, idx) => <span className="text-[#6b7280]">{idx + 1}</span> },
    { key: 'task', label: 'Task / work performed', render: (it) => <div className="[overflow-wrap:anywhere]"><div className="font-semibold">{it.name || ' '}</div>{it.description && <div className="whitespace-pre-line text-[10px] text-[#6b7280]">{it.description}</div>}</div> },
    { key: 'h', label: 'Hours', align: 'right', width: '11%', render: (it) => formatNumber(it.quantity, ctx.prefs.locale, 2) },
    { key: 'r', label: 'Rate / hr', align: 'right', width: '15%', render: (it) => ctx.money(it.unitPrice) },
    { key: 'a', label: 'Amount', align: 'right', width: '16%', render: (_i, l) => <b>{ctx.money(l.total)}</b> },
  ],
  table: { className: 'w-full', theadClass: '', thClass: 'border-b-2 border-[var(--accent)] px-2 pb-2 text-[10px] font-semibold uppercase tracking-wide text-[#6b7280]', tdClass: 'px-2 py-2.5 align-top border-b border-[#ECE8FB]' },
  summary: (ctx) => [
    <div key="t" className="flex items-start justify-between gap-6">
      <div className="text-[11px] text-[#6b7280]"><b className="text-[#202938] tabular-nums">{formatNumber(totalQty(ctx), ctx.prefs.locale, 2)} hours</b> across {ctx.inv.items.length} task{ctx.inv.items.length === 1 ? '' : 's'}</div>
      <TotalsTable ctx={ctx} width={280} strongClass="font-bold text-[13.5px] [&>td]:border-t-2 [&>td]:border-[var(--accent)] [&>td]:pt-2" />
    </div>,
    ...tailBlocks(ctx, { titleClass: 'text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)] mb-1', labelClass: 'text-[#6b7280]', thanksClass: 'font-semibold' }),
  ],
  Footer: ({ ctx, page, pageCount }) => <FooterText ctx={ctx} page={page} pageCount={pageCount} className="text-[9.5px] text-[#6b7280]" />,
}
export default timesheet
