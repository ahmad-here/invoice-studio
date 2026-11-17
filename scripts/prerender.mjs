// Prerenders public/SEO routes to static HTML (dist/<route>/index.html) and writes sitemap.xml + robots.txt.
// Runs after `vite build`. App routes (create, edit, settings…) stay client-rendered via SPA fallback.
import { chromium } from '@playwright/test'
import { preview } from 'vite'
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SITE_URL = (process.env.VITE_SITE_URL || 'https://invoicestudio.app').replace(/\/$/, '')
import { readFileSync } from 'node:fs'
const PUBLIC = JSON.parse(readFileSync('src/app/public-routes.json', 'utf8'))
const ROUTES = PUBLIC.prerender
const SITEMAP = [...ROUTES, ...PUBLIC.sitemapOnly]

// Keep the untouched SPA shell for app routes (/create, /edit/*, /invoices, /settings) and offline fallback
copyFileSync('dist/index.html', 'dist/app.html')

const server = await preview({ preview: { port: 0 }, logLevel: 'silent' })
const base = server.resolvedUrls.local[0].replace(/\/$/, '')
const browser = await chromium.launch()
try {
const ctx = await browser.newContext({ serviceWorkers: 'block' })
await ctx.addInitScript(() => { try { localStorage.setItem('invoice-studio:tour-done', '1') } catch { /* ignore */ } })
const page = await ctx.newPage()
for (const route of ROUTES) {
  await page.goto(`${base}${route}`, { waitUntil: 'networkidle' })
  await page.waitForSelector('main h1', { timeout: 15000 })
  // Drop off-screen measuring layers and other runtime-only nodes from the static snapshot
  const html = '<!doctype html>\n' + (await page.evaluate(() => {
    document.querySelectorAll('[aria-live], #print-root').forEach((n) => n.remove())
    return document.documentElement.outerHTML
  }))
  const dir = route === '/' ? 'dist' : join('dist', route)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), html)
  console.log('prerendered', route)
}
} finally {
  await browser.close()
  await new Promise((r) => server.httpServer.close(r))
}

const today = new Date().toISOString().slice(0, 10)
writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${SITEMAP.map((r) => `  <url><loc>${SITE_URL}${r === '/' ? '/' : r}</loc><lastmod>${today}</lastmod><priority>${r === '/' ? '1.0' : '0.8'}</priority></url>`).join('\n')}
</urlset>
`)
writeFileSync('dist/robots.txt', `User-agent: *
Allow: /
${PUBLIC.disallow.map((p) => `Disallow: ${p}`).join('\n')}

Sitemap: ${SITE_URL}/sitemap.xml
`)
console.log('sitemap.xml + robots.txt written for', SITE_URL)
