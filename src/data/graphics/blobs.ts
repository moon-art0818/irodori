// ブロブ(有機的な形): 24 形 × 3 色 = 72 点。シード固定の疑似乱数で閉曲線(Catmull-Rom → 3 次ベジェ)を作る
import { wrap, r, type GraphicItem } from './types'

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function blobPath(seed: number): string {
  const rand = rng(seed * 7919 + 13)
  const n = 6 + Math.floor(rand() * 4) // 6〜9 点
  const spread = 0.12 + rand() * 0.2
  const pts = Array.from({ length: n }, (_, i) => {
    const ang = (i / n) * Math.PI * 2 + (rand() - 0.5) * 0.25
    const rad = 50 * (0.62 + rand() * spread * 2.4) * 0.98
    return [50 + rad * Math.cos(ang), 50 + rad * Math.sin(ang)] as [number, number]
  })
  const P = (i: number) => pts[(i + n) % n]
  let d = `M${r(P(0)[0])} ${r(P(0)[1])}`
  for (let i = 0; i < n; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2)
    const c1: [number, number] = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: [number, number] = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${r(c1[0])} ${r(c1[1])} ${r(c2[0])} ${r(c2[1])} ${r(p2[0])} ${r(p2[1])}`
  }
  return d + 'Z'
}

const COLORS: [string, string][] = [['ピンク', '#f9a8d4'], ['ブルー', '#93c5fd'], ['イエロー', '#fcd34d']]

export function blobItems(): GraphicItem[] {
  const out: GraphicItem[] = []
  for (let s = 1; s <= 24; s++) {
    const d = blobPath(s)
    COLORS.forEach(([name, c]) => {
      out.push({
        id: `blob-${s}-${c.slice(1)}`, label: `ブロブ ${s}(${name})`, group: 'blob', sub: 'blob', bg: false,
        svg: () => wrap(100, 100, `<path d="${d}" fill="${c}"/>`),
      })
    })
  }
  return out
}
