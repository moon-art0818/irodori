// パスキー(WebAuthn)認証とセッション
import {
  generateAuthenticationOptions, generateRegistrationOptions,
  verifyAuthenticationResponse, verifyRegistrationResponse,
} from '@simplewebauthn/server'
import type { AuthenticatorTransport, WebAuthnCredential } from '@simplewebauthn/server'
import type { ApiUser } from '../src/api/contract'
import { DEFAULT_QUOTA_BYTES } from '../src/api/contract'
import { HttpError, type Env, fromBase64Url, isLocalHost, json, parseCookies, randomBytes, readJson, sha256Hex, toBase64Url } from './util'

const CHALLENGE_TTL_MS = 5 * 60 * 1000
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
const RP_NAME = 'irodori'

export interface SessionUser { id: string; name: string; createdAt: number }

interface Rp { rpID: string; origin: string }
export function rpOf(req: Request): Rp {
  const u = new URL(req.url)
  return { rpID: u.hostname, origin: u.origin }
}

function cookieHeader(req: Request, value: string, maxAgeSec: number): string {
  const secure = isLocalHost(new URL(req.url).hostname) ? '' : '; Secure'
  return `sid=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSec}${secure}`
}

export async function usedBytes(env: Env, userId: string): Promise<number> {
  const r = await env.DB.prepare(
    `SELECT COALESCE((SELECT SUM(bytes + thumb_bytes) FROM docs WHERE user_id = ?1), 0)
          + COALESCE((SELECT SUM(size) FROM assets WHERE user_id = ?1), 0) AS used`,
  ).bind(userId).first<{ used: number }>()
  return r?.used ?? 0
}

export async function toApiUser(env: Env, u: SessionUser): Promise<ApiUser> {
  const r = await env.DB.prepare(
    `SELECT (SELECT COUNT(*) FROM credentials WHERE user_id = ?1) AS passkeys,
            (SELECT COUNT(*) FROM identities WHERE user_id = ?1 AND provider = 'google') AS google`,
  ).bind(u.id).first<{ passkeys: number; google: number }>()
  return { id: u.id, name: u.name, createdAt: u.createdAt, usedBytes: await usedBytes(env, u.id), quotaBytes: DEFAULT_QUOTA_BYTES, passkeys: r?.passkeys ?? 0, googleLinked: (r?.google ?? 0) > 0 }
}

/** Cookie からログイン中のユーザーを得る。未ログイン・期限切れは null */
export async function getSessionUser(req: Request, env: Env): Promise<SessionUser | null> {
  const sid = parseCookies(req).sid
  if (!sid || !/^[A-Za-z0-9_-]{20,100}$/.test(sid)) return null
  const row = await env.DB.prepare(
    `SELECT u.id AS id, u.name AS name, u.created_at AS createdAt, s.expires_at AS expiresAt
       FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.sid_hash = ?`,
  ).bind(await sha256Hex(sid)).first<SessionUser & { expiresAt: number }>()
  if (!row) return null
  if (row.expiresAt <= Date.now()) return null
  return { id: row.id, name: row.name, createdAt: row.createdAt }
}

export async function requireUser(req: Request, env: Env): Promise<SessionUser> {
  const u = await getSessionUser(req, env)
  if (!u) throw new HttpError(401, 'ログインが必要です')
  return u
}

export async function createSession(req: Request, env: Env, userId: string): Promise<string> {
  const sid = toBase64Url(randomBytes(32))
  const now = Date.now()
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now),
    env.DB.prepare('INSERT INTO sessions (sid_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
      .bind(await sha256Hex(sid), userId, now, now + SESSION_TTL_MS),
  ])
  return cookieHeader(req, sid, SESSION_TTL_MS / 1000)
}

/** 応答の clientDataJSON から challenge を取り出し、使い捨てとして消費する */
export async function consumeChallenge(env: Env, resp: any, kind: 'register' | 'login' | 'add') {
  let challenge: string
  try {
    const cd = JSON.parse(new TextDecoder().decode(fromBase64Url(resp?.response?.clientDataJSON)))
    challenge = String(cd.challenge)
  } catch { throw new HttpError(400, '認証データの形式が正しくありません') }
  // 取り出しと削除を1文で行う(同時に2回使われても成功するのは1回だけ)
  const row = await env.DB.prepare('DELETE FROM challenges WHERE challenge = ? AND kind = ? RETURNING challenge, user_id, user_name, created_at')
    .bind(challenge, kind).first<{ challenge: string; user_id: string | null; user_name: string | null; created_at: number }>()
  if (!row) throw new HttpError(400, '認証の有効期限が切れました。もう一度やり直してください')
  if (Date.now() - row.created_at > CHALLENGE_TTL_MS) throw new HttpError(400, '認証の有効期限が切れました。もう一度やり直してください')
  return row
}

/** 有効中の challenge がこれ以上あれば受け付けない(連打で D1 の書き込み枠を使い切らせない。読み取りだけで判定) */
const MAX_PENDING_CHALLENGES = 300

