import { describe, expect, it } from 'vitest'
import { buildFromCsv, parseCsvText, parseJsonText, processFile, parseNum, errorReportCsv } from '@/services/bulk/parse'
import { detectMapping, SAMPLE_CSV, SAMPLE_JSON } from '@/services/bulk/fields'
import { defaultPreferences, emptyBusiness } from '@/lib/defaults'
import { calculateTotals } from '@/lib/calc'

const ctx = { prefs: defaultPreferences(), business: { ...emptyBusiness(), name: 'Saved Co' } }

describe('parseNum', () => {
  it('accepts common formats and rejects junk', () => {
    expect(parseNum('1,234.50')).toBe(1234.5)
    expect(parseNum(' 10% ')).toBe(10)
    expect(parseNum('.5')).toBe(0.5)
    expect(parseNum('12abc')).toBeNaN()
    expect(parseNum('')).toBeNaN()
  })
})

describe('CSV import', () => {
  it('parses the sample and groups line items by invoice number', () => {
    const { result } = processFile('s.csv', SAMPLE_CSV, ctx)
    expect(result.invoices.map((i) => i.number)).toEqual(['INV-001', 'INV-002', 'INV-003'])
    expect(result.invoices[0].items).toHaveLength(2)
    expect(result.invoices[0].customFields[0]).toMatchObject({ label: 'Project', value: 'Website relaunch' })
    expect(result.invoices[2].currency).toBe('EUR')
    expect(result.failed).toHaveLength(0)
    const t = calculateTotals(result.invoices[0])
    // 500 + 12*15*0.9 = 662 ; tax 10% = 66.2 => 728.20
    expect(t.grandTotal).toBe(72820)
  })
  it('auto-maps aliased headers', () => {
    const m = detectMapping(['Invoice No', 'Client', 'Product', 'Qty', 'Price'])
    expect(m).toMatchObject({ invoice_number: 'Invoice No', customer_name: 'Client', item_name: 'Product', quantity: 'Qty', unit_price: 'Price' })
  })
  it('reports row-level errors and still generates valid invoices', () => {
    const csv = `invoice_number,invoice_date,customer_name,item_name,quantity,unit_price,currency
A1,2026-02-30,Ann,Thing,1,10,USD
A2,2026-01-01,Bob,Thing,abc,10,USD
A3,2026-01-01,Cy,Thing,1,10,XYZ
A4,2026-01-01,Di,Thing,2,5,USD
,2026-01-01,Ed,Thing,1,1,USD`
    const { result } = processFile('x.csv', csv, ctx)
    expect(result.invoices.map((i) => i.number)).toEqual(['A4'])
    expect(result.failed.map((f) => f.invoiceNumber)).toEqual(['A1', 'A2', 'A3'])
    const msgs = result.issues.map((i) => `${i.row}:${i.field}`)
    expect(msgs).toEqual(expect.arrayContaining(['2:invoice_date', '3:quantity', '4:currency', '6:invoice_number']))
    expect(errorReportCsv(result.issues)).toContain('row,invoice_number,field,severity,message')
  })
  it('flags inconsistent customers sharing an invoice number', () => {
    const csv = `invoice_number,customer_name,item_name,quantity,unit_price
B1,Ann,X,1,1
B1,Zed,Y,1,1`
    const { result } = processFile('x.csv', csv, ctx)
    expect(result.failed[0].invoiceNumber).toBe('B1')
    expect(result.issues.some((i) => i.field === 'customer_name' && i.severity === 'error')).toBe(true)
  })
  it('reports unmapped required columns', () => {
    const t = parseCsvText('foo,bar\n1,2')
    const r = buildFromCsv(t, detectMapping(t.headers), ctx)
    expect(r.issues[0].message).toMatch(/Required column/)
  })
  it('handles malformed CSV without throwing', () => {
    const { result } = processFile('x.csv', 'invoice_number,customer_name,item_name,quantity,unit_price\n"A1,Ann,X,1,1', ctx)
    expect(result.issues.length).toBeGreaterThan(0)
  })
  it('falls back to saved business profile', () => {
    const { result } = processFile('x.csv', 'invoice_number,customer_name,item_name,quantity,unit_price\nC1,Ann,X,1,1', ctx)
    expect(result.invoices[0].business.name).toBe('Saved Co')
  })
  it('processes hundreds of invoices quickly', () => {
    const rows = Array.from({ length: 600 }, (_, i) => `N${i},Cust ${i},Item,${(i % 5) + 1},${(i * 1.37).toFixed(2)},7.5`)
    const csv = 'invoice_number,customer_name,item_name,quantity,unit_price,tax_rate\n' + rows.join('\n')
    const t0 = performance.now()
    const { result } = processFile('big.csv', csv, ctx)
    expect(result.invoices).toHaveLength(600)
    expect(performance.now() - t0).toBeLessThan(2000)
  })
})

describe('JSON import', () => {
  it('parses the sample', () => {
    const r = parseJsonText(SAMPLE_JSON, ctx)
    expect(r.invoices).toHaveLength(2)
    expect(r.invoices[0].items[1].discount).toEqual({ type: 'percent', value: 10 })
    expect(r.invoices[1].amountPaid).toBe(10000)
  })
  it('rejects malformed JSON with a message', () => {
    const r = parseJsonText('{"invoices": [', ctx)
    expect(r.issues[0].message).toMatch(/Malformed JSON/)
  })
  it('detects duplicates and invalid records but keeps valid ones', () => {
    const r = parseJsonText(JSON.stringify({ invoices: [
      { invoiceNumber: 'J1', customer: { name: 'A' }, items: [{ name: 'x', quantity: 1, unitPrice: 5 }] },
      { invoiceNumber: 'J1', customer: { name: 'B' }, items: [{ name: 'x', quantity: 1, unitPrice: 5 }] },
      { invoiceNumber: 'J2', customer: { name: 'C' }, items: [] },
      { invoiceNumber: 'J3', customer: { name: 'D' }, items: [{ name: 'x', quantity: -1, unitPrice: 5 }] },
      'garbage',
    ] }), ctx)
    expect(r.invoices.map((i) => i.number)).toEqual(['J1'])
    expect(r.failed.map((f) => f.invoiceNumber)).toEqual(['J1', 'J2', 'J3'])
    expect(r.issues.some((i) => /not an object/.test(i.message))).toBe(true)
  })
  it('never interprets HTML in imported text', () => {
    const r = parseJsonText(JSON.stringify([{ invoiceNumber: 'H1', customer: { name: '<img src=x onerror=alert(1)>' }, items: [{ name: 'x', quantity: 1, unitPrice: 1 }] }]), ctx)
    expect(r.invoices[0].customer.name).toBe('<img src=x onerror=alert(1)>') // stored as plain text; React escapes it
  })
})
