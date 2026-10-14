// 動画・音楽の素材検索と、BGM の再生。
// 出典(2026-10-14 に確認): 商用利用できるものだけ。CC BY はクレジット必須、CC BY-SA・NC・ND は使わない。
//  - 音楽・効果音: Openverse audio(キー不要)。配信元は Jamendo と Freesound。どちらも CORS で fetch できる
//  - 動画: Wikimedia Commons(CC0・パブリックドメインのみ)。upload.wikimedia.org は CORS 可
//  - NASA の動画ファイルは CORS ヘッダーが無くブラウザから取れないので使わない
import { getAssetURL } from '../editor/assets'
import type { DesignAudio } from '../editor/types'

const strip = (h: string) => { const d = new DOMParser().parseFromString(h ?? '', 'text/html'); return (d.body.textContent ?? '').replace(/\s+/g, ' ').trim() }
const isJa = (q: string) => /[぀-ヿ一-鿿]/.test(q)

let jaDict: Record<string, string[]> | null = null
export async function toEnglish(q: string): Promise<string> {
  if (!isJa(q)) return q
  try {
    if (!jaDict) { const m: any = await import('../data/icon-ja'); jaDict = (m.ICON_JA ?? m.JA_DICT ?? m.default ?? {}) as Record<string, string[]> }
    const hit = jaDict[q.trim()]
    if (hit?.length) return hit[0]
  } catch { /* 辞書が無ければそのまま */ }
  return q
}

export const MAX_FETCH_BYTES = 100 * 1024 * 1024

/** URL から Blob を取る(素材庫に置くため。CORS で取れなければ例外) */
export async function fetchBlob(url: string, maxBytes = MAX_FETCH_BYTES): Promise<Blob> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`取得できませんでした(${r.status})`)
  const len = Number(r.headers.get('content-length') ?? 0)
  if (len > maxBytes) throw new Error(`ファイルが大きすぎます(${Math.round(len / 1048576)}MB)`)
  const b = await r.blob()
  if (b.size > maxBytes) throw new Error(`ファイルが大きすぎます(${Math.round(b.size / 1048576)}MB)`)
  return b
}

// ---------------- 動画: Wikimedia Commons ----------------
export interface VideoHit {
  id: string; thumb: string; url: string; mime: string; w: number; h: number; duration: number; estBytes: number
  title: string; credit: { author?: string; authorUrl?: string; pageUrl?: string; source: string }
}

/** 取り込む版を選ぶ: 変換済みの webm(VP9)のうち、高さ 1080 以下で見積もり 40MB 以下の最大。なければ元ファイル */
function pickDerivative(vi: any): { url: string; w: number; h: number; est: number; mime: string } | null {
  const dur = vi.duration || 0
  const ders: any[] = (vi.derivatives ?? []).filter((d: any) => /^video\/webm/.test(d.type) && d.transcodekey)
  const cands = ders.map((d) => ({ url: d.src as string, w: d.width as number, h: d.height as number, est: ((d.bandwidth ?? 0) / 8) * dur, mime: 'video/webm' }))
    .filter((d) => d.h <= 1080 && d.est <= 40 * 1048576).sort((a, b) => b.h - a.h)
  if (cands.length) return cands[0]
  if (vi.size && vi.size <= 40 * 1048576 && /^video\/(webm|mp4)$/.test(vi.mime)) return { url: vi.url, w: vi.width, h: vi.height, est: vi.size, mime: vi.mime }
  return null
}

export async function searchCommonsVideos(q: string, page: number): Promise<VideoHit[]> {
  const term = (await toEnglish(q)).trim() || 'nature'
  const url = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({
    origin: '*', action: 'query', format: 'json', generator: 'search', gsrnamespace: '6',
    gsrsearch: `${term} filetype:video haslicense:unrestricted`, gsrlimit: '30', gsroffset: String((page - 1) * 30),
    prop: 'videoinfo', viprop: 'derivatives|url|size|mime|extmetadata', viurlwidth: '400',
  })
  const r = await fetch(url)
  if (!r.ok) throw new Error(`検索に失敗しました(${r.status})`)
  const j = await r.json()
  const pages: any[] = Object.values(j.query?.pages ?? {}).sort((a: any, b: any) => a.index - b.index)
  const out: VideoHit[] = []
  for (const p of pages) {
    const vi = p.videoinfo?.[0]
    if (!vi) continue
    const lic = String(vi.extmetadata?.LicenseShortName?.value ?? '')
    if (!/^(cc0|cc[- ]zero|public domain|pd\b)/i.test(lic)) continue // CC BY・CC BY-SA 等は入れない
    const d = pickDerivative(vi)
    if (!d) continue // 大きすぎる動画は一覧に出さない
    out.push({
      id: 'wv_' + p.pageid, thumb: vi.thumburl, url: d.url, mime: d.mime, w: d.w, h: d.h, duration: vi.duration ?? 0, estBytes: d.est,
      title: String(p.title ?? '').replace(/^File:/, '').replace(/\.\w+$/, ''),
      credit: { author: strip(vi.extmetadata?.Artist?.value) || undefined, pageUrl: vi.descriptionurl, source: `Wikimedia Commons(${lic})` },
    })
  }
  return out
}

/** Pexels 動画(サーバーの中継。PEXELS_API_KEY が無い環境では 501) */
export async function searchPexelsVideos(q: string, page: number): Promise<VideoHit[]> {
  const r = await fetch(`/api/videos/search?q=${encodeURIComponent(q)}&page=${page}`, { credentials: 'same-origin' })
  if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error ?? `検索に失敗しました(${r.status})`)
  const j = await r.json()
  return (j.results ?? []).map((x: any): VideoHit => ({
    id: x.id, thumb: x.thumb, url: x.url, mime: 'video/mp4', w: x.w, h: x.h, duration: x.duration ?? 0, estBytes: 0, title: '',
    credit: { author: x.author, authorUrl: x.authorUrl, pageUrl: x.pageUrl, source: 'Pexels' },
  }))
}

