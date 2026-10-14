// 写真: Openverse(CC0 / パブリックドメインのみ)、Wikimedia Commons(CC0 / パブリックドメインのみ)、Picsum(Unsplash License)
// 出典の調査(2026-10-14): Art Institute of Chicago・NASA Image Library・Met・Cleveland は、画像サーバーが CORS を許可しない/ボット対策で拒否するため
// canvas に置けない(fetch も不可・中継サーバーなし)ので採用していない。
import { useEffect, useRef, useState } from 'react'
import type { EditorCore } from '../editor/core'
import { putAsset, downscale } from '../editor/assets'
import { dragAdd } from '../editor/dnd'
import { api } from '../api/client'
import { getProviders } from '../api/session'
import { pixabayRelay } from '../features/media'
import type { Providers } from '../api/contract'

interface Photo { id: string; thumb: string; full: string; credit: string; w: number; h: number; src: 'openverse' | 'picsum' | 'unsplash' | 'pexels' | 'pixabay' | 'wikimedia'; credit0?: { author?: string; pageUrl?: string; source: string }; author?: string; authorUrl?: string; pageUrl?: string; downloadLocation?: string }
type Source = 'free' | 'unsplash' | 'pexels' | 'pixabay'
const SRC_NAME = { unsplash: 'Unsplash', pexels: 'Pexels', pixabay: 'Pixabay' } as const
type FreeSrc = 'openverse' | 'wikimedia'

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
  const r = await fetch(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(term)}&license=cc0,pdm&page_size=20&page=${page}`)
  if (!r.ok) throw new Error(`検索に失敗しました(${r.status})`)
  const j = await r.json()
  return (j.results ?? []).map((x: any) => ({
    id: 'ov_' + x.id, thumb: x.thumbnail, full: x.url, credit: `${x.creator ?? '不明'} / ${x.source}(${x.license.toUpperCase()})`,
    w: x.width ?? 1, h: x.height ?? 1, src: 'openverse',
    credit0: { author: x.creator ?? undefined, pageUrl: x.foreign_landing_url, source: `${x.source ?? 'Openverse'}(${String(x.license ?? '').toUpperCase()})` },
  }))
}
const stripHtml = (h: string) => { const d = new DOMParser().parseFromString(h ?? '', 'text/html'); return (d.body.textContent ?? '').replace(/\s+/g, ' ').trim() }
/** Wikimedia Commons: CC0 / パブリックドメインのみ(haslicense:unrestricted で絞り、さらに表記を確認して CC BY 等を除く) */
async function searchWikimedia(q: string, page: number): Promise<Photo[]> {
  const term = await toEnglish(q)
  const base = term.trim() ? term.trim() : 'incategory:"Featured pictures on Wikimedia Commons"'
  const url = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({
    origin: '*', action: 'query', format: 'json', generator: 'search', gsrnamespace: '6',
    gsrsearch: `${base} filetype:bitmap haslicense:unrestricted`, gsrlimit: '30', gsroffset: String((page - 1) * 30),
    prop: 'imageinfo', iiprop: 'url|extmetadata|size|mime', iiurlwidth: '500',
  })
  const r = await fetch(url)
  if (!r.ok) throw new Error(`検索に失敗しました(${r.status})`)
  const j = await r.json()
  const pages: any[] = Object.values(j.query?.pages ?? {}).sort((a: any, b: any) => a.index - b.index)
  const out: Photo[] = []
  for (const p of pages) {
    const ii = p.imageinfo?.[0]
    if (!ii || !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue
    const lic = String(ii.extmetadata?.LicenseShortName?.value ?? '')
    if (!/^(cc0|cc[- ]zero|public domain|pd\b)/i.test(lic)) continue // CC BY / CC BY-SA は表記義務があるので入れない
    // 大きい版: 元画像の幅に収まる標準サイズ(thumb.wikimedia.org は段階サイズのみ)
    const sz = [1920, 1280, 960].find((n) => n <= ii.width)
    const full = sz && ii.thumburl ? ii.thumburl.replace(/\/\d+px-/, `/${sz}px-`) : ii.url
    out.push({
      id: 'wm_' + p.pageid, thumb: ii.thumburl ?? ii.url, full, w: ii.width, h: ii.height, src: 'wikimedia',
      credit: `${stripHtml(ii.extmetadata?.Artist?.value) || '不明'} / Wikimedia Commons(${lic})`,
      credit0: { author: stripHtml(ii.extmetadata?.Artist?.value) || undefined, pageUrl: ii.descriptionurl, source: `Wikimedia Commons(${lic})` },
    })
  }
  return out
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
  const [freeSrc, setFreeSrc] = useState<FreeSrc>('openverse')
  const [prov, setProv] = useState<Providers | null>(null)
  useEffect(() => { getProviders().then(setProv) }, [])
  const term = useRef('')
  const load = async (query: string, p: number, src: Source = source, fs: FreeSrc = freeSrc) => {
    setBusy(true); setErr('')
    try {
      let res: Photo[]
      if (src !== 'free') {
        if (!query) { setItems([]); setBusy(false); return }
        const r = await api.searchPhotos(src, await toEnglishIfNeeded(query, src), p)
        res = r.results.map((x) => ({ id: x.id, thumb: x.thumb, full: x.url, credit: `${x.author} / ${SRC_NAME[src]}`, w: x.w, h: x.h, src: x.provider, author: x.author, authorUrl: x.authorUrl, pageUrl: x.pageUrl, downloadLocation: x.downloadLocation }))
      } else if (fs === 'wikimedia') res = await searchWikimedia(query, p)
      else res = query ? await searchOpenverse(query, p) : await listPicsum(p)
      setItems((prev) => (p === 1 ? res : [...prev, ...res]))
      setPage(p)
    } catch (e: any) { setErr(e?.message ?? String(e)) }
    finally { setBusy(false) }
  }
  useEffect(() => { load('', 1) }, [])
  const add = async (ph: Photo) => {
    setAdding(ph.id); setErr('')
    if (ph.src === 'pixabay') {
      // Pixabay の URL は恒久利用できず、CORS も Referer 制限もあるので、サーバー経由で取って自分の素材庫に保存する
      try {
        const r = await fetch(pixabayRelay(ph.full))
        if (!r.ok) throw new Error(String(r.status))
        const { id, url } = await putAsset(await downscale(await r.blob()))
        const o = (await ed.addImageURL(url, id)) as any
        if (o) { o.credit = { author: ph.author, authorUrl: ph.authorUrl, pageUrl: ph.pageUrl, source: 'Pixabay' }; ed.commit() }
      } catch { setErr('この写真は取り込めませんでした。別の写真を選んでください') }
      finally { setAdding('') }
      return
    }
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
      // 元画像は提供元によって CORS で拒否される(fetch が例外になる)ので、その場合は Openverse 経由のサムネイルに切り替える
      let r: Response
      try { r = await fetch(ph.full); if (!r.ok) throw new Error(String(r.status)) } catch { r = await fetch(ph.thumb) }
      const blob = await downscale(await r.blob())
      const { id, url } = await putAsset(blob)
      const o = (await ed.addImageURL(url, id)) as any
      // 表記は不要なライセンスだが、出所を残す(ツールバーのクレジットチップに出る)
      if (o && ph.credit0) { o.credit = { author: ph.credit0.author ?? '不明', pageUrl: ph.credit0.pageUrl, source: ph.credit0.source }; ed.commit() }
    } catch {
      setErr('この写真は取り込めませんでした(提供元の制限)。別の写真を選んでください')
    } finally { setAdding('') }
  }
  return (
    <>
      {(prov?.unsplash || prov?.pexels || prov?.pixabay) && (
        <div className="row src-tabs">
          <button className={'chip' + (source === 'free' ? ' on' : '')} onClick={() => { setSource('free'); setItems([]); load(term.current, 1, 'free') }}>無料素材</button>
          {prov.unsplash && <button className={'chip' + (source === 'unsplash' ? ' on' : '')} onClick={() => { setSource('unsplash'); setItems([]); if (term.current) load(term.current, 1, 'unsplash') }}>Unsplash</button>}
          {prov.pexels && <button className={'chip' + (source === 'pexels' ? ' on' : '')} onClick={() => { setSource('pexels'); setItems([]); if (term.current) load(term.current, 1, 'pexels') }}>Pexels</button>}
          {prov.pixabay && <button className={'chip' + (source === 'pixabay' ? ' on' : '')} onClick={() => { setSource('pixabay'); setItems([]); if (term.current) load(term.current, 1, 'pixabay') }}>Pixabay</button>}
        </div>
      )}
      {source === 'free' && (
        <div className="row src-tabs">
          <button className={'chip' + (freeSrc === 'openverse' ? ' on' : '')} onClick={() => { setFreeSrc('openverse'); setItems([]); load(term.current, 1, 'free', 'openverse') }}>Openverse</button>
          <button className={'chip' + (freeSrc === 'wikimedia' ? ' on' : '')} onClick={() => { setFreeSrc('wikimedia'); setItems([]); load(term.current, 1, 'free', 'wikimedia') }}>Wikimedia Commons</button>
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); term.current = q; load(q, 1) }}>
        <input className="search" placeholder="写真を検索(例: コーヒー、海、business)" value={q} onChange={(e) => setQ(e.target.value)} />
      </form>
      {source === 'pixabay' && <p className="hint">Pixabay の素材(Pixabay Content License・商用可・表記不要)。出典: <a href="https://pixabay.com/" target="_blank" rel="noopener noreferrer">Pixabay</a></p>}
      <p className="hint">{source === 'free' && freeSrc === 'wikimedia' ? 'Wikimedia Commons の CC0・パブリックドメインのみ(表記不要・商用可)。人物・商標・建造物などの権利が写り込んでいる場合があるので、使う前に出典ページで確認してください' : term.current ? '検索結果は CC0・パブリックドメインのみ(表記不要・商用可)' : 'おすすめ写真(Unsplash License・商用可)。キーワードで検索もできます'}。フレームを選んでからクリックすると枠の中に入ります。</p>
      {err && <p className="error">{err}</p>}
      <div className="photo-grid">
        {items.map((p) => (
          <button key={p.id} className={'photo' + (adding === p.id ? ' busy' : '')} draggable onDragStart={dragAdd(() => add(p))} onClick={() => add(p)} title={p.credit}>
            <img src={p.thumb} alt="" loading="lazy" referrerPolicy={p.src === 'pixabay' ? 'origin' : undefined} />
            {p.author && <span className="photo-credit" onClick={(e) => e.stopPropagation()}>Photo by <a href={p.authorUrl} target="_blank" rel="noopener noreferrer">{p.author}</a> on <a href={p.pageUrl} target="_blank" rel="noopener noreferrer">{p.src === 'unsplash' ? 'Unsplash' : p.src === 'pixabay' ? 'Pixabay' : 'Pexels'}</a></span>}
          </button>
        ))}
      </div>
      {!busy && items.length === 0 && !err && <p className="hint">見つかりませんでした。英語でも試してみてください。</p>}
      {items.length > 0 && <button className="chip wide" disabled={busy} onClick={() => load(term.current, page + 1)}>{busy ? '読み込み中…' : 'もっと見る'}</button>}
    </>
  )
}
