// 特殊な要素: フレーム(写真の型抜き)・表・グラフ・QRコード
import { Circle, FabricImage, FabricObject, FabricText, Group, Line, Path, Rect, Textbox } from 'fabric'
import QRCode from 'qrcode'
import { SHAPES } from '../data/shapes'

// ---------------- フレーム ----------------
export const FRAME_SHAPES: { id: string; label: string; shape: string; ratio?: number }[] = [
  { id: 'rect', label: '四角', shape: 'rect' },
  { id: 'rect43', label: '横長', shape: 'rect', ratio: 4 / 3 },
  { id: 'rect34', label: '縦長', shape: 'rect', ratio: 3 / 4 },
  { id: 'rrect', label: '角丸', shape: 'rrect' },
  { id: 'circle', label: '円', shape: 'circle' },
  { id: 'arch', label: 'アーチ', shape: 'arch', ratio: 1 / 1.2 },
  { id: 'heart', label: 'ハート', shape: 'heart' },
  { id: 'star5', label: '星', shape: 'star5' },
  { id: 'hexagon', label: '六角形', shape: 'hexagon' },
  { id: 'diamond', label: 'ひし形', shape: 'diamond' },
  { id: 'blob1', label: 'ゆらぎ', shape: 'blob1' },
  { id: 'bubbleRound', label: '吹き出し', shape: 'bubbleRound' },
]

/** w×h に合わせた形(中心基準)。クリップパスにも使う */
export function frameShape(shape: string, w: number, h: number): FabricObject {
  let o: FabricObject
  if (shape === 'rect') o = new Rect({ width: w, height: h })
  else if (shape === 'rrect') o = new Rect({ width: w, height: h, rx: Math.min(w, h) * 0.12, ry: Math.min(w, h) * 0.12 })
  else if (shape.startsWith('rr:')) { const k = parseFloat(shape.slice(3)) || 0; o = new Rect({ width: w, height: h, rx: Math.min(w, h) * k, ry: Math.min(w, h) * k }) }
  else if (shape === 'circle') o = new Path(`M ${w / 2} 0 A ${w / 2} ${h / 2} 0 1 1 ${w / 2 - 0.01} 0 Z`)
  else {
    const def = SHAPES.find((s) => s.id === shape)!
    o = def.make(100)
    o.set({ scaleX: w / o.width, scaleY: h / o.height })
  }
  o.set({ originX: 'center', originY: 'center', left: 0, top: 0 })
  return o
}

export function makeFrame(id: string, size: number): FabricObject {
  const f = FRAME_SHAPES.find((x) => x.id === id)!
  const r = f.ratio ?? 1
  const w = r >= 1 ? size : size * r, h = r >= 1 ? size / r : size
  const ph = frameShape(f.shape, w, h)
  // 置き場所は呼び出し側で決める。中心基準→左上基準に直す
  ph.set({ originX: 'left', originY: 'top', fill: '#d4d4d8', stroke: '#a1a1aa', strokeWidth: 0, name: 'フレーム' } as any)
  ;(ph as any).frame = f.shape
  return ph
}

/** フレームに画像を入れる。画像は枠いっぱいに覆うよう中央で切り抜く */
export async function fillFrame(frame: FabricObject, url: string, assetId?: string): Promise<FabricImage> {
  const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' })
  const fw = frame.getScaledWidth(), fh = frame.getScaledHeight()
  const nw = img.width, nh = img.height
  const s = Math.max(fw / nw, fh / nh)
  const cw = fw / s, ch = fh / s
  img.set({
    cropX: (nw - cw) / 2, cropY: (nh - ch) / 2, width: cw, height: ch, scaleX: s, scaleY: s,
    left: frame.left, top: frame.top, angle: frame.angle, assetId, name: '写真',
  } as any)
  const shape = (frame as any).frame ?? 'rect'
  ;(img as any).frame = shape
  img.clipPath = frameShape(shape, cw, ch)
  return img
}

// ---------------- QR コード ----------------
export function makeQR(text: string, color = '#111827', size = 300, bg = '#ffffff'): Group {
  const qr = QRCode.create(text || ' ', { errorCorrectionLevel: 'M' })
  const n = qr.modules.size
  const q = 2 // 余白(モジュール数)
  let d = ''
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.modules.get(r, c)) d += `M${c + q} ${r + q}h1v1h-1z`
  const total = n + q * 2
  const s = size / total
  const back = new Rect({ left: 0, top: 0, width: total, height: total, fill: bg })
  const dots = new Path(d, { left: q, top: q, fill: color })
  const g = new Group([back, dots], { scaleX: s, scaleY: s, objectCaching: false })
  ;(g as any).qr = { text, color, bg }
  ;(g as any).name = 'QRコード'
  return g
}

