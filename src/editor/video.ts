// 動画オブジェクト。FabricImage を継承し、要素に HTMLVideoElement を使う。
// 動画ファイルは素材庫(IndexedDB)に Blob で置き、assetId で参照する(画像と同じ。canvas を汚さない)。
// 普段は trimStart のコマで止めておき、再生中だけ requestAnimationFrame で描き直す。
import { FabricImage, classRegistry } from 'fabric'
import { getAssetURL } from './assets'

export interface VideoCredit { author?: string; authorUrl?: string; pageUrl?: string; source: string }

/** 要素が指定の時刻へ移動し終えるのを待つ */
export function seekElement(el: HTMLVideoElement, t: number): Promise<void> {
  const target = Math.max(0, t)
  if (Math.abs(el.currentTime - target) < 0.001 && el.readyState >= 2) return Promise.resolve()
  return new Promise((res) => {
    let done = false
    const fin = () => { if (done) return; done = true; el.removeEventListener('seeked', fin); res() }
    el.addEventListener('seeked', fin)
    setTimeout(fin, 2500) // seeked が来ない形式でも止まらない
    try { el.currentTime = target } catch { fin() }
  })
}

/** Blob URL から動画要素を作り、最初のコマが使える状態まで待つ */
export async function loadVideoElement(url: string): Promise<HTMLVideoElement> {
  const el = document.createElement('video')
  el.playsInline = true
  el.preload = 'auto'
  el.muted = true // 読み込み中は音を出さない(再生時に設定し直す)
  await new Promise<void>((res, rej) => {
    const ok = () => { cleanup(); res() }
    const ng = () => { cleanup(); rej(new Error('この動画は読み込めませんでした(ブラウザが再生できない形式かもしれません)')) }
    const cleanup = () => { el.removeEventListener('loadeddata', ok); el.removeEventListener('error', ng) }
    el.addEventListener('loadeddata', ok)
    el.addEventListener('error', ng)
    setTimeout(ng, 20000)
    el.src = url
    el.load()
  })
  // fabric は要素の width/height(属性)を読んで描くので、動画の実サイズを入れておく(0 のままだと何も描かれない)
  el.width = el.videoWidth; el.height = el.videoHeight
  // MediaRecorder で作った webm などは長さが無限大と報告される。末尾まで一度シークして実際の長さを取る
  if (el.duration === Infinity) {
    await new Promise<void>((res) => {
      const fin = () => { el.removeEventListener('durationchange', chk); el.removeEventListener('timeupdate', chk); res() }
      const chk = () => { if (isFinite(el.duration)) fin() }
      el.addEventListener('durationchange', chk)
      el.addEventListener('timeupdate', chk)
      setTimeout(fin, 3000)
      el.currentTime = 1e101
    })
    await seekElement(el, 0)
  }
  return el
}

