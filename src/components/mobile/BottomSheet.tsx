import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { TABS, type Tab } from '../LeftPanel'

/** シートの高さ(画面高さに対する割合)。上のつまみをドラッグして 3 段階に開閉する */
const SNAPS = [0.36, 0.6, 0.88]

/** 下からせり上がるシート。つまみをドラッグして高さを変え、いちばん低い段より下げると閉じる */
export function BottomSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const [snap, setSnap] = useState(0)
  const [dragH, setDragH] = useState<number | null>(null)
  const drag = useRef<{ y: number; h: number; moved: boolean } | null>(null)
  const vh = () => window.innerHeight
  const height = dragH ?? SNAPS[snap] * vh()

  const down = (e: React.PointerEvent) => {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { y: e.clientY, h: height, moved: false }
  }
  const move = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const dy = e.clientY - d.y
    if (Math.abs(dy) > 4) d.moved = true
    if (d.moved) setDragH(Math.max(60, Math.min(vh() * 0.95, d.h - dy)))
  }
  const up = () => {
    const d = drag.current
    drag.current = null
    if (!d) return
    if (!d.moved) { setSnap((s) => (s + 1) % SNAPS.length); setDragH(null); return } // タップで次の高さへ
    const h = dragH ?? d.h
    setDragH(null)
    if (h < SNAPS[0] * vh() * 0.6) { onClose(); return }
    let best = 0
    SNAPS.forEach((s, i) => { if (Math.abs(s * vh() - h) < Math.abs(SNAPS[best] * vh() - h)) best = i })
    setSnap(best)
  }
  return (
    <div className="sheet" style={{ height, transition: dragH === null ? 'height .18s ease' : 'none' }} role="dialog" aria-label={title}>
      <div className="sheet-handle" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <i className="sheet-grip" />
        <span className="sheet-title">{title}</span>
        <button className="sheet-close" aria-label="閉じる" onPointerDown={(e) => e.stopPropagation()} onClick={onClose}><X size={18} /></button>
      </div>
      <div className="sheet-body">{children}</div>
    </div>
  )
}

const MAIN: Tab[] = ['templates', 'text', 'elements', 'photos', 'uploads']

/** 下部のツールタブバー。主要 5 つ + 「その他」(動画・音楽・描く・ブランド・背景・レイヤー) */
export function MobileTabBar({ tab, setTab }: { tab: Tab | null; setTab: (t: Tab | null) => void }) {
  const [more, setMore] = useState(false)
  const main = MAIN.map((id) => TABS.find((t) => t[0] === id)!)
  const rest = TABS.filter((t) => !MAIN.includes(t[0]))
  const restOn = tab !== null && !MAIN.includes(tab)
  useEffect(() => { if (!more) return; const f = () => setMore(false); window.addEventListener('pointerdown', f); return () => window.removeEventListener('pointerdown', f) }, [more])
  return (
    <nav className="m-tabbar">
      {more && (
        <div className="m-more" onPointerDown={(e) => e.stopPropagation()}>
          {rest.map(([id, label, icon]) => (
            <button key={id} className={tab === id ? 'on' : ''} onClick={() => { setTab(id); setMore(false) }}>{icon}<span>{label}</span></button>
          ))}
        </div>
      )}
      {main.map(([id, label, icon]) => (
        <button key={id} className={'m-tab' + (tab === id ? ' on' : '')} onClick={() => { setMore(false); setTab(tab === id ? null : id) }}>{icon}<span>{label}</span></button>
      ))}
      <button className={'m-tab' + (restOn || more ? ' on' : '')} onPointerDown={(e) => e.stopPropagation()} onClick={() => setMore(!more)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg><span>その他</span>
      </button>
    </nav>
  )
}
