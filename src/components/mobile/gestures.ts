import type { EditorCore } from '../../editor/core'

/**
 * スマホのタッチ操作(編集画面のキャンバス領域に付ける)
 * - 2 本指のピンチで拡大縮小、2 本指のドラッグで表示を移動(fabric には渡さない)
 * - 長押しでメニュー(右クリック相当)
 * - ダブルタップで文字などの編集(端末が dblclick を出さない場合の代用)
 * 1 本指の選択・移動・ハンドル操作は fabric の pointer events にそのまま任せる。
 */
export function attachTouchGestures(area: HTMLElement, getEd: () => EditorCore | null): () => void {
  const pts = new Map<number, { x: number; y: number }>()
  let g: { dist: number; zoom: number; ax: number; ay: number } | null = null // ピンチ中の基準(ax, ay はページ座標)
  let lp: { timer: number; x: number; y: number; id: number } | null = null
  let down: { x: number; y: number; t: number } | null = null
  let lastTap = { t: 0, x: 0, y: 0 }
  let nativeDbl = 0

  const two = () => { const [a, b] = [...pts.values()]; return { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, dist: Math.hypot(a.x - b.x, a.y - b.y) || 1 } }
  const cancelLP = () => { if (lp) clearTimeout(lp.timer); lp = null }
  /** fabric が持っている操作中の状態(移動・ハンドル・範囲選択)を捨てる */
  const abortFabric = (ed: EditorCore) => { const c = ed.canvas as any; c._currentTransform = null; c._groupSelector = null }

  const onDown = (e: PointerEvent) => {
    if (e.pointerType !== 'touch') return
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const ed = getEd()
    if (!ed) return
    if (pts.size >= 2) {
      cancelLP(); down = null
      e.stopPropagation()
      abortFabric(ed)
      if (!g) { const t = two(); const p = ed.clientToPage(t.cx, t.cy); g = { dist: t.dist, zoom: ed.zoom, ax: p.x, ay: p.y } }
      return
    }
    down = { x: e.clientX, y: e.clientY, t: performance.now() }
    if (e.target !== ed.canvas.upperCanvasEl) return
    // 長押し: 指の下のものを選んでメニューを出す
    const id = e.pointerId, x = e.clientX, y = e.clientY
    lp = {
      id, x, y,
      timer: window.setTimeout(() => {
        lp = null
        const ed2 = getEd()
        if (!ed2 || !pts.has(id) || g) return
        try {
          const t = (ed2.canvas as any).findTarget(e)?.target
          if (t && !ed2.selected().includes(t)) { ed2.canvas.setActiveObject(t) }
          if (!t) ed2.canvas.discardActiveObject()
          abortFabric(ed2)
          ed2.canvas.requestRenderAll(); ed2.emit()
          navigator.vibrate?.(10)
          ed2.onContextMenu?.(x, y)
        } catch { /* 長押しが失敗しても通常の操作は続けられる */ }
      }, 520),
    }
  }

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'touch' || !pts.has(e.pointerId)) return
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (lp && lp.id === e.pointerId && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 10) cancelLP()
    if (!g) return
    e.stopPropagation() // ピンチ中の指の動きは fabric に渡さない(オブジェクトを動かさない)
    if (pts.size < 2) return
    const ed = getEd()
    if (!ed) return
    const t = two()
    ed.setZoom(g.zoom * (t.dist / g.dist))
    // ピンチの中心にあったページ上の点が、いまの中心の位置に来るようスクロールを合わせる(2 本指ドラッグの移動も兼ねる)
    const r = ed.canvas.upperCanvasEl.getBoundingClientRect()
    area.scrollLeft += r.left + g.ax * ed.zoom - t.cx
    area.scrollTop += r.top + g.ay * ed.zoom - t.cy
  }

  const onUp = (e: PointerEvent) => {
    if (e.pointerType !== 'touch') return
    const was = pts.get(e.pointerId)
    pts.delete(e.pointerId)
    cancelLP()
    if (g) { if (pts.size < 2) g = null; if (pts.size === 0) down = null; return }
    const ed = getEd()
    if (!ed || !was || !down || pts.size) { down = null; return }
    const d = down; down = null
    if (e.type !== 'pointerup' || e.target !== ed.canvas.upperCanvasEl) return
    // タップ判定 → 2 回続けばダブルタップ
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12 || performance.now() - d.t > 350) { lastTap.t = 0; return }
    const now = performance.now()
    if (now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) {
      lastTap.t = 0
      const x = e.clientX, y = e.clientY, el = ed.canvas.upperCanvasEl, before = nativeDbl
      // 端末が自分で dblclick を出すならそれに任せる(二重に編集に入らないように、少し待って確認)
      window.setTimeout(() => {
        if (nativeDbl !== before) return
        el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, clientX: x, clientY: y, detail: 2, view: window }))
      }, 120)
    } else lastTap = { t: now, x: e.clientX, y: e.clientY }
  }

  const onNativeDbl = () => { nativeDbl++ }
  const noGesture = (e: Event) => e.preventDefault() // iOS Safari: ページ全体のピンチ拡大を止める
  area.addEventListener('pointerdown', onDown, true)
  window.addEventListener('pointermove', onMove, true)
  window.addEventListener('pointerup', onUp, true)
  window.addEventListener('pointercancel', onUp, true)
  area.addEventListener('dblclick', onNativeDbl, true)
  document.addEventListener('gesturestart', noGesture, { passive: false } as any)
  document.addEventListener('gesturechange', noGesture, { passive: false } as any)
  return () => {
    cancelLP()
    area.removeEventListener('pointerdown', onDown, true)
    window.removeEventListener('pointermove', onMove, true)
    window.removeEventListener('pointerup', onUp, true)
    window.removeEventListener('pointercancel', onUp, true)
    area.removeEventListener('dblclick', onNativeDbl, true)
    document.removeEventListener('gesturestart', noGesture)
    document.removeEventListener('gesturechange', noGesture)
  }
}
