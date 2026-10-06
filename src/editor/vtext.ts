// 本格的な縦書きテキスト(fabric には縦書きが無いので自作)
// - 列は右→左。改行で次の列、1列の文字数(maxChars)を超えたら折り返す
// - 半角の数字1〜2桁は「縦中横」(横向きのまま1マス)。それ以外の半角英数・記号は90°回転
// - 長音・ダッシュ・波線・括弧類は90°回転、句読点は右上へ、小書きの仮名は少し右上へ寄せる
import { FabricObject, classRegistry } from 'fabric'

const ROTATE = new Set([...'ー－-―—‐〜～…‥：;:（）()「」『』【】〔〕［］[]｛｝{}〈〉《》<>＜＞=＝→←'])
const PUNCT = new Set([...'、。，．,.'])
const SMALL = new Set([...'ぁぃぅぇぉっゃゅょゎゕゖァィゥェォッャュョヮヵヶㇰㇱㇲㇳㇴㇵㇶㇷㇸㇹㇺㇻㇼㇽㇾㇿ'])
const isHalfAlnum = (c: string) => /^[\x21-\x7e]$/.test(c)

/** 1マス分の描画単位 */
interface Cell { text: string; kind: 'normal' | 'rotate' | 'punct' | 'small' | 'tcy' | 'run' }

/** 段落を「マス」に分ける(半角の連続は縦中横か回転にまとめる) */
export function toCells(para: string): Cell[] {
  const chars = Array.from(para)
  const out: Cell[] = []
  for (let i = 0; i < chars.length; ) {
    const c = chars[i]
    if (isHalfAlnum(c)) {
      let j = i
      while (j < chars.length && isHalfAlnum(chars[j])) j++
      const run = chars.slice(i, j).join('')
      if (/^\d{1,2}$/.test(run) || /^[!?]{1,2}$/.test(run)) out.push({ text: run, kind: 'tcy' })
      else if (run.length >= 3) out.push({ text: run, kind: 'run' }) // 英単語などはまとめて回転し、文字幅で詰める
      else for (const ch of run) out.push({ text: ch, kind: 'rotate' })
      i = j
      continue
    }
    out.push({ text: c, kind: ROTATE.has(c) ? 'rotate' : PUNCT.has(c) ? 'punct' : SMALL.has(c) ? 'small' : 'normal' })
    i++
  }
  return out
}

let mctx: CanvasRenderingContext2D | null = null
/** マスの送り幅(px)。英単語の塊は実測した文字幅、それ以外は1マス */
export function advanceOf(c: Cell, font: string, cell: number) {
  if (c.kind !== 'run') return cell
  mctx ??= document.createElement('canvas').getContext('2d')
  mctx!.font = font
  return Math.max(cell * 0.5, mctx!.measureText(c.text).width + cell * 0.15)
}

/** 列ごとのマス配列。1列の長さ(maxChars マス分)を超えたら折り返す(行頭禁則: 句読点・閉じ括弧は前の列に追い込む) */
export const MAX_VTEXT = 5000
export function layoutColumns(text: string, maxChars: number, font = '16px sans-serif', cell = 16): Cell[][] {
  text = String(text).slice(0, MAX_VTEXT) // 巨大な入力で固まらないよう上限を設ける
  const cols: Cell[][] = []
  const noStart = new Set([...'、。，．,.」』）)】〕］}〉》ー'])
  for (const para of String(text).split('\n')) {
    const cells = toCells(para)
    if (!cells.length) { cols.push([]); continue }
    const limit = Math.max(1, maxChars) * cell
    let col: Cell[] = [], used = 0, over = false
    for (const c of cells) {
      const adv = advanceOf(c, font, cell)
      if (col.length && used + adv > limit + 0.5) {
        // 行頭禁則: 次の列の先頭に来てはいけない文字は、1マスはみ出して前の列に入れる(1回だけ)
        if (noStart.has(c.text) && !over) { col.push(c); used += adv; over = true; continue }
        cols.push(col); col = []; used = 0; over = false
      }
      col.push(c); used += adv
    }
    cols.push(col)
  }
  return cols
}

export interface VTextProps { text: string; fontFamily: string; fontSize: number; fontWeight: string | number; fontStyle: string; maxChars: number; lineHeight: number; charSpacing: number; textStroke: string | null; textStrokeWidth: number }

export class VText extends FabricObject {
  static type = 'VText'
  static cacheProperties = [...FabricObject.cacheProperties, 'text', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'maxChars', 'lineHeight', 'charSpacing', 'textStroke', 'textStrokeWidth']
  declare text: string
  declare fontFamily: string
  declare fontSize: number
  declare fontWeight: string | number
  declare fontStyle: string
  declare maxChars: number
  declare lineHeight: number
  declare charSpacing: number
  declare textStroke: string | null
  declare textStrokeWidth: number

  constructor(options: Partial<VTextProps> & Record<string, any> = {}) {
    super()
    Object.assign(this, { text: '縦書き', fontFamily: 'Noto Serif JP', fontSize: 48, fontWeight: 400, fontStyle: 'normal', maxChars: 12, lineHeight: 1.6, charSpacing: 0.05, fill: '#1f2937', textStroke: null, textStrokeWidth: 0 })
    this.setOptions(options)
    this.initDimensions()
  }

