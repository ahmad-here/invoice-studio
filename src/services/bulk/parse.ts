import Papa from 'papaparse'
import type {
  BulkImportError, BulkImportResult, BusinessProfile, CurrencyCode, CustomField, Invoice, InvoiceItem, InvoiceStatus, UserPreferences,
} from '@/types/invoice'
import { createInvoice, emptyCustomer } from '@/lib/defaults'
import { addDays, normalizeDate, todayISO } from '@/lib/dates'
import { isCurrency, toMinor } from '@/lib/money'
import { cleanText, uid } from '@/lib/sanitize'
import { CSV_FIELDS, CUSTOM_PREFIX, detectMapping } from './fields'

export const MAX_FILE_BYTES = 20 * 1024 * 1024
export const MAX_INVOICES = 5000

export interface ParseContext {
  prefs: UserPreferences
  business: BusinessProfile
  /** invoice numbers already saved locally (for duplicate warnings) */
  existingNumbers?: string[]
}

export interface CsvTable { headers: string[]; rows: Record<string, string>[]; parseErrors: BulkImportError[] }

const STATUSES: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'cancelled']

/** Parse a number from user data. Accepts "1,234.50", " 12 ", "10%". Returns NaN for junk. */
export function parseNum(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : NaN
  const s = String(v ?? '').trim().replace(/%$/, '').trim()
  if (s === '') return NaN
  const c = /^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s) ? s.replace(/,/g, '') : s
  return /^-?(\d+\.?\d*|\.\d+)$/.test(c) ? Number(c) : NaN
}

export function parseCsvText(text: string): CsvTable {
  const res = Papa.parse<Record<string, string>>(text.replace(/^\uFEFF/, ''), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => cleanText(h, 200).trim(),
  })
  const parseErrors: BulkImportError[] = res.errors.map((e) => ({
    row: (e.row ?? 0) + 2, message: `CSV format problem: ${e.message}`, severity: e.type === 'FieldMismatch' ? 'warning' : 'error',
  }))
  return { headers: (res.meta.fields ?? []).filter(Boolean), rows: res.data, parseErrors }
}

interface Acc {
  inv: Invoice
  rows: number[]
  errors: BulkImportError[]
  first: Record<string, string>
}

/** Build invoices from CSV rows using a canonical→header mapping. Never drops a row silently. */
export function buildFromCsv(table: CsvTable, mapping: Record<string, string | null>, ctx: ParseContext): BulkImportResult {
  const issues: BulkImportError[] = [...table.parseErrors]
  const missingRequired = CSV_FIELDS.filter((f) => f.required && !mapping[f.key])
  if (missingRequired.length) {
    issues.push({ row: 1, message: `Required column(s) not mapped: ${missingRequired.map((f) => f.label).join(', ')}`, severity: 'error' })
    return { format: 'csv', invoices: [], failed: [], issues, totalRows: table.rows.length, totalItems: 0 }
  }
  const customCols = table.headers.filter((h) => h.toLowerCase().startsWith(CUSTOM_PREFIX))
  const get = (r: Record<string, string>, key: string) => cleanText(mapping[key] ? r[mapping[key]!] ?? '' : '').trim()

  const groups = new Map<string, Acc>()
  const order: string[] = []
  let lastNumberSeenAt = new Map<string, number>()
  let totalItems = 0

  table.rows.forEach((r, idx) => {
    const rowNo = idx + 2 // header is row 1
    const number = get(r, 'invoice_number')
    if (!number) {
      issues.push({ row: rowNo, field: 'invoice_number', message: 'Missing invoice number — row skipped.', severity: 'error' })
      return
    }
    let acc = groups.get(number)
    if (!acc) {
      acc = { inv: createInvoice(ctx.prefs, ctx.business, number), rows: [], errors: [], first: {} }
      groups.set(number, acc)
      order.push(number)
      applyInvoiceFields(acc, r, get, rowNo, ctx, customCols)
    } else {
      const prev = lastNumberSeenAt.get(number)
      if (prev !== undefined && prev !== idx - 1) {
        issues.push({ row: rowNo, invoiceNumber: number, message: `Rows for ${number} are not contiguous; they were grouped into one invoice.`, severity: 'warning' })
      }
      checkConsistency(acc, r, get, rowNo, number)
    }
    lastNumberSeenAt.set(number, idx)
    acc.rows.push(rowNo)
    const item = buildItem({
      name: get(r, 'item_name'), description: get(r, 'item_description'), sku: get(r, 'sku'), unit: get(r, 'unit'),
      quantity: get(r, 'quantity'), unitPrice: get(r, 'unit_price'), discount: get(r, 'discount'),
      discountType: get(r, 'discount_type'), taxRate: get(r, 'tax_rate'),
    }, acc.inv.currency, ctx.prefs.defaultTaxRate, rowNo, number, acc.errors)
    if (item) { acc.inv.items.push(item); totalItems++ }
  })
  lastNumberSeenAt = new Map()
  return finalize('csv', order.map((n) => groups.get(n)!), issues, table.rows.length, totalItems, ctx)
}

