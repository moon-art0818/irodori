// 写真検索の中継(Unsplash / Pexels / Pixabay)。キーはサーバーだけが持つ。同じ検索は1時間(Pixabay は規約で24時間)キャッシュして回数枠を節約する
import type { PhotoResult, Providers } from '../src/api/contract'
import { googleEnabled } from './google'
import { HttpError, type Env, json, readJson } from './util'

const UTM = 'utm_source=irodori&utm_medium=referral'

const PIXABAY_TTL = 24 * 3600_000 // Pixabay の利用条件: 検索結果は24時間キャッシュする
const PIXABAY_MAX_BYTES = 100 * 1024 * 1024

/** 中継してよい Pixabay の URL か(https://cdn.pixabay.com/photo/... か /video/... だけ)。違えば null */
export function pixabayMediaUrl(raw: string): URL | null {
  if (typeof raw !== 'string' || raw.length > 600 || raw.includes('@') || raw.includes('\\') || /[\s\u0000-\u001f]/.test(raw)) return null
  let url: URL
  try { url = new URL(raw) } catch { return null }
  if (url.protocol !== 'https:' || url.hostname !== 'cdn.pixabay.com' || url.port || url.username || url.password) return null
  if (url.search || url.hash) return null
  if (!/^\/(photo|video)\/[A-Za-z0-9._\-/]+$/.test(url.pathname) || url.pathname.includes('..') || url.pathname.includes('//')) return null
  // 入力の文字列がそのまま正規化後の URL と同じこと(%2e などのすり抜け・ホストの書き換えを許さない)
  if (url.href !== raw) return null
  return url
}

