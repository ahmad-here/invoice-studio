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
import { InvoiceListItem } from '@/features/saved-invoices/InvoiceListItem'
import { todayISO } from '@/lib/dates'

export default function Dashboard() {
  useSeo({ title: 'Free Invoice Generator – Create, Print & Bulk Generate PDF Invoices | Invoice Studio', description: 'Free online invoice generator. Create professional PDF invoices with 10 templates, print instantly, or bulk generate hundreds from CSV or JSON. No sign-up, works offline.', path: '/' })
  const { invoices } = useApp()
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
      <section className="rounded-2xl border border-line bg-white px-6 py-10 sm:px-10 sm:py-12 shadow-xs">
        <div className="max-w-2xl">
          <p className="text-[13px] font-semibold text-primary">Free invoice generator · No sign-up</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">Professional invoices in minutes.</h1>
          <p className="mt-3 text-base leading-relaxed text-muted">Create, print and download PDF invoices with 10 templates, or generate hundreds at once from a CSV or JSON file. Everything stays on this device.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" variant="primary" icon={<FilePlus2 className="size-5" />} onClick={() => nav('/create')}>Create invoice</Button>
            <Button size="lg" icon={<Layers className="size-5" />} onClick={() => nav('/bulk')}>Bulk generate</Button>
            {!isNative() && <Button size="lg" variant="ghost" icon={<Smartphone className="size-5" />} onClick={() => nav('/download')}>Get the Android app</Button>}
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted">
            <li className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-primary" />Private — data never leaves your device</li>
            <li className="flex items-center gap-1.5"><WifiOff className="size-4 text-primary" />Works offline</li>
            <li className="flex items-center gap-1.5"><Zap className="size-4 text-primary" />Accurate tax & discount maths</li>
          </ul>
        </div>
      </section>

      <section aria-label="Statistics" className="grid grid-cols-3 gap-3 sm:gap-4">
        {[{ k: 'Invoices created', v: stats.total }, { k: 'This month', v: stats.month }, { k: 'Drafts', v: stats.drafts }].map((s) => (
          <Card key={s.k} className="px-4 py-4 sm:px-5">
            <div className="text-2xl font-semibold tabular text-ink sm:text-3xl">{s.v}</div>
            <div className="mt-0.5 text-xs text-muted sm:text-[13px]">{s.k}</div>
          </Card>
        ))}
      </section>

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
            {drafts.length === 0 ? <p className="px-5 py-8 text-center text-sm text-muted">No drafts. Use “Save draft” in the editor to finish an invoice later.</p>
              : <ul className="divide-y divide-line">{drafts.map((i) => <InvoiceListItem key={i.id} inv={i} compact />)}</ul>}
          </Card>
        </section>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Templates</h2>
          <Link to="/templates" className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-700">All 10 templates <ArrowRight className="size-4" /></Link>
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
    </div>
  )
}
