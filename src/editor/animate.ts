import { Point, StaticCanvas, type FabricObject } from 'fabric'
import { resolveAssets } from './assets'
import { ensureFonts } from './core'
import { Video } from './video'
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
  /** このページの動画(なければ空) */
  videos: Video[]
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
  const videos = items.map((i) => i.obj).filter((o): o is Video => o instanceof Video)
  return { el, canvas, anim, duration: anim.duration ?? DEFAULT_DURATION, w, h, items, videos, dispose: () => { videos.forEach((v) => v.dispose()); canvas.dispose() } }
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
// 音声を入れるときは音声のコーデックも指定して選ぶ(指定なしだと音声トラックを持てない形式になることがあるため)
const CANDIDATES_AUDIO: [string, 'mp4' | 'webm'][] = [
  ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'mp4'], ['video/mp4;codecs=avc1,mp4a.40.2', 'mp4'], ['video/mp4;codecs=avc1.42E01E,opus', 'mp4'],
  ['video/webm;codecs=vp9,opus', 'webm'], ['video/webm;codecs=vp8,opus', 'webm'], ['video/webm', 'webm'],
]
export function pickVideoMime(withAudio = false): { mime: string; ext: 'mp4' | 'webm' } | null {
  if (typeof MediaRecorder === 'undefined') return null
  for (const [mime, ext] of withAudio ? CANDIDATES_AUDIO : CANDIDATES) if (MediaRecorder.isTypeSupported(mime)) return { mime, ext }
  return null
}

/** ページ JSON に動画が含まれるか(グループの中も見る) */
export function jsonHasVideo(json: any): boolean {
  const walk = (o: any): boolean => !!o && (o.type === 'Video' || (Array.isArray(o.objects) && o.objects.some(walk)))
  return walk({ objects: json?.objects })
}
export function docHasVideo(doc: DesignDoc) { return doc.pages.some((p) => jsonHasVideo(p.json)) }

/** 全ページを順にアニメーション再生しながら録画する。実時間かかる(タブは前面のままにする)。
 *  動画は各ページの頭から trimStart で再生し、音声(BGM と、ミュートしていない動画の音)を映像に足す。
 *  fitVideo: ページの長さを「pageSeconds」と「そのページの動画の長さ(ループなし)」の長い方にする */
