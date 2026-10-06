import { useEffect, useState } from 'react'
import { SIZES } from '../data/sizes'
import { createDoc, repo } from '../editor/repo'
import { resizePageJSON } from '../editor/resize'
import { listVersions, maybeSnapshot, type Version } from '../editor/versions'
import type { DesignDoc } from '../editor/types'
import { renderPage } from '../editor/core'

/** マジックリサイズ: 選んだサイズごとにコピーを作る(または今のデザインを変更) */
export function ResizeModal({ getDoc, onClose, onResized }: { getDoc: () => DesignDoc; onClose: () => void; onResized: (doc: DesignDoc) => void }) {
  const doc = getDoc()
  const [sel, setSel] = useState<string[]>([])
  const [cw, setCw] = useState(doc.width), [ch, setCh] = useState(doc.height)
  const [mode, setMode] = useState<'copy' | 'self'>('copy')
  const [busy, setBusy] = useState('')
  const [done, setDone] = useState<DesignDoc[]>([])
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : mode === 'self' ? [id] : [...s, id]))
  const run = async () => {
    const targets = sel.map((id) => (id === 'custom' ? { id, label: `${cw}×${ch}`, w: Math.round(cw), h: Math.round(ch), print: undefined } : SIZES.find((s) => s.id === id)!))
    const made: DesignDoc[] = []
    for (const t of targets) {
      setBusy(`${t.label} を作成中…`)
      const pages = []
      for (const p of doc.pages) pages.push({ id: p.id, json: await resizePageJSON(p.json, doc.width, doc.height, t.w, t.h) })
      if (mode === 'self') {
        await maybeSnapshot(doc, true) // 変更前を履歴に残す
        const nd = { ...doc, width: t.w, height: t.h, print: t.print, pages }
        try { await repo.put(nd, { baseUpdatedAt: doc.updatedAt }) }
        catch (e: any) { setBusy(''); alert('サイズを変更できませんでした: ' + (e?.message ?? e)); return }
        onResized(nd)
        return
      }
      const nd = createDoc(`${doc.name}(${t.label})`, t.w, t.h, undefined, t.print)
      nd.pages = pages.map((p) => ({ ...p, id: 'p_' + crypto.randomUUID().slice(0, 8) }))
      nd.thumb = await renderPage(nd.pages[0].json, t.w, t.h, { multiplier: 400 / Math.max(t.w, t.h), format: 'jpeg', quality: 0.8 })
      try { await repo.put(nd, { baseUpdatedAt: null, thumb: nd.thumb }) }
      catch (e: any) { setBusy(''); alert(`${t.label} を作れませんでした: ` + (e?.message ?? e)); return }
      made.push(nd)
    }
    setBusy('')
    setDone(made)
  }
  const groups = [...new Set(SIZES.map((s) => s.group))]
  return (
    <div className="modal-back" onPointerDown={onClose}>
      <div className="modal resize-modal" onPointerDown={(e) => e.stopPropagation()}>
        <h3>サイズを変更(マジックリサイズ)</h3>
        {done.length > 0 ? (
          <>
            <p>{done.length} 件のデザインを作りました。</p>
            <div className="done-list">{done.map((d) => <a key={d.id} className="done-item" href={'#/d/' + d.id} onClick={onClose}>{d.thumb && <img src={d.thumb} alt="" />}<span>{d.name}</span></a>)}</div>
            <div className="row" style={{ justifyContent: 'flex-end' }}><button className="chip" onClick={onClose}>閉じる</button></div>
          </>
        ) : (
          <>
            <div className="row">
              <button className={'chip' + (mode === 'copy' ? ' on' : '')} onClick={() => setMode('copy')}>コピーして新しいサイズを作る</button>
              <button className={'chip' + (mode === 'self' ? ' on' : '')} onClick={() => { setMode('self'); setSel((s) => s.slice(0, 1)) }}>このデザインのサイズを変える</button>
            </div>
            <p className="hint">文字や図形は比率を保って配置し直します。仕上げの微調整は各デザインで行ってください。{mode === 'copy' ? '複数選べます。' : '変更前の状態は履歴に残ります。'}</p>
            <div className="resize-list">
              {groups.map((g) => (
                <div key={g}>
                  <div className="pop-label">{g}</div>
                  {SIZES.filter((s) => s.group === g).map((s) => (
                    <label key={s.id} className="check"><input type={mode === 'self' ? 'radio' : 'checkbox'} name="sz" checked={sel.includes(s.id)} onChange={() => toggle(s.id)} />{s.label}<small>{s.w}×{s.h}</small></label>
                  ))}
                </div>
              ))}
              <div>
                <div className="pop-label">カスタム</div>
                <label className="check"><input type={mode === 'self' ? 'radio' : 'checkbox'} name="sz" checked={sel.includes('custom')} onChange={() => toggle('custom')} />
                  <input className="num" type="number" value={cw} onChange={(e) => setCw(+e.target.value)} />×<input className="num" type="number" value={ch} onChange={(e) => setCh(+e.target.value)} />px</label>
              </div>
            </div>
            <div className="row" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
              {busy && <span className="hint">{busy}</span>}
              <button className="chip" onClick={onClose}>キャンセル</button>
              <button className="primary-btn" disabled={!sel.length || !!busy} onClick={run}>{mode === 'copy' ? `${sel.length} 件作成` : 'サイズを変更'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** バージョン履歴 */
export function VersionsModal({ getDoc, onClose, onRestore }: { getDoc: () => DesignDoc; onClose: () => void; onRestore: (doc: DesignDoc) => void }) {
  const [list, setList] = useState<Version[] | null>(null)
  const [thumbs, setThumbs] = useState<Record<string, string>>({})
  useEffect(() => {
    listVersions(getDoc().id).then(async (vs) => {
      setList(vs)
      for (const v of vs.slice(0, 30)) {
        const d = v.doc
        const u = d.thumb ?? (await renderPage(d.pages[0].json, d.width, d.height, { multiplier: 240 / Math.max(d.width, d.height), format: 'jpeg', quality: 0.7 }))
        setThumbs((t) => ({ ...t, [v.id]: u }))
      }
    })
  }, [getDoc])
  const restore = async (v: Version) => {
    if (!confirm(`${new Date(v.at).toLocaleString('ja-JP')} の状態に戻しますか?(今の状態も履歴に残ります)`)) return
    await maybeSnapshot(getDoc(), true)
    const cur = getDoc()
    const nd = { ...v.doc, id: cur.id }
    try { await repo.put(nd, { baseUpdatedAt: cur.updatedAt }) }
    catch (e: any) { alert('元に戻せませんでした: ' + (e?.message ?? e)); return }
    onRestore(nd)
  }
  return (
    <div className="modal-back" onPointerDown={onClose}>
      <div className="modal" style={{ width: 640 }} onPointerDown={(e) => e.stopPropagation()}>
        <h3>バージョン履歴</h3>
        <p className="hint">編集中は5分ごとに自動で記録されます(最大30件)。</p>
        {!list ? <p className="hint">読み込み中…</p> : list.length === 0 ? <p className="hint">まだ履歴がありません。</p> : (
          <div className="version-list">
            {list.map((v) => (
              <div key={v.id} className="version">
                {thumbs[v.id] ? <img src={thumbs[v.id]} alt="" /> : <div className="thumb-ph" />}
                <div><b>{new Date(v.at).toLocaleString('ja-JP')}</b><small>{v.doc.pages.length}ページ・{v.doc.width}×{v.doc.height}</small></div>
                <button className="chip" onClick={() => restore(v)}>この状態に戻す</button>
              </div>
            ))}
          </div>
        )}
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 12 }}><button className="chip" onClick={onClose}>閉じる</button></div>
      </div>
    </div>
  )
}
