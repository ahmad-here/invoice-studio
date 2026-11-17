import { expect, type Download, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

export async function readDownload(d: Download): Promise<Buffer> {
  const p = await d.path()
  return readFileSync(p!)
}
/** Count pages in a jsPDF output. */
export const pdfPageCount = (buf: Buffer) => (buf.toString('latin1').match(/\/Type \/Page\b/g) ?? []).length

export async function fillBasicInvoice(page: Page, opts: { customer?: string; items?: { name: string; qty: string; price: string }[] } = {}) {
  await page.getByRole('tab', { name: 'From & To' }).click()
  await page.getByLabel('Customer name').fill(opts.customer ?? 'Acme Corporation')
  await page.getByLabel('Business name').fill('Studio North Ltd')
  await page.getByRole('tab', { name: 'Items' }).click()
  const items = opts.items ?? [{ name: 'Website design', qty: '2', price: '1250.50' }]
  for (let i = 0; i < items.length; i++) {
    if (i > 0) await page.getByRole('button', { name: 'Add item', exact: true }).click()
    const row = page.getByTestId('item-row').nth(i)
    await row.getByLabel('Item name').fill(items[i].name)
    await row.getByLabel('Qty').fill(items[i].qty)
    await row.getByLabel('Unit price').fill(items[i].price)
  }
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow, 'page should not scroll horizontally').toBeLessThanOrEqual(1)
}
