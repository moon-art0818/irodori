// 復旧手段: 2台目以降のパスキー追加・一覧・削除
import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server'
import { consumeChallenge, requireUser, rpOf, saveChallenge } from './auth'
import { HttpError, type Env, fromBase64Url, json, readJson, toBase64Url } from './util'

export async function addPasskeyOptions(req: Request, env: Env): Promise<Response> {
  const u = await requireUser(req, env)
  const { rpID } = rpOf(req)
  const { results } = await env.DB.prepare('SELECT id FROM credentials WHERE user_id = ?').bind(u.id).all<{ id: string }>()
  if (results.length >= 10) throw new HttpError(400, 'パスキーは10個まで登録できます')
  const options = await generateRegistrationOptions({
    rpName: 'irodori', rpID, userName: u.name, userDisplayName: u.name, userID: fromBase64Url(u.id),
    attestationType: 'none', authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' },
    excludeCredentials: results.map((r) => ({ id: r.id })), // 同じ端末への二重登録を防ぐ
  })
  await saveChallenge(env, options.challenge, 'add', u.id, null)
  return json(options)
}

export async function addPasskeyVerify(req: Request, env: Env): Promise<Response> {
  const u = await requireUser(req, env)
  const resp = await readJson(req)
  const ch = await consumeChallenge(env, resp, 'add')
  if (ch.user_id !== u.id) throw new HttpError(400, '登録情報が一致しません')
  const { rpID, origin } = rpOf(req)
  let v
  try {
    v = await verifyRegistrationResponse({ response: resp, expectedChallenge: ch.challenge, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: false })
  } catch { throw new HttpError(400, 'パスキーの検証に失敗しました') }
  if (!v.verified || !v.registrationInfo) throw new HttpError(400, 'パスキーの検証に失敗しました')
  const { credential, credentialDeviceType, credentialBackedUp } = v.registrationInfo
  try {
    await env.DB.prepare('INSERT INTO credentials (id, user_id, public_key, counter, transports, device_type, backed_up, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(credential.id, u.id, toBase64Url(credential.publicKey), credential.counter, JSON.stringify(credential.transports ?? []), credentialDeviceType, credentialBackedUp ? 1 : 0, Date.now()).run()
  } catch { throw new HttpError(400, 'このパスキーはすでに登録されています') }
  return json({ ok: true })
}

export async function listPasskeys(req: Request, env: Env): Promise<Response> {
  const u = await requireUser(req, env)
  const { results } = await env.DB.prepare('SELECT id, device_type AS deviceType, backed_up AS backedUp, created_at AS createdAt FROM credentials WHERE user_id = ? ORDER BY created_at')
    .bind(u.id).all<{ id: string; deviceType: string | null; backedUp: number; createdAt: number }>()
  return json({ passkeys: results.map((r) => ({ id: r.id, synced: r.backedUp === 1 || r.deviceType === 'multiDevice', createdAt: r.createdAt })) })
}

export async function deletePasskey(req: Request, env: Env, id: string): Promise<Response> {
  const u = await requireUser(req, env)
  // ログイン手段が無くならないようにする(パスキーが最後の1つで、Google も未連携なら消させない)
  // 判定と削除を1文で(同時に2つ消されてもログイン手段が0にならない)
  const res = await env.DB.prepare(
    `DELETE FROM credentials WHERE id = ?1 AND user_id = ?2
       AND ((SELECT COUNT(*) FROM credentials WHERE user_id = ?2) > 1 OR EXISTS (SELECT 1 FROM identities WHERE user_id = ?2))`,
  ).bind(id, u.id).run()
  if (!res.meta.changes) {
    const exists = await env.DB.prepare('SELECT 1 FROM credentials WHERE id = ? AND user_id = ?').bind(id, u.id).first()
    throw exists ? new HttpError(400, '最後のログイン手段は削除できません。先に別のパスキーか Google を追加してください') : new HttpError(404, 'パスキーが見つかりません')
  }
  return json({ ok: true })
}
