import type { TemplateDef } from './types'
import { Cap, FooterText, Lines, Logo, MetaTable, ShipTo, hasShipping, docTitle, metaRows, pct, qtyText, tailBlocks, totalsRows, cx } from './shared'
import { amountInWords } from '@/lib/words'

/** Tax Invoice (GST/VAT) — both tax IDs, tax per line, tax summary by rate, amount in words. */
const taxinvoice: TemplateDef = {
  meta: { id: 'taxinvoice', name: 'Tax Invoice (GST/VAT)', description: 'Compliance layout: tax IDs, tax per line, tax summary and amount in words.', bestFor: 'GST/VAT-registered businesses', category: 'Document', fields: ['Place of supply'] },
  accent: '#1D3557',
  pad: { x: 40, top: 40, bottom: 54 },
  gap: 12,
  rootClass: 'font-sans text-[10.5px] leading-[1.45] text-[#111827]',
  Header: ({ ctx }) => {
    const b = ctx.inv.business, c = ctx.inv.customer
    return (
      <div className="pb-4">
        <div className="border-2 border-[#111827]">
          <div className="border-b-2 border-[#111827] py-1.5 text-center text-[15px] font-extrabold uppercase tracking-[0.2em]" style={{ background: ctx.accent, color: ctx.onAccent }}>{docTitle(ctx, 'Tax Invoice')}</div>
          <div className="grid grid-cols-2">
            <div className="min-w-0 border-r border-[#111827] p-3">
              <div className="mb-1 flex items-center gap-2"><Logo ctx={ctx} max={34} /><div className="text-[13px] font-bold [overflow-wrap:anywhere]">{b.name}</div></div>
              <Lines text={b.address} />
              {(b.phone || b.email) && <div>{[b.phone, b.email].filter(Boolean).join(' · ')}</div>}
              <div className="mt-1 font-semibold">{b.vatNumber ? `VAT/GSTIN: ${b.vatNumber}` : b.taxNumber ? `Tax No: ${b.taxNumber}` : 'Tax registration: —'}</div>
              {b.vatNumber && b.taxNumber && <div>Tax No: {b.taxNumber}</div>}
            </div>
            <div className="min-w-0 p-3"><MetaTable rows={metaRows(ctx)} labelClass="text-[#4b5563]" valueClass="font-semibold" /></div>
          </div>
          <div className="grid grid-cols-2 border-t border-[#111827]">
            <div className="min-w-0 border-r border-[#111827] p-3"><Cap className="mb-0.5">Bill to (recipient)</Cap>
              <div className="font-bold">{c.name || c.company}</div>{c.name && c.company && !c.hidden.includes('company') && <div>{c.company}</div>}
              {!c.hidden.includes('billingAddress') && <Lines text={c.billingAddress} />}
              <div className="mt-1 font-semibold">Recipient tax ID: {(!c.hidden.includes('taxId') && c.taxId) || '—'}</div>
            </div>
            <div className="min-w-0 p-3"><Cap className="mb-0.5">Ship to</Cap>{hasShipping(ctx) ? <ShipTo ctx={ctx} /> : <div className="text-[#6b7280]">Same as billing address</div>}</div>
          </div>
        </div>
      </div>
    )
  },
  ContHeader: ({ ctx, page }) => <div className="mb-3 flex justify-between border-b-2 border-[#111827] pb-1 text-[10px]"><b className="min-w-0 truncate">Tax Invoice {ctx.inv.number}</b><span className="shrink-0">Page {page}</span></div>,
  columns: (ctx) => [
    { key: 'n', label: 'S.No', width: '6%', render: (_i, _l, idx) => idx + 1 },
    { key: 'd', label: 'Description of goods / services', render: (it) => <div className="[overflow-wrap:anywhere]"><div className="font-semibold">{it.name || ' '}</div>{it.description && <div className="whitespace-pre-line text-[9.5px] text-[#4b5563]">{it.description}</div>}</div> },
    ...(ctx.has.sku ? [{ key: 'c', label: 'HSN/SAC', width: '10%', render: (it: (typeof ctx.inv.items)[number]) => it.sku || '—' }] : []),
    { key: 'q', label: 'Qty', align: 'right', width: '8%', render: (it) => qtyText(ctx, it) },
    { key: 'r', label: 'Rate', align: 'right', width: '12%', render: (it) => ctx.money(it.unitPrice) },
    { key: 'tv', label: 'Taxable value', align: 'right', width: '13%', render: (_it, line) => ctx.money(line.taxable) },
    { key: 'tr', label: 'Tax %', align: 'right', width: '7%', render: (it) => pct(ctx.inv.taxMode === 'invoice' ? ctx.inv.invoiceTaxRate : it.taxRate) },
    { key: 'ta', label: 'Tax amt', align: 'right', width: '11%', render: (_it, l) => ctx.money(l.tax) },
    { key: 't', label: 'Total', align: 'right', width: '12%', render: (_it, l) => <b>{ctx.money(l.taxable + l.tax)}</b> },
  ],
  table: { className: 'w-full border border-[#111827]', theadClass: 'bg-[#F1F3F5]', thClass: 'border border-[#111827] px-1.5 py-1.5 text-[9px] font-bold uppercase', tdClass: 'border-x border-[#111827] border-b border-b-[#d1d5db] px-1.5 py-1.5 align-top' },
  summary: (ctx) => [
    <div key="t" className="grid grid-cols-[1fr_270px] gap-4">
      <div className="min-w-0">
        <Cap className="mb-1">Tax summary</Cap>
        <table className="w-full border border-[#111827] text-[10px]"><thead className="bg-[#F1F3F5]"><tr><th className="border border-[#111827] px-2 py-1 text-left">Rate</th><th className="border border-[#111827] px-2 py-1 text-right">Taxable value</th><th className="border border-[#111827] px-2 py-1 text-right">Tax</th></tr></thead>
          <tbody>{(ctx.totals.taxBreakdown.length ? ctx.totals.taxBreakdown : [{ rate: 0, amount: 0 }]).map((b) => {
            const base = ctx.totals.lines.filter((_l, i) => (ctx.inv.taxMode === 'invoice' ? ctx.inv.invoiceTaxRate : ctx.inv.items[i]?.taxRate) === b.rate).reduce((a, l) => a + l.taxable, 0)
            return <tr key={b.rate}><td className="border border-[#111827] px-2 py-1">{pct(b.rate)}</td><td className="border border-[#111827] px-2 py-1 text-right tabular-nums">{ctx.money(base)}</td><td className="border border-[#111827] px-2 py-1 text-right tabular-nums">{ctx.money(b.amount)}</td></tr>
          })}</tbody>
        </table>
        <div className="mt-3 rounded border border-[#111827] px-2 py-1.5"><Cap>Amount in words</Cap><div className="font-semibold">{amountInWords(ctx.totals.grandTotal, ctx.inv.currency)}</div></div>
      </div>
      <div className="border border-[#111827]">
        {totalsRows(ctx).map((r, i) => <div key={i} className={cx('flex justify-between gap-3 border-b border-[#d1d5db] px-2.5 py-1 last:border-b-0', r.strong && 'font-bold text-[12px]')} style={r.strong && r.label === 'Total' ? { background: ctx.accent, color: ctx.onAccent } : undefined}><span>{r.label === 'Total' ? 'Invoice total' : r.label}</span><span className="tabular-nums whitespace-nowrap">{r.value}</span></div>)}
      </div>
    </div>,
    ...tailBlocks(ctx, { titleClass: 'text-[9px] font-bold uppercase text-[#4b5563] mb-0.5', labelClass: 'text-[#4b5563]', blockClass: 'border border-[#d1d5db] p-2', thanksClass: 'text-center font-semibold' }),
    <div key="sig" className="flex justify-end pt-6"><div className="w-[230px] text-center"><div className="text-[10px] font-semibold">For {ctx.inv.business.name || 'the supplier'}</div><div className="mt-8 border-t border-[#111827] pt-1 text-[9.5px] text-[#4b5563]">Authorised signatory</div></div></div>,
  ],
  Footer: ({ ctx, page, pageCount }) => <FooterText ctx={ctx} page={page} pageCount={pageCount} className="text-[9px] text-[#4b5563]" />,
}
export default taxinvoice
