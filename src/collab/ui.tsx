// 共同編集の画面部品: 名前の入力・参加者と状態・他の人のカーソルと選択枠
import { Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePeers } from './usePeers'
import type { Awareness } from 'y-protocols/awareness'
import type { EditorCore } from '../editor/core'
import type { CollabSession, CollabStatus } from './session'

/** 最初に名前を聞く */
export function NameModal({ initial, onOk, onCancel }: { initial: string; onOk: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial)
  const ok = name.trim().length > 0
  return (
    <div className="modal-back" onPointerDown={onCancel}>
      <form className="modal collab-name" onPointerDown={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); if (ok) onOk(name.trim().slice(0, 20)) }}>
        <h3>共同編集で表示する名前</h3>
        <p className="hint">ほかの参加者に、カーソルと上部の丸アイコンでこの名前が見えます。この名前はブラウザに保存されます。</p>
        <input className="search" autoFocus maxLength={20} placeholder="例: ゆうこ" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
          <button type="button" className="chip" onClick={onCancel}>やめる</button>
          <button type="submit" className="primary-btn" disabled={!ok}>決定</button>
        </div>
      </form>
    </div>
  )
}

const STATUS_TEXT: Record<CollabStatus, string> = { connecting: '接続中…', online: '共同編集中', offline: 'オフライン' }

/** 上部バー: 接続の状態と、参加者の丸アイコン */
export function CollabBar({ session, selfName, selfColor }: { session: CollabSession; selfName: string; selfColor: string }) {
  const peers = usePeers(session.awareness)
  const [, tick] = useState(0)
  useEffect(() => session.onStatus(() => tick((n) => n + 1)), [session])
  useEffect(() => session.onError(() => tick((n) => n + 1)), [session])
  const status: CollabStatus = session.status
  const fatal = session.fatal
  const shown = peers.slice(0, 5)
  return (
    <div className="collab-bar" title={fatal || `参加者 ${peers.length + 1} 人`}>
      <span className={'collab-status ' + (fatal ? 'offline' : status)}><Users size={14} />{fatal ? '切断されました' : STATUS_TEXT[status]}</span>
      <span className="collab-avatars">
        <span className="collab-avatar self" style={{ background: selfColor }} title={`${selfName}(あなた)`}>{[...selfName][0] ?? '?'}</span>
        {shown.map((p) => <span key={p.clientId} className="collab-avatar" style={{ background: p.color }} title={p.name}>{[...p.name][0] ?? '?'}</span>)}
        {peers.length > shown.length && <span className="collab-avatar more">+{peers.length - shown.length}</span>}
      </span>
    </div>
  )
}

/** キャンバスの上に重ねる、他の人のカーソルと選択枠(ページ座標 × 表示倍率 = 画面上の位置) */
export function CursorLayer({ ed, awareness }: { ed: EditorCore; awareness: Awareness }) {
  const peers = usePeers(awareness, true)
  const [, tick] = useState(0)
  // 選択枠は物の位置から計算するので、エディタの更新(ズーム・反映)のたびに描き直す
  useEffect(() => ed.onUpdate(() => tick((n) => n + 1)), [ed])
  const z = ed.zoom
  const pageId = ed.pageId
  const here = peers.filter((p) => p.page === pageId)
  const objs = ed.canvas.getObjects() as any[]
  return (
    <div className="collab-layer" aria-hidden="true">
      {here.map((p) => p.sel.map((id) => {
        const o = objs.find((x) => x.id === id)
        if (!o) return null
        const r = o.getBoundingRect()
        return <div key={p.clientId + ':' + id} className="collab-sel" style={{ left: r.left * z, top: r.top * z, width: r.width * z, height: r.height * z, borderColor: p.color }}><span style={{ background: p.color }}>{p.name}</span></div>
      }))}
      {here.map((p) => p.cursor && (
        <div key={p.clientId} className="collab-cursor" style={{ transform: `translate(${p.cursor.x * z}px, ${p.cursor.y * z}px)` }}>
          <svg width="16" height="16" viewBox="0 0 16 16"><path d="M1 1l5.5 14 2-5.5L14 7.5z" fill={p.color} stroke="#fff" strokeWidth="1" strokeLinejoin="round" /></svg>
          <span style={{ background: p.color }}>{p.name}</span>
        </div>
      ))}
    </div>
  )
}
