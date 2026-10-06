import { Circle, Ellipse, FabricObject, Path, Rect } from 'fabric'

export interface ShapeDef { id: string; label: string; group: string; make: (size: number) => FabricObject; preview: string }

const C = '#8b5cf6'
// 100×100 の箱で書いた SVG パスを size に拡大する
const path = (d: string, opts: Record<string, any> = {}) => (size: number) => {
  const p = new Path(d, { fill: C, ...opts })
  const s = size / 100
  p.set({ scaleX: s, scaleY: s })
  if (opts.strokeWidth) p.set({ strokeUniform: true })
  return p
}
const poly = (n: number, rot = -90) => {
  const pts = Array.from({ length: n }, (_, i) => {
    const a = ((rot + (360 / n) * i) * Math.PI) / 180
    return `${50 + 50 * Math.cos(a)} ${50 + 50 * Math.sin(a)}`
  })
  return 'M' + pts.join(' L') + ' Z'
}
const star = (n: number, inner: number) => {
  const pts: string[] = []
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? inner : 50
    const a = ((-90 + (180 / n) * i) * Math.PI) / 180
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`)
  }
  return 'M' + pts.join(' L') + ' Z'
}

const D: Record<string, string> = {
  triangle: 'M50 0 L100 100 L0 100 Z',
  rtriangle: 'M0 0 L100 100 L0 100 Z',
  diamond: 'M50 0 L100 50 L50 100 L0 50 Z',
  pentagon: poly(5), hexagon: poly(6, 0), octagon: poly(8, 22.5),
  star5: star(5, 20), star6: star(6, 28), star8: star(8, 34), burst: star(16, 38), burst2: star(24, 42),
  heart: 'M50 92 C20 70 0 52 0 30 C0 13 13 2 28 2 C38 2 46 8 50 16 C54 8 62 2 72 2 C87 2 100 13 100 30 C100 52 80 70 50 92 Z',
  cross: 'M35 0 H65 V35 H100 V65 H65 V100 H35 V65 H0 V35 H35 Z',
  arrowR: 'M0 30 H60 V5 L100 50 L60 95 V70 H0 Z',
  arrowL: 'M100 30 H40 V5 L0 50 L40 95 V70 H100 Z',
  arrowU: 'M30 100 V40 H5 L50 0 L95 40 H70 V100 Z',
  arrowD: 'M30 0 V60 H5 L50 100 L95 60 H70 V0 Z',
  arrowLR: 'M0 50 L25 15 V35 H75 V15 L100 50 L75 85 V65 H25 V85 Z',
  chevron: 'M0 0 H70 L100 50 L70 100 H0 L30 50 Z',
  pentArrow: 'M0 0 H75 L100 50 L75 100 H0 Z',
  parallelogram: 'M25 0 H100 L75 100 H0 Z',
  trapezoid: 'M20 0 H80 L100 100 H0 Z',
  bubble: 'M10 0 H90 Q100 0 100 10 V60 Q100 70 90 70 H40 L20 95 L25 70 H10 Q0 70 0 60 V10 Q0 0 10 0 Z',
  bubbleRound: 'M50 0 C80 0 100 16 100 38 C100 60 80 76 50 76 C44 76 38 75 33 74 L12 92 L18 68 C6 61 0 50 0 38 C0 16 20 0 50 0 Z',
  thought: 'M30 10 C35 0 55 -2 62 8 C72 0 92 6 90 22 C102 28 100 48 88 52 C90 66 72 72 62 64 C54 76 32 74 28 62 C12 66 2 50 10 40 C0 30 10 12 30 10 Z M18 82 A6 6 0 1 0 18.1 82 Z M8 95 A3.5 3.5 0 1 0 8.1 95 Z',
  cloud: 'M25 85 C8 85 0 72 3 60 C6 48 18 44 24 46 C24 28 40 18 54 22 C62 8 86 10 90 30 C100 32 104 48 98 58 C104 72 92 86 78 85 Z',
  moon: 'M60 0 C30 4 10 28 10 55 C10 80 32 100 60 100 C75 100 88 94 96 84 C60 90 34 64 40 30 C43 16 50 6 60 0 Z',
  drop: 'M50 0 C50 0 90 45 90 68 C90 88 72 100 50 100 C28 100 10 88 10 68 C10 45 50 0 50 0 Z',
  lightning: 'M58 0 L15 58 H45 L35 100 L85 38 H55 Z',
  ribbon: 'M0 20 H100 L88 50 L100 80 H0 L12 50 Z',
  badge: star(12, 44),
  check: 'M8 52 L20 40 L40 60 L82 18 L94 30 L40 84 Z',
  ring: 'M50 0 A50 50 0 1 1 49.9 0 Z M50 22 A28 28 0 1 0 50.1 22 Z',
  halfCircle: 'M0 75 A50 50 0 0 1 100 75 Z',
  quarter: 'M0 0 A100 100 0 0 1 100 100 H0 Z',
  arch: 'M0 100 V50 A50 50 0 0 1 100 50 V100 Z',
  blob1: 'M70 6 C88 14 100 34 96 56 C92 80 70 98 46 96 C22 94 2 76 2 52 C2 28 20 10 40 4 C50 1 60 2 70 6 Z',
  blob2: 'M62 2 C82 6 98 22 96 44 C94 62 100 80 84 92 C66 104 40 98 22 88 C6 78 -2 58 4 40 C10 18 38 -4 62 2 Z',
}

const svgPreview = (d: string, stroke = false) =>
  `<svg viewBox="-4 -4 108 108" xmlns="http://www.w3.org/2000/svg"><path d="${d}" fill="${stroke ? 'none' : C}" stroke="${stroke ? C : 'none'}" stroke-width="${stroke ? 6 : 0}" fill-rule="evenodd"/></svg>`

const fromD = (id: string, label: string, group: string): ShapeDef => ({
  id, label, group, make: path(D[id], { fillRule: 'evenodd' }), preview: svgPreview(D[id]),
})

const line = (id: string, label: string, d: string, dash?: number[]): ShapeDef => ({
  id, label, group: '線・矢印',
  make: (size) => {
    const p = new Path(d, { fill: '', stroke: '#1f2937', strokeWidth: 6, strokeLineCap: 'round', strokeLineJoin: 'round', strokeDashArray: dash ?? null, strokeUniform: true })
    const s = (size * 1.6) / 100
    p.set({ scaleX: s, scaleY: s })
    return p
  },
  preview: `<svg viewBox="-6 -6 112 112" xmlns="http://www.w3.org/2000/svg"><path d="${d}" fill="none" stroke="#1f2937" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" ${dash ? `stroke-dasharray="${dash.join(' ')}"` : ''}/></svg>`,
})

