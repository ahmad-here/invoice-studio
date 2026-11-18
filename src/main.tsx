import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import { APP_MODE } from './lib/appMode'
import { initNative } from './services/native'
import { App } from './app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (APP_MODE) initNative()

// PWA service worker (web only; Capacitor serves files locally)
if (import.meta.env.PROD && !('Capacitor' in window && (window as unknown as { Capacitor: { isNativePlatform: () => boolean } }).Capacitor.isNativePlatform())) {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true })).catch(() => undefined)
}
