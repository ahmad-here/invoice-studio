import { useSeo } from '@/hooks/useSeo'
import { useEffect, useRef, useState } from 'react'
import { Download, Upload, Trash2, ShieldCheck } from 'lucide-react'
import type { CurrencyCode, DateFormat, PaperSize, TemplateId, UserPreferences } from '@/types/invoice'
import { useApp, toast } from '@/app/store'
import { Button, Card, ConfirmDialog, Input, PageHeader, Select, Textarea, Badge } from '@/components/common/ui'
import { NumberInput } from '@/components/forms/inputs'
import { Section } from '@/features/invoice-editor/sections'
import { BusinessProfiles } from './BusinessProfiles'
import { CURRENCIES, formatMoney } from '@/lib/money'
import { formatDate, todayISO } from '@/lib/dates'
import { formatInvoiceNumber } from '@/lib/defaults'
import { TEMPLATES } from '@/templates/registry'
import { storage } from '@/services/storage/db'
import { saveText } from '@/services/files'

const LOCALES = [['en-US', 'English (US) — 1,234.56'], ['en-GB', 'English (UK) — 1,234.56'], ['de-DE', 'German — 1.234,56'], ['fr-FR', 'French — 1 234,56'], ['en-IN', 'English (India) — 1,23,456.78'], ['ar-AE', 'Arabic (UAE)'], ['ur-PK', 'Urdu (Pakistan)']] as const

