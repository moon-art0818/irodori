// ユーザーのフォントファイル(ttf / otf / woff / woff2)を FontFace API で登録し、IndexedDB('fonts' ストア)に保存して起動時に復元する
import { idbAll, idbDelete, idbGet, idbPut } from '../editor/idb'

interface FontRec { id: string; name: string; blob: Blob; size: number; addedAt: number }
export interface UserFont { name: string; size: number; addedAt: number }

const loaded = new Map<string, FontFace>()
const MAX_BYTES = 30 * 1024 * 1024
const subs = new Set<() => void>()
/** ユーザーフォントの増減を購読する(フォント一覧の再描画用) */
export function onUserFontsChange(f: () => void) { subs.add(f); return () => { subs.delete(f) } }

async function register(rec: FontRec) {
  const old = loaded.get(rec.name)
  if (old) document.fonts.delete(old)
  const face = new FontFace(rec.name, await rec.blob.arrayBuffer())
  await face.load() // 壊れたファイルはここで例外になる
  document.fonts.add(face)
  loaded.set(rec.name, face)
}

/** 起動時に呼ぶ: 保存済みのフォントをすべて登録して一覧を返す(壊れたものは飛ばす) */
export async function loadUserFonts(): Promise<UserFont[]> {
  const recs = await idbAll<FontRec>('fonts')
  for (const r of recs) { try { await register(r) } catch { /* 壊れたフォントは無視 */ } }
  return listUserFonts()
}

/** 保存済みユーザーフォントの一覧(名前順) */
export async function listUserFonts(): Promise<UserFont[]> {
  return (await idbAll<FontRec>('fonts')).map((r) => ({ name: r.name, size: r.size, addedAt: r.addedAt })).sort((a, b) => a.name.localeCompare(b.name, 'ja'))
}

/** フォントファイルを登録して保存する。フォント名はファイル名(拡張子なし)。同名は上書き。戻り値は登録名 */
export async function addUserFont(file: File): Promise<string> {
  if (!/\.(ttf|otf|woff2?)$/i.test(file.name)) throw new Error('対応しているのは ttf / otf / woff / woff2 です')
  if (file.size > MAX_BYTES) throw new Error('フォントファイルが大きすぎます(30MB まで)')
  const name = file.name.replace(/\.[^.]+$/, '').replace(/["'\\]/g, '').trim() || 'ユーザーフォント'
  const rec: FontRec = { id: name, name, blob: file, size: file.size, addedAt: Date.now() }
  try { await register(rec) } catch { throw new Error('フォントとして読み込めませんでした(ファイルが壊れている可能性があります)') }
  await idbPut('fonts', rec)
  subs.forEach((f) => f())
  return name
}

/** ユーザーフォントを登録解除して保存も削除する(既存デザインはこのフォントが無くなると代替フォントで表示される) */
export async function removeUserFont(name: string) {
  const f = loaded.get(name)
  if (f) { document.fonts.delete(f); loaded.delete(name) }
  if (await idbGet('fonts', name)) await idbDelete('fonts', name)
  subs.forEach((f) => f())
}

/** いま登録されているユーザーフォント名(同期。loadUserFonts / addUserFont 後に有効) */
export function userFontNames(): string[] { return [...loaded.keys()] }