function applyInvoiceFields(acc: Acc, r: Record<string, string>, get: (r: Record<string, string>, k: string) => string, row: number, ctx: ParseContext, customCols: string[]) {
  const { inv, errors } = acc
  const num = inv.number
  inv.items = []
  for (const f of CSV_FIELDS) if (f.level === 'invoice') acc.first[f.key] = get(r, f.key)
  const cur = get(r, 'currency').toUpperCase()
  if (cur) {
    if (isCurrency(cur)) inv.currency = cur as CurrencyCode
    else errors.push({ row, invoiceNumber: num, field: 'currency', message: `Unsupported currency "${cur}".`, severity: 'error' })
  }
  applyDates(inv, get(r, 'invoice_date'), get(r, 'due_date'), ctx, row, errors)
  const status = get(r, 'status').toLowerCase()
  if (status) {
    if ((STATUSES as string[]).includes(status)) inv.status = status as InvoiceStatus
    else errors.push({ row, invoiceNumber: num, field: 'status', message: `Unknown status "${status}" — saved as draft.`, severity: 'warning' })
  }
  inv.poNumber = get(r, 'po_number')
  inv.reference = get(r, 'reference')
  const terms = get(r, 'payment_terms')
  if (terms) { inv.paymentTerms = terms; inv.terms = { text: terms, visible: true } }
  const notes = get(r, 'notes')
  if (notes) inv.notes = { text: notes, visible: true }
  applyBusiness(inv, { name: get(r, 'business_name'), email: get(r, 'business_email'), phone: get(r, 'business_phone'), address: get(r, 'business_address'), taxNumber: get(r, 'business_tax_number') })
  applyCustomer(inv, {
    name: get(r, 'customer_name'), company: get(r, 'customer_company'), email: get(r, 'customer_email'), phone: get(r, 'customer_phone'),
    billingAddress: get(r, 'customer_address'), shippingAddress: get(r, 'customer_shipping_address'), taxId: get(r, 'customer_tax_id'),
  }, row, errors)
  applyMoneyFields(inv, { shipping: get(r, 'shipping'), amountPaid: get(r, 'amount_paid'), discount: get(r, 'invoice_discount'), discountType: get(r, 'invoice_discount_type') }, row, errors)
  inv.customFields = customCols
    .map((h) => ({ label: cleanText(h.slice(CUSTOM_PREFIX.length), 200).trim(), value: cleanText(r[h] ?? '').trim() }))
    .filter((c) => c.label && c.value)
    .map(toCustomField)
}

