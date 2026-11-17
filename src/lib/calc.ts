import type { Discount, Invoice, InvoiceItem, InvoiceTotals, LineTotals, Minor } from '@/types/invoice'
import { roundHalf } from './money'

export type CalcInput = Pick<Invoice, 'items' | 'invoiceDiscount' | 'taxMode' | 'invoiceTaxRate' | 'shipping' | 'adjustment' | 'amountPaid'>

const clampPct = (p: number) => (Number.isFinite(p) ? Math.min(100, Math.max(0, p)) : 0)
const safe = (n: number) => (Number.isFinite(n) ? n : 0)

export function lineSubtotal(item: Pick<InvoiceItem, 'quantity' | 'unitPrice'>): Minor {
  return roundHalf(safe(item.quantity) * safe(item.unitPrice))
}

export function discountAmount(base: Minor, d: Discount): Minor {
  if (base <= 0 || !d) return 0
  if (d.type === 'percent') return roundHalf((base * clampPct(d.value)) / 100)
  return Math.min(base, Math.max(0, roundHalf(safe(d.value))))
}

/** Largest-remainder allocation: split `amount` across `weights` so shares sum exactly to `amount`. */
export function allocate(amount: Minor, weights: Minor[]): Minor[] {
  const total = weights.reduce((a, b) => a + b, 0)
  if (amount === 0 || total <= 0) return weights.map(() => 0)
  const raw = weights.map((w) => (amount * w) / total)
  const floors = raw.map(Math.floor)
  let rest = amount - floors.reduce((a, b) => a + b, 0)
  const order = raw.map((r, i) => [r - floors[i], i] as const).sort((a, b) => b[0] - a[0])
  for (let k = 0; rest > 0 && k < order.length; k++, rest--) floors[order[k][1]] += 1
  return floors
}

/**
 * Core invoice math. All amounts are integer minor units.
 *  line subtotal  = qty × unit price
 *  line discount  = per-item discount (percent or fixed)
 *  invoice discount is applied before tax and allocated pro-rata over the line net amounts
 *  taxable        = line subtotal − line discount − invoice-discount share
 *  tax            = item rate (taxMode 'item') OR the single invoice rate (taxMode 'invoice') — never both
 *  grand total    = subtotal − discounts + tax + shipping + adjustment
 *  balance due    = grand total − amount paid
 */
const memo = new WeakMap<object, InvoiceTotals>()
export function calculateTotals(inv: CalcInput): InvoiceTotals {
  const hit = memo.get(inv)
  if (hit) return hit
  const t = computeTotals(inv)
  memo.set(inv, t)
  return t
}

function computeTotals(inv: CalcInput): InvoiceTotals {
  const base = inv.items.map((it) => {
    const subtotal = lineSubtotal(it)
    const discount = discountAmount(subtotal, it.discount)
    return { it, subtotal, discount, net: subtotal - discount }
  })
  const nets = base.map((b) => Math.max(0, b.net))
  const netSum = nets.reduce((a, b) => a + b, 0)
  const invoiceDiscount = discountAmount(netSum, inv.invoiceDiscount)
  const shares = allocate(invoiceDiscount, nets)

  const byRate = new Map<number, Minor>()
  const lines: LineTotals[] = base.map((b, i) => {
    const taxable = b.net - shares[i]
    const rate = clampPct(inv.taxMode === 'invoice' ? inv.invoiceTaxRate : b.it.taxRate)
    const tax = taxable > 0 ? roundHalf((taxable * rate) / 100) : 0
    if (tax) byRate.set(rate, (byRate.get(rate) ?? 0) + tax)
    return { id: b.it.id, subtotal: b.subtotal, discount: b.discount, invoiceDiscountShare: shares[i], taxable, tax, total: b.net }
  })

  const subtotal = lines.reduce((a, l) => a + l.subtotal, 0)
  const itemDiscounts = lines.reduce((a, l) => a + l.discount, 0)
  const tax = lines.reduce((a, l) => a + l.tax, 0)
  const taxableAmount = lines.reduce((a, l) => a + l.taxable, 0)
  const shipping = roundHalf(safe(inv.shipping))
  const adjustment = roundHalf(safe(inv.adjustment))
  const totalDiscount = itemDiscounts + invoiceDiscount
  const grandTotal = subtotal - totalDiscount + tax + shipping + adjustment
  const amountPaid = roundHalf(safe(inv.amountPaid))
  return {
    lines,
    subtotal,
    itemDiscounts,
    invoiceDiscount,
    totalDiscount,
    taxableAmount,
    tax,
    taxBreakdown: [...byRate.entries()].sort((a, b) => a[0] - b[0]).map(([rate, amount]) => ({ rate, amount })),
    shipping,
    adjustment,
    grandTotal,
    amountPaid,
    balanceDue: grandTotal - amountPaid,
  }
}
