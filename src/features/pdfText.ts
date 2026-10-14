// PDF の文字片(pdf.js の getTextContent)を、編集できるテキストボックス(Textbox / 縦書きは VText)の JSON にする。
// 座標はすべて「デザイン上の px」。呼び出し側(pdfImport.ts)が PDF の座標をここへ換算して渡す。

/** 1つの文字片(換算済み)。y は文字の基準線(ベースライン)、x は書き出しの位置 */
export interface PItem {
  str: string
  x: number; y: number; w: number; fs: number
  angle: number // 度。時計回りが正(fabric と同じ)
  serif: boolean; weight: number; italic: boolean; color: string
  vertical: boolean
  cjk: boolean
  /** キャンバス px での文字サイズと、文字が占める面積(太さの推定用)。太さが PDF から分からない文字片のみ */
  fsC?: number; cov?: number; weightUnknown?: boolean
}

interface Line { items: PItem[]; text: string; x: number; y: number; w: number; fs: number; key: string; item: PItem }

const CJK = /[　-ヿ㐀-鿿豈-﫿＀-￯]/

/** PDF のフォント名から irodori の書体・太さ・斜体を選ぶ */
export function pickFont(fontName: string, cssFamily: string, isBold: boolean, isItalic: boolean, isSerifHint: boolean | undefined, text: string) {
  const n = `${fontName} ${cssFamily}`.toLowerCase().replace(/^[a-z]{6}\+/, '')
  const sans = /sans|gothic|ゴシック|kaku|arial|helvetica|meiryo|メイリオ|verdana|calibri|segoe|roboto|inter\b|\bw\d\b|maru|丸/.test(n)
  const serifName = /mincho|明朝|ming|song|serif|times|garamond|georgia|palatino|bookman|cambria|ryumin|yumin|游明朝|shippori|batang|\bmin[-_ ]?\d?\b|-min\b/.test(n)
  const serif = serifName && !/sans[-_ ]?serif/.test(n) && !sans ? true : (!sans && isSerifHint === true && !/gothic|ゴシック/.test(n))
  const black = /black|heavy|ultra|extrabold|extra-bold|\bw[89]\b|-w[89]\b/.test(n)
  const bold = isBold || black || /bold|semibold|demi|\bw[67]\b|-w[67]\b|太|ブラック|ボールド/.test(n)
  const weight = black ? 900 : bold ? 700 : 400
  const italic = isItalic || /italic|oblique|斜/.test(n)
  const cjk = CJK.test(text)
  return { serif, weight, italic, cjk }
}

const hex = (r: number, g: number, b: number) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
const rgbOf = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))
const colorDist = (a: string, b: string) => { const p = rgbOf(a), q = rgbOf(b); return Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]) }
export { hex }

const styleKey = (i: PItem) => `${i.weight}|${i.italic ? 1 : 0}`
/** 書体は行・段落の中の文字片から決める(日本語を含めば日本語書体、一つでも明朝と分かれば明朝) */
const familyOf = (items: PItem[]) => { const cjk = items.some((i) => i.cjk), serif = items.some((i) => i.serif); return cjk ? (serif ? 'Noto Serif JP' : 'Noto Sans JP') : (serif ? 'Noto Serif JP' : 'Inter') }
const sameStyle = (a: { key: string; fs: number; item: PItem }, b: PItem) =>
  (a.key === styleKey(b) || (a.item.weightUnknown && b.weightUnknown && a.key.split('|')[1] === styleKey(b).split('|')[1])) &&
  Math.abs(a.fs - b.fs) <= Math.max(0.6, a.fs * 0.08) && colorDist(a.item.color, b.color) <= 140

/** 横書きの文字片を行にまとめる(同じ基準線・近い・同じ書体と色) */
function buildLines(items: PItem[]): Line[] {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x)
  const lines: Line[] = []
  for (const it of sorted) {
    let best: Line | null = null, bestGap = Infinity
    for (const l of lines) {
      if (!sameStyle(l, it)) continue
      if (Math.abs(l.y - it.y) > it.fs * 0.3) continue
      const gap = it.x - (l.x + l.w)
      if (gap < -it.fs * 0.5 || gap > it.fs * 2.5) continue
      if (gap < bestGap) { best = l; bestGap = gap }
    }
    if (best) {
      const gap = it.x - (best.x + best.w)
      const prevCh = best.text.slice(-1), nextCh = it.str[0] ?? ''
      const needSpace = gap > it.fs * 0.15 && !CJK.test(prevCh) && !CJK.test(nextCh) && !/\s$/.test(best.text) && !/^\s/.test(it.str)
      best.text += (needSpace ? ' ' : '') + it.str
      best.items.push(it)
      best.w = Math.max(best.w, it.x + it.w - best.x)
    } else {
      lines.push({ items: [it], text: it.str, x: it.x, y: it.y, w: it.w, fs: it.fs, key: styleKey(it), item: it })
    }
  }
  for (const l of lines) l.text = l.text.replace(/[  ]{2,}/g, ' ').replace(/^\s+|\s+$/g, '')
  return lines.filter((l) => l.text)
}

