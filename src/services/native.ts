import { Capacitor } from '@capacitor/core'

const native = () => Capacitor.isNativePlatform()

/** One-time native setup: light status bar matching the app bar, then hide the splash screen. */
export async function initNative(): Promise<void> {
  if (!native()) return
  try {
    const [{ StatusBar, Style }, { SplashScreen }] = await Promise.all([import('@capacitor/status-bar'), import('@capacitor/splash-screen')])
    await StatusBar.setOverlaysWebView({ overlay: false }).catch(() => undefined)
    await StatusBar.setStyle({ style: Style.Light }).catch(() => undefined) // dark icons on light bar
    await StatusBar.setBackgroundColor({ color: '#FFFFFF' }).catch(() => undefined)
    await SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => undefined)
  } catch {
    /* plugins unavailable — app still works */
  }
}

let hapticsMod: Promise<typeof import('@capacitor/haptics')> | null = null
/** Light tactile feedback for primary actions (no-op on web). */
export function haptic(kind: 'light' | 'medium' | 'success' = 'light'): void {
  if (!native()) return
  hapticsMod ??= import('@capacitor/haptics')
  hapticsMod.then(({ Haptics, ImpactStyle, NotificationType }) =>
    kind === 'success' ? Haptics.notification({ type: NotificationType.Success }) : Haptics.impact({ style: kind === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light }),
  ).catch(() => undefined)
}

/** Android hardware back button: close dialogs first, then navigate back, then exit from home. */
export async function onBackButton(handler: () => 'handled' | 'exit'): Promise<() => void> {
  if (!native()) return () => undefined
  const { App } = await import('@capacitor/app')
  const sub = await App.addListener('backButton', () => {
    if (handler() === 'exit') App.exitApp()
  })
  return () => { sub.remove() }
}
