// 共同編集の通信: 部屋(Durable Object)と WebSocket でつなぎ、Y.Doc と awareness を交換する
// メッセージの型は y-websocket と同じ(0 = sync, 1 = awareness)。文字列の 'ping' / 'pong' / 'hello' / {error} は制御用
import * as Y from 'yjs'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'

export type CollabStatus = 'connecting' | 'online' | 'offline'
const MSG_SYNC = 0
const MSG_AWARENESS = 1

const API = '/api/collab'

/** 部屋を作る(作った人が呼ぶ) */
export async function createRoom(): Promise<string> {
  let r: Response
  try { r = await fetch(API, { method: 'POST', headers: { 'X-Irodori': '1' }, credentials: 'same-origin' }) }
  catch { throw new Error('サーバーに接続できません。通信環境を確認してください') }
  const d = await r.json().catch(() => ({}))
  if (!r.ok || !d.room) throw new Error(d?.error ?? `部屋を作れませんでした(${r.status})`)
  return d.room as string
}

export class CollabSession {
  readonly room: string
  readonly doc = new Y.Doc()
  readonly awareness: awarenessProtocol.Awareness
  status: CollabStatus = 'connecting'
  /** 最初の同期(サーバーの今の状態を受け取ること)が済んだか */
  synced = false
  /** 再接続しても直らない状態(部屋が無い・満員)の説明。空なら通常 */
  fatal = ''
  private ws: WebSocket | null = null
  private attempts = 0
  private opened = false
  private destroyed = false
  private retryTimer = 0
  private pingTimer = 0
  private statusFns = new Set<() => void>()
  private syncedFns = new Set<() => void>()
  private errorFns = new Set<(msg: string) => void>()

  constructor(room: string) {
    this.room = room
    this.awareness = new awarenessProtocol.Awareness(this.doc)
    this.doc.on('update', this.onDocUpdate)
    this.awareness.on('update', this.onAwarenessUpdate)
    window.addEventListener('online', this.onOnline)
    this.connect()
  }

  // ---- 購読
  onStatus(fn: () => void) { this.statusFns.add(fn); return () => { this.statusFns.delete(fn) } }
  onError(fn: (msg: string) => void) { this.errorFns.add(fn); return () => { this.errorFns.delete(fn) } }
  /** 最初の同期が済んだら 1 回呼ぶ(すでに済んでいれば即座に) */
  whenSynced(fn: () => void) {
    if (this.synced) { fn(); return () => {} }
    this.syncedFns.add(fn)
    return () => { this.syncedFns.delete(fn) }
  }

  private setStatus(s: CollabStatus) {
    if (this.status === s) return
    this.status = s
    this.statusFns.forEach((f) => f())
  }

  // ---- 接続
  private connect() {
    if (this.destroyed || this.fatal) return
    clearTimeout(this.retryTimer)
    this.setStatus('connecting')
    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${proto}://${location.host}${API}/${encodeURIComponent(this.room)}/ws`)
    ws.binaryType = 'arraybuffer'
    this.ws = ws
    this.opened = false
    ws.onopen = () => {
      if (this.ws !== ws) return
      this.opened = true
      this.attempts = 0
      this.setStatus('online')
      // こちらの状態を渡し、サーバーの状態を受け取る
      const enc = encoding.createEncoder()
      encoding.writeVarUint(enc, MSG_SYNC)
      syncProtocol.writeSyncStep1(enc, this.doc)
      this.send(encoding.toUint8Array(enc))
      if (this.awareness.getLocalState() !== null) this.sendAwareness([this.doc.clientID])
      clearInterval(this.pingTimer)
      this.pingTimer = window.setInterval(() => { try { ws.send('ping') } catch { /* 切れた */ } }, 25_000)
    }
    ws.onmessage = (e) => { if (this.ws === ws) this.onMessage(e.data) }
    ws.onclose = (e) => { if (this.ws === ws) this.onClose(e) }
    ws.onerror = () => { /* onclose で扱う */ }
  }

  private onClose(e: CloseEvent) {
    clearInterval(this.pingTimer)
    this.ws = null
    // 他の人のカーソルは、つながっていない間は出さない
    const others = [...this.awareness.getStates().keys()].filter((id) => id !== this.doc.clientID)
    awarenessProtocol.removeAwarenessStates(this.awareness, others, this)
    this.setStatus('offline')
    if (this.destroyed) return
    if (e.code === 4004) {
      this.fatal = e.reason || '部屋が見つかりません'
      this.setStatus('offline')
      this.errorFns.forEach((f) => f(this.fatal))
      return
    }
    // 一度もつながれなかったときは、部屋が無いのか通信が悪いのかを確かめる
    if (!this.opened) this.check()
    const delay = Math.min(30_000, 1000 * 2 ** this.attempts)
    this.attempts++
    this.retryTimer = window.setTimeout(() => this.connect(), delay)
  }

