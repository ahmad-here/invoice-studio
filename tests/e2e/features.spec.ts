import { test, expect } from '@playwright/test'

test('multiple business profiles: add, set default, pick in editor', async ({ page }) => {
  await page.goto('/settings')
  await page.getByLabel('Business name').fill('Alpha Consulting')
  await page.getByLabel('Email').first().fill('hello@alpha.test')
  await page.getByRole('button', { name: 'Add business' }).last().click()
  await expect(page.getByText('“Alpha Consulting” saved.')).toBeVisible()

  await page.getByRole('button', { name: 'Add business' }).first().click()
  await page.getByLabel('Business name').fill('Beta Design Studio')
  await page.getByRole('button', { name: 'Add business' }).last().click()
  await expect(page.getByRole('list', { name: 'Business profiles' }).getByRole('listitem')).toHaveCount(2)

  // first one is default; make Beta default
  await page.getByRole('button', { name: 'Make default' }).click()
  await expect(page.getByText('“Beta Design Studio” is now the default.')).toBeVisible()

  await page.goto('/create')
  await page.getByRole('tab', { name: 'From & To' }).click()
  await expect(page.getByLabel('Business name')).toHaveValue('Beta Design Studio')
  await page.getByLabel('Business profile').selectOption({ label: 'Alpha Consulting' })
  await expect(page.getByLabel('Business name')).toHaveValue('Alpha Consulting')
  await expect(page.getByLabel('Invoice preview')).toContainText('hello@alpha.test')

  // delete with confirmation
  await page.goto('/settings')
  await page.getByRole('button', { name: 'Delete Alpha Consulting' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByRole('list', { name: 'Business profiles' }).getByRole('listitem')).toHaveCount(1)
})

test('product tour can be replayed, navigated and skipped', async ({ page }) => {
  await page.goto('/support')
  await page.getByRole('button', { name: /Replay the product tour/ }).click()
  await expect(page).toHaveURL(/\/$/)
  const dialog = page.getByRole('dialog', { name: 'Welcome to Invoice Studio' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Start tour' }).click()
  await expect(page.getByRole('dialog', { name: 'Create an invoice' })).toBeVisible()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('dialog', { name: '11 professional templates' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('invoice-studio:tour-done'))).toBe('1')
})

for (const [path, heading] of [
  ['/features', 'Everything you need to invoice professionally'],
  ['/how-to-use', 'How to create an invoice'],
  ['/faq', 'Frequently asked questions'],
  ['/support', 'How can we help?'],
  ['/contact', 'Get in touch'],
  ['/privacy', 'Privacy policy'],
  ['/download', 'Get the app'],
] as const) {
  test(`content page ${path} renders with SEO metadata`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    await expect(page).toHaveTitle(/Invoice Studio/)
    expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toMatch(new RegExp(`${path}$`))
    expect((await page.locator('meta[name="description"]').getAttribute('content'))!.length).toBeGreaterThan(50)
    await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Privacy policy' })).toBeVisible()
  })
}

test('download page offers the published APK and it is a real Android package', async ({ page, request }) => {
  await page.goto('/download')
  const link = page.getByRole('link', { name: 'Download APK' })
  await expect(link).toBeVisible()
  const href = await link.getAttribute('href')
  const res = await request.get(href!)
  expect(res.ok()).toBe(true)
  const body = await res.body()
  expect(body.length).toBeGreaterThan(1_000_000)
  expect(body.subarray(0, 2).toString()).toBe('PK') // APK = zip container
})

test('contact form validates and opens mail client', async ({ page }) => {
  await page.goto('/contact')
  await page.getByRole('button', { name: 'Open in email app' }).click()
  await expect(page.getByText(/at least 10 characters/)).toBeVisible()
})

test('sitemap and robots are served; legacy hash links redirect', async ({ page, request }) => {
  const sm = await request.get('/sitemap.xml')
  expect(await sm.text()).toContain('/faq</loc>')
  expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap:')
  await page.goto('/#/templates')
  await expect(page).toHaveURL(/\/templates$/)
})

test('clients: add, pick on a new invoice, and save from the editor', async ({ page }) => {
  await page.goto('/clients')
  await page.getByRole('button', { name: 'Add your first client' }).click()
  const d = page.getByRole('dialog')
  await d.getByLabel('Contact name').fill('Maria Lopez')
  await d.getByLabel('Company').fill('Lopez Design')
  await d.getByLabel('Email').fill('maria@lopez.test')
  await d.getByRole('button', { name: 'Save client' }).click()
  await expect(page.getByText('Maria Lopez', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'New invoice for Maria Lopez' }).click()
  await page.getByRole('tab', { name: 'From & To' }).click()
  await expect(page.getByLabel('Customer name')).toHaveValue('Maria Lopez')
  await expect(page.getByLabel('Invoice preview')).toContainText('maria@lopez.test')
  // switch to another saved client via the picker after saving a second one from the editor
  await page.getByLabel('Customer name').fill('Tom Reed')
  await page.getByLabel(/^Email/).first().fill('tom@reed.test')
  await page.getByRole('button', { name: 'Save as client' }).click()
  await expect(page.getByText(/Saved “Tom Reed” to clients/)).toBeVisible()
  await page.getByLabel('Saved client').selectOption({ label: 'Maria Lopez — Lopez Design' })
  await expect(page.getByLabel('Customer name')).toHaveValue('Maria Lopez')
})

test('after saving, a next-steps panel offers download, share, print, new invoice', async ({ page }) => {
  await page.goto('/create')
  await page.getByRole('tab', { name: 'From & To' }).click()
  await page.getByLabel('Customer name').fill('Next Step Co')
  await page.getByRole('tab', { name: 'Items' }).click()
  await page.getByTestId('item-row').first().getByLabel('Item name').fill('Audit')
  await page.getByTestId('item-row').first().getByLabel('Unit price').fill('300')
  await expect(page.getByRole('tab', { name: /Items/ }).getByLabel('completed')).toBeVisible()
  await page.getByRole('button', { name: 'Save invoice' }).first().click()
  const d = page.getByRole('dialog', { name: /saved/ })
  await expect(d).toBeVisible()
  for (const b of ['Download PDF', 'Share / email', 'Print', 'All invoices', 'Create another invoice']) await expect(d.getByRole('button', { name: b })).toBeVisible()
  await d.getByRole('button', { name: 'Create another invoice' }).click()
  await expect(page.getByLabel('Invoice number')).toHaveValue('INV-0002')
})

test('preview zoom and fit controls', async ({ page }) => {
  await page.goto('/create')
  const zoom = page.getByLabel('Zoom')
  await zoom.fill('150')
  await expect(page.getByText('150%')).toBeVisible()
  await page.getByRole('button', { name: 'Fit to width' }).click()
  await expect(page.getByText('100%')).toBeVisible()
})

test('404 page and terms page exist with proper SEO', async ({ page }) => {
  await page.goto('/no-such-page')
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  expect(await page.locator('meta[name="robots"]').getAttribute('content')).toContain('noindex')
  await page.getByRole('link', { name: 'Create invoice' }).last().click()
  await expect(page).toHaveURL(/\/create/)
  await page.goto('/terms')
  await expect(page.getByRole('heading', { level: 1, name: 'Terms of service' })).toBeVisible()
  const ld = await page.locator('#route-jsonld').textContent()
  expect(ld).toContain('BreadcrumbList')
  expect(await page.locator('meta[property="og:image"]').getAttribute('content')).toMatch(/og-image\.png$/)
})
