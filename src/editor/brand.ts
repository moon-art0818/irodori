// ブランドキット: よく使う色・フォント・ロゴを登録して使い回す
import { idbGet, idbPut } from './idb'

export interface BrandKit { id: 'default'; colors: string[]; headingFont: string; bodyFont: string; logos: string[] /* assetId */ }
const EMPTY: BrandKit = { id: 'default', colors: [], headingFont: '', bodyFont: '', logos: [] }

let cache: BrandKit | null = null
const subs = new Set<() => void>()
export function onBrandChange(f: () => void) { subs.add(f); return () => { subs.delete(f) } }

export async function getBrand(): Promise<BrandKit> {
  if (cache) return cache
  cache = { ...EMPTY, ...((await idbGet<BrandKit>('brand', 'default')) ?? {}) }
  return cache
}
export function brandSync(): BrandKit { return cache ?? EMPTY }
export async function saveBrand(patch: Partial<BrandKit>) {
  cache = { ...(await getBrand()), ...patch, id: 'default' }
  await idbPut('brand', cache)
  subs.forEach((f) => f())
}