// ---------------- 表 ----------------
export interface TableSpec { rows: number; cols: number; header: string; border: string; cells?: string[][]; cellW?: number; cellH?: number; fontSize?: number }
export function makeTable(spec: TableSpec): Group {
  const cw = spec.cellW ?? 220, chh = spec.cellH ?? 72, fs = spec.fontSize ?? 26
  const objs: FabricObject[] = []
  for (let r = 0; r < spec.rows; r++) for (let c = 0; c < spec.cols; c++) {
    const head = r === 0 && !!spec.header
    objs.push(new Rect({ left: c * cw, top: r * chh, width: cw, height: chh, fill: head ? spec.header : '#ffffff', stroke: spec.border, strokeWidth: 2 }))
    const text = spec.cells?.[r]?.[c] ?? (head ? `見出し${c + 1}` : '')
    objs.push(new Textbox(text, {
      left: c * cw + 12, top: r * chh + (chh - fs * 1.3) / 2, width: cw - 24, fontSize: fs, fontFamily: 'Noto Sans JP',
      fontWeight: head ? 700 : 400, fill: head ? '#ffffff' : '#1f2937', textAlign: 'center', splitByGrapheme: true,
    }))
  }
  const g = new Group(objs, { subTargetCheck: true, interactive: false })
  ;(g as any).table = { rows: spec.rows, cols: spec.cols, header: spec.header, border: spec.border }
  ;(g as any).name = '表'
  return g
}
/** 表の中身を読み出す(行・列を変えて作り直すときに使う) */
export function readTable(g: Group): string[][] {
  const t = (g as any).table as TableSpec
  const texts = g.getObjects().filter((o) => o instanceof Textbox) as Textbox[]
  return Array.from({ length: t.rows }, (_, r) => Array.from({ length: t.cols }, (_, c) => texts[r * t.cols + c]?.text ?? ''))
}

// ---------------- グラフ ----------------
export interface ChartSpec { type: 'bar' | 'hbar' | 'line' | 'pie' | 'donut'; labels: string[]; values: number[]; colors: string[]; title?: string; w: number; h: number }
export const CHART_COLORS = ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6', '#8b5cf6']