interface Para { lines: Line[]; align: 'left' | 'center' | 'right' | null; maxW: number }

/** 行を段落にまとめる(安全側: 同じ書体・揃い・行間が一定のときだけ) */
function buildParas(lines: Line[]): Para[] {
  const sorted = [...lines].sort((a, b) => a.y - b.y || a.x - b.x)
  const paras: Para[] = []
  for (const l of sorted) {
    let target: Para | null = null
    for (let i = paras.length - 1; i >= 0 && i >= paras.length - 12; i--) {
      const p = paras[i], last = p.lines[p.lines.length - 1]
      if (!sameStyle(last, l.item)) continue
      const pitch = l.y - last.y
      if (pitch < l.fs * 0.95 || pitch > l.fs * 1.9) continue
      if (p.lines.length >= 2) {
        const prev = p.lines[p.lines.length - 2]
        if (Math.abs(pitch - (last.y - prev.y)) > l.fs * 0.15) continue
      }
      // 直前の行が短い = そこで段落が終わっている
      if (last.w < p.maxW - l.fs * 3) continue
      const tol = l.fs * 0.35
      const okLeft = Math.abs(l.x - last.x) <= tol || (p.lines.length === 1 && l.x - last.x <= tol && last.x - l.x <= l.fs * 1.3)
      const okCenter = Math.abs((l.x + l.w / 2) - (last.x + last.w / 2)) <= tol
      const okRight = Math.abs((l.x + l.w) - (last.x + last.w)) <= tol
      let al: Para['align'] = null
      if (p.align) al = (p.align === 'left' && okLeft) || (p.align === 'center' && okCenter) || (p.align === 'right' && okRight) ? p.align : null
      else al = okLeft ? 'left' : okCenter ? 'center' : okRight ? 'right' : null
      if (!al) continue
      p.align = al
      target = p
      break
    }
    if (target) { target.lines.push(l); target.maxW = Math.max(target.maxW, l.w) }
    else paras.push({ lines: [l], align: null, maxW: l.w })
  }
  return paras
}

/** 1文字ずつ縦に並んだ文字片(縦書き)を列として取り出す。残りの文字片と、列(上から順の文字片)を返す */
function pullColumns(items: PItem[]): { rest: PItem[]; cols: PItem[][] } {
  const single = items.filter((i) => !i.vertical && i.angle === 0 && Array.from(i.str.trim()).length === 1)
  const used = new Set<PItem>()
  const cols: PItem[][] = []
  const pool = [...single].sort((a, b) => a.x - b.x || a.y - b.y)
  for (const s of pool) {
    if (used.has(s)) continue
    const cx = s.x + s.w / 2
    const mates = pool.filter((o) => !used.has(o) && Math.abs(o.x + o.w / 2 - cx) <= s.fs * 0.3 && Math.abs(o.fs - s.fs) <= s.fs * 0.08).sort((a, b) => a.y - b.y)
    let chain: PItem[] = []
    const flush = () => { if (chain.length >= 3) { cols.push(chain); chain.forEach((c) => used.add(c)) } chain = [] }
    for (const m of mates) {
      const prev = chain[chain.length - 1]
      if (!prev) { chain = [m]; continue }
      const dy = m.y - prev.y
      if (dy >= s.fs * 0.8 && dy <= s.fs * 1.7) chain.push(m)
      else { flush(); chain = [m] }
    }
    flush()
  }
  return { rest: items.filter((i) => !used.has(i)), cols }
}

const BASE = 0.879 // fabric の Textbox: 1行目の基準線 = 上端 + fontSize * 0.879
const dp = (n: number) => Math.round(n * 100) / 100

/** 文字の幅を実測して字間を合わせるための関数(フォントが読み込めていれば) */
export type Measure = (text: string, family: string, weight: number, italic: boolean, fs: number) => number | null
/** 文字が占める面積(キャンバス px²): 太さの推定用 */
export type AreaOf = (text: string, family: string, weight: number, fsC: number) => number

export function buildTextObjects(items: PItem[], measure: Measure, area?: AreaOf): any[] {
  const out: any[] = []
  const texts = items.filter((i) => i.str.trim() !== '')
  const horiz = texts.filter((i) => !i.vertical)
  // 縦書き(pdf.js が縦書きフォントと判定したもの)
  for (const v of texts.filter((i) => i.vertical)) {
    const chars = Array.from(v.str.trim())
    const pitch = v.fs
    out.push(vtextJson(chars.join(''), v.x + v.fs / 2, v.y, v.fs, pitch, v))
  }
  const { rest, cols } = pullColumns(horiz)
  for (const col of cols) {
    const first = col[0]
    const pitch = (col[col.length - 1].y - first.y) / (col.length - 1)
    const cx = first.x + first.w / 2
    out.push(vtextJson(col.map((c) => c.str.trim()).join(''), cx, first.y, first.fs, pitch, first))
  }
  // 回転した文字は1片ずつ、それ以外は行 → 段落
  const rotated = rest.filter((i) => Math.abs(i.angle) > 1)
  for (const r of rotated) out.push(textboxJson([{ items: [r], text: r.str.trim(), x: r.x, y: r.y, w: r.w, fs: r.fs, key: styleKey(r), item: r }], 'left', r.angle, measure, area))
  const flat = rest.filter((i) => Math.abs(i.angle) <= 1)
  for (const p of buildParas(buildLines(flat))) out.push(textboxJson(p.lines, p.align ?? 'left', 0, measure, area))
  return out.filter(Boolean)
}

