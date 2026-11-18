import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, ChevronRight, FilePlus2, FileText, Layers, LayoutTemplate, Clock, CircleCheck, AlertCircle } from 'lucide-react'
import { useApp } from '@/app/store'
import { Card, EmptyState, Button } from '@/components/common/ui'
import { InvoiceListItem } from '@/components/invoice/InvoiceListItem'
import { calculateTotals } from '@/lib/calc'
import { formatMoney } from '@/lib/money'
import { isOverdue, todayISO } from '@/lib/dates'
import { haptic } from '@/services/native'

/** Native-app home screen: greeting, outstanding balance, quick actions, recent activity. */
export function AppHome() {
  const { invoices, business, prefs } = useApp()
  const nav = useNavigate()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const summary = useMemo(() => {
    const month = todayISO().slice(0, 7)
    const outstanding = new Map<string, number>()
    let overdue = 0, paid = 0, thisMonth = 0
    for (const i of invoices) {
      if (i.status === 'draft' || i.status === 'cancelled') continue
      if (i.issueDate.startsWith(month)) thisMonth++
      if (i.status === 'paid') { paid++; continue }
      const t = calculateTotals(i)
      outstanding.set(i.currency, (outstanding.get(i.currency) ?? 0) + t.balanceDue)
      if (i.status === 'overdue' || isOverdue(i.dueDate, i.status)) overdue++
    }
    return { outstanding: [...outstanding.entries()], overdue, paid, thisMonth }
  }, [invoices])

  const recent = invoices.slice(0, 5)
  const quick = [
    { to: '/create', label: 'New invoice', icon: FilePlus2, tone: 'bg-primary text-white' },
    { to: '/bulk', label: 'Bulk generate', icon: Layers, tone: 'bg-primary-50 text-primary-700' },
    { to: '/templates', label: 'Templates', icon: LayoutTemplate, tone: 'bg-primary-50 text-primary-700' },
    { to: '/settings', label: 'Businesses', icon: Building2, tone: 'bg-primary-50 text-primary-700' },
  ]

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm text-muted">{greeting}{business.name ? ',' : ''}</p>
        <h2 className="truncate text-2xl font-semibold tracking-tight text-ink">{business.name || 'Welcome'}</h2>
      </section>

      <Card className="overflow-hidden">
        <div className="bg-primary px-5 py-5 text-white">
          <div className="text-[13px] text-white/90">Outstanding</div>
          {summary.outstanding.length === 0
            ? <div className="mt-1 text-3xl font-semibold tabular">{formatMoney(0, prefs.defaultCurrency)}</div>
            : summary.outstanding.slice(0, 3).map(([cur, amt]) => <div key={cur} className="mt-1 text-3xl font-semibold tabular">{formatMoney(amt, cur as never)}</div>)}
        </div>
        <div className="grid grid-cols-3 divide-x divide-line">
          {[
            { k: 'This month', v: summary.thisMonth, icon: Clock, c: 'text-primary' },
            { k: 'Paid', v: summary.paid, icon: CircleCheck, c: 'text-success' },
            { k: 'Overdue', v: summary.overdue, icon: AlertCircle, c: summary.overdue ? 'text-danger' : 'text-muted' },
          ].map((s) => (
            <div key={s.k} className="flex flex-col items-center gap-0.5 py-3">
              <s.icon className={`size-4 ${s.c}`} aria-hidden />
              <span className="text-lg font-semibold tabular text-ink">{s.v}</span>
              <span className="text-[11px] text-muted">{s.k}</span>
            </div>
          ))}
        </div>
      </Card>

      <section aria-label="Quick actions" className="grid grid-cols-4 gap-3">
        {quick.map((q) => (
          <Link key={q.to} to={q.to} onClick={() => haptic('light')} className="flex flex-col items-center gap-2 text-center active:opacity-80">
            <span className={`flex size-14 items-center justify-center rounded-2xl shadow-xs transition-transform active:scale-95 ${q.tone}`}><q.icon className="size-6" /></span>
            <span className="text-[12px] font-medium leading-tight text-ink">{q.label}</span>
          </Link>
        ))}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-ink">Recent</h2>
          {recent.length > 0 && <Link to="/invoices" className="flex items-center text-sm font-medium text-primary">See all<ChevronRight className="size-4" /></Link>}
        </div>
        <Card>
          {recent.length === 0
            ? <EmptyState icon={<FileText className="size-7" />} title="No invoices yet" description="Tap the + button to create your first invoice." action={<Button variant="primary" onClick={() => nav('/create')}>Create invoice</Button>} />
            : <ul className="divide-y divide-line">{recent.map((i) => <InvoiceListItem key={i.id} inv={i} compact />)}</ul>}
        </Card>
      </section>
    </div>
  )
}
