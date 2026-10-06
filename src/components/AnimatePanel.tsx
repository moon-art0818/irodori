import { Film, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ANIMATIONS, DEFAULT_DURATION, exportVideo, loadScene, renderAnimationFrame, type AnimScene } from '../editor/animate'
import type { DesignDoc, PageAnimation } from '../editor/types'
import './animate.css'

const PREVIEW_W = 240

export function AnimatePanel({ getDoc, pageIdx, onChange }: { getDoc: () => DesignDoc; pageIdx: number; onChange: () => void }) {
  // 一覧表示用(このパネルを開いた時点の内容で十分)
  const doc = getDoc()
  const cur: PageAnimation = doc.pages[pageIdx]?.json?.animation ?? { preset: 'none' }
  const [, bump] = useState(0)
  const [pageSec, setPageSec] = useState(4)
  const [prog, setProg] = useState<number | null>(null)
  const [err, setErr] = useState('')
  const boxRef = useRef<HTMLDivElement>(null)
  const runRef = useRef(0)
  const sceneRef = useRef<AnimScene | null>(null)

  const play = async () => {
    const run = ++runRef.current
    const d = getDoc(), pg = d.pages[pageIdx]
    if (!pg) return
    let sc: AnimScene
    try { sc = await loadScene(pg.json, d.width, d.height, PREVIEW_W / d.width) } catch { return }
    if (run !== runRef.current) { sc.dispose(); return }
    sceneRef.current?.dispose()
    sceneRef.current = sc
    boxRef.current?.replaceChildren(sc.el)
    const t0 = performance.now()
    const tick = () => {
      if (run !== runRef.current) return
      const t = (performance.now() - t0) / 1000
      renderAnimationFrame(sc, Math.min(t, sc.duration))
      if (t < sc.duration) requestAnimationFrame(tick)
    }
    tick()
  }

  // ページを切り替えたら最終形を見せる(アニメは選んだ時に再生)
  useEffect(() => { play(); return () => { runRef.current++ } }, [pageIdx]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { runRef.current++; sceneRef.current?.dispose(); sceneRef.current = null }, [])

  const set = (patch: Partial<PageAnimation>, replay: boolean) => {
    const pg = getDoc().pages[pageIdx]
    pg.json.animation = { ...cur, ...patch }
    onChange(); bump((x) => x + 1)
    if (replay) play()
  }
  const applyAll = () => {
    const a = getDoc().pages[pageIdx].json.animation ?? { preset: 'none' }
    for (const p of getDoc().pages) p.json.animation = { ...a }
    onChange(); bump((x) => x + 1)
  }

  const download = async () => {
    setErr(''); setProg(0)
    try {
      const d = getDoc()
      const { blob, ext } = await exportVideo(d, { pageSeconds: pageSec, onProgress: setProg })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = (d.name.replace(/[\\/:*?"<>|]/g, '_') || 'design') + '.' + ext
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (e: any) { setErr('動画の作成に失敗しました: ' + (e?.message ?? e)) }
    finally { setProg(null) }
  }

  const dur = cur.duration ?? DEFAULT_DURATION
  return (
    <div className="anim-panel">
      <div className="pop-label">このページのアニメーション</div>
      <div className="anim-grid">
        {ANIMATIONS.map((a) => (
          <button key={a.id} className={'chip' + (cur.preset === a.id ? ' on' : '')} onClick={() => set({ preset: a.id }, true)}>{a.label}</button>
        ))}
      </div>
      <div className="anim-preview" ref={boxRef} />
      <div className="row">
        <button className="chip" onClick={play}><RotateCcw size={12} /> もう一度</button>
        <button className="chip" onClick={applyAll}>全ページに適用</button>
      </div>
      <div className="pop-label">かかる時間: {dur.toFixed(1)}秒</div>
      <input type="range" min={0.3} max={3} step={0.1} value={dur} onChange={(e) => set({ duration: Number(e.target.value) }, false)} onPointerUp={play} onKeyUp={play} />

      <div className="pop-label">動画をダウンロード</div>
      <div className="row">
        {[2, 3, 5, 8].map((s) => <button key={s} className={'chip' + (pageSec === s ? ' on' : '')} onClick={() => setPageSec(s)}>1ページ {s}秒</button>)}
      </div>
      <p className="hint">全 {doc.pages.length} ページで約 {doc.pages.length * pageSec} 秒。実時間で録画するので、完了までこのタブを開いたままにしてください。</p>
      {prog !== null && <div className="anim-bar"><i style={{ width: Math.round(prog * 100) + '%' }} /></div>}
      {err && <p className="error">{err}</p>}
      <button className="primary-btn wide" disabled={prog !== null} onClick={download}><Film size={16} />{prog !== null ? `作成中… ${Math.round(prog * 100)}%` : '動画をダウンロード'}</button>
    </div>
  )
}
