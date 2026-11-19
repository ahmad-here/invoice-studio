// Renders public/favicon.svg into PNG app icons (PWA + Android) using Playwright's Chromium.
import { chromium } from '@playwright/test'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
const svg = readFileSync('public/favicon.svg', 'utf8')
const browser = await chromium.launch()
const page = await browser.newPage()
async function render(size, out, padding = 0, bg = 'transparent') {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<html><body style="margin:0;background:${bg};display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px">${svg.replace('<svg', `<svg width="${size - padding * 2}" height="${size - padding * 2}"`)}</body></html>`)
  writeFileSync(out, await page.screenshot({ omitBackground: bg === 'transparent' }))
}
await render(192, 'public/icon-192.png')
await render(512, 'public/icon-512.png')
mkdirSync('resources', { recursive: true })
await render(1024, 'resources/icon.png')
await render(1024, 'resources/icon-foreground.png', 180)
// Social share card
await page.setViewportSize({ width: 1200, height: 630 })
await page.setContent(`<html><body style="margin:0;width:1200px;height:630px;font-family:Segoe UI,Inter,Arial,sans-serif;background:linear-gradient(135deg,#0692F4,#065d9b);color:#fff;display:flex;align-items:center;padding:0 90px;box-sizing:border-box">
<div style="flex:1"><div style="display:flex;align-items:center;gap:18px">${svg.replace('<svg', '<svg width="84" height="84"')}<span style="font-size:40px;font-weight:700">Invoice Studio</span></div>
<h1 style="font-size:64px;line-height:1.08;margin:36px 0 18px;font-weight:800">Free Invoice Generator</h1>
<p style="font-size:30px;margin:0;opacity:.92">Create, print &amp; bulk-generate PDF invoices.<br/>No sign-up · Works offline · 21 templates</p></div></body></html>`)
writeFileSync('public/og-image.png', await page.screenshot())
await browser.close()
console.log('icons written')
