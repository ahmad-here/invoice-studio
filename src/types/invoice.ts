/** Persisted schema version. Bump on breaking model changes and add a migration in lib/migrate.ts. */
export const SCHEMA_VERSION = 1

/** Monetary values are integers in the currency's minor unit (e.g. cents). */
export type Minor = number
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'PKR' | 'AED' | 'SAR' | 'INR' | 'CAD' | 'AUD' | 'JPY'
export type PaperSize = 'A4' | 'Letter' | 'Legal'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type DiscountType = 'percent' | 'fixed'
export type TaxMode = 'item' | 'invoice'
export type LogoPosition = 'left' | 'center' | 'right'
export type TemplateId =
  | 'classic' | 'minimal' | 'corporate' | 'executive' | 'creative'
  | 'elegant' | 'compact' | 'service' | 'retail' | 'modern'

export interface Discount {
  type: DiscountType
  /** percent: 0-100 (may have decimals); fixed: minor units */
  value: number
}

export interface Logo {
  dataUrl: string
  width: number
  height: number
  /** rendered width in px on the invoice (height follows aspect ratio) */
  size: number
  position: LogoPosition
}

export interface BusinessProfile {
  name: string
  logo?: Logo
  address: string
  email: string
  phone: string
  website: string
  taxNumber: string
  vatNumber: string
  extra: string
}

export interface Customer {
  name: string
  company: string
  email: string
  phone: string
  billingAddress: string
  shippingAddress: string
  taxId: string
  reference: string
  /** names of fields the user chose to hide */
  hidden: (keyof Omit<Customer, 'hidden'>)[]
}

export interface InvoiceItem {
  id: string
  name: string
  description: string
  sku: string
  quantity: number
  unit: string
  unitPrice: Minor
  discount: Discount
  /** percent, e.g. 7.5 */
  taxRate: number
}

export type CustomFieldType = 'text' | 'multiline' | 'number' | 'date' | 'url'

export interface CustomField {
  id: string
  label: string
  value: string
  type: CustomFieldType
  required: boolean
  visible: boolean
}

export interface CustomSection {
  id: string
  title: string
  visible: boolean
  fields: CustomField[]
}

export interface PaymentDetails {
  visible: boolean
  method: string
  bankName: string
  accountHolder: string
  accountNumber: string
  iban: string
  swift: string
  instructions: string
  link: string
}

export interface TextSection { text: string; visible: boolean }

export interface Invoice {
  schemaVersion: number
  id: string
  number: string
  issueDate: string // ISO yyyy-mm-dd
  dueDate: string
  paymentTerms: string
  poNumber: string
  reference: string
  status: InvoiceStatus
  currency: CurrencyCode
  template: TemplateId
  paperSize: PaperSize
  accentColor?: string
  business: BusinessProfile
  customer: Customer
  items: InvoiceItem[]
  invoiceDiscount: Discount
  taxMode: TaxMode
  invoiceTaxRate: number
  shipping: Minor
  adjustment: Minor
  adjustmentLabel: string
  amountPaid: Minor
  payment: PaymentDetails
  customFields: CustomField[]
  customSections: CustomSection[]
  notes: TextSection
  terms: TextSection
  conditions: TextSection
  footer: TextSection
  thankYou: TextSection
  title: string
  createdAt: number
  updatedAt: number
}

export interface LineTotals {
  id: string
  subtotal: Minor
  discount: Minor
  /** share of the invoice-level discount allocated to this line */
  invoiceDiscountShare: Minor
  taxable: Minor
  tax: Minor
  total: Minor
}

export interface InvoiceTotals {
  lines: LineTotals[]
  subtotal: Minor
  itemDiscounts: Minor
  invoiceDiscount: Minor
  totalDiscount: Minor
  taxableAmount: Minor
  tax: Minor
  /** tax broken down by rate (percent -> amount) */
  taxBreakdown: { rate: number; amount: Minor }[]
  shipping: Minor
  adjustment: Minor
  grandTotal: Minor
  amountPaid: Minor
  balanceDue: Minor
}

export type DateFormat = 'locale' | 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'D MMM YYYY'

export interface UserPreferences {
  schemaVersion: number
  defaultCurrency: CurrencyCode
  defaultTaxRate: number
  defaultPaymentInstructions: string
  defaultPaymentTerms: string
  defaultNotes: string
  defaultTerms: string
  numberPrefix: string
  nextNumber: number
  defaultTemplate: TemplateId
  defaultPaperSize: PaperSize
  dateFormat: DateFormat
  locale: string
  dueInDays: number
  payment: Omit<PaymentDetails, 'visible' | 'instructions'>
}

export interface InvoiceTemplate {
  id: TemplateId
  name: string
  description: string
  bestFor: string
}

export interface BulkImportError {
  /** 1-based source row (CSV) or invoice index (JSON) */
  row: number
  invoiceNumber?: string
  field?: string
  message: string
  severity: 'error' | 'warning'
}

export interface BulkImportResult {
  format: 'csv' | 'json'
  invoices: Invoice[]
  /** invoice numbers that failed validation (not generated) */
  failed: { invoiceNumber: string; rows: number[] }[]
  issues: BulkImportError[]
  totalRows: number
  totalItems: number
}
