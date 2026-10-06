// 写真: Openverse(CC0 / パブリックドメインのみ = 表記不要・商用可)と Picsum(Unsplash License)
import { useEffect, useRef, useState } from 'react'
import type { EditorCore } from '../editor/core'
import { putAsset, downscale } from '../editor/assets'
import { dragAdd } from '../editor/dnd'
import { api } from '../api/client'
import { getProviders } from '../api/session'
import type { Providers } from '../api/contract'

interface Photo { id: string; thumb: string; full: string; credit: string; w: number; h: number; src: 'openverse' | 'picsum' | 'unsplash' | 'pexels'; author?: string; authorUrl?: string; pageUrl?: string; downloadLocation?: string }
type Source = 'free' | 'unsplash' | 'pexels'

// 日本語の検索語を英語に寄せる(Openverse は英語の方がヒットが多い)
let jaDict: Record<string, string[]> | null = null
async function toEnglish(q: string): Promise<string> {
  if (!/[぀-ヿ一-鿿]/.test(q)) return q
  try {
    if (!jaDict) {
      const m: any = await import('../data/icon-ja')
      jaDict = (m.ICON_JA ?? m.JA_DICT ?? m.default ?? {}) as Record<string, string[]>
    }
    const hit = jaDict[q.trim()]
    if (hit?.length) return hit[0]
  } catch { /* 辞書が無ければそのまま */ }
  return q
}

async function toEnglishIfNeeded(q: string, source: Source) {
  // Pexels は日本語でも検索できる(locale=ja-JP)。Unsplash は英語の方が多く見つかる
  return source === 'unsplash' ? toEnglish(q) : q
}

async function searchOpenverse(q: string, page: number): Promise<Photo[]> {
  const term = await toEnglish(q)
  const r = await fetch(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(term)}&license=cc0,pdm&page_size=30&page=${page}`)
  if (!r.ok) throw new Error(`検索に失敗しました(${r.status})`)
  const j = await r.json()
  return (j.results ?? []).map((x: any) => ({
    id: 'ov_' + x.id, thumb: x.thumbnail, full: x.url, credit: `${x.creator ?? '不明'} / ${x.source}(${x.license.toUpperCase()})`,
    w: x.width ?? 1, h: x.height ?? 1, src: 'openverse',
  }))
}
async function listPicsum(page: number): Promise<Photo[]> {
  const r = await fetch(`https://picsum.photos/v2/list?page=${page}&limit=30`)
  if (!r.ok) throw new Error(`読み込みに失敗しました(${r.status})`)
  const j = await r.json()
  return j.map((x: any) => {
    const k = Math.min(1, 2000 / Math.max(x.width, x.height))
    return {
      id: 'ps_' + x.id, thumb: `https://picsum.photos/id/${x.id}/300/${Math.round((300 * x.height) / x.width)}`,
      full: `https://picsum.photos/id/${x.id}/${Math.round(x.width * k)}/${Math.round(x.height * k)}`,
      credit: `${x.author} / Unsplash`, w: x.width, h: x.height, src: 'picsum',
    }
  })
}

