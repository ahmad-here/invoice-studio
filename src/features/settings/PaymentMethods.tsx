import { useState } from 'react'
import { CreditCard, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import type { SavedPaymentMethod } from '@/types/invoice'
import { useApp, toast } from '@/app/store'
import { Badge, Button, ConfirmDialog, Input, Modal, Textarea } from '@/components/common/ui'
import { Section } from '@/components/common/Section'
import { emptyPayment, hasPaymentDetails, methodSummary } from '@/lib/payment'
import { uid } from '@/lib/sanitize'

/**
 * Saved payment methods — the single source of truth for payment details.
 * The default method fills every new invoice; invoices can switch to another saved method.
 */
export function PaymentMethods() {
  const { prefs, savePrefs } = useApp()
  const methods = prefs.paymentMethods
  const defaultId = prefs.defaultPaymentId ?? methods[0]?.id
  const [editing, setEditing] = useState<SavedPaymentMethod | null>(null)
  const [toDelete, setToDelete] = useState<SavedPaymentMethod | null>(null)
  const [saving, setSaving] = useState(false)
  const isNew = !!editing && !methods.some((m) => m.id === editing.id)

  const persist = (list: SavedPaymentMethod[], def = prefs.defaultPaymentId) =>
    savePrefs({ ...useApp.getState().prefs, paymentMethods: list, defaultPaymentId: list.some((m) => m.id === def) ? def : list[0]?.id })

  const save = async () => {
    if (!editing) return
    if (!hasPaymentDetails(editing)) { toast.error('Add at least a bank, account, IBAN, payment link or instructions.'); return }
    const m = { ...editing, label: editing.label.trim() || editing.bankName || editing.method || 'Payment method' }
    setSaving(true)
    try {
      const list = isNew ? [...methods, m] : methods.map((x) => (x.id === m.id ? m : x))
      await persist(list, methods.length === 0 ? m.id : prefs.defaultPaymentId)
      toast.success(`“${m.label}” saved.`)
      setEditing(null)
    } finally { setSaving(false) }
  }
  const set = (k: keyof SavedPaymentMethod, v: string) => editing && setEditing({ ...editing, [k]: v })

  return (
    <Section title="Payment methods" description="Save your bank accounts and payment links once. The default is filled in on every new invoice — you can pick another on any invoice."
      aside={<Button size="sm" icon={<Plus className="size-4" />} onClick={() => setEditing({ id: uid(), label: '', ...emptyPayment() })}>Add method</Button>}>
      {methods.length === 0 ? (
        <button type="button" onClick={() => setEditing({ id: uid(), label: '', ...emptyPayment() })} className="flex w-full items-center gap-3 rounded-xl border border-dashed border-line-strong p-4 text-left hover:border-primary hover:bg-primary-50">
          <CreditCard className="size-6 text-primary" aria-hidden />
          <span><span className="block text-sm font-semibold text-ink">Add your first payment method</span><span className="block text-xs text-muted">Bank transfer, IBAN, or a payment link</span></span>
        </button>
      ) : (
        <ul className="space-y-2" aria-label="Payment methods">
          {methods.map((m) => (
            <li key={m.id} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary"><CreditCard className="size-5" aria-hidden /></span>
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setEditing(m)}>
                <span className="block truncate text-sm font-semibold text-ink">{m.label}</span>
                <span className="block truncate text-xs text-muted">{methodSummary(m)}</span>
              </button>
              {m.id === defaultId ? <Badge tone="blue"><Star className="size-3" />Default</Badge>
                : <Button size="sm" variant="ghost" onClick={async () => { await persist(methods, m.id); toast.success(`“${m.label}” is now your default payment method.`) }}>Make default</Button>}
              <Button size="icon" variant="ghost" aria-label={`Edit ${m.label}`} onClick={() => setEditing(m)}><Pencil className="size-4" /></Button>
              <Button size="icon" variant="danger-ghost" aria-label={`Delete ${m.label}`} onClick={() => setToDelete(m)}><Trash2 className="size-4" /></Button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={isNew ? 'Add payment method' : 'Edit payment method'} footer={<>
        <Button onClick={() => setEditing(null)}>Cancel</Button>
        <Button variant="primary" loading={saving} onClick={save}>Save method</Button>
      </>}>
        {editing && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Name for this method" placeholder="e.g. HBL current account" className="sm:col-span-2" value={editing.label} maxLength={100} onChange={(e) => set('label', e.target.value)} data-autofocus />
            <Input label="Payment method" placeholder="Bank transfer" value={editing.method} onChange={(e) => set('method', e.target.value)} />
            <Input label="Bank name" value={editing.bankName} onChange={(e) => set('bankName', e.target.value)} />
            <Input label="Account holder" value={editing.accountHolder} onChange={(e) => set('accountHolder', e.target.value)} />
            <Input label="Account number" value={editing.accountNumber} onChange={(e) => set('accountNumber', e.target.value)} />
            <Input label="IBAN" value={editing.iban} onChange={(e) => set('iban', e.target.value.toUpperCase())} />
            <Input label="SWIFT / BIC" value={editing.swift} onChange={(e) => set('swift', e.target.value.toUpperCase())} />
            <Input label="Payment link" placeholder="https:// or email" className="sm:col-span-2" value={editing.link} onChange={(e) => set('link', e.target.value)} />
            <Textarea label="Payment instructions" rows={2} className="sm:col-span-2" value={editing.instructions} onChange={(e) => set('instructions', e.target.value)} />
          </div>
        )}
      </Modal>
      <ConfirmDialog open={!!toDelete} title="Delete payment method?" message={<>“{toDelete?.label}” will be removed. Existing invoices keep their payment details.</>}
        onCancel={() => setToDelete(null)} onConfirm={async () => { if (toDelete) { await persist(methods.filter((m) => m.id !== toDelete.id)); toast.success('Payment method deleted.') } setToDelete(null) }} />
    </Section>
  )
}
