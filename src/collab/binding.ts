// DesignDoc(手元のデザイン)と Y.Doc(部屋の共有状態)の相互反映
// Y.Doc の形は docs/dev/collab-design.md のとおり:
//   meta: Y.Map { name, width, height, print? }  /  assets: Y.Map<id, true>
//   pages: Y.Array<Y.Map { id, top(JSON), objs: Y.Map<id, JSON>, order(JSON 配列) }>
//
// 「基準(PageBase)」: ページごとに、オブジェクト id → 文字列を 2 通り覚える。
//   y     = 最後に見た(または書いた)部屋側の文字列。他の人の変更かどうかの判定に使う
//   local = 最後に手元で作った文字列(canvas の書き出し)。自分が変えたかどうかの判定に使う
// 同じ内容でも書き出しの細かい違い(数値の丸めなど)があるので、両方を別々に持ち、
// 触っていない物を書き戻して他の人の変更を踏みつぶさないようにする。
import * as Y from 'yjs'
import { uid, type EditorCore } from '../editor/core'
import { getAssetURL, setRemoteAssetFetcher } from '../editor/assets'
import type { DesignDoc, PageData } from '../editor/types'
import type { CollabSession } from './session'

/** 手元の操作による書き込みの origin(取り消しの対象) */
export const LOCAL = { name: 'irodori-local' }
/** 初期の流し込み・画像の登録など、取り消しの対象にしない書き込みの origin */
export const INIT = { name: 'irodori-init' }

type YPage = Y.Map<any>

interface PageBase {
  y: Map<string, string>
  local: Map<string, string>
  topY: string
  topL: string
  orderY: string
  orderL: string
}

export interface RemoteInfo {
  /** 最初の同期で部屋の内容に切り替えた(全ページが入れ替わった) */
  adopt: boolean
  structural: boolean
  meta: boolean
  changedPages: string[]
}

// ---------------------------------------------------------------- 読み出し(Y → PageData)

const SRC_OK = /^https:\/\/(images\.unsplash\.com|images\.pexels\.com)\//
const DATA_OK = /^data:image\/(png|jpeg|webp|gif);/
/** 他の人が書いた JSON を信用しない: 自分の画像(assetId)以外の外部 URL は読み込ませない(サーバー保存時と同じ規則) */
const ASSET_OK = /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,99}$/
function sanitize(o: any): void {
  if (Array.isArray(o)) { o.forEach(sanitize); return }
  if (!o || typeof o !== 'object') return
  if (o.assetId !== undefined && !(typeof o.assetId === 'string' && ASSET_OK.test(o.assetId))) delete o.assetId
  if (typeof o.src === 'string' && (o.assetId || !(SRC_OK.test(o.src) || DATA_OK.test(o.src)))) delete o.src
  for (const v of Object.values(o)) sanitize(v)
}

function parse(s: unknown): any {
  if (typeof s !== 'string') return undefined
  try { return JSON.parse(s) } catch { return undefined }
}

/** 並び順: order にある物を順に、order に無いが objs にある物は末尾に id 順 */
function readIds(m: YPage): string[] {
  const objs = m.get('objs') as Y.Map<string> | undefined
  if (!objs) return []
  const order = parse(m.get('order'))
  const seen = new Set<string>()
  const out: string[] = []
  if (Array.isArray(order)) for (const id of order) if (typeof id === 'string' && objs.has(id) && !seen.has(id)) { seen.add(id); out.push(id) }
  for (const id of [...objs.keys()].sort()) if (!seen.has(id)) out.push(id)
  return out
}

export function readPage(m: YPage): PageData {
  const top = parse(m.get('top'))
  sanitize(top) // 背景画像などに外部 URL を仕込まれても読み込まない
  const objs = m.get('objs') as Y.Map<string> | undefined
  const objects: any[] = []
  for (const id of readIds(m)) {
    const o = parse(objs?.get(id))
    if (!o || typeof o !== 'object' || Array.isArray(o)) continue
    o.id = id
    sanitize(o)
    objects.push(o)
  }
  return { id: String(m.get('id')), json: { ...(top && typeof top === 'object' ? top : {}), objects } }
}

