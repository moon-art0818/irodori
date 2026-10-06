// 写真検索の中継(Unsplash / Pexels)。キーはサーバーだけが持つ。同じ検索は1時間キャッシュして回数枠を節約する
import type { PhotoResult, Providers } from '../src/api/contract'
import { googleEnabled } from './google'
import { HttpError, type Env, json, readJson } from './util'

const UTM = 'utm_source=irodori&utm_medium=referral'

export function providers(_req: Request, env: Env): Response {
  const p: Providers = { google: googleEnabled(env), unsplash: !!env.UNSPLASH_ACCESS_KEY, pexels: !!env.PEXELS_API_KEY }
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
  const hit = await env.BUCKET.get(key)
  if (hit && Date.now() - Number(hit.customMetadata?.at ?? 0) < 3600_000) return new Response(hit.body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })

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
  } else throw new HttpError(400, 'provider は unsplash か pexels を指定してください')

  const body = JSON.stringify({ results })
  const put = env.BUCKET.put(key, body, { httpMetadata: { contentType: 'application/json' }, customMetadata: { at: String(Date.now()) } })
  if (ctx) ctx.waitUntil(put); else await put
  return new Response(body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
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