function checkConsistency(acc: Acc, r: Record<string, string>, get: (r: Record<string, string>, k: string) => string, row: number, number: string) {
  const strict = ['customer_name', 'customer_email', 'currency']
  const soft = ['invoice_date', 'due_date', 'customer_company', 'customer_address', 'business_name']
  for (const k of [...strict, ...soft]) {
    const v = get(r, k)
    const f = acc.first[k] ?? ''
    if (v && v !== f) {
      const label = CSV_FIELDS.find((x) => x.key === k)!.label
      const isStrict = strict.includes(k)
      acc.errors.push({
        row, invoiceNumber: number, field: k,
        message: `${label} "${v}" differs from "${f}" in the first row of ${number}. ${isStrict ? 'Check whether two different invoices share this number.' : 'The first row\'s value was used.'}`,
        severity: isStrict ? 'error' : 'warning',
      })
    }
  }
}

function applyDates(inv: Invoice, issueRaw: string, dueRaw: string, ctx: ParseContext, row: number, errors: BulkImportError[]) {
  if (issueRaw) {
    const d = normalizeDate(issueRaw)
    if (d) inv.issueDate = d
    else errors.push({ row, invoiceNumber: inv.number, field: 'invoice_date', message: `Invalid issue date "${issueRaw}". Use YYYY-MM-DD.`, severity: 'error' })
  } else inv.issueDate = todayISO()
  if (dueRaw) {
    const d = normalizeDate(dueRaw)
    if (d) inv.dueDate = d
    else errors.push({ row, invoiceNumber: inv.number, field: 'due_date', message: `Invalid due date "${dueRaw}". Use YYYY-MM-DD.`, severity: 'error' })
  } else inv.dueDate = addDays(inv.issueDate, ctx.prefs.dueInDays)
  if (inv.dueDate < inv.issueDate) errors.push({ row, invoiceNumber: inv.number, field: 'due_date', message: 'Due date is before the issue date.', severity: 'warning' })
}

const BUSINESS_TEXT_KEYS = ['name', 'email', 'phone', 'address', 'taxNumber'] as const
function applyBusiness(inv: Invoice, b: Partial<Record<(typeof BUSINESS_TEXT_KEYS)[number], string>>) {
  for (const k of BUSINESS_TEXT_KEYS) if (b[k]) inv.business[k] = cleanText(b[k], 1000)
}

const CUSTOMER_TEXT_KEYS = ['name', 'company', 'email', 'phone', 'billingAddress', 'shippingAddress', 'taxId', 'reference'] as const
function applyCustomer(inv: Invoice, c: Partial<Record<string, string>>, row: number, errors: BulkImportError[]) {
  const cust = emptyCustomer()
  for (const k of CUSTOMER_TEXT_KEYS) if (c[k]) cust[k] = cleanText(c[k], 1000)
  cust.hidden = (['company', 'email', 'phone', 'billingAddress', 'shippingAddress', 'taxId', 'reference'] as const).filter((k) => !cust[k])
  inv.customer = cust
  if (!cust.name && !cust.company) errors.push({ row, invoiceNumber: inv.number, field: 'customer_name', message: 'Missing customer name.', severity: 'error' })
  if (cust.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cust.email)) errors.push({ row, invoiceNumber: inv.number, field: 'customer_email', message: `Customer email "${cust.email}" looks invalid.`, severity: 'warning' })
}

function applyMoneyFields(inv: Invoice, m: { shipping?: unknown; amountPaid?: unknown; discount?: unknown; discountType?: unknown }, row: number, errors: BulkImportError[]) {
  const money = (raw: unknown, field: string): number => {
    if (raw === undefined || raw === null || raw === '') return 0
    const n = parseNum(raw)
    if (Number.isNaN(n) || n < 0) {
      errors.push({ row, invoiceNumber: inv.number, field, message: `Invalid amount "${String(raw)}" for ${field}.`, severity: 'error' })
      return 0
    }
    return toMinor(n, inv.currency)
  }
  inv.shipping = money(m.shipping, 'shipping')
  inv.amountPaid = money(m.amountPaid, 'amount_paid')
  const dType = String(m.discountType ?? '').toLowerCase() === 'fixed' ? 'fixed' : 'percent'
  if (m.discount !== undefined && m.discount !== '' && m.discount !== null) {
    const n = parseNum(m.discount)
    if (Number.isNaN(n) || n < 0 || (dType === 'percent' && n > 100)) errors.push({ row, invoiceNumber: inv.number, field: 'invoice_discount', message: `Invalid invoice discount "${String(m.discount)}".`, severity: 'error' })
    else inv.invoiceDiscount = { type: dType, value: dType === 'fixed' ? toMinor(n, inv.currency) : n }
  }
  if (inv.amountPaid > 0 && inv.status === 'draft') inv.status = 'sent'
}

