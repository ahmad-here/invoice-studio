import { test, expect } from '@playwright/test'
import { pdfPageCount, readDownload } from './helpers'
import JSZip from 'jszip'

const CSV = `invoice_number,invoice_date,due_date,customer_name,customer_email,item_name,quantity,unit_price,tax_rate,currency
INV-001,2026-11-01,2026-11-15,John Smith,john@example.com,Website Design,1,500,10,USD
INV-001,2026-11-01,2026-11-15,John Smith,john@example.com,Hosting,12,15,10,USD
INV-002,2026-11-01,2026-11-15,Jane Doe,jane@example.com,SEO Services,2,200,5,USD
INV-003,2026-13-01,2026-11-15,Bad Date,bad@example.com,Thing,1,10,0,USD
INV-004,2026-11-01,2026-11-15,Bad Qty,q@example.com,Thing,abc,10,0,USD
INV-005,2026-11-01,2026-11-15,Bad Cur,c@example.com,Thing,1,10,0,XYZ`

test('bulk CSV: validates, reports, and downloads ZIP + combined PDF', async ({ page }) => {
  test.setTimeout(180_000)
  await page.goto('/bulk')
  await page.getByLabel('Choose CSV or JSON file').setInputFiles({ name: 'invoices.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV) })
  await expect(page.getByText('Ready to generate', { exact: true }).locator('..')).toContainText('2')
  await expect(page.getByText('Failed invoices', { exact: true }).locator('..')).toContainText('3')
  await expect(page.getByText('Invalid issue date "2026-13-01"')).toBeVisible()
  await expect(page.getByText('Quantity "abc" is not a number.')).toBeVisible()
  await expect(page.getByText('Unsupported currency "XYZ".')).toBeVisible()

  const [rep] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Error report' }).click()])
  expect((await readDownload(rep)).toString()).toContain('row,invoice_number,field,severity,message')

  await page.getByRole('button', { name: 'Preview INV-001' }).click()
  await expect(page.getByRole('dialog')).toContainText('Hosting')
  await page.getByRole('button', { name: 'Close' }).click()

  const [zipDl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download ZIP' }).click()])
  expect(zipDl.suggestedFilename()).toMatch(/^Generated-Invoices-\d{4}-\d{2}-\d{2}\.zip$/)
  const zip = await JSZip.loadAsync(await readDownload(zipDl))
  expect(Object.keys(zip.files).sort()).toEqual(['Invoice-INV-001.pdf', 'Invoice-INV-002.pdf'])

  const [combo] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Combined PDF' }).click()])
  expect(pdfPageCount(await readDownload(combo))).toBe(2)

  // select a subset
  await page.getByLabel('Select INV-002').uncheck()
  await expect(page.getByText('1 of 2 selected')).toBeVisible()
  await page.getByRole('button', { name: 'Save to invoices' }).click()
  await page.goto('/invoices')
  await expect(page.getByText('John Smith')).toBeVisible()
})

test('bulk JSON: malformed then valid; hundreds of invoices stay responsive', async ({ page }) => {
  test.setTimeout(180_000)
  await page.goto('/bulk')
  await page.getByLabel('Choose CSV or JSON file').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"invoices": [') })
  await expect(page.getByText(/Malformed JSON/)).toBeVisible()
  await page.getByRole('button', { name: 'Start over' }).click()
  const invoices = Array.from({ length: 400 }, (_, i) => ({ invoiceNumber: `B-${i + 1}`, customer: { name: `Customer ${i + 1}` }, items: [{ name: 'Service', quantity: 1 + (i % 3), unitPrice: 99.99, taxRate: 5 }] }))
  await page.getByLabel('Choose CSV or JSON file').setInputFiles({ name: 'big.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ invoices })) })
  await expect(page.getByText('Ready to generate', { exact: true }).locator('..')).toContainText('400', { timeout: 20_000 })
  await expect(page.getByText('Page 1 of 8')).toBeVisible()
  // only 50 rows rendered at a time
  await expect(page.getByRole('button', { name: /^Preview B-/ })).toHaveCount(50)
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByText('51–100 of 400')).toBeVisible()
})

test('bulk mapping fixes aliased/unknown headers', async ({ page }) => {
  await page.goto('/bulk')
  const csv = 'Ref No,Client,Product,Qty,Price\nR1,Ann,Widget,2,5\n'
  await page.getByLabel('Choose CSV or JSON file').setInputFiles({ name: 'm.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) })
  await expect(page.getByText(/Required column\(s\) not mapped: Invoice number/)).toBeVisible()
  await page.getByLabel('Invoice number *').selectOption('Ref No')
  await page.getByRole('button', { name: 'Apply mapping & re-validate' }).click()
  await expect(page.getByText('Ready to generate', { exact: true }).locator('..')).toContainText('1')
})
