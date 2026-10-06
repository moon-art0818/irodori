// サーバー API の呼び出し(取り決めは contract.ts)
import type { ApiUser, DocMeta, PhotoResult, Providers, PutDocBody } from './contract'
import type { DesignDoc } from '../editor/types'

export class ApiError extends Error {
  status: number
  data: any
  constructor(status: number, message: string, data?: any) { super(message); this.status = status; this.data = data }
}

async function call<T>(method: string, path: string, body?: any, raw?: Blob): Promise<T> {
  const headers: Record<string, string> = { 'X-Irodori': '1' }
  let payload: BodyInit | undefined
  if (raw) { payload = raw; headers['Content-Type'] = raw.type || 'application/octet-stream' }
  else if (body !== undefined) { payload = JSON.stringify(body); headers['Content-Type'] = 'application/json' }
  let r: Response
  try { r = await fetch(path, { method, headers, body: payload, credentials: 'same-origin' }) }
  catch { throw new ApiError(0, 'サーバーに接続できません。通信環境を確認してください') }
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new ApiError(r.status, data?.error ?? `エラーが発生しました(${r.status})`, data)
  return data as T
}

export const api = {
  me: () => call<{ user: ApiUser | null }>('GET', '/api/me'),
  logout: () => call<{ ok: true }>('POST', '/api/auth/logout'),
  registerOptions: (name: string) => call<any>('POST', '/api/auth/register/options', { name }),
  registerVerify: (resp: any) => call<{ user: ApiUser }>('POST', '/api/auth/register/verify', resp),
  loginOptions: () => call<any>('POST', '/api/auth/login/options', {}),
  loginVerify: (resp: any) => call<{ user: ApiUser }>('POST', '/api/auth/login/verify', resp),
  listDocs: () => call<{ docs: DocMeta[] }>('GET', '/api/docs'),
  getDoc: (id: string) => call<{ doc: DesignDoc }>('GET', `/api/docs/${id}`),
  putDoc: (id: string, body: PutDocBody) => call<{ updatedAt: number }>('PUT', `/api/docs/${id}`, body),
  deleteDoc: (id: string) => call<{ ok: true }>('DELETE', `/api/docs/${id}`),
  share: (id: string, on: boolean) => call<{ shareId: string | null }>('POST', `/api/docs/${id}/share`, { on }),
  getShare: (shareId: string) => call<{ doc: DesignDoc; ownerName: string }>('GET', `/api/share/${shareId}`),
  copyShare: (shareId: string) => call<{ id: string }>('POST', `/api/share/${shareId}/copy`),
  uploadAsset: (blob: Blob) => call<{ id: string }>('POST', '/api/assets', undefined, blob),
  providers: () => call<Providers>('GET', '/api/providers'),
  addPasskeyOptions: () => call<any>('POST', '/api/passkeys/options', {}),
  addPasskeyVerify: (resp: any) => call<{ ok: true }>('POST', '/api/passkeys/verify', resp),
  listPasskeys: () => call<{ passkeys: { id: string; synced: boolean; createdAt: number }[] }>('GET', '/api/passkeys'),
  deletePasskey: (id: string) => call<{ ok: true }>('DELETE', `/api/passkeys/${encodeURIComponent(id)}`),
  googleUnlink: () => call<{ ok: true }>('POST', '/api/auth/google/unlink', {}),
  searchPhotos: (provider: 'unsplash' | 'pexels', q: string, page: number) => call<{ results: PhotoResult[] }>('GET', `/api/photos/search?provider=${provider}&q=${encodeURIComponent(q)}&page=${page}`),
  unsplashDownload: (downloadLocation: string) => call<{ ok: true }>('POST', '/api/photos/unsplash-download', { downloadLocation }),
}

/** サーバーが動いている環境か(ローカル開発の vite 単体ではサーバーが無い) */
let available: boolean | null = null
export async function serverAvailable() {
  if (available !== null) return available
  try { const r = await fetch('/api/me', { credentials: 'same-origin' }); available = r.ok && (r.headers.get('content-type') ?? '').includes('json') }
  catch { available = false }
  return available
}
