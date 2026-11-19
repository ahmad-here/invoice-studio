# Instagram Reels — Invoice Studio

Five motion-graphics reels (no screen recordings), 1080×1920, 30 fps, H.264 MP4, plus a cover image for each.
Files: `marketing/reels/out/reel*.mp4` and `reel*-cover.png`.

## Research summary (Nov 2026)
- **Format:** 9:16, 1080×1920 (Instagram's recommended size).
- **Safe zone:** keep text clear of the top ~250 px, the bottom ~350 px (caption, username, audio) and the right edge (like/comment/share buttons). All reels keep text between y≈250 and y≈1570 and away from the right edge.
- **Hook in the first 1–3 seconds:** retention in the first 2 seconds is the strongest signal. Every reel opens with a bold, moving text hook.
- **Length:** under 90 seconds, length barely changes reach (Buffer, 2.7M reels). 15–30 s maximises completion and discovery; 45–60 s gets the most engagement for business accounts. These reels are 21–23 s, built for discovery, with one message each.
- **Sound off by default:** most viewers watch muted, so the whole message is in on-screen text (kinetic typography).
- **Audio:** add trending or licensed audio **inside the Instagram app** when posting. The files contain a silent track, so no music rights issues.
- **Style:** kinetic typography plus product visuals (real invoice templates) is the most effective motion-graphics style for SaaS explainers.

## The 5 reels

| # | File | Hook (0–3 s) | What it explains | Length |
|---|------|--------------|------------------|--------|
| 1 | `reel1-word.mp4` | “Still making invoices in Word?” | An invoice builds itself: logo → client → items → automatic totals → PDF / Print / Share | 22 s |
| 2 | `reel2-bulk.mp4` | “400 invoices. One click.” | CSV/JSON → drop into Bulk → hundreds of invoices → validation → ZIP / combined PDF | 22 s |
| 3 | `reel3-templates.mp4` | “Your invoice is your brand.” | Carousel of real templates (general, industry, document types) → logo and accent colours | 21 s |
| 4 | `reel4-private.mp4` | “No sign-up. No cloud. No catch.” | Data stays on device, nothing uploaded, works offline, Android app or browser install | 21 s |
| 5 | `reel5-tax.mp4` | “One wrong decimal = lost money.” | Discount → VAT → total calculated to the cent, 10 currencies, GST/VAT tax invoice, amount in words | 23 s |

Every reel ends with the same 4-second branded end card: logo, promise, “Create your invoice — free”, and the URL.

## Captions (copy-paste)

**Reel 1**
Stop fighting Word tables. Add your logo, pick a client, add items — totals and tax are calculated for you. Download a PDF, print or share in seconds. 100% free, no sign-up. 🔗 Link in bio
#invoice #invoicegenerator #freelancer #smallbusiness #invoicing #freeinvoice #pdf

**Reel 2**
400 invoices from one spreadsheet ⚡ Export your orders as CSV (or JSON), drop the file in, and download every invoice as a ZIP or one combined PDF. Rows with problems are flagged, not lost. Free bulk invoice generator — link in bio.
#bulkinvoice #ecommerce #accounting #smallbusiness #invoicegenerator #csv #productivity

**Reel 3**
21 free invoice templates: classic, modern, construction, timesheet, hotel, medical, GST/VAT tax invoice, proforma, receipt… Add your logo and colours and switch templates any time without retyping. Which one is your style? 👇
#invoicetemplate #branding #freelancer #smallbusiness #design #invoicegenerator

**Reel 4**
No account. No cloud. No catch. Your invoices and clients stay on your device: nothing is uploaded, and it works offline. Get the Android app or install it from your browser. 🔒
#privacy #offline #androidapp #smallbusiness #invoicing #freelancelife

**Reel 5**
Invoice maths, done right ✅ Discounts before tax, per-item or whole-invoice VAT/GST, 10 currencies formatted correctly, and the amount in words on tax invoices. Accurate to the cent, every time.
#gst #vat #taxinvoice #accounting #smallbusiness #invoicegenerator #bookkeeping

## Posting plan
- **Schedule:** 2–3 per week (for example Mon / Wed / Fri). Post Reel 1 first (broadest hook), then 3, 2, 5, 4.
- **Cover:** upload `reelN-cover.png` as the cover so the grid looks consistent.
- **Audio:** in the editor, pick an upbeat trending track at low volume. The text carries the message.
- **Before posting:** replace `invoicestudio.app` in `endcard.js` with your real domain and re-render (`node marketing/reels/render.mjs`).
- **Measure:** compare 3-second hold rate and completion rate per reel after 48 hours, then remake the weakest hook with a new first line.

## Re-render / edit
- Each reel is an HTML scene (`reelN-*.html`) driven by `engine.js`, a deterministic timeline. Edit text, colours or timings there.
- Preview a frame: `node marketing/reels/snap.mjs reel1-word 3.5` (writes a PNG to `out/`).
- Render all: `node marketing/reels/render.mjs` (or pass one name, e.g. `reel2-bulk`).
- Refresh product shots after template changes: `npm run build:app && node marketing/reels/make-assets.mjs`.
