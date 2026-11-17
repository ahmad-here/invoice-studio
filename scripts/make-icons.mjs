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
await browser.close()
console.log('icons written')