const cacheGet = async (env: Env, key: string, ttl: number): Promise<Response | null> => {
  try {
    const hit = await env.BUCKET.get(key)
    if (hit && Date.now() - Number(hit.customMetadata?.at ?? 0) < ttl) return new Response(hit.body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
  } catch { /* キャッシュが使えなくても検索は続ける */ }
  return null
}

async function pixabayFetch(env: Env, kind: 'photos' | 'videos', q: string, page: number, perPage: number): Promise<any> {
  if (!env.PIXABAY_API_KEY) throw new HttpError(501, 'Pixabay はまだ設定されていません')
  const base = kind === 'videos' ? 'https://pixabay.com/api/videos/' : 'https://pixabay.com/api/'
  const r = await fetch(`${base}?key=${encodeURIComponent(env.PIXABAY_API_KEY)}&q=${encodeURIComponent(q)}&page=${page}&per_page=${perPage}&lang=ja&safesearch=true`)
  if (r.status === 429) throw new HttpError(429, 'Pixabay の利用回数の上限に達しました。しばらくしてからお試しください')
  if (!r.ok) throw new HttpError(502, `Pixabay の検索に失敗しました(${r.status})`)
  return r.json<any>()
}

const pixabayAuthorUrl = (name: unknown, id: unknown) => name && id ? `https://pixabay.com/users/${encodeURIComponent(String(name))}-${encodeURIComponent(String(id))}/` : 'https://pixabay.com'
const pixabayPage = (u: unknown) => typeof u === 'string' && /^https:\/\/pixabay\.com\//.test(u) ? u : 'https://pixabay.com'

export function providers(_req: Request, env: Env): Response {
  const p: Providers = { google: googleEnabled(env), unsplash: !!env.UNSPLASH_ACCESS_KEY, pexels: !!env.PEXELS_API_KEY, pixabay: !!env.PIXABAY_API_KEY }
  return json(p)
}

export async function searchPhotos(req: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
  const u = new URL(req.url)
  const provider = u.searchParams.get('provider')
  const q = (u.searchParams.get('q') ?? '').trim().slice(0, 100)
  const page = Math.max(1, Math.min(50, Number(u.searchParams.get('page')) || 1))
  if (!q) throw new HttpError(400, '検索語を入れてください')
  // 同じ検索は1時間 R2 に置いて使い回す(*.workers.dev では Cache API が効かないため)
  const key = `cache/photos/${provider}/${page}/${encodeURIComponent(q.toLowerCase()).slice(0, 300)}.json`
  const cached = await cacheGet(env, key, provider === 'pixabay' ? PIXABAY_TTL : 3600_000)
  if (cached) return cached

  let results: PhotoResult[]
  if (provider === 'unsplash') {
    if (!env.UNSPLASH_ACCESS_KEY) throw new HttpError(501, 'Unsplash はまだ設定されていません')
    const r = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&page=${page}&per_page=30&content_filter=high`, { headers: { Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}`, 'Accept-Version': 'v1' } })
    if (r.status === 403 || r.status === 429) throw new HttpError(429, 'Unsplash の利用回数の上限に達しました。しばらくしてからお試しください')
    if (!r.ok) throw new HttpError(502, `Unsplash の検索に失敗しました(${r.status})`)
    const j = await r.json<any>()
    results = (j.results ?? []).filter((p: any) => !p.premium && !p.plus).map((p: any) => ({ // 有料の Unsplash+ は除く
      id: 'us_' + p.id, provider: 'unsplash', thumb: p.urls?.small, url: p.urls?.regular, w: p.width, h: p.height,
      author: p.user?.name ?? '', authorUrl: `${p.user?.links?.html ?? 'https://unsplash.com'}?${UTM}`, pageUrl: `${p.links?.html ?? 'https://unsplash.com'}?${UTM}`,
      downloadLocation: p.links?.download_location,
    }))
  } else if (provider === 'pexels') {
    if (!env.PEXELS_API_KEY) throw new HttpError(501, 'Pexels はまだ設定されていません')
    const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&page=${page}&per_page=30&locale=ja-JP`, { headers: { Authorization: env.PEXELS_API_KEY } })
    if (r.status === 429) throw new HttpError(429, 'Pexels の利用回数の上限に達しました。しばらくしてからお試しください')
    if (!r.ok) throw new HttpError(502, `Pexels の検索に失敗しました(${r.status})`)
    const j = await r.json<any>()
    results = (j.photos ?? []).map((p: any) => ({
      id: 'px_' + p.id, provider: 'pexels', thumb: p.src?.medium, url: p.src?.large2x ?? p.src?.large, w: p.width, h: p.height,
      author: p.photographer ?? '', authorUrl: p.photographer_url ?? 'https://www.pexels.com', pageUrl: p.url ?? 'https://www.pexels.com',
    }))
  } else if (provider === 'pixabay') {
    const j = await pixabayFetch(env, 'photos', q, page, 30)
    results = (j.hits ?? []).flatMap((p: any): PhotoResult[] => {
      // 中継できるのは cdn.pixabay.com/photo だけ。largeImageURL が別ホストなら webformatURL に落とす
      const url = [p.largeImageURL, p.webformatURL].find((x) => typeof x === 'string' && pixabayMediaUrl(x))
      const thumb = [p.webformatURL, p.previewURL].find((x) => typeof x === 'string' && x.startsWith('https://'))
      if (!url || !thumb) return []
      return [{
        id: 'pb_' + p.id, provider: 'pixabay', thumb, url, w: p.imageWidth ?? p.webformatWidth ?? 1, h: p.imageHeight ?? p.webformatHeight ?? 1,
        author: p.user ?? '', authorUrl: pixabayAuthorUrl(p.user, p.user_id), pageUrl: pixabayPage(p.pageURL),
      }]
    })
  } else throw new HttpError(400, 'provider は unsplash・pexels・pixabay のどれかを指定してください')

  return putAndReturn(env, ctx, key, JSON.stringify({ results }))
}

/** Unsplash の「ダウンロード」通知(写真をデザインに置いたとき。Unsplash API ガイドラインの必須事項) */
export async function unsplashDownload(req: Request, env: Env): Promise<Response> {
  if (!env.UNSPLASH_ACCESS_KEY) throw new HttpError(501, 'Unsplash はまだ設定されていません')
  const { downloadLocation } = await readJson<{ downloadLocation?: string }>(req)
  let url: URL
  try { url = new URL(String(downloadLocation)) } catch { throw new HttpError(400, '不正な URL です') }
  if (url.protocol !== 'https:' || url.hostname !== 'api.unsplash.com' || !/^\/photos\/[\w-]{1,40}\/download$/.test(url.pathname)) throw new HttpError(400, '不正な URL です')
  await fetch(url.toString(), { headers: { Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}` } })
  return json({ ok: true })
}

