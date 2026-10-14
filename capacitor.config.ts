import type { CapacitorConfig } from '@capacitor/cli'

// ネイティブアプリ(iOS / Android)の設定。手順は docs/mobile-app.md
const config: CapacitorConfig = {
  appId: 'dev.irodori.app',
  appName: 'irodori',
  webDir: 'dist',
}

export default config
