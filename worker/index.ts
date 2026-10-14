// irodori API Worker(/api/* のみ。それ以外は静的アセットが配信する)
import * as auth from './auth'
import * as recovery from './recovery'
import * as google from './google'
import * as photos from './photos'
import * as docs from './docs'
import { handleCollab } from './collab'
import { HttpError, type Env, json } from './util'

type Handler = (req: Request, env: Env, params: string[]) => Promise<Response>
interface Route { method: string; re: RegExp; h: Handler }

const route = (method: string, path: string, h: Handler): Route => ({
  method, h, re: new RegExp('^' + path.replace(/:[a-zA-Z]+/g, '([^/]+)') + '$'),
})

const routes: Route[] = [
  route('POST', '/api/auth/register/options', (r, e) => auth.registerOptions(r, e)),
  route('POST', '/api/auth/register/verify', (r, e) => auth.registerVerify(r, e)),
  route('POST', '/api/auth/login/options', (r, e) => auth.loginOptions(r, e)),
  route('POST', '/api/auth/login/verify', (r, e) => auth.loginVerify(r, e)),
  route('POST', '/api/auth/logout', (r, e) => auth.logout(r, e)),
  route('GET', '/api/me', (r, e) => auth.me(r, e)),
  route('POST', '/api/passkeys/options', (r, e) => recovery.addPasskeyOptions(r, e)),
  route('POST', '/api/passkeys/verify', (r, e) => recovery.addPasskeyVerify(r, e)),
  route('GET', '/api/passkeys', (r, e) => recovery.listPasskeys(r, e)),
  route('DELETE', '/api/passkeys/:id', (r, e, p) => recovery.deletePasskey(r, e, p[0])),
  route('GET', '/api/auth/google/start', (r, e) => google.googleStart(r, e)),
  route('GET', '/api/auth/google/callback', (r, e) => google.googleCallback(r, e)),
  route('POST', '/api/auth/google/unlink', (r, e) => google.googleUnlink(r, e)),
  route('GET', '/api/providers', (r, e) => Promise.resolve(photos.providers(r, e))),
  route('GET', '/api/photos/search', (r, e) => photos.searchPhotos(r, e)),
  route('GET', '/api/videos/search', (r, e) => photos.searchVideos(r, e)),
  route('GET', '/api/media/pixabay', (r, e) => photos.pixabayMedia(r, e)),
  route('POST', '/api/photos/unsplash-download', (r, e) => photos.unsplashDownload(r, e)),
  route('GET', '/api/docs', (r, e) => docs.listDocs(r, e)),
  route('GET', '/api/docs/:id', (r, e, p) => docs.getDoc(r, e, p[0])),
  route('PUT', '/api/docs/:id', (r, e, p) => docs.putDoc(r, e, p[0])),
  route('DELETE', '/api/docs/:id', (r, e, p) => docs.deleteDoc(r, e, p[0])),
  route('POST', '/api/docs/:id/share', (r, e, p) => docs.setShare(r, e, p[0])),
  route('GET', '/api/thumbs/:id', (r, e, p) => docs.getThumb(r, e, p[0])),
  route('POST', '/api/assets', (r, e) => docs.postAsset(r, e)),
  route('GET', '/api/assets/:id', (r, e, p) => docs.getAsset(r, e, p[0])),
  route('GET', '/api/share/:shareId', (r, e, p) => docs.getShare(r, e, p[0])),
  route('GET', '/api/share/:shareId/assets/:id', (r, e, p) => docs.getShareAsset(r, e, p[0], p[1])),
  route('POST', '/api/share/:shareId/copy', (r, e, p) => docs.copyShare(r, e, p[0])),
]

function safeDecode(s: string): string {
  try { return decodeURIComponent(s) } catch { throw new HttpError(400, 'URL の形式が正しくありません') }
}