/** Pexels 動画の検索(中継)。同じ検索は1時間キャッシュする。動画ファイルは mp4 のうち幅 1280 以下で最大のもの */
export async function searchVideos(req: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
  const u = new URL(req.url)
  const q = (u.searchParams.get('q') ?? '').trim().slice(0, 100)
  const page = Math.max(1, Math.min(50, Number(u.searchParams.get('page')) || 1))
  const provider = u.searchParams.get('provider') ?? 'pexels'
  if (provider !== 'pexels' && provider !== 'pixabay') throw new HttpError(400, 'provider は pexels か pixabay を指定してください')
  if (!q) throw new HttpError(400, '検索語を入れてください')
  if (provider === 'pexels' && !env.PEXELS_API_KEY) throw new HttpError(501, 'Pexels はまだ設定されていません')
  if (provider === 'pixabay' && !env.PIXABAY_API_KEY) throw new HttpError(501, 'Pixabay はまだ設定されていません')
  const key = `cache/videos/${provider}/${page}/${encodeURIComponent(q.toLowerCase()).slice(0, 300)}.json`
  const cached = await cacheGet(env, key, provider === 'pixabay' ? PIXABAY_TTL : 3600_000)
  if (cached) return cached
  if (provider === 'pixabay') {
    const j = await pixabayFetch(env, 'videos', q, page, 24)
    const results = (j.hits ?? []).flatMap((v: any) => {
      // medium → small → large → tiny の順で、中継できる mp4 があるものを使う
      const f = ['medium', 'small', 'large', 'tiny'].map((k) => v.videos?.[k]).find((x: any) => x && typeof x.url === 'string' && pixabayMediaUrl(x.url))
      if (!f || typeof f.thumbnail !== 'string' || !f.thumbnail.startsWith('https://')) return []
      return [{
        id: 'pbv_' + v.id, provider: 'pixabay', thumb: f.thumbnail, url: f.url, w: f.width ?? 0, h: f.height ?? 0, duration: v.duration ?? 0,
        author: v.user ?? '', authorUrl: pixabayAuthorUrl(v.user, v.user_id), pageUrl: pixabayPage(v.pageURL),
      }]
    })
    return putAndReturn(env, ctx, key, JSON.stringify({ results }))
  }
  const r = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&page=${page}&per_page=24&locale=ja-JP`, { headers: { Authorization: env.PEXELS_API_KEY ?? '' } })
  if (r.status === 429) throw new HttpError(429, 'Pexels の利用回数の上限に達しました。しばらくしてからお試しください')
  if (!r.ok) throw new HttpError(502, `Pexels の検索に失敗しました(${r.status})`)
  const j = await r.json<any>()
  const results = (j.videos ?? []).map((v: any) => {
    const files = (v.video_files ?? []).filter((f: any) => f.file_type === 'video/mp4' && f.link && f.width && f.width <= 1280).sort((a: any, b: any) => b.width - a.width)
    const f = files[0]
    if (!f) return null
    return {
      id: 'pxv_' + v.id, thumb: v.image, url: f.link, w: f.width, h: f.height, duration: v.duration ?? 0,
      author: v.user?.name ?? '', authorUrl: v.user?.url ?? 'https://www.pexels.com', pageUrl: v.url ?? 'https://www.pexels.com',
    }
  }).filter(Boolean)
  return putAndReturn(env, ctx, key, JSON.stringify({ results }))
}

async function putAndReturn(env: Env, ctx: ExecutionContext | undefined, key: string, body: string): Promise<Response> {
  const put = env.BUCKET.put(key, body, { httpMetadata: { contentType: 'application/json' }, customMetadata: { at: String(Date.now()) } }).catch(() => {})
  if (ctx) ctx.waitUntil(put); else await put
  return new Response(body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
}

const PIXABAY_TYPES = /^(image\/(jpeg|png|webp)|video\/mp4)$/

/** Pixabay の画像・動画の中継。cdn.pixabay.com は Referer が無いと 403 で、CORS も無いのでブラウザから直接取れない */
export async function pixabayMedia(req: Request, _env: Env): Promise<Response> {
  const target = pixabayMediaUrl(new URL(req.url).searchParams.get('u') ?? '')
  if (!target) throw new HttpError(400, '取得できない URL です')
  let r: Response
  try {
    r = await fetch(target.toString(), {
      redirect: 'manual',
      headers: { Referer: 'https://pixabay.com/', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', Accept: '*/*' },
    })
  } catch { throw new HttpError(502, 'Pixabay から取得できませんでした') }
  if (r.status !== 200) { r.body?.cancel().catch(() => {}); throw new HttpError(r.status === 404 ? 404 : 502, `Pixabay から取得できませんでした(${r.status})`) }
  const type = (r.headers.get('Content-Type') ?? '').split(';')[0].trim().toLowerCase()
  if (!PIXABAY_TYPES.test(type)) { r.body?.cancel().catch(() => {}); throw new HttpError(502, '対応していない形式です') }
  const len = Number(r.headers.get('Content-Length'))
  if (!Number.isFinite(len) || len <= 0 || len > PIXABAY_MAX_BYTES) { r.body?.cancel().catch(() => {}); throw new HttpError(413, 'ファイルが大きすぎるか、大きさが分かりません') }
  return new Response(r.body, { headers: { 'Content-Type': type, 'Content-Length': String(len), 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, max-age=86400' } })
}
