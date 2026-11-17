import { useSeo } from '@/hooks/useSeo'
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Download, Eye, FilePlus2, Pencil, Printer, Save, RotateCcw } from 'lucide-react'
import type { Invoice } from '@/types/invoice'
import { useApp, toast } from '@/app/store'
import { Badge, Button, ConfirmDialog, Segmented, Spinner, cx } from '@/components/common/ui'
import { ScaledPreview } from '@/components/invoice/ScaledPreview'
import { calculateTotals } from '@/lib/calc'
import { createInvoice } from '@/lib/defaults'
import { formatMoney } from '@/lib/money'
import { parseISO } from '@/lib/dates'
import { storage } from '@/services/storage/db'
import { useInvoiceActions } from '@/hooks/useInvoiceActions'
import { TEMPLATES } from '@/templates/registry'
import {
  BusinessSection, CustomFieldsSection, CustomSectionsSection, CustomerSection, DesignSection, DetailsSection,
  ItemsSection, NotesSection, PaymentSection, TotalsSection, fieldError, type Update,
} from './sections'

const TABS = [
  { id: 'details', label: 'Details' },
  { id: 'parties', label: 'From & To' },
  { id: 'items', label: 'Items' },
  { id: 'payment', label: 'Payment' },
  { id: 'extras', label: 'Extras' },
  { id: 'design', label: 'Design' },
] as const
type Tab = (typeof TABS)[number]['id']

/** Problems that block saving as a completed invoice. */
function validate(inv: Invoice, duplicate: boolean): string[] {
  const e: string[] = []
  if (!inv.number.trim()) e.push('Invoice number is required.')
  if (duplicate) e.push(`Invoice number ${inv.number} is already used by another saved invoice.`)
  if (!parseISO(inv.issueDate)) e.push('Issue date is invalid.')
  if (inv.dueDate && !parseISO(inv.dueDate)) e.push('Due date is invalid.')
  if (!inv.customer.name.trim() && !inv.customer.company.trim()) e.push('Add a customer name.')
  if (!inv.items.some((i) => i.name.trim())) e.push('Add at least one line item.')
  if ([...inv.customFields, ...inv.customSections.flatMap((s) => s.fields)].some((f) => fieldError(f))) e.push('Fix the highlighted custom fields.')
  return e
}