export function makeChart(spec: ChartSpec): Group {
  const { w, h, labels, values, colors } = spec
  const objs: FabricObject[] = []
  const font = { fontFamily: 'Noto Sans JP', fill: '#374151' }
  const top = spec.title ? 56 : 10
  if (spec.title) objs.push(new Textbox(spec.title, { left: 0, top: 0, width: w, fontSize: 32, fontWeight: 700, textAlign: 'center', ...font }))
  const max = Math.max(1, ...values.map((v) => Math.abs(v)))
  const col = (i: number) => colors[i % colors.length]
  if (spec.type === 'bar' || spec.type === 'line') {
    const left = 60, bottom = h - 50, ph = bottom - top, pw = w - left - 10
    for (let i = 0; i <= 4; i++) {
      const y = bottom - (ph * i) / 4
      objs.push(new Line([left, y, w - 10, y], { stroke: '#e5e7eb', strokeWidth: 2 }))
      objs.push(new Textbox(String(Math.round((max * i) / 4 * 10) / 10), { left: 0, top: y - 12, width: left - 8, fontSize: 18, textAlign: 'right', ...font }))
    }
    const step = pw / Math.max(1, values.length)
    if (spec.type === 'bar') values.forEach((v, i) => {
      const bh = (ph * Math.max(0, v)) / max
      objs.push(new Rect({ left: left + i * step + step * 0.18, top: bottom - bh, width: step * 0.64, height: Math.max(1, bh), fill: col(i), rx: 6, ry: 6 }))
    })
    else {
      const pts = values.map((v, i) => [left + i * step + step / 2, bottom - (ph * Math.max(0, v)) / max])
      objs.push(new Path('M' + pts.map((p) => p.join(' ')).join(' L'), { fill: '', stroke: col(0), strokeWidth: 5, strokeLineJoin: 'round', strokeLineCap: 'round' }))
      pts.forEach((p) => objs.push(new Circle({ left: p[0] - 8, top: p[1] - 8, radius: 8, fill: '#fff', stroke: col(0), strokeWidth: 4 })))
    }
    labels.forEach((l, i) => objs.push(new Textbox(l, { left: left + i * step, top: bottom + 10, width: step, fontSize: 18, textAlign: 'center', splitByGrapheme: true, ...font })))
  } else if (spec.type === 'hbar') {
    const left = 140, ph = h - top - 10, step = ph / Math.max(1, values.length), pw = w - left - 60
    values.forEach((v, i) => {
      const bw = (pw * Math.max(0, v)) / max
      objs.push(new Textbox(labels[i] ?? '', { left: 0, top: top + i * step + step / 2 - 12, width: left - 12, fontSize: 20, textAlign: 'right', ...font }))
      objs.push(new Rect({ left, top: top + i * step + step * 0.18, width: Math.max(1, bw), height: step * 0.64, fill: col(i), rx: 6, ry: 6 }))
      objs.push(new Textbox(String(v), { left: left + bw + 8, top: top + i * step + step / 2 - 12, width: 60, fontSize: 18, ...font }))
    })
  } else {
    const total = values.reduce((a, b) => a + Math.max(0, b), 0) || 1
    const r = Math.min(w * 0.6, h - top) / 2 - 4, cx = r + 4, cy = top + r
    let a0 = -Math.PI / 2
    values.forEach((v, i) => {
      const a1 = a0 + (Math.max(0, v) / total) * Math.PI * 2
      const large = a1 - a0 > Math.PI ? 1 : 0
      const p = (a: number, rr: number) => `${cx + rr * Math.cos(a)} ${cy + rr * Math.sin(a)}`
      const ri = spec.type === 'donut' ? r * 0.55 : 0
      const d = values.length === 1
        ? `M${p(0, r)} A${r} ${r} 0 1 1 ${p(Math.PI * 1.999, r)} Z`
        : ri ? `M${p(a0, r)} A${r} ${r} 0 ${large} 1 ${p(a1, r)} L${p(a1, ri)} A${ri} ${ri} 0 ${large} 0 ${p(a0, ri)} Z`
          : `M${cx} ${cy} L${p(a0, r)} A${r} ${r} 0 ${large} 1 ${p(a1, r)} Z`
      objs.push(new Path(d, { fill: col(i), stroke: '#ffffff', strokeWidth: 3 }))
      a0 = a1
    })
    const lx = cx + r + 30
    labels.forEach((l, i) => {
      objs.push(new Rect({ left: lx, top: top + 20 + i * 40, width: 24, height: 24, fill: col(i), rx: 4, ry: 4 }))
      objs.push(new Textbox(`${l}  ${Math.round((Math.max(0, values[i] ?? 0) / total) * 100)}%`, { left: lx + 34, top: top + 20 + i * 40, width: w - lx - 34, fontSize: 20, ...font }))
    })
  }
  const g = new Group(objs)
  ;(g as any).chart = spec
  ;(g as any).name = 'グラフ'
  return g
}

// ---------------- 曲線テキスト(1文字ずつ円弧に並べる) ----------------
export interface CurveSpec { text: string; fontFamily: string; fontSize: number; fill: string; fontWeight: string | number; curve: number; charSpacing?: number }

function measure(ch: string, spec: CurveSpec) {
  const c = (measure as any).ctx ?? ((measure as any).ctx = document.createElement('canvas').getContext('2d'))
  c.font = `${spec.fontWeight} ${spec.fontSize}px "${spec.fontFamily}"`
  return c.measureText(ch).width + ((spec.charSpacing ?? 0) / 1000) * spec.fontSize
}

/** curve: -100〜100。正で上向きの弧(笑顔の逆)、負で下向きの弧 */
export function makeCurvedText(spec: CurveSpec): Group {
  const chars = Array.from(spec.text)
  const widths = chars.map((ch) => measure(ch, spec))
  const total = widths.reduce((a, b) => a + b, 0) || 1
  const amt = Math.max(-100, Math.min(100, spec.curve)) / 100
  const theta = Math.max(0.05, Math.abs(amt) * Math.PI * 1.9) // 弧の角度(最大でほぼ一周)
  const r = total / theta
  const dir = amt >= 0 ? 1 : -1
  let acc = 0
  const objs = chars.map((ch, i) => {
    const mid = acc + widths[i] / 2
    acc += widths[i]
    const a = (mid / total - 0.5) * theta // 中央が 0
    const x = r * Math.sin(a)
    const y = dir > 0 ? -r * Math.cos(a) : r * Math.cos(a)
    return new FabricText(ch, {
      left: x, top: y, originX: 'center', originY: 'center', angle: (a * 180) / Math.PI * dir,
      fontFamily: spec.fontFamily, fontSize: spec.fontSize, fill: spec.fill, fontWeight: spec.fontWeight,
    })
  })
  const g = new Group(objs, { objectCaching: false })
  ;(g as any).curved = spec
  ;(g as any).name = '曲線テキスト'
  return g
}
