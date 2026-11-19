import type { Client, Customer, Invoice } from '@/types/invoice'
import { cleanText, uid } from './sanitize'
import { emptyCustomer } from './defaults'

const FIELDS = ['name', 'company', 'email', 'phone', 'billingAddress', 'shippingAddress', 'taxId', 'reference'] as const

export const emptyClient = (): Client => ({ id: uid(), name: '', company: '', email: '', phone: '', billingAddress: '', shippingAddress: '', taxId: '', reference: '', notes: '', createdAt: Date.now(), updatedAt: Date.now() })

/** Validate an untrusted record (storage/backup) into a Client, or null. */
export function normalizeClient(raw: unknown): Client | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const c = emptyClient()
  for (const k of FIELDS) c[k] = cleanText(r[k], k.endsWith('Address') ? 1000 : 300)
  c.notes = cleanText(r.notes, 2000)
  c.id = typeof r.id === 'string' && r.id ? r.id.slice(0, 100) : uid()
  c.createdAt = typeof r.createdAt === 'number' ? r.createdAt : Date.now()
  c.updatedAt = typeof r.updatedAt === 'number' ? r.updatedAt : c.createdAt
  return c.name || c.company ? c : null
}

/** Client → invoice customer block (empty optional fields hidden). */
export function clientToCustomer(c: Client): Customer {
  const cust = emptyCustomer()
  for (const k of FIELDS) cust[k] = c[k]
  cust.hidden = (['company', 'email', 'phone', 'billingAddress', 'shippingAddress', 'taxId', 'reference'] as const).filter((k) => !c[k])
  return cust
}

export function customerToClient(cust: Customer, base?: Client): Client {
  const c = base ? { ...base } : emptyClient()
  for (const k of FIELDS) c[k] = cust[k]
  c.updatedAt = Date.now()
  return c
}

const norm = (s: string) => s.trim().toLowerCase()
/** Invoices that belong to a client (matched by email, else by name + company). */
export function invoicesForClient(c: Client, invoices: Invoice[]): Invoice[] {
  return invoices.filter((i) => (c.email && norm(i.customer.email) === norm(c.email)) || (!!c.name && norm(i.customer.name) === norm(c.name) && norm(i.customer.company) === norm(c.company)))
}
