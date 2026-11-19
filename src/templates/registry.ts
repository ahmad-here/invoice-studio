import { useEffect, useState } from 'react'
import type { InvoiceTemplate, TemplateId } from '@/types/invoice'
import type { TemplateDef } from './types'

/** Static metadata so galleries can list templates without loading their code. */
export const TEMPLATES: InvoiceTemplate[] = [
  { id: 'classic', name: 'Classic Professional', description: 'Traditional corporate layout with a bordered item table.', bestFor: 'Any business', category: 'General' },
  { id: 'minimal', name: 'Modern Minimal', description: 'Airy layout, hairline rules and elegant typography.', bestFor: 'Consultants, designers', category: 'General' },
  { id: 'corporate', name: 'Corporate Blue', description: 'Branded blue header band with an organised financial summary.', bestFor: 'Agencies, B2B companies', category: 'General' },
  { id: 'executive', name: 'Executive', description: 'Premium serif typography with a prominent invoice number.', bestFor: 'Law firms, finance', category: 'General' },
  { id: 'creative', name: 'Creative Studio', description: 'Bold display heading, side accent band and rounded total card.', bestFor: 'Studios, creatives', category: 'General' },
  { id: 'elegant', name: 'Elegant Dark Accent', description: 'Sophisticated charcoal headings with restrained contrast.', bestFor: 'Boutiques, architects', category: 'General' },
  { id: 'compact', name: 'Compact Invoice', description: 'Dense, space-efficient layout for long item lists.', bestFor: 'Wholesale, long invoices', category: 'General' },
  { id: 'service', name: 'Service Invoice', description: 'Project details up front; service descriptions take centre stage.', bestFor: 'Freelancers, contractors', category: 'General' },
  { id: 'retail', name: 'Retail Invoice', description: 'Product-focused table with SKU, discount and tax columns.', bestFor: 'Shops, e-commerce', category: 'General' },
  { id: 'highlight', name: 'Highlight', description: 'Bold total-amount bar with soft card rows.', bestFor: 'Agencies, SaaS, modern brands', category: 'General' },
  { id: 'modern', name: 'Modern Business', description: 'Contemporary panels with a distinctive amount-due card.', bestFor: 'Startups, tech services', category: 'General' },
  { id: 'construction', name: 'Construction / Contractor', description: 'Project, job site and licence up front; labour & materials table.', bestFor: 'Contractors, builders, trades', category: 'Industry', fields: ['Project', 'Job site', 'Contractor licence', 'Work phase'] },
  { id: 'timesheet', name: 'Hourly Timesheet', description: 'Tasks, hours and hourly rate with total hours highlighted.', bestFor: 'Freelancers, consultants, hourly billing', category: 'Industry', fields: ['Billing period', 'Project'] },
  { id: 'proforma', name: 'Proforma Invoice', description: 'Advance quote with validity date, estimated total and terms.', bestFor: 'Advance payments, quotes, import licences', category: 'Document', fields: ['Delivery date', 'Delivery terms'] },
  { id: 'taxinvoice', name: 'Tax Invoice (GST/VAT)', description: 'Tax IDs, tax per line, tax summary and amount in words.', bestFor: 'GST/VAT-registered businesses', category: 'Document', fields: ['Place of supply'] },
  { id: 'commercial', name: 'Commercial Invoice (Export)', description: 'Customs-ready: shipper, consignee, HS codes, origin and Incoterms.', bestFor: 'Exporters, international shipping', category: 'Document', fields: ['Country of origin', 'Incoterms', 'Mode of transport', 'Gross weight', 'Number of packages', 'AWB / B/L number', 'Reason for export'] },
  { id: 'creditnote', name: 'Credit Note', description: 'Refunds and adjustments referencing the original invoice.', bestFor: 'Returns, refunds, corrections', category: 'Document', fields: ['Original invoice', 'Reason for credit'] },
  { id: 'receipt', name: 'Payment Receipt', description: 'Proof of payment with a PAID stamp and payment method.', bestFor: 'Shops, cash sales, paid invoices', category: 'Document', fields: ['Transaction ID'] },
  { id: 'medical', name: 'Medical / Healthcare', description: 'Patient and provider details with service dates and codes.', bestFor: 'Clinics, therapists, practitioners', category: 'Industry', fields: ['Patient ID', 'Date of birth', 'Date of service', 'Practitioner', 'Insurance / policy no.'] },
  { id: 'hotel', name: 'Hotel Guest Folio', description: 'Stay summary with check-in, check-out, room and nights.', bestFor: 'Hotels, B&Bs, holiday rentals', category: 'Industry', fields: ['Check-in', 'Check-out', 'Room', 'Guests', 'Booking confirmation'] },
  { id: 'homeservice', name: 'Home Services / Cleaning', description: 'Service address and visit date up front, friendly layout.', bestFor: 'Cleaning, plumbing, landscaping, repairs', category: 'Industry', fields: ['Service address', 'Service date', 'Frequency', 'Technician'] },
]

const loaders: Record<TemplateId, () => Promise<{ default: TemplateDef }>> = {
  classic: () => import('./classic'),
  minimal: () => import('./minimal'),
  corporate: () => import('./corporate'),
  executive: () => import('./executive'),
  creative: () => import('./creative'),
  elegant: () => import('./elegant'),
  compact: () => import('./compact'),
  service: () => import('./service'),
  retail: () => import('./retail'),
  modern: () => import('./modern'),
  highlight: () => import('./highlight'),
  construction: () => import('./construction'),
  timesheet: () => import('./timesheet'),
  proforma: () => import('./proforma'),
  taxinvoice: () => import('./taxinvoice'),
  commercial: () => import('./commercial'),
  creditnote: () => import('./creditnote'),
  receipt: () => import('./receipt'),
  medical: () => import('./medical'),
  hotel: () => import('./hotel'),
  homeservice: () => import('./homeservice'),
}

const cache = new Map<TemplateId, TemplateDef>()

export async function loadTemplate(id: TemplateId): Promise<TemplateDef> {
  const hit = cache.get(id)
  if (hit) return hit
  const def = (await (loaders[id] ?? loaders.classic)()).default
  cache.set(id, def)
  return def
}

export function useTemplate(id: TemplateId): TemplateDef | null {
  const [def, setDef] = useState<TemplateDef | null>(() => cache.get(id) ?? null)
  useEffect(() => {
    let live = true
    const hit = cache.get(id)
    if (hit) setDef(hit)
    else loadTemplate(id).then((d) => live && setDef(d))
    return () => { live = false }
  }, [id])
  return def && def.meta.id === id ? def : cache.get(id) ?? def
}
