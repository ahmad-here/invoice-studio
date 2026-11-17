import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: '/',
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Invoice Studio – Free Invoice Generator',
        short_name: 'Invoice Studio',
        description: 'Create, print and bulk-generate professional PDF invoices. Free, offline, no sign-up.',
        theme_color: '#0692F4',
        background_color: '#F7F9FC',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'], globIgnores: ['**/html2canvas*', '**/purify.es*', '**/index.es-*', '**/downloads/**'], maximumFileSizeToCacheInBytes: 1_500_000, navigateFallback: '/app.html', additionalManifestEntries: [{ url: '/app.html', revision: String(Date.now()) }], navigateFallbackDenylist: [/^\/downloads\//, /\.(xml|txt|apk)$/] },
    }),
  ],
  test: { environment: 'jsdom', include: ['tests/unit/**/*.test.ts?(x)'], setupFiles: ['tests/setup.ts'] },
  build: { chunkSizeWarningLimit: 600 },
})