function vtextJson(text: string, cx: number, baseY: number, fs: number, pitch: number, it: PItem) {
  const cell = Math.max(fs * 0.9, pitch)
  const center = baseY - fs * 0.38 // 日本語の字面の中心は基準線の少し上
  return {
    type: 'VText', version: '7.4.0', name: text.slice(0, 20), text, fontFamily: familyOf([it]), fontSize: dp(fs), fontWeight: it.weight, fontStyle: it.italic ? 'italic' : 'normal',
    fill: it.color, maxChars: Array.from(text).length + 2, lineHeight: 1, charSpacing: dp(cell / fs - 1),
    left: dp(cx - fs / 2), top: dp(center - cell / 2), originX: 'left', originY: 'top', textStroke: null, textStrokeWidth: 0,
  }
}

function textboxJson(lines: Line[], align: 'left' | 'center' | 'right', angle: number, measure: Measure, area?: AreaOf) {
  const first = lines[0]
  const fs = lines.reduce((a, l) => a + l.fs, 0) / lines.length
  const it = lines.flatMap((l) => l.items).reduce((a, i) => (i.str.length > a.str.length ? i : a))
  const allItems = lines.flatMap((l) => l.items)
  const family = familyOf(allItems)
  // 太さが PDF から分からない(Type3 フォント)ときは、書体の標準・太字で文字の面積を比べ、近いほうにする
  let weight = it.weight
  if (area && allItems.every((i) => i.weightUnknown && i.cov && i.fsC)) {
    const cov = allItems.reduce((a, i) => a + (i.cov ?? 0), 0)
    const a4 = allItems.reduce((a, i) => a + area(i.str, family, 400, i.fsC!), 0), a7 = allItems.reduce((a, i) => a + area(i.str, family, 700, i.fsC!), 0)
    weight = a7 > a4 * 1.08 && Math.abs(cov - a7) < Math.abs(cov - a4) ? 700 : 400
  }
  // 字間: 元の幅と実測の幅の差から(いちばん長い行で)
  const longest = lines.reduce((a, l) => (l.w > a.w ? l : a), lines[0])
  const nCh = Array.from(longest.text).length
  const m = measure(longest.text, family, weight, it.italic, fs)
  let spacing = 0
  if (m != null && nCh > 1) spacing = Math.max(-80, Math.min(250, Math.round(((longest.w - m) / nCh / fs) * 1000)))
  const widthOf = (l: Line) => {
    const mm = measure(l.text, family, weight, it.italic, fs)
    return Math.max(l.w, mm != null ? mm + (spacing / 1000) * fs * Array.from(l.text).length : 0)
  }
  const maxW = Math.max(...lines.map(widthOf))
  const W = Math.max(fs, maxW * 1.06 + fs * 0.5)
  const minX = Math.min(...lines.map((l) => l.x))
  const left = align === 'left' ? minX : align === 'center' ? (first.x + first.w / 2) - W / 2 : (first.x + first.w) - W
  let text = lines.map((l) => l.text).join('\n')
  // 字下げ(1行目だけ右にずれている日本語の段落)
  if (align === 'left' && lines.length > 1 && it.cjk) {
    const ind = Math.round((first.x - Math.min(...lines.slice(1).map((l) => l.x))) / fs)
    if (ind >= 1 && ind <= 3) text = '　'.repeat(ind) + text
  }
  const pitch = lines.length > 1 ? (lines[lines.length - 1].y - first.y) / (lines.length - 1) : fs * 1.2
  const lineHeight = Math.max(0.8, Math.min(3, pitch / (fs * 1.13)))
  const a = (angle * Math.PI) / 180
  const off = fs * BASE
  const topLeft = angle === 0 ? { x: left, y: first.y - off } : { x: first.x + off * Math.sin(a), y: first.y - off * Math.cos(a) }
  return {
    type: 'Textbox', version: '7.4.0', name: text.trim().slice(0, 20), text, fontFamily: family, fontSize: dp(fs), fontWeight: weight, fontStyle: it.italic ? 'italic' : 'normal',
    fill: it.color, textAlign: align, lineHeight: dp(lineHeight), charSpacing: spacing, splitByGrapheme: true,
    left: dp(topLeft.x), top: dp(topLeft.y), width: dp(W), originX: 'left', originY: 'top', angle: dp(angle), styles: [],
  }
}
