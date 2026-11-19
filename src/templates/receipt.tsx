import type { TemplateDef } from './types'
import { FooterText, Lines, Logo, docTitle, findField, otherFieldRows, qtyText, tailBlocks, totalsRows, cx } from './shared'

/** Payment Receipt — centred receipt layout with a PAID stamp, amount received and payment method. */
const receipt: TemplateDef = {
  meta: { id: 'receipt', name: 'Payment Receipt', description: 'Proof of payment with a PAID stamp, amount received and method.', bestFor: 'Shops, cash sales, paid invoices', category: 'Document', fields: ['Transaction ID'] },
  accent: '#2F9E44',
  pad: { x: 150, top: 52, bottom: 58 },
  gap: 14,
  rootClass: 'font-sans text-[11px] leading-[1.5] text-[#202938]',
  Background: ({ ctx }) => (
    <div className="pointer-events-none absolute right-[110px] top-[150px] rotate-[-14deg] rounded-lg border-[3px] px-4 py-1 text-[26px] font-black uppercase tracking-[0.2em] opacity-80" style={{ borderColor: ctx.accent, color: ctx.accent }}>Paid</div>
  ),
  Header: ({ ctx }) => {
    const b = ctx.inv.business, c = ctx.inv.customer
    const received = ctx.totals.amountPaid || ctx.totals.grandTotal
    return (
      <div className="pb-4 text-center">
        <div className="flex justify-center"><Logo ctx={ctx} max={56} style={{ marginBottom: 8 }} /></div>
        <div className="text-[16px] font-bold">{b.name}</div>
        <Lines text={b.address} className="text-[#6b7280]" />
        {(b.phone || b.email) && <div className="text-[#6b7280]">{[b.phone, b.email].filter(Boolean).join(' · ')}</div>}
        <div className="my-5 border-t border-dashed border-[#9ca3af]" />
        <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#6b7280]">{docTitle(ctx, 'Payment Receipt')}</div>
        <div className="mt-1 text-[30px] font-extrabold tabular-nums" style={{ color: ctx.accent }}>{ctx.money(received)}</div>
        <div className="text-[#6b7280]">received with thanks</div>
        <div className="mt-4 grid grid-cols-2 gap-y-1 text-left">
          {([
            ['Receipt no.', ctx.inv.number], ['Date', ctx.date(ctx.inv.issueDate)],
            ['Received from', c.name || c.company], ['Payment method', ctx.inv.payment.method || '—'],
            ['Transaction ID', findField(ctx, /transaction|txn|reference no/i)], ['For', ctx.inv.reference || ctx.inv.poNumber],
            ...otherFieldRows(ctx, [/transaction|txn|reference no/i]),
          ] as [string, string][]).filter(([, v]) => v).flatMap(([k, v]) => [<div key={k + 'k'} className="text-[#6b7280]">{k}</div>, <div key={k + 'v'} className="text-right font-medium [overflow-wrap:anywhere]">{v}</div>])}
        </div>
        <div className="mt-5 border-t border-dashed border-[#9ca3af]" />
      </div>
    )
  },
  ContHeader: ({ ctx, page }) => <div className="mb-3 text-center text-[10px] text-[#6b7280]">Receipt {ctx.inv.number} · page {page}</div>,
  columns: (ctx) => [
    { key: 'd', label: 'Item', render: (it) => <div className="[overflow-wrap:anywhere]">{it.name || ' '}<span className="text-[#6b7280]"> × {qtyText(ctx, it)}</span></div> },
    { key: 'a', label: 'Amount', align: 'right', width: '32%', render: (_i, l) => ctx.money(l.total) },
  ],
  table: { className: 'w-full', theadClass: '', thClass: 'pb-1.5 text-[9.5px] font-semibold uppercase tracking-wide text-[#6b7280] border-b border-[#e5e7eb]', tdClass: 'py-1.5 align-top border-b border-dotted border-[#d1d5db]' },
  summary: (ctx) => [
    <div key="t">
      {totalsRows(ctx).map((r, i) => (
        <div key={i} className={cx('flex justify-between gap-4 py-1', r.strong && 'border-t border-[#202938] pt-2 text-[13px] font-bold', r.muted && 'text-[#6b7280]')}><span>{r.label}</span><span className="tabular-nums">{r.value}</span></div>
      ))}
    </div>,
    ...tailBlocks(ctx, { titleClass: 'text-[9.5px] font-semibold uppercase tracking-wide text-[#6b7280]', labelClass: 'text-[#6b7280]', thanksClass: 'pt-2 text-center font-semibold', payment: false, skip: ['Payment terms'] }),
  ],
  Footer: ({ ctx, page, pageCount }) => <FooterText ctx={ctx} page={page} pageCount={pageCount} className="text-center text-[9.5px] text-[#6b7280]" />,
}
export default receipt
