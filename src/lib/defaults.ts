import { SCHEMA_VERSION, type BusinessProfile, type Customer, type Invoice, type InvoiceItem, type UserPreferences } from '@/types/invoice'
import { addDays, todayISO } from './dates'
import { uid } from './sanitize'

export const emptyBusiness = (): BusinessProfile => ({
  name: '', address: '', email: '', phone: '', website: '', taxNumber: '', vatNumber: '', extra: '',
})

export const emptyCustomer = (): Customer => ({
  name: '', company: '', email: '', phone: '', billingAddress: '', shippingAddress: '', taxId: '', reference: '',
  hidden: ['shippingAddress', 'taxId', 'reference'],
})

export const defaultPreferences = (): UserPreferences => ({
  schemaVersion: SCHEMA_VERSION,
  defaultCurrency: 'USD',
  defaultTaxRate: 0,
  defaultPaymentInstructions: '',
  defaultPaymentTerms: 'Payment due within 14 days.',
  defaultNotes: '',
  defaultTerms: '',
  numberPrefix: 'INV-',
  nextNumber: 1,
  defaultTemplate: 'classic',
  defaultPaperSize: 'A4',
  dateFormat: 'D MMM YYYY',
  locale: 'en-US',
  dueInDays: 14,
  payment: { method: 'Bank transfer', bankName: '', accountHolder: '', accountNumber: '', iban: '', swift: '', link: '' },
})

export const newItem = (taxRate = 0): InvoiceItem => ({
  id: uid(), name: '', description: '', sku: '', quantity: 1, unit: '', unitPrice: 0,
  discount: { type: 'percent', value: 0 }, taxRate,
})

export const formatInvoiceNumber = (prefix: string, n: number) => `${prefix}${String(n).padStart(4, '0')}`

export function createInvoice(prefs: UserPreferences, business: BusinessProfile, number?: string): Invoice {
  const issue = todayISO()
  const now = Date.now()
  return {
    schemaVersion: SCHEMA_VERSION,
    id: uid(),
    number: number ?? formatInvoiceNumber(prefs.numberPrefix, prefs.nextNumber),
    issueDate: issue,
    dueDate: addDays(issue, prefs.dueInDays),
    paymentTerms: prefs.defaultPaymentTerms,
    poNumber: '',
    reference: '',
    status: 'draft',
    currency: prefs.defaultCurrency,
    template: prefs.defaultTemplate,
    paperSize: prefs.defaultPaperSize,
    business: structuredClone(business),
    businessId: business.id,
    customer: emptyCustomer(),
    items: [newItem(prefs.defaultTaxRate)],
    invoiceDiscount: { type: 'percent', value: 0 },
    taxMode: 'item',
    invoiceTaxRate: prefs.defaultTaxRate,
    shipping: 0,
    adjustment: 0,
    adjustmentLabel: 'Adjustment',
    amountPaid: 0,
    payment: { ...prefs.payment, instructions: prefs.defaultPaymentInstructions, visible: !!(prefs.payment.bankName || prefs.payment.accountNumber || prefs.payment.iban || prefs.defaultPaymentInstructions) },
    customFields: [],
    customSections: [],
    notes: { text: prefs.defaultNotes, visible: !!prefs.defaultNotes },
    terms: { text: prefs.defaultPaymentTerms, visible: !!prefs.defaultPaymentTerms },
    conditions: { text: prefs.defaultTerms, visible: !!prefs.defaultTerms },
    footer: { text: '', visible: false },
    thankYou: { text: 'Thank you for your business.', visible: true },
    title: 'Invoice',
    createdAt: now,
    updatedAt: now,
  }
}