/** 変更系は X-Irodori ヘッダ + 同一ホストの Origin を必須にする(CSRF 対策) */
function checkCsrf(req: Request, url: URL): void {
  if (req.method === 'GET' || req.method === 'HEAD') return
  if (req.headers.get('X-Irodori') !== '1') throw new HttpError(403, '不正なリクエストです')
  const origin = req.headers.get('Origin')
  let host: string | null = null
  try { host = origin ? new URL(origin).host : null } catch { /* 不正な Origin */ }
  if (host !== url.host) throw new HttpError(403, '不正なリクエストです')
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)
    try {
      if (!url.pathname.startsWith('/api/')) return json({ error: '見つかりません' }, 404)
      // 共同編集は公開デモでも使える(部屋の人数・大きさ・期限で濫用を抑える)
      if (url.pathname === '/api/collab' || url.pathname.startsWith('/api/collab/')) {
        checkCsrf(req, url)
        return await handleCollab(req, env, url)
      }
      if (env.DEMO === '1') {
        // 公開デモ: 状態を返す2つと、Pixabay の検索・中継(キーがあるときだけ。CSRF 確認と回数制限は下で通常どおり)以外は使えない
        if (url.pathname === '/api/me') return json({ user: null, demo: true })
        if (url.pathname === '/api/providers') return json({ google: false, unsplash: false, pexels: false, pixabay: !!env.PIXABAY_API_KEY, demo: true })
        const pixabayOk = req.method === 'GET' && (url.pathname === '/api/media/pixabay' ||
          ((url.pathname === '/api/photos/search' || url.pathname === '/api/videos/search') && url.searchParams.get('provider') === 'pixabay'))
        if (!pixabayOk) return json({ error: 'デモ版ではこの機能は使えません。自分の環境で動かす方法は GitHub の README を見てください' }, 403)
      }
      checkCsrf(req, url)
      // 認証系は IP ごとに回数を制限する(D1 の書き込み枠を使い切らせる攻撃・アカウント量産の対策)
      // 写真検索も IP ごとに制限(外部 API の回数枠を守る)
      // Google ログインの開始・戻り、Unsplash のダウンロード通知も IP ごとに制限
      if ((url.pathname.startsWith('/api/auth/google/') || url.pathname === '/api/photos/unsplash-download') && env.AUTH_LIMIT && !(await env.AUTH_LIMIT.limit({ key: 'g:' + (req.headers.get('CF-Connecting-IP') ?? 'local') })).success) throw new HttpError(429, '操作が多すぎます。少し待ってからお試しください')
      if ((url.pathname === '/api/photos/search' || url.pathname === '/api/videos/search') && env.AUTH_LIMIT && !(await env.AUTH_LIMIT.limit({ key: 'photo:' + (req.headers.get('CF-Connecting-IP') ?? 'local') })).success) throw new HttpError(429, '検索が多すぎます。少し待ってからお試しください')
      if (url.pathname === '/api/media/pixabay' && env.AUTH_LIMIT && !(await env.AUTH_LIMIT.limit({ key: 'media:' + (req.headers.get('CF-Connecting-IP') ?? 'local') })).success) throw new HttpError(429, '取り込みが多すぎます。少し待ってからお試しください')
      if ((url.pathname.startsWith('/api/auth/') || url.pathname.startsWith('/api/passkeys/')) && req.method === 'POST') {
        const ip = req.headers.get('CF-Connecting-IP') ?? 'local'
        if (env.AUTH_LIMIT && !(await env.AUTH_LIMIT.limit({ key: ip })).success) throw new HttpError(429, '操作が多すぎます。少し待ってからもう一度お試しください')
        if (url.pathname === '/api/auth/register/verify' && env.REGISTER_LIMIT && !(await env.REGISTER_LIMIT.limit({ key: ip })).success) throw new HttpError(429, '短時間に登録が多すぎます。しばらく待ってからお試しください')
      }
      const path = url.pathname.length > 5 ? url.pathname.replace(/\/+$/, '') : url.pathname
      let pathMatched = false
      for (const r of routes) {
        const m = r.re.exec(path)
        if (!m) continue
        pathMatched = true
        if (r.method !== req.method) continue
        return await r.h(req, env, m.slice(1).map(safeDecode))
      }
      return pathMatched ? json({ error: '許可されていない操作です' }, 405) : json({ error: '見つかりません' }, 404)
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message, ...e.extra }, e.status)
      console.error('unhandled', e)
      return json({ error: 'サーバーでエラーが発生しました' }, 500)
    }
  },
} satisfies ExportedHandler<Env>

// Durable Object のクラスは Worker のエントリから export する必要がある
export { CollabRoom } from './collab'
