// 複数のブランドキット(名前付き・最大10個)。既存の editor/brand.ts(単一キット)と互換:
// - 既存の 'default' レコードは「アクティブなキットの写し」として保ち、getBrand()/saveBrand() を使う既存の画面はそのまま動く
// - 各キットの実体は 'kit_<id>' レコード、並びとアクティブは 'brands_meta' レコードに持つ
// - 初回は既存の 'default' の内容を1個目のキットに移行する
import { idbAll, idbDelete, idbGet, idbPut } from '../editor/idb'
import { getBrand, saveBrand } from '../editor/brand'

export interface BrandEntry { id: string; name: string; colors: string[]; headingFont: string; bodyFont: string; logos: string[] /* assetId */ }
export type BrandPatch = Partial<Omit<BrandEntry, 'id'>>
interface Meta { id: 'brands_meta'; order: string[]; activeId: string }

export const MAX_BRANDS = 10
const subs = new Set<() => void>()
/** キットの追加・変更・切替を購読する */
export function onBrandsChange(f: () => void) { subs.add(f); return () => { subs.delete(f) } }
const notify = () => subs.forEach((f) => f())

const uid = () => 'kit_' + Math.random().toString(36).slice(2, 10)
const blank = (id: string, name: string): BrandEntry => ({ id, name, colors: [], headingFont: '', bodyFont: '', logos: [] })

let ready: Promise<void> | null = null
/** 初期化(初回だけ既存の単一キットを移行)。他の関数が自動で呼ぶ */
function init(): Promise<void> {
  return (ready ??= (async () => {
    if (await idbGet<Meta>('brand', 'brands_meta')) return
    const old = await getBrand() // 既存の 'default'
    const id = uid()
    await idbPut('brand', { ...blank(id, 'ブランド1'), colors: old.colors, headingFont: old.headingFont, bodyFont: old.bodyFont, logos: old.logos })
    await idbPut('brand', { id: 'brands_meta', order: [id], activeId: id } satisfies Meta)
  })())
}
const getMeta = async () => { await init(); return (await idbGet<Meta>('brand', 'brands_meta'))! }
const putMeta = (m: Meta) => idbPut('brand', m)

/** アクティブなキットを brand.ts の単一キット('default')に写す(既存の画面が読む値) */
async function mirror(k: BrandEntry) {
  await saveBrand({ colors: k.colors, headingFont: k.headingFont, bodyFont: k.bodyFont, logos: k.logos })
}

/** キット一覧(作成順) */
export async function listBrands(): Promise<BrandEntry[]> {
  const m = await getMeta()
  const all = new Map((await idbAll<BrandEntry>('brand')).filter((r) => r.id.startsWith('kit_')).map((r) => [r.id, r]))
  return m.order.map((id) => all.get(id)).filter((x): x is BrandEntry => !!x)
}
/** アクティブなキットの id */
export async function getActiveBrandId(): Promise<string> { return (await getMeta()).activeId }
/** アクティブなキット */
export async function getActiveBrand(): Promise<BrandEntry> {
  const [list, id] = [await listBrands(), await getActiveBrandId()]
  return list.find((k) => k.id === id) ?? list[0]
}

/** キットを追加する(最大10個)。from を渡すとその内容を複製する。戻り値は新しいキット */
export async function createBrand(name: string, from?: BrandPatch): Promise<BrandEntry> {
  const m = await getMeta()
  if (m.order.length >= MAX_BRANDS) throw new Error(`ブランドキットは最大 ${MAX_BRANDS} 個までです`)
  const k = { ...blank(uid(), name.trim() || `ブランド${m.order.length + 1}`), ...from } as BrandEntry
  await idbPut('brand', k)
  await putMeta({ ...m, order: [...m.order, k.id] })
  notify()
  return k
}

/** キットを更新する(アクティブなキットなら、既存の単一キット側にも反映して購読者へ通知する) */
export async function updateBrand(id: string, patch: BrandPatch): Promise<BrandEntry> {
  const m = await getMeta()
  const cur = await idbGet<BrandEntry>('brand', id)
  if (!cur || !m.order.includes(id)) throw new Error('ブランドキットが見つかりません')
  const next: BrandEntry = { ...cur, ...patch, id }
  await idbPut('brand', next)
  if (m.activeId === id) await mirror(next)
  notify()
  return next
}
/** キット名を変える */
export const renameBrand = (id: string, name: string) => updateBrand(id, { name: name.trim() || 'ブランド' })

/** キットを切り替える(既存の単一キットの内容も差し替わる) */
export async function setActiveBrand(id: string): Promise<BrandEntry> {
  const m = await getMeta()
  const k = await idbGet<BrandEntry>('brand', id)
  if (!k || !m.order.includes(id)) throw new Error('ブランドキットが見つかりません')
  await putMeta({ ...m, activeId: id })
  await mirror(k)
  notify()
  return k
}

/** キットを複製する(名前に「のコピー」を付ける) */
export async function duplicateBrand(id: string): Promise<BrandEntry> {
  const k = await idbGet<BrandEntry>('brand', id)
  if (!k) throw new Error('ブランドキットが見つかりません')
  return createBrand(`${k.name}のコピー`, { colors: [...k.colors], headingFont: k.headingFont, bodyFont: k.bodyFont, logos: [...k.logos] })
}

/** キットを削除する(最後の1個は消せない。アクティブなキットを消すと先頭のキットに切り替わる) */
export async function deleteBrand(id: string) {
  const m = await getMeta()
  if (m.order.length <= 1) throw new Error('最後のブランドキットは削除できません')
  const order = m.order.filter((x) => x !== id)
  await idbDelete('brand', id)
  await putMeta({ ...m, order })
  if (m.activeId === id) await setActiveBrand(order[0]); else notify()
}
