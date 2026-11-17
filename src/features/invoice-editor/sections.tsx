import { memo, useCallback, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronDown, Copy, Eye, EyeOff, Plus, Trash2, GripVertical, X, Check } from 'lucide-react'
import type { BusinessProfile, CurrencyCode, CustomField, CustomFieldType, Customer, Invoice, InvoiceItem, InvoiceStatus, InvoiceTotals } from '@/types/invoice'
import { Button, Input, Segmented, Select, Switch, Textarea, cx, Badge } from '@/components/common/ui'
import { MoneyInput, NumberInput } from '@/components/forms/inputs'
import { CURRENCIES, formatMoney, convertMinorPrecision, currencyDecimals } from '@/lib/money'
import { newItem } from '@/lib/defaults'
import { uid } from '@/lib/sanitize'
import { addDays, parseISO } from '@/lib/dates'
import { TEMPLATES } from '@/templates/registry'
import { TemplateThumb } from '@/components/invoice/TemplateThumb'
import { toast } from '@/app/store'
import { Section } from '@/components/common/Section'
import { LogoEditor } from '@/components/forms/LogoEditor'

export { Section, LogoEditor }
import { sampleInvoice } from '@/lib/sample'

export type Update = (patch: Partial<Invoice> | ((inv: Invoice) => Partial<Invoice>)) => void
interface P { inv: Invoice; update: Update }


const STATUS: { v: InvoiceStatus; l: string }[] = [
  { v: 'draft', l: 'Draft' }, { v: 'sent', l: 'Sent / unpaid' }, { v: 'paid', l: 'Paid' }, { v: 'overdue', l: 'Overdue' }, { v: 'cancelled', l: 'Cancelled' },
]
const TERMS = [
  { l: 'Due on receipt', d: 0 }, { l: 'Net 7', d: 7 }, { l: 'Net 14', d: 14 }, { l: 'Net 30', d: 30 }, { l: 'Net 60', d: 60 },
]

