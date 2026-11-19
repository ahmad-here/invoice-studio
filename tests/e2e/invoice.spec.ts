import { test, expect } from '@playwright/test'
import { fillBasicInvoice, pdfPageCount, readDownload } from './helpers'

test.describe('invoice studio', () => {
  test('dashboard shows empty state and CTAs', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: /Free invoice generator/ })).toBeVisible()
    await expect(page.getByText('No invoices yet')).toBeVisible()
    await page.getByRole('button', { name: 'Create invoice' }).first().click()
    await expect(page).toHaveURL(/\/create/)
  })

  test('create, calculate, save, reopen and persist an invoice', async ({ page }) => {
    await page.goto('/create')
    await expect(page.getByLabel('Invoice number')).toHaveValue('INV-0001')
    await fillBasicInvoice(page, { items: [{ name: 'Website design', qty: '2', price: '1250.50' }, { name: 'Hosting', qty: '12', price: '15' }] })
    // per-item 10% tax on item 1
    const row = page.getByTestId('item-row').first()
    await row.getByRole('button', { name: /Description, SKU/ }).click()
    await row.getByLabel('Tax %').fill('10')
    // 2*1250.50 = 2501.00, + 180 = 2681.00 ; tax 250.10 => 2931.10
    await expect(page.getByText('Grand total').locator('..')).toContainText('$2,931.10')
    const preview = page.getByLabel('Invoice preview')
    await expect(preview).toContainText('Acme Corporation')
    await expect(preview).toContainText('$2,931.10')

    await page.getByRole('button', { name: 'Save invoice' }).first().click()
    await expect(page.getByText('Invoice INV-0001 saved.')).toBeVisible()
    await expect(page).toHaveURL(/\/edit\//)

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Edit INV-0001' })).toBeVisible()
    await page.goto('/invoices')
    await expect(page.getByText('Acme Corporation')).toBeVisible()
    await expect(page.getByText('$2,931.10')).toBeVisible()

    // next invoice number advances
    await page.goto('/create')
    await expect(page.getByLabel('Invoice number')).toHaveValue('INV-0002')
  })

  test('validation blocks saving incomplete invoices and duplicate numbers', async ({ page }) => {
    await page.goto('/create')
    await page.getByRole('button', { name: 'Save invoice' }).first().click()
    await expect(page.getByRole('alert').filter({ hasText: 'Please fix' })).toContainText('Add a customer name')
  })

  test('autosaves unsaved work and restores it after reload', async ({ page }) => {
    await page.goto('/create')
    await page.getByRole('tab', { name: 'From & To' }).click()
    await page.getByLabel('Customer name').fill('Draft Customer')
    await page.waitForTimeout(2000)
    await page.reload()
    await expect(page.getByText('We restored your unsaved changes')).toBeVisible()
    await page.getByRole('tab', { name: 'From & To' }).click()
    await expect(page.getByLabel('Customer name')).toHaveValue('Draft Customer')
  })

  test('drafts stay separate when switching between a saved invoice and a new one', async ({ page }) => {
    await page.goto('/create')
    await fillBasicInvoice(page, { customer: 'Saved Customer' })
    await page.getByRole('button', { name: 'Save invoice' }).first().click()
    await expect(page).toHaveURL(/\/edit\//)
    await page.getByRole('button', { name: 'Keep editing' }).click()
    await page.getByRole('tab', { name: 'From & To' }).click()
    await page.getByLabel('Customer name').fill('Edited But Unsaved')
    await page.getByRole('navigation', { name: 'Main' }).first().getByRole('link', { name: 'Create' }).click()
    await expect(page.getByLabel('Invoice number')).toHaveValue('INV-0002')
    await page.getByRole('tab', { name: 'From & To' }).click()
    await expect(page.getByLabel('Customer name')).toHaveValue('')
    await page.goBack()
    await expect(page.getByText('We restored your unsaved changes')).toBeVisible()
    await page.getByRole('tab', { name: 'From & To' }).click()
    await expect(page.getByLabel('Customer name')).toHaveValue('Edited But Unsaved')
  })

  test('very long unbroken values never overflow the page', async ({ page }) => {
    await page.goto('/create')
    await fillBasicInvoice(page)
    await page.getByRole('tab', { name: 'Details' }).click()
    await page.getByLabel('PO number').fill('PO-' + 'X'.repeat(56))
    await page.getByLabel('Document title').fill('W'.repeat(40))
    await page.getByRole('tab', { name: 'From & To' }).click()
    await page.getByRole('textbox', { name: 'Address', exact: true }).fill('https://example.com/' + 'a'.repeat(120))
    const pv = page.getByLabel('Invoice preview')
    await expect(pv).toContainText('PO-XXXX')
    const overflow = await pv.locator('.invoice-pages .invoice-page').first().evaluate((pg) => {
      const r = pg.getBoundingClientRect()
      return [...pg.querySelectorAll('*')].filter((el) => getComputedStyle(el).position !== 'absolute').some((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.right > r.right + 1 })
    })
    expect(overflow).toBe(false)
  })

  test('Next scrolls to the next section and sections slide in the right direction', async ({ page }) => {
    await page.goto('/create')
    await page.getByRole('tab', { name: 'Extras' }).click()
    const next = page.getByRole('button', { name: /^Next:/ })
    await next.scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(200)
    await next.click()
    await expect(page.getByRole('heading', { name: 'Template & layout' })).toBeInViewport()
    // Back slides the previous section in from the left
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await expect(page.getByRole('tabpanel')).toHaveClass(/tab-slide-left/)
    await page.getByRole('button', { name: /^Next:/ }).click()
    await expect(page.getByRole('tabpanel')).toHaveClass(/tab-slide-right/)
  })

  test('custom fields and sections render in preview', async ({ page }) => {
    await page.goto('/create')
    await page.getByRole('tab', { name: 'Extras' }).click()
    await page.getByRole('button', { name: 'Add custom field' }).click()
    await page.getByLabel('Label').first().fill('Project name')
    await page.getByLabel('Value').first().fill('Apollo Relaunch')
    await page.getByRole('button', { name: 'Add section' }).click()
    await expect(page.getByLabel('Invoice preview')).toContainText('Apollo Relaunch')
    // hide it
    await page.getByRole('button', { name: 'Visible' }).first().click()
    await expect(page.getByLabel('Invoice preview')).not.toContainText('Apollo Relaunch')
  })

  test('logo upload (SVG is rasterised) and positioning', async ({ page }) => {
    await page.goto('/create')
    await page.getByRole('tab', { name: 'From & To' }).click()
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><rect width="200" height="80" fill="#0692F4"/><script>alert(1)</script></svg>'
    await page.getByLabel('Upload logo').setInputFiles({ name: 'logo.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(svg) })
    await expect(page.getByAltText('Logo preview')).toBeVisible()
    const src = await page.getByAltText('Logo preview').getAttribute('src')
    expect(src).toMatch(/^data:image\/png;base64,/)
    await page.getByRole('radio', { name: 'Right' }).click()
    await expect(page.getByLabel('Invoice preview').locator('.invoice-pages img').first()).toBeVisible()
    // invalid type rejected
    await page.getByRole('button', { name: 'Replace' }).click()
    await page.getByLabel('Upload logo').setInputFiles({ name: 'x.gif', mimeType: 'image/gif', buffer: Buffer.from('GIF89a') })
    await expect(page.getByText('Please upload a PNG, JPG, SVG or WebP image.')).toBeVisible()
  })

  test('downloads a real PDF and supports multi-page invoices', async ({ page }) => {
    await page.goto('/create')
    const items = Array.from({ length: 45 }, (_, i) => ({ name: `Line item ${i + 1} with a reasonably long description to wrap`, qty: '1', price: '10' }))
    await page.getByRole('tab', { name: 'From & To' }).click()
    await page.getByLabel('Customer name').fill('Multi Page Customer')
    await page.getByRole('tab', { name: 'Items' }).click()
    // fast path: add items through UI for the first few, rest via repeated add
    for (let i = 0; i < items.length; i++) {
      if (i > 0) await page.getByRole('button', { name: 'Add item', exact: true }).click()
      const row = page.getByTestId('item-row').nth(i)
      await row.getByLabel('Item name').fill(items[i].name)
      await row.getByLabel('Unit price').fill(items[i].price)
    }
    await expect(page.getByLabel('Invoice preview').locator('.invoice-page')).toHaveCount(2, { timeout: 10_000 }).catch(async () => {
      expect(await page.getByLabel('Invoice preview').locator('.invoice-page').count()).toBeGreaterThan(1)
    })
    await expect(page.getByLabel('Invoice preview')).toContainText('Page 1 of')
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download PDF', exact: true }).click()])
    expect(dl.suggestedFilename()).toBe('Invoice-INV-0001.pdf')
    const buf = await readDownload(dl)
    expect(buf.subarray(0, 5).toString()).toBe('%PDF-')
    expect(pdfPageCount(buf)).toBeGreaterThan(1)
  })

  test('every template renders and exports to PDF', async ({ page }) => {
    test.setTimeout(240_000)
    await page.goto('/create')
    await fillBasicInvoice(page)
    await page.getByRole('tab', { name: 'Design' }).click()
    const names = ['Classic Professional', 'Modern Minimal', 'Corporate Blue', 'Executive', 'Creative Studio', 'Elegant Dark Accent', 'Compact Invoice', 'Service Invoice', 'Retail Invoice', 'Highlight', 'Modern Business']
    for (const name of names) {
      await page.getByRole('button', { name, exact: false }).filter({ hasText: name }).first().click()
      await expect(page.getByText(new RegExp(`· ${name} ·`))).toBeVisible()
      const pv = page.getByLabel('Invoice preview')
      await expect(pv).toContainText('Acme Corporation')
      await expect(pv).toContainText('$2,501.00')
      // no element in the preview may overflow the page horizontally
      const overflow = await pv.locator('.invoice-pages .invoice-page').first().evaluate((pg) => {
        const r = pg.getBoundingClientRect()
        return [...pg.querySelectorAll('*')].some((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && (b.right > r.right + 1 || b.left < r.left - 1) && getComputedStyle(el).position !== 'absolute' })
      })
      expect(overflow, `${name} has horizontally overflowing content`).toBe(false)
      const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download PDF', exact: true }).click()])
      const buf = await readDownload(dl)
      expect(buf.subarray(0, 5).toString(), name).toBe('%PDF-')
      expect(buf.length, name).toBeGreaterThan(15_000)
    }
  })

  test('print renders only the invoice pages', async ({ page }) => {
    await page.goto('/create')
    await fillBasicInvoice(page)
    await page.evaluate(() => { (window as unknown as { __printed: number }).__printed = 0; window.print = () => { (window as unknown as { __printed: number }).__printed++ } })
    await page.getByRole('button', { name: 'Print', exact: true }).click()
    await expect.poll(() => page.evaluate(() => (window as unknown as { __printed: number }).__printed)).toBe(1)
    await expect(page.locator('#print-root .invoice-page')).toHaveCount(1)
    await page.emulateMedia({ media: 'print' })
    await expect(page.locator('#root')).toBeHidden()
    await expect(page.locator('#print-root .invoice-page')).toBeVisible()
    const style = await page.locator('#print-page-style').textContent()
    expect(style).toContain('210mm 297mm')
  })

  test('templates gallery preview and use', async ({ page }) => {
    await page.goto('/templates')
    await page.getByRole('button', { name: 'Preview Executive' }).click()
    await expect(page.getByRole('dialog')).toContainText('Executive')
    await page.getByRole('button', { name: 'Use this template' }).click()
    await expect(page).toHaveURL(/create\?template=executive/)
    await expect(page.getByText(/· Executive ·/)).toBeVisible()
  })

  test('backup export/import round trip and settings defaults', async ({ page }) => {
    await page.goto('/settings')
    await page.getByLabel('Business name').fill('Default Biz Co')
    await page.getByRole('button', { name: 'Add business' }).last().click()
    await expect(page.getByText('“Default Biz Co” saved.')).toBeVisible()
    await page.getByLabel('Number prefix').fill('ACME-')
    await page.getByRole('button', { name: 'Save defaults' }).click()
    await expect(page.getByText(/Settings saved/)).toBeVisible()
    await page.goto('/create')
    await expect(page.getByLabel('Invoice number')).toHaveValue('ACME-0001')
    await page.getByRole('tab', { name: 'From & To' }).click()
    await expect(page.getByLabel('Business name')).toHaveValue('Default Biz Co')
    await page.goto('/settings')
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export backup (JSON)' }).click()])
    const json = JSON.parse((await readDownload(dl)).toString())
    expect(json.app).toBe('invoice-studio')
    await page.getByLabel('Import backup file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{oops') })
    await expect(page.getByText('The file is not valid JSON.')).toBeVisible()
  })
})
