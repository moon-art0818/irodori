// PowerPoint(.pptx)書き出し。pptxgenjs(MIT)を使う。
// 方式: 文字(Textbox)は編集できる文字に、Rect / Circle / Ellipse は編集できる図形にし、
// それ以外(画像・パス・グループ・縦書き・影やグラデーション付きの図形など)は1つずつ PNG にして画像として重ねる。重なり順は保つ。
import PptxGenJS from 'pptxgenjs'
import { StaticCanvas, type FabricObject } from 'fabric'
import { resolveAssets } from '../editor/assets'
import { ensureFonts } from '../editor/core'
import type { DesignDoc } from '../editor/types'
import { normalizeColor, parseColor } from './replace'

const PX = 1 / 96 // px → インチ
const num = (v: any, d: number) => (typeof v === 'number' && isFinite(v) ? v : d)
const hex6 = (c: unknown) => normalizeColor(c)?.slice(1).toUpperCase()

/** 回転・原点を考慮して、図形の「回転前の左上」(x, y)を求める(PowerPoint は中心基準で回転するため) */
function place(o: any, w: number, h: number) {
  const ox = o.originX === 'center' ? 0.5 : o.originX === 'right' ? 1 : 0
  const oy = o.originY === 'center' ? 0.5 : o.originY === 'bottom' ? 1 : 0
  const a = (num(o.angle, 0) * Math.PI) / 180
  const dx = (0.5 - ox) * w, dy = (0.5 - oy) * h
  const cx = num(o.left, 0) + dx * Math.cos(a) - dy * Math.sin(a)
  const cy = num(o.top, 0) + dx * Math.sin(a) + dy * Math.cos(a)
  return { x: cx - w / 2, y: cy - h / 2, rotate: num(o.angle, 0) }
}

const solidFill = (f: unknown) => (typeof f === 'string' && parseColor(f) && parseColor(f)!.a > 0 ? f : null)
/** 編集可能な部品にできない見た目(影・グラデーション・切り抜き・合成・傾き)を持つか */
const needsRaster = (o: any) => !!(o.shadow || o.clipPath || o.skewX || o.skewY || (o.globalCompositeOperation && o.globalCompositeOperation !== 'source-over') || o.frame)

