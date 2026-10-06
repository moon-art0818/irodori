import { useEffect, useRef, useState } from 'react'
import { loadScene, renderAnimationFrame, resizeScene, type AnimScene } from '../editor/animate'
import type { DesignDoc } from '../editor/types'
import './animate.css'

export function Present({ doc, startPage, onClose }: { doc: DesignDoc; startPage: number; onClose: () => void }) {
  const [idx, setIdx] = useState(Math.min(Math.max(0, startPage), doc.pages.length - 1))
  const rootRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<AnimScene | null>(null)
  const tRef = useRef({ t0: 0, done: false })
  const rafRef = useRef(0)
  const idxRef = useRef(idx)
  idxRef.current = idx
  const n = doc.pages.length

  const fitScale = () => Math.min(window.innerWidth / doc.width, window.innerHeight / doc.height) * (window.devicePixelRatio || 1)
  // CSS 上の表示サイズ(devicePixelRatio 分を戻す)
  const fitCss = (sc: AnimScene) => {
    const k = 1 / (window.devicePixelRatio || 1)
    sc.el.style.width = Math.round(doc.width * fitScale() * k) + 'px'
    sc.el.style.height = Math.round(doc.height * fitScale() * k) + 'px'
  }

  const next = () => { if (idxRef.current >= n - 1) onClose(); else setIdx(idxRef.current + 1) }
  const prev = () => setIdx((i) => Math.max(0, i - 1))

  // 全画面に入る/出たら閉じる
  useEffect(() => {
    const root = rootRef.current
    let entered = false
    root?.requestFullscreen?.().then(() => { entered = true }).catch(() => {})
    const onFs = () => { if (!document.fullscreenElement && entered) onClose() }
    document.addEventListener('fullscreenchange', onFs)
    return () => {
      document.removeEventListener('fullscreenchange', onFs)
      entered = false
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'Enter') { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'Backspace') { e.preventDefault(); prev() }
      else if (e.key === 'Escape') { e.preventDefault(); onClose() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ページ表示+アニメーション再生
  useEffect(() => {
    let dead = false
    cancelAnimationFrame(rafRef.current)
    ;(async () => {
      let sc: AnimScene
      try { sc = await loadScene(doc.pages[idx].json, doc.width, doc.height, fitScale()) } catch { return }
      if (dead) { sc.dispose(); return }
      sceneRef.current?.dispose()
      sceneRef.current = sc
      fitCss(sc)
      stageRef.current?.replaceChildren(sc.el)
      tRef.current = { t0: performance.now(), done: sc.anim.preset === 'none' }
      const tick = () => {
        const cur = sceneRef.current
        if (dead || cur !== sc) return
        const t = (performance.now() - tRef.current.t0) / 1000
        if (t >= sc.duration) { renderAnimationFrame(sc, sc.duration); tRef.current.done = true; return }
        renderAnimationFrame(sc, t)
        rafRef.current = requestAnimationFrame(tick)
      }
      if (tRef.current.done) renderAnimationFrame(sc, sc.duration)
      else tick()
    })()
    return () => { dead = true; cancelAnimationFrame(rafRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  // ウィンドウサイズ変更に追従
  useEffect(() => {
    const onResize = () => {
      const sc = sceneRef.current
      if (!sc) return
      resizeScene(sc, fitScale()); fitCss(sc)
      const t = tRef.current.done ? sc.duration : (performance.now() - tRef.current.t0) / 1000
      renderAnimationFrame(sc, Math.min(t, sc.duration))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => { cancelAnimationFrame(rafRef.current); sceneRef.current?.dispose(); sceneRef.current = null }, [])

  return (
    <div className="present" ref={rootRef} tabIndex={-1} onClick={next}>
      <div className="present-stage" ref={stageRef} />
      <button className="present-close" onClick={(e) => { e.stopPropagation(); onClose() }}>閉じる(Esc)</button>
      <div className="present-num">{idx + 1} / {n}</div>
    </div>
  )
}
