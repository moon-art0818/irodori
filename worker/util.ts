// 共通ユーティリティ(Env 型・JSON 応答・Cookie・乱数)
export interface Env {
  DB: D1Database
  BUCKET: R2Bucket
  /** 認証系の回数制限(IP ごと)。ローカルや未設定なら undefined */
  AUTH_LIMIT?: RateLimit
  REGISTER_LIMIT?: RateLimit
  /** 共同編集の部屋(Durable Object)。未設定の環境では共同編集が 503 になる */
  COLLAB: DurableObjectNamespace<import('./collab').CollabRoom>
  /** 共同編集の部屋の作成・画像アップロードの回数制限(IP ごと)。未設定なら素通し */
  COLLAB_LIMIT?: RateLimit
  /** 本人が wrangler secret put で設定する(未設定なら機能を隠す) */
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  UNSPLASH_ACCESS_KEY?: string
  PEXELS_API_KEY?: string
  PIXABAY_API_KEY?: string
  /** '1' なら公開デモ: ログイン・クラウド保存・共有・写真中継を止める(Pixabay だけはキーがあれば使える)(画面はブラウザ内保存だけで動く) */
  DEMO?: string
}

export class HttpError extends Error {
  status: number
  extra?: Record<string, unknown>
  constructor(status: number, message: string, extra?: Record<string, unknown>) {
    super(message)
    this.status = status
    this.extra = extra
  }
}

export function json(body: unknown, status = 200, headers: HeadersInit = {}): Response {
  const h = new Headers(headers)
  h.set('Content-Type', 'application/json; charset=utf-8')
  h.set('Cache-Control', 'no-store')
  return new Response(JSON.stringify(body), { status, headers: h })
}

export async function readJson<T = any>(req: Request, maxBytes = 1024 * 1024): Promise<T> {
  const len = Number(req.headers.get('Content-Length') ?? 0)
  if (len > maxBytes) throw new HttpError(413, 'データが大きすぎます')
  let text: string
  try { text = await req.text() } catch { throw new HttpError(400, 'リクエストを読み取れませんでした') }
  if (text.length > maxBytes) throw new HttpError(413, 'データが大きすぎます')
  try { return JSON.parse(text) as T } catch { throw new HttpError(400, 'JSON の形式が正しくありません') }
}

export function toBase64Url(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromBase64Url(s: string): Uint8Array<ArrayBuffer> {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export function randomBytes(n: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(n))
}

/** 32 文字の字母(256 が割り切れるので偏りなし)。16 文字 = 80bit */
const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'
export function randomId(len: number): string {
  let s = ''
  for (const b of randomBytes(len)) s += ALPHABET[b % 32]
  return s
}

export async function sha256Hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('')
}

export function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname.endsWith('.localhost')
}

export function parseCookies(req: Request): Record<string, string> {
  const out: Record<string, string> = {}
  for (const part of (req.headers.get('Cookie') ?? '').split(';')) {
    const i = part.indexOf('=')
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim()
  }
  return out
}

/** 先頭のバイト列が、名乗っている形式(Content-Type)と一致するか */
export function sniffOk(mime: string, b: Uint8Array): boolean {
  const eq = (off: number, s: string) => [...s].every((c, i) => b[off + i] === c.charCodeAt(0))
  switch (mime) {
    case 'image/png': return b[0] === 0x89 && eq(1, 'PNG')
    case 'image/jpeg': return b[0] === 0xff && b[1] === 0xd8
    case 'image/gif': return eq(0, 'GIF8')
    case 'image/webp': return eq(0, 'RIFF') && eq(8, 'WEBP')
    case 'image/svg+xml': return new TextDecoder().decode(b.subarray(0, Math.min(b.length, 4096))).includes('<svg')
    case 'video/mp4': return eq(4, 'ftyp')
    case 'video/webm': return b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3
    case 'audio/mpeg': return eq(0, 'ID3') || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)
    case 'audio/ogg': return eq(0, 'OggS')
    case 'audio/wav': return eq(0, 'RIFF') && eq(8, 'WAVE')
    default: return false
  }
}
