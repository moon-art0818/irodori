// 幾何学パターン: 18 種 × 密度 2 × 配色 12 = 432 点。すべて 1 枚の背景矩形 + 数本の path で作る(軽い)。
// ページからはみ出さないよう、多角形は clipRect でクリップし、円・線はページ内に収まる位置だけに置く。
import { wrap, r, type GraphicItem } from './types'
import { PALETTES } from './palettes'
import { circleD, polysToD, rectPts, rotPts, type Pt } from './geometry'

type Gen = (w: number, h: number, c: number, bg: string, fg: string) => string
const base = (w: number, h: number, bg: string) => `<rect width="${r(w)}" height="${r(h)}" fill="${bg}"/>`
const path = (d: string, fill: string, op = 1) => (d ? `<path d="${d}" fill="${fill}"${op < 1 ? ` fill-opacity="${op}"` : ''}/>` : '')
const strokePath = (d: string, stroke: string, sw: number) => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${r(sw)}" stroke-linejoin="round"/>`

const dots = (ratio: number, offset: boolean): Gen => (w, h, c, bg, fg) => {
  const rad = c * ratio
  let d = ''
  const stepY = offset ? c * 0.87 : c
  for (let j = 0, y = stepY / 2 + (offset ? 0 : 0); y + rad <= h; j++, y = stepY / 2 + j * stepY) {
    const sx = offset && j % 2 ? c / 2 : 0
    for (let x = c / 2 + sx; x + rad <= w; x += c) if (x - rad >= 0) d += circleD(x, y, rad)
  }
  return base(w, h, bg) + path(d, fg)
}