/* ------------------------------ Details ------------------------------ */
export const DetailsSection = memo(function DetailsSection({ inv, update, numberError }: P & { numberError?: string | null }) {
  const dateErr = inv.dueDate && inv.issueDate && inv.dueDate < inv.issueDate ? 'Due date is before the issue date' : null
  return (
    <Section title="Invoice details" description="Number, dates and currency.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Invoice number" required value={inv.number} maxLength={60} error={numberError ?? (!inv.number.trim() ? 'Invoice number is required' : null)} onChange={(e) => update({ number: e.target.value })} />
        <Input label="Document title" value={inv.title} maxLength={40} hint="e.g. Invoice, Tax Invoice, Proforma" onChange={(e) => update({ title: e.target.value })} />
        <Input label="Issue date" type="date" required value={inv.issueDate} error={!parseISO(inv.issueDate) ? 'Enter a valid date' : null} onChange={(e) => update({ issueDate: e.target.value })} />
        <Input label="Due date" type="date" value={inv.dueDate} error={dateErr} onChange={(e) => update({ dueDate: e.target.value })} />
        <Select label="Payment terms" value={TERMS.find((t) => t.l === inv.paymentTerms)?.l ?? ''} onChange={(e) => {
          const t = TERMS.find((x) => x.l === e.target.value)
          if (t) update({ paymentTerms: t.l, dueDate: addDays(inv.issueDate, t.d) })
        }}>
          <option value="">Custom</option>
          {TERMS.map((t) => <option key={t.l}>{t.l}</option>)}
        </Select>
        <Select label="Status" value={inv.status} onChange={(e) => update({ status: e.target.value as InvoiceStatus })}>
          {STATUS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
        </Select>
        <Select label="Currency" value={inv.currency} hint="Formatting only — no conversion is applied." onChange={(e) => {
          const to = e.target.value as CurrencyCode
          if (currencyDecimals(to) < currencyDecimals(inv.currency)) toast.info(`${to} has fewer decimal places — amounts were rounded. Switch back won't restore the decimals.`)
          update((i) => {
            const conv = (m: number) => convertMinorPrecision(m, i.currency, to)
            return {
              currency: to,
              items: i.items.map((it) => ({ ...it, unitPrice: conv(it.unitPrice), discount: it.discount.type === 'fixed' ? { ...it.discount, value: conv(it.discount.value) } : it.discount })),
              shipping: conv(i.shipping), adjustment: conv(i.adjustment), amountPaid: conv(i.amountPaid),
              invoiceDiscount: i.invoiceDiscount.type === 'fixed' ? { ...i.invoiceDiscount, value: conv(i.invoiceDiscount.value) } : i.invoiceDiscount,
            }
          })
        }}>
          {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
        </Select>
        <Input label="PO number" value={inv.poNumber} maxLength={60} onChange={(e) => update({ poNumber: e.target.value })} />
        <Input label="Reference" value={inv.reference} maxLength={60} className="sm:col-span-2" onChange={(e) => update({ reference: e.target.value })} />
      </div>
    </Section>
  )
})

/* ------------------------------ Business ------------------------------ */

export const BusinessSection = memo(function BusinessSection({ inv, update, profiles, onSaveProfile }: P & { profiles: BusinessProfile[]; onSaveProfile: (asNew: boolean) => void }) {
  const b = inv.business
  const set = (k: keyof typeof b, v: string) => update((i) => ({ business: { ...i.business, [k]: v } }))
  const linked = profiles.find((x) => x.id === inv.businessId)
  return (
    <Section title="From (your business)" description={profiles.length ? 'Choose a saved business or edit the details for this invoice only.' : 'Save these details as a business profile to reuse them.'} aside={
      <div className="flex gap-1">
        {linked && <Button size="sm" variant="ghost" onClick={() => onSaveProfile(false)}>Update profile</Button>}
        <Button size="sm" variant="ghost" onClick={() => onSaveProfile(true)}>Save as new profile</Button>
      </div>
    }>
      {profiles.length > 0 && (
        <Select label="Business profile" className="mb-4" data-tour="business-select" value={profiles.some((x) => x.id === inv.businessId) ? inv.businessId : ''} onChange={(e) => {
          const pick = profiles.find((x) => x.id === e.target.value)
          if (pick) update({ business: structuredClone(pick), businessId: pick.id })
          else update({ businessId: undefined })
        }}>
          <option value="">Custom (this invoice only)</option>
          {profiles.map((x) => <option key={x.id} value={x.id}>{x.name || 'Untitled business'}</option>)}
        </Select>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><LogoEditor logo={b.logo} onChange={(logo) => update((i) => ({ business: { ...i.business, logo } }))} /></div>
        <Input label="Business name" value={b.name} maxLength={200} className="sm:col-span-2" onChange={(e) => set('name', e.target.value)} autoComplete="organization" />
        <Textarea label="Address" value={b.address} rows={2} maxLength={500} className="sm:col-span-2" onChange={(e) => set('address', e.target.value)} />
        <Input label="Email" type="email" value={b.email} maxLength={200} onChange={(e) => set('email', e.target.value)} />
        <Input label="Phone" type="tel" value={b.phone} maxLength={60} onChange={(e) => set('phone', e.target.value)} />
        <Input label="Website" value={b.website} maxLength={200} onChange={(e) => set('website', e.target.value)} />
        <Input label="Tax registration no." value={b.taxNumber} maxLength={60} onChange={(e) => set('taxNumber', e.target.value)} />
        <Input label="VAT number" value={b.vatNumber} maxLength={60} onChange={(e) => set('vatNumber', e.target.value)} />
        <Textarea label="Additional information" value={b.extra} rows={2} maxLength={1000} className="sm:col-span-2" onChange={(e) => set('extra', e.target.value)} />
      </div>
    </Section>
  )
})

/* ------------------------------ Customer ------------------------------ */
type CK = Exclude<keyof Customer, 'hidden' | 'name'>
const OPTIONAL_CUSTOMER: { k: CK; l: string; multiline?: boolean; type?: string }[] = [
  { k: 'company', l: 'Company' }, { k: 'email', l: 'Email', type: 'email' }, { k: 'phone', l: 'Phone', type: 'tel' },
  { k: 'billingAddress', l: 'Billing address', multiline: true }, { k: 'shippingAddress', l: 'Shipping address', multiline: true },
  { k: 'taxId', l: 'Tax ID' }, { k: 'reference', l: 'Customer reference' },
]
export const CustomerSection = memo(function CustomerSection({ inv, update }: P) {
  const c = inv.customer
  const set = (k: keyof Customer, v: unknown) => update((i) => ({ customer: { ...i.customer, [k]: v } }))
  const toggle = (k: CK) => set('hidden', c.hidden.includes(k) ? c.hidden.filter((x) => x !== k) : [...c.hidden, k])
  const visible = OPTIONAL_CUSTOMER.filter((f) => !c.hidden.includes(f.k))
  const hidden = OPTIONAL_CUSTOMER.filter((f) => c.hidden.includes(f.k))
  return (
    <Section title="Bill to (customer)">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Customer name" value={c.name} maxLength={200} className="sm:col-span-2" onChange={(e) => set('name', e.target.value)} />
        {visible.map((f) => {
          const hide = <button type="button" onClick={() => toggle(f.k)} className="ml-2 text-xs font-normal text-muted hover:text-danger" aria-label={`Hide ${f.l}`}>Hide</button>
          return f.multiline
            ? <Textarea key={f.k} label={<>{f.l}{hide}</>} rows={2} maxLength={500} value={c[f.k]} onChange={(e) => set(f.k, e.target.value)} />
            : <Input key={f.k} label={<>{f.l}{hide}</>} type={f.type} maxLength={200} value={c[f.k]} onChange={(e) => set(f.k, e.target.value)} />
        })}
      </div>
      {hidden.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Add field:</span>
          {hidden.map((f) => <Button key={f.k} size="sm" variant="secondary" icon={<Plus className="size-3.5" />} onClick={() => toggle(f.k)}>{f.l}</Button>)}
        </div>
      )}
    </Section>
  )
})

/* ------------------------------ Items ------------------------------ */
const ItemRow = memo(function ItemRow({ item, index, count, currency, taxMode, total, onChange, onMove, onDuplicate, onDelete }: {
  item: InvoiceItem; index: number; count: number; currency: CurrencyCode; taxMode: Invoice['taxMode']; total: number
  onChange: (id: string, p: Partial<InvoiceItem>) => void; onMove: (i: number, d: -1 | 1) => void; onDuplicate: (i: number) => void; onDelete: (i: number) => void
}) {
  const [open, setOpen] = useState(!!(item.description || item.sku || item.unit || item.discount.value))
  const set = (p: Partial<InvoiceItem>) => onChange(item.id, p)
  return (
    <div className="rounded-lg border border-line bg-white" data-testid="item-row">
      <div className="flex items-center gap-2 border-b border-line bg-canvas/60 px-3 py-1.5 rounded-t-lg">
        <GripVertical className="size-4 text-subtle" aria-hidden />
        <span className="text-xs font-medium text-muted">Item {index + 1}</span>
        <span className="ml-auto text-sm font-semibold tabular text-ink">{formatMoney(total, currency)}</span>
        <div className="flex">
          <Button size="icon" variant="ghost" className="size-10 sm:size-8" aria-label={`Move item ${index + 1} up`} disabled={index === 0} onClick={() => onMove(index, -1)}><ArrowUp className="size-4" /></Button>
          <Button size="icon" variant="ghost" className="size-10 sm:size-8" aria-label={`Move item ${index + 1} down`} disabled={index === count - 1} onClick={() => onMove(index, 1)}><ArrowDown className="size-4" /></Button>
          <span className="mx-1 h-5 w-px bg-line" aria-hidden /><Button size="icon" variant="ghost" className="size-10 sm:size-8" aria-label={`Duplicate item ${index + 1}`} onClick={() => onDuplicate(index)}><Copy className="size-4" /></Button>
          <Button size="icon" variant="danger-ghost" className="size-10 sm:size-8" aria-label={`Delete item ${index + 1}`} onClick={() => onDelete(index)}><Trash2 className="size-4" /></Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_88px_128px]">
        <Input label="Item name" placeholder="Product or service" value={item.name} maxLength={300} className="col-span-2 sm:col-span-1" onChange={(e) => set({ name: e.target.value })} />
        <NumberInput label="Qty" value={item.quantity} min={0} max={1e9} onChange={(quantity) => set({ quantity })} />
        <MoneyInput label="Unit price" value={item.unitPrice} currency={currency} onChange={(unitPrice) => set({ unitPrice })} />
      </div>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center gap-1.5 px-3 pb-2.5 text-[13px] font-medium text-primary hover:text-primary-700">
        <ChevronDown className={cx('size-4 transition-transform', open && 'rotate-180')} /> {open ? 'Fewer options' : 'Description, SKU, discount & tax'}
      </button>
      {open && (
        <div className="grid grid-cols-2 gap-3 border-t border-line p-3 sm:grid-cols-4">
          <Textarea label="Description" rows={2} maxLength={2000} className="col-span-2 sm:col-span-4" value={item.description} onChange={(e) => set({ description: e.target.value })} />
          <Input label="SKU / code" value={item.sku} maxLength={60} onChange={(e) => set({ sku: e.target.value })} />
          <Input label="Unit" placeholder="hrs, pcs" value={item.unit} maxLength={20} onChange={(e) => set({ unit: e.target.value })} />
          <div className="col-span-2 sm:col-span-1">
            <div className="mb-1.5 flex items-center justify-between"><span className="text-[13px] font-medium">Discount</span>
              <Segmented size="sm" label="Discount type" value={item.discount.type} onChange={(type) => set({ discount: { type, value: 0 } })} options={[{ value: 'percent', label: '%' }, { value: 'fixed', label: currency }]} />
            </div>
            {item.discount.type === 'percent'
              ? <NumberInput label="Discount percent" srOnlyLabel suffix="%" value={item.discount.value} max={100} onChange={(value) => set({ discount: { type: 'percent', value } })} />
              : <MoneyInput label="Discount amount" srOnlyLabel value={item.discount.value} currency={currency} onChange={(value) => set({ discount: { type: 'fixed', value } })} />}
          </div>
          <NumberInput label="Tax %" suffix="%" value={item.taxRate} max={100} disabled={taxMode === 'invoice'} hint={taxMode === 'invoice' ? 'Invoice-level tax in use' : undefined} onChange={(taxRate) => set({ taxRate })} />
        </div>
      )}
    </div>
  )
})

export const ItemsSection = memo(function ItemsSection({ inv, update, totals, defaultTax }: P & { totals: InvoiceTotals; defaultTax: number }) {
  const [confirmIdx, setConfirmIdx] = useState<number | null>(null)
  const itemsRef = useRef(inv.items)
  itemsRef.current = inv.items
  // Stable handlers keep each memoised ItemRow from re-rendering when another row changes.
  const onChange = useCallback((id: string, p: Partial<InvoiceItem>) => update((i) => ({ items: i.items.map((it) => (it.id === id ? { ...it, ...p } : it)) })), [update])
  const onMove = useCallback((idx: number, d: -1 | 1) => update((i) => {
    const items = [...i.items]
    const j = idx + d
    if (j < 0 || j >= items.length) return {}
    ;[items[idx], items[j]] = [items[j], items[idx]]
    return { items }
  }), [update])
  const onDuplicate = useCallback((idx: number) => update((i) => {
    const items = [...i.items]
    items.splice(idx + 1, 0, { ...items[idx], id: uid() })
    return { items }
  }), [update])
  const doDelete = (idx: number) => { update((i) => ({ items: i.items.filter((_, k) => k !== idx) })); setConfirmIdx(null) }
  const onDelete = useCallback((idx: number) => {
    const it = itemsRef.current[idx]
    if (it && (it.name || it.unitPrice)) setConfirmIdx(idx)
    else update((i) => ({ items: i.items.filter((_, k) => k !== idx) }))
  }, [update])
  return (
    <Section title="Line items" description={`${inv.items.length} item${inv.items.length === 1 ? '' : 's'}`} aside={
      <Button size="sm" variant="primary" icon={<Plus className="size-4" />} onClick={() => update((i) => ({ items: [...i.items, newItem(defaultTax)] }))}>Add item</Button>
    }>
      <div className="space-y-3">
        {inv.items.map((it, idx) => (
          <div key={it.id}>
            <ItemRow item={it} index={idx} count={inv.items.length} currency={inv.currency} taxMode={inv.taxMode} total={totals.lines[idx]?.total ?? 0} onChange={onChange} onMove={onMove} onDuplicate={onDuplicate} onDelete={onDelete} />
            {confirmIdx === idx && (
              <div role="alertdialog" aria-label="Confirm delete" className="mt-1 flex items-center justify-between gap-3 rounded-lg bg-danger-50 px-3 py-2 text-sm">
                <span className="text-danger">Delete “{it.name || 'this item'}”?</span>
                <span className="flex gap-2"><Button size="sm" onClick={() => setConfirmIdx(null)}>Cancel</Button><Button size="sm" variant="danger" onClick={() => doDelete(idx)} autoFocus>Delete</Button></span>
              </div>
            )}
          </div>
        ))}
        {inv.items.length === 0 && <p className="rounded-lg border border-dashed border-line-strong p-6 text-center text-sm text-muted">No items yet. Add your first product or service.</p>}
        <Button variant="secondary" className="w-full justify-center" icon={<Plus className="size-4" />} onClick={() => update((i) => ({ items: [...i.items, newItem(defaultTax)] }))}>Add another item</Button>
      </div>
    </Section>
  )
})

/* ------------------------------ Totals ------------------------------ */
export const TotalsSection = memo(function TotalsSection({ inv, update, totals }: P & { totals: InvoiceTotals }) {
  const m = (v: number) => formatMoney(v, inv.currency)
  return (
    <Section title="Discounts, tax & totals">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-center justify-between"><span className="text-[13px] font-medium">Invoice discount</span>
            <Segmented size="sm" label="Invoice discount type" value={inv.invoiceDiscount.type} onChange={(type) => update({ invoiceDiscount: { type, value: 0 } })} options={[{ value: 'percent', label: '%' }, { value: 'fixed', label: inv.currency }]} />
          </div>
          {inv.invoiceDiscount.type === 'percent'
            ? <NumberInput label="Invoice discount percent" srOnlyLabel suffix="%" value={inv.invoiceDiscount.value} max={100} hint="Applied before tax" onChange={(value) => update({ invoiceDiscount: { type: 'percent', value } })} />
            : <MoneyInput label="Invoice discount amount" srOnlyLabel value={inv.invoiceDiscount.value} currency={inv.currency} hint="Applied before tax" onChange={(value) => update({ invoiceDiscount: { type: 'fixed', value } })} />}
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between"><span className="text-[13px] font-medium">Tax</span>
            <Segmented size="sm" label="Tax mode" value={inv.taxMode} onChange={(taxMode) => update({ taxMode })} options={[{ value: 'item', label: 'Per item' }, { value: 'invoice', label: 'Whole invoice' }]} />
          </div>
          {inv.taxMode === 'invoice'
            ? <NumberInput label="Invoice tax rate" srOnlyLabel suffix="%" value={inv.invoiceTaxRate} max={100} hint="Replaces per-item rates (never added twice)" onChange={(invoiceTaxRate) => update({ invoiceTaxRate })} />
            : <p className="flex h-10 items-center rounded-lg bg-canvas px-3 text-[13px] text-muted">Set each item's tax rate in Line items.</p>}
        </div>
        <MoneyInput label="Shipping / additional charges" value={inv.shipping} currency={inv.currency} onChange={(shipping) => update({ shipping })} />
        <div className="grid grid-cols-[1fr_1fr] gap-2">
          <Input label="Adjustment label" value={inv.adjustmentLabel} maxLength={40} onChange={(e) => update({ adjustmentLabel: e.target.value })} />
          <MoneyInput label="Amount (±)" allowNegative value={inv.adjustment} currency={inv.currency} onChange={(adjustment) => update({ adjustment })} />
        </div>
        <MoneyInput label="Amount paid" value={inv.amountPaid} currency={inv.currency} onChange={(amountPaid) => update({ amountPaid })} />
      </div>
      <dl className="mt-5 space-y-1.5 rounded-lg bg-canvas p-4 text-sm tabular">
        <Row k="Subtotal" v={m(totals.subtotal)} />
        {totals.totalDiscount > 0 && <Row k="Discounts" v={`−${m(totals.totalDiscount)}`} />}
        <Row k="Tax" v={m(totals.tax)} />
        {totals.shipping !== 0 && <Row k="Shipping" v={m(totals.shipping)} />}
        {totals.adjustment !== 0 && <Row k={inv.adjustmentLabel || 'Adjustment'} v={m(totals.adjustment)} />}
        <div className="border-t border-line pt-2"><Row k="Grand total" v={m(totals.grandTotal)} strong /></div>
        {totals.amountPaid > 0 && <><Row k="Paid" v={`−${m(totals.amountPaid)}`} /><Row k="Balance due" v={m(totals.balanceDue)} strong /></>}
      </dl>
      {totals.balanceDue < 0 && <p className="mt-2 text-xs text-warning">Amount paid exceeds the total — the balance shows as a credit.</p>}
    </Section>
  )
})
const Row = ({ k, v, strong }: { k: string; v: string; strong?: boolean }) => (
  <div className={cx('flex justify-between gap-4', strong ? 'font-semibold text-ink text-[15px]' : 'text-muted')}><dt>{k}</dt><dd>{v}</dd></div>
)

/* ------------------------------ Payment ------------------------------ */
export const PaymentSection = memo(function PaymentSection({ inv, update }: P) {
  const p = inv.payment
  const set = (k: keyof typeof p, v: string | boolean) => update((i) => ({ payment: { ...i.payment, [k]: v } }))
  return (
    <Section title="Payment information" aside={<Switch label="Show on invoice" checked={p.visible} onChange={(v) => set('visible', v)} />}>
      <div className={cx('grid gap-4 sm:grid-cols-2', !p.visible && 'opacity-60')}>
        <Input label="Payment method" value={p.method} maxLength={60} placeholder="Bank transfer" onChange={(e) => set('method', e.target.value)} />
        <Input label="Bank name" value={p.bankName} maxLength={100} onChange={(e) => set('bankName', e.target.value)} />
        <Input label="Account holder" value={p.accountHolder} maxLength={100} onChange={(e) => set('accountHolder', e.target.value)} />
        <Input label="Account number" value={p.accountNumber} maxLength={60} onChange={(e) => set('accountNumber', e.target.value)} />
        <Input label="IBAN" value={p.iban} maxLength={50} onChange={(e) => set('iban', e.target.value.toUpperCase())} />
        <Input label="SWIFT / BIC" value={p.swift} maxLength={20} onChange={(e) => set('swift', e.target.value.toUpperCase())} />
        <Input label="Payment link" type="url" value={p.link} maxLength={300} placeholder="https://" className="sm:col-span-2" onChange={(e) => set('link', e.target.value)} />
        <Textarea label="Payment instructions" rows={2} maxLength={1000} className="sm:col-span-2" value={p.instructions} onChange={(e) => set('instructions', e.target.value)} />
      </div>
    </Section>
  )
})

/* ------------------------------ Custom fields ------------------------------ */
const FIELD_TYPES: { v: CustomFieldType; l: string }[] = [{ v: 'text', l: 'Text' }, { v: 'multiline', l: 'Multi-line' }, { v: 'number', l: 'Number' }, { v: 'date', l: 'Date' }, { v: 'url', l: 'URL' }]
export const newField = (label = ''): CustomField => ({ id: uid(), label, value: '', type: 'text', required: false, visible: true })

export function fieldError(f: CustomField): string | null {
  if (f.required && !f.value.trim()) return 'Required'
  if (!f.value) return null
  if (f.type === 'number' && !Number.isFinite(Number(f.value))) return 'Enter a number'
  if (f.type === 'date' && !parseISO(f.value)) return 'Enter a valid date'
  if (f.type === 'url' && !/^(https?:\/\/)?[\w-]+(\.[\w-]+)+\S*$/i.test(f.value)) return 'Enter a valid URL'
  return null
}

export function FieldListEditor({ fields, onChange, emptyText }: { fields: CustomField[]; onChange: (f: CustomField[]) => void; emptyText: string }) {
  const set = (id: string, p: Partial<CustomField>) => onChange(fields.map((f) => (f.id === id ? { ...f, ...p } : f)))
  const move = (i: number, d: -1 | 1) => { const a = [...fields]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; onChange(a) }
  return (
    <div className="space-y-3">
      {fields.length === 0 && <p className="text-sm text-muted">{emptyText}</p>}
      {fields.map((f, i) => (
        <div key={f.id} className={cx('rounded-lg border border-line p-3', !f.visible && 'bg-canvas')}>
          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <Input label="Label" value={f.label} maxLength={80} placeholder="e.g. Project name" error={!f.label.trim() && f.value ? 'Add a label' : null} onChange={(e) => set(f.id, { label: e.target.value })} />
            <Select label="Type" value={f.type} onChange={(e) => set(f.id, { type: e.target.value as CustomFieldType })}>
              {FIELD_TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
            </Select>
            {f.type === 'multiline'
              ? <Textarea label="Value" rows={2} maxLength={2000} className="sm:col-span-2" required={f.required} value={f.value} error={fieldError(f)} onChange={(e) => set(f.id, { value: e.target.value })} />
              : <Input label="Value" className="sm:col-span-2" maxLength={500} required={f.required} type={f.type === 'date' ? 'date' : f.type === 'url' ? 'url' : 'text'} inputMode={f.type === 'number' ? 'decimal' : undefined} value={f.value} error={fieldError(f)} onChange={(e) => set(f.id, { value: e.target.value })} />}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <label className="mr-2 flex items-center gap-1.5 text-xs text-muted"><input type="checkbox" checked={f.required} onChange={(e) => set(f.id, { required: e.target.checked })} className="accent-[var(--color-primary)]" /> Required</label>
            <Button size="sm" variant="ghost" icon={f.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />} onClick={() => set(f.id, { visible: !f.visible })} aria-pressed={f.visible}>{f.visible ? 'Visible' : 'Hidden'}</Button>
            <span className="ml-auto flex">
              <Button size="icon" variant="ghost" className="size-10 sm:size-8" aria-label="Move field up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="size-4" /></Button>
              <Button size="icon" variant="ghost" className="size-10 sm:size-8" aria-label="Move field down" disabled={i === fields.length - 1} onClick={() => move(i, 1)}><ArrowDown className="size-4" /></Button>
              <Button size="icon" variant="danger-ghost" className="size-10 sm:size-8" aria-label="Remove field" onClick={() => onChange(fields.filter((x) => x.id !== f.id))}><Trash2 className="size-4" /></Button>
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

const SUGGESTED = ['Project name', 'Department', 'Sales representative', 'Contract number', 'Delivery reference', 'Service period', 'Client code']

export const CustomFieldsSection = memo(function CustomFieldsSection({ inv, update }: P) {
  return (
    <Section title="Custom fields" description="Extra details shown with the invoice information." aside={<Button size="sm" variant="primary" icon={<Plus className="size-4" />} onClick={() => update((i) => ({ customFields: [...i.customFields, newField()] }))}>Add custom field</Button>}>
      <FieldListEditor fields={inv.customFields} onChange={(customFields) => update({ customFields })} emptyText="No custom fields yet." />
      <div className="mt-3 flex flex-wrap gap-1.5">
        {SUGGESTED.filter((s) => !inv.customFields.some((f) => f.label === s)).slice(0, 5).map((s) => (
          <button key={s} type="button" onClick={() => update((i) => ({ customFields: [...i.customFields, newField(s)] }))} className="rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:border-primary hover:text-primary">+ {s}</button>
        ))}
      </div>
    </Section>
  )
})

export const CustomSectionsSection = memo(function CustomSectionsSection({ inv, update }: P) {
  const setSec = (id: string, p: Partial<Invoice['customSections'][number]>) => update((i) => ({ customSections: i.customSections.map((s) => (s.id === id ? { ...s, ...p } : s)) }))
  return (
    <Section title="Custom sections" description="Group several fields under their own heading (e.g. Delivery details)." aside={
      <Button size="sm" icon={<Plus className="size-4" />} onClick={() => update((i) => ({ customSections: [...i.customSections, { id: uid(), title: 'New section', visible: true, fields: [newField()] }] }))}>Add section</Button>
    }>
      {inv.customSections.length === 0 && <p className="text-sm text-muted">No custom sections.</p>}
      <div className="space-y-4">
        {inv.customSections.map((s, i) => (
          <div key={s.id} className="rounded-lg border border-line-strong p-3">
            <div className="flex items-end gap-2">
              <Input label="Section title" className="flex-1" value={s.title} maxLength={80} onChange={(e) => setSec(s.id, { title: e.target.value })} />
              <Button size="icon" variant="ghost" aria-label={s.visible ? 'Hide section' : 'Show section'} onClick={() => setSec(s.id, { visible: !s.visible })}>{s.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}</Button>
              <Button size="icon" variant="ghost" aria-label="Move section up" disabled={i === 0} onClick={() => update((inv2) => { const a = [...inv2.customSections]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; return { customSections: a } })}><ArrowUp className="size-4" /></Button>
              <Button size="icon" variant="danger-ghost" aria-label="Remove section" onClick={() => update((inv2) => ({ customSections: inv2.customSections.filter((x) => x.id !== s.id) }))}><X className="size-4" /></Button>
            </div>
            <div className="mt-3"><FieldListEditor fields={s.fields} onChange={(fields) => setSec(s.id, { fields })} emptyText="No fields in this section." /></div>
            <Button size="sm" variant="ghost" className="mt-2" icon={<Plus className="size-4" />} onClick={() => setSec(s.id, { fields: [...s.fields, newField()] })}>Add field</Button>
          </div>
        ))}
      </div>
    </Section>
  )
})

/* ------------------------------ Notes ------------------------------ */
const TEXT_KEYS = [
  { k: 'notes', l: 'Invoice notes' }, { k: 'terms', l: 'Payment terms' }, { k: 'conditions', l: 'Terms & conditions' },
  { k: 'thankYou', l: 'Thank-you message' }, { k: 'footer', l: 'Footer' },
] as const
export const NotesSection = memo(function NotesSection({ inv, update }: P) {
  return (
    <Section title="Notes & terms" description="Toggle each block on or off.">
      <div className="space-y-4">
        {TEXT_KEYS.map(({ k, l }) => (
          <div key={k}>
            <Switch label={l} checked={inv[k].visible} onChange={(visible) => update((i) => ({ [k]: { ...i[k], visible } }))} className="mb-2" />
            {inv[k].visible && <Textarea label={l} srOnlyLabel rows={k === 'thankYou' || k === 'footer' ? 1 : 3} maxLength={4000} value={inv[k].text} onChange={(e) => update((i) => ({ [k]: { ...i[k], text: e.target.value } }))} />}
          </div>
        ))}
      </div>
    </Section>
  )
})

/* ------------------------------ Design ------------------------------ */
const thumbCache = new Map<string, Invoice>()
const thumbFor = (id: Invoice['template']) => {
  let v = thumbCache.get(id)
  if (!v) { v = sampleInvoice(id); thumbCache.set(id, v) }
  return v
}

export const DesignSection = memo(function DesignSection({ inv, update }: P) {
  return (
    <Section title="Template & layout" description="Switch templates at any time — your data stays the same.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {TEMPLATES.map((t) => {
          const active = inv.template === t.id
          return (
            <button key={t.id} type="button" aria-pressed={active} onClick={() => update({ template: t.id, accentColor: undefined })}
              className={cx('group overflow-hidden rounded-lg border-2 text-left transition-colors', active ? 'border-primary' : 'border-line hover:border-line-strong')}>
              <div className="relative border-b border-line bg-canvas">
                <TemplateThumb invoice={thumbFor(t.id)} />
                {active && <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-white"><Check className="size-4" /></span>}
              </div>
              <div className="px-2.5 py-2"><div className="truncate text-[13px] font-medium text-ink">{t.name}</div></div>
            </button>
          )
        })}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <span className="mb-1.5 block text-[13px] font-medium">Paper size</span>
          <Segmented label="Paper size" value={inv.paperSize} onChange={(paperSize) => update({ paperSize })} options={[{ value: 'A4', label: 'A4' }, { value: 'Letter', label: 'Letter' }, { value: 'Legal', label: 'Legal' }]} />
        </div>
        <div>
          <label htmlFor="accent" className="mb-1.5 block text-[13px] font-medium">Accent colour</label>
          <div className="flex items-center gap-2">
            <input id="accent" type="color" value={inv.accentColor ?? '#0692F4'} onChange={(e) => update({ accentColor: e.target.value })} className="h-10 w-14 cursor-pointer rounded-lg border border-line-strong bg-white p-1" />
            {inv.accentColor ? <Button size="sm" variant="ghost" onClick={() => update({ accentColor: undefined })}>Reset to template</Button> : <Badge>Template default</Badge>}
          </div>
        </div>
      </div>
    </Section>
  )
})
