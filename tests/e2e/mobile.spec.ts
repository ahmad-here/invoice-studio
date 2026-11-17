import { test, expect } from '@playwright/test'
import { expectNoHorizontalOverflow } from './helpers'

for (const route of ['/', '/#/create', '/#/templates', '/#/bulk', '/#/invoices', '/#/settings']) {
  test(`mobile layout has no horizontal overflow: ${route}`, async ({ page }) => {
    await page.goto(route)
    await page.waitForLoadState('networkidle')
    await expectNoHorizontalOverflow(page)
    await expect(page.getByRole('navigation', { name: 'Main' }).last()).toBeVisible()
  })
}

test('mobile editor toggles between edit and preview', async ({ page }) => {
  await page.goto('/#/create')
  await page.getByRole('tab', { name: 'From & To' }).click()
  await page.getByLabel('Customer name').fill('Phone Customer')
  await page.getByRole('radio', { name: 'Preview' }).click()
  await expect(page.getByLabel('Invoice preview')).toBeVisible()
  await expect(page.getByLabel('Invoice preview')).toContainText('Phone Customer')
  await expectNoHorizontalOverflow(page)
  await page.getByRole('radio', { name: 'Edit' }).click()
  await expect(page.getByLabel('Customer name')).toBeVisible()
})

test('PWA manifest and service worker are served', async ({ page, request }) => {
  const res = await request.get('/manifest.webmanifest')
  expect(res.ok()).toBe(true)
  const m = await res.json()
  expect(m.display).toBe('standalone')
  expect(m.icons.length).toBeGreaterThanOrEqual(2)
  await page.goto('/')
  await expect.poll(() => page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())), { timeout: 15_000 }).toBe(true)
})