const stripesH: Gen = (w, h, c, bg, fg) => {
  const polys: Pt[][] = []
  for (let y = c * 0.25; y < h; y += c) polys.push(rectPts(0, y, w, c * 0.5))
  return base(w, h, bg) + path(polysToD(polys, w, h), fg)
}
const stripesV: Gen = (w, h, c, bg, fg) => {
  const polys: Pt[][] = []
  for (let x = c * 0.25; x < w; x += c) polys.push(rectPts(x, 0, c * 0.5, h))
  return base(w, h, bg) + path(polysToD(polys, w, h), fg)
}
const stripesDiag = (dir: 1 | -1): Gen => (w, h, c, bg, fg) => {
  const step = c * 1.3, t = step * 0.5, T = w + h
  const polys: Pt[][] = []
  const from = dir === 1 ? 0 : -h
  const to = dir === 1 ? w + h : w
  for (let k = from; k < to; k += step) {
    const c1 = k, c2 = k + t
    polys.push(dir === 1
      ? [[c1 + T, -T], [c2 + T, -T], [c2 - T, T], [c1 - T, T]]
      : [[c1 - T, -T], [c2 - T, -T], [c2 + T, T], [c1 + T, T]])
  }
  return base(w, h, bg) + path(polysToD(polys, w, h), fg)
}
const checker: Gen = (w, h, c, bg, fg) => {
  const polys: Pt[][] = []
  for (let j = 0; j * c < h; j++) for (let i = 0; i * c < w; i++) if ((i + j) % 2 === 0) polys.push(rectPts(i * c, j * c, c, c))
  return base(w, h, bg) + path(polysToD(polys, w, h), fg)
}
const gingham: Gen = (w, h, c, bg, fg) => {
  const hs: Pt[][] = [], vs: Pt[][] = []
  for (let y = c * 0.25; y < h; y += c) hs.push(rectPts(0, y, w, c * 0.5))
  for (let x = c * 0.25; x < w; x += c) vs.push(rectPts(x, 0, c * 0.5, h))
  return base(w, h, bg) + path(polysToD(hs, w, h), fg, 0.35) + path(polysToD(vs, w, h), fg, 0.35)
}
const grid: Gen = (w, h, c, bg, fg) => {
  const t = Math.max(c * 0.05, 0.6), polys: Pt[][] = []
  for (let y = 0; y < h; y += c) polys.push(rectPts(0, y, w, t))
  for (let x = 0; x < w; x += c) polys.push(rectPts(x, 0, t, h))
  return base(w, h, bg) + path(polysToD(polys, w, h), fg)
}
const plus: Gen = (w, h, c, bg, fg) => {
  const a = c * 0.32, t = c * 0.1, polys: Pt[][] = []
  for (let j = 0; j * c + c / 2 < h + c / 2; j++) for (let i = 0; i * c + c / 2 < w + c / 2; i++) {
    const cx = c / 2 + i * c + (j % 2 ? c / 2 : 0), cy = c / 2 + j * c
    polys.push(rectPts(cx - a, cy - t, a * 2, t * 2), rectPts(cx - t, cy - a, t * 2, a * 2))
  }
  return base(w, h, bg) + path(polysToD(polys, w, h), fg)
}
const waves = (zig: boolean): Gen => (w, h, c, bg, fg) => {
  const amp = c * 0.2, rowH = c * 0.9
  const m = Math.max(2, Math.round(w / c)), lam = w / m
  let d = ''
  for (let y0 = rowH / 2; y0 + amp * 1.05 <= h; y0 += rowH) {
    d += `M0 ${r(y0)}`
    for (let k = 0; k < m * 2; k++) {
      const x = k * (lam / 2), s = k % 2 ? 1 : -1
      d += zig ? `L${r(x + lam / 4)} ${r(y0 + s * amp)}L${r(x + lam / 2)} ${r(y0)}` : `Q${r(x + lam / 4)} ${r(y0 + s * amp * 2)} ${r(x + lam / 2)} ${r(y0)}`
    }
  }
  return base(w, h, bg) + strokePath(d, fg, c * 0.1)
}
const chevron: Gen = (w, h, c, bg, fg) => {
  const dp = c * 0.5, t = c * 0.4, polys: Pt[][] = []
  for (let y = -dp; y < h; y += c) polys.push([[0, y], [w / 2, y + dp], [w, y], [w, y + t], [w / 2, y + dp + t], [0, y + t]])
  return base(w, h, bg) + path(polysToD(polys, w, h), fg)
}
const triangles: Gen = (w, h, c, bg, fg) => {
  const up: Pt[][] = [], dn: Pt[][] = []
  for (let j = 0; j * c < h; j++) for (let i = 0; i * c < w; i++) {
    const x = i * c, y = j * c
    up.push([[x, y + c], [x + c / 2, y], [x + c, y + c]])
    dn.push([[x, y], [x + c, y], [x + c / 2, y + c]])
  }
  return base(w, h, bg) + path(polysToD(up.filter((_, k) => k % 2 === 0), w, h), fg, 0.9) + path(polysToD(dn.filter((_, k) => k % 3 === 0), w, h), fg, 0.4)
}
const argyle: Gen = (w, h, c, bg, fg) => {
  const hh = c * 0.7, polys: Pt[][] = []
  for (let j = 0; (j - 1) * hh < h; j += 2) for (let i = -1; i * c < w + c; i++) {
    const cx = i * c, cy = j * hh
    polys.push([[cx, cy - hh], [cx + c / 2, cy], [cx, cy + hh], [cx - c / 2, cy]])
  }
  return base(w, h, bg) + path(polysToD(polys, w, h), fg, 0.85)
}
const weave: Gen = (w, h, c, bg, fg) => {
  const s = c * 0.7, len = c * 0.95, wid = c * 0.3
  const a: Pt[][] = [], b: Pt[][] = []
  for (let j = -1; j * s < h + s; j++) for (let i = -1; i * s < w + s; i++) {
    const cx = i * s, cy = j * s
    const rect = rectPts(cx - len / 2, cy - wid / 2, len, wid)
    if ((i + j) % 2 === 0) a.push(rotPts(rect, cx, cy, 45)); else b.push(rotPts(rect, cx, cy, -45))
  }
  return base(w, h, bg) + path(polysToD(a, w, h), fg, 0.9) + path(polysToD(b, w, h), fg, 0.5)
}
const honeycomb: Gen = (w, h, c, bg, fg) => {
  const rho = c * 0.6, dx = Math.sqrt(3) * rho, dy = rho * 1.5
  const tone: Pt[][][] = [[], [], []]
  for (let j = -1; j * dy < h + rho; j++) for (let i = -1; i * dx < w + dx; i++) {
    const cx = i * dx + (j % 2 ? dx / 2 : 0), cy = j * dy
    const hex: Pt[] = Array.from({ length: 6 }, (_, k) => {
      const ang = ((60 * k - 90) * Math.PI) / 180
      return [cx + rho * 0.93 * Math.cos(ang), cy + rho * 0.93 * Math.sin(ang)] as Pt
    })
    tone[(((i + j * 2) % 3) + 3) % 3].push(hex)
  }
  return base(w, h, bg) + path(polysToD(tone[0], w, h), fg, 0.25) + path(polysToD(tone[1], w, h), fg, 0.5) + path(polysToD(tone[2], w, h), fg, 0.8)
}
const stars: Gen = (w, h, c, bg, fg) => {
  const polys: Pt[][] = []
  for (let j = 0; j * c < h + c; j++) for (let i = -1; i * c < w + c; i++) {
    const cx = c / 2 + i * c + (j % 2 ? c / 2 : 0), cy = c / 2 + j * c * 0.9
    polys.push(Array.from({ length: 10 }, (_, k) => {
      const rad = k % 2 ? c * 0.09 : c * 0.22, ang = ((-90 + 36 * k) * Math.PI) / 180
      return [cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)] as Pt
    }))
  }
  return base(w, h, bg) + path(polysToD(polys, w, h), fg)
}

