// Preview stills: node marketing/reels/snap.mjs reel1-word 1 6 12 15 19
import { chromium } from '@playwright/test'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'
const [name, ...ts] = process.argv.slice(2)
const DIR = resolve('marketing/reels')
const b = await chromium.launch()
const page = await b.newPage({ viewport: { width: 1080, height: 1920 } })
await page.goto(pathToFileURL(join(DIR, `${name}.html`)).href)
await page.evaluate(() => document.fonts.ready)
for (const t of ts) { await page.evaluate((x) => window.renderFrame(x), Number(t)); await page.screenshot({ path: join(DIR, 'out', `snap-${name}-${t}.png`), scale: 'css' }) }
await b.close()
