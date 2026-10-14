// フォント選択: Google Fonts 全カタログ(約 1,950 書体)を検索・分類して選ぶ。
// 一覧の各行は、その書体で書体名を描画する(プレビュー用の軽量 CSS をスクロールに応じて読む)。
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { FONTS, loadFontCatalog, ensureFontCss, ensurePreviewCss, type CatalogRow } from '../data/fonts'
import { usePopover } from './ColorPicker'
import './FontPicker.css'

type Entry = { family: string; label: string; cat: string; ja: boolean; weights: number[]; curated: boolean; key: string }
const CATS: [string, string][] = [['', 'すべて'], ['s', 'ゴシック'], ['m', '明朝'], ['h', '手書き'], ['c', '等幅'], ['d', 'ディスプレイ']]
const CAT_LABEL: Record<string, string> = { s: 'ゴシック', m: '明朝', h: '手書き', c: '等幅', d: 'ディスプレイ' }
const PAGE = 40

export function FontPicker({ value, onChange, title = 'フォント' }: { value: string; onChange: (family: string) => void | Promise<void>; title?: string }) {
  const { open, setOpen, ref } = usePopover()
  const [cat, setCat] = useState('')
  const [jaOnly, setJaOnly] = useState(false)
  const [q, setQ] = useState('')
  const [shown, setShown] = useState(PAGE)
  const [busy, setBusy] = useState('')
  const [rows, setRows] = useState<CatalogRow[] | null>(null)
  const sentinel = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)

  useEffect(() => { if (open && !rows) loadFontCatalog().then(setRows).catch(() => setRows([])) }, [open, rows])
  useEffect(() => { setShown(PAGE); list.current?.scrollTo(0, 0) }, [q, cat, jaOnly, open])

  // 既定の 63 書体(日本語名つき)を先頭に、残りを人気順で並べる
  const all = useMemo<Entry[]>(() => {
    if (!rows) return []
    const byName = new Map(rows.map((r) => [r[0], r]))
    const cur = FONTS.map((f): Entry => {
      const r = byName.get(f.family)
      return { family: f.family, label: f.label, cat: r?.[1] ?? 's', ja: f.jp, weights: f.weights, curated: true, key: f.family }
    })
    const seen = new Set(FONTS.map((f) => f.family))
    const rest = rows.filter((r) => !seen.has(r[0])).map((r): Entry => ({ family: r[0], label: r[0], cat: r[1], ja: r[2].split(',').includes('ja'), weights: r[3], curated: false, key: r[0] }))
    return [...cur, ...rest]
  }, [rows])

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    return all.filter((e) => (!cat || e.cat === cat) && (!jaOnly || e.ja) && (!t || e.label.toLowerCase().includes(t) || e.family.toLowerCase().includes(t)))
  }, [all, q, cat, jaOnly])
  const visible = filtered.slice(0, shown)

  // 見えている行のプレビュー CSS を読む
  useEffect(() => {
    if (!open) return
    for (const e of visible) ensurePreviewCss(e.family, sampleOf(e))
  }, [open, visible])

  // 末尾が見えたら次の 40 件
  useEffect(() => {
    if (!open || !sentinel.current || !list.current) return
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) setShown((n) => n + PAGE) }, { root: list.current })
    io.observe(sentinel.current)
    return () => io.disconnect()
  }, [open, filtered.length, shown])

  const pick = async (e: Entry) => {
    setBusy(e.family)
    try {
      await ensureFontCss(e.family) // 先に CSS を読む(未読込のまま適用すると文字幅が代替フォントで確定する)
      await onChange(e.family)
      setOpen(false)
    } finally { setBusy('') }
  }

  return (
    <div className="pop-wrap" ref={ref}>
      <button className={'fp-btn' + (open ? ' on' : '')} title={title} onClick={() => setOpen(!open)} style={{ fontFamily: `"${value}", sans-serif` }}>
        <span>{value}</span><ChevronDown size={14} />
      </button>
      {open && (
        <div className="popover fp-pop">
          <input className="search" autoFocus placeholder={`書体を検索(例: Zen、Roboto、明朝)— 全 ${all.length ? all.length.toLocaleString() : '約1,950'} 書体`} value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="fp-chips">
            <button className={'chip' + (jaOnly ? ' on' : '')} onClick={() => setJaOnly(!jaOnly)}>日本語</button>
            {CATS.map(([id, label]) => <button key={id} className={'chip' + (cat === id ? ' on' : '')} onClick={() => setCat(id)}>{label}</button>)}
          </div>
          <div className="fp-list" ref={list}>
            {!rows && <p className="fp-note">読み込み中…</p>}
            {visible.map((e) => (
              <button key={e.key} className={'fp-row' + (e.family === value ? ' cur' : '')} disabled={!!busy} onClick={() => pick(e)} title={`${e.family}(${CAT_LABEL[e.cat]})`}>
                <span className="fp-sample" style={{ fontFamily: `"${e.family}", sans-serif` }}>{sampleOf(e)}</span>
                <span className="fp-meta">{busy === e.family ? '読み込み中…' : `${e.ja ? '日本語・' : ''}${CAT_LABEL[e.cat]}`}</span>
              </button>
            ))}
            {rows && filtered.length === 0 && <p className="fp-note">見つかりませんでした</p>}
            <div ref={sentinel} style={{ height: 1 }} />
          </div>
          <p className="fp-note">Google Fonts(OFL など商用利用可)。選んだ書体は使うときに読み込まれます。</p>
        </div>
      )}
    </div>
  )
}

/** 一覧の見本。日本語対応なら日本語を添える(日本語名つきの既定書体は label をそのまま) */
function sampleOf(e: Entry) {
  const base = e.curated ? e.label : e.family
  return e.ja ? `${base} あア漢` : base
}
