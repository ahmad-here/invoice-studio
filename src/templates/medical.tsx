import type { TemplateDef } from './types'
import { BusinessLines, Cap, DetailGrid, FooterText, Logo, TotalsTable, amountDue, docTitle, findField, otherFieldRows, qtyText, tailBlocks } from './shared'

const USED = [/patient id|mrn|record/i, /date of birth|dob/i, /date of service|service date|visit/i, /provider|practitioner|doctor|physician/i, /npi|registration|licen[cs]e/i, /insurance|policy|insurer/i, /diagnos|icd/i]

/** Medical / Healthcare — patient & provider blocks, service date, procedure code column. */
const medical: TemplateDef = {
  meta: { id: 'medical', name: 'Medical / Healthcare', description: 'Patient and provider details with service dates and procedure codes.', bestFor: 'Clinics, therapists, practitioners', category: 'Industry', fields: ['Patient ID', 'Date of birth', 'Date of service', 'Practitioner', 'Insurance / policy no.'] },
  accent: '#0C8599',
  pad: { x: 52, top: 48, bottom: 56 },
  gap: 16,
  rootClass: 'font-sans text-[11px] leading-[1.5] text-[#1f2937]',
  Header: ({ ctx }) => {
    const c = ctx.inv.customer
    return (
      <div className="pb-5">
        <div className="flex items-start justify-between gap-6 border-b-4 pb-4" style={{ borderColor: ctx.accent }}>
          <div className="min-w-0"><Logo ctx={ctx} max={48} style={{ marginBottom: 6 }} /><BusinessLines ctx={ctx} nameClass="text-[15px] font-bold" className="text-[#4b5563]" /></div>
          <div className="shrink-0 text-right">
            <div className="text-[20px] font-bold" style={{ color: ctx.accent }}>{docTitle(ctx, 'Patient Invoice')}</div>
            <div>No. <b>{ctx.inv.number}</b></div>
            <div className="text-[#6b7280]">Issued {ctx.date(ctx.inv.issueDate)}</div>
            {ctx.inv.dueDate && <div className="text-[#6b7280]">Due {ctx.date(ctx.inv.dueDate)}</div>}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="min-w-0 rounded-lg bg-[#E3FAFC] p-3">
            <Cap className="mb-1.5">Patient</Cap>
            <div className="text-[12.5px] font-semibold">{c.name || c.company}</div>
            {!c.hidden.includes('billingAddress') && c.billingAddress && <div className="whitespace-pre-line text-[#4b5563]">{c.billingAddress}</div>}
            <DetailGrid className="mt-2" rows={[['Patient ID', findField(ctx, /patient id|mrn|record/i)], ['Date of birth', findField(ctx, /date of birth|dob/i)], ['Phone', c.hidden.includes('phone') ? '' : c.phone]].filter(([, v]) => v) as [string, string][]} />
          </div>
          <div className="min-w-0 rounded-lg border border-[#C5F6FA] p-3">
            <Cap className="mb-1.5">Service</Cap>
            <DetailGrid rows={[
              ['Date of service', findField(ctx, /date of service|service date|visit/i) || ctx.date(ctx.inv.issueDate)],
              ['Practitioner', findField(ctx, /provider|practitioner|doctor|physician/i)],
              ['Provider no.', findField(ctx, /npi|registration|licen[cs]e/i) || ctx.inv.business.taxNumber],
              ['Insurance', findField(ctx, /insurance|policy|insurer/i)],
              ['Diagnosis', findField(ctx, /diagnos|icd/i)],
              ...otherFieldRows(ctx, USED),
            ].filter(([, v], i) => v || i === 0) as [string, string][]} />
          </div>
        </div>
      </div>
    )
  },
  ContHeader: ({ ctx, page }) => <div className="mb-4 flex justify-between border-b-2 pb-1 text-[10.5px]" style={{ borderColor: ctx.accent }}><b className="min-w-0 truncate">{ctx.inv.business.name} · {ctx.inv.number}</b><span className="shrink-0">Page {page}</span></div>,
  columns: (ctx) => [
    { key: 'c', label: 'Code', width: '12%', render: (it) => <span className="font-mono text-[10px]">{it.sku || '—'}</span> },
    { key: 'd', label: 'Service / procedure', render: (it) => <div className="[overflow-wrap:anywhere]"><div className="font-semibold">{it.name || ' '}</div>{it.description && <div className="whitespace-pre-line text-[10px] text-[#6b7280]">{it.description}</div>}</div> },
    { key: 'q', label: 'Units', align: 'right', width: '9%', render: (it) => qtyText(ctx, it) },
    { key: 'f', label: 'Fee', align: 'right', width: '14%', render: (it) => ctx.money(it.unitPrice) },
    { key: 'a', label: 'Amount', align: 'right', width: '15%', render: (_i, l) => <b>{ctx.money(l.total)}</b> },
  ],
  table: { className: 'w-full', theadClass: 'bg-[#E3FAFC]', thClass: 'px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wide text-[#0B7285]', tdClass: 'px-2.5 py-2 align-top border-b border-[#E9ECEF]' },
  summary: (ctx) => [
    <div key="t" className="flex items-start justify-between gap-6">
      <div className="rounded-lg px-4 py-3" style={{ background: ctx.accent, color: ctx.onAccent }}><div className="text-[10px] font-semibold uppercase tracking-wide">Patient balance</div><div className="text-[20px] font-bold tabular-nums">{amountDue(ctx)}</div></div>
      <TotalsTable ctx={ctx} width={270} strongClass="font-bold text-[12.5px] [&>td]:border-t [&>td]:border-[#0C8599] [&>td]:pt-2" />
    </div>,
    ...tailBlocks(ctx, { titleClass: 'text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#6b7280] mb-1', labelClass: 'text-[#6b7280]', thanksClass: 'font-semibold' }),
    <p key="c" className="text-[9.5px] text-[#6b7280]">This document contains confidential patient information. Please keep it secure.</p>,
  ],
  Footer: ({ ctx, page, pageCount }) => <FooterText ctx={ctx} page={page} pageCount={pageCount} className="text-[9.5px] text-[#6b7280]" />,
}
export default medical
