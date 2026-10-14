// 共同編集の「いま誰がどこにいるか」(y-protocols の awareness)
import type { Awareness } from 'y-protocols/awareness'

export const NAME_KEY = 'irodori-collab-name'

export function savedName(): string {
  try { return localStorage.getItem(NAME_KEY) ?? '' } catch { return '' }
}
export function saveName(name: string) {
  try { localStorage.setItem(NAME_KEY, name) } catch { /* 保存できない環境では毎回聞く */ }
}

/** 名前から決まる色(同じ名前なら同じ色) */
export function colorFor(name: string): string {
  let h = 0
  for (const ch of name) h = (h * 31 + (ch.codePointAt(0) ?? 0)) >>> 0
  return `hsl(${h % 360} 68% 46%)`
}

export interface PeerState {
  clientId: number
  name: string
  color: string
  page: string | null
  cursor: { x: number; y: number } | null
  sel: string[]
}

export function initPresence(a: Awareness, name: string) {
  a.setLocalState({ user: { name, color: colorFor(name) }, page: null, cursor: null, sel: [] })
}

/** 自分以外の参加者 */
export function readPeers(a: Awareness): PeerState[] {
  const out: PeerState[] = []
  a.getStates().forEach((s: any, id: number) => {
    if (id === a.clientID || !s?.user) return
    const c = s.cursor
    out.push({
      clientId: id,
      name: String(s.user.name ?? '').slice(0, 40) || '名無し',
      color: typeof s.user.color === 'string' && /^hsl\([\d. %]+\)$/.test(s.user.color) ? s.user.color : '#888888',
      page: typeof s.page === 'string' ? s.page : null,
      cursor: c && Number.isFinite(c.x) && Number.isFinite(c.y) ? { x: c.x, y: c.y } : null,
      sel: Array.isArray(s.sel) ? s.sel.filter((x: unknown): x is string => typeof x === 'string').slice(0, 50) : [],
    })
  })
  return out.sort((a, b) => a.clientId - b.clientId)
}
