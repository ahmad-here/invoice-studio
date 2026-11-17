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
  return inv
}
