import type { CapacitorConfig } from '@capacitor/cli'
const config: CapacitorConfig = {
  appId: 'io.invoicestudio.app',
  appName: 'Invoice Studio',
  webDir: 'dist',
  backgroundColor: '#F7F9FC',
  plugins: {
    SplashScreen: { launchAutoHide: false, backgroundColor: '#F7F9FC', showSpinner: false, androidScaleType: 'CENTER_CROP' },
    StatusBar: { style: 'LIGHT', backgroundColor: '#FFFFFF', overlaysWebView: false },
    Keyboard: { resize: 'body', resizeOnFullScreen: true },
  },
}
export default config