/** 部屋の内容から DesignDoc の中身を読む(部屋に入った人が手元のデザインを作るとき) */
export function readDoc(ydoc: Y.Doc): Pick<DesignDoc, 'name' | 'width' | 'height' | 'print' | 'pages'> | null {
  const pages = ydoc.getArray<YPage>('pages')
  if (pages.length === 0) return null
  const meta = ydoc.getMap<any>('meta')
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= 10000 ? v : d)
  const print = parse(meta.get('print'))
  return {
    name: typeof meta.get('name') === 'string' && meta.get('name') ? meta.get('name') : '共同編集のデザイン',
    width: num(meta.get('width'), 1080),
    height: num(meta.get('height'), 1080),
    print: print && typeof print === 'object' ? print : undefined,
    pages: pages.toArray().map(readPage),
  }
}

const topOf = (json: any): string => { const { objects: _o, ...top } = json ?? {}; return JSON.stringify(top) }
const orderOf = (json: any): string => JSON.stringify((json?.objects ?? []).map((o: any) => o.id))

function baseFromY(m: YPage): PageBase {
  const objs = m.get('objs') as Y.Map<string> | undefined
  const y = new Map<string, string>()
  const local = new Map<string, string>()
  const pg = readPage(m)
  for (const o of pg.json.objects) {
    const raw = objs?.get(o.id)
    if (typeof raw !== 'string') continue
    y.set(o.id, raw)
    local.set(o.id, JSON.stringify(o)) // 取り込んだ物を手元の文字列と見なす(sanitize で変わった分は次の書き込みで直る)
  }
  const top = (m.get('top') as string | undefined) ?? '{}'
  const order = (m.get('order') as string | undefined) ?? '[]'
  return { y, local, topY: top, topL: top, orderY: order, orderL: JSON.stringify(pg.json.objects.map((o: any) => o.id)) }
}

const emptyBase = (): PageBase => ({ y: new Map(), local: new Map(), topY: '', topL: '', orderY: '', orderL: '' })

// ---------------------------------------------------------------- 本体

export class CollabBinding {
  readonly session: CollabSession
  readonly ydoc: Y.Doc
  readonly meta: Y.Map<any>
  readonly pages: Y.Array<YPage>
  readonly assets: Y.Map<boolean>
  readonly um: Y.UndoManager
  /** 最初の同期が済み、手元と部屋の内容が揃った */
  ready = false
  onRemote?: (i: RemoteInfo) => void
  private getDoc: () => DesignDoc | null
  private notify: (msg: string) => void
  private ed: EditorCore | null = null
  private bases = new Map<string, PageBase>()
  /** 最後に見たページの Y.Map(同じ id で入れ直されたページ=並べ替え・取り消しでの復活を見分ける) */
  private known = new Map<string, YPage>()
  private uploads = new Map<string, number>()
  private initIds = new Set<string>()
  private repushInit = false
  private uploading = new Set<string>()
  private failed = new Set<string>()
  private repushTimer = 0
  private syncing = false
  private again = false
  private destroyed = false
  private offSynced: (() => void) | null = null
  private seeding = false

  constructor(session: CollabSession, getDoc: () => DesignDoc | null, notify: (msg: string) => void) {
    this.session = session
    this.ydoc = session.doc
    this.getDoc = getDoc
    this.notify = notify
    this.meta = this.ydoc.getMap('meta')
    this.pages = this.ydoc.getArray('pages')
    this.assets = this.ydoc.getMap('assets')
    this.um = new Y.UndoManager([this.meta, this.pages], { trackedOrigins: new Set([LOCAL]), captureTimeout: 600 })
    this.um.on('stack-item-added', () => this.ed?.emit())
    this.um.on('stack-item-popped', () => this.ed?.emit())
    this.ydoc.on('afterTransaction', this.onTxn)
    setRemoteAssetFetcher(this.fetchAsset)
    this.offSynced = session.whenSynced(() => this.firstSync())
  }