function addText(slide: PptxGenJS.Slide, o: any) {
  const sx = num(o.scaleX, 1), sy = num(o.scaleY, 1)
  const w = num(o.width, 100) * sx, h = num(o.height, 40) * sy
  const fs = num(o.fontSize, 16) * sy
  const f = typeof o.fill === 'string' ? o.fill : o.fill?.colorStops?.[0]?.color
  const p = place(o, w, h)
  const pv = parseColor(f)
  const opacity = num(o.opacity, 1) * (pv?.a ?? 1)
  const bold = o.fontWeight === 'bold' || num(o.fontWeight, 400) >= 600
  const align = ({ left: 'left', center: 'center', right: 'right', justify: 'justify' } as const)[o.textAlign as 'left'] ?? 'left'
  slide.addText(String(o.text ?? ''), {
    x: p.x * PX, y: p.y * PX, w: w * PX, h: h * PX, rotate: p.rotate,
    fontFace: String(o.fontFamily ?? 'Noto Sans JP').replace(/^["']|["']$/g, ''), fontSize: Math.max(1, Math.round(fs * 0.75 * 10) / 10),
    color: hex6(f) ?? '000000', transparency: opacity < 1 ? Math.round((1 - opacity) * 100) : undefined,
    bold, italic: o.fontStyle === 'italic', underline: o.underline ? { style: 'sng' } : undefined, strike: o.linethrough ? 'sngStrike' : undefined,
    align, valign: 'top', margin: 0, wrap: true, fit: 'none',
    lineSpacingMultiple: Math.min(3, Math.max(0.5, (num(o.lineHeight, 1.16) * 1.13) / 1.2)),
    charSpacing: o.charSpacing ? (num(o.charSpacing, 0) / 1000) * fs * 0.75 : undefined,
    paraSpaceBefore: 0, paraSpaceAfter: 0,
  })
}

function addShape(pptx: PptxGenJS, slide: PptxGenJS.Slide, o: any) {
  const sx = num(o.scaleX, 1), sy = num(o.scaleY, 1)
  let w: number, h: number, type = pptx.ShapeType.rect
  const opts: any = {}
  if (o.type === 'Circle') { w = num(o.radius, 0) * 2 * sx; h = num(o.radius, 0) * 2 * sy; type = pptx.ShapeType.ellipse }
  else if (o.type === 'Ellipse') { w = num(o.rx, 0) * 2 * sx; h = num(o.ry, 0) * 2 * sy; type = pptx.ShapeType.ellipse }
  else {
    w = num(o.width, 0) * sx; h = num(o.height, 0) * sy
    if (num(o.rx, 0) > 0) { type = pptx.ShapeType.roundRect; opts.rectRadius = Math.min(num(o.rx, 0) * sx, Math.min(w, h) / 2) * PX }
  }
  const p = place(o, w, h)
  const a = num(o.opacity, 1) * (parseColor(o.fill)?.a ?? 1)
  const fill = solidFill(o.fill)
  if (fill) opts.fill = { color: hex6(fill), transparency: a < 1 ? Math.round((1 - a) * 100) : 0 }
  else opts.fill = { type: 'none' }
  if (hex6(o.stroke) && num(o.strokeWidth, 0) > 0) opts.line = { color: hex6(o.stroke), width: num(o.strokeWidth, 0) * 0.75 * Math.min(sx, sy) }
  slide.addShape(type, { x: p.x * PX, y: p.y * PX, w: w * PX, h: h * PX, rotate: p.rotate, ...opts })
}

/** 1枚のページを PNG にするための準備(個別オブジェクトの画像化・背景の画像化) */
class Rasterizer {
  private sc: StaticCanvas
  private W: number
  private H: number
  constructor(sc: StaticCanvas, W: number, H: number) { this.sc = sc; this.W = W; this.H = H }
  static async create(json: any, W: number, H: number) {
    const sc = new StaticCanvas(document.createElement('canvas'), { width: W, height: H, enableRetinaScaling: false, renderOnAddRemove: false })
    await ensureFonts(json)
    await sc.loadFromJSON(await resolveAssets(json))
    return new Rasterizer(sc, W, H)
  }
  private only(keep: number | null) { this.sc.getObjects().forEach((o, i) => { o.visible = i === keep && (o as any).__vis !== false }) }
  /** ページの背景だけ(オブジェクトは全部隠す)を PNG にする */
  background(): string {
    this.only(null)
    this.sc.renderAll()
    return this.sc.toDataURL({ format: 'png', multiplier: 1 })
  }
  /** i 番目のオブジェクトだけを透明背景で切り出す。ページ外は切り捨て。{ data, x, y, w, h }(px) */
  object(i: number) {
    const sc = this.sc, o: FabricObject = sc.getObjects()[i]
    const bg = sc.backgroundColor, bgi = sc.backgroundImage
    sc.backgroundColor = ''; sc.backgroundImage = undefined
    const pad = 4 + (o.shadow ? Math.abs((o.shadow as any).blur ?? 0) * 2 + Math.abs((o.shadow as any).offsetX ?? 0) + Math.abs((o.shadow as any).offsetY ?? 0) : 0)
    const r = o.getBoundingRect()
    const x = Math.max(0, Math.floor(r.left - pad)), y = Math.max(0, Math.floor(r.top - pad))
    const x2 = Math.min(this.W, Math.ceil(r.left + r.width + pad)), y2 = Math.min(this.H, Math.ceil(r.top + r.height + pad))
    const w = x2 - x, h = y2 - y
    try {
      if (w < 1 || h < 1) return null
      this.only(i)
      sc.renderAll()
      const m = Math.min(2, Math.sqrt(4_000_000 / (w * h)))
      return { data: sc.toDataURL({ format: 'png', left: x, top: y, width: w, height: h, multiplier: m }), x, y, w, h }
    } finally { sc.backgroundColor = bg; sc.backgroundImage = bgi }
  }
  dispose() { this.sc.dispose() }
}

/**
 * デザインを .pptx(Blob)にする。スライドの大きさはページの大きさ(96dpi 換算)。
 * 文字は編集可能(フォント・サイズ・色・太字・斜体・揃え・位置・回転)、四角・円・楕円は編集可能な図形、
 * それ以外は1つずつ画像になる。文字ごとの色違い(部分スタイル)・文字の影や縁取りは反映されない。
 * フォントは開く側の PC に入っていないと代替される。HTML スライド(deck)は非対応
 */
export async function exportPPTX(doc: DesignDoc): Promise<Blob> {
  if (doc.deck) throw new Error('HTML スライドは PowerPoint に書き出せません')
  const pptx = new PptxGenJS()
  pptx.defineLayout({ name: 'IRODORI', width: doc.width * PX, height: doc.height * PX })
  pptx.layout = 'IRODORI'
  pptx.title = doc.name
  for (const pg of doc.pages) {
    const slide = pptx.addSlide()
    const json = pg.json ?? { objects: [] }
    const objs: any[] = json.objects ?? []
    const ras = await Rasterizer.create(json, doc.width, doc.height)
    try {
      // 背景: 単色なら塗り、グラデーション等は画像にする
      const bg = json.background
      if (typeof bg === 'string' && hex6(bg)) slide.background = { color: hex6(bg)! }
      else if (bg) slide.background = { data: ras.background() }
      else slide.background = { color: 'FFFFFF' }
      objs.forEach((o, i) => {
        if (o.visible === false) return
        const grad = o.fill && typeof o.fill === 'object'
        if (o.type === 'Textbox' && !grad && !o.vertical) return addText(slide, o)
        if ((o.type === 'Rect' || o.type === 'Circle' || o.type === 'Ellipse') && !grad && !needsRaster(o)) return addShape(pptx, slide, o)
        const r = ras.object(i)
        if (r) slide.addImage({ data: r.data, x: r.x * PX, y: r.y * PX, w: r.w * PX, h: r.h * PX })
      })
    } finally { ras.dispose() }
  }
  const out = await pptx.write({ outputType: 'blob' })
  return out as Blob
}
