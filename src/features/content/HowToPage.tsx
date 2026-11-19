import { Link } from 'react-router-dom'
import { ContentLayout, H2, P, UL } from './ContentLayout'
import { useSeo } from '@/hooks/useSeo'

const STEPS = [
  { name: 'Add your business', text: 'Open Settings → Business profiles and add your business name, logo, address and tax numbers. Add more profiles if you invoice for several businesses.' },
  { name: 'Create an invoice', text: 'Click Create invoice. Your default business, currency, numbering and terms are filled in automatically.' },
  { name: 'Add the customer', text: 'On the “From & To” tab enter the customer details. Hide fields you don’t need, or add shipping address, tax ID and reference.' },
  { name: 'Add line items', text: 'On the Items tab add products or services with quantity and price. Open “Description, SKU, discount & tax” for more options. Reorder, duplicate or delete items with the buttons on each item.' },
  { name: 'Set discounts, tax and payments', text: 'Add an invoice discount, choose per-item or whole-invoice tax, add shipping, adjustments and any amount already paid. Add bank details on the Payment tab.' },
  { name: 'Choose a template', text: 'On the Design tab pick one of 21 templates, a paper size (A4, Letter or Legal) and an accent colour. The live preview updates instantly.' },
  { name: 'Save, download or print', text: 'Click Save invoice, then PDF to download or Print to print. Saved invoices appear under Saved, where you can edit, duplicate or download them again.' },
]

export default function HowToPage() {
  useSeo({
    title: 'How to Create an Invoice – Step-by-Step Guide',
    description: 'Learn how to create, download and print a professional invoice in minutes, and how to bulk generate invoices from a CSV or JSON file with Invoice Studio.',
    path: '/how-to-use',
    jsonLd: { '@context': 'https://schema.org', '@type': 'HowTo', name: 'How to create an invoice with Invoice Studio', step: STEPS.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.name, text: s.text })) },
  })
  return (
    <ContentLayout eyebrow="How to use" title="How to create an invoice" intro="Create your first professional invoice in about two minutes. No account needed.">
      <section>
        <H2>Create a single invoice</H2>
        <ol className="space-y-4">
          {STEPS.map((s, i) => (
            <li key={s.name} className="flex gap-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white tabular">{i + 1}</span>
              <div><h3 className="text-[15px] font-semibold text-ink">{s.name}</h3><p className="mt-0.5 text-[15px] leading-relaxed text-[#374151]">{s.text}</p></div>
            </li>
          ))}
        </ol>
      </section>
      <section>
        <H2>Generate invoices in bulk</H2>
        <UL items={[
          <>Open <Link className="font-medium text-primary" to="/bulk">Bulk generate</Link> and download the sample CSV or JSON to see the format.</>,
          'Required CSV columns: invoice_number, customer_name, item_name, quantity, unit_price. Optional columns cover dates, currency, tax, discounts, business details and more.',
          'Repeat the same invoice_number on several rows to put several line items on one invoice.',
          'Add columns named custom:Your Label to include custom fields.',
          'Drop the file on the page. Review the validation report, fix column mapping if needed, choose a template, and download a ZIP, a combined PDF or individual PDFs.',
        ]} />
      </section>
      <section>
        <H2>Back up and move your data</H2>
        <P>Your invoices are stored only in this browser. Use Settings → Your data → Export backup to save a JSON file, and Import backup on another device or browser to restore it.</P>
      </section>
    </ContentLayout>
  )
}
