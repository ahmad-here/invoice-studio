import type { TemplateDef } from './types'
import { BusinessLines, CustomerLines, FooterText, Logo, TotalsTable, discountText, justify, logoAlign, metaRows, pct, qtyText, tailBlocks } from './shared'
import { formatNumber } from '@/lib/money'

/** Retail Invoice — product-focused; SKU, qty, price, discount and tax always visible. */
const retail: TemplateDef = {
  meta: { id: 'retail', name: 'Retail Invoice', description: 'Product-focused table with SKU, discount and tax columns.', bestFor: 'Shops, e-commerce, distributors' },
  accent: '#0692F4',
  pad: { x: 44, top: 44, bottom: 56 },
  gap: 16,
  rootClass: 'font-sans text-[11px] leading-[1.45] text-[#202938]',
  Header: ({ ctx }) => {
    const c = ctx.inv.customer
    const ship = !c.hidden.includes('shippingAddress') && c.shippingAddress
    return (
      <div className="pb-5">
        <div className="flex mb-3" style={{ justifyContent: justify(logoAlign(ctx)) }}><Logo ctx={ctx} max={60} /></div>
        <div className="flex justify-between items-end gap-6 pb-3 border-b border-[#202938]">
          <BusinessLines ctx={ctx} nameClass="text-[17px] font-extrabold uppercase tracking-wide" className="text-[10.5px] text-[#4b5563] min-w-0" />
          <div className="text-right shrink-0">
            <div className="inline-block px-3 py-1 text-[var(--on-accent)] text-[13px] font-bold uppercase tracking-[0.1em]" style={{ background: ctx.accent }}>{ctx.inv.title || 'Sales invoice'}</div>
            <div className="mt-2 font-mono text-[12px]">{ctx.inv.number}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-0 mt-4 border border-[#d1d5db]">
          <div className="p-3 min-w-0"><div className="text-[9.5px] font-bold uppercase text-[#6b7280] mb-1">Sold to</div><CustomerLines ctx={ctx} nameClass="font-bold" /></div>
          <div className="p-3 border-l border-[#d1d5db] min-w-0"><div className="text-[9.5px] font-bold uppercase text-[#6b7280] mb-1">Ship to</div><div className="whitespace-pre-line break-words">{ship || 'Same as billing'}</div></div>
          <div className="p-3 border-l border-[#d1d5db] bg-[#F7F9FC] min-w-0">
            {metaRows(ctx, { number: false }).map(([k, v]) => <div key={k} className="flex justify-between gap-2"><span className="text-[#6b7280]">{k}</span><span className="font-semibold text-right break-words min-w-0">{v}</span></div>)}
          </div>
        </div>
      </div>
    )
  },
  ContHeader: ({ ctx, page }) => <div className="mb-3 flex justify-between font-mono text-[10px] text-[#6b7280]"><span>{ctx.inv.number}</span><span>PAGE {page}</span></div>,
  columns: (ctx) => [
    { key: 'sku', label: 'SKU', width: '12%', render: (it) => <span className="font-mono text-[10px] break-all">{it.sku || '—'}</span> },
    { key: 'item', label: 'Product', render: (it) => <div className="break-words"><div className="font-semibold">{it.name || ' '}</div>{it.description && <div className="text-[10px] text-[#6b7280] whitespace-pre-line">{it.description}</div>}</div> },
    { key: 'qty', label: 'Qty', align: 'right', width: '9%', render: (it) => qtyText(ctx, it) },
    { key: 'price', label: 'Unit price', align: 'right', width: '13%', render: (it) => ctx.money(it.unitPrice) },
    { key: 'disc', label: 'Discount', align: 'right', width: '10%', render: (it, l) => discountText(ctx, it, l) },
    { key: 'tax', label: 'Tax', align: 'right', width: '8%', render: (it) => (ctx.inv.taxMode === 'item' ? pct(it.taxRate) : pct(ctx.inv.invoiceTaxRate)) },
    { key: 'amt', label: 'Total', align: 'right', width: '14%', render: (_it, l) => <b>{ctx.money(l.total)}</b> },
  ],
  table: {
    className: 'w-full border border-[#d1d5db]',
    theadClass: 'bg-[#202938] text-white',
    thClass: 'px-2 py-1.5 text-[9.5px] font-bold uppercase tracking-wide',
    tdClass: 'px-2 py-2 align-top border-b border-[#e5e7eb]',
  },
  summary: (ctx) => [
    <div key="t" className="flex justify-between items-start gap-6">
      <div className="text-[10.5px] text-[#6b7280] pt-1">
        {ctx.inv.items.length} line{ctx.inv.items.length === 1 ? '' : 's'} · {formatNumber(ctx.inv.items.reduce((a, i) => a + (Number.isFinite(i.quantity) ? i.quantity : 0), 0), ctx.prefs.locale)} units
        {ctx.totals.totalDiscount > 0 && <div className="mt-1 font-semibold" style={{ color: ctx.accent }}>You saved {ctx.money(ctx.totals.totalDiscount)}</div>}
      </div>
      <TotalsTable ctx={ctx} width={280} className="border border-[#d1d5db]" rowClass="[&>td]:px-3 border-b border-[#e5e7eb]" strongClass="[&>td]:px-3 font-extrabold text-[13px] bg-[#EAF5FF]" />
    </div>,
    ...tailBlocks(ctx, { titleClass: 'text-[9.5px] font-bold uppercase text-[#6b7280] mb-1', labelClass: 'text-[#6b7280]', thanksClass: 'text-center font-bold uppercase tracking-wider pt-2' }),
  ],
  Footer: ({ ctx, page, pageCount }) => <FooterText ctx={ctx} page={page} pageCount={pageCount} className="text-[9.5px] text-[#6b7280] border-t border-dashed pt-1" />,
}
export default retail
