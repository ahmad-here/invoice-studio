# Invoice Studio

A free, private, offline-capable invoice generator: 10 professional templates, live A4/Letter/Legal preview, PDF download, direct printing, bulk generation from CSV/JSON (ZIP or combined PDF), multiple business profiles, and an Android app — with no account and no server. All data stays in the browser (IndexedDB) on the user's device.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

Requirements: Node 20+ (tested on Node 24). Android builds additionally need Android Studio (SDK 36) and its bundled JDK 21.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Typecheck, production build, prerender SEO pages, write `sitemap.xml` + `robots.txt` into `dist/` |
| `npm run build:app` | Typecheck + production build only (used for Android) |
| `npm run preview` | Serve `dist/` locally |
| `npm run typecheck` | TypeScript strict check |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest): money/tax maths, CSV/JSON parsing |
| `npm run e2e` | End-to-end tests (Playwright, desktop + Pixel 7). Run `npm run build` first; first time: `npx playwright install chromium` |
| `npm run cap:sync` | Build the web app and copy it into the Android project |

## Production web build & hosting

```bash
VITE_SITE_URL=https://your-domain.com VITE_SUPPORT_EMAIL=help@your-domain.com npm run build
```

Deploy the `dist/` folder to any static host.

- Public pages (`/`, `/features`, `/how-to-use`, `/faq`, `/support`, `/contact`, `/privacy`, `/download`, `/templates`, `/bulk`) are prerendered to static HTML for search engines.
- App routes (`/create`, `/edit/:id`, `/invoices`, `/settings`) need a rewrite to `/app.html`. Ready-made configs: `public/_redirects` (Netlify) and `vercel.json` (Vercel). For nginx: `try_files $uri $uri/index.html /app.html;`.
- `VITE_SITE_URL` sets canonical URLs and the sitemap; `VITE_SUPPORT_EMAIL` sets the contact address; `VITE_APK_URL` overrides the APK link (default `/downloads/invoice-studio.apk`).

## Android APK

The Android app is the same web app packaged with Capacitor (`android/`). App ID: `io.invoicestudio.app`.

Windows (PowerShell), with Android Studio installed:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
npm run cap:sync                      # build web app + copy into android/
cd android
.\gradlew.bat assembleDebug           # → android\app\build\outputs\apk\debug\app-debug.apk
```

macOS/Linux: same, using `./gradlew assembleDebug`. To open in Android Studio: `npx cap open android`.

`android/local.properties` must point at your SDK (`sdk.dir=C:/Users/<you>/AppData/Local/Android/Sdk`); Android Studio creates it automatically when you open the project.

**Publish the APK on the website:** copy the APK to `public/downloads/invoice-studio.apk` and rebuild. The Download page detects the file and shows a “Download APK” button; it is excluded from the offline cache.

### Signed release APK

```powershell
keytool -genkeypair -v -keystore invoice-studio.keystore -alias invoicestudio -keyalg RSA -keysize 2048 -validity 10000
```

Create `android/keystore.properties` (never commit it or the keystore):

```
storeFile=../../invoice-studio.keystore
storePassword=...
keyAlias=invoicestudio
keyPassword=...
```

Then in Android Studio use **Build → Generate Signed Bundle / APK**, or add a `signingConfigs.release` block reading those properties to `android/app/build.gradle` and run `.\gradlew.bat assembleRelease` (output: `android\app\build\outputs\apk\release\`). For Google Play, build an App Bundle with `bundleRelease`.

Regenerate icons after changing `public/favicon.svg`: `node scripts/make-icons.mjs` then `npx @capacitor/assets generate --android`.

## Bulk CSV format

Required columns: `invoice_number, customer_name, item_name, quantity, unit_price`. Rows sharing an `invoice_number` become one invoice with several line items. Optional columns include `invoice_date, due_date, currency, status, po_number, reference, payment_terms, notes, business_name, business_email, business_phone, business_address, business_tax_number, customer_company, customer_email, customer_phone, customer_address, customer_shipping_address, customer_tax_id, shipping, amount_paid, invoice_discount, invoice_discount_type, item_description, sku, unit, discount, discount_type, tax_rate`. Add `custom:Label` columns for custom fields. Headers are auto-matched (e.g. “Qty”) and can be remapped in the UI. Download samples from the Bulk page.

JSON: `{ "invoices": [ { "invoiceNumber", "issueDate", "dueDate", "currency", "business": {...}, "customer": {...}, "items": [ { "name", "quantity", "unitPrice", "taxRate", "discount": { "type", "value" } } ], "customFields": [ { "label", "value" } ] } ] }`.

## Architecture

```
src/
  app/            App shell, routes, zustand store (prefs, business profiles, invoices, toasts)
  components/     common UI primitives, layout (header, nav, footer, tour), invoice document renderer
  features/       dashboard, invoice-editor, invoice-templates, bulk-generator, saved-invoices, settings, content (SEO pages)
  templates/      10 templates sharing one data model + shared building blocks; lazily loaded
  services/       storage (IndexedDB), pdf (html-to-image + jsPDF), printing, bulk (CSV/JSON parse + Web Worker), files (web download / Android share)
  lib/            money (integer minor units), calc (totals), dates, schema (zod, lazy), fastMigrate, sanitize, image (logo processing)
  types/          shared TypeScript data model (schema-versioned)
```

Key design points:

- **Money** is stored as integer minor units; tax is per item *or* per invoice (never both); invoice discounts are applied before tax and allocated pro-rata.
- **One renderer** (`InvoiceDocument`) measures content and paginates into real pages; the same pages are used for preview, print and PDF, with repeated table headers.
- **Bulk parsing** runs in a Web Worker; PDFs are generated one invoice at a time with progress and cancel; only 50 rows render at once.
- **Data** is schema-versioned; backups are JSON and validated on import. Logos (including SVG) are rasterised to PNG on upload, so no SVG/script is ever stored.

## Known limitations

- PDFs are high-resolution images of the page (text is not selectable/searchable). This guarantees the PDF matches the preview exactly across browsers.
- A single line item taller than a full page (an extremely long description) is clipped at the page edge.
- Android WebView has no native print dialog: “Print” in the app creates the PDF and opens the share sheet, from which you can print via your PDF viewer.
- Very large bulk jobs (hundreds of invoices) are memory-heavy on low-end phones; ZIP export is lighter than one combined PDF.
- Data does not sync between devices or browsers; use Settings → Export backup / Import backup.