interface RawItem { name?: unknown; description?: unknown; sku?: unknown; unit?: unknown; quantity?: unknown; unitPrice?: unknown; discount?: unknown; discountType?: unknown; taxRate?: unknown }

function buildItem(raw: RawItem, currency: CurrencyCode, defaultTax: number, row: number, number: string, errors: BulkImportError[]): InvoiceItem | null {
  const name = cleanText(raw.name, 500).trim()
  let ok = true
  const err = (field: string, message: string) => { errors.push({ row, invoiceNumber: number, field, message, severity: 'error' }); ok = false }
  if (!name) err('item_name', 'Missing item name.')
  const qty = parseNum(raw.quantity)
  if (raw.quantity === undefined || raw.quantity === '') err('quantity', 'Missing quantity.')
  else if (Number.isNaN(qty)) err('quantity', `Quantity "${String(raw.quantity)}" is not a number.`)
  else if (qty <= 0) err('quantity', 'Quantity must be greater than 0.')
  const price = parseNum(raw.unitPrice)
  if (raw.unitPrice === undefined || raw.unitPrice === '') err('unit_price', 'Missing unit price.')
  else if (Number.isNaN(price)) err('unit_price', `Unit price "${String(raw.unitPrice)}" is not a number.`)
  else if (price < 0) err('unit_price', 'Unit price cannot be negative.')
  let tax = defaultTax
  if (raw.taxRate !== undefined && raw.taxRate !== '' && raw.taxRate !== null) {
    tax = parseNum(raw.taxRate)
    if (Number.isNaN(tax) || tax < 0 || tax > 100) err('tax_rate', `Tax rate "${String(raw.taxRate)}" must be between 0 and 100.`)
  }
  let discount: InvoiceItem['discount'] = { type: 'percent', value: 0 }
  let dRaw = raw.discount
  let dType = String(raw.discountType ?? '').toLowerCase() === 'fixed' ? 'fixed' : 'percent'
  if (dRaw && typeof dRaw === 'object') {
    const o = dRaw as { type?: unknown; value?: unknown }
    dType = o.type === 'fixed' ? 'fixed' : 'percent'
    dRaw = o.value
  }
  if (dRaw !== undefined && dRaw !== '' && dRaw !== null) {
    const d = parseNum(dRaw)
    if (Number.isNaN(d) || d < 0 || (dType === 'percent' && d > 100)) err('discount', `Invalid item discount "${String(dRaw)}".`)
    else discount = dType === 'fixed' ? { type: 'fixed', value: toMinor(d, currency) } : { type: 'percent', value: d }
  }
  if (!ok) return null
  return {
    id: uid(), name, description: cleanText(raw.description).trim(), sku: cleanText(raw.sku, 100).trim(), unit: cleanText(raw.unit, 30).trim(),
    quantity: qty, unitPrice: toMinor(price, currency), discount, taxRate: tax,
  }
}

const toCustomField = (c: { label: string; value: string }): CustomField => ({ id: uid(), label: c.label, value: c.value, type: c.value.includes('\n') ? 'multiline' : 'text', required: false, visible: true })

