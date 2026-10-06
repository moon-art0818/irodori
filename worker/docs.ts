// デザイン・サムネ・画像アセット・共有
import type { DesignDoc } from '../src/editor/types'
import { DEFAULT_QUOTA_BYTES, MAX_ASSET_BYTES, type DocMeta, type PutDocBody } from '../src/api/contract'
import { requireUser, usedBytes, getSessionUser } from './auth'
import { HttpError, type Env, fromBase64Url, json, randomId, readJson } from './util'

const MAX_DOC_BYTES = 20 * 1024 * 1024
const MAX_THUMB_BYTES = 1024 * 1024
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']

const docKey = (userId: string, docId: string) => `docs/${userId}/${docId}.json`
const thumbKey = (docId: string) => `thumbs/${docId}.jpg`
const assetKey = (userId: string, assetId: string) => `assets/${userId}/${assetId}`

function checkId(id: string): string {
  if (!ID_RE.test(id)) throw new HttpError(400, 'ID の形式が正しくありません')
  return id
}

/** doc JSON 内の assetId(文字列)を再帰で集める */
function collectAssetIds(node: unknown, out: Set<string> = new Set()): Set<string> {
  if (Array.isArray(node)) { for (const v of node) collectAssetIds(v, out) }
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k === 'assetId' && typeof v === 'string' && ID_RE.test(v)) out.add(v)
      else collectAssetIds(v, out)
    }
  }
  return out
}

/** assetId を map に従って書き換える(コピー用) */
function rewriteAssetIds(node: unknown, map: Map<string, string>): void {
  if (Array.isArray(node)) { for (const v of node) rewriteAssetIds(v, map) }
  else if (node && typeof node === 'object') {
    const o = node as Record<string, unknown>
    for (const k of Object.keys(o)) {
      if (k === 'assetId' && typeof o[k] === 'string' && map.has(o[k] as string)) o[k] = map.get(o[k] as string)
      else rewriteAssetIds(o[k], map)
    }
  }
}

interface DocRow {
  id: string; name: string; width: number; height: number; page_count: number
  updated_at: number; created_at: number; share_id: string | null; bytes: number; thumb_bytes: number; user_id: string
}
const toMeta = (r: DocRow): DocMeta => ({
  id: r.id, name: r.name, width: r.width, height: r.height, pageCount: r.page_count,
  updatedAt: r.updated_at, createdAt: r.created_at, shareId: r.share_id,
  thumbUrl: r.thumb_bytes > 0 ? `/api/thumbs/${r.id}?v=${r.updated_at}` : null,
})

async function ownedDoc(env: Env, userId: string, id: string): Promise<DocRow | null> {
  return env.DB.prepare('SELECT * FROM docs WHERE id = ? AND user_id = ?').bind(id, userId).first<DocRow>()
}

export async function listDocs(req: Request, env: Env): Promise<Response> {
  const u = await requireUser(req, env)
  const { results } = await env.DB.prepare('SELECT * FROM docs WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1000').bind(u.id).all<DocRow>()
  return json({ docs: results.map(toMeta) })
}

export async function getDoc(req: Request, env: Env, id: string): Promise<Response> {
  const u = await requireUser(req, env)
  const row = await ownedDoc(env, u.id, checkId(id))
  if (!row) throw new HttpError(404, 'デザインが見つかりません')
  const obj = await env.BUCKET.get(docKey(u.id, id))
  if (!obj) throw new HttpError(404, 'デザインの本体が見つかりません')
  const doc = JSON.parse(await obj.text()) as DesignDoc
  delete doc.thumb
  return json({ doc })
}

function depthOf(node: unknown, d = 0): number {
  if (d > 120) return d
  if (Array.isArray(node)) { let m = d; for (const v of node) m = Math.max(m, depthOf(v, d + 1)); return m }
  if (node && typeof node === 'object') { let m = d; for (const v of Object.values(node)) m = Math.max(m, depthOf(v, d + 1)); return m }
  return d
}
const inRange = (v: unknown, lo: number, hi: number) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi

