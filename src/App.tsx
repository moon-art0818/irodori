import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import './components/theme'
import { Home } from './components/Home'
import { Editor } from './components/Editor'
import { ShareView } from './components/Share'
import { CollabJoin } from './collab/Join'
import { initSession } from './api/session'
import { detectLocal } from './api/local'
import { startLocalBridge } from './api/bridgeHandlers'

initSession()
// ローカル版なら AI エージェントからの依頼(書き出し・テンプレ適用)に答える
detectLocal().then((on) => { if (on) startLocalBridge() })

function useHash() {
  const [h, setH] = useState(location.hash)
  useEffect(() => {
    const f = () => setH(location.hash)
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return h
}

export default function App() {
  return <><Routes /><Toaster position="bottom-right" richColors closeButton /></>
}

function Routes() {
  const hash = useHash()
  const m = hash.match(/^#\/d\/([\w-]+)/)
  if (m) return <Editor key={m[1]} docId={m[1]} />
  const sh = hash.match(/^#\/s\/([\w-]+)/)
  if (sh) return <ShareView key={sh[1]} shareId={sh[1]} />
  const cj = hash.match(/^#\/c\/([\w-]{24})(?![\w-])/)
  if (cj) return <CollabJoin key={cj[1]} room={cj[1]} />
  return <Home />
}
