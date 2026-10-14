// PDF の取り込み: pdf.js(Apache-2.0)で各ページを読み込み、ページ JSON にする。
// mode 'text'(既定): 文字を編集できるテキストボックスにし、背景には文字を描かない画像を置く
//   1) 通常描画した画像と、fillText/strokeText を無効にして描画した画像を作る(後者が背景になる)
//   2) 文字片の範囲で二つの画像の差が大きい画素の色を、文字色とする(差が無い = 文字が消せなかった片は画像に残す)
// mode 'image': 従来どおりページを画像1枚にする(文字は焼き込み)
import * as pdfjs from 'pdfjs-dist'
// Vite の ?url で worker をアセットとして配り、メインスレッドの外で動かす
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { putAsset } from '../editor/assets'
import { buildTextObjects, hex, pickFont, type AreaOf, type Measure, type PItem } from './pdfText'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

export interface ImportedPage { json: any; text: string; /** 編集できる文字にした数(テキストボックス) */ textCount: number; /** 文字が無い(スキャンなど)ページ */ scanned: boolean; /** 文字を消せず画像に残した文字片の数 */ keptInImage: number }
export interface ImportedPDF { width: number; height: number; pages: ImportedPage[] }
export type PdfImportMode = 'text' | 'image'

const toBlob = (canvas: HTMLCanvasElement) => new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('画像化に失敗しました'))), 'image/jpeg', 0.92))

/** 書体を読み込んで幅を測る関数 */
async function makeMeasure(fonts: Set<string>, sample: string): Promise<Measure> {
  const ok = new Set<string>()
  if (document.fonts) {
    await Promise.race([
      Promise.all([...fonts].map(async (f) => {
        try { await document.fonts.load(f, sample); if (document.fonts.check(f, sample)) ok.add(f) } catch { /* 読み込めない書体は字間合わせをしない */ }
      })),
      new Promise((r) => setTimeout(r, 4000)),
    ])
  }
  const ctx = document.createElement('canvas').getContext('2d')!
  return (text, family, weight, italic, fs) => {
    const probe = `${italic ? 'italic ' : ''}${weight} 32px "${family}"`
    if (!ok.has(probe)) return null
    ctx.font = `${italic ? 'italic ' : ''}${weight} ${fs}px "${family}"`
    return ctx.measureText(text).width
  }
}

/** 範囲の外周が単色なら、その色と「文字の画素」(背景との差が大きい画素: [差, r, g, b])を返す。単色でなければ null */
function eraseOnPlain(A: Uint8ClampedArray, cw: number, ch: number, x0: number, y0: number, x1: number, y1: number) {
  const ex0 = Math.max(0, x0 - 2), ey0 = Math.max(0, y0 - 2), ex1 = Math.min(cw - 1, x1 + 2), ey1 = Math.min(ch - 1, y1 + 2)
  const ring: number[][] = []
  for (let x = ex0; x <= ex1; x++) for (const y of [ey0, ey1]) { const i = (y * cw + x) * 4; ring.push([A[i], A[i + 1], A[i + 2]]) }
  for (let y = ey0; y <= ey1; y++) for (const x of [ex0, ex1]) { const i = (y * cw + x) * 4; ring.push([A[i], A[i + 1], A[i + 2]]) }
  if (ring.length < 8) return null
  const med = [0, 1, 2].map((ch2) => { const v = ring.map((p) => p[ch2]).sort((a, b) => a - b); return v[v.length >> 1] })
  const dist = (r: number, g: number, b: number) => Math.abs(r - med[0]) + Math.abs(g - med[1]) + Math.abs(b - med[2])
  if (ring.filter((p) => dist(p[0], p[1], p[2]) <= 36).length < ring.length * 0.78) return null
  const ink: [number, number, number, number][] = []
  let near = 0, all = 0
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const i = (y * cw + x) * 4, d = dist(A[i], A[i + 1], A[i + 2])
    all++
    if (d <= 36) near++
    else if (d > 120) ink.push([d, A[i], A[i + 1], A[i + 2]])
  }
  if (ink.length < 2 || near < all * 0.5) return null
  return { ink, med, rect: { x: ex0, y: ey0, w: ex1 - ex0 + 1, h: ey1 - ey0 + 1, c: `rgb(${med[0]},${med[1]},${med[2]})` } }
}

/** 文字が占める面積(キャンバス px²): 太さの推定用 */
function makeAreaOf(): AreaOf {
  const c = document.createElement('canvas'), x = c.getContext('2d', { willReadFrequently: true })!
  return (str, family, weight, fs) => {
    x.font = `${weight} ${fs}px "${family}"`
    c.width = Math.ceil(x.measureText(str).width) + 8; c.height = Math.ceil(fs * 1.6)
    x.font = `${weight} ${fs}px "${family}"`; x.textBaseline = 'alphabetic'; x.fillStyle = '#000'; x.fillText(str, 4, fs * 1.1)
    const d = x.getImageData(0, 0, c.width, c.height).data
    let s = 0
    for (let i = 3; i < d.length; i += 4) s += d[i] / 255
    return s
  }
}

