// PDF の取り込み: pdf.js(Apache-2.0)で各ページを画像にし、背景画像1枚のページ JSON にする。
// 画像化したページ上の文字は編集できない(元の PDF の文字は画像に焼かれる)。代わりに各ページの文字は text として返す(検索・AI 用)
import * as pdfjs from 'pdfjs-dist'
// Vite の ?url で worker をアセットとして配り、メインスレッドの外で動かす
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { putAsset } from '../editor/assets'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

export interface ImportedPDF { width: number; height: number; pages: { json: any; text: string }[] }

/**
 * PDF ファイルを読み込み、デザインのページ配列にする。
 * 最初のページの大きさ(pt を 96dpi の px に換算)がデザインの大きさ。大きさの違うページは収まるよう中央に置く。
 * opts.maxPages(既定 100)/ opts.renderLongSide 画像化する長辺の px(既定 1800)
 */
export async function importPDF(
  file: File,
  onProgress?: (done: number, total: number) => void,
  opts: { maxPages?: number; renderLongSide?: number } = {},
): Promise<ImportedPDF> {
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
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height)
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
      await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise
      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('画像化に失敗しました'))), 'image/jpeg', 0.92))
      const { id } = await putAsset(blob)
      const text = (await page.getTextContent()).items.map((it: any) => ('str' in it ? it.str + (it.hasEOL ? '\n' : '') : '')).join('')
      // 最初のページの大きさに収める(はみ出さない最大の倍率で中央に)
      const fit = Math.min(W / pw, H / ph)
      const s = (pw * fit) / canvas.width
      pages.push({
        text,
        json: {
          version: '7.4.0', background: '#ffffff',
          objects: [{
            type: 'Image', version: '7.4.0', assetId: id, name: `PDF ${n}ページ`, crossOrigin: 'anonymous',
            left: (W - pw * fit) / 2, top: (H - ph * fit) / 2, width: canvas.width, height: canvas.height, scaleX: s, scaleY: s,
            originX: 'left', originY: 'top', locked: true,
          }],
        },
      })
      page.cleanup()
      canvas.width = canvas.height = 0
    }
    onProgress?.(total, total)
    return { width: W, height: H, pages }
  } finally { void task.destroy() }
}