// ---------------- 音楽: Openverse audio ----------------
export interface AudioHit {
  id: string; title: string; url: string; creator: string; license: string; licenseLabel: string; duration: number
  pageUrl?: string; provider: string; thumb?: string; attribution: boolean
}

/** 商用利用できて改変の条件が付かないものだけ(CC0・PDM・CC BY)。BY-SA・NC・ND は除く */
const AUDIO_LICENSES = 'cc0,pdm,by'

export async function searchOpenverseAudio(q: string, page: number, kind: 'music' | 'sound_effect'): Promise<AudioHit[]> {
  const term = (await toEnglish(q)).trim() || (kind === 'music' ? 'ambient' : 'click')
  const u = `https://api.openverse.org/v1/audio/?q=${encodeURIComponent(term)}&license=${AUDIO_LICENSES}&category=${kind}&page_size=20&page=${page}`
  const r = await fetch(u)
  if (!r.ok) throw new Error(`検索に失敗しました(${r.status})`)
  const j = await r.json()
  const out: AudioHit[] = []
  for (const x of j.results ?? []) {
    const lic = String(x.license ?? '').toLowerCase()
    if (!['cc0', 'pdm', 'by'].includes(lic) || !x.url) continue // 念のためこちらでも絞る
    out.push({
      id: 'ova_' + x.id, title: x.title ?? '(無題)', url: x.url, creator: x.creator ?? '不明', license: lic,
      licenseLabel: lic === 'by' ? `CC BY ${x.license_version ?? ''}`.trim() : lic === 'cc0' ? 'CC0' : 'パブリックドメイン',
      duration: (x.duration ?? 0) / 1000, pageUrl: x.foreign_landing_url ?? undefined, provider: x.provider ?? x.source ?? 'Openverse',
      thumb: x.thumbnail ?? undefined, attribution: lic === 'by',
    })
  }
  return out
}

export const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

// ---------------- BGM の再生(エディタ上部・プレゼン) ----------------
export class BgmPlayer {
  private el: HTMLAudioElement
  private timer = 0
  private t0 = 0
  private stopping = false
  playing = false
  onEnd?: () => void
  private audio: DesignAudio
  constructor(audio: DesignAudio, url: string) {
    this.audio = audio
    this.el = new Audio(url)
    this.el.preload = 'auto'
  }
  static async create(audio: DesignAudio): Promise<BgmPlayer | null> {
    const url = await getAssetURL(audio.assetId)
    return url ? new BgmPlayer(audio, url) : null
  }
  get currentTime() { return this.el.currentTime }
  setAudio(a: DesignAudio) { this.audio = a }
  setVolume(v: number) { this.audio.volume = v; if (!this.timer) this.el.volume = Math.max(0, Math.min(1, v)) }
  /** 曲の start から、フェードインしながら流す。曲の終わりに来たら start に戻って繰り返す */
  async play() {
    this.stopping = false
    const a = this.audio
    const dur = this.el.duration
    const start = a.start >= 0 && (!isFinite(dur) || a.start < dur - 0.1) ? a.start : 0
    if (this.el.currentTime < start || this.el.ended) this.el.currentTime = start
    this.el.loop = false
    this.el.volume = a.fadeIn > 0 ? 0 : Math.max(0, Math.min(1, a.volume))
    try { await this.el.play() } catch { return }
    this.playing = true
    this.t0 = performance.now()
    const tick = () => {
      if (!this.playing) return
      const t = (performance.now() - this.t0) / 1000
      if (!this.stopping) this.el.volume = Math.max(0, Math.min(1, a.volume * (a.fadeIn > 0 ? Math.min(1, t / a.fadeIn) : 1)))
      if (this.el.ended || (isFinite(this.el.duration) && this.el.currentTime >= this.el.duration - 0.05)) { this.el.currentTime = start; void this.el.play().catch(() => {}) }
    }
    clearInterval(this.timer)
    this.timer = window.setInterval(tick, 50) // 画面が隠れても止まらないよう、requestAnimationFrame は使わない
  }
  /** フェードアウトしてから止める(fade=false なら即停止) */
  stop(fade = true): Promise<void> {
    const a = this.audio
    if (!this.playing) return Promise.resolve()
    if (!fade || !(a.fadeOut > 0)) { this.halt(); return Promise.resolve() }
    this.stopping = true
    const v0 = this.el.volume, t0 = performance.now()
    return new Promise((res) => {
      const step = () => {
        const k = Math.min(1, (performance.now() - t0) / 1000 / a.fadeOut)
        this.el.volume = v0 * (1 - k)
        if (k >= 1 || !this.playing) { this.halt(); res() } else setTimeout(step, 30)
      }
      step()
    })
  }
  private halt() {
    this.playing = false
    clearInterval(this.timer); this.timer = 0
    this.el.pause()
  }
  dispose() { this.halt(); this.el.removeAttribute('src'); this.el.load() }
}

// ---------------- 共同編集への通知 ----------------
import { toast } from 'sonner'
let collabActive = false
/** エディタが共同編集につながっているかを知らせる(つながっている間だけ共有の可否を通知する) */
export function setMediaCollab(on: boolean) { collabActive = on }
export function notifyCollabProblem(problem: string | null, what = 'この素材') {
  if (collabActive && problem) toast.warning(`${what}は共同編集では共有できません: ${problem}`)
}
export function notifyCollabAudio() {
  if (collabActive) toast.info('BGM は共同編集では共有されません(自分の画面だけで流れます)')
}
