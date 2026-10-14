// 手続き生成の素材(パターン・グラデーション・ブロブ・装飾)の共通型。すべてコードで生成するので外部ライセンスの対象外。
export type GraphicGroup = 'pattern' | 'gradient' | 'blob' | 'decor'

export interface GraphicItem {
  id: string
  label: string
  group: GraphicGroup
  /** 絞り込み用の小分類(パターンの種類・装飾の種類など) */
  sub: string
  /** true: ページ全面に敷く背景素材(配置時にページ大・最背面)。false: 中央に小さめに置く */
  bg: boolean
  /** SVG 文字列。bg の素材は (w, h) = ページの大きさで作る。それ以外は w, h を無視してよい */
  svg: (w: number, h: number) => string
}

/** ルート <svg>。width/height は付けず viewBox だけ(プレビューは CSS で大きさを決める) */
export const wrap = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r(w)} ${r(h)}">${body}</svg>`
export const r = (n: number) => Math.round(n * 100) / 100
