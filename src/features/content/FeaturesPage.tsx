import { Building2, Calculator, FileDown, FileSpreadsheet, LayoutTemplate, ListPlus, Printer, ShieldCheck, Smartphone, WifiOff, Globe2, Save } from 'lucide-react'
import { ContentLayout, H2, P, UL } from './ContentLayout'
import { useSeo } from '@/hooks/useSeo'

const FEATURES = [
  { icon: LayoutTemplate, title: '11 professional invoice templates', text: 'Classic Professional, Modern Minimal, Corporate Blue, Executive, Creative Studio, Elegant Dark Accent, Compact, Service, Retail, Highlight and Modern Business — each with its own layout, not just a colour swap. Switch at any time without losing data.' },
  { icon: FileSpreadsheet, title: 'Bulk invoice generator (CSV & JSON)', text: 'Upload one file and generate hundreds of invoices. Rows sharing an invoice number become one multi-line invoice. Row-level validation, column mapping, a downloadable error report, and valid invoices still generate when others fail.' },
  { icon: FileDown, title: 'PDF download, ZIP and combined PDF', text: 'Download any invoice as an A4, Letter or Legal PDF with correct page breaks and repeated table headers. Download bulk invoices individually, as one ZIP, or as a single combined PDF with your own filename pattern.' },
  { icon: Printer, title: 'Print-ready output', text: 'Print sends only the invoice to your printer — no menus or buttons — with the right page size and no blank pages.' },
  { icon: Calculator, title: 'Accurate tax & discount maths', text: 'Per-item discounts and tax, invoice-level percentage or fixed discount (applied before tax), shipping, adjustments, amount paid and balance due. All money is calculated in whole cents to avoid rounding errors, and tax is never applied twice.' },
  { icon: Building2, title: 'Multiple business profiles', text: 'Invoice for several companies or brands. Save each business with its own logo, address and tax numbers, then pick one when creating an invoice.' },
  { icon: ListPlus, title: 'Custom fields & sections', text: 'Add fields such as project name, contract number or service period (text, multi-line, number, date or URL). Mark them required, hide them, reorder them, or group them into your own sections.' },
  { icon: Globe2, title: 'Multi-currency', text: 'USD, EUR, GBP, PKR, AED, SAR, INR, CAD, AUD and JPY with locale-aware formatting and your choice of date format. No automatic currency conversion is applied.' },
  { icon: Save, title: 'Saved invoices & drafts', text: 'Save drafts and completed invoices, search, filter by status, sort, duplicate, re-download or print later. Unsaved work is autosaved so a refresh never loses it.' },
  { icon: ShieldCheck, title: 'Private by design', text: 'No account, no sign-up and no server. Invoices, customers and logos are stored only in your browser on your device. Export a JSON backup whenever you like.' },
  { icon: WifiOff, title: 'Works offline', text: 'Install it as an app and keep creating, saving and downloading invoices without an internet connection.' },
  { icon: Smartphone, title: 'Mobile & Android app', text: 'A responsive layout for phones and tablets, an installable web app, and an Android APK built from the same code.' },
]

export default function FeaturesPage() {
  useSeo({ title: 'Features – Free Online Invoice Generator with Bulk PDF Export', description: 'All Invoice Studio features: 10 invoice templates, bulk invoice generation from CSV/JSON, PDF and ZIP download, printing, multi-currency, custom fields, multiple businesses and offline use.', path: '/features' })
  return (
    <ContentLayout eyebrow="Features" title="Everything you need to invoice professionally" intro="Invoice Studio is a free invoice generator that runs entirely on your device. Here is everything it can do.">
      <section className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl border border-line bg-white p-5 shadow-xs">
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary-50 text-primary"><f.icon className="size-5" /></div>
            <h2 className="text-[15px] font-semibold text-ink">{f.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.text}</p>
          </div>
        ))}
      </section>
      <section>
        <H2>How totals are calculated</H2>
        <P>Every template shows the same, verifiable numbers:</P>
        <UL items={[
          'Line subtotal = quantity × unit price',
          'Line discount = percentage or fixed amount per item',
          'Invoice discount is applied before tax and shared across lines in proportion to their value',
          'Tax = per-item rate, or a single invoice rate — never both',
          'Grand total = subtotal − discounts + tax + shipping + adjustment',
          'Balance due = grand total − amount paid',
        ]} />
      </section>
    </ContentLayout>
  )
}
