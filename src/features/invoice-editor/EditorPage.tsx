import { useSeo } from '@/hooks/useSeo'
import { completion } from '@/lib/completion'
import { ToolGuide } from '@/features/content/SeoSections'
import { CircleCheck, FileDown, FolderOpen, Maximize2, Send } from 'lucide-react'
import { clientToCustomer, customerToClient } from '@/lib/clients'
import { APP_MODE } from '@/lib/appMode'
import { useAppBarActions } from '@/app/appBar'
import { AppBarIcon } from '@/components/layout/AppBarIcon'
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Download, Eye, FilePlus2, Pencil, Printer, Save, RotateCcw } from 'lucide-react'
import type { Invoice } from '@/types/invoice'
import { useApp, toast } from '@/app/store'
import { Badge, Button, ConfirmDialog, Modal, Segmented, Spinner, cx } from '@/components/common/ui'
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

/** Which editor tab owns a validation message. */
function tabForError(e: string): Tab {
  if (/customer/i.test(e)) return 'parties'
  if (/line item/i.test(e)) return 'items'
  if (/custom field/i.test(e)) return 'extras'
  return 'details'
}

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
  useSeo({ title: 'Online Invoice Maker – Create a Free Invoice in Minutes', description: 'Make an invoice online for free: add your logo, client, items, GST/VAT tax and discounts with a live preview, then download a PDF, print or share. No sign-up.', path: '/create' })
  const { id } = useParams()
  const nav = useNavigate()
  const [search] = useSearchParams()
  const templateParam = TEMPLATES.find((t) => t.id === search.get('template'))?.id
  const { prefs, business, businesses, clients, invoices, saveInvoice, saveBusiness, saveClient, nextNumber } = useApp()
  const clientParam = search.get('client')
  const [inv, setInv] = useState<Invoice | null>(null)
  const [dirty, setDirty] = useState(false)
  const [restored, setRestored] = useState(false)
  const [tab, setTabRaw] = useState<Tab>('details')
  const [slide, setSlide] = useState<'left' | 'right' | null>(null)
  /** Change section; forward moves slide in from the right, backward from the left. */
  const setTab = (next: Tab) => {
    const from = TABS.findIndex((t) => t.id === tab), to = TABS.findIndex((t) => t.id === next)
    if (to !== from) setSlide(to > from ? 'right' : 'left')
    setTabRaw(next)
  }
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit')
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [confirmNew, setConfirmNew] = useState(false)
  const { busy, downloadPdf, print, share } = useInvoiceActions()
  const [zoom, setZoom] = useState(1)
  const location = useLocation()
  const [nextSteps, setNextSteps] = useState<boolean>(() => !!(location.state as { justSaved?: boolean } | null)?.justSaved)
  // One-shot: clear the flag from history so Back/refresh never re-opens the "saved" panel
  useEffect(() => {
    if ((location.state as { justSaved?: boolean } | null)?.justSaved) nav(location.pathname + location.search, { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const invId = inv?.id
  const isSaved = useMemo(() => !!invId && invoices.some((i) => i.id === invId), [invId, invoices])
  const draftKey = id ?? 'new'

  // Load: saved invoice by id, else restore autosaved draft, else new invoice.
  useEffect(() => {
    let live = true
    ;(async () => {
      const draft = await storage.getEditorDraft(id ?? 'new').catch(() => null)
      let next: Invoice
      let fromDraft = false
      if (id) {
        const saved = invoices.find((i) => i.id === id) ?? (await storage.getInvoice(id))
        if (!saved) { toast.error('That invoice no longer exists.'); nav('/invoices', { replace: true }); return }
        if (draft && draft.id === id && draft.updatedAt > saved.updatedAt) { next = draft; fromDraft = true }
        else next = saved
      } else if (draft && !invoices.some((i) => i.id === draft.id)) {
        next = draft
        fromDraft = true
      } else {
        next = createInvoice(prefs, business, nextNumber())
      }
      if (templateParam && !id) next = { ...next, template: templateParam, accentColor: undefined }
      const pickedClient = !id && clientParam ? useApp.getState().clients.find((c) => c.id === clientParam) : undefined
      if (pickedClient && !fromDraft) next = { ...next, customer: clientToCustomer(pickedClient) }
      if (live) { setInv(next); setDirty(fromDraft); setRestored(fromDraft); setErrors([]) }
    })()
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, templateParam, clientParam])

  const update: Update = useCallback((patch) => {
    setInv((cur) => (cur ? { ...cur, ...(typeof patch === 'function' ? patch(cur) : patch), updatedAt: Date.now() } : cur))
    setDirty(true)
  }, [])

  // Autosave work-in-progress (debounced, per invoice) so a refresh, crash or navigation never loses data.
  const timer = useRef<number | undefined>(undefined)
  const appActions = useRef<{ print: () => void; pdf: () => void; fresh: () => void }>({ print: () => undefined, pdf: () => undefined, fresh: () => undefined })
  useAppBarActions(APP_MODE ? <>
    <AppBarIcon label="New invoice" onClick={() => appActions.current.fresh()}><FilePlus2 className="size-[22px]" /></AppBarIcon>
    <AppBarIcon label="Print" onClick={() => appActions.current.print()}><Printer className="size-[22px]" /></AppBarIcon>
    <AppBarIcon label="Download PDF" busy={!!busy} onClick={() => appActions.current.pdf()}><Download className="size-[22px]" /></AppBarIcon>
  </> : null, APP_MODE && inv ? (isSaved ? inv.number || 'Edit invoice' : 'New invoice') : null, [busy, isSaved, inv?.number])
  const formTop = useRef<HTMLDivElement>(null)
  const pending = useRef<(() => void) | null>(null)
  const warned = useRef(false)
  useEffect(() => {
    if (!inv || !dirty) return
    const slot = draftKey
    const write = () => {
      pending.current = null
      storage.saveEditorDraft(slot, inv).catch((e) => {
        if (!warned.current) { warned.current = true; toast.error(`Autosave failed (${(e as Error).message}). Save your invoice to keep changes.`) }
      })
    }
    pending.current = write
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(write, 1500)
    return () => window.clearTimeout(timer.current)
  }, [inv, dirty, draftKey])
  // Flush pending autosave when leaving the page or the editor
  useEffect(() => {
    const flush = () => pending.current?.()
    const vis = () => { if (document.visibilityState === 'hidden') flush() }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', vis)
    return () => { flush(); window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', vis) }
  }, [])

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault() } }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  const deferred = useDeferredValue(inv)
  const totals = useMemo(() => (inv ? calculateTotals(inv) : null), [inv])
  const numberOwner = useMemo(() => new Map(invoices.map((i) => [i.number, i.id])), [invoices])
  const owner = inv ? numberOwner.get(inv.number.trim()) : undefined
  const duplicateNumber = !!owner && owner !== inv?.id

  if (!inv || !totals || !deferred) return <Spinner label="Loading invoice" />

  const save = async (asDraft: boolean, thenShare = false) => {
    const problems = validate(inv, duplicateNumber)
    const blocking = asDraft ? problems.filter((p) => p.startsWith('Invoice number')) : problems
    setErrors(blocking)
    if (blocking.length) { toast.error(blocking[0]); return }
    setSaving(true)
    try {
      const toSave: Invoice = { ...inv, number: inv.number.trim(), status: !asDraft && inv.status === 'draft' ? 'sent' : inv.status }
      window.clearTimeout(timer.current)
      pending.current = null
      const saved = await saveInvoice(toSave)
      await Promise.all([storage.saveEditorDraft(draftKey, null), storage.saveEditorDraft(saved.id, null)]).catch(() => undefined)
      setInv(saved)
      setDirty(false)
      setRestored(false)
      toast.success(asDraft ? 'Draft saved.' : `Invoice ${toSave.number} saved.`)
      if (thenShare) share(saved)
      if (!asDraft && !thenShare) setNextSteps(true)
      if (!id) nav(`/edit/${saved.id}`, { replace: true, state: { justSaved: !asDraft && !thenShare } })
    } catch (e) {
      toast.error(`Could not save: ${(e as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  const startNew = async () => {
    window.clearTimeout(timer.current)
    pending.current = null
    await storage.saveEditorDraft(draftKey, null).catch(() => undefined)
    setConfirmNew(false)
    const fresh = createInvoice(prefs, business, nextNumber())
    setInv(fresh)
    setDirty(false)
    setRestored(false)
    setErrors([])
    setTab('details')
    if (id) nav('/create')
  }

  const discardRestore = async () => {
    window.clearTimeout(timer.current)
    pending.current = null
    await storage.saveEditorDraft(draftKey, null).catch(() => undefined)
    if (id) {
      const saved = invoices.find((i) => i.id === id) ?? (await storage.getInvoice(id))
      if (saved) setInv(saved)
    } else {
      setInv(createInvoice(prefs, business, nextNumber()))
    }
    setDirty(false)
    setRestored(false)
  }

  const tplName = TEMPLATES.find((t) => t.id === inv.template)?.name
  const done = completion(inv)
  appActions.current = { print: () => print(inv), pdf: () => downloadPdf(inv), fresh: () => (dirty ? setConfirmNew(true) : startNew()) }
  const onTabKey = (e: React.KeyboardEvent) => {
    const i = TABS.findIndex((t) => t.id === tab)
    const next = e.key === 'ArrowRight' ? (i + 1) % TABS.length : e.key === 'ArrowLeft' ? (i - 1 + TABS.length) % TABS.length : e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : -1
    if (next < 0) return
    e.preventDefault()
    setTab(TABS[next].id)
    document.getElementById(`tab-${TABS[next].id}`)?.focus()
  }

  return (
    <div className="pb-16 lg:pb-0">
      {/* Toolbar (web); in app mode these actions live in the app bar */}
      <div className="app-hide mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-semibold tracking-tight">{isSaved ? `Edit ${inv.number || 'invoice'}` : 'New invoice'}</h1>
            {dirty ? <Badge tone="amber">Unsaved changes</Badge> : isSaved ? <Badge tone="green">Saved</Badge> : null}
          </div>
          <p className="mt-0.5 text-sm text-muted">Total <span className="font-semibold text-ink tabular">{formatMoney(totals.grandTotal, inv.currency)}</span> · {tplName} · {inv.paperSize}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="md" variant="ghost" icon={<FilePlus2 className="size-4" />} onClick={() => (dirty ? setConfirmNew(true) : startNew())}>New</Button>
          <Button icon={<Printer className="size-4" />} loading={busy === `print:${inv.id}`} onClick={() => print(inv)} aria-label="Print">Print</Button>
          <Button icon={<Download className="size-4" />} loading={busy === `pdf:${inv.id}`} onClick={() => downloadPdf(inv)} aria-label="Download PDF">PDF</Button>
          <Button onClick={() => save(true)} loading={saving} title="Save without validation to finish later" className="hidden lg:inline-flex">Save as draft</Button>
          <Button variant="primary" icon={<Save className="size-4" />} onClick={() => save(false)} loading={saving} className="hidden lg:inline-flex">Save invoice</Button>
        </div>
      </div>

      {restored && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary-100 bg-primary-50 px-4 py-2.5 text-sm">
          <span className="text-primary-700">We restored your unsaved changes from last time.</span>
          <Button size="sm" variant="ghost" icon={<RotateCcw className="size-4" />} onClick={discardRestore}>Discard changes</Button>
        </div>
      )}
      {errors.length > 0 && (
        <div role="alert" className="mb-4 rounded-lg border border-danger/30 bg-danger-50 px-4 py-3 text-sm text-danger">
          <p className="font-medium">Please fix the following before saving:</p>
          <ul className="mt-1 list-disc pl-5">{errors.map((e) => (
            <li key={e}><button type="button" className="text-left underline underline-offset-2 hover:no-underline" onClick={() => { setTab(tabForError(e)); setMobileView('edit') }}>{e} <span className="whitespace-nowrap">— go to {TABS.find((t) => t.id === tabForError(e))?.label}</span></button></li>
          ))}</ul>
        </div>
      )}

      {/* Mobile edit/preview switch */}
      <div className="mb-4 lg:hidden">
        <Segmented label="View" value={mobileView} onChange={setMobileView} className="w-full [&>button]:flex-1" options={[{ value: 'edit', label: <><Pencil className="size-4" />Edit</> }, { value: 'preview', label: <><Eye className="size-4" />Preview</> }]} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div ref={formTop} className={cx('min-w-0 scroll-mt-20 overflow-x-clip', mobileView === 'preview' && 'hidden lg:block')}>
          <div role="tablist" aria-label="Invoice sections" onKeyDown={onTabKey} className="sticky top-16 z-20 -mx-4 mb-4 flex snap-x gap-1 overflow-x-auto bg-canvas/95 px-4 py-2 backdrop-blur scrollbar-thin [mask-image:linear-gradient(to_right,black_88%,transparent)] sm:mx-0 sm:rounded-xl sm:border sm:border-line sm:bg-white sm:p-1 sm:[mask-image:none]">
            {TABS.map((t) => {
              const hasErr = errors.some((e) => tabForError(e) === t.id)
              return (
                <button key={t.id} role="tab" aria-selected={tab === t.id} tabIndex={tab === t.id ? 0 : -1} aria-controls={`panel-${t.id}`} id={`tab-${t.id}`} onClick={(e) => { setTab(t.id); e.currentTarget.scrollIntoView({ inline: 'nearest', block: 'nearest' }) }}
                  className={cx('flex shrink-0 snap-start items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors sm:px-3.5 sm:text-sm', tab === t.id ? 'bg-primary text-white shadow-xs' : 'text-muted hover:bg-canvas hover:text-ink')}>
                  {t.label}{hasErr ? <span className="size-1.5 rounded-full bg-danger" aria-label="has errors" /> : done[t.id as keyof typeof done] ? <CircleCheck className={cx('size-3.5', tab === t.id ? 'text-white' : 'text-success')} aria-label="completed" /> : null}
                </button>
              )
            })}
          </div>
          <div key={tab} role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className={cx('space-y-4', slide && `tab-slide-${slide}`)}>
            {tab === 'details' && <DetailsSection inv={inv} update={update} numberError={duplicateNumber ? 'This number is already used by a saved invoice' : null} />}
            {tab === 'parties' && <>
              <CustomerSection inv={inv} update={update} clients={clients} onSaveClient={async () => {
                const existing = clients.find((x) => (inv.customer.email && x.email.toLowerCase() === inv.customer.email.toLowerCase()) || (x.name === inv.customer.name && x.company === inv.customer.company))
                const saved = await saveClient(customerToClient(inv.customer, existing))
                toast.success(existing ? `Updated client “${saved.name || saved.company}”.` : `Saved “${saved.name || saved.company}” to clients.`)
              }} />
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
            {tab !== TABS[0].id ? <Button variant="ghost" onClick={() => setTab(TABS[TABS.findIndex((t) => t.id === tab) - 1].id)}>Back</Button> : <span />}
            {tab !== 'design'
              ? <Button variant="secondary" onClick={() => {
                  setTab(TABS[TABS.findIndex((t) => t.id === tab) + 1].id)
                  // Bring the next section's first field into view (only if we've scrolled past it)
                  const el = formTop.current
                  if (el && el.getBoundingClientRect().top < 0) {
                    el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
                  }
                }}>Next: {TABS[TABS.findIndex((t) => t.id === tab) + 1].label}</Button>
              : <Button variant="primary" onClick={() => save(false)} loading={saving}>Save invoice</Button>}
          </div>
        </div>

        <div className={cx('min-w-0', mobileView === 'edit' && 'hidden lg:block')}>
          <div className="lg:sticky lg:top-20">
            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-xs">
              <div className="flex items-center gap-3 border-b border-line px-4 py-2.5">
                <span className="text-sm font-semibold text-ink">Preview</span>
                <label className="ml-auto flex items-center gap-2 text-xs text-muted">
                  <span className="sr-only">Zoom</span>
                  <input type="range" min={50} max={200} step={10} value={Math.round(zoom * 100)} onChange={(e) => setZoom(Number(e.target.value) / 100)} className="w-24 accent-[var(--color-primary)] sm:w-32" aria-label="Zoom" />
                  <span className="w-9 tabular">{Math.round(zoom * 100)}%</span>
                </label>
                <Button size="icon" variant="ghost" aria-label="Fit to width" title="Fit to width" onClick={() => setZoom(1)}><Maximize2 className="size-4" /></Button>
                <Button size="icon" variant="ghost" aria-label="Download PDF preview" title="Download PDF" onClick={() => downloadPdf(inv)}><FileDown className="size-4" /></Button>
                <Button size="icon" variant="ghost" aria-label="Print preview" title="Print" onClick={() => print(inv)}><Printer className="size-4" /></Button>
              </div>
              <div className="bg-[#eef1f5] p-3 sm:p-5 lg:max-h-[calc(100dvh-10rem)] lg:overflow-y-auto scrollbar-thin" aria-label="Invoice preview">
                <ScaledPreview invoice={deferred} prefs={prefs} pageGap={20} zoom={zoom} />
              </div>
              <div className="hidden items-center justify-end gap-2 border-t border-line px-4 py-3 lg:flex">
                <Button onClick={() => save(true)} loading={saving}>Save as draft</Button>
                <Button variant="primary" icon={<Send className="size-4" />} onClick={() => save(false, true)} loading={saving || busy === `share:${inv.id}`}>Save & share</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky action bar: total + primary save always reachable */}
      <div className="editor-actionbar fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 flex items-center gap-3 border-t border-line bg-white px-4 py-2 shadow-[0_-4px_12px_rgb(16_24_40/0.06)] lg:hidden">
        <div className="min-w-0 flex-1"><div className="text-[11px] text-muted">Total{dirty && <span className="text-warning"> · Unsaved</span>}</div><div className="truncate text-[15px] font-semibold tabular">{formatMoney(totals.grandTotal, inv.currency)}</div></div>
        <Button variant="ghost" size="sm" onClick={() => save(true)} loading={saving}>Draft</Button>
        <Button variant="primary" icon={<Save className="size-4" />} onClick={() => save(false)} loading={saving}>Save invoice</Button>
      </div>

      {!id && <ToolGuide title="Create a professional invoice online" paragraphs={[
        'Fill in your business and client details, add line items with quantities, prices, discounts and tax, and watch the invoice update live. Totals, tax and balance due are calculated automatically and accurately.',
        'When you’re done, download the invoice as a PDF, print it, or share it by email. Save it to edit, duplicate or resend later — everything stays on your device.',
      ]} links={[['Browse invoice templates', '/templates'], ['How to use', '/how-to-use'], ['FAQ', '/faq']]} />}
      <Modal open={nextSteps} onClose={() => setNextSteps(false)} title={`Invoice ${inv.number} saved`} size="sm">
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-success-50 p-3">
          <CircleCheck className="size-6 shrink-0 text-success" aria-hidden />
          <div className="min-w-0 text-sm"><div className="font-semibold text-ink">{inv.customer.name || inv.customer.company || 'Invoice'} · {formatMoney(totals.grandTotal, inv.currency)}</div><div className="text-muted">What would you like to do next?</div></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button className="justify-center" icon={<Download className="size-4" />} loading={busy === `pdf:${inv.id}`} onClick={() => downloadPdf(inv)} data-autofocus>Download PDF</Button>
          <Button className="justify-center" icon={<Send className="size-4" />} loading={busy === `share:${inv.id}`} onClick={() => share(inv)}>Share / email</Button>
          <Button className="justify-center" icon={<Printer className="size-4" />} onClick={() => { setNextSteps(false); print(inv) }}>Print</Button>
          <Button className="justify-center" icon={<FolderOpen className="size-4" />} onClick={() => nav('/invoices')}>All invoices</Button>
        </div>
        <Button variant="primary" className="mt-3 w-full justify-center" icon={<FilePlus2 className="size-4" />} onClick={() => { setNextSteps(false); nav('/create') }}>Create another invoice</Button>
        <button type="button" className="mt-2 w-full py-2 text-sm font-medium text-muted hover:text-ink" onClick={() => setNextSteps(false)}>Keep editing</button>
      </Modal>
      <ConfirmDialog open={confirmNew} title="Start a new invoice?" confirmLabel="Discard changes"
        message={`Your unsaved changes to ${inv.number || 'this invoice'} will be lost.`} onCancel={() => setConfirmNew(false)} onConfirm={startNew} />
    </div>
  )
}