/**
 * PDF ファイルを読み込み、デザインのページ配列にする。
 * 最初のページの大きさ(pt を 96dpi の px に換算)がデザインの大きさ。大きさの違うページは収まるよう中央に置く。
 * opts.maxPages(既定 100)/ opts.renderLongSide 画像化する長辺の px(既定 1800)/ opts.mode(既定 'text')
 */
export async function importPDF(
  file: File | Blob,
  onProgress?: (done: number, total: number) => void,
  opts: { maxPages?: number; renderLongSide?: number; mode?: PdfImportMode } = {},
): Promise<ImportedPDF> {
  const mode = opts.mode ?? 'text'
  const data = new Uint8Array(await file.arrayBuffer())
  const task = pdfjs.getDocument({ data })
  const doc = await task.promise
  try {
    const total = Math.min(doc.numPages, opts.maxPages ?? 100)
    const long = opts.renderLongSide ?? 1800
    const pages: ImportedPDF['pages'] = []
    let W = 0, H = 0
    for (let n = 1; n <= total; n++) {
      onProgress?.(n - 1, total)
      const page = await doc.getPage(n)
      const base = page.getViewport({ scale: 1 })
      const k = 96 / 72 // pt → px(96dpi)
      const pw = base.width * k, ph = base.height * k
      if (n === 1) { W = Math.round(pw); H = Math.round(ph) }
      const vp = page.getViewport({ scale: Math.min(4, long / Math.max(base.width, base.height)) })
      const mk = () => {
        const c = document.createElement('canvas')
        c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height)
        const x = c.getContext('2d', { willReadFrequently: true })!
        x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height)
        return { c, x }
      }
      const full = mk()
      await page.render({ canvasContext: full.x, viewport: vp, canvas: full.c }).promise
      const tc = await page.getTextContent()
      const text = tc.items.map((it: any) => ('str' in it ? it.str + (it.hasEOL ? '\n' : '') : '')).join('')
      const raw = (tc.items as any[]).filter((it) => 'str' in it && it.str.trim() !== '')

      // 最初のページの大きさに収める(はみ出さない最大の倍率で中央に)
      const fit = Math.min(W / pw, H / ph)
      const u = (pw * fit) / full.c.width // キャンバス px → デザイン px
      const ox = (W - pw * fit) / 2, oy = (H - ph * fit) / 2

      let bgCanvas = full.c
      let objects: any[] = []
      let keptInImage = 0
      let noText: ReturnType<typeof mk> | null = null
      // 文字片が多すぎるページ(地図・図面など)は、まとめる処理が重くなり固まるので画像のまま取り込む
      const MAX_TEXT_ITEMS = 3000
      if (mode === 'text' && raw.length > MAX_TEXT_ITEMS) keptInImage = raw.length
      if (mode === 'text' && raw.length && raw.length <= MAX_TEXT_ITEMS) {
        // 文字を描かない描画
        noText = mk()
        noText.x.fillText = () => {}
        noText.x.strokeText = () => {}
        await page.render({ canvasContext: noText.x, viewport: vp, canvas: noText.c }).promise
        const A = full.x.getImageData(0, 0, full.c.width, full.c.height).data
        const B = noText.x.getImageData(0, 0, full.c.width, full.c.height).data
        const cw = full.c.width, ch = full.c.height
        const items: PItem[] = []
        const erase: { x: number; y: number; w: number; h: number; c: string }[] = []
        const fontsToLoad = new Set<string>()
        let sample = ''
        for (const it0 of raw) {
          // 部首・互換漢字(⽣ ⾒ など)は通常の漢字に直す
          const it = { ...it0, str: String(it0.str).replace(/[\u2E80-\u2FDF\uF900-\uFAFF]/g, (c: string) => c.normalize('NFKC')) }
          const tx = pdfjs.Util.transform(vp.transform, it.transform)
          const fsC = Math.hypot(tx[2], tx[3])
          if (!(fsC > 1)) continue
          const ang = Math.atan2(tx[1], tx[0])
          const wC = it.width * vp.scale
          // 文字の範囲(基準線から上に 0.95em、下に 0.28em)
          const ux = Math.cos(ang), uy = Math.sin(ang), vx = Math.sin(ang), vy = -Math.cos(ang)
          const cs = [[0, -0.28], [wC, -0.28], [wC, 0.95 * fsC], [0, 0.95 * fsC]].map(([a, b]) => [tx[4] + ux * a + vx * b, tx[5] + uy * a + vy * b])
          const x0 = Math.max(0, Math.floor(Math.min(...cs.map((p) => p[0])))), x1 = Math.min(cw - 1, Math.ceil(Math.max(...cs.map((p) => p[0]))))
          const y0 = Math.max(0, Math.floor(Math.min(...cs.map((p) => p[1])))), y1 = Math.min(ch - 1, Math.ceil(Math.max(...cs.map((p) => p[1]))))
          // 差の大きい画素(= 文字) → 色
          const hit: [number, number, number, number][] = []
          for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
            const i = (yy * cw + xx) * 4
            const d = Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2])
            if (d > 120) hit.push([d, A[i], A[i + 1], A[i + 2]])
          }
          let ink = hit
          let medOf: number[] = [255, 255, 255]
          if (hit.length < 2) {
            // fillText で消えなかった文字(Chrome 出力の Type3 フォントなど): 背景が単色なら、その色で塗りつぶして消す
            const er = eraseOnPlain(A, cw, ch, x0, y0, x1, y1)
            if (!er) { keptInImage++; continue } // 背景が写真・グラデーションなどで安全に消せない: 画像に残す
            ink = er.ink
            medOf = er.med
            erase.push(er.rect)
          }
          ink.sort((a, b) => b[0] - a[0])
          const top = ink.slice(0, Math.max(2, Math.ceil(ink.length / 4)))
          const cr = top.reduce((s, h) => s + h[1], 0) / top.length, cg = top.reduce((s, h) => s + h[2], 0) / top.length, cb = top.reduce((s, h) => s + h[3], 0) / top.length
          const color = hex(top.reduce((s, h) => s + h[1], 0) / top.length, top.reduce((s, h) => s + h[2], 0) / top.length, top.reduce((s, h) => s + h[3], 0) / top.length)
          const style = (tc.styles as any)[it.fontName] ?? {}
          let fo: any = null
          try { if (page.commonObjs.has(it.fontName)) fo = page.commonObjs.get(it.fontName) } catch { /* 取れない */ }
          // 文字の面積(太さの推定用): 各画素の「文字の濃さ」の合計
          let cov = 0
          if (!fo?.name) {
            const bgAt = (i: number) => (hit.length >= 2 && ink === hit ? [B[i], B[i + 1], B[i + 2]] : medOf)
            for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
              const i = (yy * cw + xx) * 4, bg = bgAt(i)
              const dm = Math.abs(cr - bg[0]) + Math.abs(cg - bg[1]) + Math.abs(cb - bg[2])
              if (dm < 60) continue
              cov += Math.min(1, (Math.abs(A[i] - bg[0]) + Math.abs(A[i + 1] - bg[1]) + Math.abs(A[i + 2] - bg[2])) / dm)
            }
          }
          // 書体
          const f = pickFont(fo?.name ?? it.fontName ?? '', style.fontFamily ?? '', !!fo?.bold, !!fo?.italic, fo?.isSerifFont, it.str)
          for (const fam of ['Noto Sans JP', 'Noto Serif JP', 'Inter']) for (const w of [400, 700, 900]) fontsToLoad.add(`${w} 32px "${fam}"`)
          sample += it.str.slice(0, 40)
          items.push({
            str: it.str, x: ox + tx[4] * u, y: oy + tx[5] * u, w: wC * u, fs: fsC * u, angle: (ang * 180) / Math.PI,
            serif: f.serif, weight: f.weight, italic: f.italic, color, vertical: !!style.vertical, cjk: f.cjk,
            fsC, cov, weightUnknown: !fo?.name,
          })
        }
        for (const e of erase) { noText.x.fillStyle = e.c; noText.x.fillRect(e.x, e.y, e.w, e.h) }
        if (items.length) {
          const measure = await makeMeasure(fontsToLoad, sample.slice(0, 300) || 'あA')
          objects = buildTextObjects(items, measure, makeAreaOf())
        }
        // 消せた文字が少なすぎる(= ほぼ画像に焼かれている)ときは、通常の描画を背景にして文字は作らない
        if (!objects.length) { objects = []; bgCanvas = full.c } else bgCanvas = noText.c
      }
      const blob = await toBlob(bgCanvas)
      const { id } = await putAsset(blob)
      const s = (pw * fit) / bgCanvas.width
      pages.push({
        text, textCount: objects.length, scanned: raw.length === 0, keptInImage,
        json: {
          version: '7.4.0', background: '#ffffff',
          objects: [{
            type: 'Image', version: '7.4.0', assetId: id, name: objects.length ? 'PDF の背景' : `PDF ${n}ページ`, crossOrigin: 'anonymous',
            left: ox, top: oy, width: bgCanvas.width, height: bgCanvas.height, scaleX: s, scaleY: s,
            originX: 'left', originY: 'top', locked: true,
          }, ...objects],
        },
      })
      page.cleanup()
      full.c.width = full.c.height = 0
      if (noText) noText.c.width = noText.c.height = 0
    }
    onProgress?.(total, total)
    return { width: W, height: H, pages }
  } finally { void task.destroy() }
}
