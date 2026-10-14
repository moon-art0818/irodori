// リアルタイム共同編集: 部屋(Durable Object)と、部屋ごとの画像置き場(R2)
// 設計は docs/dev/collab-design.md。部屋 ID(128bit 以上の乱数)を知っていることが鍵
import { DurableObject } from 'cloudflare:workers'
import * as Y from 'yjs'
import * as syncProtocol from 'y-protocols/sync'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import { HttpError, json, randomBytes, sniffOk, toBase64Url, type Env } from './util'

const ROOM_RE = /^[A-Za-z0-9_-]{24}$/ // 作成時は 18 バイト = 24 文字。それ以外の名前では Durable Object を起こさない
const ASSET_ID_RE = /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,99}$/
/** 画像と(後で使う)動画・音声だけ */
const MIME_RE = /^(image\/(png|jpeg|webp|gif|svg\+xml)|video\/mp4|video\/webm|audio\/mpeg|audio\/ogg|audio\/wav)$/

const MAX_CONN = 20
const MAX_MESSAGE = 2 * 1024 * 1024
const MAX_DOC_BYTES = 20 * 1024 * 1024
/** 上限を超えた後も、削除や文字直しなどの小さな更新は受け付ける(部屋が固まらないように)。この大きさを超えたら全部止める */
const SMALL_UPDATE = 64 * 1024
const HARD_MAX_DOC_BYTES = 24 * 1024 * 1024
const CHUNK = 1024 * 1024
const SAVE_DELAY_MS = 2000
const TTL_MS = 30 * 24 * 60 * 60 * 1000
const MAX_ASSET_BYTES = 15 * 1024 * 1024
const MAX_ROOM_ASSET_BYTES = 300 * 1024 * 1024
const MAX_ROOM_ASSETS = 500

const MSG_SYNC = 0
const MSG_AWARENESS = 1

const assetPrefix = (room: string) => `collab/${room}/`

// ---------------------------------------------------------------- Worker 側の入口

type Stub = DurableObjectStub<CollabRoom>
const stubOf = (env: Env, room: string): Stub => env.COLLAB.get(env.COLLAB.idFromName(room))

function checkRoom(room: string): string {
  if (!ROOM_RE.test(room)) throw new HttpError(404, '部屋が見つかりません')
  return room
}

async function limit(env: Env, req: Request, kind: string) {
  if (!env.COLLAB_LIMIT) return
  const ip = req.headers.get('CF-Connecting-IP') ?? 'local'
  if (!(await env.COLLAB_LIMIT.limit({ key: kind + ':' + ip })).success) throw new HttpError(429, '操作が多すぎます。少し待ってからお試しください')
}

