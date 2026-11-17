import { useSeo } from '@/hooks/useSeo'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, Download, FileText, MoreHorizontal, Printer, Search, Trash2 } from 'lucide-react'
import type { Invoice, InvoiceStatus } from '@/types/invoice'
import { useApp, toast } from '@/app/store'
import { Button, Card, ConfirmDialog, EmptyState, Input, PageHeader, Select } from '@/components/common/ui'
import { InvoiceListItem } from './InvoiceListItem'
import { useInvoiceActions, duplicateInvoice } from '@/hooks/useInvoiceActions'
import { isOverdue } from '@/lib/dates'
import { calculateTotals } from '@/lib/calc'

type Sort = 'issue-desc' | 'issue-asc' | 'due-asc' | 'amount-desc' | 'updated-desc'
const PAGE = 50

export default function SavedPage() {
  useSeo({ title: 'Saved Invoices', description: 'Your saved invoices and drafts, stored privately on this device.', path: '/invoices', noindex: true })
  const { invoices, deleteInvoice, saveInvoice, nextNumber } = useApp()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | InvoiceStatus>('all')
  const [sort, setSort] = useState<Sort>('updated-desc')
  const [limit, setLimit] = useState(PAGE)
  const [toDelete, setToDelete] = useState<Invoice | null>(null)
  const [menu, setMenu] = useState<string | null>(null)
  const { busy, downloadPdf, print } = useInvoiceActions()
  const dq = useDeferredValue(q.trim().toLowerCase())
  // Close the mobile action menu on outside tap or Escape
  useEffect(() => {
    if (!menu) return
    const close = (e: Event) => { if (!(e.target as Element).closest?.('[role="menu"],[aria-haspopup]')) setMenu(null) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null) }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc) }
  }, [menu])

  const list = useMemo(() => {
    const totals = new Map<string, number>()
    const total = (i: Invoice) => { let t = totals.get(i.id); if (t === undefined) { t = calculateTotals(i).grandTotal; totals.set(i.id, t) } return t }
    const filtered = invoices.filter((i) => {
      const st = i.status === 'sent' && isOverdue(i.dueDate, i.status) ? 'overdue' : i.status
      if (status !== 'all' && st !== status) return false
      if (!dq) return true
      return [i.number, i.customer.name, i.customer.company, i.customer.email, i.reference, i.poNumber].some((v) => v?.toLowerCase().includes(dq))
    })
    const cmp: Record<Sort, (a: Invoice, b: Invoice) => number> = {
      'issue-desc': (a, b) => b.issueDate.localeCompare(a.issueDate),
      'issue-asc': (a, b) => a.issueDate.localeCompare(b.issueDate),
      'due-asc': (a, b) => (a.dueDate || '9').localeCompare(b.dueDate || '9'),
      'amount-desc': (a, b) => a.currency.localeCompare(b.currency) || total(b) - total(a),
      'updated-desc': (a, b) => b.updatedAt - a.updatedAt,
    }
    return filtered.sort(cmp[sort])
  }, [invoices, dq, status, sort])

  const duplicate = async (inv: Invoice) => {
    const copy = duplicateInvoice(inv, nextNumber())
    await saveInvoice(copy)
    toast.success(`Duplicated as ${copy.number}.`)
    nav(`/edit/${copy.id}`)
  }

  return (
    <div>
      <PageHeader title="Saved invoices" description="Stored privately in this browser on this device. Use Settings → Backup to move them to another device." actions={<Button variant="primary" onClick={() => nav('/create')}>Create invoice</Button>} />
      <Card className="mb-4 p-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_200px]">
          <Input label="Search invoices" srOnlyLabel placeholder="Search by number, customer, email…" value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE) }} prefix={<Search className="size-4" />} type="search" />
          <Select label="Filter by status" srOnlyLabel value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="all">All statuses</option><option value="draft">Draft</option><option value="sent">Unpaid</option><option value="paid">Paid</option><option value="overdue">Overdue</option><option value="cancelled">Cancelled</option>
          </Select>
          <Select label="Sort" srOnlyLabel value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="updated-desc">Recently edited</option><option value="issue-desc">Issue date (newest)</option><option value="issue-asc">Issue date (oldest)</option><option value="due-asc">Due date (soonest)</option><option value="amount-desc">Amount (highest)</option>
          </Select>
        </div>
      </Card>
      <Card>
        {invoices.length === 0 ? (
          <EmptyState icon={<FileText className="size-7" />} title="No saved invoices" description="Invoices you save appear here so you can edit, duplicate, print or download them later." action={<Button variant="primary" onClick={() => nav('/create')}>Create invoice</Button>} />
        ) : list.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted">No invoices match your search. <button className="font-medium text-primary" onClick={() => { setQ(''); setStatus('all') }}>Clear filters</button></div>
        ) : (
          <>
            <div className="border-b border-line px-5 py-2 text-xs text-muted">{list.length} invoice{list.length === 1 ? '' : 's'}</div>
            <ul className="divide-y divide-line">
              {list.slice(0, limit).map((inv) => (
                <InvoiceListItem key={inv.id} inv={inv} actions={
                  <div className="relative flex shrink-0 items-center">
                    <div className="hidden md:flex">
                      <Button size="icon" variant="ghost" aria-label={`Download ${inv.number} as PDF`} loading={busy === `pdf:${inv.id}`} onClick={() => downloadPdf(inv)}>{busy !== `pdf:${inv.id}` && <Download className="size-4" />}</Button>
                      <Button size="icon" variant="ghost" aria-label={`Print ${inv.number}`} onClick={() => print(inv)}><Printer className="size-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label={`Duplicate ${inv.number}`} onClick={() => duplicate(inv)}><Copy className="size-4" /></Button>
                      <Button size="icon" variant="danger-ghost" aria-label={`Delete ${inv.number}`} onClick={() => setToDelete(inv)}><Trash2 className="size-4" /></Button>
                    </div>
                    <div className="md:hidden">
                      <Button size="icon" variant="ghost" aria-label={`Actions for ${inv.number}`} aria-haspopup="menu" aria-expanded={menu === inv.id} onClick={() => setMenu(menu === inv.id ? null : inv.id)}><MoreHorizontal className="size-5" /></Button>
                      {menu === inv.id && (
                        <div role="menu" aria-label={`Actions for ${inv.number}`} className="absolute right-0 bottom-11 z-30 w-48 rounded-lg border border-line bg-white py-1 shadow-lg">
                          {[
                            { l: 'Download PDF', i: Download, f: () => downloadPdf(inv) },
                            { l: 'Print / share', i: Printer, f: () => print(inv) },
                            { l: 'Duplicate', i: Copy, f: () => duplicate(inv) },
                            { l: 'Delete', i: Trash2, f: () => setToDelete(inv), danger: true },
                          ].map((a) => (
                            <button key={a.l} role="menuitem" className={`flex w-full items-center gap-2 px-3 py-3 text-left text-sm hover:bg-canvas ${a.danger ? 'mt-1 border-t border-line text-danger' : 'text-ink'}`} onClick={() => { setMenu(null); a.f() }}><a.i className="size-4" />{a.l}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                } />
              ))}
            </ul>
            {list.length > limit && <div className="border-t border-line p-3 text-center"><Button onClick={() => setLimit(limit + PAGE)}>Show more ({list.length - limit} remaining)</Button></div>}
          </>
        )}
      </Card>
      <ConfirmDialog open={!!toDelete} title="Delete invoice?" message={<>Invoice <b className="text-ink">{toDelete?.number}</b> will be permanently removed from this device. This can’t be undone.</>}
        onCancel={() => setToDelete(null)} onConfirm={async () => { if (toDelete) { await deleteInvoice(toDelete.id); toast.success(`Invoice ${toDelete.number} deleted.`) } setToDelete(null) }} />
    </div>
  )
}
