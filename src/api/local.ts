// ローカル版(npm run agent)で開いたときの保存先と、AI エージェントとの中継
import type { DesignDoc } from '../editor/types'
import type { DocumentRepository, DocSummary, PutOptions } from '../editor/repo'

let localOn: boolean | null = null
/** ローカルサーバー(agent/server.mjs)から開かれているか */
export async function detectLocal(): Promise<boolean> {
  if (localOn !== null) return localOn
  try { const r = await fetch('/local/ping'); localOn = r.ok && (await r.json()).ok === true } catch { localOn = false }
  return localOn
}
export const isLocal = () => localOn === true

class LocalConflict extends Error { constructor() { super('別の場所(AI エージェントなど)で更新されています') } }
async function call<T>(method: string, path: string, body?: any): Promise<T> {
  const r = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined })
  const d = await r.json().catch(() => ({}))
  if (r.status === 409) throw new LocalConflict()
  if (!r.ok) throw Object.assign(new Error(d.error ?? `エラー(${r.status})`), { status: r.status })
  return d
}

export function makeFileRepo(Conflict: new () => Error, Gone: new () => Error): DocumentRepository {
  return {
    kind: 'local',
    async list(): Promise<DocSummary[]> { return (await call<{ docs: DocSummary[] }>('GET', '/local/designs')).docs },
    async get(id) { try { return (await call<{ doc: DesignDoc }>('GET', `/local/designs/${encodeURIComponent(id)}`)).doc } catch (e: any) { if (e.status === 404) return undefined; throw e } },
    async put(doc, opts: PutOptions = {}) {
      try { return (await call<{ updatedAt: number }>('PUT', `/local/designs/${encodeURIComponent(doc.id)}`, { doc: { ...doc, thumb: opts.thumb ?? doc.thumb }, baseUpdatedAt: opts.baseUpdatedAt ?? null })).updatedAt }
      catch (e: any) { if (e instanceof LocalConflict) throw new Conflict(); if (e.status === 404) throw new Gone(); throw e }
    },
    async delete(id) { await call('DELETE', `/local/designs/${encodeURIComponent(id)}`) },
  }
}

// ---- フォルダの変更通知 ----
type Msg = { type: 'changed' | 'removed'; id: string; updatedAt?: number } | { type: 'bridge'; reqId: string; [k: string]: any }
const subs = new Set<(m: Msg) => void>()
let es: EventSource | null = null
export function onLocalEvent(f: (m: Msg) => void) {
  if (!es && isLocal()) {
    es = new EventSource('/local/events')
    es.onmessage = (e) => { const m = JSON.parse(e.data) as Msg; subs.forEach((s) => s(m)) }
  }
  subs.add(f)
  return () => { subs.delete(f) }
}

/** AI(MCP サーバー)からの依頼に答える: 画像書き出し・テンプレ一覧・テンプレ適用 */
export function startBridge(handlers: Record<string, (m: any) => Promise<any>>) {
  return onLocalEvent(async (m) => {
    if (m.type !== 'bridge') return
    const h = handlers[(m as any).action]
    const reply = (body: any) => fetch('/local/bridge-result', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reqId: m.reqId, ...body }) })
    if (!h) { reply({ error: `不明な依頼です: ${(m as any).action}` }); return }
    try { reply({ result: await h(m) }) } catch (e: any) { reply({ error: e?.message ?? String(e) }) }
  })
}
