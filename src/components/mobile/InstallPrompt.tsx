import { Share, SquarePlus, X, Download } from 'lucide-react'
import { useEffect, useState } from 'react'

const KEY = 'irodori:install-dismissed'
const readDismissed = () => { try { return localStorage.getItem(KEY) === '1' } catch { return false } }
const writeDismissed = () => { try { localStorage.setItem(KEY, '1') } catch { /* 保存できなくても今回は閉じる */ } }

const isStandalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
/** iPhone / iPad(iPadOS は Mac を名乗るのでタッチ点数でも見る) */
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

let deferred: any = null
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e })
}

/** ホーム画面に追加するための小さな案内。一度閉じたら二度と出さない。アプリとして開いているときは出さない */
export function InstallPrompt() {
  const [hidden, setHidden] = useState(() => readDismissed() || isStandalone())
  const [ready, setReady] = useState(!!deferred) // Android / Chrome: インストール可能になった
  useEffect(() => {
    const f = (e: Event) => { e.preventDefault(); deferred = e; setReady(true) }
    window.addEventListener('beforeinstallprompt', f)
    const done = () => { setHidden(true); writeDismissed() }
    window.addEventListener('appinstalled', done)
    return () => { window.removeEventListener('beforeinstallprompt', f); window.removeEventListener('appinstalled', done) }
  }, [])
  const ios = isIOS()
  if (hidden || (!ready && !ios)) return null
  const close = () => { setHidden(true); writeDismissed() }
  const install = async () => {
    if (!deferred) return
    deferred.prompt()
    try { await deferred.userChoice } catch { /* */ }
    deferred = null
    close()
  }
  return (
    <div className="install-tip" role="note">
      <div className="install-body">
        <b>アプリとして使えます</b>
        {ready
          ? <span>ホーム画面に追加すると、全画面でそのまま開けます。</span>
          : <span>下の <Share size={14} style={{ verticalAlign: '-2px' }} /> 共有ボタンから「<SquarePlus size={14} style={{ verticalAlign: '-2px' }} /> ホーム画面に追加」を選んでください。</span>}
      </div>
      {ready && <button className="primary-btn" onClick={install}><Download size={15} />追加</button>}
      <button className="icon-btn" aria-label="案内を閉じる(もう表示しません)" onClick={close}><X size={16} /></button>
    </div>
  )
}
