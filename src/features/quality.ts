// デザインの自動チェック。ページ JSON だけを読む純粋な関数(画面・fabric に依存しない)ので、AI エージェント(MCP)からも使える。
// 文字の大きさ・位置は保存時の width/height/scale/left/top から見積もる(再レイアウトはしない)
import type { DesignDoc } from '../editor/types'
import { parseColor } from './replace'

export type Severity = 'error' | 'warn' | 'info'
/**
 * page: 1 始まり(0 は文書全体)、index: そのページの objects の 0 始まり(-1 はページ全体)。
 * fix.props は update_object / obj.set にそのまま渡せるプロパティ
 */
export interface Issue { page: number; index: number; severity: Severity; message: string; fix?: { props: Record<string, any> } }

const isText = (o: any) => o?.type === 'Textbox' || o?.type === 'Text' || o?.type === 'IText' || o?.type === 'VText'
const isImage = (o: any) => o?.type === 'Image'
const num = (v: any, d: number) => (typeof v === 'number' && isFinite(v) ? v : d)

interface Box { x: number; y: number; w: number; h: number }
/** 回転・原点を考慮した外接矩形(ページ座標) */
function bbox(o: any): Box {
  const w = num(o.width, 0) * num(o.scaleX, 1), h = num(o.height, 0) * num(o.scaleY, 1)
  const ox = o.originX === 'center' ? 0.5 : o.originX === 'right' ? 1 : 0
  const oy = o.originY === 'center' ? 0.5 : o.originY === 'bottom' ? 1 : 0
  const a = (num(o.angle, 0) * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a)
  const px = num(o.left, 0), py = num(o.top, 0)
  const xs: number[] = [], ys: number[] = []
  for (const [dx, dy] of [[0, 0], [w, 0], [w, h], [0, h]]) {
    const lx = dx - ox * w, ly = dy - oy * h
    xs.push(px + lx * c - ly * s); ys.push(py + lx * s + ly * c)
  }
  const x = Math.min(...xs), y = Math.min(...ys)
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y }
}

