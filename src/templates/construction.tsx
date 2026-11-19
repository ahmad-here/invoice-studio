import type { TemplateDef } from './types'
import { BusinessLines, Cap, CustomerLines, DetailGrid, FooterText, Logo, MetaTable, TotalsTable, amountDue, baseMetaRows, docTitle, findField, otherFieldRows, standardColumns, tailBlocks } from './shared'

const USED = [/project/i, /job ?site|site address/i, /licen[cs]e/i, /permit/i, /phase|progress|stage/i]

/** Construction / Contractor — project & job-site block, licence number, labour/materials table. */
const construction: TemplateDef = {
  meta: { id: 'construction', name: 'Construction / Contractor', description: 'Project, job site and licence up front; labour & materials table.', bestFor: 'Contractors, builders, trades', category: 'Industry', fields: ['Project', 'Job site', 'Contractor licence', 'Work phase'] },
  accent: '#D9480F',
  pad: { x: 48, top: 44, bottom: 56 },
  gap: 16,
  rootClass: 'font-sans text-[11px] leading-[1.5] text-[#1f2937]',
  Header: ({ ctx }) => {
    const site = findField(ctx, /job ?site|site address/i) || (ctx.inv.customer.hidden.includes('shippingAddress') ? '' : ctx.inv.customer.shippingAddress)
    return (
      <div className="pb-5">
        <div className="-mx-[48px] -mt-[44px] mb-6 flex items-center justify-between gap-6 bg-[#1f2937] px-[48px] py-6 text-white">
          <div className="flex min-w-0 items-center gap-3">
            {ctx.inv.business.logo && <div className="rounded bg-white p-1.5"><Logo ctx={ctx} max={44} /></div>}
            <div className="min-w-0"><div className="truncate text-[17px] font-extrabold uppercase tracking-wide">{ctx.inv.business.name}</div>
              {findField(ctx, /licen[cs]e/i) && <div className="text-[10px] text-white/80">Licence #{findField(ctx, /licen[cs]e/i)}</div>}</div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[22px] font-black uppercase tracking-wide" style={{ color: ctx.accent === '#D9480F' ? '#FF922B' : '#fff' }}>{docTitle(ctx, 'Invoice')}</div>
            <div className="text-[11px] text-white/85">#{ctx.inv.number}</div>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_1fr_auto] gap-6">
          <div className="min-w-0"><Cap className="mb-1">Contractor</Cap><BusinessLines ctx={ctx} showName={false} className="text-[#4b5563]" /></div>
          <div className="min-w-0"><Cap className="mb-1">Client</Cap><CustomerLines ctx={ctx} nameClass="font-semibold text-[12px]" /></div>
          <MetaTable rows={baseMetaRows(ctx)} labelClass="text-[#6b7280]" valueClass="text-right font-semibold" />
        </div>
        <div className="mt-5 rounded-md border-l-4 bg-[#FFF4E6] px-4 py-3" style={{ borderColor: ctx.accent }}>
          <DetailGrid cols={3} rows={[
            ['Project', findField(ctx, /project/i)],
            ['Job site', site],
            ['Phase / progress', findField(ctx, /phase|progress|stage/i)],
            ...otherFieldRows(ctx, USED),
          ].filter(([, v], i) => v || i === 0) as [string, string][]} />
        </div>
      </div>
    )
  },
  ContHeader: ({ ctx, page }) => <div className="mb-4 flex justify-between border-b-2 pb-2 text-[10.5px]" style={{ borderColor: ctx.accent }}><b className="min-w-0 truncate">{ctx.inv.business.name}</b><span className="shrink-0">#{ctx.inv.number} · page {page}</span></div>,
  columns: (ctx) => standardColumns(ctx, { index: true, nameClass: 'font-semibold' }).map((c) => (c.key === 'item' ? { ...c, label: 'Labour & materials' } : c.key === 'price' ? { ...c, label: 'Unit cost' } : c)),
  table: { className: 'w-full border border-[#d1d5db]', theadClass: 'bg-[#1f2937] text-white', thClass: 'px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide', tdClass: 'px-2.5 py-2 align-top border-b border-[#e5e7eb]', rowClass: (i) => (i % 2 ? 'bg-[#f9fafb]' : '') },
  summary: (ctx) => [
    <div key="t" className="flex items-start justify-between gap-6">
      <div className="rounded-md border border-[#e5e7eb] px-4 py-3"><Cap>Amount due</Cap><div className="text-[20px] font-black tabular-nums" style={{ color: ctx.accent }}>{amountDue(ctx)}</div>{ctx.inv.dueDate && <div className="text-[10px] text-[#6b7280]">by {ctx.date(ctx.inv.dueDate)}</div>}</div>
      <TotalsTable ctx={ctx} width={280} className="border border-[#d1d5db]" rowClass="[&>td]:px-3 border-b border-[#e5e7eb]" strongClass="[&>td]:px-3 font-extrabold text-[12.5px] bg-[#FFF4E6]" />
    </div>,
    ...tailBlocks(ctx, { titleClass: 'text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#6b7280] mb-1', labelClass: 'text-[#6b7280]', thanksClass: 'font-semibold' }),
  ],
  Footer: ({ ctx, page, pageCount }) => <FooterText ctx={ctx} page={page} pageCount={pageCount} className="border-t-2 border-[#1f2937] pt-2 text-[9.5px] text-[#6b7280]" />,
}
export default construction
