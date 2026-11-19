import { useSeo } from '@/hooks/useSeo'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, FilePlus2, FileText, Layers, ShieldCheck, Smartphone, WifiOff, Zap } from 'lucide-react'
import { isNative } from '@/services/files'
import { useMemo } from 'react'
import { useApp } from '@/app/store'
import { Button, Card, EmptyState } from '@/components/common/ui'
import { TEMPLATES } from '@/templates/registry'
import { TemplateThumb } from '@/components/invoice/TemplateThumb'
import { sampleInvoice } from '@/lib/sample'
import { InvoiceListItem } from '@/components/invoice/InvoiceListItem'
import { todayISO } from '@/lib/dates'
import { APP_MODE } from '@/lib/appMode'
import { AppHome } from './AppHome'
import { HomeSeoSections } from '@/features/content/SeoSections'

export default function DashboardRoute() {
  return APP_MODE ? <AppHome /> : <Dashboard />
}

function Dashboard() {
  useSeo({ title: 'Free Invoice Generator – Create PDF Invoices Online | Invoice Studio', description: 'Free online invoice generator: make professional PDF invoices in minutes with 21 templates, GST/VAT tax, multi-currency and bulk CSV import. No sign-up, no watermark, works offline.', path: '/' })
  const { invoices, businesses } = useApp()
  const nav = useNavigate()
  const stats = useMemo(() => {
    const month = todayISO().slice(0, 7)
    return {
      total: invoices.filter((i) => i.status !== 'draft').length,
      month: invoices.filter((i) => i.status !== 'draft' && i.issueDate.startsWith(month)).length,
      drafts: invoices.filter((i) => i.status === 'draft').length,
    }
  }, [invoices])
  const recent = invoices.filter((i) => i.status !== 'draft').slice(0, 5)
  const drafts = invoices.filter((i) => i.status === 'draft').slice(0, 3)
  const gallery = useMemo(() => TEMPLATES.slice(0, 4).map((t) => ({ t, inv: sampleInvoice(t.id) })), [])

  return (
    <div className="space-y-10">
      <section className="grid items-center gap-8 overflow-hidden rounded-2xl border border-line bg-white px-6 py-10 shadow-xs sm:px-10 sm:py-12 lg:grid-cols-[1.15fr_1fr]">
        <div className="max-w-2xl">
          <p className="text-[13px] font-semibold text-primary">100% free · No sign-up · Works offline</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">Free invoice generator for professional PDF invoices</h1>
          <p className="mt-3 text-base leading-relaxed text-muted">Create, print and download PDF invoices with 21 templates, or generate hundreds at once from a CSV or JSON file. Everything stays on this device.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" variant="primary" icon={<FilePlus2 className="size-5" />} onClick={() => nav('/create')}>Create invoice</Button>
            <Button size="lg" icon={<Layers className="size-5" />} onClick={() => nav('/bulk')}>Bulk generate</Button>
          </div>
          {!isNative() && <Link to="/download" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-700"><Smartphone className="size-4" />Also available for Android →</Link>}
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted">
            <li className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-primary" />Private — data never leaves your device</li>
            <li className="flex items-center gap-1.5"><WifiOff className="size-4 text-primary" />Works offline</li>
            <li className="flex items-center gap-1.5"><Zap className="size-4 text-primary" />Accurate tax & discount maths</li>
          </ul>
        </div>
        <div aria-hidden className="relative hidden h-[340px] lg:block">
          <div className="absolute right-6 top-2 w-[250px] rotate-[4deg] overflow-hidden rounded-lg border border-line shadow-lg"><TemplateThumb invoice={gallery[2].inv} /></div>
          <div className="absolute right-[150px] top-10 w-[250px] -rotate-[5deg] overflow-hidden rounded-lg border border-line shadow-xl"><TemplateThumb invoice={gallery[0].inv} /></div>
        </div>
      </section>

      {businesses.length === 0 && (
        <section className="flex flex-col items-start gap-3 rounded-2xl border border-primary-100 bg-primary-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-[15px] font-semibold text-ink">Set up your business once</h2><p className="text-sm text-muted">Add your name, logo, tax and bank details — every invoice is filled in automatically.</p></div>
          <Button variant="primary" onClick={() => nav('/business')}>Add my business</Button>
        </section>
      )}
      {invoices.length > 0 && <section aria-label="Statistics" className="grid grid-cols-3 gap-3 sm:gap-4">
        {[{ k: 'Invoices created', v: stats.total }, { k: 'This month', v: stats.month }, { k: 'Drafts', v: stats.drafts }].map((s) => (
          <Card key={s.k} className="px-4 py-4 sm:px-5">
            <div className="text-2xl font-semibold tabular text-ink sm:text-3xl">{s.v}</div>
            <div className="mt-0.5 text-xs text-muted sm:text-[13px]">{s.k}</div>
          </Card>
        ))}
      </section>}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent invoices</h2>
            {recent.length > 0 && <Link to="/invoices" className="text-sm font-medium text-primary hover:text-primary-700">View all</Link>}
          </div>
          <Card>
            {recent.length === 0 ? (
              <EmptyState icon={<FileText className="size-7" />} title="No invoices yet" description="Your saved invoices will appear here. Create your first invoice — it takes about two minutes." action={<Button variant="primary" onClick={() => nav('/create')}>Create your first invoice</Button>} />
            ) : (
              <ul className="divide-y divide-line">{recent.map((i) => <InvoiceListItem key={i.id} inv={i} compact />)}</ul>
            )}
          </Card>
        </section>
        <section>
          <h2 className="mb-3 text-lg font-semibold">Drafts</h2>
          <Card>
            {drafts.length === 0 ? <EmptyState icon={<FilePlus2 className="size-7" />} title="No drafts" description="Use “Save as draft” in the editor to finish an invoice later." />
              : <ul className="divide-y divide-line">{drafts.map((i) => <InvoiceListItem key={i.id} inv={i} compact />)}</ul>}
          </Card>
        </section>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Templates</h2>
          <Link to="/templates" className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-700">All 21 templates <ArrowRight className="size-4" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {gallery.map(({ t, inv }) => (
            <Link key={t.id} to={`/templates?t=${t.id}`} className="group overflow-hidden rounded-xl border border-line bg-white shadow-xs transition-shadow hover:shadow-md">
              <div className="border-b border-line"><TemplateThumb invoice={inv} /></div>
              <div className="px-3 py-2.5"><div className="text-sm font-medium text-ink">{t.name}</div><div className="text-xs text-muted">{t.bestFor}</div></div>
            </Link>
          ))}
        </div>
      </section>
      <HomeSeoSections />
    </div>
  )
}
