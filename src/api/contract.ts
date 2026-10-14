// クライアントとサーバー(worker/)の取り決め。両方がこの型に従う
import type { DesignDoc } from '../editor/types'

export interface ApiUser { id: string; name: string; createdAt: number; usedBytes: number; quotaBytes: number; passkeys: number; googleLinked: boolean }
/** サーバーで使えるログイン方法・写真サービス(キーが設定されているか) */
export interface Providers { google: boolean; unsplash: boolean; pexels: boolean; pixabay: boolean }
/** 写真検索の結果(Unsplash / Pexels / Pixabay を同じ形にそろえる) */
export interface PhotoResult { id: string; provider: 'unsplash' | 'pexels' | 'pixabay'; thumb: string; url: string; w: number; h: number; author: string; authorUrl: string; pageUrl: string; downloadLocation?: string }

/** 一覧用(中身なし) */
export interface DocMeta { id: string; name: string; width: number; height: number; pageCount: number; updatedAt: number; createdAt: number; shareId: string | null; thumbUrl: string | null }

// ---- 認証(パスキー / WebAuthn) ----
// POST /api/auth/register/options  body {name}            → PublicKeyCredentialCreationOptionsJSON(challenge はサーバーが保持)
// POST /api/auth/register/verify   body RegistrationResponseJSON → {user: ApiUser}(Set-Cookie: sid)
// POST /api/auth/login/options     body {}                → PublicKeyCredentialRequestOptionsJSON
// POST /api/auth/login/verify      body AuthenticationResponseJSON → {user: ApiUser}(Set-Cookie: sid)
// POST /api/auth/logout                                    → {ok:true}
// GET  /api/me                                             → {user: ApiUser | null}

// ---- デザイン ----
// GET    /api/docs                       → {docs: DocMeta[]}
// GET    /api/docs/:id                   → {doc: DesignDoc}(thumb は含めない)
// PUT    /api/docs/:id  body {doc: DesignDoc, baseUpdatedAt: number | null, thumb?: string(dataURL jpeg)}
//        → 200 {updatedAt} / 409 {error:'conflict', serverUpdatedAt}(baseUpdatedAt がサーバーの updatedAt と違う。新規は null)
// DELETE /api/docs/:id                   → {ok:true}
// POST   /api/docs/:id/share  body {on: boolean} → {shareId: string | null}
// GET    /api/thumbs/:docId              → image/jpeg(本人のみ)

// ---- 画像アセット ----
// POST /api/assets  body: 画像バイナリ(Content-Type: image/*、最大 15MB) → {id}
// GET  /api/assets/:id                   → 画像(本人のみ。キャッシュ可: private, max-age=31536000, immutable)

// ---- 共有(ログイン不要で閲覧) ----
// GET  /api/share/:shareId               → {doc: DesignDoc, ownerName: string}
// GET  /api/share/:shareId/assets/:id    → 画像(その共有デザインが参照している asset のみ)
// POST /api/share/:shareId/copy          → {id}(ログイン必須。デザインと参照画像を自分のアカウントに複製)

export interface PutDocBody { doc: DesignDoc; baseUpdatedAt: number | null; thumb?: string }
export const MAX_ASSET_BYTES = 15 * 1024 * 1024
export const DEFAULT_QUOTA_BYTES = 1024 * 1024 * 1024
