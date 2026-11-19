import { LOGO_DATA_URL } from './sanitize'
import { SCHEMA_VERSION, type BusinessProfile, type Invoice, type UserPreferences } from '@/types/invoice'

/**
 * Zero-dependency fast path for records this app wrote itself (current schema, expected shape).
 * Anything that fails falls back to the full zod migration in lib/schema.ts, which is lazy-loaded
 * so it stays out of the startup bundle.
 */
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

export function fastInvoice(r: unknown): Invoice | null {
  if (!obj(r) || r.schemaVersion !== SCHEMA_VERSION || typeof r.id !== 'string' || typeof r.number !== 'string') return null
  if (!Array.isArray(r.items) || !Array.isArray(r.customFields) || !Array.isArray(r.customSections)) return null
  if (!obj(r.business) || !obj(r.customer) || !obj(r.payment) || !obj(r.invoiceDiscount) || !obj(r.notes) || !obj(r.terms) || !obj(r.conditions) || !obj(r.footer) || !obj(r.thankYou)) return null
  if (!Array.isArray((r.customer as Record<string, unknown>).hidden)) return null
  if (typeof r.shipping !== 'number' || typeof r.amountPaid !== 'number' || typeof r.adjustment !== 'number') return null
  const logo = (r.business as Record<string, unknown>).logo
  if (logo !== undefined && !(obj(logo) && typeof logo.dataUrl === 'string' && LOGO_DATA_URL.test(logo.dataUrl))) return null
  return r as unknown as Invoice
}

export function fastPrefs(r: unknown): UserPreferences | null {
  if (!obj(r) || r.schemaVersion !== SCHEMA_VERSION || typeof r.numberPrefix !== 'string' || typeof r.nextNumber !== 'number' || !obj(r.payment) || !Array.isArray(r.paymentMethods) || typeof r.defaultFooter !== 'string') return null
  return r as unknown as UserPreferences
}

export function fastBusiness(r: unknown): BusinessProfile | null {
  if (!obj(r) || typeof r.name !== 'string' || typeof r.address !== 'string' || typeof r.email !== 'string') return null
  const logo = r.logo
  if (logo !== undefined && !(obj(logo) && typeof logo.dataUrl === 'string' && LOGO_DATA_URL.test(logo.dataUrl))) return null
  return r as unknown as BusinessProfile
}