  /** エディタをつなぐ(取り消しを Y.UndoManager に切り替え、文字入力中の変化も届ける) */
  attach(ed: EditorCore) {
    this.ed = ed
    ed.liveText = true
    ed.onShown = (pid) => this.rebasePage(pid)
    ed.onRemoteFlush = () => { void this.syncCurrentPage() }
    ed.setUndoHandler({
      undo: () => { this.um.undo() },
      redo: () => { this.um.redo() },
      canUndo: () => this.um.undoStack.length > 0,
      canRedo: () => this.um.redoStack.length > 0,
    })
    if (ed.pageId) this.rebasePage(ed.pageId)
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    clearTimeout(this.repushTimer)
    this.offSynced?.()
    this.ydoc.off('afterTransaction', this.onTxn)
    setRemoteAssetFetcher(null)
    const ed = this.ed
    if (ed) { ed.liveText = false; ed.onShown = undefined; ed.onRemoteFlush = undefined; ed.setUndoHandler(null) }
    this.ed = null
    this.um.destroy()
  }

  // ---- 最初の同期
  private firstSync() {
    if (this.destroyed) return
    const d = this.getDoc()
    if (!d) return
    this.ready = true
    if (this.pages.length === 0) {
      // 空の部屋(作ったばかり、または期限切れで消えた後): 手元の内容を流し込む
      // (1 メッセージが大きくなりすぎないよう、ページごとに分けて書く)
      this.seeding = true
      this.ydoc.transact(() => { this.pushMeta(d); this.pushStructure(d) }, INIT)
      for (const p of d.pages) this.ydoc.transact(() => { const m = this.pages.toArray().find((x) => x.get('id') === p.id); if (m) this.pushPage(m, p) }, INIT)
      this.seeding = false
      this.noteKnown()
      this.um.clear()
      return
    }
    // 部屋に内容がある: 部屋の内容を正とする(この端末でこの前に閉じたときの未送信分は残らない)
    const r = readDoc(this.ydoc)!
    d.name = r.name; d.width = r.width; d.height = r.height
    if (r.print) d.print = r.print; else delete d.print
    d.pages = r.pages
    this.bases.clear()
    for (const m of this.pages.toArray()) this.bases.set(String(m.get('id')), baseFromY(m))
    this.noteKnown()
    this.um.clear()
    this.onRemote?.({ adopt: true, structural: true, meta: true, changedPages: d.pages.map((p) => p.id) })
  }

  // ---- 手元 → 部屋
  /** 手元のデザインの変更を部屋へ書く(Editor の persist から呼ぶ)。live = 文字入力の途中経過 */
  pushLocal(doc: DesignDoc, live = false) {
    if (!this.ready || this.destroyed) return
    this.push(doc, LOCAL)
    if (!live) this.um.stopCapturing() // 次の操作は別の取り消し単位にする
  }

  private push(doc: DesignDoc, origin: object) {
    this.ydoc.transact(() => {
      this.pushMeta(doc)
      this.pushStructure(doc)
      const maps = new Map<string, YPage>()
      for (const m of this.pages.toArray()) maps.set(String(m.get('id')), m)
      for (const p of doc.pages) { const m = maps.get(p.id); if (m) this.pushPage(m, p) }
    }, origin)
    this.noteKnown()
  }

  private noteKnown() {
    this.known.clear()
    for (const m of this.pages.toArray()) this.known.set(String(m.get('id')), m)
  }

  private pushMeta(doc: DesignDoc) {
    const set = (k: string, v: unknown) => { if (this.meta.get(k) !== v) this.meta.set(k, v) }
    set('name', doc.name)
    set('width', doc.width)
    set('height', doc.height)
    if (doc.print) set('print', JSON.stringify(doc.print))
    else if (this.meta.has('print')) this.meta.delete('print')
  }

  private yIds(): string[] { return this.pages.toArray().map((m) => String(m.get('id'))) }

  private skeleton(id: string): YPage {
    const m = new Y.Map<any>()
    m.set('id', id)
    m.set('top', '')
    m.set('order', '[]')
    m.set('objs', new Y.Map<string>())
    return m
  }

