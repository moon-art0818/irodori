import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { googleFontsHref } from './data/fonts'

// フォントは Google Fonts(OFL)から読む
const link = document.createElement('link')
link.rel = 'stylesheet'
link.href = googleFontsHref()
document.head.appendChild(link)

// fabric の Canvas は二重初期化に弱いため StrictMode は使わない
createRoot(document.getElementById('root')!).render(<App />)

// オフライン対応(本番ビルドのみ。開発中は登録しない)
if (import.meta.env.PROD && 'serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