export function PhotosTab({ ed }: { ed: EditorCore }) {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Photo[]>([])
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState(false)
  const [adding, setAdding] = useState('')
  const [err, setErr] = useState('')
  const [source, setSource] = useState<Source>('free')
  const [prov, setProv] = useState<Providers | null>(null)
  useEffect(() => { getProviders().then(setProv) }, [])
  const term = useRef('')
  const load = async (query: string, p: number, src: Source = source) => {
    setBusy(true); setErr('')
    try {
      let res: Photo[]
      if (src !== 'free') {
        if (!query) { setItems([]); setBusy(false); return }
        const r = await api.searchPhotos(src, await toEnglishIfNeeded(query, src), p)
        res = r.results.map((x) => ({ id: x.id, thumb: x.thumb, full: x.url, credit: `${x.author} / ${src === 'unsplash' ? 'Unsplash' : 'Pexels'}`, w: x.w, h: x.h, src: x.provider, author: x.author, authorUrl: x.authorUrl, pageUrl: x.pageUrl, downloadLocation: x.downloadLocation }))
      } else res = query ? await searchOpenverse(query, p) : await listPicsum(p)
      setItems((prev) => (p === 1 ? res : [...prev, ...res]))
      setPage(p)
    } catch (e: any) { setErr(e?.message ?? String(e)) }
    finally { setBusy(false) }
  }
  useEffect(() => { load('', 1) }, [])
  const add = async (ph: Photo) => {
    setAdding(ph.id); setErr('')
    if (ph.src === 'unsplash' || ph.src === 'pexels') {
      // Unsplash・Pexels は API が返す URL をそのまま使う(ホットリンク)。撮影者のクレジットを画像に付けて残す
      try {
        const o = (await ed.addImageURL(ph.full)) as any
        if (o) { o.credit = { author: ph.author, authorUrl: ph.authorUrl, pageUrl: ph.pageUrl, source: ph.src === 'unsplash' ? 'Unsplash' : 'Pexels' }; ed.commit() }
        if (ph.src === 'unsplash' && ph.downloadLocation) api.unsplashDownload(ph.downloadLocation).catch(() => {}) // 利用の通知(Unsplash の必須事項)
      } catch { setErr('この写真は読み込めませんでした。別の写真を選んでください') }
      finally { setAdding('') }
      return
    }
    try {
      // 取り込んで自分の保存領域に置く(外部URLのままだと書き出し時に失敗・リンク切れするため)
      let r = await fetch(ph.full)
      if (!r.ok) r = await fetch(ph.thumb)
      const blob = await downscale(await r.blob())
      const { id, url } = await putAsset(blob)
      await ed.addImageURL(url, id)
    } catch {
      setErr('この写真は取り込めませんでした(提供元の制限)。別の写真を選んでください')
    } finally { setAdding('') }
  }
  return (
    <>
      {(prov?.unsplash || prov?.pexels) && (
        <div className="row src-tabs">
          <button className={'chip' + (source === 'free' ? ' on' : '')} onClick={() => { setSource('free'); setItems([]); load(term.current, 1, 'free') }}>無料素材</button>
          {prov.unsplash && <button className={'chip' + (source === 'unsplash' ? ' on' : '')} onClick={() => { setSource('unsplash'); setItems([]); if (term.current) load(term.current, 1, 'unsplash') }}>Unsplash</button>}
          {prov.pexels && <button className={'chip' + (source === 'pexels' ? ' on' : '')} onClick={() => { setSource('pexels'); setItems([]); if (term.current) load(term.current, 1, 'pexels') }}>Pexels</button>}
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); term.current = q; load(q, 1) }}>
        <input className="search" placeholder="写真を検索(例: コーヒー、海、business)" value={q} onChange={(e) => setQ(e.target.value)} />
      </form>
      <p className="hint">{term.current ? '検索結果は CC0・パブリックドメインのみ(表記不要・商用可)' : 'おすすめ写真(Unsplash License・商用可)。キーワードで検索もできます'}。フレームを選んでからクリックすると枠の中に入ります。</p>
      {err && <p className="error">{err}</p>}
      <div className="photo-grid">
        {items.map((p) => (
          <button key={p.id} className={'photo' + (adding === p.id ? ' busy' : '')} draggable onDragStart={dragAdd(() => add(p))} onClick={() => add(p)} title={p.credit}>
            <img src={p.thumb} alt="" loading="lazy" />
            {p.author && <span className="photo-credit" onClick={(e) => e.stopPropagation()}>Photo by <a href={p.authorUrl} target="_blank" rel="noopener noreferrer">{p.author}</a> on <a href={p.pageUrl} target="_blank" rel="noopener noreferrer">{p.src === 'unsplash' ? 'Unsplash' : 'Pexels'}</a></span>}
          </button>
        ))}
      </div>
      {!busy && items.length === 0 && !err && <p className="hint">見つかりませんでした。英語でも試してみてください。</p>}
      {items.length > 0 && <button className="chip wide" disabled={busy} onClick={() => load(term.current, page + 1)}>{busy ? '読み込み中…' : 'もっと見る'}</button>}
    </>
  )
}
