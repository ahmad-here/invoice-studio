import type { CapacitorConfig } from '@capacitor/cli'
const config: CapacitorConfig = {
  appId: 'io.invoicestudio.app',
  appName: 'Invoice Studio',
  webDir: 'dist',
  android: { allowMixedContent: false },
}
export default config
