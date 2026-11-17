/**
 * Public site settings. Override at build time with environment variables, e.g.
 *   VITE_SITE_URL=https://invoices.yourdomain.com VITE_SUPPORT_EMAIL=help@yourdomain.com npm run build
 */
export const SITE = {
  name: 'Invoice Studio',
  url: (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') || 'https://invoicestudio.app',
  supportEmail: (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) || 'support@invoicestudio.app',
  /** Where the Android APK is served from (place the built file in public/downloads/). */
  apkUrl: (import.meta.env.VITE_APK_URL as string | undefined) || '/downloads/invoice-studio.apk',
  lastUpdated: '17 November 2026',
}
