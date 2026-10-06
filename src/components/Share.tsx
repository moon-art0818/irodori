import { Copy, Link2, Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { currentUser, initSession } from '../api/session'
import { renderPage } from '../editor/core'
import { setShareContext } from '../editor/assets'
import type { DesignDoc } from '../editor/types'
import { usePopover } from './ColorPicker'
import { exportDoc } from './Download'

const shareUrl = (id: string) => `${location.origin}${location.pathname}#/s/${id}`

/** エディタ上部: 共有リンクの発行・停止 */
export function ShareButton({ docId, initialShareId, beforeShare }: { docId: string; initialShareId: string | null; beforeShare: () => Promise<void> }) {
  const { open, setOpen, ref } = usePopover()
  const [shareId, setShareId] = useState<string | null>(initialShareId)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState(false)
  const user = currentUser()
  const toggle = async (on: boolean) => {
    setBusy(true); setErr('')
    try { if (on) await beforeShare(); setShareId((await api.share(docId, on)).shareId) }
    catch (e: any) { setErr(e?.message ?? String(e)) } finally { setBusy(false) }
  }
  return (
    <div className="pop-wrap" ref={ref}>
      <button className={'tb-btn' + (open ? ' on' : '')} title="共有" onClick={() => setOpen(!open)}><Share2 size={18} /><span className="hide-sm">共有</span></button>
      {open && (
        <div className="popover right share-pop">
          <b>共有リンク</b>
          {!user ? <p className="hint">共有するには、ホーム右上からログインしてください(デザインをクラウドに保存する必要があります)。</p> : (
            <>
              <p className="hint">リンクを知っている人は誰でも閲覧・ダウンロードでき、「コピーして編集」で自分用に複製できます。元のデザインは編集されません。</p>
              {shareId ? (
                <>
                  <div className="row"><input className="search" readOnly value={shareUrl(shareId)} onFocus={(e) => e.target.select()} /></div>
                  <div className="row">
                    <button className="primary-btn" onClick={async () => { await navigator.clipboard.writeText(shareUrl(shareId)); setCopied(true); setTimeout(() => setCopied(false), 1500) }}><Copy size={14} />{copied ? 'コピーしました' : 'リンクをコピー'}</button>
                    <button className="chip" disabled={busy} onClick={() => toggle(false)}>共有をやめる</button>
                  </div>
                </>
              ) : <button className="primary-btn wide" disabled={busy} onClick={() => toggle(true)}><Link2 size={16} />共有リンクを作る</button>}
            </>
          )}
          {err && <p className="error">{err}</p>}
        </div>
      )}
    </div>
  )
}

/** 共有リンクを開いたときの閲覧ページ(ログイン不要) */
export function ShareView({ shareId }: { shareId: string }) {
  const [doc, setDoc] = useState<DesignDoc | null>(null)
  const [owner, setOwner] = useState('')
  const [imgs, setImgs] = useState<string[]>([])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState('')
  useEffect(() => {
    setShareContext(shareId)
    initSession()
    api.getShare(shareId).then(async (r) => {
      setDoc(r.doc); setOwner(r.ownerName)
      const out: string[] = []
      if (r.doc.deck) return // HTML スライドは画像化しない
      for (const p of r.doc.pages) { out.push(await renderPage(p.json, r.doc.width, r.doc.height, { multiplier: Math.min(1, 1600 / r.doc.width), format: 'jpeg', quality: 0.9 })); setImgs([...out]) }
    }).catch((e) => setErr(e?.status === 404 ? 'この共有リンクは無効か、共有が停止されています。' : (e?.message ?? String(e))))
    return () => setShareContext(null)
  }, [shareId])
  const copy = async () => {
    await initSession()
    if (!currentUser()) { setErr('コピーして編集するには、ログインが必要です。ホーム右上からログインしてから、もう一度このリンクを開いてください。'); return }
    setBusy('コピー中…')
    try { const { id } = await api.copyShare(shareId); setShareContext(null); location.hash = '#/d/' + id }
    catch (e: any) { setErr(e?.message ?? String(e)) } finally { setBusy('') }
  }
  return (
    <div className="share-view">
      <header className="home-head">
        <a className="logo" href="#/">irodori</a>
        {doc && <div className="share-title"><b>{doc.name}</b><small>{owner} さんが共有 ・ {doc.pages.length}ページ</small></div>}
        <div className="tb-spacer" />
        {doc && <>
          <button className="account-btn" disabled={!!busy} onClick={() => exportDoc(doc, 'pdf', 1, 'all').catch((e) => setErr(String(e)))}>PDF</button>
          <button className="account-btn" disabled={!!busy} onClick={() => exportDoc(doc, 'png', 2, 'all').catch((e) => setErr(String(e)))}>PNG</button>
          <button className="primary-btn" disabled={!!busy} onClick={copy}>{busy || 'コピーして編集'}</button>
        </>}
      </header>
      {err && <p className="error banner">{err}</p>}
      {!doc && !err && <p className="center-msg">読み込み中…</p>}
      {doc?.deck && <p className="hint banner-info">これは HTML スライドです。共有ページでは中身を表示できません。「コピーして編集」で自分のアカウントに複製すると開けます。</p>}
      <div className="share-pages">
        {imgs.map((u, i) => <img key={i} src={u} alt={`ページ ${i + 1}`} style={{ aspectRatio: `${doc!.width}/${doc!.height}` }} />)}
      </div>
    </div>
  )
}
