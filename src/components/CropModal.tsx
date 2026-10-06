import { FabricImage } from 'fabric'
import { useEffect, useRef, useState } from 'react'
import type { EditorCore } from '../editor/core'

/** 画像のトリミング。元画像の上で切り抜く範囲(元画像の px)をドラッグで決める */
export function CropModal({ ed, img, onClose }: { ed: EditorCore; img: FabricImage; onClose: () => void }) {
  const el = img.getElement() as HTMLImageElement
  const nw = el.naturalWidth || el.width, nh = el.naturalHeight || el.height
  const view = Math.min(560 / nw, 420 / nh)
  const framed = !!(img as any).frame
  const [r, setR] = useState({ x: img.cropX ?? 0, y: img.cropY ?? 0, w: img.width, h: img.height })
  const drag = useRef<{ mode: string; sx: number; sy: number; r: typeof r } | null>(null)
  const ratio = framed ? img.width / img.height : null // フレーム内は枠の比率を保つ

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current
      if (!d) return
      const dx = (e.clientX - d.sx) / view, dy = (e.clientY - d.sy) / view
      let { x, y, w, h } = d.r
      if (d.mode === 'move') { x += dx; y += dy }
      else {
        if (d.mode.includes('e')) w += dx
        if (d.mode.includes('s')) h += dy
        if (d.mode.includes('w')) { x += dx; w -= dx }
        if (d.mode.includes('n')) { y += dy; h -= dy }
        if (ratio) { if (d.mode.includes('n') || d.mode.includes('s')) w = h * ratio; else h = w / ratio }
      }
      w = Math.max(20, Math.min(w, nw)); h = Math.max(20, Math.min(h, nh))
      if (ratio) { if (w / h > ratio) w = h * ratio; else h = w / ratio }
      x = Math.max(0, Math.min(x, nw - w)); y = Math.max(0, Math.min(y, nh - h))
      setR({ x, y, w, h })
    }
    const up = () => { drag.current = null }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
  }, [view, nw, nh, ratio])

  const start = (mode: string) => (e: React.PointerEvent) => { e.preventDefault(); e.stopPropagation(); drag.current = { mode, sx: e.clientX, sy: e.clientY, r } }
  const apply = async () => {
    // 見た目の大きさ(画面上の幅)は保ち、切り抜き範囲だけ変える
    const shownW = img.getScaledWidth()
    const s = framed ? shownW / r.w : img.scaleX
    const oldCx = img.cropX ?? 0, oldCy = img.cropY ?? 0
    img.set({
      cropX: r.x, cropY: r.y, width: r.w, height: r.h, scaleX: s, scaleY: s,
      left: framed ? img.left : img.left + (r.x - oldCx) * img.scaleX, top: framed ? img.top : img.top + (r.y - oldCy) * img.scaleY,
    })
    if (framed) {
      const { frameShape } = await import('../editor/elements')
      img.clipPath = frameShape((img as any).frame, r.w, r.h)
    } else if (img.clipPath) {
      img.clipPath.set({ width: r.w, height: r.h })
    }
    img.setCoords()
    ed.canvas.requestRenderAll()
    ed.commit()
    onClose()
  }
  const reset = () => setR(ratio ? (() => { const w = Math.min(nw, nh * ratio), h = w / ratio; return { x: (nw - w) / 2, y: (nh - h) / 2, w, h } })() : { x: 0, y: 0, w: nw, h: nh })
  const H = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w']
  return (
    <div className="modal-back" onPointerDown={onClose}>
      <div className="modal" onPointerDown={(e) => e.stopPropagation()}>
        <h3>トリミング{framed ? '(フレーム内の位置と大きさ)' : ''}</h3>
        <div className="crop-area" style={{ width: nw * view, height: nh * view }}>
          <img src={el.src} alt="" style={{ width: nw * view, height: nh * view }} draggable={false} />
          <div className="crop-dim" style={{ clipPath: `polygon(0 0,100% 0,100% 100%,0 100%,0 0, ${r.x * view}px ${r.y * view}px, ${r.x * view}px ${(r.y + r.h) * view}px, ${(r.x + r.w) * view}px ${(r.y + r.h) * view}px, ${(r.x + r.w) * view}px ${r.y * view}px, ${r.x * view}px ${r.y * view}px)` }} />
          <div className="crop-box" style={{ left: r.x * view, top: r.y * view, width: r.w * view, height: r.h * view }} onPointerDown={start('move')}>
            {H.map((h) => <span key={h} className={'crop-h ' + h} onPointerDown={start(h)} />)}
          </div>
        </div>
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
          <button className="chip" onClick={reset}>リセット</button>
          <button className="chip" onClick={onClose}>キャンセル</button>
          <button className="primary-btn" onClick={apply}>完了</button>
        </div>
      </div>
    </div>
  )
}
