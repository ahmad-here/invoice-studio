import { useDeferredValue, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilePlus2, Mail, Pencil, Phone, Plus, Search, Trash2, Users } from 'lucide-react'
import type { Client, CurrencyCode } from '@/types/invoice'
import { useApp, toast } from '@/app/store'
import { Button, Card, ConfirmDialog, EmptyState, Input, Modal, PageHeader, Textarea } from '@/components/common/ui'
import { emptyClient, invoicesForClient } from '@/lib/clients'
import { calculateTotals } from '@/lib/calc'
import { formatMoney } from '@/lib/money'
import { useSeo } from '@/hooks/useSeo'

const initials = (c: Client) => (c.name || c.company).split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?'

export default function ClientsPage() {
  useSeo({ title: 'Clients', description: 'Saved clients for faster invoicing.', path: '/clients', noindex: true })
  const { clients, invoices, saveClient, deleteClient } = useApp()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const dq = useDeferredValue(q.trim().toLowerCase())
  const [editing, setEditing] = useState<Client | null>(null)
  const [toDelete, setToDelete] = useState<Client | null>(null)
  const [saving, setSaving] = useState(false)

  const rows = useMemo(() => clients
    .filter((c) => !dq || [c.name, c.company, c.email, c.phone].some((v) => v.toLowerCase().includes(dq)))
    .map((c) => {
      const list = invoicesForClient(c, invoices)
      const due = new Map<CurrencyCode, number>()
      for (const i of list) if (i.status !== 'paid' && i.status !== 'cancelled' && i.status !== 'draft') due.set(i.currency, (due.get(i.currency) ?? 0) + calculateTotals(i).balanceDue)
      return { c, count: list.length, due: [...due.entries()].filter(([, v]) => v > 0) }
    }), [clients, invoices, dq])

  const save = async () => {
    if (!editing) return
    if (!editing.name.trim() && !editing.company.trim()) { toast.error('Add a client name or company.'); return }
    if (editing.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editing.email)) { toast.error('That email address looks invalid.'); return }
    setSaving(true)
    try { await saveClient(editing); toast.success(`“${editing.name || editing.company}” saved.`); setEditing(null) }
    catch (e) { toast.error(`Could not save: ${(e as Error).message}`) }
    finally { setSaving(false) }
  }
  const set = (k: keyof Client, v: string) => editing && setEditing({ ...editing, [k]: v })

  return (
    <div>
      <PageHeader title="Clients" description="Save clients once and reuse them on every invoice." actions={<Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setEditing(emptyClient())}>Add client</Button>} />
      {clients.length > 0 && (
        <div className="mb-4"><Input label="Search clients" srOnlyLabel type="search" placeholder="Search clients" prefix={<Search className="size-4" />} value={q} onChange={(e) => setQ(e.target.value)} /></div>
      )}
      <Card>
        {clients.length === 0 ? (
          <EmptyState icon={<Users className="size-7" />} title="No clients yet" description="Add the people and companies you bill. You can also save a customer from the invoice editor." action={<Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setEditing(emptyClient())}>Add your first client</Button>} />
        ) : rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">No clients match “{q}”.</p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map(({ c, count, due }) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">{initials(c)}</span>
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setEditing(c)}>
                  <div className="truncate text-sm font-semibold text-ink">{c.name || c.company}</div>
                  <div className="flex flex-wrap gap-x-3 text-xs text-muted">
                    {c.name && c.company && <span className="truncate">{c.company}</span>}
                    {c.email && <span className="inline-flex items-center gap-1 truncate"><Mail className="size-3" aria-hidden />{c.email}</span>}
                    {c.phone && <span className="inline-flex items-center gap-1"><Phone className="size-3" aria-hidden />{c.phone}</span>}
                  </div>
                </button>
                <div className="hidden text-right sm:block">
                  <div className="text-xs text-muted">{count} invoice{count === 1 ? '' : 's'}</div>
                  {due.map(([cur, v]) => <div key={cur} className="text-sm font-semibold tabular text-ink">{formatMoney(v, cur)} due</div>)}
                </div>
                <Button size="icon" variant="ghost" aria-label={`New invoice for ${c.name || c.company}`} onClick={() => nav(`/create?client=${c.id}`)}><FilePlus2 className="size-4" /></Button>
                <Button size="icon" variant="ghost" aria-label={`Edit ${c.name || c.company}`} className="hidden sm:inline-flex" onClick={() => setEditing(c)}><Pencil className="size-4" /></Button>
                <Button size="icon" variant="danger-ghost" aria-label={`Delete ${c.name || c.company}`} onClick={() => setToDelete(c)}><Trash2 className="size-4" /></Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing && clients.some((c) => c.id === editing.id) ? 'Edit client' : 'New client'} footer={<>
        <Button onClick={() => setEditing(null)}>Cancel</Button>
        <Button variant="primary" loading={saving} onClick={save}>Save client</Button>
      </>}>
        {editing && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Contact name" value={editing.name} maxLength={200} onChange={(e) => set('name', e.target.value)} data-autofocus />
            <Input label="Company" value={editing.company} maxLength={200} onChange={(e) => set('company', e.target.value)} />
            <Input label="Email" type="email" value={editing.email} onChange={(e) => set('email', e.target.value)} />
            <Input label="Phone" type="tel" value={editing.phone} onChange={(e) => set('phone', e.target.value)} />
            <Textarea label="Billing address" rows={2} className="sm:col-span-2" value={editing.billingAddress} onChange={(e) => set('billingAddress', e.target.value)} />
            <Textarea label="Shipping address" rows={2} className="sm:col-span-2" value={editing.shippingAddress} onChange={(e) => set('shippingAddress', e.target.value)} />
            <Input label="Tax ID" value={editing.taxId} onChange={(e) => set('taxId', e.target.value)} />
            <Input label="Client reference" value={editing.reference} onChange={(e) => set('reference', e.target.value)} />
            <Textarea label="Private notes" hint="Not shown on invoices" rows={2} className="sm:col-span-2" value={editing.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
        )}
      </Modal>
      <ConfirmDialog open={!!toDelete} title="Delete client?" message={<>“{toDelete?.name || toDelete?.company}” will be removed from your clients. Existing invoices are not changed.</>}
        onCancel={() => setToDelete(null)} onConfirm={async () => { if (toDelete) { await deleteClient(toDelete.id); toast.success('Client deleted.') } setToDelete(null) }} />
    </div>
  )
}
