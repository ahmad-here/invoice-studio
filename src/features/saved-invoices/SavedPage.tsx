import { useSeo } from '@/hooks/useSeo'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Copy, Download, X, FileText, MoreHorizontal, Printer, Search, Trash2 } from 'lucide-react'
import type { Invoice, InvoiceStatus } from '@/types/invoice'
import { useApp, toast } from '@/app/store'
import { Button, Card, ConfirmDialog, EmptyState, Input, PageHeader, Select } from '@/components/common/ui'
import { InvoiceListItem } from '@/components/invoice/InvoiceListItem'
import { APP_MODE } from '@/lib/appMode'
import { useInvoiceActions, duplicateInvoice } from '@/hooks/useInvoiceActions'
import { isOverdue } from '@/lib/dates'
import { calculateTotals } from '@/lib/calc'
import { saveFile } from '@/services/files'
import { todayISO } from '@/lib/dates'

type Sort = 'issue-desc' | 'issue-asc' | 'due-asc' | 'amount-desc' | 'updated-desc'
const PAGE = 50

export default function SavedPage() {
  useSeo({ title: 'Saved Invoices', description: 'Your saved invoices and drafts, stored privately on this device.', path: '/invoices', noindex: true })
  const { invoices, deleteInvoice, saveInvoice, nextNumber } = useApp()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [q, setQ] = useState(() => params.get('q') ?? '')
  const [status, setStatus] = useState<'all' | InvoiceStatus>('all')
  const [sort, setSort] = useState<Sort>('updated-desc')
  const [limit, setLimit] = useState(PAGE)
  const [toDelete, setToDelete] = useState<Invoice | null>(null)
  const [menu, setMenu] = useState<string | null>(null)
  const { busy, downloadPdf, print } = useInvoiceActions()
  const prefs = useApp((s) => s.prefs)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy] = useState<string | null>(null)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
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

  // Drop selections that no longer exist (deleted elsewhere)
  useEffect(() => { setSelected((sel) => { const ids = new Set(invoices.map((i) => i.id)); const next = new Set([...sel].filter((id) => ids.has(id))); return next.size === sel.size ? sel : next }) }, [invoices])
  const chosen = useMemo(() => list.filter((i) => selected.has(i.id)), [list, selected])
  const allSelected = list.length > 0 && list.every((i) => selected.has(i.id))
  const toggle = (id: string) => setSelected((sel) => { const n = new Set(sel); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(list.map((i) => i.id)))

  const runBulk = async (key: string, fn: () => Promise<void>) => {
    setBulkBusy(key)
    try { await fn() } catch (e) { toast.error(`Could not finish: ${(e as Error).message}`) } finally { setBulkBusy(null) }
  }
  const bulkDownload = () => runBulk('zip', async () => {
    const [{ default: JSZip }, { invoiceToPdfBlob, yieldToBrowser }] = await Promise.all([import('jszip'), import('@/services/pdf/pdf')])
    if (chosen.length === 1) { await downloadPdf(chosen[0]); return }
    const zip = new JSZip(); const used = new Set<string>()
    for (const inv of chosen) {
      let name = `Invoice-${inv.number || 'draft'}`, n = 2
      while (used.has(name)) name = `Invoice-${inv.number || 'draft'}-${n++}`
      used.add(name)
      zip.file(`${name}.pdf`, await invoiceToPdfBlob(inv, prefs))
      await yieldToBrowser()
    }
    const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' })
    if (await saveFile(blob, `Invoices-${todayISO()}.zip`)) toast.success(`${chosen.length} invoices downloaded as ZIP.`)
  })
  const bulkPrint = () => runBulk('print', async () => {
    const { printInvoices } = await import('@/services/printing/print')
    await printInvoices(chosen, prefs)
  })
  const bulkDelete = async () => {
    const items = chosen
    setConfirmBulkDelete(false)
    for (const inv of items) await deleteInvoice(inv.id)
    setSelected(new Set())
    toast.success(`${items.length} invoice${items.length === 1 ? '' : 's'} deleted.`)
  }

  const duplicate = async (inv: Invoice) => {
    const copy = duplicateInvoice(inv, nextNumber())
    await saveInvoice(copy)
    toast.success(`Duplicated as ${copy.number}.`)
    nav(`/edit/${copy.id}`)
  }

  return (
    <div>
      <PageHeader title="Saved invoices" description="Stored privately in this browser on this device. Use Settings → Backup to move them to another device." />
      {APP_MODE ? (
        <div className="mb-4 space-y-3">
          <div className="flex gap-2">
            <Input label="Search invoices" srOnlyLabel className="flex-1" placeholder="Search invoices" value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE) }} prefix={<Search className="size-4" />} type="search" />
            <Select label="Sort" srOnlyLabel className="w-36" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="updated-desc">Recent</option><option value="issue-desc">Newest</option><option value="issue-asc">Oldest</option><option value="due-asc">Due soon</option><option value="amount-desc">Amount</option>
            </Select>
          </div>
          <div role="radiogroup" aria-label="Filter by status" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-thin">
            {([['all', 'All'], ['sent', 'Unpaid'], ['overdue', 'Overdue'], ['paid', 'Paid'], ['draft', 'Drafts'], ['cancelled', 'Cancelled']] as const).map(([v, l]) => (
              <button key={v} type="button" role="radio" aria-checked={status === v} onClick={() => setStatus(v)}
                className={`h-9 shrink-0 rounded-full border px-4 text-[13px] font-medium transition-colors ${status === v ? 'border-primary bg-primary text-white' : 'border-line-strong bg-white text-ink active:bg-canvas'}`}>{l}</button>
            ))}
          </div>
        </div>
      ) : (
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
      )}
      <Card>
        {invoices.length === 0 ? (
          <EmptyState icon={<FileText className="size-7" />} title="No saved invoices" description="Invoices you save appear here so you can edit, duplicate, print or download them later." action={<Button variant="primary" onClick={() => nav('/create')}>Create invoice</Button>} />
        ) : list.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted">No invoices match your search. <button className="font-medium text-primary" onClick={() => { setQ(''); setStatus('all') }}>Clear filters</button></div>
        ) : (
          <>
            <div className={`sticky z-20 flex ${APP_MODE ? 'top-[calc(3.5rem+env(safe-area-inset-top))]' : 'top-16'} ${chosen.length ? 'shadow-sm' : ''} min-h-11 flex-wrap items-center gap-x-3 gap-y-2 rounded-t-xl border-b border-line px-4 py-2 sm:px-5 ${chosen.length ? 'bg-primary-50' : 'bg-white'}`}>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                <input type="checkbox" className="size-4 accent-[var(--color-primary)]" checked={allSelected} ref={(el) => { if (el) el.indeterminate = chosen.length > 0 && !allSelected }} onChange={toggleAll} aria-label={allSelected ? 'Unselect all invoices' : 'Select all invoices'} />
                {chosen.length ? <span className="font-medium text-ink">{chosen.length} selected</span> : <span>{list.length} invoice{list.length === 1 ? '' : 's'}</span>}
              </label>
              {chosen.length > 0 && (
                <div className="ml-auto flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="Bulk actions">
                  <Button size="sm" icon={<Download className="size-4" />} loading={bulkBusy === 'zip'} disabled={!!bulkBusy} onClick={bulkDownload}>Download{chosen.length > 1 ? ' ZIP' : ''}</Button>
                  <Button size="sm" icon={<Printer className="size-4" />} loading={bulkBusy === 'print'} disabled={!!bulkBusy} onClick={bulkPrint}>Print</Button>
                  <Button size="sm" variant="danger-ghost" icon={<Trash2 className="size-4" />} disabled={!!bulkBusy} onClick={() => setConfirmBulkDelete(true)}>Delete</Button>
                  <Button size="icon" variant="ghost" aria-label="Clear selection" onClick={() => setSelected(new Set())}><X className="size-4" /></Button>
                </div>
              )}
            </div>
            <ul className="divide-y divide-line">
              {list.slice(0, limit).map((inv) => (
                <InvoiceListItem key={inv.id} inv={inv} selected={selected.has(inv.id)} leading={<input type="checkbox" className="size-4 shrink-0 cursor-pointer accent-[var(--color-primary)]" checked={selected.has(inv.id)} onChange={() => toggle(inv.id)} aria-label={`Select ${inv.number || 'invoice'}`} />} actions={
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
      <ConfirmDialog open={confirmBulkDelete} title={`Delete ${chosen.length} invoice${chosen.length === 1 ? '' : 's'}?`} message={<>{chosen.slice(0, 5).map((i) => i.number).join(', ')}{chosen.length > 5 ? ` and ${chosen.length - 5} more` : ''} will be permanently removed from this device. This can’t be undone.</>}
        onCancel={() => setConfirmBulkDelete(false)} onConfirm={bulkDelete} />
      <ConfirmDialog open={!!toDelete} title="Delete invoice?" message={<>Invoice <b className="text-ink">{toDelete?.number}</b> will be permanently removed from this device. This can’t be undone.</>}
        onCancel={() => setToDelete(null)} onConfirm={async () => { if (toDelete) { await deleteInvoice(toDelete.id); toast.success(`Invoice ${toDelete.number} deleted.`) } setToDelete(null) }} />
    </div>
  )
}
