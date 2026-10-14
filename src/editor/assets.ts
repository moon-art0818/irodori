// 画像はページJSONに埋め込まず、assetId で別保存する(履歴・保存の容量を抑え、将来クラウド保存へ移しやすくするため)
import { idbGet, idbPut } from './idb'

const urlCache = new Map<string, string>()

export async function putAsset(blob: Blob): Promise<{ id: string; url: string }> {
  // ログイン中はサーバーに上げ、その id を使う(他の端末・共有先でも同じ画像を引けるように)
  let id = 'a_' + crypto.randomUUID()
  const { currentUser } = await import('../api/session')
  const { isLocal } = await import('../api/local')
  if (isLocal()) {
    // ローカル版: designs/assets/ にファイルとして置く(AI からも見える)
    const r = await fetch('/local/assets', { method: 'POST', headers: { 'Content-Type': blob.type || 'application/octet-stream' }, body: blob })
    if (!r.ok) throw new Error('画像を保存できませんでした')
    id = (await r.json()).id
  } else if (currentUser()) {
    const { api } = await import('../api/client')
    id = (await api.uploadAsset(blob)).id
  }
  await idbPut('assets', { id, blob, type: blob.type, createdAt: Date.now() })
  const url = URL.createObjectURL(blob)
  urlCache.set(id, url)
  return { id, url }
}

/** 共有ページを見ているときは、その共有経由で画像を取る */
let shareCtx: string | null = null
export function setShareContext(shareId: string | null) { shareCtx = shareId }

/** 共同編集の部屋から画像を取ってくる関数(部屋につながっている間だけ登録される) */
type RemoteFetcher = (id: string) => Promise<Blob | null>
let remoteFetcher: RemoteFetcher | null = null
export function setRemoteAssetFetcher(fn: RemoteFetcher | null) { remoteFetcher = fn }

export async function getAssetURL(id: string): Promise<string | null> {
  const hit = urlCache.get(id)
  if (hit) return hit
  const rec = await idbGet<{ blob: Blob }>('assets', id)
  let blob = rec?.blob
  if (!blob) {
    // この端末に無ければサーバーから取って、端末にも残す
    const { isLocal } = await import('../api/local')
    const path = isLocal() ? `/local/assets/${encodeURIComponent(id)}` : shareCtx ? `/api/share/${shareCtx}/assets/${encodeURIComponent(id)}` : `/api/assets/${encodeURIComponent(id)}`
    try {
      const r = await fetch(path, { credentials: 'same-origin' })
      if (r.ok && (r.headers.get('content-type') ?? '').startsWith('image/')) {
        blob = await r.blob()
        if (!shareCtx) await idbPut('assets', { id, blob, type: blob.type, createdAt: Date.now() })
      }
    } catch { /* オフライン等 */ }
    // 自分のサーバーに無ければ、共同編集の部屋から取る(他の人が置いた画像)
    if (!blob && remoteFetcher) {
      try {
        blob = (await remoteFetcher(id)) ?? undefined
        if (blob) await idbPut('assets', { id, blob, type: blob.type, createdAt: Date.now() })
      } catch { /* 取れなければ画像なしで表示する */ }
    }
  }
  if (!blob) return null
  const url = URL.createObjectURL(blob)
  urlCache.set(id, url)
  return url
}

/** JSON 内の assetId を持つオブジェクトの src を、今のセッションで有効な URL に差し替える */
export async function resolveAssets(json: any): Promise<any> {
  const walk = async (o: any) => {
    if (!o || typeof o !== 'object') return
    if (o.assetId) {
      const url = await getAssetURL(o.assetId)
      if (url) o.src = url
    }
    if (Array.isArray(o.objects)) for (const c of o.objects) await walk(c)
  }
  const copy = structuredClone(json)
  for (const o of copy.objects ?? []) await walk(o)
  return copy
}

/** 大きな画像は長辺 maxSide に縮小して保存する */
export async function downscale(file: Blob, maxSide = 2400): Promise<Blob> {
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file
  const bmp = await createImageBitmap(file)
  const s = Math.min(1, maxSide / Math.max(bmp.width, bmp.height))
  if (s === 1) { bmp.close(); return file }
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  bmp.close()
  const type = file.type === 'image/png' || file.type === 'image/webp' ? 'image/png' : 'image/jpeg'
  return await new Promise<Blob>((res) => c.toBlob((b) => res(b!), type, 0.92))
}

/** SVG 書き出し用: 画像を data URL にして埋め込む(blob: URL はファイルの外では無効なため) */
export async function resolveAssetsAsDataURL(json: any): Promise<any> {
  const toData = (b: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = () => rej(r.error); r.readAsDataURL(b) })
  const walk = async (o: any) => {
    if (!o || typeof o !== 'object') return
    if (o.assetId) {
      let blob = (await idbGet<{ blob: Blob }>('assets', o.assetId))?.blob
      if (!blob) { const u = await getAssetURL(o.assetId); if (u) blob = await (await fetch(u)).blob() }
      if (blob) o.src = await toData(blob)
    }
    if (Array.isArray(o.objects)) for (const c of o.objects) await walk(c)
  }
  const copy = structuredClone(json)
  for (const o of copy.objects ?? []) await walk(o)
  return copy
}