export async function exportVideo(
  doc: DesignDoc,
  opts: { pageSeconds: number; fps?: number; scale?: number; fitVideo?: boolean; onProgress?: (r: number) => void },
): Promise<{ blob: Blob; ext: 'mp4' | 'webm'; hasAudio: boolean }> {
  const needAudio = !!doc.audio || docHasVideo(doc)
  const picked = pickVideoMime(needAudio) ?? pickVideoMime(false)
  if (!picked) throw new Error('このブラウザは動画の録画に対応していません')
  const fps = opts.fps ?? 30
  const s = Math.min(opts.scale ?? 1, MAX_SIDE / Math.max(doc.width, doc.height))
  const W = even(doc.width * s), H = even(doc.height * s)
  const rec = document.createElement('canvas')
  rec.width = W; rec.height = H
  const ctx = rec.getContext('2d')!
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H)

  const stream = rec.captureStream(fps)
  // 音声: BGM と動画の音を 1 つの出力(MediaStreamAudioDestinationNode)に混ぜて、映像のストリームにトラックとして足す
  let actx: AudioContext | null = null
  let dest: MediaStreamAudioDestinationNode | null = null
  let bgm: { src: AudioBufferSourceNode; gain: GainNode; vol: number; fadeOut: number } | null = null
  if (needAudio && typeof AudioContext !== 'undefined') {
    actx = new AudioContext()
    await actx.resume().catch(() => {})
    dest = actx.createMediaStreamDestination()
    dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t))
    if (doc.audio) {
      const { getAssetBlob } = await import('./assets')
      const blob = await getAssetBlob(doc.audio.assetId)
      if (blob) {
        try {
          const buf = await actx.decodeAudioData(await blob.arrayBuffer())
          const src = actx.createBufferSource()
          src.buffer = buf
          const start = doc.audio.start >= 0 && doc.audio.start < buf.duration - 0.1 ? doc.audio.start : 0
          src.loop = true; src.loopStart = start; src.loopEnd = buf.duration // 動画より短い曲は繰り返す
          const gain = actx.createGain()
          src.connect(gain).connect(dest)
          bgm = { src, gain, vol: Math.max(0, Math.min(1, doc.audio.volume ?? 1)), fadeOut: Math.max(0, doc.audio.fadeOut ?? 0) }
          const fi = Math.max(0, doc.audio.fadeIn ?? 0), t0 = actx.currentTime
          gain.gain.setValueAtTime(fi > 0 ? 0 : bgm.vol, t0)
          if (fi > 0) gain.gain.linearRampToValueAtTime(bgm.vol, t0 + fi)
          src.start(t0, start)
        } catch { /* デコードできない音源は入れない */ }
      }
    }
  }
  const hasAudioTrack = stream.getAudioTracks().length > 0
  const recorder = new MediaRecorder(stream, { mimeType: picked.mime, videoBitsPerSecond: Math.round(W * H * fps * 0.15) })
  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
  const stopped = new Promise<void>((res) => { recorder.onstop = () => res() })

  const n = doc.pages.length
  const mk = (i: number) => { const p = loadScene(doc.pages[i].json, doc.width, doc.height, s); p.catch(() => {}); return p }
  let next = mk(0)
  let doneTime = 0
  recorder.start(500)
  try {
    for (let i = 0; i < n; i++) {
      const scene = await next
      if (i + 1 < n) next = mk(i + 1) // 次ページはこのページの再生中に読み込む
      // 動画に合わせても 1 ページ最大 60 秒(実時間で録画するので、長い動画で終わらなくならないように)
      const MAX_PAGE_SEC = 60
      const clipLens = scene.videos.filter((v) => !v.loop).map((v) => v.clipLength).filter((x) => Number.isFinite(x))
      const want = opts.fitVideo ? Math.max(opts.pageSeconds, ...clipLens) : opts.pageSeconds
      const pageSec = Math.min(MAX_PAGE_SEC, Number.isFinite(want) && want > 0 ? want : 3)
      scene.duration = Math.min(scene.duration, pageSec * 0.7)
      try {
        // 動画: 音を混ぜ出力につなぎ、trimStart から再生する
        for (const v of scene.videos) {
          const el = v.video
          if (!el || v.broken) continue
          if (actx && dest && !v.muted) {
            try {
              const g = actx.createGain()
              g.gain.value = Math.max(0, Math.min(1, v.volume ?? 1))
              actx.createMediaElementSource(el).connect(g).connect(dest)
            } catch { /* つなげない動画は無音で録る */ }
          }
          await v.play({ sound: !v.muted, exporting: true })
        }
        renderAnimationFrame(scene, 0)
        ctx.drawImage(scene.el, 0, 0, W, H)
        const t0 = performance.now()
        if (bgm && actx && i === n - 1 && bgm.fadeOut > 0) { // 最後のページの長さが決まったので、BGM のフェードアウトを予約する
          const endT = actx.currentTime + pageSec
          bgm.gain.gain.setValueAtTime(bgm.vol, Math.max(actx.currentTime, endT - bgm.fadeOut))
          bgm.gain.gain.linearRampToValueAtTime(0, endT)
        }
        const rest = (n - i - 1) * opts.pageSeconds
        for (;;) {
          const el = (performance.now() - t0) / 1000
          if (el >= pageSec) break
          scene.videos.forEach((v) => v.enforceRange())
          renderAnimationFrame(scene, el)
          ctx.drawImage(scene.el, 0, 0, W, H)
          opts.onProgress?.((doneTime + el) / (doneTime + pageSec + rest))
          await new Promise((r) => setTimeout(r, 1000 / fps))
        }
        doneTime += pageSec
      } finally { scene.dispose() }
    }
    opts.onProgress?.(1)
    await new Promise((r) => setTimeout(r, 1000 / fps + 50)) // 最後のフレームが録画に入るのを待つ
  } finally {
    if (recorder.state !== 'inactive') recorder.stop()
    await stopped
    stream.getTracks().forEach((t) => t.stop())
    try { bgm?.src.stop() } catch { /* 既に止まっている */ }
    actx?.close().catch(() => {})
  }
  return { blob: new Blob(chunks, { type: picked.mime.split(';')[0] }), ext: picked.ext, hasAudio: hasAudioTrack }
}
