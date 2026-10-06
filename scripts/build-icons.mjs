// Iconify JSON パッケージから素材データを取り出し public/icons/ に出力する。
// 実行: npm run icons
// ライセンスは各パッケージの info.json の license.spdx を実行時に検査し、許可リスト外は失敗させる。
import { readFileSync, writeFileSync, mkdirSync, rmSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'public', 'icons')

// 商用利用可・表記不要のライセンスだけ
const ALLOWED = new Set(['MIT', 'ISC', 'Apache-2.0', 'CC0-1.0', 'OFL-1.1'])

// 採用セット。skip: 除外する名前の判定(肌色バリエーション等で件数・容量を抑える)
const skinTone = (n) => /-skin-tone|^(man|woman|person)-.*-(light|medium|dark)/.test(n)
const SETS = [
  { id: 'fluent-emoji-flat', pkg: 'fluent-emoji-flat', label: 'カラー絵文字 (Fluent)', skip: skinTone },
  { id: 'noto', pkg: 'noto', label: 'カラー絵文字 (Noto)', skip: skinTone },
  { id: 'fxemoji', pkg: 'fxemoji', label: 'カラー絵文字 (Firefox)' },
  { id: 'flat-color-icons', pkg: 'flat-color-icons', label: 'フラットカラーアイコン' },
  { id: 'tabler', pkg: 'tabler', label: 'Tabler (線)' },
  { id: 'lucide', pkg: 'lucide', label: 'Lucide (線)' },
  // Phosphor は 6 ウェイトあるので 標準 + fill のみ採用
  { id: 'ph', pkg: 'ph', label: 'Phosphor', skip: (n) => /-(thin|light|bold|duotone)$/.test(n) },
  { id: 'mdi', pkg: 'mdi', label: 'Material Design Icons' },
  { id: 'ri', pkg: 'ri', label: 'Remix Icon' },
  { id: 'bi', pkg: 'bi', label: 'Bootstrap Icons' },
]

// 同一ページに複数並べても gradient 等の id が衝突しないよう、id をアイコンごとに一意化する
function uniqIds(body, key) {
  if (!body.includes(' id="')) return body
  const ids = [...body.matchAll(/ id="([^"]+)"/g)].map((m) => m[1])
  let h = 0
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const pre = 'i' + h.toString(36) + '_'
  let r = body
  for (const id of ids) {
    r = r.split(` id="${id}"`).join(` id="${pre}${id}"`)
      .split(`url(#${id})`).join(`url(#${pre}${id})`)
      .split(`href="#${id}"`).join(`href="#${pre}${id}"`)
  }
  return r
}

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'))
rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })

const index = []
for (const s of SETS) {
  const dir = join(root, 'node_modules', '@iconify-json', s.pkg)
  const info = readJson(join(dir, 'info.json'))
  const spdx = info.license?.spdx
  if (!ALLOWED.has(spdx)) throw new Error(`${s.pkg}: ライセンス ${spdx} は許可リスト外`)
  const data = readJson(join(dir, 'icons.json'))
  let meta = {}
  try { meta = readJson(join(dir, 'metadata.json')) } catch { /* なし */ }

  const nameToCat = new Map()
  const cats = []
  for (const [cat, names] of Object.entries(meta.categories ?? {})) {
    const ci = cats.push(cat) - 1
    for (const n of names) nameToCat.set(n, ci)
  }

  const W = data.width ?? info.height ?? 16
  const H = data.height ?? info.height ?? 16
  const icons = []
  for (const [name, ic] of Object.entries(data.icons)) {
    if (data.hidden?.[name] || s.skip?.(name)) continue
    const w = ic.width ?? W
    const h = ic.height ?? H
    const row = [name, nameToCat.get(name) ?? -1, uniqIds(ic.body, s.id + name)]
    if (w !== W || h !== H) row.push(w, h)
    icons.push(row)
  }
  const color = !!info.palette
  const file = { id: s.id, w: W, h: H, color, cats, icons }
  const path = join(out, `${s.id}.json`)
  writeFileSync(path, JSON.stringify(file))
  index.push({
    id: s.id, name: s.label, license: spdx, count: icons.length, color,
    author: info.author?.name ?? '', bytes: statSync(path).size,
  })
  console.log(`${s.id.padEnd(18)} ${spdx.padEnd(11)} ${String(icons.length).padStart(5)} 件  ${(statSync(path).size / 1048576).toFixed(2)} MB`)
}
writeFileSync(join(out, 'index.json'), JSON.stringify(index, null, 1))
console.log(`合計 ${index.reduce((a, b) => a + b.count, 0)} 件`)
