// グラデーション背景: 36 配色 × 3 種(斜め・放射・縦) = 108 点
import { wrap, r, type GraphicItem } from './types'

const SETS: [string, string[]][] = [
  ['サンセット', ['#ff9a8b', '#ff6a88', '#ff99ac']],
  ['オーシャン', ['#2193b0', '#6dd5ed']],
  ['ミントフレッシュ', ['#a8edea', '#fed6e3']],
  ['ラベンダー', ['#a18cd1', '#fbc2eb']],
  ['ピーチ', ['#ffecd2', '#fcb69f']],
  ['フォレスト', ['#134e5e', '#71b280']],
  ['ミッドナイト', ['#0f2027', '#203a43', '#2c5364']],
  ['キャンディ', ['#f6d365', '#fda085']],
  ['ブルーベリー', ['#4776e6', '#8e54e9']],
  ['ローズ', ['#ee9ca7', '#ffdde1']],
  ['レモンライム', ['#f7ff00', '#00c9a7']],
  ['アイスブルー', ['#e0eafc', '#cfdef3']],
  ['ネオン', ['#12c2e9', '#c471ed', '#f64f59']],
  ['ゴールド', ['#f5af19', '#f12711']],
  ['モーブ', ['#c471f5', '#fa71cd']],
  ['スカイ', ['#89f7fe', '#66a6ff']],
  ['グリーンティー', ['#d4fc79', '#96e6a1']],
  ['チェリー', ['#eb3349', '#f45c43']],
  ['ドリーム', ['#667eea', '#764ba2']],
  ['サンドベージュ', ['#f5f0e6', '#e0d4bd']],
  ['ミルキー', ['#ffffff', '#f3e7e9']],
  ['フラミンゴ', ['#ff758c', '#ff7eb3']],
  ['ターコイズ', ['#43e97b', '#38f9d7']],
  ['トワイライト', ['#614385', '#516395']],
  ['コーラル', ['#ff9966', '#ff5e62']],
  ['アクア', ['#00c6ff', '#0072ff']],
  ['ブラッシュ', ['#fbc8d4', '#9795f0']],
  ['モノクローム', ['#232526', '#414345']],
  ['シルバー', ['#e6e9f0', '#eef1f5']],
  ['パステルレインボー', ['#ffd1ff', '#fad0c4', '#fff1b6', '#c4f0d8', '#c3dcff']],
  ['ラズベリー', ['#c33764', '#1d2671']],
  ['オレンジクリーム', ['#ffe259', '#ffa751']],
  ['ミスト', ['#bdc3c7', '#2c3e50']],
  ['エメラルド', ['#02aab0', '#00cdac']],
  ['ワイン', ['#42275a', '#734b6d']],
  ['ハニー', ['#fceabb', '#f8b500']],
]

const stops = (cols: string[]) => cols.map((c, i) => `<stop offset="${r((i / (cols.length - 1)) * 100)}%" stop-color="${c}"/>`).join('')

export function gradientItems(): GraphicItem[] {
  const out: GraphicItem[] = []
  SETS.forEach(([name, cols], i) => {
    const gid = (k: string) => `g${i}${k}`
    out.push({
      id: `grad-d-${i}`, label: `${name}(斜め)`, group: 'gradient', sub: 'linear', bg: true,
      svg: (w, h) => wrap(w, h, `<defs><linearGradient id="${gid('d')}" x1="0" y1="0" x2="1" y2="1">${stops(cols)}</linearGradient></defs><rect width="${r(w)}" height="${r(h)}" fill="url(#${gid('d')})"/>`),
    })
    out.push({
      id: `grad-r-${i}`, label: `${name}(放射)`, group: 'gradient', sub: 'radial', bg: true,
      svg: (w, h) => wrap(w, h, `<defs><radialGradient id="${gid('r')}" cx="0.5" cy="0.5" r="0.75">${stops([...cols].reverse())}</radialGradient></defs><rect width="${r(w)}" height="${r(h)}" fill="url(#${gid('r')})"/>`),
    })
    out.push({
      id: `grad-v-${i}`, label: `${name}(縦)`, group: 'gradient', sub: 'linear', bg: true,
      svg: (w, h) => wrap(w, h, `<defs><linearGradient id="${gid('v')}" x1="0" y1="0" x2="0" y2="1">${stops(cols)}</linearGradient></defs><rect width="${r(w)}" height="${r(h)}" fill="url(#${gid('v')})"/>`),
    })
  })
  return out
}