function validateDoc(doc: any): asserts doc is DesignDoc {
  if (!doc || typeof doc !== 'object' || typeof doc.name !== 'string' || !Array.isArray(doc.pages)
    || !inRange(doc.width, 1, 10000) || !inRange(doc.height, 1, 10000) || doc.pages.length < 1 || doc.pages.length > 300)
    throw new HttpError(400, 'デザインの形式が正しくありません(幅・高さは 1〜10000px、ページは 1〜300 枚)')
  if (depthOf(doc.pages) > 100) throw new HttpError(400, 'デザインの構造が深すぎます')
  // HTML スライド(deck)の形を確かめる。中身の無害化は開く側(DeckEditor)でも行う
  const deck = (doc as any).deck
  if (deck !== undefined) {
    const idOk = (v: unknown) => typeof v === 'string' && /^[\w-]{1,40}$/.test(v)
    if (!deck || typeof deck !== 'object' || !Array.isArray(deck.slides) || deck.slides.length > 500
      || deck.slides.some((s: any) => !s || !idOk(s.id) || typeof s.html !== 'string' || s.html.length > 200_000)
      || (deck.memos !== undefined && (!Array.isArray(deck.memos) || deck.memos.length > 2000 || deck.memos.some((m: any) => !m || !idOk(m.id) || (m.slideId !== null && !idOk(m.slideId)) || typeof m.text !== 'string'))))
      throw new HttpError(400, 'スライドの形式が正しくありません')
  }
}