function finalize(format: 'csv' | 'json', accs: Acc[], issues: BulkImportError[], totalRows: number, totalItems: number, ctx: ParseContext): BulkImportResult {
  const existing = new Set(ctx.existingNumbers ?? [])
  const invoices: Invoice[] = []
  const failed: BulkImportResult['failed'] = []
  for (const acc of accs.slice(0, MAX_INVOICES)) {
    if (acc.inv.items.length === 0 && !acc.errors.some((e) => e.severity === 'error')) {
      acc.errors.push({ row: acc.rows[0] ?? 0, invoiceNumber: acc.inv.number, message: 'Invoice has no line items.', severity: 'error' })
    }
    if (existing.has(acc.inv.number)) {
      acc.errors.push({ row: acc.rows[0] ?? 0, invoiceNumber: acc.inv.number, field: 'invoice_number', message: `${acc.inv.number} already exists in Saved Invoices. It can be downloaded, but “Save to invoices” will skip it.`, severity: 'warning' })
    }
    issues.push(...acc.errors)
    if (acc.errors.some((e) => e.severity === 'error')) failed.push({ invoiceNumber: acc.inv.number, rows: acc.rows })
    else invoices.push(acc.inv)
  }
  if (accs.length > MAX_INVOICES) issues.push({ row: 0, message: `Only the first ${MAX_INVOICES} invoices were processed. Split the file to import the rest.`, severity: 'error' })
  issues.sort((a, b) => a.row - b.row)
  return { format, invoices, failed, issues, totalRows, totalItems }
}

/* ---------------------------------- JSON ---------------------------------- */

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v)
const s = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? cleanText(String(v)).trim() : '')

export function parseJsonText(text: string, ctx: ParseContext): BulkImportResult {
  let data: unknown
  try {
    data = JSON.parse(text.replace(/^\uFEFF/, ''))
  } catch (e) {
    return { format: 'json', invoices: [], failed: [], totalRows: 0, totalItems: 0, issues: [{ row: 0, message: `Malformed JSON: ${(e as Error).message}`, severity: 'error' }] }
  }
  const list = Array.isArray(data) ? data : isObj(data) && Array.isArray(data.invoices) ? data.invoices : null
  if (!list) {
    return { format: 'json', invoices: [], failed: [], totalRows: 0, totalItems: 0, issues: [{ row: 0, message: 'Expected an object with an "invoices" array (or a top-level array).', severity: 'error' }] }
  }
  return buildFromJson(list, ctx)
}

