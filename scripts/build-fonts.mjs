// Google Fonts の全カタログ(メタデータのみ)を src/data/fontCatalog.json に出力する。
// 実行: npm run fonts(ネットワーク必須。生成物はコミットする)
// フォントファイルは同梱しない。選んだ時にブラウザが fonts.googleapis.com から CSS を読む。
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'fontCatalog.json')
const res = await fetch('https://fonts.google.com/metadata/fonts')
if (!res.ok) throw new Error(`メタデータの取得に失敗: ${res.status}`)
const text = (await res.text()).replace(/^\)\]\}'/, '') // 先頭に )]}' が付くことがある
const list = JSON.parse(text).familyMetadataList
if (!Array.isArray(list) || list.length < 1000) throw new Error('想定外のメタデータ形式')

// 分類: s=ゴシック(Sans Serif) m=明朝(Serif) h=手書き d=ディスプレイ c=等幅
const CAT = { 'Sans Serif': 's', Serif: 'm', Handwriting: 'h', Display: 'd', Monospace: 'c' }
// 対応文字(subsets)。UI で使うものだけ短い記号にする
const SUB = {
  japanese: 'ja', korean: 'ko', 'chinese-simplified': 'zs', 'chinese-traditional': 'zt', 'chinese-hongkong': 'zh',
  cyrillic: 'cy', greek: 'el', vietnamese: 'vi', arabic: 'ar', hebrew: 'he', thai: 'th', devanagari: 'hi',
}

const rows = list
  .filter((f) => CAT[f.category] && f.isOpenSource !== false) // 全書体 OFL / Apache / Ubuntu Font Licence。isOpenSource=false があれば除外
  .sort((a, b) => a.popularity - b.popularity) // 人気順(1 が最上位)
  .map((f) => {
    const weights = [...new Set(Object.keys(f.fonts).filter((k) => /^\d+$/.test(k)).map(Number))].sort((a, b) => a - b)
    const subs = f.subsets.map((s) => SUB[s]).filter(Boolean)
    // [名前, 分類, 対応文字(カンマ区切り), 太さ]
    return [f.family, CAT[f.category], subs.join(','), weights.length ? weights : [400]]
  })

writeFileSync(out, JSON.stringify(rows))
const ja = rows.filter((r) => r[2].split(',').includes('ja')).length
console.log(`${rows.length} 書体(日本語対応 ${ja})→ ${out}`)
