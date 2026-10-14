// 動画タブ: 自分の動画をアップロード / Wikimedia Commons(CC0・パブリックドメイン)から探す
import { Film } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { EditorCore } from '../editor/core'
import { dragAdd } from '../editor/dnd'
import { MAX_MEDIA_BYTES } from '../editor/assets'
import { fetchBlob, fmtTime, notifyCollabProblem, searchCommonsVideos, searchPexelsVideos, searchPixabayVideos, type VideoHit } from '../features/media'
import { getProviders } from '../api/session'

/** アップロード・ドロップ・貼り付けで動画ファイルを置く(エディタからも使う) */
export async function addVideoFiles(ed: EditorCore, files: File[]) {
  for (const f of files) {
    const r = await ed.addVideoFile(f)
    notifyCollabProblem(r.collabNote, `「${f.name}」`)
  }
}

export function VideosTab({ ed }: { ed: EditorCore }) {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<VideoHit[]>([])
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState(false)
  const [adding, setAdding] = useState('')
  const [err, setErr] = useState('')
  const [pexels, setPexels] = useState(false) // サーバーに PEXELS_API_KEY があるとき(公開デモでは出ない)
  const [pixabay, setPixabay] = useState(false) // サーバーに PIXABAY_API_KEY があるとき(公開デモでもキーがあれば出る)
  const [src, setSrc] = useState<'commons' | 'pexels' | 'pixabay'>('commons')
  useEffect(() => { getProviders().then((p) => { setPexels(!!p.pexels); setPixabay(!!p.pixabay) }) }, [])
  const term = useRef('')
  const load = async (query: string, p: number, s = src) => {
    setBusy(true); setErr('')
    try {
      const res = s === 'pexels' ? (query ? await searchPexelsVideos(query, p) : []) : s === 'pixabay' ? (query ? await searchPixabayVideos(query, p) : []) : await searchCommonsVideos(query, p)
      setItems((prev) => (p === 1 ? res : [...prev, ...res]))
      setPage(p)
    } catch (e: any) { setErr(e?.message ?? String(e)) }
    finally { setBusy(false) }
  }
  useEffect(() => { load('', 1) }, [])
  const add = async (h: VideoHit) => {
    setAdding(h.id); setErr('')
    try {
      // 取り込んで素材庫に置く(外部 URL のままだと書き出し時に canvas が汚れる/リンク切れするため)
      const blob = await fetchBlob(h.url)
      const typed = new Blob([blob], { type: h.mime })
      const r = await ed.addVideoFile(typed, h.credit)
      notifyCollabProblem(r.collabNote, 'この動画')
    } catch (e: any) { setErr('この動画は取り込めませんでした: ' + (e?.message ?? e)) }
    finally { setAdding('') }
  }
  const onFiles = async (files: FileList | null) => {
    if (!files) return
    setBusy(true); setErr('')
    try { await addVideoFiles(ed, Array.from(files)) } catch (e: any) { setErr(e?.message ?? String(e)) }
    setBusy(false)
  }
  return (
    <>
      <label className="upload-btn">
        <Film size={18} /> {busy && !items.length ? '読み込み中…' : '動画をアップロード'}
        <input type="file" accept="video/mp4,video/webm,video/quicktime,video/ogg,.mp4,.webm,.mov,.m4v,.ogv" multiple hidden onChange={(e) => { void onFiles(e.target.files); e.target.value = '' }} />
      </label>
      <p className="hint">mp4・webm・mov(お使いのブラウザで再生できるもの)、1 本 {Math.round(MAX_MEDIA_BYTES / 1048576)}MB まで。データはこのブラウザの中に保存されます。キャンバスへのドラッグ&ドロップでも置けます。</p>
      <div className="sec-title">動画素材を探す</div>
      {(pexels || pixabay) && (
        <div className="row src-tabs">
          <button className={'chip' + (src === 'commons' ? ' on' : '')} onClick={() => { setSrc('commons'); setItems([]); load(term.current, 1, 'commons') }}>Wikimedia Commons</button>
          {pexels && <button className={'chip' + (src === 'pexels' ? ' on' : '')} onClick={() => { setSrc('pexels'); setItems([]); if (term.current) load(term.current, 1, 'pexels') }}>Pexels</button>}
          {pixabay && <button className={'chip' + (src === 'pixabay' ? ' on' : '')} onClick={() => { setSrc('pixabay'); setItems([]); if (term.current) load(term.current, 1, 'pixabay') }}>Pixabay</button>}
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); term.current = q; load(q, 1) }}>
        <input className="search" placeholder="動画を検索(例: 海、city、forest)" value={q} onChange={(e) => setQ(e.target.value)} />
      </form>
      <p className="hint">{src === 'pixabay' ? <>Pixabay の素材(Pixabay Content License・商用可・表記不要)。出典: <a href="https://pixabay.com/" target="_blank" rel="noopener noreferrer">Pixabay</a>。投稿者のクレジットを動画に残します。</> : src === 'pexels' ? 'Pexels License(商用可・表記不要)。撮影者のクレジットを動画に残します。' : 'Wikimedia Commons の CC0・パブリックドメインのみ(表記不要・商用可)。'}人物・商標・建造物などの権利が写り込んでいる場合があるので、使う前に出典ページで確認してください。クリックで取り込み(数 MB〜数十 MB)。</p>
      {err && <p className="error">{err}</p>}
      <div className="photo-grid">
        {items.map((h) => (
          <button key={h.id} className={'photo' + (adding === h.id ? ' busy' : '')} draggable onDragStart={dragAdd(() => add(h))} onClick={() => add(h)}
            title={`${h.title}\n${h.credit.author ?? '不明'} / ${h.credit.source}`}>
            <img src={h.thumb} alt="" loading="lazy" referrerPolicy={src === 'pixabay' ? 'origin' : undefined} />
            <span className="vid-badge">{fmtTime(h.duration)}{h.estBytes ? ` · ${Math.max(1, Math.round(h.estBytes / 1048576))}MB` : ''}</span>
          </button>
        ))}
      </div>
      {!busy && items.length === 0 && !err && <p className="hint">見つかりませんでした。英語でも試してみてください。</p>}
      {items.length > 0 && <button className="chip wide" disabled={busy} onClick={() => load(term.current, page + 1)}>{busy ? '読み込み中…' : 'もっと見る'}</button>}
    </>
  )
}
