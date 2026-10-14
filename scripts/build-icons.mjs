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
// core: true = 検索の既定範囲(「おすすめセット横断」)に含める最初の 10 セット。新規セットは単体選択か「全セット」で使う
const SETS = [
  { id: 'fluent-emoji-flat', pkg: 'fluent-emoji-flat', label: 'カラー絵文字 (Fluent)', skip: skinTone, core: true },
  { id: 'noto', pkg: 'noto', label: 'カラー絵文字 (Noto)', skip: skinTone, core: true },
  { id: 'fxemoji', pkg: 'fxemoji', label: 'カラー絵文字 (Firefox)', core: true },
  { id: 'flat-color-icons', pkg: 'flat-color-icons', label: 'フラットカラーアイコン', core: true },
  { id: 'tabler', pkg: 'tabler', label: 'Tabler (線)', core: true },
  { id: 'lucide', pkg: 'lucide', label: 'Lucide (線)', core: true },
  // Phosphor は 6 ウェイトあるので 標準 + fill のみ採用
  { id: 'ph', pkg: 'ph', label: 'Phosphor', skip: (n) => /-(thin|light|bold|duotone)$/.test(n), core: true },
  { id: 'mdi', pkg: 'mdi', label: 'Material Design Icons', core: true },
  { id: 'ri', pkg: 'ri', label: 'Remix Icon', core: true },
  { id: 'bi', pkg: 'bi', label: 'Bootstrap Icons', core: true },
  // ---- 追加分(線の太さ・角の形・サイズ違いだけの重複は skip で落とす) ----
  { id: 'noto-v1', pkg: 'noto-v1', label: 'カラー絵文字 (Noto 旧デザイン)', skip: skinTone },
  { id: 'fluent-emoji-high-contrast', pkg: 'fluent-emoji-high-contrast', label: '白黒絵文字 (Fluent)', skip: skinTone },
  { id: 'icon-park', pkg: 'icon-park', label: 'IconPark (カラー)' },
  { id: 'icon-park-outline', pkg: 'icon-park-outline', label: 'IconPark (線)' },
  { id: 'icon-park-solid', pkg: 'icon-park-solid', label: 'IconPark (塗り)' },
  { id: 'icon-park-twotone', pkg: 'icon-park-twotone', label: 'IconPark (2トーン)' },
  { id: 'fluent-color', pkg: 'fluent-color', label: 'Fluent カラーアイコン', skip: (n) => !/-24$/.test(n) },
  { id: 'meteocons', pkg: 'meteocons', label: '天気 (Meteocons)' },
  { id: 'marketeq', pkg: 'marketeq', label: 'Marketeq (カラー)' },
  { id: 'circle-flags', pkg: 'circle-flags', label: '国旗・丸 (Circle Flags)' },
  { id: 'flagpack', pkg: 'flagpack', label: '国旗 (Flagpack)' },
  // Material Symbols は sharp を除く(base / outline / rounded)
  { id: 'material-symbols', pkg: 'material-symbols', label: 'Material Symbols', skip: (n) => /sharp/.test(n) },
  { id: 'ic', pkg: 'ic', label: 'Google Material (2トーン)', skip: (n) => !n.startsWith('twotone-') },
  // Fluent UI System Icons は 24px の regular / filled のみ
  { id: 'fluent', pkg: 'fluent', label: 'Fluent UI', skip: (n) => !/-24-(regular|filled)$/.test(n) },
  { id: 'hugeicons', pkg: 'hugeicons', label: 'Hugeicons' },
  { id: 'iconmind', pkg: 'iconmind', label: 'Iconmind', skip: (n) => !/-regular$/.test(n) },
  { id: 'iconoven', pkg: 'iconoven', label: 'Iconoven', skip: (n) => /-sharp$/.test(n) },
  { id: 'keyline-icons', pkg: 'keyline-icons', label: 'Keyline', skip: (n) => /sharp|(?<!duo)-tone$/.test(n) },
  { id: 'reicon', pkg: 'reicon', label: 'Reicon' },
  { id: 'energy-icons', pkg: 'energy-icons', label: 'Energy Icons', skip: (n) => !/-20(-bold)?$/.test(n) },
  { id: 'glyphs', pkg: 'glyphs', label: 'Glyphs', skip: (n) => /-bold$/.test(n) },
  { id: 'mingcute', pkg: 'mingcute', label: 'MingCute' },
  { id: 'carbon', pkg: 'carbon', label: 'Carbon' },
  { id: 'iconoir', pkg: 'iconoir', label: 'Iconoir' },
  { id: 'healthicons', pkg: 'healthicons', label: 'Health Icons (医療・福祉)', skip: (n) => /negative|24px/.test(n) },
  { id: 'mynaui', pkg: 'mynaui', label: 'Myna UI' },
  { id: 'tdesign', pkg: 'tdesign', label: 'TDesign' },
  { id: 'boxicons', pkg: 'boxicons', label: 'Boxicons' },
  { id: 'heroicons', pkg: 'heroicons', label: 'Heroicons', skip: (n) => /-(16|20|24)-/.test(n) },
  { id: 'ion', pkg: 'ion', label: 'Ionicons', skip: (n) => /sharp/.test(n) },
  { id: 'uil', pkg: 'uil', label: 'Unicons' },
  { id: 'ant-design', pkg: 'ant-design', label: 'Ant Design', skip: (n) => /-twotone$/.test(n) },
  { id: 'gravity-ui', pkg: 'gravity-ui', label: 'Gravity UI' },
  { id: 'pixelarticons', pkg: 'pixelarticons', label: 'ドット絵 (Pixelarticons)' },
  { id: 'mage', pkg: 'mage', label: 'Mage' },
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
    author: info.author?.name ?? '', core: !!s.core, bytes: statSync(path).size,
  })
  console.log(`${s.id.padEnd(18)} ${spdx.padEnd(11)} ${String(icons.length).padStart(5)} 件  ${(statSync(path).size / 1048576).toFixed(2)} MB`)
}
writeFileSync(join(out, 'index.json'), JSON.stringify(index, null, 1))
console.log(`合計 ${index.reduce((a, b) => a + b.count, 0)} 件`)
