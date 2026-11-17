import { useEffect, useState } from 'react'
import { Building2, Check, Plus, Star, Trash2 } from 'lucide-react'
import type { BusinessProfile } from '@/types/invoice'
import { useApp, toast } from '@/app/store'
import { Badge, Button, ConfirmDialog, Input, Textarea, cx } from '@/components/common/ui'
import { LogoEditor, Section } from '@/features/invoice-editor/sections'
import { emptyBusiness } from '@/lib/defaults'

/** Manage several business profiles; one is the default for new invoices. */
export function BusinessProfiles() {
  const { businesses, prefs, saveBusiness, deleteBusiness, setDefaultBusiness } = useApp()
  const [editingId, setEditingId] = useState<string | 'new' | null>(businesses[0]?.id ?? 'new')
  const current = editingId === 'new' ? null : businesses.find((b) => b.id === editingId) ?? null
  const [form, setForm] = useState<BusinessProfile>(current ?? emptyBusiness())
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<BusinessProfile | null>(null)

  useEffect(() => { setForm(current ? structuredClone(current) : emptyBusiness()) }, [editingId]) // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = JSON.stringify(form) !== JSON.stringify(current ?? emptyBusiness())
  const set = (k: keyof BusinessProfile, v: string) => setForm({ ...form, [k]: v })

  const save = async () => {
    if (!form.name.trim()) { toast.error('Give the business a name.'); return }
    setSaving(true)
    try {
      const saved = await saveBusiness(form)
      setEditingId(saved.id!)
      setForm(saved)
      toast.success(`“${saved.name}” saved.`)
    } catch (e) { toast.error(`Could not save: ${(e as Error).message}`) } finally { setSaving(false) }
  }

  return (
    <Section title="Business profiles" description="Add every business you invoice for, then pick one when creating an invoice." aside={
      <Button size="sm" variant="primary" icon={<Plus className="size-4" />} onClick={() => setEditingId('new')} data-tour="add-business">Add business</Button>
    }>
      {businesses.length > 0 && (
        <ul className="mb-5 grid gap-2" aria-label="Business profiles">
          {businesses.map((b) => {
            const isDefault = b.id === prefs.defaultBusinessId || (!prefs.defaultBusinessId && b === businesses[0])
            const active = editingId === b.id
            return (
              <li key={b.id}>
                <div className={cx('flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors', active ? 'border-primary bg-primary-50' : 'border-line hover:border-line-strong')}>
                  <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setEditingId(b.id!)} aria-current={active}>
                    {b.logo ? <img src={b.logo.dataUrl} alt="" className="size-9 rounded-md bg-white object-contain p-0.5" /> : <span className="flex size-9 items-center justify-center rounded-md bg-canvas text-muted"><Building2 className="size-5" /></span>}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink">{b.name || 'Untitled business'}</span>
                      <span className="block truncate text-xs text-muted">{b.email || b.address.split('\n')[0] || 'No contact details'}</span>
                    </span>
                  </button>
                  {isDefault ? <Badge tone="blue"><Star className="size-3" />Default</Badge>
                    : <Button size="sm" variant="ghost" onClick={async () => { await setDefaultBusiness(b.id!); toast.success(`“${b.name}” is now the default.`) }}>Make default</Button>}
                  <Button size="icon" variant="danger-ghost" aria-label={`Delete ${b.name}`} onClick={() => setToDelete(b)}><Trash2 className="size-4" /></Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="rounded-lg border border-line p-4">
        <h3 className="mb-4 text-sm font-semibold text-ink">{editingId === 'new' ? 'New business' : `Edit “${current?.name || 'business'}”`}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><LogoEditor logo={form.logo} onChange={(logo) => setForm({ ...form, logo })} /></div>
          <Input label="Business name" required className="sm:col-span-2" value={form.name} maxLength={200} onChange={(e) => set('name', e.target.value)} />
          <Textarea label="Address" className="sm:col-span-2" rows={2} value={form.address} maxLength={500} onChange={(e) => set('address', e.target.value)} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          <Input label="Phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          <Input label="Website" value={form.website} onChange={(e) => set('website', e.target.value)} />
          <Input label="Tax registration no." value={form.taxNumber} onChange={(e) => set('taxNumber', e.target.value)} />
          <Input label="VAT number" value={form.vatNumber} onChange={(e) => set('vatNumber', e.target.value)} />
          <Textarea label="Additional information" className="sm:col-span-2" rows={2} value={form.extra} onChange={(e) => set('extra', e.target.value)} />
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          {dirty && <Button onClick={() => setForm(current ? structuredClone(current) : emptyBusiness())}>Discard</Button>}
          <Button variant="primary" icon={<Check className="size-4" />} loading={saving} disabled={!dirty} onClick={save}>{editingId === 'new' ? 'Add business' : 'Save business'}</Button>
        </div>
      </div>

      <ConfirmDialog open={!!toDelete} title="Delete business profile?" message={<>“{toDelete?.name}” will be removed. Invoices already created with it keep their details.</>}
        onCancel={() => setToDelete(null)} onConfirm={async () => {
          if (!toDelete) return
          await deleteBusiness(toDelete.id!)
          if (editingId === toDelete.id) setEditingId(useApp.getState().businesses[0]?.id ?? 'new')
          toast.success('Business profile deleted.')
          setToDelete(null)
        }} />
    </Section>
  )
}
