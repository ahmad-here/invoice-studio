import { describe, expect, it } from 'vitest'
import { allocate, calculateTotals, discountAmount, type CalcInput } from '@/lib/calc'
import { formatMoney, minorToInput, toMinor, convertMinorPrecision, normalizeDecimal } from '@/lib/money'
import type { InvoiceItem } from '@/types/invoice'

const item = (p: Partial<InvoiceItem>): InvoiceItem => ({
  id: Math.random().toString(), name: 'x', description: '', sku: '', quantity: 1, unit: '', unitPrice: 0,
  discount: { type: 'percent', value: 0 }, taxRate: 0, ...p,
})
const base = (items: InvoiceItem[], o: Partial<CalcInput> = {}): CalcInput => ({
  items, invoiceDiscount: { type: 'percent', value: 0 }, taxMode: 'item', invoiceTaxRate: 0,
  shipping: 0, adjustment: 0, amountPaid: 0, ...o,
})

describe('money conversion', () => {
  it('parses decimal strings exactly', () => {
    expect(toMinor('19.99', 'USD')).toBe(1999)
    expect(toMinor('0.1', 'USD')).toBe(10)
    expect(toMinor('1.005', 'USD')).toBe(101)
    expect(toMinor(1.005, 'USD')).toBe(101)
    expect(toMinor('-2.5', 'USD')).toBe(-250)
    expect(toMinor('1500', 'JPY')).toBe(1500)
    expect(toMinor('abc', 'USD')).toBeNaN()
    expect(toMinor('', 'USD')).toBeNaN()
  })
  it('round-trips to input strings', () => {
    expect(minorToInput(1999, 'USD')).toBe('19.99')
    expect(minorToInput(5, 'USD')).toBe('0.05')
    expect(minorToInput(-250, 'USD')).toBe('-2.50')
    expect(minorToInput(1500, 'JPY')).toBe('1500')
  })
  it('formats with currency symbols', () => {
    expect(formatMoney(123456, 'USD')).toBe('$1,234.56')
    expect(formatMoney(1500, 'JPY')).toContain('1,500')
  })
  it('converts precision between currencies', () => {
    expect(convertMinorPrecision(1999, 'USD', 'JPY')).toBe(20)
    expect(convertMinorPrecision(20, 'JPY', 'USD')).toBe(2000)
  })
})

describe('normalizeDecimal (typed amounts)', () => {
  it('handles thousands and decimal separators', () => {
    expect(normalizeDecimal('1,234')).toBe('1234')
    expect(normalizeDecimal('1,234.50')).toBe('1234.50')
    expect(normalizeDecimal('1.234,50')).toBe('1234.50')
    expect(normalizeDecimal('12,5')).toBe('12.5')
    expect(normalizeDecimal('1 000,25')).toBe('1000.25')
    expect(normalizeDecimal('1.234.567')).toBe('1234567')
    expect(normalizeDecimal('-19.99')).toBe('-19.99')
  })
})

describe('discounts and allocation', () => {
  it('computes percent and fixed discounts, capped at base', () => {
    expect(discountAmount(10000, { type: 'percent', value: 10 })).toBe(1000)
    expect(discountAmount(1000, { type: 'fixed', value: 5000 })).toBe(1000)
    expect(discountAmount(999, { type: 'percent', value: 150 })).toBe(999)
  })
  it('allocates exactly', () => {
    const s = allocate(100, [1, 1, 1])
    expect(s.reduce((a, b) => a + b)).toBe(100)
    expect(allocate(0, [5, 5])).toEqual([0, 0])
  })
})

describe('calculateTotals', () => {
  it('avoids floating point errors (0.1 + 0.2 class)', () => {
    const t = calculateTotals(base([item({ quantity: 3, unitPrice: 10 }), item({ quantity: 1, unitPrice: 20 })]))
    expect(t.subtotal).toBe(50)
  })
  it('handles fractional quantities with half-up rounding', () => {
    const t = calculateTotals(base([item({ quantity: 1.5, unitPrice: 333 })]))
    expect(t.subtotal).toBe(500) // 499.5 -> 500
  })
  it('applies per-item discount then per-item tax', () => {
    const t = calculateTotals(base([item({ quantity: 2, unitPrice: 10000, discount: { type: 'percent', value: 10 }, taxRate: 10 })]))
    expect(t.subtotal).toBe(20000)
    expect(t.itemDiscounts).toBe(2000)
    expect(t.tax).toBe(1800)
    expect(t.grandTotal).toBe(19800)
  })
  it('allocates invoice discount pre-tax across mixed tax rates', () => {
    const t = calculateTotals(base(
      [item({ unitPrice: 10000, taxRate: 10 }), item({ unitPrice: 10000, taxRate: 0 })],
      { invoiceDiscount: { type: 'fixed', value: 2000 } },
    ))
    expect(t.invoiceDiscount).toBe(2000)
    expect(t.tax).toBe(900) // (10000-1000) * 10%
    expect(t.grandTotal).toBe(20000 - 2000 + 900)
  })
  it('never applies item tax and invoice tax together', () => {
    const items = [item({ unitPrice: 10000, taxRate: 20 })]
    const itemMode = calculateTotals(base(items, { taxMode: 'item', invoiceTaxRate: 5 }))
    const invMode = calculateTotals(base(items, { taxMode: 'invoice', invoiceTaxRate: 5 }))
    expect(itemMode.tax).toBe(2000)
    expect(invMode.tax).toBe(500)
  })
  it('adds shipping and adjustment, subtracts amount paid', () => {
    const t = calculateTotals(base([item({ unitPrice: 10000 })], { shipping: 1500, adjustment: -500, amountPaid: 4000 }))
    expect(t.grandTotal).toBe(11000)
    expect(t.balanceDue).toBe(7000)
  })
  it('groups tax by rate', () => {
    const t = calculateTotals(base([item({ unitPrice: 1000, taxRate: 5 }), item({ unitPrice: 1000, taxRate: 5 }), item({ unitPrice: 1000, taxRate: 10 })]))
    expect(t.taxBreakdown).toEqual([{ rate: 5, amount: 100 }, { rate: 10, amount: 100 }])
  })
  it('is robust to NaN / negative inputs', () => {
    const t = calculateTotals(base([item({ quantity: NaN, unitPrice: 100 }), item({ quantity: 1, unitPrice: 100, taxRate: -5 })]))
    expect(t.subtotal).toBe(100)
    expect(t.tax).toBe(0)
  })
  it('handles an empty invoice', () => {
    expect(calculateTotals(base([])).grandTotal).toBe(0)
  })
  it('keeps totals exact across many lines', () => {
    const items = Array.from({ length: 1000 }, () => item({ quantity: 3, unitPrice: 33, taxRate: 7.5 }))
    const t = calculateTotals(base(items, { invoiceDiscount: { type: 'percent', value: 3 } }))
    const lineTax = t.lines.reduce((a, l) => a + l.tax, 0)
    expect(t.tax).toBe(lineTax)
    expect(t.lines.reduce((a, l) => a + l.invoiceDiscountShare, 0)).toBe(t.invoiceDiscount)
    expect(Number.isInteger(t.grandTotal)).toBe(true)
  })
})