  private async check() {
    try {
      const r = await fetch(`${API}/${encodeURIComponent(this.room)}`, { credentials: 'same-origin' })
      const d = r.ok ? await r.json().catch(() => ({})) : {}
      if (r.status === 404 || d?.full) {
        this.fatal = r.status === 404 ? 'この部屋は見つかりません(期限切れか、リンクが違います)' : '部屋が満員です(同時に参加できるのは 20 人まで)。人が減ってから、リンクを開き直してください'
        clearTimeout(this.retryTimer)
        this.errorFns.forEach((f) => f(this.fatal))
        this.statusFns.forEach((f) => f())
      }
    } catch { /* 通信できないだけ。再接続を続ける */ }
  }

  private onOnline = () => {
    if (this.destroyed || this.fatal || this.status === 'online') return
    this.attempts = 0
    clearTimeout(this.retryTimer)
    this.connect()
  }

  private send(data: Uint8Array | string) {
    const ws = this.ws
    if (ws && ws.readyState === WebSocket.OPEN) { try { ws.send(data as string | ArrayBufferView<ArrayBuffer>) } catch { /* 切れた */ } }
  }

  private sendAwareness(clients: number[]) {
    const enc = encoding.createEncoder()
    encoding.writeVarUint(enc, MSG_AWARENESS)
    encoding.writeVarUint8Array(enc, awarenessProtocol.encodeAwarenessUpdate(this.awareness, clients))
    this.send(encoding.toUint8Array(enc))
  }

  // ---- 受信
  private onMessage(data: unknown) {
    if (typeof data === 'string') {
      if (data === 'hello') { if (this.awareness.getLocalState() !== null) this.sendAwareness([this.doc.clientID]); return }
      if (data === 'pong') return
      try { const m = JSON.parse(data); if (m?.error) this.errorFns.forEach((f) => f(String(m.error))) } catch { /* 無視 */ }
      return
    }
    if (!(data instanceof ArrayBuffer)) return
    try {
      const dec = decoding.createDecoder(new Uint8Array(data))
      const type = decoding.readVarUint(dec)
      if (type === MSG_SYNC) {
        const enc = encoding.createEncoder()
        encoding.writeVarUint(enc, MSG_SYNC)
        const sub = syncProtocol.readSyncMessage(dec, enc, this.doc, this)
        if (encoding.length(enc) > 1) this.send(encoding.toUint8Array(enc))
        // step2 = サーバーの今の状態を受け取り終えた
        if (sub === syncProtocol.messageYjsSyncStep2 && !this.synced) {
          this.synced = true
          const fns = [...this.syncedFns]
          this.syncedFns.clear()
          fns.forEach((f) => f())
        }
      } else if (type === MSG_AWARENESS) {
        awarenessProtocol.applyAwarenessUpdate(this.awareness, decoding.readVarUint8Array(dec), this)
      }
    } catch (e) {
      console.warn('共同編集: 受信データを処理できませんでした', e)
    }
  }

  // ---- 送信(手元の変更)
  private onDocUpdate = (update: Uint8Array, origin: unknown) => {
    if (origin === this) return // 受け取った物を送り返さない
    const enc = encoding.createEncoder()
    encoding.writeVarUint(enc, MSG_SYNC)
    syncProtocol.writeUpdate(enc, update)
    this.send(encoding.toUint8Array(enc))
  }

  private onAwarenessUpdate = (c: { added: number[]; updated: number[]; removed: number[] }, origin: unknown) => {
    if (origin === this) return
    this.sendAwareness([...c.added, ...c.updated, ...c.removed])
  }

  /** 切断してあとかたづけ(参加者の表示から消えるよう、先に自分の状態を空にして送る) */
  destroy() {
    if (this.destroyed) return
    try { this.awareness.setLocalState(null) } catch { /* 無し */ }
    this.destroyed = true
    clearTimeout(this.retryTimer)
    clearInterval(this.pingTimer)
    window.removeEventListener('online', this.onOnline)
    const ws = this.ws
    this.ws = null
    if (ws) { try { ws.close(1000) } catch { /* 閉じ済み */ } }
    this.awareness.destroy()
    this.doc.destroy()
    this.statusFns.clear(); this.syncedFns.clear(); this.errorFns.clear()
  }
}
