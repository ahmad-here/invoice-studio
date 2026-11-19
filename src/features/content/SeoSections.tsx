import { Link } from 'react-router-dom'
import { Building2, Calculator, CheckCircle2, FileDown, FileSpreadsheet, Globe2, LayoutTemplate, Printer, ShieldCheck, Smartphone, Users, WifiOff } from 'lucide-react'
import { FAQS } from './FaqPage'

/** Keyword-rich, genuinely useful landing content (web only) with internal links to deeper pages. */
export function HomeSeoSections() {
  const steps = [
    ['Add your business', 'Enter your company name, logo, address and tax or VAT number once. Save several business profiles if you run more than one.'],
    ['Fill in the invoice', 'Pick or add a client, add products or services, quantities, prices, discounts and tax. Totals are calculated for you.'],
    ['Download, print or share', 'Choose one of 21 invoice templates and download a PDF invoice, print it, or share it by email or WhatsApp.'],
  ]
  const features = [
    { icon: LayoutTemplate, t: '21 free invoice templates', d: 'Professional designs for freelancers, agencies, shops and service businesses.', to: '/templates' },
    { icon: FileSpreadsheet, t: 'Bulk invoice generator', d: 'Create hundreds of invoices from one CSV or JSON file and download a ZIP or combined PDF.', to: '/bulk' },
    { icon: FileDown, t: 'PDF invoice download', d: 'Pixel-perfect A4, US Letter and Legal PDFs with multi-page support.', to: '/features' },
    { icon: Calculator, t: 'Tax, GST & VAT ready', d: 'Per-item or invoice-level tax, discounts, shipping and amount paid — calculated to the cent.', to: '/features' },
    { icon: Globe2, t: 'Multi-currency', d: 'Invoice in USD, EUR, GBP, CAD, AUD, INR, PKR, AED, SAR or JPY with local number formats.', to: '/features' },
    { icon: Users, t: 'Clients & businesses', d: 'Save clients and multiple business profiles to bill in seconds.', to: '/how-to-use' },
    { icon: Printer, t: 'Print-ready invoices', d: 'Print only the invoice — no browser clutter, correct page size.', to: '/features' },
    { icon: Smartphone, t: 'Invoice generator app', d: 'Install on Android (APK) or any phone as an app. Works offline.', to: '/download' },
  ]
  return (
    <div className="space-y-16 pt-6">
      <section aria-labelledby="how-title">
        <h2 id="how-title" className="text-2xl font-semibold tracking-tight text-ink">How to make an invoice online in 3 steps</h2>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">This free online invoice generator works in your browser — no account, no download and no watermark.</p>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map(([t, d], i) => (
            <li key={t} className="rounded-2xl border border-line bg-white p-5 shadow-xs">
              <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white tabular">{i + 1}</span>
              <h3 className="mt-3 text-[15px] font-semibold text-ink">{t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="features-title">
        <h2 id="features-title" className="text-2xl font-semibold tracking-tight text-ink">Everything a simple invoice generator should do — and more</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Link key={f.t} to={f.to} className="group rounded-2xl border border-line bg-white p-5 shadow-xs transition-shadow hover:shadow-md">
              <f.icon className="size-6 text-primary" aria-hidden />
              <h3 className="mt-3 text-[15px] font-semibold text-ink group-hover:text-primary-700">{f.t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{f.d}</p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="who-title" className="grid gap-8 rounded-2xl border border-line bg-white p-6 shadow-xs sm:p-10 lg:grid-cols-2">
        <div>
          <h2 id="who-title" className="text-2xl font-semibold tracking-tight text-ink">A business invoice generator for every kind of work</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">Whether you send one bill a month or hundreds, Invoice Studio keeps invoicing fast and professional — and your data private.</p>
          <ul className="mt-5 space-y-2.5 text-[15px] text-ink">
            {['Freelancers and consultants billing hours or projects', 'Agencies and studios with multiple clients', 'Shops and e-commerce sellers with SKUs and discounts', 'Small businesses that need GST or VAT invoices', 'Accountants generating invoices in bulk from spreadsheets'].map((x) => (
              <li key={x} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />{x}</li>
            ))}
          </ul>
        </div>
        <div className="grid content-start gap-3">
          {[[ShieldCheck, 'Private by design', 'Invoices and client details stay on your device — nothing is uploaded.'], [WifiOff, 'Works offline', 'Create and download invoices without an internet connection.'], [Building2, 'No sign-up', 'Start immediately. No account, no subscription, no watermark.']].map(([Icon, t, d]) => {
            const I = Icon as typeof ShieldCheck
            return (
              <div key={t as string} className="flex gap-3 rounded-xl bg-canvas p-4">
                <I className="size-6 shrink-0 text-primary" aria-hidden />
                <div><h3 className="text-sm font-semibold text-ink">{t as string}</h3><p className="text-sm text-muted">{d as string}</p></div>
              </div>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="faq-title">
        <div className="flex items-end justify-between gap-4">
          <h2 id="faq-title" className="text-2xl font-semibold tracking-tight text-ink">Invoice generator FAQ</h2>
          <Link to="/faq" className="shrink-0 text-sm font-medium text-primary hover:text-primary-700">All questions →</Link>
        </div>
        <div className="mt-5 divide-y divide-line rounded-2xl border border-line bg-white shadow-xs">
          {FAQS.slice(0, 5).map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-ink">{f.q}<span aria-hidden className="text-xl text-muted transition-transform group-open:rotate-45">+</span></summary>
              <p className="mt-2 text-[15px] leading-relaxed text-[#374151]">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}

/** Short explanatory copy shown below a tool (web only) so tool pages aren't thin content. */
export function ToolGuide({ title, paragraphs, links }: { title: string; paragraphs: string[]; links?: [string, string][] }) {
  return (
    <section className="app-hide mx-auto mt-14 max-w-3xl border-t border-line pt-10" aria-label={title}>
      <h2 className="text-xl font-semibold tracking-tight text-ink">{title}</h2>
      {paragraphs.map((p) => <p key={p.slice(0, 20)} className="mt-3 text-[15px] leading-relaxed text-[#374151]">{p}</p>)}
      {links && <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">{links.map(([l, to]) => <Link key={to} to={to} className="font-medium text-primary hover:text-primary-700">{l} →</Link>)}</p>}
    </section>
  )
}
