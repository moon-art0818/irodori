import { Cloud, LogIn, LogOut, UploadCloud, UserPlus, KeyRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { currentUser, initSession, login, logout, onSession, register, serverOn, addPasskey, getProviders, refreshUser } from '../api/session'
import type { Providers } from '../api/contract'
import { cloudRepo, localRepo, ConflictError } from '../editor/repo'
import type { DesignDoc } from '../editor/types'
import { idbGet } from '../editor/idb'
import { api } from '../api/client'
import { usePopover } from './ColorPicker'

/** 端末のデザイン1件をクラウドへ移す(画像も上げて assetId を付け替える)。移行済みなら ConflictError */
export async function migrateOne(d: DesignDoc) {
  const ids = new Map<string, string>()
  const walk = async (o: any) => {
    if (o?.assetId && !ids.has(o.assetId)) {
      const rec = await idbGet<{ blob: Blob }>('assets', o.assetId)
      if (rec) ids.set(o.assetId, (await api.uploadAsset(rec.blob)).id)
    }
    if (o?.assetId && ids.has(o.assetId)) o.assetId = ids.get(o.assetId)
    for (const c of o?.objects ?? []) await walk(c)
  }
  const copy = structuredClone(d)
  for (const p of copy.pages) for (const o of p.json?.objects ?? []) await walk(o)
  await cloudRepo.put(copy, { baseUpdatedAt: null, thumb: copy.thumb })
}

export function useSession() {
  const [, setN] = useState(0)
  useEffect(() => { initSession(); return onSession(() => setN((n) => n + 1)) }, [])
  return { user: currentUser(), server: serverOn() }
}

const msg = (e: any) => {
  const n = e?.name
  if (n === 'NotAllowedError') return '操作がキャンセルされたか、時間切れになりました'
  if (n === 'InvalidStateError') return 'この端末にはすでにパスキーが登録されています。「ログイン」を押してください'
  return e?.message ?? String(e)
}

/** ホーム右上: ログイン / アカウント */
export function AccountButton({ onChanged }: { onChanged: () => void }) {
  const { user, server } = useSession()
  const { open, setOpen, ref } = usePopover()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [migrated, setMigrated] = useState('')
  const [prov, setProv] = useState<Providers | null>(null)
  const [keys, setKeys] = useState<{ id: string; synced: boolean; createdAt: number }[] | null>(null)
  useEffect(() => { if (open) getProviders().then(setProv) }, [open])
  useEffect(() => { if (open && user) api.listPasskeys().then((r) => setKeys(r.passkeys)).catch(() => setKeys(null)) }, [open, user?.id, user?.passkeys])
  if (!server) return null // サーバーの無い環境(ローカル開発のみ)では出さない
  const run = async (label: string, f: () => Promise<any>) => {
    setBusy(label); setErr('')
    try { await f(); onChanged() } catch (e) { setErr(msg(e)) } finally { setBusy('') }
  }
  const migrate = () => run('移行中…', async () => {
    const list = await localRepo.list()
    let n = 0, skip = 0
    for (const s of list) {
      const d = await localRepo.get(s.id)
      if (!d) continue
      try { await migrateOne(d); n++ } catch (e) { if (e instanceof ConflictError) skip++; else throw e }
    }
    setMigrated(`${n} 件のデザインをクラウドに移しました${skip ? `(${skip} 件は移行済みのため飛ばしました)` : ''}。この端末のデータも残っています。`)
  })
  return (
    <div className="pop-wrap" ref={ref}>
      <button className="account-btn" onClick={() => setOpen(!open)}>
        {user ? <><Cloud size={16} />{user.name}</> : <><LogIn size={16} />ログイン</>}
      </button>
      {open && (
        <div className="popover right account-pop">
          {user ? (
            <>
              <b>{user.name} さん</b>
              <p className="hint">デザインはクラウドに保存され、どの端末からでも開けます。使用量 {Math.round(user.usedBytes / 1048576)}MB / {Math.round(user.quotaBytes / 1048576)}MB</p>
              <div className="pop-label">ログイン手段(なくしたときの備え)</div>
              <p className="hint">別の端末(スマホなど)でもパスキーを作っておくか Google を紐付けておくと、この端末をなくしてもログインできます。</p>
              <ul className="keys-list">
                {(keys ?? []).map((k, i) => (
                  <li key={k.id}><span>パスキー {i + 1}{k.synced ? '(同期あり)' : ''}<small>{new Date(k.createdAt).toLocaleDateString('ja-JP')} 登録</small></span>
                    <button className="icon-btn" title="このパスキーを削除" onClick={() => run('', async () => { if (!confirm('このパスキーを削除しますか?その端末ではログインできなくなります')) return; await api.deletePasskey(k.id); await refreshUser() })}>削除</button></li>
                ))}
                {user.googleLinked && <li><span>Google アカウント</span><button className="icon-btn" onClick={() => run('', async () => { await api.googleUnlink(); await refreshUser() })}>解除</button></li>}
              </ul>
              <button className="chip wide" disabled={!!busy} onClick={() => run('追加中…', addPasskey)}><KeyRound size={14} /> {busy === '追加中…' ? busy : 'この端末のパスキーを追加'}</button>
              {prov?.google && !user.googleLinked && <a className="chip wide google" href="/api/auth/google/start?link=1">Google アカウントを紐付ける</a>}
              <div className="pop-label">データ</div>
              <button className="chip wide" disabled={!!busy} onClick={migrate}><UploadCloud size={14} /> この端末のデザインをクラウドへ移す</button>
              {migrated && <p className="hint">{migrated}</p>}
              <button className="chip wide" onClick={() => run('', logout)}><LogOut size={14} /> ログアウト</button>
            </>
          ) : (
            <>
              <b>ログイン(パスキー)</b>
              <p className="hint">パスワードは不要です。指紋・顔認証・端末の PIN でログインします。ログインすると、デザインをクラウドに保存して、他の端末や共有リンクで使えます。ログインしなくても、この端末の中で使えます。</p>
              <button className="primary-btn wide" disabled={!!busy} onClick={() => run('ログイン中…', login)}><LogIn size={16} />{busy === 'ログイン中…' ? busy : 'パスキーでログイン'}</button>
              {prov?.google && <a className="chip wide google" href="/api/auth/google/start">Google でログイン</a>}
              <div className="pop-label">はじめての方</div>
              <input className="search" placeholder="表示名(例: 山田)" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
              <button className="chip wide" disabled={!!busy || !name.trim()} onClick={() => run('登録中…', () => register(name.trim()))}><UserPlus size={14} />{busy === '登録中…' ? busy : 'パスキーを作って登録'}</button>
            </>
          )}
          {err && <p className="error">{err}</p>}
        </div>
      )}
    </div>
  )
}
