import { ContentLayout } from './ContentLayout'
import { useSeo } from '@/hooks/useSeo'

export const FAQS: { q: string; a: string }[] = [
  { q: 'Is Invoice Studio really free?', a: 'Yes. Creating, printing, downloading and bulk generating invoices is free, with no sign-up and no watermark.' },
  { q: 'Do I need to create an account?', a: 'No. There is no registration or login. You can start creating invoices immediately.' },
  { q: 'Where is my invoice data stored?', a: 'Only in your browser on your device (IndexedDB). It is not uploaded to any server and does not sync between devices. Use Settings → Export backup to keep a copy or move it to another device.' },
  { q: 'Can I use it offline?', a: 'Yes. After your first visit, the app and your saved invoices work without an internet connection. Installing it as an app makes this easiest.' },
  { q: 'How many templates are there?', a: 'Eleven distinct templates: Classic Professional, Modern Minimal, Corporate Blue, Executive, Creative Studio, Elegant Dark Accent, Compact, Service, Retail, Highlight and Modern Business. You can switch templates without losing data.' },
  { q: 'How do I generate invoices in bulk?', a: 'Go to Bulk generate and upload a CSV or JSON file. Rows that share an invoice number are grouped into one invoice. You can download all invoices as a ZIP, a combined PDF, or individually.' },
  { q: 'What happens to invalid rows in my CSV?', a: 'They are never silently dropped. Each problem is listed with its row number and field, valid invoices are still generated, and you can download an error report as CSV.' },
  { q: 'Can I invoice for more than one business?', a: 'Yes. Add several business profiles in Settings and choose which one to use on each invoice. Bulk generation lets you pick the profile used when the file has no business details.' },
  { q: 'Which currencies are supported?', a: 'USD, EUR, GBP, PKR, AED, SAR, INR, CAD, AUD and JPY. The currency controls formatting only; no exchange-rate conversion is applied.' },
  { q: 'How are taxes and discounts calculated?', a: 'Per-item discounts are applied first, then any invoice discount (before tax), then tax per item or a single invoice rate — never both. Amounts are calculated in whole cents to avoid rounding errors.' },
  { q: 'Which paper sizes can I print or download?', a: 'A4 (default), US Letter and Legal. Long invoices continue onto extra pages with the table header repeated.' },
  { q: 'Is there an Android app?', a: 'Yes. You can install the web app from Chrome (menu → Install app / Add to Home screen), or download the Android APK from the Download page when it is available.' },
  { q: 'Can I add my logo?', a: 'Yes. Upload a PNG, JPG, SVG or WebP up to 2 MB, then adjust its size and position (left, center or right). It appears in previews, PDFs and printouts.' },
  { q: 'Can I create GST or VAT invoices?', a: 'Yes. Add your tax or VAT registration number to your business profile, set a tax rate per item or for the whole invoice, and use a title such as “Tax Invoice”. Check local requirements for the exact wording your country needs.' },
  { q: 'Can I make an invoice on my phone?', a: 'Yes. The invoice generator works on any phone browser, can be installed as an app, and is available as an Android APK. Your invoices are saved on the device.' },
  { q: 'Is there a watermark on the PDF invoices?', a: 'No. Every PDF invoice is clean and professional, with your own logo and business details only.' },
  { q: 'Can I save my clients?', a: 'Yes. Save clients once in the Clients page (or from the invoice editor) and pick them on any new invoice.' },
  { q: 'What if I clear my browser data?', a: 'Clearing site data deletes your locally stored invoices. Export a backup regularly if your invoices are important to you.' },
]

export default function FaqPage() {
  useSeo({
    title: 'FAQ – Free Invoice Generator Questions',
    description: 'Answers about Invoice Studio: pricing, data privacy, offline use, templates, bulk CSV invoice generation, currencies, taxes and the Android app.',
    path: '/faq',
    jsonLd: { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  })
  return (
    <ContentLayout eyebrow="FAQ" title="Frequently asked questions" intro="Can’t find your answer? Visit Support or contact us.">
      <div className="divide-y divide-line rounded-xl border border-line bg-white shadow-xs">
        {FAQS.map((f) => (
          <details key={f.q} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-ink">
              {f.q}
              <span aria-hidden className="text-xl leading-none text-subtle transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 text-[15px] leading-relaxed text-[#374151]">{f.a}</p>
          </details>
        ))}
      </div>
    </ContentLayout>
  )
}