export async function saveChallenge(env: Env, challenge: string, kind: 'register' | 'login' | 'add', userId: string | null, userName: string | null) {
  const now = Date.now()
  const pending = await env.DB.prepare('SELECT COUNT(*) AS n FROM challenges WHERE created_at >= ?').bind(now - CHALLENGE_TTL_MS).first<{ n: number }>()
  if ((pending?.n ?? 0) >= MAX_PENDING_CHALLENGES) throw new HttpError(429, 'ただいま混み合っています。少し待ってからもう一度お試しください')
  await env.DB.batch([
    env.DB.prepare('DELETE FROM challenges WHERE created_at < ?').bind(now - CHALLENGE_TTL_MS),
    env.DB.prepare('INSERT INTO challenges (challenge, kind, user_id, user_name, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(challenge, kind, userId, userName, now),
  ])
}

export async function registerOptions(req: Request, env: Env): Promise<Response> {
  const body = await readJson<{ name?: unknown }>(req)
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name || name.length > 40) throw new HttpError(400, '名前は1〜40文字で入力してください')
  const { rpID } = rpOf(req)
  const userId = randomBytes(16)
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userName: name,
    userDisplayName: name,
    userID: userId,
    attestationType: 'none',
    authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' },
  })
  await saveChallenge(env, options.challenge, 'register', toBase64Url(userId), name)
  return json(options)
}

export async function registerVerify(req: Request, env: Env): Promise<Response> {
  const resp = await readJson(req)
  const ch = await consumeChallenge(env, resp, 'register')
  if (!ch.user_id || !ch.user_name) throw new HttpError(400, '登録情報が見つかりません')
  const { rpID, origin } = rpOf(req)
  let v
  try {
    v = await verifyRegistrationResponse({
      response: resp, expectedChallenge: ch.challenge, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: false,
    })
  } catch { throw new HttpError(400, 'パスキーの検証に失敗しました') }
  if (!v.verified || !v.registrationInfo) throw new HttpError(400, 'パスキーの検証に失敗しました')
  const { credential, credentialDeviceType, credentialBackedUp } = v.registrationInfo
  const now = Date.now()
  await env.DB.batch([
    env.DB.prepare('INSERT INTO users (id, name, created_at) VALUES (?, ?, ?)').bind(ch.user_id, ch.user_name, now),
    env.DB.prepare('INSERT INTO credentials (id, user_id, public_key, counter, transports, device_type, backed_up, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(credential.id, ch.user_id, toBase64Url(credential.publicKey), credential.counter,
        JSON.stringify(credential.transports ?? []), credentialDeviceType, credentialBackedUp ? 1 : 0, now),
  ])
  const cookie = await createSession(req, env, ch.user_id)
  const user = await toApiUser(env, { id: ch.user_id, name: ch.user_name, createdAt: now })
  return json({ user }, 200, { 'Set-Cookie': cookie })
}

export async function loginOptions(req: Request, env: Env): Promise<Response> {
  const { rpID } = rpOf(req)
  // allowCredentials を空にして discoverable credential で選ばせる(ユーザー名入力なし)
  const options = await generateAuthenticationOptions({ rpID, userVerification: 'preferred' })
  await saveChallenge(env, options.challenge, 'login', null, null)
  return json(options)
}

export async function loginVerify(req: Request, env: Env): Promise<Response> {
  const resp = await readJson(req)
  const ch = await consumeChallenge(env, resp, 'login')
  const credId = typeof resp?.id === 'string' ? resp.id : ''
  const row = await env.DB.prepare(
    `SELECT c.id AS id, c.user_id AS userId, c.public_key AS publicKey, c.counter AS counter, c.transports AS transports,
            u.name AS name, u.created_at AS createdAt
       FROM credentials c JOIN users u ON u.id = c.user_id WHERE c.id = ?`,
  ).bind(credId).first<{ id: string; userId: string; publicKey: string; counter: number; transports: string | null; name: string; createdAt: number }>()
  if (!row) throw new HttpError(401, 'このパスキーは登録されていません')
  let transports: AuthenticatorTransport[] | undefined
  try { transports = row.transports ? JSON.parse(row.transports) : undefined } catch { /* 無視 */ }
  const credential: WebAuthnCredential = { id: row.id, publicKey: fromBase64Url(row.publicKey), counter: row.counter, transports }
  const { rpID, origin } = rpOf(req)
  let v
  try {
    v = await verifyAuthenticationResponse({
      response: resp, expectedChallenge: ch.challenge, expectedOrigin: origin, expectedRPID: rpID, credential, requireUserVerification: false,
    })
  } catch { throw new HttpError(401, 'パスキーの検証に失敗しました') }
  if (!v.verified) throw new HttpError(401, 'パスキーの検証に失敗しました')
  await env.DB.prepare('UPDATE credentials SET counter = ? WHERE id = ?').bind(v.authenticationInfo.newCounter, row.id).run()
  const cookie = await createSession(req, env, row.userId)
  const user = await toApiUser(env, { id: row.userId, name: row.name, createdAt: row.createdAt })
  return json({ user }, 200, { 'Set-Cookie': cookie })
}

export async function logout(req: Request, env: Env): Promise<Response> {
  const sid = parseCookies(req).sid
  if (sid) await env.DB.prepare('DELETE FROM sessions WHERE sid_hash = ?').bind(await sha256Hex(sid)).run()
  return json({ ok: true }, 200, { 'Set-Cookie': cookieHeader(req, '', 0) })
}

export async function me(req: Request, env: Env): Promise<Response> {
  const u = await getSessionUser(req, env)
  return json({ user: u ? await toApiUser(env, u) : null })
}