/** 画像の src は保存しない(自前の asset は assetId から復元する)。外部 URL を閲覧者に読ませないため */
function stripExternalSrc(node: unknown): void {
  if (Array.isArray(node)) { for (const v of node) stripExternalSrc(v); return }
  if (!node || typeof node !== 'object') return
  const o = node as Record<string, unknown>
  // Unsplash はホットリンク必須(API ガイドライン)なので、Unsplash・Pexels の画像 URL だけは残す
  const allowed = typeof o.src === 'string' && /^https:\/\/(images\.unsplash\.com|images\.pexels\.com)\//.test(o.src)
  if (typeof o.src === 'string' && (o.assetId || (!allowed && !/^data:image\/(png|jpeg|webp|gif);/.test(o.src)))) delete o.src
  // 写真のクレジットのリンクは Unsplash・Pexels の https だけ残す
  if (o.credit && typeof o.credit === 'object') {
    const c = o.credit as Record<string, unknown>
    for (const k of ['authorUrl', 'pageUrl']) if (typeof c[k] !== 'string' || !/^https:\/\/(unsplash\.com|www\.pexels\.com)\//.test(c[k] as string)) delete c[k]
  }
  for (const v of Object.values(o)) stripExternalSrc(v)
}

export async function putDoc(req: Request, env: Env, id: string): Promise<Response> {
  const u = await requireUser(req, env)
  checkId(id)
  const body = await readJson<PutDocBody>(req, MAX_DOC_BYTES + MAX_THUMB_BYTES * 2)
  if (!body || typeof body !== 'object') throw new HttpError(400, '送信内容が正しくありません')
  const { doc, baseUpdatedAt } = body
  validateDoc(doc)
  stripExternalSrc(doc.pages)
  if (baseUpdatedAt !== null && !Number.isFinite(baseUpdatedAt)) throw new HttpError(400, 'baseUpdatedAt が正しくありません')

  // サムネ(任意)。JPEG の dataURL のみ
  let thumbBytes: Uint8Array | null = null
  if (body.thumb !== undefined && body.thumb !== null && body.thumb !== '') {
    const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.thumb))
    if (!m) throw new HttpError(400, 'サムネは JPEG の dataURL で送ってください')
    try { thumbBytes = fromBase64Url(m[1].replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')) } catch { throw new HttpError(400, 'サムネの形式が正しくありません') }
    if (thumbBytes.length > MAX_THUMB_BYTES) throw new HttpError(413, 'サムネが大きすぎます')
  }

  const existing = await env.DB.prepare('SELECT * FROM docs WHERE id = ?').bind(id).first<DocRow>()
  if (existing && existing.user_id !== u.id) throw new HttpError(404, 'デザインが見つかりません')
  if (!existing && baseUpdatedAt !== null) {
    throw new HttpError(409, 'conflict', { serverUpdatedAt: 0 })
  }
  if (existing && baseUpdatedAt !== existing.updated_at) {
    throw new HttpError(409, 'conflict', { serverUpdatedAt: existing.updated_at })
  }

  const now = Math.max(Date.now(), (existing?.updated_at ?? 0) + 1)
  const stored: DesignDoc = { ...doc, id, updatedAt: now, createdAt: existing?.created_at ?? (Number.isFinite(doc.createdAt) ? doc.createdAt : now) }
  delete stored.thumb
  const text = JSON.stringify(stored)
  const docBytes = new TextEncoder().encode(text).length
  if (docBytes > MAX_DOC_BYTES) throw new HttpError(413, 'デザインが大きすぎます')

  // 容量: この doc の旧サイズを除いた使用量 + 新サイズ
  const newThumb = thumbBytes ? thumbBytes.length : (existing?.thumb_bytes ?? 0)
  const others = (await usedBytes(env, u.id)) - (existing ? existing.bytes + existing.thumb_bytes : 0)
  if (others + docBytes + newThumb > DEFAULT_QUOTA_BYTES) throw new HttpError(413, '保存容量の上限を超えています')

  // 参照 asset: 自分の asset だけ記録する(他人の asset を共有経由で読ませない)
  const referenced = [...collectAssetIds(stored.pages)]
  let mine: string[] = []
  if (referenced.length) {
    // D1 は 1 文の変数が最大 100 個なので 90 個ずつ照会する
    for (let i = 0; i < referenced.length; i += 90) {
      const part = referenced.slice(i, i + 90)
      const ph = part.map(() => '?').join(',')
      const { results } = await env.DB.prepare(`SELECT id FROM assets WHERE user_id = ? AND id IN (${ph})`).bind(u.id, ...part).all<{ id: string }>()
      mine.push(...results.map(r => r.id))
    }
  }

  const meta = { name: String(doc.name).slice(0, 200), width: Math.round(doc.width), height: Math.round(doc.height), pages: doc.pages.length }
  if (existing) {
    // DB を先に「この版から」条件付きで更新して楽観ロックを確定する
    const r = await env.DB.prepare(
      'UPDATE docs SET name=?, width=?, height=?, page_count=?, updated_at=?, bytes=?, thumb_bytes=? WHERE id=? AND user_id=? AND updated_at=?',
    ).bind(meta.name, meta.width, meta.height, meta.pages, now, docBytes, newThumb, id, u.id, baseUpdatedAt).run()
    if (!r.meta.changes) {
      const cur = await ownedDoc(env, u.id, id)
      throw new HttpError(409, 'conflict', { serverUpdatedAt: cur?.updated_at ?? 0 })
    }
  } else {
    try {
      await env.DB.prepare(
        'INSERT INTO docs (id, user_id, name, width, height, page_count, updated_at, created_at, share_id, bytes, thumb_bytes) VALUES (?,?,?,?,?,?,?,?,NULL,?,?)',
      ).bind(id, u.id, meta.name, meta.width, meta.height, meta.pages, now, stored.createdAt, docBytes, newThumb).run()
    } catch { throw new HttpError(409, 'conflict', { serverUpdatedAt: now }) }
  }

  try {
    await env.BUCKET.put(docKey(u.id, id), text, { httpMetadata: { contentType: 'application/json' } })
    if (thumbBytes) await env.BUCKET.put(thumbKey(id), thumbBytes, { httpMetadata: { contentType: 'image/jpeg' } })
  } catch {
    // R2 に書けなかったら版を元に戻す
    if (existing) {
      await env.DB.prepare('UPDATE docs SET updated_at=?, bytes=?, thumb_bytes=? WHERE id=?').bind(existing.updated_at, existing.bytes, existing.thumb_bytes, id).run()
    } else {
      await env.DB.prepare('DELETE FROM docs WHERE id=?').bind(id).run()
    }
    throw new HttpError(500, '保存に失敗しました。もう一度お試しください')
  }

  await env.DB.batch([
    env.DB.prepare('DELETE FROM doc_assets WHERE doc_id = ?').bind(id),
    ...mine.map(a => env.DB.prepare('INSERT OR IGNORE INTO doc_assets (doc_id, asset_id) VALUES (?, ?)').bind(id, a)),
  ])
  return json({ updatedAt: now })
}

export async function deleteDoc(req: Request, env: Env, id: string): Promise<Response> {
  const u = await requireUser(req, env)
  const row = await ownedDoc(env, u.id, checkId(id))
  if (!row) throw new HttpError(404, 'デザインが見つかりません')
  // このデザインだけが使っていた画像も消して容量を戻す(他のデザインが使う画像は残す)
  const { results: only } = await env.DB.prepare(
    `SELECT a.asset_id AS id FROM doc_assets a WHERE a.doc_id = ?1
       AND NOT EXISTS (SELECT 1 FROM doc_assets b JOIN docs d ON d.id = b.doc_id WHERE b.asset_id = a.asset_id AND b.doc_id != ?1 AND d.user_id = ?2)`,
  ).bind(id, u.id).all<{ id: string }>()
  await env.DB.batch([
    env.DB.prepare('DELETE FROM doc_assets WHERE doc_id = ?').bind(id),
    env.DB.prepare('DELETE FROM docs WHERE id = ? AND user_id = ?').bind(id, u.id),
    ...only.map((a) => env.DB.prepare('DELETE FROM assets WHERE id = ? AND user_id = ?').bind(a.id, u.id)),
  ])
  await env.BUCKET.delete([docKey(u.id, id), thumbKey(id), ...only.map((a) => assetKey(u.id, a.id))])
  return json({ ok: true })
}

export async function setShare(req: Request, env: Env, id: string): Promise<Response> {
  const u = await requireUser(req, env)
  const row = await ownedDoc(env, u.id, checkId(id))
  if (!row) throw new HttpError(404, 'デザインが見つかりません')
  const body = await readJson<{ on?: unknown }>(req)
  if (typeof body.on !== 'boolean') throw new HttpError(400, 'on は true / false で指定してください')
  let shareId: string | null = null
  if (body.on) {
    shareId = row.share_id ?? randomId(16)
    if (!row.share_id) await env.DB.prepare('UPDATE docs SET share_id = ? WHERE id = ? AND user_id = ?').bind(shareId, id, u.id).run()
  } else if (row.share_id) {
    await env.DB.prepare('UPDATE docs SET share_id = NULL WHERE id = ? AND user_id = ?').bind(id, u.id).run()
  }
  return json({ shareId })
}

export async function getThumb(req: Request, env: Env, docId: string): Promise<Response> {
  const u = await requireUser(req, env)
  const row = await ownedDoc(env, u.id, checkId(docId))
  if (!row || row.thumb_bytes <= 0) throw new HttpError(404, 'サムネが見つかりません')
  const obj = await env.BUCKET.get(thumbKey(docId))
  if (!obj) throw new HttpError(404, 'サムネが見つかりません')
  const hasV = new URL(req.url).searchParams.has('v')
  return new Response(obj.body, {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': hasV ? 'private, max-age=31536000, immutable' : 'private, no-cache', 'X-Content-Type-Options': 'nosniff' },
  })
}

// ---- 画像アセット ----

function sniffOk(mime: string, b: Uint8Array): boolean {
  const eq = (off: number, s: string) => [...s].every((c, i) => b[off + i] === c.charCodeAt(0))
  switch (mime) {
    case 'image/png': return b[0] === 0x89 && eq(1, 'PNG')
    case 'image/jpeg': return b[0] === 0xff && b[1] === 0xd8
    case 'image/gif': return eq(0, 'GIF8')
    case 'image/webp': return eq(0, 'RIFF') && eq(8, 'WEBP')
    case 'image/svg+xml': return new TextDecoder().decode(b.subarray(0, Math.min(b.length, 4096))).includes('<svg')
    default: return false
  }
}

export async function postAsset(req: Request, env: Env): Promise<Response> {
  const u = await requireUser(req, env)
  const mime = (req.headers.get('Content-Type') ?? '').split(';')[0].trim().toLowerCase()
  if (!ALLOWED_MIME.includes(mime)) throw new HttpError(415, '対応していない画像形式です(PNG / JPEG / WebP / GIF / SVG)')
  const len = Number(req.headers.get('Content-Length') ?? 0)
  if (len > MAX_ASSET_BYTES) throw new HttpError(413, '画像が大きすぎます(最大15MB)')
  const buf = new Uint8Array(await req.arrayBuffer())
  if (buf.length === 0) throw new HttpError(400, '画像が空です')
  if (buf.length > MAX_ASSET_BYTES) throw new HttpError(413, '画像が大きすぎます(最大15MB)')
  if (!sniffOk(mime, buf)) throw new HttpError(400, '画像の中身が形式と一致しません')
  if ((await usedBytes(env, u.id)) + buf.length > DEFAULT_QUOTA_BYTES) throw new HttpError(413, '保存容量の上限を超えています')
  const id = crypto.randomUUID()
  await env.BUCKET.put(assetKey(u.id, id), buf, { httpMetadata: { contentType: mime } })
  try {
    await env.DB.prepare('INSERT INTO assets (id, user_id, mime, size, created_at) VALUES (?,?,?,?,?)').bind(id, u.id, mime, buf.length, Date.now()).run()
  } catch {
    await env.BUCKET.delete(assetKey(u.id, id))
    throw new HttpError(500, '保存に失敗しました。もう一度お試しください')
  }
  return json({ id })
}

function assetResponse(body: ReadableStream | null, mime: string, cache: string): Response {
  const h: Record<string, string> = { 'Content-Type': mime, 'Cache-Control': cache, 'X-Content-Type-Options': 'nosniff' }
  if (mime === 'image/svg+xml') {
    // SVG 内のスクリプト等を無効化(直接開かれても実行されない)
    h['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; sandbox"
    h['Content-Disposition'] = 'inline'
  }
  return new Response(body, { headers: h })
}

export async function getAsset(req: Request, env: Env, id: string): Promise<Response> {
  const u = await requireUser(req, env)
  const row = await env.DB.prepare('SELECT mime FROM assets WHERE id = ? AND user_id = ?').bind(checkId(id), u.id).first<{ mime: string }>()
  if (!row) throw new HttpError(404, '画像が見つかりません')
  const obj = await env.BUCKET.get(assetKey(u.id, id))
  if (!obj) throw new HttpError(404, '画像が見つかりません')
  return assetResponse(obj.body, row.mime, 'private, max-age=31536000, immutable')
}

// ---- 共有 ----

async function sharedDoc(env: Env, shareId: string): Promise<(DocRow & { owner_name: string }) | null> {
  if (!/^[a-z0-9]{16}$/.test(shareId)) return null
  return env.DB.prepare('SELECT d.*, u.name AS owner_name FROM docs d JOIN users u ON u.id = d.user_id WHERE d.share_id = ?')
    .bind(shareId).first<DocRow & { owner_name: string }>()
}

export async function getShare(_req: Request, env: Env, shareId: string): Promise<Response> {
  const row = await sharedDoc(env, shareId)
  if (!row) throw new HttpError(404, '共有リンクが見つかりません')
  const obj = await env.BUCKET.get(docKey(row.user_id, row.id))
  if (!obj) throw new HttpError(404, '共有リンクが見つかりません')
  const doc = JSON.parse(await obj.text()) as DesignDoc
  delete doc.thumb
  return json({ doc, ownerName: row.owner_name })
}

export async function getShareAsset(_req: Request, env: Env, shareId: string, assetId: string): Promise<Response> {
  const row = await sharedDoc(env, shareId)
  if (!row) throw new HttpError(404, '共有リンクが見つかりません')
  const a = await env.DB.prepare(
    'SELECT a.mime AS mime, a.user_id AS user_id FROM doc_assets da JOIN assets a ON a.id = da.asset_id WHERE da.doc_id = ? AND da.asset_id = ?',
  ).bind(row.id, checkId(assetId)).first<{ mime: string; user_id: string }>()
  if (!a) throw new HttpError(404, '画像が見つかりません')
  const obj = await env.BUCKET.get(assetKey(a.user_id, assetId))
  if (!obj) throw new HttpError(404, '画像が見つかりません')
  // 共有は取り消せるので長期キャッシュはしない
  return assetResponse(obj.body, a.mime, 'private, max-age=300')
}

export async function copyShare(req: Request, env: Env, shareId: string): Promise<Response> {
  const u = await requireUser(req, env)
  const row = await sharedDoc(env, shareId)
  if (!row) throw new HttpError(404, '共有リンクが見つかりません')
  const obj = await env.BUCKET.get(docKey(row.user_id, row.id))
  if (!obj) throw new HttpError(404, '共有リンクが見つかりません')
  const doc = JSON.parse(await obj.text()) as DesignDoc

  const { results: srcAssets } = await env.DB.prepare(
    'SELECT a.id AS id, a.mime AS mime, a.size AS size, a.user_id AS user_id FROM doc_assets da JOIN assets a ON a.id = da.asset_id WHERE da.doc_id = ?',
  ).bind(row.id).all<{ id: string; mime: string; size: number; user_id: string }>()

  const assetBytes = srcAssets.reduce((s, a) => s + a.size, 0)
  if ((await usedBytes(env, u.id)) + row.bytes + row.thumb_bytes + assetBytes > DEFAULT_QUOTA_BYTES) throw new HttpError(413, '保存容量の上限を超えています')

  const now = Date.now()
  const newId = crypto.randomUUID()
  const idMap = new Map<string, string>()
  const copiedKeys: string[] = []
  const stmts: D1PreparedStatement[] = []
  try {
    for (const a of srcAssets) {
      const src = await env.BUCKET.get(assetKey(a.user_id, a.id))
      if (!src) continue
      const nid = crypto.randomUUID()
      await env.BUCKET.put(assetKey(u.id, nid), await src.arrayBuffer(), { httpMetadata: { contentType: a.mime } })
      copiedKeys.push(assetKey(u.id, nid))
      idMap.set(a.id, nid)
      stmts.push(env.DB.prepare('INSERT INTO assets (id, user_id, mime, size, created_at) VALUES (?,?,?,?,?)').bind(nid, u.id, a.mime, a.size, now))
    }
    rewriteAssetIds(doc.pages, idMap)
    const copy: DesignDoc = { ...doc, id: newId, name: `${doc.name} のコピー`.slice(0, 200), createdAt: now, updatedAt: now }
    delete copy.thumb
    const text = JSON.stringify(copy)
    const docBytes = new TextEncoder().encode(text).length
    await env.BUCKET.put(docKey(u.id, newId), text, { httpMetadata: { contentType: 'application/json' } })
    copiedKeys.push(docKey(u.id, newId))
    let thumbBytes = 0
    if (row.thumb_bytes > 0) {
      const t = await env.BUCKET.get(thumbKey(row.id))
      if (t) {
        const tb = await t.arrayBuffer()
        await env.BUCKET.put(thumbKey(newId), tb, { httpMetadata: { contentType: 'image/jpeg' } })
        copiedKeys.push(thumbKey(newId))
        thumbBytes = tb.byteLength
      }
    }
    stmts.push(env.DB.prepare(
      'INSERT INTO docs (id, user_id, name, width, height, page_count, updated_at, created_at, share_id, bytes, thumb_bytes) VALUES (?,?,?,?,?,?,?,?,NULL,?,?)',
    ).bind(newId, u.id, copy.name, row.width, row.height, row.page_count, now, now, docBytes, thumbBytes))
    // docs より先に assets を入れ、doc_assets は最後(外部キー順)
    for (const nid of idMap.values()) stmts.push(env.DB.prepare('INSERT INTO doc_assets (doc_id, asset_id) VALUES (?, ?)').bind(newId, nid))
    await env.DB.batch(stmts)
  } catch {
    await env.BUCKET.delete(copiedKeys)
    throw new HttpError(500, 'コピーに失敗しました。もう一度お試しください')
  }
  return json({ id: newId })
}

export { getSessionUser }
