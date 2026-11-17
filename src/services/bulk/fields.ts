/** Canonical CSV columns. `aliases` are matched case-/space-/underscore-insensitively for automatic mapping. */
export interface FieldDef {
  key: string
  label: string
  level: 'invoice' | 'item'
  required?: boolean
  aliases: string[]
  description: string
}

export const CSV_FIELDS: FieldDef[] = [
  { key: 'invoice_number', label: 'Invoice number', level: 'invoice', required: true, aliases: ['invoice no', 'invoice #', 'invoice', 'number', 'inv'], description: 'Rows with the same number are grouped into one invoice.' },
  { key: 'invoice_date', label: 'Issue date', level: 'invoice', aliases: ['issue date', 'date', 'invoice date'], description: 'YYYY-MM-DD (or DD/MM/YYYY). Defaults to today.' },
  { key: 'due_date', label: 'Due date', level: 'invoice', aliases: ['due', 'payment due'], description: 'YYYY-MM-DD. Defaults to issue date + default due days.' },
  { key: 'currency', label: 'Currency', level: 'invoice', aliases: ['currency code', 'ccy'], description: 'USD, EUR, GBP, PKR, AED, SAR, INR, CAD, AUD, JPY. Defaults to your default currency.' },
  { key: 'status', label: 'Status', level: 'invoice', aliases: [], description: 'draft, sent, paid, overdue, cancelled.' },
  { key: 'po_number', label: 'PO number', level: 'invoice', aliases: ['po', 'purchase order'], description: '' },
  { key: 'reference', label: 'Reference', level: 'invoice', aliases: ['ref'], description: '' },
  { key: 'payment_terms', label: 'Payment terms', level: 'invoice', aliases: ['terms'], description: '' },
  { key: 'notes', label: 'Notes', level: 'invoice', aliases: ['note', 'memo'], description: '' },
  { key: 'business_name', label: 'Business name', level: 'invoice', aliases: ['company name', 'seller', 'from'], description: 'Defaults to your saved business profile.' },
  { key: 'business_email', label: 'Business email', level: 'invoice', aliases: ['seller email'], description: '' },
  { key: 'business_phone', label: 'Business phone', level: 'invoice', aliases: [], description: '' },
  { key: 'business_address', label: 'Business address', level: 'invoice', aliases: [], description: '' },
  { key: 'business_tax_number', label: 'Business tax no.', level: 'invoice', aliases: ['tax number', 'vat number'], description: '' },
  { key: 'customer_name', label: 'Customer name', level: 'invoice', required: true, aliases: ['client', 'client name', 'customer', 'bill to', 'name'], description: '' },
  { key: 'customer_company', label: 'Customer company', level: 'invoice', aliases: ['client company'], description: '' },
  { key: 'customer_email', label: 'Customer email', level: 'invoice', aliases: ['client email', 'email'], description: '' },
  { key: 'customer_phone', label: 'Customer phone', level: 'invoice', aliases: ['client phone', 'phone'], description: '' },
  { key: 'customer_address', label: 'Billing address', level: 'invoice', aliases: ['billing address', 'address', 'client address'], description: '' },
  { key: 'customer_shipping_address', label: 'Shipping address', level: 'invoice', aliases: ['shipping address'], description: '' },
  { key: 'customer_tax_id', label: 'Customer tax ID', level: 'invoice', aliases: ['client tax id'], description: '' },
  { key: 'shipping', label: 'Shipping', level: 'invoice', aliases: ['shipping cost', 'delivery'], description: 'Invoice-level additional charge.' },
  { key: 'amount_paid', label: 'Amount paid', level: 'invoice', aliases: ['paid'], description: '' },
  { key: 'invoice_discount', label: 'Invoice discount', level: 'invoice', aliases: [], description: 'Applied before tax.' },
  { key: 'invoice_discount_type', label: 'Invoice discount type', level: 'invoice', aliases: [], description: 'percent (default) or fixed.' },
  { key: 'item_name', label: 'Item name', level: 'item', required: true, aliases: ['item', 'product', 'service', 'description of goods'], description: '' },
  { key: 'item_description', label: 'Item description', level: 'item', aliases: ['description', 'details'], description: '' },
  { key: 'sku', label: 'SKU', level: 'item', aliases: ['item code', 'code', 'product code'], description: '' },
  { key: 'quantity', label: 'Quantity', level: 'item', required: true, aliases: ['qty', 'hours', 'units'], description: 'Number > 0.' },
  { key: 'unit', label: 'Unit', level: 'item', aliases: ['uom'], description: 'e.g. hrs, pcs.' },
  { key: 'unit_price', label: 'Unit price', level: 'item', required: true, aliases: ['price', 'rate', 'amount', 'unit cost'], description: 'Decimal in major units, e.g. 49.99.' },
  { key: 'discount', label: 'Item discount', level: 'item', aliases: ['item discount'], description: '' },
  { key: 'discount_type', label: 'Item discount type', level: 'item', aliases: [], description: 'percent (default) or fixed.' },
  { key: 'tax_rate', label: 'Tax rate %', level: 'item', aliases: ['tax', 'vat', 'gst', 'tax %'], description: 'Percent, e.g. 10.' },
]