  /** ページの追加・削除・並べ替え(Y.Array に移動が無いので、動いたページは入れ直して中身を書き直す) */
  private pushStructure(doc: DesignDoc) {
    const want = doc.pages.map((p) => p.id)
    const wantSet = new Set(want)
    let ids = this.yIds()
    for (let i = ids.length - 1; i >= 0; i--) {
      if (!wantSet.has(ids[i]) || ids.indexOf(ids[i]) !== i) { this.pages.delete(i, 1); if (!wantSet.has(ids[i])) this.bases.delete(ids[i]) }
    }
    for (let i = 0; i < want.length; i++) {
      ids = this.yIds()
      if (ids[i] === want[i]) continue
      const j = ids.indexOf(want[i], i + 1)
      if (j >= 0) this.pages.delete(j, 1)
      this.pages.insert(i, [this.skeleton(want[i])])
      this.bases.set(want[i], emptyBase()) // 中身を全部書き直す
    }
  }

  private baseOf(m: YPage): PageBase {
    const id = String(m.get('id'))
    let b = this.bases.get(id)
    if (!b) { b = baseFromY(m); this.bases.set(id, b) }
    return b
  }

  private pushPage(m: YPage, p: PageData) {
    const b = this.baseOf(m)
    const json = p.json ?? {}
    const topS = topOf(json)
    if (topS !== b.topL) { m.set('top', topS); b.topL = topS; b.topY = topS }
    const objs = m.get('objs') as Y.Map<string>
    const list: any[] = Array.isArray(json.objects) ? json.objects : []
    const seen = new Set<string>()
    const ids: string[] = []
    let structural = false
    for (const o of list) {
      if (!o || typeof o !== 'object') continue
      if (typeof o.id !== 'string' || !o.id || seen.has(o.id)) o.id = uid()
      seen.add(o.id)
      ids.push(o.id)
      const s = JSON.stringify(o)
      if (s === b.local.get(o.id)) continue
      if (this.assetsPending(o)) continue // 画像の送信が終わってから書く(受け取った側で画像が無い状態を作らない)
      if (!b.local.has(o.id)) structural = true
      objs.set(o.id, s)
      b.local.set(o.id, s)
      b.y.set(o.id, s)
    }
    for (const id of [...b.local.keys()]) {
      if (seen.has(id)) continue
      if (objs.has(id)) objs.delete(id)
      b.local.delete(id); b.y.delete(id)
      structural = true
    }
    const orderS = JSON.stringify(ids)
    if (structural || orderS !== b.orderL) {
      if (orderS !== b.orderL || m.get('order') !== orderS) m.set('order', orderS)
      b.orderL = orderS; b.orderY = orderS
    }
  }

  // ---- 画像
  private collectAssets(o: any, out: Set<string>) {
    if (!o || typeof o !== 'object') return
    if (typeof o.assetId === 'string') out.add(o.assetId)
    if (Array.isArray(o.objects)) for (const c of o.objects) this.collectAssets(c, out)
  }

  /** まだ部屋に送っていない画像を使っていれば、送信を始めて true を返す */
  private assetsPending(o: any): boolean {
    const ids = new Set<string>()
    this.collectAssets(o, ids)
    let pending = false
    for (const id of ids) {
      if (this.assets.has(id) || this.failed.has(id)) continue
      pending = true
      if (this.seeding) this.initIds.add(id)
      if (!this.uploading.has(id)) { this.uploading.add(id); void this.upload(id) }
    }
    return pending
  }

