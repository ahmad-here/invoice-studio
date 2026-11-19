import type { Invoice, TemplateId } from '@/types/invoice'
import { createInvoice, defaultPreferences, emptyBusiness } from './defaults'

/** Representative sample used only for template thumbnails/previews when the user has no data yet. */
export function sampleInvoice(template: TemplateId, base?: Invoice): Invoice {
  if (base && base.items.some((i) => i.name)) return { ...base, template }
  const inv = createInvoice(defaultPreferences(), { ...emptyBusiness(), name: 'Your Company', address: '123 Business Ave\nSuite 400, City', email: 'billing@yourcompany.com', phone: '+1 555 0100' }, 'INV-0001')
  inv.template = template
  inv.issueDate = '2026-11-01'
  inv.dueDate = '2026-11-15'
  inv.customer = { ...inv.customer, name: 'Client Name', company: 'Client Company Ltd', email: 'accounts@client.com', billingAddress: '42 Market Street\nCity, Country' }
  inv.items = [
    { id: '1', name: 'Brand strategy workshop', description: 'Two-day facilitated session', sku: 'SV-101', quantity: 1, unit: '', unitPrice: 180000, discount: { type: 'percent', value: 0 }, taxRate: 10 },
    { id: '2', name: 'Website design', description: 'Responsive design, 6 pages', sku: 'SV-205', quantity: 1, unit: '', unitPrice: 320000, discount: { type: 'percent', value: 0 }, taxRate: 10 },
    { id: '3', name: 'Development hours', description: '', sku: 'SV-300', quantity: 24, unit: 'hrs', unitPrice: 9500, discount: { type: 'percent', value: 0 }, taxRate: 10 },
  ]
  inv.customFields = [{ id: 'p', label: 'Project', value: 'Website relaunch', type: 'text', required: false, visible: true }]
  inv.payment = { ...inv.payment, visible: true, bankName: 'First National Bank', accountHolder: 'Your Company', accountNumber: '0012 3456 7890' }
  inv.notes = { text: 'Thank you for the opportunity to work together.', visible: true }
  const extra = TEMPLATE_SAMPLES[template]
  if (extra) {
    if (extra.items) inv.items = extra.items.map((it, k) => ({ id: `s${k}`, description: '', sku: '', unit: '', discount: { type: 'percent', value: 0 }, taxRate: 10, quantity: 1, name: '', unitPrice: 0, ...it }) as Invoice['items'][number])
    if (extra.fields) inv.customFields = Object.entries(extra.fields).map(([label, value], k) => ({ id: `f${k}`, label, value, type: (/date|check/i.test(label) ? 'date' : 'text') as 'date' | 'text', required: false, visible: true }))
    if (extra.title) inv.title = extra.title
    if (extra.paid) { inv.status = 'paid'; inv.payment = { ...inv.payment, method: 'Card' } }
  }
  return inv
}

type Sample = { items?: Partial<Invoice['items'][number]>[]; fields?: Record<string, string>; title?: string; paid?: boolean }
const TEMPLATE_SAMPLES: Partial<Record<TemplateId, Sample>> = {
  construction: { fields: { Project: 'Kitchen renovation', 'Job site': '18 Oak Lane, Springfield', 'Contractor licence': 'GC-482910', 'Work phase': 'Phase 2 of 3' }, items: [{ name: 'Demolition & site prep', quantity: 16, unit: 'hrs', unitPrice: 6500 }, { name: 'Cabinetry (installed)', quantity: 1, unitPrice: 485000 }, { name: 'Electrical rough-in', quantity: 1, unitPrice: 120000 }] },
  timesheet: { fields: { 'Billing period': '1–15 Nov 2026', Project: 'Mobile app MVP' }, items: [{ name: 'Discovery workshop', quantity: 4, unit: 'hrs', unitPrice: 9500 }, { name: 'UI design', description: 'Onboarding & dashboard screens', quantity: 12.5, unit: 'hrs', unitPrice: 9500 }, { name: 'Front-end development', quantity: 18, unit: 'hrs', unitPrice: 9500 }] },
  proforma: { fields: { 'Delivery date': 'Within 21 days of payment', 'Delivery terms': 'FOB Shanghai' }, items: [{ name: 'Industrial LED panel 600×600', sku: 'LED-600', quantity: 200, unit: 'pcs', unitPrice: 2450 }, { name: 'Mounting kit', quantity: 200, unit: 'pcs', unitPrice: 320 }] },
  taxinvoice: { fields: { 'Place of supply': 'Karnataka (29)' }, items: [{ name: 'Laptop stand (aluminium)', sku: '8473', quantity: 10, unitPrice: 189900, taxRate: 18 }, { name: 'Installation service', sku: '998719', quantity: 1, unitPrice: 250000, taxRate: 18 }, { name: 'Printed manuals', sku: '4901', quantity: 10, unitPrice: 12000, taxRate: 5 }] },
  commercial: { fields: { 'Country of origin': 'Pakistan', Incoterms: 'CIF Hamburg', 'Mode of transport': 'Sea freight', 'Gross weight': '1,240 kg', 'Number of packages': '42 cartons', 'AWB / B/L number': 'MSCU-7731942', 'Reason for export': 'Sale' }, items: [{ name: 'Cotton bath towels, 600 gsm', sku: '6302.60', quantity: 1200, unit: 'pcs', unitPrice: 650, taxRate: 0 }, { name: 'Cotton bed sheets, queen', sku: '6302.31', quantity: 400, unit: 'sets', unitPrice: 1850, taxRate: 0 }] },
  creditnote: { fields: { 'Original invoice': 'INV-0042', 'Reason for credit': 'Returned damaged goods' }, items: [{ name: 'Wireless keyboard (returned)', quantity: 2, unitPrice: 4900 }, { name: 'Restocking fee waived', quantity: 1, unitPrice: 1500 }] },
  receipt: { paid: true, fields: { 'Transaction ID': 'TXN-88213470' }, items: [{ name: 'Espresso beans 1kg', quantity: 2, unitPrice: 2400, taxRate: 0 }, { name: 'Milk frother', quantity: 1, unitPrice: 3900, taxRate: 0 }] },
  medical: { fields: { 'Patient ID': 'PT-20931', 'Date of birth': '1988-04-12', 'Date of service': '2026-11-03', Practitioner: 'Dr. A. Rahman', 'Insurance / policy no.': 'BlueCare 77-4410' }, items: [{ name: 'Initial consultation', sku: '99203', quantity: 1, unitPrice: 15000, taxRate: 0 }, { name: 'Physiotherapy session', sku: '97110', quantity: 2, unitPrice: 8500, taxRate: 0 }] },
  hotel: { fields: { 'Check-in': '2026-11-10', 'Check-out': '2026-11-13', Room: 'Deluxe King · 512', Guests: '2 adults', 'Booking confirmation': 'HB-55120' }, items: [{ name: 'Room — Deluxe King', quantity: 3, unit: 'nights', unitPrice: 18900 }, { name: 'Breakfast for two', quantity: 3, unitPrice: 3200 }, { name: 'Airport transfer', quantity: 1, unitPrice: 4500 }] },
  homeservice: { fields: { 'Service address': '7 Willow Court, Riverside', 'Service date': '2026-11-08', Frequency: 'Every 2 weeks', Technician: 'Sara & Team' }, items: [{ name: 'Deep clean — 3-bed house', quantity: 1, unitPrice: 18000 }, { name: 'Oven cleaning', quantity: 1, unitPrice: 4500 }, { name: 'Window cleaning (inside)', quantity: 14, unit: 'windows', unitPrice: 300 }] },
}
