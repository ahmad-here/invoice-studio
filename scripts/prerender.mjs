// Prerenders public/SEO routes to static HTML (dist/<route>/index.html) and writes sitemap.xml + robots.txt.
// Runs after `vite build`. App routes (create, edit, settings…) stay client-rendered via SPA fallback.
import { chromium } from '@playwright/test'
import { preview } from 'vite'
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'

const SITE_URL = (process.env.VITE_SITE_URL || 'https://invoicestudio.app').replace(/\/$/, '')
import { readFileSync } from 'node:fs'
const PUBLIC = JSON.parse(readFileSync('src/app/public-routes.json', 'utf8'))
const ROUTES = PUBLIC.prerender
const SITEMAP = [...ROUTES, ...PUBLIC.sitemapOnly]

// Keep the untouched SPA shell for app routes (/create, /edit/*, /invoices, /settings) and offline fallback
copyFileSync('dist/index.html', 'dist/app.html')

// CI/deploy hosts often have no Playwright browser: install it once, and if that is impossible
// fall back to the plain SPA build (still fully working; just without static SEO HTML).
async function launchBrowser() {
  try { return await chromium.launch() } catch { /* not installed */ }
  try {
    console.log('Chromium missing, installing it for prerendering…')
    execSync(`npx playwright install ${process.getuid?.() === 0 ? '--with-deps ' : ''}chromium`, { stdio: 'inherit' })
    return await chromium.launch()
  } catch (e) {
    const why = String(e?.message || e).split(/\r?\n/)[0]
    console.warn(`⚠ Prerender skipped: no headless browser available (${why}). The site still works as an SPA. Set SKIP_PRERENDER=1 to skip this step.`)
    return null
  }
}
const browser = process.env.SKIP_PRERENDER ? null : await launchBrowser()
const server = browser ? await preview({ preview: { port: 0 }, logLevel: 'silent' }) : null
const base = server?.resolvedUrls.local[0].replace(/\/$/, '')
if (browser) try {
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
// Static 404 page for hosts that serve /404.html with a real 404 status
await page.goto(`${base}/404`, { waitUntil: 'networkidle' })
await page.waitForSelector('main h1', { timeout: 15000 })
writeFileSync('dist/404.html', '<!doctype html>\n' + (await page.evaluate(() => document.documentElement.outerHTML)))
console.log('prerendered 404.html')
} finally {
  await browser.close()
  await new Promise((r) => server.httpServer.close(r))
}
else copyFileSync('dist/index.html', 'dist/404.html')

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
