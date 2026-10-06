// Google ログイン(OpenID Connect のコードフロー)。キーは本人が wrangler secret put で設定する
import { createSession, getSessionUser } from './auth'
import { isLocalHost, parseCookies } from './util'
import { HttpError, type Env, randomBytes, toBase64Url } from './util'

const AUTH = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN = 'https://oauth2.googleapis.com/token'
const STATE_TTL = 10 * 60 * 1000

const redirectUri = (req: Request) => `${new URL(req.url).origin}/api/auth/google/callback`
/** state を開始したブラウザに結び付ける Cookie(ログイン CSRF・紐付け CSRF 対策) */
const stateCookie = (req: Request, value: string, maxAge: number) =>
  `gstate=${value}; HttpOnly; SameSite=Lax; Path=/api/auth/google; Max-Age=${maxAge}${isLocalHost(new URL(req.url).hostname) ? '' : '; Secure'}`
const back = (req: Request, msg: string, cookie?: string) => {
  // 結果はホームの #/?auth=… で知らせる(画面側が表示する)
  const h = new Headers({ Location: `${new URL(req.url).origin}/#/?auth=${encodeURIComponent(msg)}`, 'Cache-Control': 'no-store' })
  if (cookie) h.append('Set-Cookie', cookie)
  h.append('Set-Cookie', stateCookie(req, '', 0)) // 使い終わった state Cookie は消す
  return new Response(null, { status: 302, headers: h })
}

export function googleEnabled(env: Env) { return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) }

/** GET /api/auth/google/start?link=1 */
export async function googleStart(req: Request, env: Env): Promise<Response> {
  if (!googleEnabled(env)) throw new HttpError(501, 'Google ログインはまだ設定されていません')
  const link = new URL(req.url).searchParams.get('link') === '1'
  const me = link ? await getSessionUser(req, env) : null
  if (link && !me) return back(req, 'Google を紐付けるには先にログインしてください')
  const state = toBase64Url(randomBytes(24)), nonce = toBase64Url(randomBytes(24))
  const now = Date.now()
  // 未使用の state が溜まりすぎていたら受け付けない(連打で D1 の書き込み枠を使わせない)
  const pending = await env.DB.prepare('SELECT COUNT(*) AS n FROM oauth_states WHERE created_at >= ?').bind(now - STATE_TTL).first<{ n: number }>()
  if ((pending?.n ?? 0) >= 300) return back(req, 'ただいま混み合っています。少し待ってからもう一度お試しください')
  await env.DB.batch([
    env.DB.prepare('DELETE FROM oauth_states WHERE created_at < ?').bind(now - STATE_TTL),
    env.DB.prepare('INSERT INTO oauth_states (state, nonce, link_user, created_at) VALUES (?, ?, ?, ?)').bind(state, nonce, me?.id ?? null, now),
  ])
  const q = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID!, redirect_uri: redirectUri(req), response_type: 'code', scope: 'openid email profile', state, nonce, prompt: 'select_account' })
  return new Response(null, { status: 302, headers: { Location: `${AUTH}?${q}`, 'Cache-Control': 'no-store', 'Set-Cookie': stateCookie(req, state, STATE_TTL / 1000) } })
}