  private async upload(id: string) {
    let retry = false
    try {
      const url = await getAssetURL(id)
      if (!url) throw new Error('この端末に画像がありません')
      const blob = await (await fetch(url)).blob()
      const r = await fetch(`/api/collab/${encodeURIComponent(this.session.room)}/assets/${encodeURIComponent(id)}`, {
        method: 'PUT', headers: { 'X-Irodori': '1', 'Content-Type': blob.type || 'application/octet-stream' }, body: blob, credentials: 'same-origin',
      })
      if (!r.ok) throw Object.assign(new Error((await r.json().catch(() => ({})))?.error ?? `送信できませんでした(${r.status})`), { status: r.status })
      if (!this.destroyed) this.ydoc.transact(() => { this.assets.set(id, true) }, INIT)
    } catch (e: any) {
      // 通信の失敗・回数制限は 3 回まで少し待って再試行する(その間、この画像を使う物は部屋へ書かない)
      const n = (this.uploads.get(id) ?? 0) + 1
      this.uploads.set(id, n)
      if (n < 3 && e?.status !== 413 && e?.status !== 415 && e?.status !== 404 && !this.destroyed) retry = true
      else { this.failed.add(id); this.notify(`画像を共同編集の部屋に送れませんでした(相手には表示されません): ${e?.message ?? e}`) }
    } finally {
      this.uploading.delete(id)
      if (!this.destroyed) {
        if (retry) { setTimeout(() => { if (!this.destroyed && !this.uploading.has(id)) { this.uploading.add(id); void this.upload(id) } }, 3000 * (this.uploads.get(id) ?? 1)) }
        else {
          if (this.initIds.delete(id)) this.repushInit = true
          clearTimeout(this.repushTimer)
          this.repushTimer = window.setTimeout(() => {
            const d = this.getDoc()
            const init = this.repushInit
            this.repushInit = false
            if (!d) return
            if (init) this.push(d, INIT); else this.pushLocal(d, true)
          }, 50)
        }
      }
    }
  }

  /** 他の人が置いた画像を部屋から取る(assets.ts に登録する) */
  private fetchAsset = async (id: string): Promise<Blob | null> => {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    if (!this.assets.has(id)) { await sleep(500); if (!this.assets.has(id)) return null }
    for (let i = 0; i < 2; i++) {
      try {
        const r = await fetch(`/api/collab/${encodeURIComponent(this.session.room)}/assets/${encodeURIComponent(id)}`, { credentials: 'same-origin' })
        if (r.ok && (r.headers.get('content-type') ?? '').startsWith('image/')) return await r.blob()
        if (r.status !== 404) return null
      } catch { /* 通信エラー: 少し待って再試行 */ }
      await sleep(700)
    }
    return null
  }

  // ---- 部屋 → 手元
  private onTxn = (txn: Y.Transaction) => {
    if (txn.origin === LOCAL || txn.origin === INIT || !this.ready || this.destroyed) return
    let metaCh = false, structural = false
    const ch = new Set<string>()
    for (const type of txn.changed.keys() as Iterable<any>) {
      if (type === this.meta) metaCh = true
      else if (type === this.pages) structural = true
      else if (type instanceof Y.Map) {
        const par = type.parent as any
        if (par === this.pages) { const id = type.get('id'); if (typeof id === 'string') ch.add(id) }
        else if (par instanceof Y.Map && par.parent === this.pages) { const id = par.get('id'); if (typeof id === 'string') ch.add(id) }
      }
    }
    if (!metaCh && !structural && !ch.size) return
    const d = this.getDoc()
    if (!d) return
    if (metaCh) {
      const m = this.meta
      if (typeof m.get('name') === 'string') d.name = m.get('name')
      for (const k of ['width', 'height'] as const) { const v = m.get(k); if (typeof v === 'number' && v > 0 && v <= 10000) d[k] = v }
      const print = parse(m.get('print'))
      if (print && typeof print === 'object') d.print = print; else delete d.print
    }
    if (structural || ch.size) {
      const cur = this.ed?.pageId
      const prev = new Map(d.pages.map((p) => [p.id, p]))
      const maps = this.pages.toArray()
      if (maps.length === 0) {
        // 別々の人が同時に最後のページを消した等: ページが 0 枚の状態は受け入れず、手元の内容を部屋に戻す
        this.bases.clear(); this.known.clear()
        this.pushLocal(d)
        return
      }
      // 同じ id で入れ直されたページ(並べ替え・取り消しでの復活)は、変更なしに見えても読み直す
      for (const m of maps) { const id = String(m.get('id')); if (this.known.has(id) && this.known.get(id) !== m) ch.add(id) }
      const next: PageData[] = []
      for (const m of maps) {
        const id = String(m.get('id'))
        const old = prev.get(id)
        // 表示中のページは canvas に反映してから作り直す(syncCurrentPage)。変わっていないページはそのまま
        if (old && (id === cur || !ch.has(id))) { next.push(old); continue }
        next.push(readPage(m))
        this.bases.set(id, baseFromY(m))
      }
      const alive = new Set(maps.map((m) => String(m.get('id'))))
      for (const id of [...this.bases.keys()]) if (!alive.has(id)) this.bases.delete(id)
      d.pages = next
      this.noteKnown()
    }
    this.onRemote?.({ adopt: false, structural, meta: metaCh, changedPages: [...ch] })
  }