export const CUSTOM_PREFIX = 'custom:'

const norm = (s: string) => s.toLowerCase().replace(/[\s_\-.]+/g, ' ').trim()

/** Map canonical keys → source header. Exact key match beats alias match. */
export function detectMapping(headers: string[]): Record<string, string | null> {
  const used = new Set<string>()
  const out: Record<string, string | null> = {}
  const byNorm = new Map(headers.map((h) => [norm(h), h]))
  for (const f of CSV_FIELDS) {
    const exact = byNorm.get(norm(f.key))
    if (exact && !used.has(exact)) { out[f.key] = exact; used.add(exact) }
  }
  for (const f of CSV_FIELDS) {
    if (out[f.key]) continue
    const hit = f.aliases.map((a) => byNorm.get(norm(a))).find((h) => h && !used.has(h))
    out[f.key] = hit ?? null
    if (hit) used.add(hit)
  }
  return out
}

export const SAMPLE_CSV = `invoice_number,invoice_date,due_date,currency,business_name,customer_name,customer_email,customer_address,item_name,item_description,quantity,unit,unit_price,discount,tax_rate,custom:Project
INV-001,2026-11-01,2026-11-15,USD,ABC Solutions,John Smith,john@example.com,"12 High Street, Springfield",Website Design,"Responsive 5-page website",1,,500,,10,Website relaunch
INV-001,2026-11-01,2026-11-15,USD,ABC Solutions,John Smith,john@example.com,"12 High Street, Springfield",Hosting,12 months,12,mo,15,10,10,Website relaunch
INV-002,2026-11-01,2026-11-15,USD,ABC Solutions,Jane Doe,jane@example.com,,SEO Services,,2,hrs,200,,5,
INV-003,2026-11-03,2026-11-17,EUR,ABC Solutions,Müller GmbH,billing@mueller.example,"Hauptstraße 1, Berlin",Consulting,On-site workshop,8,hrs,120,,19,
`

export const SAMPLE_JSON = JSON.stringify({
  invoices: [
    {
      invoiceNumber: 'INV-001', issueDate: '2026-11-01', dueDate: '2026-11-15', currency: 'USD',
      business: { name: 'ABC Solutions', email: 'billing@example.com' },
      customer: { name: 'John Smith', email: 'john@example.com', billingAddress: '12 High Street, Springfield' },
      items: [
        { name: 'Website Design', description: 'Responsive 5-page website', quantity: 1, unitPrice: 500, taxRate: 10 },
        { name: 'Hosting', quantity: 12, unit: 'mo', unitPrice: 15, taxRate: 10, discount: { type: 'percent', value: 10 } },
      ],
      customFields: [{ label: 'Project', value: 'Website relaunch' }],
      notes: 'Thank you for choosing ABC Solutions.',
    },
    {
      invoiceNumber: 'INV-002', issueDate: '2026-11-01', dueDate: '2026-11-15', currency: 'GBP',
      customer: { name: 'Jane Doe', email: 'jane@example.com' },
      items: [{ name: 'SEO Services', quantity: 2, unit: 'hrs', unitPrice: 200, taxRate: 20 }],
      shipping: 0, amountPaid: 100,
    },
  ],
}, null, 2)