const TYPES: { id: string; label: string; gen: Gen; n: [number, number] }[] = [
  { id: 'dots', label: 'ドット', gen: dots(0.16, false), n: [7, 14] },
  { id: 'polka', label: '水玉', gen: dots(0.22, true), n: [5, 10] },
  { id: 'stripe-h', label: '横ストライプ', gen: stripesH, n: [7, 14] },
  { id: 'stripe-v', label: '縦ストライプ', gen: stripesV, n: [7, 14] },
  { id: 'stripe-d1', label: '斜めストライプ ╱', gen: stripesDiag(1), n: [7, 14] },
  { id: 'stripe-d2', label: '斜めストライプ ╲', gen: stripesDiag(-1), n: [7, 14] },
  { id: 'checker', label: '市松', gen: checker, n: [6, 14] },
  { id: 'gingham', label: 'ギンガム', gen: gingham, n: [6, 12] },
  { id: 'grid', label: '方眼', gen: grid, n: [8, 16] },
  { id: 'plus', label: 'プラス', gen: plus, n: [6, 12] },
  { id: 'wave', label: '波', gen: waves(false), n: [4, 8] },
  { id: 'zigzag', label: 'ジグザグ', gen: waves(true), n: [4, 8] },
  { id: 'chevron', label: 'シェブロン', gen: chevron, n: [6, 12] },
  { id: 'triangle', label: '三角', gen: triangles, n: [6, 12] },
  { id: 'argyle', label: 'アーガイル', gen: argyle, n: [4, 8] },
  { id: 'herring', label: 'ななめ織り', gen: weave, n: [6, 12] },
  { id: 'honey', label: 'ハニカム', gen: honeycomb, n: [6, 12] },
  { id: 'star', label: '星', gen: stars, n: [5, 9] },
]

export const PATTERN_TYPES = TYPES.map((t) => ({ id: t.id, label: t.label }))

export function patternItems(): GraphicItem[] {
  const out: GraphicItem[] = []
  for (const t of TYPES) {
    t.n.forEach((n, di) => {
      for (const p of PALETTES) {
        out.push({
          id: `pat-${t.id}-${di ? 's' : 'l'}-${p.id}`,
          label: `${t.label}(${di ? '細かい' : '大きい'}・${p.label})`,
          group: 'pattern', sub: t.id, bg: true,
          svg: (w, h) => wrap(w, h, t.gen(w, h, Math.max(w, h) / n, p.bg, p.fg)),
        })
      }
    })
  }
  return out
}