export default function SettingsPage() {
  useSeo({ title: 'Settings', description: 'Business profiles, invoice defaults and backups.', path: '/settings', noindex: true })
  const app = useApp()
  const [p, setP] = useState<UserPreferences>(app.prefs)
  const [saving, setSaving] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  useEffect(() => { setP(app.prefs) }, [app.prefs])
  const dirty = JSON.stringify(p) !== JSON.stringify(app.prefs)
  const setPay = (k: keyof UserPreferences['payment'], v: string) => setP({ ...p, payment: { ...p.payment, [k]: v } })

  const save = async () => {
    setSaving(true)
    try { await app.savePrefs({ ...p, defaultBusinessId: app.prefs.defaultBusinessId }); toast.success('Settings saved. New invoices will use these defaults.') }
    catch (e) { toast.error(`Could not save settings: ${(e as Error).message}`) }
    finally { setSaving(false) }
  }

  const exportBackup = async () => {
    const data = await storage.exportBackup()
    await saveText(JSON.stringify(data, null, 2), `invoice-studio-backup-${todayISO()}.json`, 'application/json')
    toast.success(`Backup exported (${data.invoices.length} invoices).`)
  }
  const importBackup = async (f?: File) => {
    if (!f) return
    setImporting(true)
    try {
      if (f.size > 50 * 1024 * 1024) throw new Error('Backup file is larger than 50 MB.')
      let raw: unknown
      try { raw = JSON.parse(await f.text()) } catch { throw new Error('The file is not valid JSON.') }
      const r = await storage.importBackup(raw)
      await app.reload()
      toast.success(`Restored ${r.imported} invoice${r.imported === 1 ? '' : 's'}${r.skipped ? ` (${r.skipped} invalid skipped)` : ''}.`)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="pb-16">
      <PageHeader title="Settings" description="Business profiles and defaults applied to every new invoice." actions={<Button variant="primary" onClick={save} loading={saving} disabled={!dirty}>Save settings</Button>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <BusinessProfiles />
          <Section title="Default payment details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Payment method" value={p.payment.method} onChange={(e) => setPay('method', e.target.value)} />
              <Input label="Bank name" value={p.payment.bankName} onChange={(e) => setPay('bankName', e.target.value)} />
              <Input label="Account holder" value={p.payment.accountHolder} onChange={(e) => setPay('accountHolder', e.target.value)} />
              <Input label="Account number" value={p.payment.accountNumber} onChange={(e) => setPay('accountNumber', e.target.value)} />
              <Input label="IBAN" value={p.payment.iban} onChange={(e) => setPay('iban', e.target.value.toUpperCase())} />
              <Input label="SWIFT / BIC" value={p.payment.swift} onChange={(e) => setPay('swift', e.target.value.toUpperCase())} />
              <Input label="Payment link" className="sm:col-span-2" value={p.payment.link} onChange={(e) => setPay('link', e.target.value)} />
              <Textarea label="Payment instructions" className="sm:col-span-2" rows={2} value={p.defaultPaymentInstructions} onChange={(e) => setP({ ...p, defaultPaymentInstructions: e.target.value })} />
            </div>
          </Section>
        </div>
        <div className="space-y-6">
          <Section title="Invoice defaults">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Number prefix" value={p.numberPrefix} maxLength={20} onChange={(e) => setP({ ...p, numberPrefix: e.target.value })} />
              <NumberInput label="Next number" value={p.nextNumber} min={1} max={99999999} decimals={0} onChange={(n) => setP({ ...p, nextNumber: Math.max(1, Math.floor(n)) })} hint={`Next: ${formatInvoiceNumber(p.numberPrefix, p.nextNumber)}`} />
              <Select label="Default currency" value={p.defaultCurrency} onChange={(e) => setP({ ...p, defaultCurrency: e.target.value as CurrencyCode })}>
                {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
              </Select>
              <NumberInput label="Default tax %" suffix="%" value={p.defaultTaxRate} max={100} onChange={(defaultTaxRate) => setP({ ...p, defaultTaxRate })} />
              <NumberInput label="Due in (days)" value={p.dueInDays} max={365} decimals={0} onChange={(n) => setP({ ...p, dueInDays: Math.floor(n) })} />
              <Select label="Default template" value={p.defaultTemplate} onChange={(e) => setP({ ...p, defaultTemplate: e.target.value as TemplateId })}>
                {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
              <Select label="Default paper size" value={p.defaultPaperSize} onChange={(e) => setP({ ...p, defaultPaperSize: e.target.value as PaperSize })}>
                <option>A4</option><option>Letter</option><option>Legal</option>
              </Select>
              <Select label="Date format" value={p.dateFormat} hint={`Today: ${formatDate(todayISO(), p.dateFormat, p.locale)}`} onChange={(e) => setP({ ...p, dateFormat: e.target.value as DateFormat })}>
                <option value="D MMM YYYY">17 Nov 2026</option><option value="YYYY-MM-DD">2026-11-17</option><option value="DD/MM/YYYY">17/11/2026</option><option value="MM/DD/YYYY">11/17/2026</option><option value="locale">Locale default</option>
              </Select>
              <Select label="Number & date locale" className="sm:col-span-2" value={p.locale} hint={`Example: ${formatMoney(123456789, p.defaultCurrency, p.locale)} (amounts follow each currency's convention on invoices)`} onChange={(e) => setP({ ...p, locale: e.target.value })}>
                {LOCALES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
              <Textarea label="Default payment terms" className="sm:col-span-2" rows={2} value={p.defaultPaymentTerms} onChange={(e) => setP({ ...p, defaultPaymentTerms: e.target.value })} />
              <Textarea label="Default invoice notes" className="sm:col-span-2" rows={2} value={p.defaultNotes} onChange={(e) => setP({ ...p, defaultNotes: e.target.value })} />
              <Textarea label="Default terms & conditions" className="sm:col-span-2" rows={2} value={p.defaultTerms} onChange={(e) => setP({ ...p, defaultTerms: e.target.value })} />
            </div>
          </Section>
          <Section title="Your data" description="Everything is stored locally in this browser on this device.">
            <div className="mb-4 flex gap-3 rounded-lg bg-primary-50 p-3 text-[13px] text-primary-700">
              <ShieldCheck className="size-5 shrink-0" />
              <p>Invoices, customers and your logo never leave this device and do not sync between devices or browsers. Clearing browser data deletes them — export a backup regularly.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button icon={<Download className="size-4" />} onClick={exportBackup}>Export backup (JSON)</Button>
              <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" aria-label="Import backup file" onChange={(e) => importBackup(e.target.files?.[0])} />
              <Button icon={<Upload className="size-4" />} loading={importing} onClick={() => fileRef.current?.click()}>Import backup</Button>
              <Button variant="danger-ghost" icon={<Trash2 className="size-4" />} onClick={() => setConfirmClear(true)}>Delete all data</Button>
            </div>
            <p className="mt-3 text-xs text-muted">{app.invoices.length} invoices stored · <Badge>Schema v{p.schemaVersion}</Badge></p>
          </Section>
        </div>
      </div>
      {dirty && (
        <Card className="fixed inset-x-4 bottom-20 z-30 mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-3 shadow-lg lg:bottom-6">
          <span className="text-sm text-ink">You have unsaved settings.</span>
          <span className="flex gap-2"><Button size="sm" onClick={() => setP(app.prefs)}>Discard</Button><Button size="sm" variant="primary" onClick={save} loading={saving}>Save</Button></span>
        </Card>
      )}
      <ConfirmDialog open={confirmClear} title="Delete all data?" confirmLabel="Delete everything"
        message="This permanently deletes every invoice, your business profile and settings from this device. Export a backup first if you might need them."
        onCancel={() => setConfirmClear(false)} onConfirm={async () => { await storage.clearAll(); await app.reload(); setConfirmClear(false); toast.success('All local data deleted.') }} />
    </div>
  )
}
