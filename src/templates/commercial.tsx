import type { TemplateDef } from './types'
import { BusinessLines, Cap, CustomerLines, DetailGrid, FooterText, Lines, Logo, SignatureLine, docTitle, findField, otherFieldRows, qtyText, tailBlocks, TotalsTable } from './shared'

const USED = [/origin/i, /incoterm/i, /transport|shipping method|mode/i, /weight/i, /packages?|cartons?/i, /awb|bill of lading|tracking|b\/l/i, /export reason|reason for export/i, /port/i]

/** Commercial Invoice (export) — shipper/consignee, shipment details, HS codes, declaration + signature. */
const commercial: TemplateDef = {
  meta: { id: 'commercial', name: 'Commercial Invoice (Export)', description: 'Customs-ready: shipper, consignee, HS codes, origin, Incoterms and declaration.', bestFor: 'Exporters, international shipping', category: 'Document', fields: ['Country of origin', 'Incoterms', 'Mode of transport', 'Gross weight', 'Number of packages', 'AWB / B/L number', 'Reason for export'] },
  accent: '#364FC7',
  pad: { x: 40, top: 40, bottom: 52 },
  gap: 12,
  rootClass: 'font-sans text-[10.5px] leading-[1.45] text-[#111827]',
  Header: ({ ctx }) => (
    <div className="pb-4">
      <div className="flex items-end justify-between gap-4 border-b-2 pb-2" style={{ borderColor: ctx.accent }}>
        <div className="flex min-w-0 items-center gap-3"><Logo ctx={ctx} max={40} /><div className="truncate text-[14px] font-bold">{ctx.inv.business.name}</div></div>
        <div className="shrink-0 text-right"><div className="text-[18px] font-extrabold uppercase tracking-wide" style={{ color: ctx.accent }}>{docTitle(ctx, 'Commercial Invoice')}</div><div>No. <b>{ctx.inv.number}</b> · {ctx.date(ctx.inv.issueDate)}</div></div>
      </div>
      <div className="mt-3 grid grid-cols-2 border border-[#9ca3af]">
        <div className="min-w-0 border-r border-[#9ca3af] p-2.5"><Cap className="mb-0.5">Shipper / exporter</Cap><BusinessLines ctx={ctx} nameClass="font-bold" /></div>
        <div className="min-w-0 p-2.5"><Cap className="mb-0.5">Consignee</Cap><CustomerLines ctx={ctx} nameClass="font-bold" /></div>
        {!ctx.inv.customer.hidden.includes('shippingAddress') && ctx.inv.customer.shippingAddress && (
          <div className="col-span-2 min-w-0 border-t border-[#9ca3af] p-2.5"><Cap className="mb-0.5">Delivery address / notify party</Cap><Lines text={ctx.inv.customer.shippingAddress} /></div>
        )}
      </div>
      <div className="mt-3 rounded border border-[#9ca3af] bg-[#F8F9FA] p-2.5">
        <DetailGrid cols={4} rows={[
          ['Country of origin', findField(ctx, /origin/i)], ['Incoterms', findField(ctx, /incoterm/i)], ['Transport', findField(ctx, /transport|shipping method|mode/i)], ['AWB / B/L', findField(ctx, /awb|bill of lading|tracking|b\/l/i)],
          ['Gross weight', findField(ctx, /weight/i)], ['Packages', findField(ctx, /packages?|cartons?/i)], ['Currency', ctx.inv.currency], ['Reason for export', findField(ctx, /export reason|reason for export/i)],
          ...(ctx.inv.poNumber ? [['PO number', ctx.inv.poNumber] as [string, string]] : []), ...otherFieldRows(ctx, USED),
        ]} />
      </div>
    </div>
  ),
  ContHeader: ({ ctx, page }) => <div className="mb-3 flex justify-between border-b border-[#9ca3af] pb-1 text-[10px]"><b className="min-w-0 truncate">Commercial Invoice {ctx.inv.number}</b><span className="shrink-0">Page {page}</span></div>,
  columns: (ctx) => [
    { key: 'n', label: '#', width: '5%', render: (_i, _l, idx) => idx + 1 },
    { key: 'd', label: 'Description of goods', render: (it) => <div className="[overflow-wrap:anywhere]"><div className="font-semibold">{it.name || ' '}</div>{it.description && <div className="whitespace-pre-line text-[9.5px] text-[#4b5563]">{it.description}</div>}</div> },
    { key: 'hs', label: 'HS code', width: '12%', render: (it) => <span className="font-mono text-[9.5px]">{it.sku || '—'}</span> },
    { key: 'q', label: 'Qty', align: 'right', width: '10%', render: (it) => qtyText(ctx, it) },
    { key: 'u', label: 'Unit value', align: 'right', width: '14%', render: (it) => ctx.money(it.unitPrice) },
    { key: 't', label: 'Total value', align: 'right', width: '15%', render: (_i, l) => <b>{ctx.money(l.total)}</b> },
  ],
  table: { className: 'w-full border border-[#9ca3af]', theadClass: 'bg-[#EDF2FF]', thClass: 'border-b border-[#9ca3af] px-2 py-1.5 text-[9.5px] font-bold uppercase', tdClass: 'px-2 py-1.5 align-top border-b border-[#e5e7eb]' },
  summary: (ctx) => [
    <TotalsTable key="t" ctx={ctx} width={270} className="border border-[#9ca3af]" rowClass="[&>td]:px-2.5 border-b border-[#e5e7eb]" strongClass="[&>td]:px-2.5 font-bold bg-[#EDF2FF]" />,
    ...tailBlocks(ctx, { titleClass: 'text-[9px] font-bold uppercase text-[#4b5563] mb-0.5', labelClass: 'text-[#4b5563]', thanksClass: 'hidden' }),
    <div key="decl" className="flex items-end justify-between gap-6 rounded border border-[#9ca3af] p-3">
      <p className="max-w-[60%] text-[10px] text-[#374151]">I declare that the information on this invoice is true and correct, and that the contents of this shipment are as stated above.</p>
      <SignatureLine label={`Signature & date — ${ctx.inv.business.name || 'Exporter'}`} />
    </div>,
  ],
  Footer: ({ ctx, page, pageCount }) => <FooterText ctx={ctx} page={page} pageCount={pageCount} className="text-[9px] text-[#4b5563]" />,
}
export default commercial
