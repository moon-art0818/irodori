// デザインの保存窓口。ログイン中はクラウド(サーバー)、未ログインはこの端末(IndexedDB)
import { idbAll, idbDelete, idbGet, idbPut } from './idb'
import type { DesignDoc } from './types'
import { api, ApiError } from '../api/client'
import { currentUser } from '../api/session'
import { isLocal, makeFileRepo } from '../api/local'

export const SCHEMA_VERSION = 1

/** 一覧用の要約 */
export interface DocSummary { id: string; name: string; width: number; height: number; pageCount: number; updatedAt: number; createdAt: number; thumb: string | null; shareId?: string | null }
export interface PutOptions { baseUpdatedAt?: number | null; thumb?: string }

/** 他の端末・タブで先に更新されていた */
export class ConflictError extends Error { constructor() { super('別の場所で更新されています') } }
/** 削除済み */
export class GoneError extends Error { constructor() { super('このデザインは削除されています') } }

export interface DocumentRepository {
  kind: 'local' | 'cloud'
  list(): Promise<DocSummary[]>
  get(id: string): Promise<DesignDoc | undefined>
  /** 保存して新しい updatedAt を返す。baseUpdatedAt と保存先の版が違えば ConflictError */
  put(doc: DesignDoc, opts?: PutOptions): Promise<number>
  delete(id: string): Promise<void>
}

const summary = (d: DesignDoc): DocSummary => ({ id: d.id, name: d.name, width: d.width, height: d.height, pageCount: d.pages.length, updatedAt: d.updatedAt, createdAt: d.createdAt, thumb: d.thumb ?? null })

export const localRepo: DocumentRepository = {
  kind: 'local',
  async list() {
    const all = await idbAll<DesignDoc>('docs')
    // 壊れたデータは一覧から外す(全体を巻き込まない)
    return all.filter((d) => d && d.id && Array.isArray(d.pages)).sort((a, b) => b.updatedAt - a.updatedAt).map(summary)
  },
  get: (id) => idbGet<DesignDoc>('docs', id),
  async put(doc, opts = {}) {
    if (opts.baseUpdatedAt != null) {
      const cur = await idbGet<DesignDoc>('docs', doc.id)
      if (!cur) throw new GoneError()
      if (cur.updatedAt !== opts.baseUpdatedAt) throw new ConflictError()
    }
    const updatedAt = Math.max(Date.now(), (opts.baseUpdatedAt ?? 0) + 1)
    await idbPut('docs', { ...doc, thumb: opts.thumb ?? doc.thumb, updatedAt, schemaVersion: SCHEMA_VERSION })
    return updatedAt
  },
  delete: (id) => idbDelete('docs', id),
}

export const cloudRepo: DocumentRepository = {
  kind: 'cloud',
  async list() {
    const { docs } = await api.listDocs()
    return docs.map((m) => ({ id: m.id, name: m.name, width: m.width, height: m.height, pageCount: m.pageCount, updatedAt: m.updatedAt, createdAt: m.createdAt, thumb: m.thumbUrl ? `${m.thumbUrl}?v=${m.updatedAt}` : null, shareId: m.shareId }))
  },
  async get(id) {
    try { return (await api.getDoc(id)).doc } catch (e) { if (e instanceof ApiError && e.status === 404) return undefined; throw e }
  },
  async put(doc, opts = {}) {
    const { thumb, ...rest } = doc
    try {
      const r = await api.putDoc(doc.id, { doc: { ...rest, schemaVersion: SCHEMA_VERSION } as any, baseUpdatedAt: opts.baseUpdatedAt ?? null, thumb: opts.thumb ?? thumb })
      return r.updatedAt
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) throw new ConflictError()
      if (e instanceof ApiError && e.status === 404) throw new GoneError()
      throw e
    }
  },
  async delete(id) { await api.deleteDoc(id) },
}

/** ローカル版(npm run agent)の保存先 = designs/ フォルダの JSON */
export const fileRepo: DocumentRepository = makeFileRepo(ConflictError, GoneError)

/** 今使う保存先: ローカル版ならフォルダ、ログイン中ならクラウド、それ以外はこの端末(ブラウザ) */
export function activeRepo(): DocumentRepository { return isLocal() ? fileRepo : currentUser() ? cloudRepo : localRepo }
export const repo: DocumentRepository = {
  get kind() { return activeRepo().kind },
  list: () => activeRepo().list(),
  get: (id) => activeRepo().get(id),
  put: (doc, opts) => activeRepo().put(doc, opts),
  delete: (id) => activeRepo().delete(id),
}

export function newId() { return 'd_' + crypto.randomUUID() }
export function newPageId() { return 'p_' + crypto.randomUUID().slice(0, 8) }

export function blankPage(bg = '#ffffff') { return { id: newPageId(), json: { version: '7', objects: [], background: bg } } }

export function createDoc(name: string, w: number, h: number, pageJson?: any, print?: DesignDoc['print']): DesignDoc {
  const now = Date.now()
  const page = blankPage()
  if (pageJson) page.json = pageJson
  return { id: newId(), name, width: w, height: h, print, pages: [page], updatedAt: now, createdAt: now }
}

// 永続化をお願いする(ブラウザが容量不足時に勝手に消さないように)
try { navigator.storage?.persist?.() } catch { /* 非対応環境は無視 */ }
