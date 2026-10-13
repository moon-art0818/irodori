// 全ページの色・フォントを一覧し、まとめて置き換える。対象はページ JSON(canvas.toObject() の形)。
// グループ内・clipPath・グラデーションの colorStops・影の色・縦書きの縁・ページ背景・QR/グラフ/表の保存色も走査する
type Json = any

/** 色文字列を { r,g,b,a } にする。解釈できなければ null('transparent' も null) */
export function parseColor(c: unknown): { r: number; g: number; b: number; a: number } | null {
  if (typeof c !== 'string') return null
  const s = c.trim().toLowerCase()
  let m = /^#([0-9a-f]{3,8})$/.exec(s)
  if (m) {
    let h = m[1]
    if (h.length === 3 || h.length === 4) h = [...h].map((x) => x + x).join('')
    if (h.length !== 6 && h.length !== 8) return null
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 }
  }
  m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(s)
  if (m) return { r: Math.round(+m[1]), g: Math.round(+m[2]), b: Math.round(+m[3]), a: m[4] === undefined ? 1 : +m[4] }
  return null
}
const hex2 = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
/** 色を '#rrggbb'(小文字)にそろえる。透明度は無視。解釈できなければ null */
export function normalizeColor(c: unknown): string | null {
  const p = parseColor(c)
  return p ? `#${hex2(p.r)}${hex2(p.g)}${hex2(p.b)}` : null
}
const norm = (n: string) => n.replace(/^["']|["']$/g, '').trim()

/** 色を持つ「箇所」を全部渡して visit する。visit が新しい値を返すとその場で書き換える */
function eachColor(json: Json, visit: (value: string) => string | void) {
  const fix = (holder: any, key: string) => {
    const v = holder?.[key]
    if (typeof v === 'string') { const r = visit(v); if (typeof r === 'string') holder[key] = r }
  }
  const gradient = (g: any) => { if (g && typeof g === 'object' && Array.isArray(g.colorStops)) for (const s of g.colorStops) fix(s, 'color') }
  const paint = (o: any, key: string) => { if (o[key] && typeof o[key] === 'object') gradient(o[key]); else fix(o, key) }
  const obj = (o: any) => {
    if (!o || typeof o !== 'object') return
    for (const k of ['fill', 'stroke', 'backgroundColor', 'textBackgroundColor', 'textStroke']) paint(o, k)
    if (o.shadow && typeof o.shadow === 'object') fix(o.shadow, 'color')
    if (o.clipPath) obj(o.clipPath)
    if (o.qr) { fix(o.qr, 'color'); fix(o.qr, 'bg') }
    if (o.table) { fix(o.table, 'header'); fix(o.table, 'border') }
    if (o.chart && Array.isArray(o.chart.colors)) o.chart.colors.forEach((_: any, i: number) => fix(o.chart.colors, String(i)))
    if (o.curved) fix(o.curved, 'fill')
    // 文字ごとのスタイル(styles: { 行: { 文字: { fill, stroke } } })
    if (o.styles && typeof o.styles === 'object') {
      const rows = Array.isArray(o.styles) ? o.styles : Object.values(o.styles)
      for (const r of rows as any[]) for (const ch of Object.values(r ?? {}) as any[]) { paint(ch, 'fill'); paint(ch, 'stroke'); fix(ch, 'textBackgroundColor') }
    }
    if (Array.isArray(o.objects)) o.objects.forEach(obj)
  }
  if (!json || typeof json !== 'object') return
  // ページ背景(canvas.toObject は background に色か Gradient を入れる)
  paint(json, 'background')
  paint(json, 'backgroundColor')
  if (json.backgroundImage) obj(json.backgroundImage)
  if (Array.isArray(json.objects)) json.objects.forEach(obj)
}

const asList = (x: Json | Json[]): Json[] => (Array.isArray(x) ? x : [x])

/** ページ(または複数ページ)で使われている色と使用箇所数。多い順。'#rrggbb' にそろえて数える */
export function listColors(json: Json | Json[]): { color: string; count: number }[] {
  const m = new Map<string, number>()
  for (const p of asList(json)) eachColor(p, (v) => { const n = normalizeColor(v); if (n && (parseColor(v)!.a > 0)) m.set(n, (m.get(n) ?? 0) + 1) })
  return [...m.entries()].map(([color, count]) => ({ color, count })).sort((a, b) => b.count - a.count)
}

/**
 * 全ページの色 from を to に置き換える(ページ JSON を直接書き換える。戻り値は置換した箇所数)。
 * 透明度付きの色(影の rgba など)は透明度を保つ。from/to は #rgb / #rrggbb / rgb() どれでも可
 */
export function replaceColor(pagesJson: Json[], from: string, to: string): number {
  const f = normalizeColor(from), t = parseColor(to)
  if (!f || !t) return 0
  let n = 0
  for (const p of pagesJson) eachColor(p, (v) => {
    if (normalizeColor(v) !== f) return
    const a = parseColor(v)!.a
    n++
    return a < 1 ? `rgba(${t.r},${t.g},${t.b},${+a.toFixed(3)})` : `#${hex2(t.r)}${hex2(t.g)}${hex2(t.b)}`
  })
  return n
}

function eachFont(json: Json, visit: (family: string) => string | void) {
  const obj = (o: any) => {
    if (!o || typeof o !== 'object') return
    if (typeof o.fontFamily === 'string') { const r = visit(o.fontFamily); if (typeof r === 'string') o.fontFamily = r }
    if (o.curved && typeof o.curved.fontFamily === 'string') { const r = visit(o.curved.fontFamily); if (typeof r === 'string') o.curved.fontFamily = r }
    if (o.styles && typeof o.styles === 'object') {
      const rows = Array.isArray(o.styles) ? o.styles : Object.values(o.styles)
      for (const r of rows as any[]) for (const ch of Object.values(r ?? {}) as any[]) if (typeof ch?.fontFamily === 'string') { const x = visit(ch.fontFamily); if (typeof x === 'string') ch.fontFamily = x }
    }
    if (Array.isArray(o.objects)) o.objects.forEach(obj)
  }
  if (json && Array.isArray(json.objects)) json.objects.forEach(obj)
}

/** ページ(または複数ページ)で使われているフォントと使用箇所数。多い順 */
export function listFonts(json: Json | Json[]): { font: string; count: number }[] {
  const m = new Map<string, number>()
  for (const p of asList(json)) eachFont(p, (f) => { const k = norm(f); m.set(k, (m.get(k) ?? 0) + 1) })
  return [...m.entries()].map(([font, count]) => ({ font, count })).sort((a, b) => b.count - a.count)
}

/** 全ページのフォント from を to に置き換える(ページ JSON を直接書き換える。戻り値は置換した箇所数)。呼び出し後にフォントの読み込みが必要 */
export function replaceFont(pagesJson: Json[], from: string, to: string): number {
  const f = norm(from)
  let n = 0
  for (const p of pagesJson) eachFont(p, (v) => { if (norm(v) !== f) return; n++; return to })
  return n
}
