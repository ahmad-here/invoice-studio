import type { Invoice } from '@/types/invoice'
import { parseISO } from './dates'

/** Which editor sections are filled in enough to count as “Completed”. */
export function completion(inv: Invoice) {
  const details = !!inv.number.trim() && !!parseISO(inv.issueDate) && (!inv.dueDate || inv.dueDate >= inv.issueDate)
  const customer = !!(inv.customer.name.trim() || inv.customer.company.trim())
  const business = !!inv.business.name.trim()
  const items = inv.items.length > 0 && inv.items.every((i) => i.name.trim() && i.quantity > 0) && inv.items.some((i) => i.unitPrice > 0)
  const p = inv.payment
  const payment = p.visible && !!(p.bankName || p.accountNumber || p.iban || p.instructions || p.link)
  return { details, customer, business, items, payment, parties: customer && business }
}
