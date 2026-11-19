import { test, expect } from '@playwright/test'
import { expectNoHorizontalOverflow } from './helpers'

// "?app=1" forces the native-app shell (what the Android APK and installed PWA show)
test.describe('app mode (Android / installed)', () => {
  test('home is an app dashboard, not the website', async ({ page }) => {
    await page.goto('/?app=1')
    await expect(page.locator('html')).toHaveClass(/app-mode/)
    await expect(page.getByText('Outstanding')).toBeVisible()
    await expect(page.getByRole('contentinfo')).toHaveCount(0) // no website footer
    await expect(page.getByRole('link', { name: 'Get the app' })).toHaveCount(0)
    const tabs = page.getByRole('navigation', { name: 'Main' })
    await expect(tabs.getByRole('link', { name: 'Create invoice' })).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('tab navigation, app bar title and back arrow', async ({ page }) => {
    await page.goto('/?app=1')
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Invoices' }).click()
    await expect(page.getByRole('banner').getByRole('heading', { name: 'Invoices' })).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Unpaid' })).toBeVisible()
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Create invoice' }).click()
    await expect(page.getByRole('banner').getByRole('heading', { name: 'New invoice' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0) // focused editor hides tabs
    await expect(page.getByRole('button', { name: 'Download PDF' })).toBeVisible() // actions in app bar
    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page.getByRole('banner').getByRole('heading', { name: 'Invoices' })).toBeVisible()
  })

  test('editor saves from the bottom action bar and settings has help links', async ({ page }) => {
    await page.goto('/create?app=1')
    await page.getByRole('tab', { name: 'From & To' }).click()
    await page.getByLabel('Customer name').fill('App Customer')
    await page.getByRole('tab', { name: 'Items' }).click()
    await page.getByTestId('item-row').first().getByLabel('Item name').fill('Consulting')
    await page.getByTestId('item-row').first().getByLabel('Unit price').fill('99')
    await page.getByRole('button', { name: 'Save invoice' }).click()
    await expect(page.getByRole('heading', { name: 'Invoice INV-0001 saved' })).toBeVisible()
    await page.goto('/settings?app=1')
    await expect(page.getByRole('link', { name: 'Privacy policy' })).toBeVisible()
  })
})
