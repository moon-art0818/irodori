// バージョン履歴: 保存のたびではなく、一定間隔でデザイン全体の写しを残す
import { idbAll, idbDelete, idbPut } from './idb'
import type { DesignDoc } from './types'

export interface Version { id: string; docId: string; at: number; doc: DesignDoc }
const KEEP = 30
const INTERVAL = 5 * 60 * 1000
const last = new Map<string, number>()

export async function listVersions(docId: string): Promise<Version[]> {
  const all = await idbAll<Version>('versions')
  return all.filter((v) => v.docId === docId).sort((a, b) => b.at - a.at)
}

/** 前回から INTERVAL 以上たっていれば写しを残す(force で即時) */
export async function maybeSnapshot(doc: DesignDoc, force = false) {
  const now = Date.now()
  if (!force && now - (last.get(doc.id) ?? 0) < INTERVAL) return
  last.set(doc.id, now)
  await idbPut('versions', { id: `${doc.id}:${now}`, docId: doc.id, at: now, doc: structuredClone(doc) })
  const vs = await listVersions(doc.id)
  for (const v of vs.slice(KEEP)) await idbDelete('versions', v.id)
}

export async function deleteVersionsOf(docId: string) {
  for (const v of await listVersions(docId)) await idbDelete('versions', v.id)
}
