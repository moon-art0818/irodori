// 写真コラージュ(写真フレームを並べた配置)。フレームは elements.ts の frameShape と同じ形式なので、
// 画像を選択中に追加すると枠いっぱいに収まる(core.addImageURL の既存挙動)
import type { FabricObject } from 'fabric'
import { frameShape } from '../editor/elements'

/** 単位座標(0〜1)の1コマ。shape を指定するとそのコマだけ型(circle / heart など)になる */
export interface CollageCell { x: number; y: number; w: number; h: number; shape?: string }
export interface CollageLayout { id: string; label: string; count: number; cells: CollageCell[] }

/** 行ごとの枚数と行の高さの比から配置を作る */
function rows(id: string, label: string, perRow: number[], heights?: number[]): CollageLayout {
  const hs = heights ?? perRow.map(() => 1)
  const sum = hs.reduce((a, b) => a + b, 0)
  let y = 0
  const cells: CollageCell[] = []
  perRow.forEach((n, r) => {
    const h = hs[r] / sum
    for (let i = 0; i < n; i++) cells.push({ x: i / n, y, w: 1 / n, h })
    y += h
  })
  return { id, label, count: cells.length, cells }
}
/** 列ごとの枚数と列の幅の比から配置を作る(rows の縦横逆) */
function cols(id: string, label: string, perCol: number[], widths?: number[]): CollageLayout {
  const l = rows(id, label, perCol, widths)
  return { ...l, cells: l.cells.map((c) => ({ x: c.y, y: c.x, w: c.h, h: c.w, shape: c.shape })) }
}
const custom = (id: string, label: string, cells: CollageCell[]): CollageLayout => ({ id, label, count: cells.length, cells })

/** コラージュの配置(2〜9枚・全 21 種) */
export const COLLAGE_LAYOUTS: CollageLayout[] = [
  rows('2-cols', '2枚 横並び', [2]),
  rows('2-rows', '2枚 縦積み', [1, 1]),
  custom('2-wide-narrow', '2枚 大小(横)', [{ x: 0, y: 0, w: 0.64, h: 1 }, { x: 0.64, y: 0, w: 0.36, h: 1 }]),
  cols('3-cols', '3枚 横並び', [1, 1, 1]),
  rows('3-rows', '3枚 縦積み', [1, 1, 1]),
  cols('3-big-left', '3枚 左に大', [1, 2], [1.4, 1]),
  rows('3-big-top', '3枚 上に大', [1, 2], [1.4, 1]),
  rows('4-grid', '4枚 2×2', [2, 2]),
  rows('4-hero-bottom3', '4枚 上に大+下3', [1, 3], [1.6, 1]),
  cols('4-hero-right3', '4枚 左に大+右3', [1, 3], [1.5, 1]),
  rows('5-2-3', '5枚 上2+下3', [2, 3], [1.2, 1]),
  cols('5-hero-grid', '5枚 左に大+右4', [1, 2, 2], [1.4, 0.8, 0.8]),
  rows('6-grid-3x2', '6枚 3×2', [3, 3]),
  rows('6-grid-2x3', '6枚 2×3', [2, 2, 2]),
  rows('6-hero-5', '6枚 上に大+下5', [1, 2, 3], [2, 1, 1]),
  custom('7-mosaic', '7枚 モザイク', [
    { x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.25, h: 0.25 }, { x: 0.75, y: 0, w: 0.25, h: 0.25 },
    { x: 0.5, y: 0.25, w: 0.5, h: 0.25 }, { x: 0, y: 0.5, w: 0.25, h: 0.5 }, { x: 0.25, y: 0.5, w: 0.25, h: 0.5 },
    { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
  ]),
  rows('8-grid-4x2', '8枚 4×2', [4, 4]),
  rows('8-3-2-3', '8枚 3+2+3', [3, 2, 3]),
  rows('9-grid-3x3', '9枚 3×3', [3, 3, 3]),
  rows('9-hero', '9枚 上に大+2段', [1, 4, 4], [2, 1, 1]),
  custom('4-circles', '4枚 丸型 2×2', [0, 1].flatMap((r) => [0, 1].map((c) => ({ x: c / 2, y: r / 2, w: 0.5, h: 0.5, shape: 'circle' })))),
]

/**
 * コラージュ用の写真フレームを作る(中身は空のフレーム。位置はページ座標で確定済み)。
 * gap: コマの間と外周の余白(px)、radius: 角丸の半径(px。0 で四角)。
 * 返したオブジェクトは core.place を使わず canvas.add して commit すること(ページ全体に配置済みのため)
 */
export function buildCollage(layoutId: string, pageW: number, pageH: number, gap = 16, radius = 0): FabricObject[] {
  const lay = COLLAGE_LAYOUTS.find((l) => l.id === layoutId)
  if (!lay) throw new Error(`コラージュの配置が見つかりません: ${layoutId}`)
  const g = Math.max(0, gap)
  // 外周の余白 = gap、コマ同士の間 = gap になるよう、コマを gap/2 ずつ縮める
  const ax = g / 2, ay = g / 2, aw = pageW - g, ah = pageH - g
  return lay.cells.map((c, i) => {
    const w = Math.max(8, c.w * aw - g), h = Math.max(8, c.h * ah - g)
    const k = Math.min(0.5, Math.max(0, radius) / Math.min(w, h))
    const shape = c.shape ?? (k > 0 ? `rr:${+k.toFixed(4)}` : 'rect')
    const o = frameShape(shape, w, h)
    o.set({ originX: 'left', originY: 'top', left: ax + c.x * aw + g / 2, top: ay + c.y * ah + g / 2, fill: '#d4d4d8', stroke: '#a1a1aa', strokeWidth: 0, name: `フレーム${i + 1}` } as any)
    ;(o as any).frame = shape
    return o
  })
}
