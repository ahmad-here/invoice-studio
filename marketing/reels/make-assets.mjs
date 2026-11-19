// Renders real invoice templates (first page) as PNG product shots for the reels.
import { chromium } from '@playwright/test'
import { preview } from 'vite'
const ids = ['classic','minimal','corporate','executive','creative','elegant','compact','service','retail','highlight','modern','construction','timesheet','proforma','taxinvoice','commercial','creditnote','receipt','medical','hotel','homeservice']
const server = await preview({ preview: { port: 0 }, logLevel: 'silent' })
const base = server.resolvedUrls.local[0].replace(/\/$/, '')
const browser = await chromium.launch()
try {
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 1500 }, deviceScaleFactor: 1.5, serviceWorkers: 'block' })
  await ctx.addInitScript(() => localStorage.setItem('invoice-studio:tour-done', '1'))
  const p = await ctx.newPage()
  for (const id of ids) {
    await p.goto(`${base}/templates?t=${id}`); await p.waitForTimeout(800)
    await p.locator('[role="dialog"] .invoice-pages .invoice-page').first().screenshot({ path: `marketing/reels/assets/tpl-${id}.png` })
  }
} finally { await browser.close(); await new Promise((r) => server.httpServer.close(r)) }
console.log('assets done')
