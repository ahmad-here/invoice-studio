import { Capacitor } from '@capacitor/core'

/**
 * "App mode" = running as the Android app or as an installed PWA (standalone window).
 * The UI switches to a native-style shell: app bar, bottom tabs, no website header/footer/SEO chrome.
 * `?app=1` forces it for the current tab session (useful for previews and tests).
 */
export const APP_MODE: boolean = (() => {
  try {
    if (Capacitor.isNativePlatform()) return true
    if (new URLSearchParams(location.search).has('app')) sessionStorage.setItem('invoice-studio:app-mode', '1')
    if (sessionStorage.getItem('invoice-studio:app-mode') === '1') return true
    return matchMedia('(display-mode: standalone)').matches
  } catch {
    return false
  }
})()

if (APP_MODE && typeof document !== 'undefined') document.documentElement.classList.add('app-mode')