  /** マスの大きさから全体の幅・高さを決める */
  initDimensions() {
    const cell = this.fontSize * (1 + this.charSpacing)
    const font = this.font()
    const cols = layoutColumns(this.text, this.maxChars, font, cell)
    const colW = this.fontSize * this.lineHeight
    const len = cols.reduce((m, c) => Math.max(m, c.reduce((a, x) => a + advanceOf(x, font, cell), 0)), cell)
    this.set({ width: Math.max(colW, cols.length * colW), height: len })
  }
  font() { return `${this.fontStyle ?? 'normal'} ${this.fontWeight ?? 400} ${this.fontSize}px "${this.fontFamily}"`
  }

  _set(key: string, value: any) {
    super._set(key, value)
    if (['text', 'fontSize', 'maxChars', 'lineHeight', 'charSpacing', 'fontFamily', 'fontWeight'].includes(key) && this.fontSize) this.initDimensions?.()
    return this
  }

  _render(ctx: CanvasRenderingContext2D) {
    const fs = this.fontSize
    const cell = fs * (1 + this.charSpacing)
    const colW = fs * this.lineHeight
    const font = this.font()
    const cols = layoutColumns(this.text, this.maxChars, font, cell)
    ctx.save()
    ctx.font = font
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = (this.fill as string) || '#000'
    const stroke = this.textStroke && this.textStrokeWidth > 0
    if (stroke) { ctx.strokeStyle = this.textStroke!; ctx.lineWidth = this.textStrokeWidth; ctx.lineJoin = 'round' }
    const draw = (t: string, x: number, y: number) => { if (stroke) ctx.strokeText(t, x, y); ctx.fillText(t, x, y) }
    // 原点はオブジェクトの中心。右端の列から左へ
    const left = -this.width / 2, top = -this.height / 2
    cols.forEach((col, ci) => {
      const cx = left + this.width - colW * (ci + 0.5)
      let y = top
      col.forEach((c) => {
        const adv = advanceOf(c, font, cell)
        const cy = y + adv / 2
        y += adv
        if (c.kind === 'rotate' || c.kind === 'run') {
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 2); draw(c.text, 0, 0); ctx.restore()
        } else if (c.kind === 'tcy') {
          // 縦中横: 2文字なら横に詰めて1マスに収める
          ctx.save(); ctx.translate(cx, cy)
          const w = ctx.measureText(c.text).width
          if (w > fs) ctx.scale(fs / w, 1)
          draw(c.text, 0, 0); ctx.restore()
        } else if (c.kind === 'punct') {
          draw(c.text, cx + fs * 0.6, cy - fs * 0.6)
        } else if (c.kind === 'small') {
          draw(c.text, cx + fs * 0.1, cy - fs * 0.1)
        } else {
          draw(c.text, cx, cy)
        }
      })
    })
    ctx.restore()
  }

  /** SVG 書き出し(マスごとに <text> を置く。回転・縦中横・句読点の位置は描画と同じ計算) */
  _toSVG(): string[] {
    const esc = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
    const fs = this.fontSize, cell = fs * (1 + this.charSpacing), colW = fs * this.lineHeight
    const font = this.font()
    const cols = layoutColumns(this.text, this.maxChars, font, cell)
    const left = -this.width / 2, top = -this.height / 2
    const out: string[] = []
    cols.forEach((col, ci) => {
      const cx = left + this.width - colW * (ci + 0.5)
      let y = top
      for (const c of col) {
        const adv = advanceOf(c, font, cell)
        const cy = y + adv / 2
        y += adv
        let x = cx, yy = cy, tf = ''
        if (c.kind === 'rotate' || c.kind === 'run') tf = ` transform="rotate(90 ${cx} ${cy})"`
        else if (c.kind === 'punct') { x = cx + fs * 0.6; yy = cy - fs * 0.6 }
        else if (c.kind === 'small') { x = cx + fs * 0.1; yy = cy - fs * 0.1 }
        else if (c.kind === 'tcy') tf = ` textLength="${Math.min(fs, fs * c.text.length * 0.6)}" lengthAdjust="spacingAndGlyphs"`
        out.push(`<text x="${x}" y="${yy}" text-anchor="middle" dominant-baseline="central"${tf}>${esc(c.text)}</text>\n`)
      }
    })
    const stroke = this.textStroke && this.textStrokeWidth > 0 ? ` stroke="${esc(this.textStroke)}" stroke-width="${this.textStrokeWidth}" paint-order="stroke" stroke-linejoin="round"` : ''
    return ['<g ', 'COMMON_PARTS', ` font-family="${esc(this.fontFamily)}" font-size="${fs}" font-weight="${esc(String(this.fontWeight))}" font-style="${esc(this.fontStyle)}"${stroke}>\n`, ...out, '</g>\n']
  }

  toObject(propertiesToInclude: string[] = []): any {
    return super.toObject(['text', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'maxChars', 'lineHeight', 'charSpacing', 'textStroke', 'textStrokeWidth', ...propertiesToInclude])
  }

  static fromObject(object: any) {
    const { type: _t, ...rest } = object // type は渡さない(fabric が警告を出すため)
    return Promise.resolve(new VText(rest))
  }
}
classRegistry.setClass(VText)
