import { Link } from 'react-router-dom'
import { BookOpen, HelpCircle, Mail, PlayCircle } from 'lucide-react'
import { ContentLayout, H2, UL } from './ContentLayout'
import { useSeo } from '@/hooks/useSeo'
import { startTour } from '@/components/layout/Tour'

export default function SupportPage() {
  useSeo({ title: 'Support & Help Center', description: 'Get help with Invoice Studio: guides, FAQ, troubleshooting PDF downloads, printing, bulk CSV imports and backups.', path: '/support' })
  const cards = [
    { icon: BookOpen, title: 'How-to guide', text: 'Step-by-step instructions for invoices and bulk generation.', to: '/how-to-use' },
    { icon: HelpCircle, title: 'FAQ', text: 'Quick answers to the most common questions.', to: '/faq' },
    { icon: Mail, title: 'Contact us', text: 'Still stuck? Send us a message.', to: '/contact' },
  ]
  return (
    <ContentLayout eyebrow="Support" title="How can we help?" intro="Find answers, learn the basics, or get in touch." cta={false}>
      <section className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="rounded-xl border border-line bg-white p-5 shadow-xs transition-shadow hover:shadow-md">
            <c.icon className="mb-3 size-6 text-primary" />
            <div className="text-[15px] font-semibold text-ink">{c.title}</div>
            <p className="mt-1 text-sm text-muted">{c.text}</p>
          </Link>
        ))}
      </section>
      <section>
        <button type="button" onClick={() => startTour()} className="flex w-full items-center gap-3 rounded-xl border border-primary-100 bg-primary-50 p-5 text-left">
          <PlayCircle className="size-6 shrink-0 text-primary" />
          <span><span className="block text-[15px] font-semibold text-primary-700">Replay the product tour</span><span className="block text-sm text-primary-700/80">A 1-minute walkthrough of the main features.</span></span>
        </button>
      </section>
      <section>
        <H2>Troubleshooting</H2>
        <UL items={[
          <><b>The PDF doesn’t download on my phone.</b> In the Android app a share sheet opens — choose “Save to Files” or your PDF app. In mobile browsers, check your Downloads folder.</>,
          <><b>Print shows the whole page.</b> Use the Print button inside the editor or Saved invoices, not the browser’s print menu. In the Android app, Print opens the PDF so you can print from your PDF viewer.</>,
          <><b>My CSV shows “Required column(s) not mapped”.</b> Open Column mapping on the Bulk page and choose which of your columns holds each required field, then click Apply mapping.</>,
          <><b>Dates are rejected.</b> Use YYYY-MM-DD (e.g. 2026-11-17). DD/MM/YYYY is also accepted.</>,
          <><b>My invoices disappeared.</b> Data is stored per browser and device. If you cleared site data or switched browsers, restore from a backup in Settings.</>,
          <><b>“Local storage is unavailable”.</b> Private/incognito modes may block storage. Open the app in a normal window.</>,
        ]} />
      </section>
    </ContentLayout>
  )
}
