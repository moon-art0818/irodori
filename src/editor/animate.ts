import { Point, StaticCanvas, type FabricObject } from 'fabric'
import { resolveAssets } from './assets'
import { ensureFonts } from './core'
import { DEFAULT_DURATION, elementProgress, elementState } from './animateMath'
import type { DesignDoc, PageAnimation } from './types'

export { ANIMATIONS, DEFAULT_DURATION, elementProgress, elementState } from './animateMath'

interface Base { opacity: number; left: number; top: number; scaleX: number; scaleY: number; center: Point; text: string | null }

export interface AnimScene {
  /** 描画先。呼び出し側が DOM に差し込むか drawImage の元にする */
  el: HTMLCanvasElement
  canvas: StaticCanvas
  anim: PageAnimation
  /** 登場にかかる秒数(書き換え可) */
  duration: number
  /** デザイン上のサイズ */
  w: number
  h: number
  items: { obj: FabricObject; base: Base }[]
  dispose(): void
}

/** ページ JSON を読み込み、元の値を保存したシーンを作る。scale は画面ピクセル/デザインピクセル */
export async function loadScene(json: any, w: number, h: number, scale = 1): Promise<AnimScene> {
  const el = document.createElement('canvas')
  const canvas = new StaticCanvas(el, { width: Math.round(w * scale), height: Math.round(h * scale), enableRetinaScaling: false, renderOnAddRemove: false })
  try {
    canvas.setZoom(scale)
    await ensureFonts(json)
    await canvas.loadFromJSON(await resolveAssets(json))
    if (!canvas.backgroundColor) canvas.backgroundColor = '#ffffff'
  } catch (e) { canvas.dispose(); throw e }
  const items = canvas.getObjects().map((obj) => ({
    obj,
    base: {
      opacity: obj.opacity ?? 1, left: obj.left, top: obj.top, scaleX: obj.scaleX, scaleY: obj.scaleY,
      center: obj.getCenterPoint(), text: typeof (obj as any).text === 'string' ? (obj as any).text as string : null,
    },
  }))
  const anim: PageAnimation = json.animation ?? { preset: 'none' }
  return { el, canvas, anim, duration: anim.duration ?? DEFAULT_DURATION, w, h, items, dispose: () => canvas.dispose() }
}

/** 画面ピクセル/デザインピクセルの倍率を変える(リサイズ用)。次の renderAnimationFrame で反映される */
export function resizeScene(scene: AnimScene, scale: number) {
  const { w, h } = scene
  scene.canvas.setDimensions({ width: Math.round(w * scale), height: Math.round(h * scale) })
  scene.canvas.setZoom(scale)
}

/** 時刻 t(秒)の見た目を描く。毎回「元の値」から計算するので、何度・どの順で呼んでも誤差が溜まらない */
export function renderAnimationFrame(scene: AnimScene, t: number) {
  const { w, h } = scene
  const n = scene.items.length
  const preset = scene.anim.preset
  scene.items.forEach(({ obj, base }, i) => {
    const p = preset === 'none' ? 1 : elementProgress(t, i, n, scene.duration)
    const st = elementState(preset, p, { isText: base.text !== null, textLen: base.text?.length ?? 0, w, h })
    obj.set({ opacity: base.opacity * st.opacity })
    if (base.text !== null && st.chars < base.text.length) (obj as any).set({ text: base.text.slice(0, st.chars) })
    else if (base.text !== null && (obj as any).text !== base.text) (obj as any).set({ text: base.text })
    if (st.scale === 1) {
      obj.set({ left: base.left + st.dx, top: base.top + st.dy, scaleX: base.scaleX, scaleY: base.scaleY })
    } else {
      obj.set({ scaleX: base.scaleX * st.scale, scaleY: base.scaleY * st.scale })
      obj.setPositionByOrigin(new Point(base.center.x + st.dx, base.center.y + st.dy), 'center', 'center')
    }
    obj.setCoords()
  })
  scene.canvas.renderAll()
}

// ---------------- 動画書き出し ----------------
const MAX_SIDE = 1920
const even = (n: number) => Math.max(2, Math.round(n / 2) * 2)
const CANDIDATES: [string, 'mp4' | 'webm'][] = [
  ['video/mp4;codecs=avc1.42E01E', 'mp4'], ['video/mp4;codecs=avc1', 'mp4'], ['video/mp4', 'mp4'],
  ['video/webm;codecs=vp9', 'webm'], ['video/webm;codecs=vp8', 'webm'], ['video/webm', 'webm'],
]
export function pickVideoMime(): { mime: string; ext: 'mp4' | 'webm' } | null {
  if (typeof MediaRecorder === 'undefined') return null
  for (const [mime, ext] of CANDIDATES) if (MediaRecorder.isTypeSupported(mime)) return { mime, ext }
  return null
}

/** 全ページを順にアニメーション再生しながら録画する。実時間かかる(タブは前面のままにする) */
export async function exportVideo(
  doc: DesignDoc,
  opts: { pageSeconds: number; fps?: number; scale?: number; onProgress?: (r: number) => void },
): Promise<{ blob: Blob; ext: 'mp4' | 'webm' }> {
  const picked = pickVideoMime()
  if (!picked) throw new Error('このブラウザは動画の録画に対応していません')
  const fps = opts.fps ?? 30
  const s = Math.min(opts.scale ?? 1, MAX_SIDE / Math.max(doc.width, doc.height))
  const W = even(doc.width * s), H = even(doc.height * s)
  const rec = document.createElement('canvas')
  rec.width = W; rec.height = H
  const ctx = rec.getContext('2d')!
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H)

  const stream = rec.captureStream(fps)
  const recorder = new MediaRecorder(stream, { mimeType: picked.mime, videoBitsPerSecond: Math.round(W * H * fps * 0.15) })
  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
  const stopped = new Promise<void>((res) => { recorder.onstop = () => res() })

  const n = doc.pages.length
  const total = n * opts.pageSeconds
  const mk = (i: number) => { const p = loadScene(doc.pages[i].json, doc.width, doc.height, s); p.catch(() => {}); return p }
  let next = mk(0)
  recorder.start(500)
  try {
    for (let i = 0; i < n; i++) {
      const scene = await next
      if (i + 1 < n) next = mk(i + 1) // 次ページはこのページの再生中に読み込む
      scene.duration = Math.min(scene.duration, opts.pageSeconds * 0.7)
      try {
        renderAnimationFrame(scene, 0)
        ctx.drawImage(scene.el, 0, 0, W, H)
        const t0 = performance.now()
        for (;;) {
          const el = (performance.now() - t0) / 1000
          if (el >= opts.pageSeconds) break
          renderAnimationFrame(scene, el)
          ctx.drawImage(scene.el, 0, 0, W, H)
          opts.onProgress?.((i * opts.pageSeconds + el) / total)
          await new Promise((r) => setTimeout(r, 1000 / fps))
        }
      } finally { scene.dispose() }
    }
    opts.onProgress?.(1)
    await new Promise((r) => setTimeout(r, 1000 / fps + 50)) // 最後のフレームが録画に入るのを待つ
  } finally {
    if (recorder.state !== 'inactive') recorder.stop()
    await stopped
    stream.getTracks().forEach((t) => t.stop())
  }
  return { blob: new Blob(chunks, { type: picked.mime.split(';')[0] }), ext: picked.ext }
}
