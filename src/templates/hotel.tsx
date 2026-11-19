import type { TemplateDef } from './types'
import { Cap, CustomerLines, FooterText, Lines, Logo, TotalsTable, amountDue, docTitle, findField, otherFieldRows, qtyText, tailBlocks } from './shared'
import { parseISO } from '@/lib/dates'

const USED = [/check.?in|arrival/i, /check.?out|departure/i, /room/i, /guests?|adults|pax/i, /confirmation|booking/i]

function nights(a: string, b: string): string {
  const x = parseISO(a), y = parseISO(b)
  if (!x || !y) return ''
  const n = Math.round((y.getTime() - x.getTime()) / 86_400_000)
  return n > 0 ? String(n) : ''
}

/** Hotel Guest Folio — stay summary (check-in/out, room, nights) and charges by night/service. */
const hotel: TemplateDef = {
  meta: { id: 'hotel', name: 'Hotel Guest Folio', description: 'Stay summary with check-in, check-out, room and nights.', bestFor: 'Hotels, B&Bs, holiday rentals', category: 'Industry', fields: ['Check-in', 'Check-out', 'Room', 'Guests', 'Booking confirmation'] },
  accent: '#5F3DC4',
  pad: { x: 58, top: 56, bottom: 60 },
  gap: 18,
  rootClass: 'font-serif text-[11.5px] leading-[1.55] text-[#212529]',
  Header: ({ ctx }) => {
    const ci = findField(ctx, /check.?in|arrival/i), co = findField(ctx, /check.?out|departure/i)
    const rawIn = ctx.inv.customFields.find((f) => /check.?in|arrival/i.test(f.label))?.value ?? ''
    const rawOut = ctx.inv.customFields.find((f) => /check.?out|departure/i.test(f.label))?.value ?? ''
    const stay: [string, string][] = [['Arrival', ci], ['Departure', co], ['Nights', nights(rawIn, rawOut)], ['Room', findField(ctx, /room/i)], ['Guests', findField(ctx, /guests?|adults|pax/i)], ['Confirmation', findField(ctx, /confirmation|booking/i)]]
    return (
      <div className="pb-6">
        <div className="text-center">
          <div className="flex justify-center"><Logo ctx={ctx} max={60} style={{ marginBottom: 8 }} /></div>
          <div className="text-[22px] tracking-[0.12em] uppercase">{ctx.inv.business.name}</div>
          <Lines text={ctx.inv.business.address} className="font-sans text-[10px] text-[#6b7280]" />
          <div className="mx-auto mt-4 w-24 border-t" style={{ borderColor: ctx.accent }} />
          <div className="mt-3 font-sans text-[11px] font-semibold uppercase tracking-[0.3em]" style={{ color: ctx.accent }}>{docTitle(ctx, 'Guest Folio')}</div>
          <div className="font-sans text-[10.5px] text-[#6b7280]">Folio {ctx.inv.number} · {ctx.date(ctx.inv.issueDate)}</div>
        </div>
        <div className="mt-6 grid grid-cols-[1fr_1.4fr] gap-6 font-sans">
          <div className="min-w-0"><Cap className="mb-1">Guest</Cap><CustomerLines ctx={ctx} nameClass="font-semibold text-[12.5px]" /></div>
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-[#E5DBFF] bg-[#E5DBFF]">
            {stay.map(([k, v]) => <div key={k} className="min-w-0 bg-[#F8F5FF] px-3 py-2"><Cap>{k}</Cap><div className="font-semibold [overflow-wrap:anywhere]">{v || '—'}</div></div>)}
          </div>
        </div>
        {otherFieldRows(ctx, USED).length > 0 && <div className="mt-3 font-sans text-[10.5px] text-[#4b5563]">{otherFieldRows(ctx, USED).map(([k, v]) => <span key={k} className="mr-4"><b>{k}:</b> {v}</span>)}</div>}
      </div>
    )
  },
  ContHeader: ({ ctx, page }) => <div className="mb-4 text-center font-sans text-[10px] uppercase tracking-[0.2em] text-[#6b7280]">{ctx.inv.business.name} · Folio {ctx.inv.number} · page {page}</div>,
  columns: (ctx) => [
    { key: 'd', label: 'Description', render: (it) => <div className="[overflow-wrap:anywhere]"><div>{it.name || ' '}</div>{it.description && <div className="whitespace-pre-line text-[10px] text-[#6b7280]">{it.description}</div>}</div> },
    { key: 'q', label: 'Nights / qty', align: 'right', width: '14%', render: (it) => qtyText(ctx, it) },
    { key: 'r', label: 'Rate', align: 'right', width: '15%', render: (it) => ctx.money(it.unitPrice) },
    { key: 'a', label: 'Charges', align: 'right', width: '16%', render: (_i, l) => ctx.money(l.total) },
  ],
  table: { className: 'w-full font-sans', theadClass: '', thClass: 'border-y border-[#212529] py-2 text-[9.5px] font-semibold uppercase tracking-[0.12em]', tdClass: 'py-2.5 align-top border-b border-[#e9ecef]' },
  summary: (ctx) => [
    <div key="t" className="flex items-end justify-between gap-6 font-sans">
      <div><Cap>Balance due</Cap><div className="font-serif text-[24px] tabular-nums" style={{ color: ctx.accent }}>{amountDue(ctx)}</div></div>
      <TotalsTable ctx={ctx} width={270} strongClass="font-semibold text-[12.5px] [&>td]:border-t [&>td]:border-[#212529] [&>td]:pt-2" />
    </div>,
    ...tailBlocks(ctx, { titleClass: 'font-sans text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#6b7280] mb-1', labelClass: 'text-[#6b7280]', thanksClass: 'text-center italic text-[14px]' }),
  ],
  Footer: ({ ctx, page, pageCount }) => <FooterText ctx={ctx} page={page} pageCount={pageCount} className="font-sans text-[9.5px] text-[#6b7280]" />,
}
export default hotel