export function buildFromJson(list: unknown[], ctx: ParseContext): BulkImportResult {
  const issues: BulkImportError[] = []
  const seen = new Map<string, number>()
  const accs: Acc[] = []
  let totalItems = 0
  list.forEach((raw, i) => {
    const row = i + 1
    if (!isObj(raw)) {
      issues.push({ row, message: `Invoice #${row} is not an object.`, severity: 'error' })
      return
    }
    const number = s(raw.invoiceNumber ?? raw.number ?? raw.invoice_number)
    const label = number || `#${row}`
    const acc: Acc = { inv: createInvoice(ctx.prefs, ctx.business, number), rows: [row], errors: [], first: {} }
    acc.inv.items = []
    if (!number) acc.errors.push({ row, field: 'invoiceNumber', message: `Invoice #${row} has no invoiceNumber.`, severity: 'error', invoiceNumber: label })
    else if (seen.has(number)) acc.errors.push({ row, invoiceNumber: number, field: 'invoiceNumber', message: `Duplicate invoice number ${number} (also invoice #${seen.get(number)}).`, severity: 'error' })
    else seen.set(number, row)
    if (!number) acc.inv.number = label
    const cur = s(raw.currency).toUpperCase()
    if (cur) {
      if (isCurrency(cur)) acc.inv.currency = cur
      else acc.errors.push({ row, invoiceNumber: label, field: 'currency', message: `Unsupported currency "${cur}".`, severity: 'error' })
    }
    applyDates(acc.inv, s(raw.issueDate ?? raw.invoiceDate), s(raw.dueDate), ctx, row, acc.errors)
    const status = s(raw.status).toLowerCase()
    if (status && (STATUSES as string[]).includes(status)) acc.inv.status = status as InvoiceStatus
    acc.inv.poNumber = s(raw.poNumber)
    acc.inv.reference = s(raw.reference)
    if (s(raw.paymentTerms)) { acc.inv.paymentTerms = s(raw.paymentTerms); acc.inv.terms = { text: s(raw.paymentTerms), visible: true } }
    if (s(raw.notes)) acc.inv.notes = { text: s(raw.notes), visible: true }
    if (s(raw.terms)) acc.inv.conditions = { text: s(raw.terms), visible: true }
    const b = isObj(raw.business) ? raw.business : {}
    applyBusiness(acc.inv, { name: s(b.name), email: s(b.email), phone: s(b.phone), address: s(b.address), taxNumber: s(b.taxNumber) })
    const c = isObj(raw.customer) ? raw.customer : {}
    if (!isObj(raw.customer)) acc.errors.push({ row, invoiceNumber: label, field: 'customer', message: 'Missing "customer" object.', severity: 'error' })
    else applyCustomer(acc.inv, {
      name: s(c.name), company: s(c.company), email: s(c.email), phone: s(c.phone), billingAddress: s(c.billingAddress ?? c.address),
      shippingAddress: s(c.shippingAddress), taxId: s(c.taxId), reference: s(c.reference),
    }, row, acc.errors)
    const d = raw.discount
    applyMoneyFields(acc.inv, { shipping: raw.shipping, amountPaid: raw.amountPaid, discount: isObj(d) ? d.value : d, discountType: isObj(d) ? d.type : undefined }, row, acc.errors)
    if (!Array.isArray(raw.items) || raw.items.length === 0) acc.errors.push({ row, invoiceNumber: label, field: 'items', message: 'Missing or empty "items" array.', severity: 'error' })
    else raw.items.forEach((it, j) => {
      if (!isObj(it)) { acc.errors.push({ row, invoiceNumber: label, field: `items[${j}]`, message: `Item ${j + 1} is not an object.`, severity: 'error' }); return }
      const before = acc.errors.length
      const item = buildItem({ name: it.name, description: it.description, sku: it.sku, unit: it.unit, quantity: it.quantity, unitPrice: it.unitPrice ?? it.price, discount: it.discount, taxRate: it.taxRate }, acc.inv.currency, ctx.prefs.defaultTaxRate, row, label, acc.errors)
      for (const e of acc.errors.slice(before)) e.message = `Item ${j + 1}: ${e.message}`
      if (item) { acc.inv.items.push(item); totalItems++ }
    })
    if (Array.isArray(raw.customFields)) {
      acc.inv.customFields = raw.customFields.filter(isObj).map((f) => ({ label: s(f.label), value: s(f.value) })).filter((f) => f.label).map(toCustomField)
    }
    accs.push(acc)
  })
  return finalize('json', accs, issues, list.length, totalItems, ctx)
}

/** Full pipeline used by the worker. */
export function processFile(name: string, text: string, ctx: ParseContext, mapping?: Record<string, string | null>) {
  const isJson = /\.json$/i.test(name) || /^\s*[[{]/.test(text)
  if (isJson) return { result: parseJsonText(text, ctx), headers: [] as string[], mapping: {} as Record<string, string | null> }
  const table = parseCsvText(text)
  const m = mapping ?? detectMapping(table.headers)
  return { result: buildFromCsv(table, m, ctx), headers: table.headers, mapping: m }
}

export function errorReportCsv(issues: BulkImportError[]): string {
  return Papa.unparse(issues.map((e) => ({ row: e.row, invoice_number: e.invoiceNumber ?? '', field: e.field ?? '', severity: e.severity, message: e.message })), { escapeFormulae: true })
}