export const SHAPES: ShapeDef[] = [
  { id: 'rect', label: '四角形', group: '基本図形', make: (s) => new Rect({ width: s, height: s, fill: C }), preview: svgPreview('M0 0 H100 V100 H0 Z') },
  { id: 'rrect', label: '角丸四角形', group: '基本図形', make: (s) => new Rect({ width: s, height: s, rx: s * 0.15, ry: s * 0.15, fill: C }), preview: svgPreview('M15 0 H85 Q100 0 100 15 V85 Q100 100 85 100 H15 Q0 100 0 85 V15 Q0 0 15 0 Z') },
  { id: 'circle', label: '円', group: '基本図形', make: (s) => new Circle({ radius: s / 2, fill: C }), preview: svgPreview('M50 0 A50 50 0 1 1 49.9 0 Z') },
  { id: 'ellipse', label: '楕円', group: '基本図形', make: (s) => new Ellipse({ rx: s * 0.6, ry: s * 0.4, fill: C }), preview: svgPreview('M50 20 A50 30 0 1 1 49.9 20 Z') },
  ...['triangle', 'rtriangle', 'diamond', 'pentagon', 'hexagon', 'octagon', 'parallelogram', 'trapezoid', 'halfCircle', 'quarter', 'arch', 'ring', 'cross']
    .map((id) => fromD(id, ({ triangle: '三角形', rtriangle: '直角三角形', diamond: 'ひし形', pentagon: '五角形', hexagon: '六角形', octagon: '八角形', parallelogram: '平行四辺形', trapezoid: '台形', halfCircle: '半円', quarter: '扇形', arch: 'アーチ', ring: 'リング', cross: '十字' } as any)[id], '基本図形')),
  ...['star5', 'star6', 'star8', 'burst', 'burst2', 'badge', 'heart', 'moon', 'drop', 'lightning', 'cloud', 'check', 'ribbon', 'blob1', 'blob2']
    .map((id) => fromD(id, ({ star5: '星', star6: '六芒星', star8: '八芒星', burst: 'バースト', burst2: 'ギザギザ', badge: 'バッジ', heart: 'ハート', moon: '月', drop: 'しずく', lightning: '稲妻', cloud: '雲', check: 'チェック', ribbon: 'リボン', blob1: 'ゆらぎ1', blob2: 'ゆらぎ2' } as any)[id], '装飾')),
  ...['arrowR', 'arrowL', 'arrowU', 'arrowD', 'arrowLR', 'chevron', 'pentArrow']
    .map((id) => fromD(id, ({ arrowR: '右矢印', arrowL: '左矢印', arrowU: '上矢印', arrowD: '下矢印', arrowLR: '両矢印', chevron: 'シェブロン', pentArrow: 'ホームベース' } as any)[id], 'ブロック矢印')),
  ...['bubble', 'bubbleRound', 'thought'].map((id) => fromD(id, ({ bubble: '吹き出し(四角)', bubbleRound: '吹き出し(丸)', thought: '考え中' } as any)[id], '吹き出し')),
  line('line', '直線', 'M0 50 L100 50'),
  line('dash', '破線', 'M0 50 L100 50', [14, 10]),
  line('dot', '点線', 'M0 50 L100 50', [1, 12]),
  line('arrowLine', '矢印線', 'M0 50 L100 50 M82 36 L100 50 L82 64'),
  line('arrowLine2', '両矢印線', 'M0 50 L100 50 M82 36 L100 50 L82 64 M18 36 L0 50 L18 64'),
  line('curve', '曲線', 'M0 70 C30 10 70 90 100 30'),
  line('curveArrow', '曲線矢印', 'M0 80 C20 20 70 10 100 40 M86 26 L100 40 L82 46'),
  line('wave', '波線', 'M0 50 Q12.5 30 25 50 T50 50 T75 50 T100 50'),
  line('zigzag', 'ジグザグ', 'M0 60 L12.5 40 L25 60 L37.5 40 L50 60 L62.5 40 L75 60 L87.5 40 L100 60'),
  line('elbow', 'カギ線', 'M0 20 H50 V80 H100'),
]