/** GET /api/auth/google/callback?code=…&state=… */
export async function googleCallback(req: Request, env: Env): Promise<Response> {
  if (!googleEnabled(env)) throw new HttpError(501, 'Google ログインはまだ設定されていません')
  const u = new URL(req.url)
  const code = u.searchParams.get('code'), state = u.searchParams.get('state')
  if (u.searchParams.get('error')) return back(req, 'Google ログインがキャンセルされました')
  if (!code || !state || !/^[\w-]{20,80}$/.test(state)) return back(req, 'Google ログインに失敗しました(不正な応答)')
  // このブラウザで開始したログインか(他人が用意した戻り URL を踏まされていないか)
  if (parseCookies(req).gstate !== state) return back(req, 'Google ログインを最初からやり直してください(開始した画面と違うブラウザで戻りました)')
  // state は使い捨て(取り出しと削除を1文で)
  const st = await env.DB.prepare('DELETE FROM oauth_states WHERE state = ? RETURNING nonce, link_user AS linkUser, created_at AS createdAt').bind(state).first<{ nonce: string; linkUser: string | null; createdAt: number }>()
  if (!st || Date.now() - st.createdAt > STATE_TTL) return back(req, 'Google ログインの有効期限が切れました。もう一度お試しください')

  const tr = await fetch(TOKEN, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID!, client_secret: env.GOOGLE_CLIENT_SECRET!, redirect_uri: redirectUri(req), grant_type: 'authorization_code' }),
  })
  if (!tr.ok) return back(req, 'Google ログインに失敗しました(トークンを取得できません)')
  const tok = await tr.json<{ id_token?: string }>()
  // id_token はトークンエンドポイントから TLS で直接受け取ったので署名検証は省略できる(OIDC Core 3.1.3.7)。iss/aud/exp/nonce は確認する
  let claims: { iss?: string; aud?: string | string[]; exp?: number; nonce?: string; sub?: string; email?: string; name?: string }
  try { claims = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(tok.id_token!.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)))) }
  catch { return back(req, 'Google ログインに失敗しました(応答を読めません)') }
  const audOk = Array.isArray(claims.aud) ? claims.aud.includes(env.GOOGLE_CLIENT_ID!) : claims.aud === env.GOOGLE_CLIENT_ID
  if (!['https://accounts.google.com', 'accounts.google.com'].includes(claims.iss ?? '') || !audOk || !claims.exp || claims.exp * 1000 < Date.now() || claims.nonce !== st.nonce || !claims.sub)
    return back(req, 'Google ログインに失敗しました(検証できません)')

  const now = Date.now()
  const linked = await env.DB.prepare("SELECT user_id AS userId FROM identities WHERE provider = 'google' AND subject = ?").bind(claims.sub).first<{ userId: string }>()
  if (st.linkUser) {
    // 紐付け: 開始した本人がいまもログイン中であること
    const me = await getSessionUser(req, env)
    if (!me || me.id !== st.linkUser) return back(req, 'Google を紐付けるには、紐付けを始めたアカウントでログインしたまま操作してください')
    // 別のユーザーに紐付いている Google アカウントは使えない
    if (linked && linked.userId !== st.linkUser) return back(req, 'この Google アカウントは別のユーザーに紐付いています')
    if (!linked) await env.DB.prepare("INSERT INTO identities (provider, subject, user_id, email, created_at) VALUES ('google', ?, ?, ?, ?)").bind(claims.sub, st.linkUser, claims.email ?? null, now).run()
    return back(req, 'Google を紐付けました。今後は Google でもログインできます')
  }
  let userId = linked?.userId
  if (!userId) {
    // 初めての Google ログイン: 新しいユーザーを作る
    userId = toBase64Url(randomBytes(16))
    const name = (claims.name || (claims.email ?? '').split('@')[0] || 'ユーザー').slice(0, 40)
    await env.DB.batch([
      env.DB.prepare('INSERT INTO users (id, name, created_at) VALUES (?, ?, ?)').bind(userId, name, now),
      env.DB.prepare("INSERT INTO identities (provider, subject, user_id, email, created_at) VALUES ('google', ?, ?, ?, ?)").bind(claims.sub, userId, claims.email ?? null, now),
    ])
  }
  return back(req, 'Google でログインしました', await createSession(req, env, userId))
}

/** POST /api/auth/google/unlink */
export async function googleUnlink(req: Request, env: Env): Promise<Response> {
  const me = await getSessionUser(req, env)
  if (!me) throw new HttpError(401, 'ログインが必要です')
  // パスキーが1つ以上あるときだけ外す(判定と削除を1文にして、同時実行でもログイン手段が0にならないように)
  const res = await env.DB.prepare("DELETE FROM identities WHERE provider = 'google' AND user_id = ?1 AND EXISTS (SELECT 1 FROM credentials WHERE user_id = ?1)").bind(me.id).run()
  if (!res.meta.changes) throw new HttpError(400, 'パスキーが無いため、Google の紐付けを外すとログインできなくなります。先にパスキーを追加してください')
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
}
