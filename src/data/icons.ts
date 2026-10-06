// アイコン/イラスト素材のデータ層。
// データは scripts/build-icons.mjs が public/icons/ に出力する(セットごとに別 JSON)。
// ブラウザは必要になったセットだけ fetch し、結果はメモリにキャッシュする。
import { JA_DICT } from './icon-ja'

export type IconSet = {
  id: string
  name: string
  license: string
  count: number
  color: boolean
  author: string
  bytes: number
}

export type IconItem = {
  set: string
  name: string
  /** SVG の内側(body)。完全な <svg> は iconSvg() で作る */
  svg: string
  width: number
  height: number
  /** true: 元から色付き(そのまま使う)。false: 単色(currentColor を置換して使う) */
  color: boolean
  /** あれば。表示のグルーピング用 */
  category?: string
}

type SetFile = {
  id: string
  w: number
  h: number
  color: boolean
  cats: string[]
  icons: [string, number, string, number?, number?][]
}

const BASE = `${import.meta.env.BASE_URL}icons/`

let indexPromise: Promise<IconSet[]> | null = null
const setCache = new Map<string, Promise<IconItem[]>>()

function fetchJson<T>(url: string): Promise<T> {
  return fetch(url).then((r) => {
    if (!r.ok) throw new Error(`${url}: ${r.status}`)
    return r.json() as Promise<T>
  })
}

export function loadIconIndex(): Promise<IconSet[]> {
  if (!indexPromise) {
    indexPromise = fetchJson<IconSet[]>(`${BASE}index.json`).catch((e) => {
      indexPromise = null // 失敗は次回やり直せるように
      throw e
    })
  }
  return indexPromise
}

export function loadIconSet(id: string): Promise<IconItem[]> {
  let p = setCache.get(id)
  if (!p) {
    p = fetchJson<SetFile>(`${BASE}${encodeURIComponent(id)}.json`)
      .then((f) =>
        f.icons.map(([name, ci, body, w, h]): IconItem => ({
          set: f.id,
          name,
          svg: body,
          width: w ?? f.w,
          height: h ?? f.h,
          color: f.color,
          category: ci >= 0 ? f.cats[ci] : undefined,
        })),
      )
      .catch((e) => {
        setCache.delete(id)
        throw e
      })
    setCache.set(id, p)
  }
  return p
}

/** アイコンを完全な <svg> 文字列にする。単色は currentColor を color(既定は黒)に置換。 */
export function iconSvg(item: IconItem, color?: string): string {
  const body = item.color ? item.svg : item.svg.split('currentColor').join(color ?? '#000000')
  const { width: w, height: h } = item
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`
}

const hasJapanese = (s: string) => /[^\u0000-\u007f]/.test(s)

/**
 * 1 語を英語キーワード群に展開する。
 * 英数字はそのまま。日本語は辞書の完全一致を優先し、無ければ前方一致(辞書キーがその語で始まる)。
 * 語の途中への一致はさせない(カタカナ語の内側の別語で誤爆しないため)。
 * 辞書に無い日本語は [] (= 解決できない語。searchIconsIn が無視する)。
 */
export function expandToken(token: string): string[] {
  const t = token.toLowerCase()
  if (!hasJapanese(t)) return [t]
  const exact = JA_DICT[token] ?? JA_DICT[t]
  if (exact) return [...exact]
  if (t.length < 2) return []
  const out = new Set<string>()
  for (const [k, v] of Object.entries(JA_DICT)) {
    if (k.toLowerCase().startsWith(t)) for (const w of v) out.add(w)
  }
  return [...out]
}

/** クエリ → 語ごとの英語キーワード候補(語同士は AND、候補同士は OR) */
export function expandQuery(query: string): string[][] {
  return query
    .normalize('NFKC')
    .trim()
    .split(/[\s、,]+/)
    .filter(Boolean)
    .map(expandToken)
}

/** 名前に対する 1 語の一致度。0 = 不一致 */
function scoreName(name: string, term: string): number {
  if (name === term) return 100
  const segs = name.split('-')
  if (segs.includes(term)) return 80
  if (segs.some((s) => s.startsWith(term))) return 50
  if (term.length >= 2 && name.includes(term)) return 20
  return 0
}

export function searchIconsIn(items: readonly IconItem[], query: string, limit = 200): IconItem[] {
  const groups = expandQuery(query)
  if (groups.length === 0) return []
  // 辞書に無い日本語の語は無視する(解決できた語だけで探す。全部ダメなら該当なし)
  const known = groups.filter((g) => g.length > 0)
  if (known.length === 0) return []
  const scored: { it: IconItem; s: number }[] = []
  for (const it of items) {
    let total = 0
    for (const g of known) {
      let best = 0
      for (const term of g) {
        const s = scoreName(it.name, term)
        if (s > best) best = s
      }
      if (best === 0) {
        total = 0
        break
      }
      total += best
    }
    if (total > 0) scored.push({ it, s: total - it.name.length * 0.01 })
  }
  scored.sort((a, b) => b.s - a.s)
  return scored.slice(0, limit).map((x) => x.it)
}

export async function searchIcons(query: string, setIds?: string[], limit = 200): Promise<IconItem[]> {
  const ids = setIds ?? (await loadIconIndex()).map((s) => s.id)
  const sets = await Promise.all(ids.map((id) => loadIconSet(id)))
  // セット間で偏らないよう、各セットの上位を交互に混ぜる
  const per = sets.map((items) => searchIconsIn(items, query, limit))
  const out: IconItem[] = []
  for (let i = 0; out.length < limit; i++) {
    let any = false
    for (const r of per) {
      if (i < r.length) {
        out.push(r[i])
        any = true
        if (out.length >= limit) break
      }
    }
    if (!any) break
  }
  return out
}
