// ブラウザ内の背景除去(サーバー不要・商用利用可のモデルのみ)
//
// モデル: BiRefNet_lite(MIT)の 512x512 ONNX 再エクスポート。
// 実行: @huggingface/transformers(Apache-2.0)経由の onnxruntime-web(MIT)。
//       WebGPU があれば fp16、無ければ WASM(fp32)。
// キャッシュ: transformers.js が Cache Storage にモデルを保存する(2回目以降はDL不要)。
//
// 重いライブラリは初回利用時に動的 import し、メインのバンドルを太らせない。

export const BG_MODEL_INFO = {
  name: 'BiRefNet_lite (512px)',
  license: 'MIT',
  licenseUrl: 'https://huggingface.co/studioludens/birefnet-lite-512',
  // WebGPU(fp16)で約98MB、WASM(fp32)で約192MB
  sizeMB: 98,
  sizeMBWasm: 192,
} as const

export type BgProgress = { stage: 'download' | 'infer'; ratio: number; text: string }
type OnProgress = (p: BgProgress) => void

const MODEL_ID = 'studioludens/birefnet-lite-512'
const SIZE = 512
const MAX_OUTPUT_EDGE = 4096 // これを超える画像は長辺をここまで縮める(キャンバス上限対策)
const MEAN = [0.485, 0.456, 0.406]
const STD = [0.229, 0.224, 0.225]

type Tf = typeof import('@huggingface/transformers')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Model = any
type Loaded = { tf: Tf; model: Model }

let loading: Promise<Loaded> | null = null

async function hasWebGPU(): Promise<boolean> {
  try {
    const gpu = (navigator as unknown as { gpu?: { requestAdapter(): Promise<unknown> } }).gpu
    return !!gpu && !!(await gpu.requestAdapter())
  } catch {
    return false
  }
}

async function loadModel(onProgress?: OnProgress, device?: 'webgpu' | 'wasm'): Promise<Loaded> {
  const tf = await import('@huggingface/transformers')
  // 推論エンジン(wasm, 約25MB)は Workers の配信上限を超えるので、自前で配らず jsDelivr から読む
  const ortVersion = '1.31.0-dev.20260914-8d85527a0'
  const onnx = (tf.env.backends as any).onnx
  if (onnx?.wasm) onnx.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ortVersion}/dist/`
  const dev = device ?? ((await hasWebGPU()) ? 'webgpu' : 'wasm')
  // fp16 は WebGPU のみ。WASM/CPU は fp32
  const dtype = dev === 'webgpu' ? 'fp16' : 'fp32'
  // ファイルごとの進捗を合算して全体の割合にする
  const files = new Map<string, { loaded: number; total: number }>()
  const progress_callback = (e: { status?: string; file?: string; loaded?: number; total?: number }) => {
    if (e.status !== 'progress' || !e.file || !e.total) return
    files.set(e.file, { loaded: e.loaded ?? 0, total: e.total })
    let l = 0
    let t = 0
    for (const v of files.values()) {
      l += v.loaded
      t += v.total
    }
    const ratio = t ? l / t : 0
    onProgress?.({
      stage: 'download',
      ratio,
      text: `背景除去モデルをダウンロード中… ${Math.round(ratio * 100)}%(初回のみ・約${Math.round(t / 1e6)}MB)`,
    })
  }
  const model = await tf.AutoModel.from_pretrained(MODEL_ID, {
    dtype,
    device: dev,
    progress_callback,
  } as Parameters<typeof tf.AutoModel.from_pretrained>[1])
  return { tf, model }
}

/** 512x512 の RGBA 画素から、前景らしさ(0-255)の 512x512 マスクを推論する。 */
async function inferMask512(
  { tf, model }: Loaded,
  rgba: Uint8ClampedArray | Uint8Array,
): Promise<Uint8ClampedArray> {
  const n = SIZE * SIZE
  const chw = new Float32Array(3 * n)
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < 3; c++) {
      chw[c * n + i] = (rgba[i * 4 + c] / 255 - MEAN[c]) / STD[c]
    }
  }
  const input = new tf.Tensor('float32', chw, [1, 3, SIZE, SIZE])
  const out = await model({ input_image: input })
  const t = (out.output_image ?? out.output ?? Object.values(out)[0]) as { data: Float32Array }
  const data = t.data
  const mask = new Uint8ClampedArray(n)
  for (let i = 0; i < n; i++) mask[i] = Math.round(255 / (1 + Math.exp(-data[i]))) // sigmoid
  return mask
}

function toJa(e: unknown): Error {
  const msg = e instanceof Error ? e.message : String(e)
  if (/fetch|network|Failed to load|load failed/i.test(msg)) {
    return new Error('背景除去モデルのダウンロードに失敗しました。ネットワーク接続を確認して、もう一度お試しください。')
  }
  if (/memory|alloc|OOM|out of/i.test(msg)) {
    return new Error('メモリが足りず背景除去を実行できませんでした。他のタブを閉じるか、画像を小さくしてお試しください。')
  }
  return new Error(`背景除去に失敗しました。(${msg})`)
}

/** 画像から背景を除去し、透過PNGのBlobを返す。結果は(最大4096pxまでの)元解像度。 */
export async function removeBackground(input: Blob, onProgress?: OnProgress): Promise<Blob> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(input)
  } catch {
    throw new Error('画像を読み込めませんでした。PNG・JPEG・WebP などの画像を選んでください。')
  }
  try {
    if (!loading) {
      loading = loadModel(onProgress).catch((e) => {
        loading = null // 失敗したら次回やり直せるように
        throw e
      })
    }
    let loaded: Loaded
    try {
      loaded = await loading
    } catch (e) {
      throw toJa(e)
    }

    onProgress?.({ stage: 'infer', ratio: 0, text: '背景を認識しています…' })
    // 1) モデル入力サイズに縮小
    const small = document.createElement('canvas')
    small.width = small.height = SIZE
    const sctx = small.getContext('2d', { willReadFrequently: true })!
    sctx.imageSmoothingQuality = 'high'
    sctx.drawImage(bitmap, 0, 0, SIZE, SIZE)
    const px = sctx.getImageData(0, 0, SIZE, SIZE).data

    // 2) 推論
    let mask: Uint8ClampedArray
    try {
      mask = await inferMask512(loaded, px)
    } catch (e) {
      throw toJa(e)
    }

    // 3) マスクを元解像度へ拡大(バイリニア補間でなめらかな縁)し、元画像に適用
    const mc = document.createElement('canvas')
    mc.width = mc.height = SIZE
    const mctx = mc.getContext('2d')!
    const md = mctx.createImageData(SIZE, SIZE)
    for (let i = 0; i < SIZE * SIZE; i++) md.data[i * 4 + 3] = mask[i]
    mctx.putImageData(md, 0, 0)

    const k = Math.min(1, MAX_OUTPUT_EDGE / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * k))
    const h = Math.max(1, Math.round(bitmap.height * k))
    const out = document.createElement('canvas')
    out.width = w
    out.height = h
    const octx = out.getContext('2d')!
    octx.imageSmoothingQuality = 'high'
    octx.drawImage(bitmap, 0, 0, w, h)
    octx.globalCompositeOperation = 'destination-in'
    octx.drawImage(mc, 0, 0, w, h)

    const blob = await new Promise<Blob | null>((r) => out.toBlob(r, 'image/png'))
    if (!blob) throw new Error('透過PNGの書き出しに失敗しました。画像が大きすぎる可能性があります。')
    onProgress?.({ stage: 'infer', ratio: 1, text: '完了しました' })
    return blob
  } finally {
    bitmap.close()
  }
}
