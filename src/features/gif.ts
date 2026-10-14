// アニメーション GIF の書き出し。editor/animate.ts の loadScene / renderAnimationFrame(動画書き出しと同じ描画)で各コマを描き、gifenc(MIT)で符号化する
import { GIFEncoder, applyPalette, quantize } from 'gifenc'
import { loadScene, renderAnimationFrame } from '../editor/animate'
import type { DesignDoc } from '../editor/types'
import type { Video } from '../editor/video'

export const GIF_MAX_SIDE = 800

/**
 * 全ページを順に GIF にする。各ページは pageSeconds 秒表示。登場アニメーションの間だけ fps でコマを作り、
 * 完了後は最後のコマを残り時間ぶん保持する(ファイルが小さくなる)。長辺は 800px に制限。
 * opts: pageSeconds ページ当たりの秒数 / fps 既定 12 / scale 既定 1(長辺 800px を超えない範囲で縮小) / onProgress 0〜1
 */
export async function exportGIF(
  doc: DesignDoc,
  opts: { pageSeconds: number; fps?: number; scale?: number; onProgress?: (r: number) => void },
): Promise<Blob> {
  if (doc.deck) throw new Error('HTML スライドは GIF に書き出せません')
  if (!doc.pages.length) throw new Error('ページがありません')
  const fps = Math.max(1, Math.min(30, opts.fps ?? 12))
  const s = Math.min(opts.scale ?? 1, GIF_MAX_SIDE / Math.max(doc.width, doc.height))
  const W = Math.max(2, Math.round(doc.width * s)), H = Math.max(2, Math.round(doc.height * s))
  const tmp = document.createElement('canvas')
  tmp.width = W; tmp.height = H
  const ctx = tmp.getContext('2d', { willReadFrequently: true })!
  const gif = GIFEncoder()
  const n = doc.pages.length
  const frame = (el: HTMLCanvasElement, delayMs: number) => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H)
    ctx.drawImage(el, 0, 0, W, H)
    const rgba = ctx.getImageData(0, 0, W, H).data
    const palette = quantize(rgba, 256)
    gif.writeFrame(applyPalette(rgba, palette), W, H, { palette, delay: delayMs, repeat: 0 })
  }
  // ページ秒数は 0.5〜60 秒に収める(GIF の表示時間の上限と、0 / NaN による空の GIF を防ぐ)
  opts = { ...opts, pageSeconds: Math.min(60, Math.max(0.5, Number(opts.pageSeconds) || 2)) }
  for (let i = 0; i < n; i++) {
    const scene = await loadScene(doc.pages[i].json, doc.width, doc.height, s)
    try {
      const total = opts.pageSeconds * 1000
      const animated = scene.anim.preset !== 'none'
      const D = animated ? Math.min(scene.duration, opts.pageSeconds * 0.7) : 0
      scene.duration = Math.max(0.01, D || scene.duration)
      const step = 1000 / fps
      let used = 0
      if (scene.videos.length) {
        // 動画のあるページ: ページの全期間をコマごとに描く(コマごとに動画の時刻を合わせ、seeked を待ってから描く)
        const frames = Math.max(1, Math.round(total / step))
        for (let k = 0; k < frames; k++) {
          const t = (k * step) / 1000
          await Promise.all(scene.videos.map((v) => seekVideoAt(v, t)))
          renderAnimationFrame(scene, animated ? Math.min(t, D) : 0)
          frame(scene.el, step)
          opts.onProgress?.((i + (k + 1) / frames) / n)
          if (k % 4 === 3) await new Promise((r) => setTimeout(r))
        }
        continue // finally で scene.dispose() される
      }
      for (let t = 0; t < D * 1000 - 1; t += step) {
        renderAnimationFrame(scene, t / 1000)
        frame(scene.el, step)
        used += step
        opts.onProgress?.((i + used / total) / n)
        if (((t / step) | 0) % 4 === 3) await new Promise((r) => setTimeout(r)) // 画面を固めない
      }
      renderAnimationFrame(scene, animated ? D : 0) // 完了後の姿を残り時間ぶん保持
      frame(scene.el, Math.max(step, total - used))
    } finally { scene.dispose() }
    opts.onProgress?.((i + 1) / n)
  }
  gif.finish()
  return new Blob([gif.bytes() as BlobPart], { type: 'image/gif' })
}

/** ページの開始から t 秒後の動画のコマに合わせる(ループ設定を守り、終端では最後のコマで止める) */
async function seekVideoAt(v: Video, t: number) {
  const len = v.clipLength
  if (!len) { await v.seekTo(v.start()); return }
  const local = v.loop ? t % len : Math.min(t, Math.max(0, len - 0.04))
  await v.seekTo(v.start() + local)
}