export default function EditorPage() {
  useSeo({ title: 'Create an Invoice Online – Free Invoice Maker', description: 'Fill in your invoice with a live preview, then download a PDF or print. Free, private and no sign-up.', path: '/create' })
  const { id } = useParams()
  const nav = useNavigate()
  const [search] = useSearchParams()
  const templateParam = TEMPLATES.find((t) => t.id === search.get('template'))?.id
  const { prefs, business, businesses, invoices, saveInvoice, saveBusiness, nextNumber } = useApp()
  const [inv, setInv] = useState<Invoice | null>(null)
  const [savedSnapshot, setSavedSnapshot] = useState<string>('')
  const [restored, setRestored] = useState(false)
  const [tab, setTab] = useState<Tab>('details')
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit')
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [confirmNew, setConfirmNew] = useState(false)
  const { busy, downloadPdf, print } = useInvoiceActions()
  const isSaved = useMemo(() => !!inv && invoices.some((i) => i.id === inv.id), [inv, invoices])

  // Load: saved invoice by id, else restore autosaved draft, else new invoice.
  useEffect(() => {
    let live = true
    ;(async () => {
      const draft = await storage.getEditorDraft().catch(() => null)
      let next: Invoice
      let snap = ''
      if (id) {
        const saved = invoices.find((i) => i.id === id) ?? (await storage.getInvoice(id))
        if (!saved) { toast.error('That invoice no longer exists.'); nav('/invoices', { replace: true }); return }
        snap = JSON.stringify(saved)
        if (draft && draft.id === id && draft.updatedAt > saved.updatedAt && JSON.stringify(draft) !== snap) { next = draft; setRestored(true) }
        else next = saved
      } else if (draft && !invoices.some((i) => i.id === draft.id)) {
        next = draft
        setRestored(true)
      } else {
        next = createInvoice(prefs, business, nextNumber())
        snap = JSON.stringify(next)
      }
      if (next && templateParam && !id) next = { ...next, template: templateParam, accentColor: undefined }
      if (live) { setInv(next); setSavedSnapshot(snap) }
    })()
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, templateParam])

  const update: Update = useCallback((patch) => {
    setInv((cur) => (cur ? { ...cur, ...(typeof patch === 'function' ? patch(cur) : patch), updatedAt: Date.now() } : cur))
  }, [])

  const dirty = !!inv && JSON.stringify(inv) !== savedSnapshot

  // Autosave work-in-progress (debounced) so a refresh or crash never loses data.
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (!inv) return
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => { storage.saveEditorDraft(dirty ? inv : null).catch(() => undefined) }, 500)
    return () => window.clearTimeout(timer.current)
  }, [inv, dirty])

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault() } }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  const deferred = useDeferredValue(inv)
  const totals = useMemo(() => (inv ? calculateTotals(inv) : null), [inv])
  const duplicateNumber = !!inv && invoices.some((i) => i.number === inv.number.trim() && i.id !== inv.id)

  if (!inv || !totals || !deferred) return <Spinner label="Loading invoice" />

  const save = async (asDraft: boolean) => {
    const problems = validate(inv, duplicateNumber)
    const blocking = asDraft ? problems.filter((p) => p.startsWith('Invoice number')) : problems
    setErrors(blocking)
    if (blocking.length) { toast.error(blocking[0]); return }
    setSaving(true)
    try {
      const toSave: Invoice = { ...inv, number: inv.number.trim(), status: !asDraft && inv.status === 'draft' ? 'sent' : inv.status }
      await saveInvoice(toSave)
      await storage.saveEditorDraft(null)
      setInv(toSave)
      setSavedSnapshot(JSON.stringify(toSave))
      setRestored(false)
      toast.success(asDraft ? 'Draft saved.' : `Invoice ${toSave.number} saved.`)
      if (!id) nav(`/edit/${toSave.id}`, { replace: true })
    } catch (e) {
      toast.error(`Could not save: ${(e as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  const startNew = async () => {
    await storage.saveEditorDraft(null)
    setConfirmNew(false)
    const fresh = createInvoice(prefs, business, nextNumber())
    setInv(fresh)
    setSavedSnapshot(JSON.stringify(fresh))
    setRestored(false)
    setErrors([])
    setTab('details')
    if (id) nav('/create')
  }

  const discardRestore = async () => {
    await storage.saveEditorDraft(null)
    if (id) {
      const saved = invoices.find((i) => i.id === id)
      if (saved) { setInv(saved); setSavedSnapshot(JSON.stringify(saved)) }
    } else {
      const fresh = createInvoice(prefs, business, nextNumber())
      setInv(fresh)
      setSavedSnapshot(JSON.stringify(fresh))
    }
    setRestored(false)
  }

  const tplName = TEMPLATES.find((t) => t.id === inv.template)?.name

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-semibold tracking-tight">{isSaved ? `Edit ${inv.number || 'invoice'}` : 'New invoice'}</h1>
            {dirty ? <Badge tone="amber">Unsaved changes</Badge> : isSaved ? <Badge tone="green">Saved</Badge> : null}
          </div>
          <p className="mt-0.5 text-sm text-muted">Total <span className="font-semibold text-ink tabular">{formatMoney(totals.grandTotal, inv.currency)}</span> · {tplName} · {inv.paperSize}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="md" variant="ghost" icon={<FilePlus2 className="size-4" />} onClick={() => (dirty ? setConfirmNew(true) : startNew())}>New</Button>
          <Button icon={<Printer className="size-4" />} loading={busy === `print:${inv.id}`} onClick={() => print(inv)}>Print</Button>
          <Button icon={<Download className="size-4" />} loading={busy === `pdf:${inv.id}`} onClick={() => downloadPdf(inv)}>PDF</Button>
          <Button onClick={() => save(true)} loading={saving}>Save draft</Button>
          <Button variant="primary" icon={<Save className="size-4" />} onClick={() => save(false)} loading={saving}>Save invoice</Button>
        </div>
      </div>

      {restored && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary-100 bg-primary-50 px-4 py-2.5 text-sm">
          <span className="text-primary-700">We restored your unsaved changes from last time.</span>
          <Button size="sm" variant="ghost" icon={<RotateCcw className="size-4" />} onClick={discardRestore}>Discard changes</Button>
        </div>
      )}
      {errors.length > 0 && (
        <div role="alert" className="mb-4 rounded-lg border border-[#f5c2c7] bg-danger-50 px-4 py-3 text-sm text-danger">
          <p className="font-medium">Please fix the following before saving:</p>
          <ul className="mt-1 list-disc pl-5">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      )}

      {/* Mobile edit/preview switch */}
      <div className="mb-4 lg:hidden">
        <Segmented label="View" value={mobileView} onChange={setMobileView} className="w-full [&>button]:flex-1" options={[{ value: 'edit', label: <><Pencil className="size-4" />Edit</> }, { value: 'preview', label: <><Eye className="size-4" />Preview</> }]} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className={cx('min-w-0', mobileView === 'preview' && 'hidden lg:block')}>
          <div role="tablist" aria-label="Invoice sections" className="sticky top-16 z-20 -mx-4 mb-4 flex gap-1 overflow-x-auto bg-canvas/95 px-4 py-2 backdrop-blur scrollbar-thin sm:mx-0 sm:rounded-xl sm:border sm:border-line sm:bg-white sm:p-1">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} aria-controls={`panel-${t.id}`} id={`tab-${t.id}`} onClick={() => setTab(t.id)}
                className={cx('shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors', tab === t.id ? 'bg-primary text-white shadow-xs' : 'text-muted hover:bg-canvas hover:text-ink')}>
                {t.label}
              </button>
            ))}
          </div>
          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="space-y-4">
            {tab === 'details' && <DetailsSection inv={inv} update={update} numberError={duplicateNumber ? 'This number is already used by a saved invoice' : null} />}
            {tab === 'parties' && <>
              <CustomerSection inv={inv} update={update} />
              <BusinessSection inv={inv} update={update} profiles={businesses} onSaveProfile={async (asNew) => {
                if (!inv.business.name.trim()) { toast.error('Enter a business name first.'); return }
                const saved = await saveBusiness(asNew ? { ...inv.business, id: undefined } : { ...inv.business, id: inv.businessId })
                update({ businessId: saved.id, business: { ...inv.business, id: saved.id } })
                toast.success(asNew ? `Saved “${saved.name}” as a business profile.` : `Updated “${saved.name}”.`)
              }} />
            </>}
            {tab === 'items' && <>
              <ItemsSection inv={inv} update={update} totals={totals} defaultTax={prefs.defaultTaxRate} />
              <TotalsSection inv={inv} update={update} totals={totals} />
            </>}
            {tab === 'payment' && <PaymentSection inv={inv} update={update} />}
            {tab === 'extras' && <>
              <CustomFieldsSection inv={inv} update={update} />
              <CustomSectionsSection inv={inv} update={update} />
              <NotesSection inv={inv} update={update} />
            </>}
            {tab === 'design' && <DesignSection inv={inv} update={update} />}
          </div>
          <div className="mt-4 flex justify-between">
            <Button variant="ghost" disabled={tab === TABS[0].id} onClick={() => setTab(TABS[TABS.findIndex((t) => t.id === tab) - 1].id)}>Back</Button>
            {tab !== 'design'
              ? <Button variant="secondary" onClick={() => setTab(TABS[TABS.findIndex((t) => t.id === tab) + 1].id)}>Next: {TABS[TABS.findIndex((t) => t.id === tab) + 1].label}</Button>
              : <Button variant="primary" onClick={() => save(false)} loading={saving}>Save invoice</Button>}
          </div>
        </div>

        <div className={cx('min-w-0', mobileView === 'edit' && 'hidden lg:block')}>
          <div className="lg:sticky lg:top-20">
            <div className="rounded-xl border border-line bg-[#eef1f5] p-3 sm:p-5 lg:max-h-[calc(100dvh-6.5rem)] lg:overflow-y-auto scrollbar-thin" aria-label="Invoice preview">
              <ScaledPreview invoice={deferred} prefs={prefs} pageGap={20} />
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog open={confirmNew} title="Start a new invoice?" danger={false} confirmLabel="Discard & start new"
        message="You have unsaved changes on this invoice. They will be discarded." onCancel={() => setConfirmNew(false)} onConfirm={startNew} />
    </div>
  )
}
