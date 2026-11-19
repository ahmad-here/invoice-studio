import type { TemplateDef } from './types'
import { BusinessLines, Cap, CustomerLines, DetailGrid, FooterText, Logo, docTitle, findField, otherFieldRows, standardColumns, tailBlocks, totalsRows, cx } from './shared'

const USED = [/original|against invoice|invoice ref/i, /reason/i]

/** Credit Note — references the original invoice and shows amounts as a credit. */
const creditnote: TemplateDef = {
  meta: { id: 'creditnote', name: 'Credit Note', description: 'Refunds and adjustments referencing the original invoice.', bestFor: 'Returns, refunds, billing corrections', category: 'Document', fields: ['Original invoice', 'Reason for credit'] },
  accent: '#087F5B',
  pad: { x: 56, top: 52, bottom: 58 },
  gap: 18,
  rootClass: 'font-sans text-[11px] leading-[1.55] text-[#202938]',
  Header: ({ ctx }) => (
    <div className="pb-6">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0"><Logo ctx={ctx} max={48} style={{ marginBottom: 8 }} /><BusinessLines ctx={ctx} nameClass="text-[15px] font-bold" className="text-[#4b5563]" /></div>
        <div className="shrink-0 text-right">
          <div className="text-[26px] font-extrabold tracking-tight" style={{ color: ctx.accent }}>{docTitle(ctx, 'Credit Note')}</div>
          <div className="text-[11px]">No. <b>{ctx.inv.number}</b></div>
          <div className="mt-3 rounded-lg px-4 py-2 text-right" style={{ background: ctx.accent, color: ctx.onAccent }}><div className="text-[10px] font-semibold uppercase tracking-wide">Total credit</div><div className="text-[20px] font-extrabold tabular-nums">{ctx.money(ctx.totals.grandTotal)}</div></div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="min-w-0"><Cap className="mb-1">Credited to</Cap><CustomerLines ctx={ctx} nameClass="font-semibold text-[12px]" /></div>
        <div className="min-w-0 rounded-lg border border-[#C3FAE8] bg-[#E6FCF5] p-3">
          <DetailGrid rows={[
            ['Credit date', ctx.date(ctx.inv.issueDate)],
            ['Against invoice', findField(ctx, /original|against invoice|invoice ref/i) || ctx.inv.reference],
            ['Reason', findField(ctx, /reason/i)],
            ...otherFieldRows(ctx, USED),
          ].filter(([, v], i) => v || i < 2) as [string, string][]} />
        </div>
      </div>
    </div>
  ),
  ContHeader: ({ ctx, page }) => <div className="mb-4 flex justify-between text-[10.5px] text-[#6b7280]"><b className="min-w-0 truncate text-[#202938]">Credit Note {ctx.inv.number}</b><span className="shrink-0">Page {page}</span></div>,
  columns: (ctx) => standardColumns(ctx, { nameClass: 'font-semibold' }).map((c) => (c.key === 'amt' ? { ...c, label: 'Credit', render: (_it, l) => <span>−{ctx.money(l.total)}</span> } : c)),
  table: { className: 'w-full', theadClass: '', thClass: 'border-b-2 border-[var(--accent)] px-2 pb-2 text-[10px] font-semibold uppercase tracking-wide text-[#6b7280]', tdClass: 'px-2 py-2.5 align-top border-b border-[#e5e7eb]' },
  summary: (ctx) => [
    <div key="t" className="ml-auto w-[290px]">
      {totalsRows(ctx).filter((r) => !/paid|balance/i.test(r.label)).map((r, i) => (
        <div key={i} className={cx('flex justify-between gap-4 px-3 py-1.5', r.strong ? 'mt-1 rounded-md font-bold text-[13px]' : 'border-b border-[#f3f4f6]')} style={r.strong ? { background: ctx.accent, color: ctx.onAccent } : undefined}>
          <span>{r.strong ? 'Total credit' : r.label}</span><span className="tabular-nums whitespace-nowrap">{r.strong ? '−' : ''}{r.value}</span>
        </div>
      ))}
    </div>,
    <p key="n" className="text-[10.5px] text-[#4b5563]">This credit note reduces the amount owed on the referenced invoice. It may be applied to future invoices or refunded as agreed.</p>,
    ...tailBlocks(ctx, { titleClass: 'text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#6b7280] mb-1', labelClass: 'text-[#6b7280]', thanksClass: 'font-semibold', payment: false, skip: ['Payment terms'] }),
  ],
  Footer: ({ ctx, page, pageCount }) => <FooterText ctx={ctx} page={page} pageCount={pageCount} className="text-[9.5px] text-[#6b7280]" />,
}
export default creditnote