function placeholder(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const x = c.getContext('2d')!
  x.fillStyle = '#27272a'; x.fillRect(0, 0, w, h)
  x.fillStyle = '#a1a1aa'; x.font = `${Math.round(h / 12)}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'
  x.fillText('動画を読み込めません', w / 2, h / 2)
  return c
}

const VIDEO_PROPS = ['assetId', 'trimStart', 'trimEnd', 'loop', 'muted', 'volume', 'credit']

export class Video extends FabricImage {
  static type = 'Video'
  declare assetId?: string
  /** 開始位置(秒) */
  declare trimStart: number
  /** 終了位置(秒)。0 なら最後まで */
  declare trimEnd: number
  declare loop: boolean
  declare muted: boolean
  declare volume: number
  declare credit?: VideoCredit
  private _raf = 0
  private _timer = 0
  private _playing = false
  private _svg = false
  /** プレースホルダー(読み込めなかった動画)か */
  broken = false

  get video(): HTMLVideoElement | null { const e = this.getElement(); return e instanceof HTMLVideoElement ? e : null }
  get isPlaying() { return this._playing }

  /** 元動画の長さ(秒) */
  get sourceDuration(): number { const v = this.video; return v && isFinite(v.duration) ? v.duration : 0 }
  start(): number { return Math.max(0, Math.min(this.trimStart ?? 0, this.sourceDuration || Infinity)) }
  end(): number {
    const d = this.sourceDuration
    const e = this.trimEnd > 0 ? this.trimEnd : d
    return d ? Math.min(e, d) : e
  }
  /** トリミング後の長さ(秒) */
  get clipLength() { return Math.max(0, this.end() - this.start()) }

  // 保存するのは参照だけ。一時 URL の src は保存しない
  getSrc() { return this._svg ? this.frameDataURL() : '' }
  toObject(propertiesToInclude: any[] = []): any {
    const o: any = super.toObject([...VIDEO_PROPS, ...propertiesToInclude] as any)
    delete o.src
    return o
  }
  /** SVG には今のコマを画像として入れる */
  _toSVG(): string[] {
    this._svg = true
    try { return super._toSVG() } finally { this._svg = false }
  }
  frameDataURL(): string {
    const v = this.video
    if (!v || !v.videoWidth) return ''
    const c = document.createElement('canvas')
    c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d')!.drawImage(v, 0, 0)
    return c.toDataURL('image/jpeg', 0.9)
  }

  /** 最初のコマ(trimStart)に戻して表示する */
  async showStart() {
    const v = this.video
    if (!v) return
    this.pause()
    await seekElement(v, this.start())
    this.redraw()
  }
  async seekTo(t: number) {
    const v = this.video
    if (!v) return
    await seekElement(v, t)
    this.redraw()
  }
  redraw() {
    this.dirty = true
    this.canvas?.requestRenderAll()
  }

  /** 再生(trimStart から。終端まで来ていれば頭から)。unmute=false なら音を出さない */
  async play(opts: { sound?: boolean; exporting?: boolean } = {}) {
    const v = this.video
    if (!v || this.broken) return
    const sound = opts.sound !== false
    if (v.currentTime < this.start() - 0.05 || v.currentTime >= this.end() - 0.05) await seekElement(v, this.start())
    v.loop = false
    v.muted = this.muted || !sound
    v.volume = opts.exporting ? 1 : Math.max(0, Math.min(1, this.volume ?? 1)) // 書き出しでは音量をゲインで掛ける
    try { await v.play() } catch { return }
    this._playing = true
    if (opts.exporting) return // 書き出しは呼び出し側が毎コマ描く
    const tick = () => {
      if (!this._playing) return
      this.enforceRange()
      this.redraw()
      this._raf = requestAnimationFrame(tick)
    }
    cancelAnimationFrame(this._raf)
    this._raf = requestAnimationFrame(tick)
    this.scheduleEnd()
  }
  /** 終了位置の時刻に確実に止める(画面が隠れて requestAnimationFrame が止まっても守る) */
  private scheduleEnd() {
    clearTimeout(this._timer)
    const v = this.video
    if (!v || !this._playing) return
    this._timer = window.setTimeout(() => {
      if (!this._playing) return
      this.enforceRange()
      if (this._playing) this.scheduleEnd()
    }, Math.max(20, (this.end() - v.currentTime) * 1000 + 10))
  }
  pause() {
    this._playing = false
    clearTimeout(this._timer)
    cancelAnimationFrame(this._raf)
    this.video?.pause()
  }
  /** 終了位置を超えたらループまたは停止する(再生中に毎コマ呼ぶ) */
  enforceRange() {
    const v = this.video
    if (!v || v.paused && !this._playing) return
    if (v.currentTime >= this.end() - 0.03 || v.ended) {
      if (this.loop) { v.currentTime = this.start(); if (v.paused) void v.play().catch(() => {}) }
      else { v.pause(); this._playing = false; cancelAnimationFrame(this._raf); clearTimeout(this._timer) }
    }
  }
  dispose() {
    this.pause()
    const v = this.video
    if (v) { v.removeAttribute('src'); v.load() }
    super.dispose?.()
  }

  static async fromObject(object: any) {
    const { type: _t, src, filters: _f, resizeFilter: _r, crossOrigin: _c, ...rest } = object
    const url = rest.assetId ? await getAssetURL(rest.assetId) : (typeof src === 'string' && src.startsWith('blob:') ? src : null)
    let el: HTMLVideoElement | HTMLCanvasElement
    let broken = false
    try {
      if (!url) throw new Error('missing')
      el = await loadVideoElement(url)
    } catch {
      el = placeholder(rest.width || 640, rest.height || 360)
      broken = true
    }
    const v = new Video(el, { ...rest })
    v.broken = broken
    if (!broken) {
      const vid = el as HTMLVideoElement
      if (v.trimStart == null) v.trimStart = 0
      await seekElement(vid, v.start())
    }
    return v
  }
}
Video.prototype.trimStart = 0
Video.prototype.trimEnd = 0
Video.prototype.loop = false
Video.prototype.muted = false
Video.prototype.volume = 1
classRegistry.setClass(Video)

/** 新しい動画オブジェクトを Blob URL から作る */
export async function createVideo(url: string, assetId: string): Promise<Video> {
  const el = await loadVideoElement(url)
  await seekElement(el, 0)
  return new Video(el, { assetId, width: el.videoWidth, height: el.videoHeight } as any)
}

/** 動画の中身を読んで長さ・サイズを返す(取り込み前の確認用) */
export async function probeVideo(blob: Blob): Promise<{ duration: number; width: number; height: number }> {
  const url = URL.createObjectURL(blob)
  try {
    const el = await loadVideoElement(url)
    return { duration: el.duration, width: el.videoWidth, height: el.videoHeight }
  } finally { URL.revokeObjectURL(url) }
}