/** /api/collab 以下をすべて受け持つ(CSRF の確認は呼び出し側) */
export async function handleCollab(req: Request, env: Env, url: URL): Promise<Response> {
  if (!env.COLLAB) throw new HttpError(503, 'この環境では共同編集を使えません(Durable Object が未設定です)')
  const path = url.pathname.replace(/\/+$/, '')
  if (path === '/api/collab') {
    if (req.method !== 'POST') throw new HttpError(405, '許可されていない操作です')
    // 部屋の作成は画像 1 枚より重いので、回数枠を 6 回分使う
    for (let i = 0; i < 6; i++) await limit(env, req, 'c')
    const room = toBase64Url(randomBytes(18)) // 144 bit → 24 文字
    await stubOf(env, room).init(room)
    return json({ room })
  }
  const m = /^\/api\/collab\/([^/]+)(?:\/(ws|assets)(?:\/([^/]+))?)?$/.exec(path)
  if (!m) throw new HttpError(404, '見つかりません')
  const dec = (s: string) => { try { return decodeURIComponent(s) } catch { throw new HttpError(400, 'URL の形式が正しくありません') } }
  const room = checkRoom(dec(m[1]))
  const stub = stubOf(env, room)
  if (!m[2]) {
    if (req.method !== 'GET') throw new HttpError(405, '許可されていない操作です')
    await limit(env, req, 's')
    const st = await stub.status()
    if (!st.exists) throw new HttpError(404, '部屋が見つかりません(期限切れか、リンクが違います)')
    return json({ room, full: st.full })
  }
  if (m[2] === 'ws') {
    if (req.headers.get('Upgrade')?.toLowerCase() !== 'websocket') throw new HttpError(426, 'WebSocket で接続してください')
    // 別のサイトのページからの接続を断る(Origin は同一ホストのみ)
    const origin = req.headers.get('Origin')
    if (origin) { let host = ''; try { host = new URL(origin).host } catch { /* 不正 */ } if (host !== url.host) throw new HttpError(403, '不正なリクエストです') }
    await limit(env, req, 's')
    return stub.fetch(req)
  }
  // assets
  if (!m[3]) throw new HttpError(404, '見つかりません')
  const assetId = dec(m[3])
  if (!ASSET_ID_RE.test(assetId)) throw new HttpError(400, '画像 ID の形式が正しくありません')
  const key = assetPrefix(room) + assetId
  if (req.method === 'GET') {
    const obj = await env.BUCKET.get(key)
    if (!obj) throw new HttpError(404, '画像が見つかりません')
    return new Response(obj.body, {
      headers: {
        'Content-Type': obj.httpMetadata?.contentType ?? 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, max-age=31536000, immutable',
        // 直接開かれても中のスクリプトを実行させない
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    })
  }
  if (req.method !== 'PUT') throw new HttpError(405, '許可されていない操作です')
  await limit(env, req, 'a')
  if (!(await stub.exists())) throw new HttpError(404, '部屋が見つかりません(期限切れか、リンクが違います)')
  const mime = (req.headers.get('Content-Type') ?? '').split(';')[0].trim().toLowerCase()
  if (!MIME_RE.test(mime)) throw new HttpError(415, '対応していない形式です(PNG / JPEG / WebP / GIF / SVG / MP4 / WebM / MP3 / OGG / WAV)')
  const len = Number(req.headers.get('Content-Length') ?? 0)
  if (!Number.isFinite(len) || len <= 0) throw new HttpError(411, '大きさ(Content-Length)が必要です')
  if (len > MAX_ASSET_BYTES) throw new HttpError(413, 'ファイルが大きすぎます(最大15MB)')
  // 画像 ID ごとに一度だけ置く(同じ ID は同じ中身)
  if (await env.BUCKET.head(key)) return json({ ok: true })
  let count = 0, bytes = 0, cursor: string | undefined
  do {
    const l = await env.BUCKET.list({ prefix: assetPrefix(room), cursor, limit: 1000 })
    for (const o of l.objects) { count++; bytes += o.size }
    cursor = l.truncated ? l.cursor : undefined
  } while (cursor)
  if (count >= MAX_ROOM_ASSETS) throw new HttpError(413, 'この部屋の画像は上限(500 件)に達しています')
  if (bytes + len > MAX_ROOM_ASSET_BYTES) throw new HttpError(413, 'この部屋の画像の合計は上限(300MB)を超えます')
  // 中身を読み、大きさと形式(先頭のバイト)を確かめてから置く(任意のファイル置き場にさせない)
  const buf = new Uint8Array(await req.arrayBuffer())
  if (buf.length === 0) throw new HttpError(400, '画像が空です')
  if (buf.length > MAX_ASSET_BYTES || buf.length !== len) throw new HttpError(413, 'ファイルが大きすぎるか、大きさが合いません')
  if (!sniffOk(mime, buf)) throw new HttpError(415, 'ファイルの中身が形式と一致しません')
  await env.BUCKET.put(key, buf, { httpMetadata: { contentType: mime } })
  await stub.touch()
  return json({ ok: true })
}

// ---------------------------------------------------------------- Durable Object

interface Meta { room: string; createdAt: number; lastActive: number; chunks: number }
/** 接続ごとに覚える awareness の clientID → 最後の clock(切断時に「消えた」と知らせるため) */
interface Attach { c: Record<string, number> }

export class CollabRoom extends DurableObject<Env> {
  private doc = new Y.Doc()
  private meta: Meta | null = null
  private dirty = false
  private approx = 0
  private touchedAt = 0

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'))
    ctx.blockConcurrencyWhile(async () => {
      this.meta = (await ctx.storage.get<Meta>('meta')) ?? null
      if (this.meta) {
        const keys = Array.from({ length: this.meta.chunks }, (_, i) => 'd' + i)
        const got = keys.length ? await ctx.storage.get<Uint8Array>(keys) : new Map<string, Uint8Array>()
        const parts = keys.map((k) => got.get(k)).filter((x): x is Uint8Array => !!x)
        const total = parts.reduce((s, p) => s + p.length, 0)
        if (total) {
          const all = new Uint8Array(total)
          let o = 0
          for (const p of parts) { all.set(p, o); o += p.length }
          try { Y.applyUpdate(this.doc, all) } catch (e) { console.error('collab: 保存データを読めませんでした', e) }
        }
        this.approx = total
      }
      this.doc.on('update', this.onUpdate)
      // 眠っている間に起こされた場合: つながったままの端末と同期し直す(保存データを読み終えてから)
      for (const ws of ctx.getWebSockets()) this.sendStep1(ws)
    })
  }

  // ---- RPC(Worker から呼ぶ)
  async init(room: string): Promise<void> {
    if (this.meta) return
    const now = Date.now()
    this.meta = { room, createdAt: now, lastActive: now, chunks: 0 }
    await this.ctx.storage.put('meta', this.meta)
    await this.ctx.storage.setAlarm(now + TTL_MS)
  }
  async exists(): Promise<boolean> { return !!this.meta }
  async status(): Promise<{ exists: boolean; full: boolean }> { return { exists: !!this.meta, full: this.ctx.getWebSockets().length >= MAX_CONN } }
  async touch(): Promise<void> { await this.markActive() }

  private async markActive(force = false) {
    if (!this.meta) return
    const now = Date.now()
    if (!force && now - this.touchedAt < 60_000) return
    this.touchedAt = now
    this.meta.lastActive = now
    await this.ctx.storage.put('meta', this.meta)
  }

  // ---- WebSocket の受け入れ
  async fetch(req: Request): Promise<Response> {
    if (!this.meta) return new Response('not found', { status: 404 })
    if (req.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('expected websocket', { status: 426 })
    // 満員なら接続させない(クライアントは GET /api/collab/:room の full で理由を知る)
    if (this.ctx.getWebSockets().length >= MAX_CONN) return new Response('room is full', { status: 503 })
    const pair = new WebSocketPair()
    const [client, server] = [pair[0], pair[1]]
    this.ctx.acceptWebSocket(server)
    server.serializeAttachment({ c: {} } satisfies Attach)
    this.sendStep1(server)
    // 先にいる人に、自分のカーソルなどをもう一度送ってもらう(サーバーは awareness を持たない)
    for (const w of this.ctx.getWebSockets()) if (w !== server) { try { w.send('hello') } catch { /* 切れかけ */ } }
    await this.markActive()
    return new Response(null, { status: 101, webSocket: client })
  }

  private sendStep1(ws: WebSocket) {
    const enc = encoding.createEncoder()
    encoding.writeVarUint(enc, MSG_SYNC)
    syncProtocol.writeSyncStep1(enc, this.doc)
    try { ws.send(encoding.toUint8Array(enc)) } catch { /* 切れかけ */ }
  }

  private onUpdate = (update: Uint8Array, origin: unknown) => {
    const enc = encoding.createEncoder()
    encoding.writeVarUint(enc, MSG_SYNC)
    syncProtocol.writeUpdate(enc, update)
    const msg = encoding.toUint8Array(enc)
    for (const w of this.ctx.getWebSockets()) {
      if (w === origin) continue
      try { w.send(msg) } catch { /* 切れかけ */ }
    }
  }

  /** 接続ごとの送信回数(10 秒あたり)。連打で無料枠を使い切られないように */
  private rate = new WeakMap<WebSocket, { t: number; n: number; bytes: number }>()

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message === 'string') return // 'ping' は自動応答。それ以外は無視
    const now = Date.now()
    let r = this.rate.get(ws)
    if (!r || now - r.t > 10_000) { r = { t: now, n: 0, bytes: 0 }; this.rate.set(ws, r) }
    r.n++; r.bytes += message.byteLength
    // 普通の編集(カーソルは 10 回/秒まで)なら 10 秒で 300 回・10MB には届かない
    if (r.n > 300 || r.bytes > 10 * 1024 * 1024) { this.sendError(ws, '送信が多すぎるため接続を切りました。少し待ってから開き直してください'); try { ws.close(4008, 'rate') } catch { /* 閉じ済み */ } return }
    if (message.byteLength > MAX_MESSAGE) { this.sendError(ws, 'データが大きすぎます(1 回に送れるのは 2MB までです)'); return }
    const u8 = new Uint8Array(message)
    try {
      const dec = decoding.createDecoder(u8)
      const type = decoding.readVarUint(dec)
      if (type === MSG_SYNC) {
        const sub = decoding.peekVarUint(dec) // 0 = step1(質問), 1 = step2, 2 = update
        const cap = u8.length <= SMALL_UPDATE ? HARD_MAX_DOC_BYTES : MAX_DOC_BYTES
        if (sub !== 0 && this.approx + u8.length > cap) {
          // 目安が上限を超えたら、実際の大きさを測り直してから判断する
          this.approx = Y.encodeStateAsUpdate(this.doc).length
          if (this.approx + u8.length > cap) { this.sendError(ws, 'この部屋のデザインが大きすぎて、これ以上は保存できません(上限 20MB)'); return }
        }
        const enc = encoding.createEncoder()
        encoding.writeVarUint(enc, MSG_SYNC)
        syncProtocol.readSyncMessage(dec, enc, this.doc, ws)
        if (encoding.length(enc) > 1) ws.send(encoding.toUint8Array(enc))
        if (sub !== 0) { this.approx += u8.length; await this.markDirty() }
      } else if (type === MSG_AWARENESS) {
        this.trackAwareness(ws, decoding.readVarUint8Array(dec))
        for (const w of this.ctx.getWebSockets()) if (w !== ws) { try { w.send(u8) } catch { /* 切れかけ */ } }
      }
    } catch (e) {
      console.error('collab: メッセージを処理できませんでした', e)
    }
  }

  private sendError(ws: WebSocket, error: string) {
    try { ws.send(JSON.stringify({ error })) } catch { /* 切れかけ */ }
  }

  /** awareness の更新から clientID と clock を読み取って接続に覚えさせる */
  private trackAwareness(ws: WebSocket, update: Uint8Array) {
    const att = (ws.deserializeAttachment() as Attach | null) ?? { c: {} }
    const dec = decoding.createDecoder(update)
    const n = decoding.readVarUint(dec)
    for (let i = 0; i < n; i++) {
      const id = decoding.readVarUint(dec)
      const clock = decoding.readVarUint(dec)
      const state = decoding.readVarString(dec)
      if (state === 'null') delete att.c[id]
      else if (Object.keys(att.c).length < 8 || id in att.c) att.c[id] = clock
    }
    ws.serializeAttachment(att)
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    this.cleanup(ws)
    // 最後の人が抜けるときに保存し忘れない・期限の起点を「最後に使われた時」にする
    try { if (this.dirty) await this.save(); else await this.markActive(true) } catch (e) { console.error('collab: 保存に失敗', e) }
    try { ws.close(code === 1005 || code === 1006 ? 1000 : code, reason.slice(0, 100)) } catch { /* 閉じ済み */ }
  }
  async webSocketError(ws: WebSocket): Promise<void> { this.cleanup(ws) }

  /** 切れた接続の参加者を、残った人に「消えた」と知らせる */
  private cleanup(ws: WebSocket) {
    let att: Attach | null = null
    try { att = ws.deserializeAttachment() as Attach | null } catch { /* 無い */ }
    const ids = Object.entries(att?.c ?? {})
    if (!ids.length) return
    const inner = encoding.createEncoder()
    encoding.writeVarUint(inner, ids.length)
    for (const [id, clock] of ids) {
      encoding.writeVarUint(inner, Number(id))
      encoding.writeVarUint(inner, clock + 1)
      encoding.writeVarString(inner, 'null')
    }
    const enc = encoding.createEncoder()
    encoding.writeVarUint(enc, MSG_AWARENESS)
    encoding.writeVarUint8Array(enc, encoding.toUint8Array(inner))
    const msg = encoding.toUint8Array(enc)
    for (const w of this.ctx.getWebSockets()) if (w !== ws) { try { w.send(msg) } catch { /* 切れかけ */ } }
  }

  // ---- 保存と期限
  private async markDirty() {
    this.dirty = true
    if (this.meta) this.meta.lastActive = Date.now()
    const now = Date.now()
    const a = await this.ctx.storage.getAlarm()
    if (a === null || a > now + SAVE_DELAY_MS) await this.ctx.storage.setAlarm(now + SAVE_DELAY_MS)
  }

  private async save() {
    if (!this.meta) return
    this.dirty = false
    try { await this.saveNow() } catch (e) { this.dirty = true; throw e } // 失敗したら、次の alarm でもう一度書く
  }

  private async saveNow() {
    if (!this.meta) return
    const state = Y.encodeStateAsUpdate(this.doc)
    const n = Math.max(1, Math.ceil(state.length / CHUNK))
    const old = this.meta.chunks
    this.meta.chunks = n
    this.meta.lastActive = Date.now()
    const entries: Record<string, unknown> = { meta: this.meta }
    for (let i = 0; i < n; i++) entries['d' + i] = state.slice(i * CHUNK, (i + 1) * CHUNK)
    await this.ctx.storage.put(entries) // 1 回の put は一括で書かれる(途中の状態は残らない)
    if (old > n) await this.ctx.storage.delete(Array.from({ length: old - n }, (_, i) => 'd' + (n + i)))
    this.approx = state.length
  }

  async alarm(): Promise<void> {
    if (!this.meta) return
    const now = Date.now()
    if (this.dirty) await this.save()
    const live = this.ctx.getWebSockets().length > 0
    if (live) { this.meta.lastActive = now; await this.ctx.storage.put('meta', this.meta) }
    if (!live && now - this.meta.lastActive > TTL_MS) { await this.destroyRoom(); return }
    // まだ書き足りない変更があれば短く、なければ期限の確認まで待つ
    await this.ctx.storage.setAlarm(this.dirty ? now + SAVE_DELAY_MS : this.meta.lastActive + TTL_MS)
  }

  private async destroyRoom() {
    const room = this.meta?.room
    for (const ws of this.ctx.getWebSockets()) { try { ws.close(4004, '期限切れで部屋を削除しました') } catch { /* 閉じ済み */ } }
    if (room) {
      let cursor: string | undefined
      do {
        const l = await this.env.BUCKET.list({ prefix: assetPrefix(room), cursor, limit: 1000 })
        if (l.objects.length) await this.env.BUCKET.delete(l.objects.map((o) => o.key))
        cursor = l.truncated ? l.cursor : undefined
      } while (cursor)
    }
    this.meta = null
    this.dirty = false
    this.doc.destroy()
    this.doc = new Y.Doc()
    this.doc.on('update', this.onUpdate)
    await this.ctx.storage.deleteAlarm()
    await this.ctx.storage.deleteAll()
  }
}
