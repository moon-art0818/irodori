// #/c/<部屋> を開いたとき: 部屋の内容を受け取って手元にデザインを作り、エディタへ進む
import { useEffect, useState } from 'react'
import { initSession } from '../api/session'
import { detectLocal } from '../api/local'
import { idbPut } from '../editor/idb'
import { repo } from '../editor/repo'
import type { DesignDoc } from '../editor/types'
import { readDoc } from './binding'
import { CollabSession } from './session'

const collabDocId = (room: string) => 'c-' + room

/** 部屋の画像を先にこの端末へ取っておく(エディタを開いた瞬間から表示できるように) */
async function prefetchAssets(room: string, doc: Pick<DesignDoc, 'pages'>) {
  const ids = new Set<string>()
  const walk = (o: any) => {
    if (!o || typeof o !== 'object') return
    if (typeof o.assetId === 'string') ids.add(o.assetId)
    if (Array.isArray(o.objects)) o.objects.forEach(walk)
  }
  doc.pages.forEach((p) => (p.json?.objects ?? []).forEach(walk))
  const queue = [...ids]
  const worker = async () => {
    for (let id = queue.pop(); id; id = queue.pop()) {
      try {
        const r = await fetch(`/api/collab/${encodeURIComponent(room)}/assets/${encodeURIComponent(id)}`, { credentials: 'same-origin' })
        if (!r.ok || !(r.headers.get('content-type') ?? '').startsWith('image/')) continue
        const blob = await r.blob()
        await idbPut('assets', { id, blob, type: blob.type, createdAt: Date.now() })
      } catch { /* 取れない画像は開いた後に再試行される */ }
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()])
}

export function CollabJoin({ room }: { room: string }) {
  const [msg, setMsg] = useState('部屋につないでいます…')
  const [err, setErr] = useState('')
  useEffect(() => {
    let dead = false
    let session: CollabSession | null = null
    let timer = 0
    ;(async () => {
      if (await detectLocal()) { setErr('ローカル版(npm run agent)では共同編集を使えません。公開版のリンクをブラウザで開いてください。'); return }
      await initSession()
      let id = collabDocId(room)
      // すでにこの端末にコピーがあれば、そのまま開く(接続はエディタが行う)
      const have = await repo.get(id).catch(() => undefined)
      if (dead) return
      if (have?.collab?.room === room) { location.replace('#/d/' + id); return }
      // 「共同編集をやめる」で切り離したコピーが残っている: 上書きせず、別のコピーとして入り直す
      if (have) id = id + '-' + crypto.randomUUID().slice(0, 6)
      session = new CollabSession(room)
      const s = session
      s.onError((m) => { if (!dead) setErr(m) })
      const finish = async () => {
        const r = readDoc(s.doc)
        if (!r || dead) return false
        setMsg('画像を受け取っています…')
        await prefetchAssets(room, r)
        if (dead) return true
        const now = Date.now()
        const doc: DesignDoc = { id, ...r, createdAt: now, updatedAt: now, collab: { room } }
        if (!doc.print) delete doc.print
        try { await repo.put(doc, { baseUpdatedAt: null }) } catch (e: any) { setErr('この端末に保存できませんでした: ' + (e?.message ?? e)); return true }
        location.replace('#/d/' + id)
        return true
      }
      s.whenSynced(async () => {
        if (await finish()) return
        // 作った人がまだ最初の内容を流し込んでいない: 少し待つ
        setMsg('作成者の準備を待っています…')
        const pages = s.doc.getArray('pages')
        const f = () => { void finish().then((ok) => { if (ok) pages.unobserve(f) }) }
        pages.observe(f)
        timer = window.setTimeout(() => { if (!dead) setErr('部屋の中身がまだありません。作成者が開いているか確かめてください。') }, 30_000)
      })
    })().catch((e) => { if (!dead) setErr(e?.message ?? String(e)) })
    return () => { dead = true; clearTimeout(timer); session?.destroy() }
  }, [room])
  if (err) return <div className="center-msg">{err}<a href="#/">ホームへ戻る</a></div>
  return <div className="center-msg">{msg}</div>
}