  private findPage(id: string): YPage | undefined {
    return this.pages.toArray().find((m) => m.get('id') === id)
  }

  private localLike(ed: EditorCore, yJson: any): any {
    const j = ed.toJSON()
    if (yJson && yJson.animation !== undefined) j.animation = yJson.animation
    return j
  }

  /** 表示中のページを部屋の今の状態に合わせる(差分があるときだけ。呼びすぎてよい) */
  async syncCurrentPage(): Promise<void> {
    if (this.syncing) { this.again = true; return }
    this.syncing = true
    try {
      do { this.again = false; await this.syncOnce() } while (this.again && !this.destroyed)
    } finally { this.syncing = false }
  }

  private async syncOnce() {
    const ed = this.ed
    if (!ed || !this.ready || this.destroyed || !ed.pageId) return
    const pid = ed.pageId
    const m = this.findPage(pid)
    const d = this.getDoc()
    if (!m || !d) return
    const b = this.baseOf(m)
    const pg = readPage(m)
    const yobjs = m.get('objs') as Y.Map<string>
    // await の間に部屋がさらに進んでも基準がずれないよう、読んだ時点の文字列を控えておく
    const ySnap = new Map<string, string>()
    for (const o of pg.json.objects) ySnap.set(o.id, yobjs.get(o.id) as string)
    const topSnap = ((m.get('top') as string) ?? '')
    const orderSnap = ((m.get('order') as string) ?? '')
    const changed = new Set<string>()
    const removed = new Set<string>()
    for (const o of pg.json.objects) if (ySnap.get(o.id) !== b.y.get(o.id)) changed.add(o.id)
    for (const id of b.y.keys()) if (!yobjs.has(id)) removed.add(id)
    if (!changed.size && !removed.size && topSnap === b.topY && orderSnap === b.orderY) return
    const deferred = await ed.applyRemote(pg.json, { changed, removed, pageId: pid })
    if (this.destroyed || ed.pageId !== pid) return
    const j = this.localLike(ed, pg.json)
    const now = new Map<string, any>((j.objects as any[]).map((o) => [o.id, o]))
    for (const id of changed) {
      if (deferred.has(id)) continue
      const o = now.get(id)
      if (!o) continue // 復元できなかった物は基準を進めない(次の同期でもう一度試す)
      b.y.set(id, ySnap.get(id) as string)
      b.local.set(id, JSON.stringify(o))
    }
    for (const id of removed) if (!deferred.has(id)) { b.y.delete(id); b.local.delete(id) }
    b.topY = topSnap; b.topL = topOf(j)
    b.orderY = orderSnap; b.orderL = orderOf(j)
    const p = d.pages.find((x) => x.id === pid)
    if (p) p.json = j
  }

  /** ページを表示した直後: canvas の書き出しを手元の基準にする(部屋側の基準 y は変えない) */
  private rebasePage(pid: string) {
    const ed = this.ed
    if (!ed || !this.ready || this.destroyed) return
    const m = this.findPage(pid)
    if (!m) return
    const b = this.baseOf(m)
    const yobjs = m.get('objs') as Y.Map<string>
    const j = this.localLike(ed, parse(m.get('top')))
    for (const o of j.objects as any[]) if (yobjs.has(o.id) && b.y.get(o.id) === yobjs.get(o.id)) b.local.set(o.id, JSON.stringify(o))
    b.topL = topOf(j)
    b.orderL = orderOf(j)
  }
}
