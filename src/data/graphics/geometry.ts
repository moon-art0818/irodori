// 多角形を矩形(ページ)でクリップする。パターンがページからはみ出さないようにするための最小実装(Sutherland–Hodgman)。
import { r } from './types'
export type Pt = [number, number]

function clipEdge(poly: Pt[], inside: (p: Pt) => boolean, cross: (a: Pt, b: Pt) => Pt): Pt[] {
  const out: Pt[] = []
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length]
    const ia = inside(a), ib = inside(b)
    if (ia && ib) out.push(b)
    else if (ia && !ib) out.push(cross(a, b))
    else if (!ia && ib) { out.push(cross(a, b)); out.push(b) }
  }
  return out
}

export function clipRect(poly: Pt[], w: number, h: number): Pt[] {
  let p = poly
  const X = (x: number) => (a: Pt, b: Pt): Pt => [x, a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0])]
  const Y = (y: number) => (a: Pt, b: Pt): Pt => [a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]), y]
  p = clipEdge(p, (q) => q[0] >= 0, X(0)); if (!p.length) return p
  p = clipEdge(p, (q) => q[0] <= w, X(w)); if (!p.length) return p
  p = clipEdge(p, (q) => q[1] >= 0, Y(0)); if (!p.length) return p
  p = clipEdge(p, (q) => q[1] <= h, Y(h))
  return p
}

/** 多角形群を 1 本の path d にする(ページでクリップ済み) */
export function polysToD(polys: Pt[][], w: number, h: number): string {
  let d = ''
  for (const poly of polys) {
    const c = clipRect(poly, w, h)
    if (c.length < 3) continue
    d += 'M' + c.map((p) => `${r(p[0])} ${r(p[1])}`).join('L') + 'Z'
  }
  return d
}

export const rotPts = (pts: Pt[], cx: number, cy: number, deg: number): Pt[] => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a)
  return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c])
}
export const rectPts = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]

/** 円を 1 つの path サブパスにする */
export const circleD = (cx: number, cy: number, rad: number) =>
  `M${r(cx - rad)} ${r(cy)}a${r(rad)} ${r(rad)} 0 1 0 ${r(rad * 2)} 0a${r(rad)} ${r(rad)} 0 1 0 ${r(-rad * 2)} 0Z`