const lin = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }
const lum = (c: { r: number; g: number; b: number }) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b)
/** WCAG のコントラスト比(1〜21) */
export function contrastRatio(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
type RGB = { r: number; g: number; b: number }
const over = (top: RGB, a: number, bottom: RGB): RGB => ({ r: top.r * a + bottom.r * (1 - a), g: top.g * a + bottom.g * (1 - a), b: top.b * a + bottom.b * (1 - a) })
const hex = (c: RGB) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')

/** 塗りが単色なら { color, alpha }、グラデーションなら各色の配列(最悪値で判定する) */
function solids(fill: any): { c: RGB; a: number }[] | null {
  if (typeof fill === 'string') { const p = parseColor(fill); return p && p.a > 0 ? [{ c: p, a: p.a }] : null }
  if (fill && Array.isArray(fill.colorStops)) {
    const l = fill.colorStops.map((s: any) => parseColor(s.color)).filter(Boolean).map((p: any) => ({ c: p as RGB, a: (p as any).a as number }))
    return l.length ? l : null
  }
  return null
}

/** 文字の下にある背景色の候補(ページ背景 + 下に重なる図形を合成)。写真の上など判定できなければ null */
function backgroundsUnder(objs: any[], idx: number, box: Box, pageBg: any): RGB[] | null {
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2
  const layers: { s: { c: RGB; a: number }[]; op: number }[] = []
  for (let i = idx - 1; i >= 0; i--) {
    const o = objs[i]
    if (o.visible === false || isText(o)) continue
    const b = bbox(o)
    if (cx < b.x || cx > b.x + b.w || cy < b.y || cy > b.y + b.h) continue
    if (isImage(o) || o.type === 'Group') return null
    const s = solids(o.fill)
    if (!s) continue
    layers.push({ s, op: num(o.opacity, 1) })
    if (o.opacity === undefined || o.opacity >= 0.99) if (s.every((x) => x.a >= 0.99)) break
  }
  let bases: RGB[] = (solids(pageBg) ?? [{ c: { r: 255, g: 255, b: 255 }, a: 1 }]).map((x) => x.c)
  for (let i = layers.length - 1; i >= 0; i--) {
    const { s, op } = layers[i]
    // グラデーションは「各色 × 下地」の全組み合わせを候補にする
    bases = s.flatMap((x) => bases.map((b) => over(x.c, x.a * op, b)))
  }
  return bases
}

/** デザイン全体をチェックして問題点の一覧を返す(重大な順→ページ順) */
export function checkDesign(doc: DesignDoc): Issue[] {
  const out: Issue[] = []
  const W = doc.width, H = doc.height, short = Math.min(W, H)
  const fonts = new Map<string, number>()
  const margin = Math.max(8, short * 0.02)
  const minBody = short * 0.015
  const pages = doc.pages ?? []

  pages.forEach((pg, pi) => {
    const page = pi + 1
    const json = pg.json ?? {}
    const objs: any[] = Array.isArray(json.objects) ? json.objects : []
    const live = objs.filter((o) => o.visible !== false)
    if (!live.length) { out.push({ page, index: -1, severity: 'error', message: 'このページは空です(何も置かれていません)' }); return }

    objs.forEach((o, index) => {
      if (o.visible === false) return
      const b = bbox(o)
      const label = isText(o) ? `文字「${String(o.text ?? '').replace(/\n/g, ' ').slice(0, 12)}」` : isImage(o) ? '画像' : `${o.name || o.type}`
      const bleed = b.w >= W * 0.9 && b.h >= H * 0.9 // 背景として全面に敷いたもの
      if (isText(o)) fonts.set(String(o.fontFamily ?? '').replace(/^["']|["']$/g, ''), (fonts.get(String(o.fontFamily ?? '')) ?? 0) + 1)

      // --- ページ外へのはみ出し ---
      const dl = Math.max(0, -b.x), dr = Math.max(0, b.x + b.w - W), dt = Math.max(0, -b.y), db = Math.max(0, b.y + b.h - H)
      const outside = dl + dr + dt + db
      if (outside > 2 && !bleed) {
        const fullyOut = b.x >= W || b.y >= H || b.x + b.w <= 0 || b.y + b.h <= 0
        if (isText(o)) {
          // ページ内に収まるよう動かす(ページより大きければ左上に寄せる)
          const nx = b.w > W ? 0 : Math.min(Math.max(b.x, 0), W - b.w), ny = b.h > H ? 0 : Math.min(Math.max(b.y, 0), H - b.h)
          out.push({ page, index, severity: 'error', message: `${label}がページの外にはみ出しています(${Math.round(outside)}px)`, fix: { props: { left: num(o.left, 0) + (nx - b.x), top: num(o.top, 0) + (ny - b.y) } } })
        } else if (fullyOut) {
          out.push({ page, index, severity: 'warn', message: `${label}がページの外にあり、見えません` })
        } else if (outside > Math.min(b.w, b.h) * 0.5) {
          out.push({ page, index, severity: 'info', message: `${label}の大部分がページの外にはみ出しています(装飾なら問題ありません)` })
        }
      }

      if (isText(o)) {
        const fs = num(o.fontSize, 16) * num(o.scaleY, 1)
        // --- 小さすぎる文字 ---
        if (fs < minBody) {
          const want = Math.ceil(short * 0.02)
          out.push({ page, index, severity: fs < minBody * 0.7 ? 'error' : 'warn', message: `${label}が小さすぎます(${Math.round(fs)}px。ページの短辺の約1.5%未満)`, fix: { props: { fontSize: Math.round(want / num(o.scaleY, 1)) } } })
        }
        // --- 余白が狭い(ページの端すれすれ) ---
        if (outside <= 2 && !bleed) {
          const gaps = [b.x, b.y, W - (b.x + b.w), H - (b.y + b.h)]
          if (gaps.some((g) => g < margin)) out.push({ page, index, severity: 'warn', message: `${label}がページの端に近すぎます(余白 ${Math.round(Math.min(...gaps))}px。目安 ${Math.round(margin)}px 以上)` })
        }
        // --- 文字と背景のコントラスト ---
        const fg = solids(o.fill)
        // 大きくて短い飾り文字(薄い背景番号「01」や大きな引用符など)は読ませる文字ではないので対象外
        const plain = String(o.text ?? '').replace(/\s/g, '')
        const decorative = Array.from(plain).length <= 3 && fs >= Math.min(W, H) * 0.08
        if (fg && !decorative) {
          const bgs = backgroundsUnder(objs, index, b, json.background ?? json.backgroundColor)
          if (bgs) {
            const alpha = num(o.opacity, 1)
            const large = fs >= 24 || (fs >= 18.66 && (o.fontWeight === 'bold' || num(o.fontWeight, 400) >= 700))
            const need = large ? 3 : 4.5
            let worst = Infinity, bad: { fg: RGB; bg: RGB } | null = null
            for (const f of fg) for (const bg of bgs) {
              const fc = over(f.c, f.a * alpha, bg)
              const r = contrastRatio(fc, bg)
              if (r < worst) { worst = r; bad = { fg: fc, bg } }
            }
            if (bad && worst < need) {
              const dark = lum(bad.bg) > 0.4
              out.push({ page, index, severity: worst < 2 ? 'error' : 'warn', message: `${label}と背景のコントラストが不足しています(比 ${worst.toFixed(1)}。目安 ${need} 以上。文字 ${hex(bad.fg)} / 背景 ${hex(bad.bg)})`, fix: { props: { fill: dark ? '#111827' : '#ffffff', opacity: 1 } } })
            }
          }
        }
      }

      // --- 画像の解像度不足 ---
      if (isImage(o)) {
        const k = Math.max(num(o.scaleX, 1), num(o.scaleY, 1)) // 元画像の何倍に引き伸ばしているか
        if (k > 1.5) out.push({ page, index, severity: k > 3 ? 'error' : 'warn', message: `画像が元の大きさの ${k.toFixed(1)} 倍に拡大されており、ぼやける可能性があります` })
        else if (doc.print && doc.print.mmW) {
          const dpi = (num(o.width, 0) * 25.4) / ((b.w / W) * doc.print.mmW)
          if (dpi > 0 && dpi < 150) out.push({ page, index, severity: 'warn', message: `印刷すると画像の解像度が約 ${Math.round(dpi)}dpi しかありません(目安 150〜300dpi)` })
        }
      }
    })
  })

  // --- フォントの種類が多すぎる ---
  const fam = [...fonts.keys()].filter(Boolean)
  if (fam.length > 3) out.push({ page: 0, index: -1, severity: 'warn', message: `使っているフォントが ${fam.length} 種類あります(${fam.slice(0, 6).join('、')}${fam.length > 6 ? ' ほか' : ''})。3 種類以内にすると統一感が出ます` })

  const rank: Record<Severity, number> = { error: 0, warn: 1, info: 2 }
  return out.sort((a, b) => rank[a.severity] - rank[b.severity] || a.page - b.page || a.index - b.index)
}
