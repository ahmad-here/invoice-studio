import { memo } from 'react'
import { Link } from 'react-router-dom'
import type { Invoice } from '@/types/invoice'
import { Badge } from '@/components/common/ui'
import { calculateTotals } from '@/lib/calc'
import { formatMoney } from '@/lib/money'
import { formatDate, isOverdue } from '@/lib/dates'
import { useApp } from '@/app/store'

export function StatusBadge({ inv }: { inv: Invoice }) {
  const overdue = inv.status === 'overdue' || isOverdue(inv.dueDate, inv.status)
  if (overdue) return <Badge tone="red">Overdue</Badge>
  return { draft: <Badge>Draft</Badge>, sent: <Badge tone="blue">Unpaid</Badge>, paid: <Badge tone="green">Paid</Badge>, overdue: <Badge tone="red">Overdue</Badge>, cancelled: <Badge tone="amber">Cancelled</Badge> }[inv.status]
}

export const InvoiceListItem = memo(function InvoiceListItem({ inv, compact, actions, leading, selected }: { inv: Invoice; compact?: boolean; actions?: React.ReactNode; leading?: React.ReactNode; selected?: boolean }) {
  const prefs = useApp((s) => s.prefs)
  const total = calculateTotals(inv)
  return (
    <li className={`flex items-center gap-3 px-4 py-3 sm:px-5 ${selected ? 'bg-primary-50' : 'hover:bg-canvas/60'}`}>
      {leading}
      <Link to={`/edit/${inv.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-ink">{inv.customer.name || inv.customer.company || 'No customer'}</span>
            <StatusBadge inv={inv} />
          </div>
          <div className="mt-0.5 truncate text-xs text-muted">{inv.number || 'No number'} · {formatDate(inv.issueDate, prefs.dateFormat, prefs.locale)}{!compact && inv.dueDate ? ` · due ${formatDate(inv.dueDate, prefs.dateFormat, prefs.locale)}` : ''}</div>
        </div>
        <div className="text-right text-sm font-semibold tabular text-ink whitespace-nowrap">{formatMoney(total.amountPaid ? total.balanceDue : total.grandTotal, inv.currency)}</div>
      </Link>
      {actions}
    </li>
  )
})
