import { z } from 'zod'
import { SCHEMA_VERSION, type Invoice, type UserPreferences, type BusinessProfile } from '@/types/invoice'
import { CURRENCY_CODES } from './money'
import { createInvoice, defaultPreferences, emptyBusiness, emptyCustomer } from './defaults'
import { uid } from './sanitize'

const str = (max = 5000) => z.string().max(max).catch('')
const num = z.number().finite().catch(0)
const bool = (d: boolean) => z.boolean().catch(d)
const TEMPLATE_IDS = ['classic', 'minimal', 'corporate', 'executive', 'creative', 'elegant', 'compact', 'service', 'retail', 'modern'] as const

const discount = z.object({ type: z.enum(['percent', 'fixed']).catch('percent'), value: num }).catch({ type: 'percent', value: 0 })
const textSection = z.object({ text: str(), visible: bool(false) }).catch({ text: '', visible: false })
const customField = z.object({
  id: z.string().catch(() => uid()),
  label: str(200), value: str(),
  type: z.enum(['text', 'multiline', 'number', 'date', 'url']).catch('text'),
  required: bool(false), visible: bool(true),
})
// SVG data URLs are rasterised on upload; only raster data URLs are accepted from backups.
const logo = z.object({
  dataUrl: z.string().max(3_000_000).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/),
  width: num, height: num, size: num,
  position: z.enum(['left', 'center', 'right']).catch('left'),
}).optional().catch(undefined)

export const businessSchema = z.object({
  name: str(300), logo, address: str(), email: str(300), phone: str(100), website: str(300),
  taxNumber: str(100), vatNumber: str(100), extra: str(),
})

const customerKeys = ['name', 'company', 'email', 'phone', 'billingAddress', 'shippingAddress', 'taxId', 'reference'] as const

export const invoiceSchema = z.object({
  schemaVersion: num,
  id: z.string().min(1).catch(() => uid()),
  number: str(100), issueDate: str(20), dueDate: str(20), paymentTerms: str(), poNumber: str(100), reference: str(100),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).catch('draft'),
  currency: z.enum(CURRENCY_CODES as [string, ...string[]]).catch('USD'),
  template: z.enum(TEMPLATE_IDS).catch('classic'),
  paperSize: z.enum(['A4', 'Letter', 'Legal']).catch('A4'),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().catch(undefined),
  business: businessSchema.catch(emptyBusiness()),
  customer: z.object({
    name: str(300), company: str(300), email: str(300), phone: str(100), billingAddress: str(), shippingAddress: str(),
    taxId: str(100), reference: str(100), hidden: z.array(z.enum(customerKeys)).catch([]),
  }).catch(emptyCustomer()),
  items: z.array(z.object({
    id: z.string().catch(() => uid()), name: str(500), description: str(), sku: str(100), quantity: num, unit: str(30),
    unitPrice: num, discount, taxRate: num,
  })).max(5000).catch([]),
  invoiceDiscount: discount,
  taxMode: z.enum(['item', 'invoice']).catch('item'),
  invoiceTaxRate: num, shipping: num, adjustment: num, adjustmentLabel: str(100), amountPaid: num,
  payment: z.object({
    visible: bool(false), method: str(100), bankName: str(200), accountHolder: str(200), accountNumber: str(100),
    iban: str(100), swift: str(50), instructions: str(), link: str(500),
  }),
  customFields: z.array(customField).max(200).catch([]),
  customSections: z.array(z.object({ id: z.string().catch(() => uid()), title: str(200), visible: bool(true), fields: z.array(customField).max(200).catch([]) })).max(50).catch([]),
  notes: textSection, terms: textSection, conditions: textSection, footer: textSection, thankYou: textSection,
  title: str(100), createdAt: num, updatedAt: num,
})

export const prefsSchema = z.object({
  schemaVersion: num,
  defaultCurrency: z.enum(CURRENCY_CODES as [string, ...string[]]).catch('USD'),
  defaultTaxRate: num, defaultPaymentInstructions: str(), defaultPaymentTerms: str(), defaultNotes: str(), defaultTerms: str(),
  numberPrefix: str(30), nextNumber: z.number().int().min(1).catch(1),
  defaultTemplate: z.enum(TEMPLATE_IDS).catch('classic'),
  defaultPaperSize: z.enum(['A4', 'Letter', 'Legal']).catch('A4'),
  dateFormat: z.enum(['locale', 'YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'D MMM YYYY']).catch('D MMM YYYY'),
  locale: str(20), dueInDays: z.number().int().min(0).max(365).catch(14),
  payment: z.object({ method: str(100), bankName: str(200), accountHolder: str(200), accountNumber: str(100), iban: str(100), swift: str(50), link: str(500) }),
})

/** Fill missing fields from a fresh default so older/partial records keep working (forward-compatible migration). */
export function migrateInvoice(raw: unknown): Invoice | null {
  if (!raw || typeof raw !== 'object') return null
  const base = createInvoice(defaultPreferences(), emptyBusiness(), '')
  const merged = { ...base, ...(raw as object) }
  const r = invoiceSchema.safeParse(merged)
  if (!r.success) return null
  return { ...(r.data as Invoice), schemaVersion: SCHEMA_VERSION }
}

export function migratePrefs(raw: unknown): UserPreferences {
  const base = defaultPreferences()
  const r = prefsSchema.safeParse({ ...base, ...(raw && typeof raw === 'object' ? raw : {}) })
  return r.success ? { ...(r.data as UserPreferences), schemaVersion: SCHEMA_VERSION } : base
}

export function migrateBusiness(raw: unknown): BusinessProfile {
  const r = businessSchema.safeParse({ ...emptyBusiness(), ...(raw && typeof raw === 'object' ? raw : {}) })
  return r.success ? (r.data as BusinessProfile) : emptyBusiness()
}

export interface BackupFile {
  app: 'invoice-studio'
  schemaVersion: number
  exportedAt: string
  preferences: UserPreferences
  business: BusinessProfile
  invoices: Invoice[]
}
