import { FabricImage, Textbox } from 'fabric'
import { LayoutTemplate, Shapes, Type, Upload, PaintBucket, Layers, Eye, EyeOff, Lock, ImagePlus, Image as ImageIcon, Table, BarChart3, QrCode, PieChart, LineChart, Palette, X, Plus, PenLine, Highlighter, MousePointer2, FileUp, Film, Music as MusicIcon } from 'lucide-react'
import { COLLAGE_LAYOUTS, buildCollage } from '../features/collage'
import { addUserFont, userFontNames, loadUserFonts, onUserFontsChange } from '../features/userFonts'
import { listBrands, getActiveBrandId, setActiveBrand, createBrand, onBrandsChange } from '../features/brands'
import { toast } from 'sonner'
import { getBrand, saveBrand, onBrandChange, type BrandKit } from '../editor/brand'
import { putAsset, downscale } from '../editor/assets'
import { FRAME_SHAPES, makeFrame, makeTable, makeChart, makeQR, CHART_COLORS, frameShape } from '../editor/elements'
import { PhotosTab } from './Photos'
import { VideosTab } from './Videos'
import { MusicTab } from './Music'
import type { DesignAudio } from '../editor/types'
import { dragAdd } from '../editor/dnd'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { EditorCore } from '../editor/core'
import { renderPage } from '../editor/core'
import { idbAll } from '../editor/idb'
import { getAssetURL } from '../editor/assets'
import { SHAPES } from '../data/shapes'
import { TEMPLATES, TEMPLATE_CATEGORIES, templateToJSON, pageCount, pageOf, type Template } from '../data/templates'
import { FONTS } from '../data/fonts'
import { GRADIENTS, PALETTE } from './ColorPicker'
import './Graphics.css'

export type Tab = 'templates' | 'elements' | 'photos' | 'videos' | 'music' | 'text' | 'draw' | 'brand' | 'uploads' | 'background' | 'layers'
export const TABS: [Tab, string, React.ReactNode][] = [
  ['templates', 'テンプレート', <LayoutTemplate size={22} />],
  ['elements', '素材', <Shapes size={22} />],
  ['photos', '写真', <ImageIcon size={22} />],
  ['videos', '動画', <Film size={22} />],
  ['music', '音楽', <MusicIcon size={22} />],
  ['text', 'テキスト', <Type size={22} />],
  ['draw', '描く', <PenLine size={22} />],
  ['brand', 'ブランド', <Palette size={22} />],
  ['uploads', 'アップロード', <Upload size={22} />],
  ['background', '背景', <PaintBucket size={22} />],
  ['layers', 'レイヤー', <Layers size={22} />],
]

const thumbCache = new Map<string, string>()
export function TemplateThumb({ t, width = 160, page = 0 }: { t: Template; width?: number; page?: number }) {
  const key = t.id + ':' + page
  const [url, setUrl] = useState(thumbCache.get(key))
  useEffect(() => {
    if (url) return
    let alive = true
    renderPage(templateToJSON(t, t.w, t.h, page), t.w, t.h, { multiplier: 320 / t.w, format: 'jpeg', quality: 0.85 }).then((u) => {
      thumbCache.set(key, u); if (alive) setUrl(u)
    }).catch(() => {})
    return () => { alive = false }
  }, [t, url, page, key])
  return url ? <img src={url} alt={t.name} style={{ width, aspectRatio: `${t.w}/${t.h}` }} /> : <div className="thumb-ph" style={{ width, aspectRatio: `${t.w}/${t.h}` }} />
}

export type ApplyMode = 'replace' | 'new' | 'all'
export function LeftPanel({ tab, ed, onApplyTemplate, version, audio, onAudio }: { tab: Tab; ed: EditorCore; onApplyTemplate: (t: Template, mode?: ApplyMode, page?: number) => void; version: number; audio?: DesignAudio; onAudio?: (a: DesignAudio | undefined) => void }) {
  return (
    <div className="side-panel">
      {tab === 'templates' && <TemplatesTab ed={ed} onApply={onApplyTemplate} />}
      {tab === 'elements' && <ElementsTab ed={ed} />}
      {tab === 'photos' && <PhotosTab ed={ed} />}
      {tab === 'videos' && <VideosTab ed={ed} />}
      {tab === 'music' && <MusicTab audio={audio} onAudio={(a) => onAudio?.(a)} />}
      {tab === 'text' && <TextTab ed={ed} />}
      {tab === 'brand' && <BrandTab ed={ed} />}
      {tab === 'draw' && <DrawTab ed={ed} />}
      {tab === 'uploads' && <UploadsTab ed={ed} />}
      {tab === 'background' && <BackgroundTab ed={ed} />}
      {tab === 'layers' && <LayersTab ed={ed} version={version} />}
    </div>
  )
}

function TemplatesTab({ ed, onApply }: { ed: EditorCore; onApply: (t: Template, mode?: ApplyMode, page?: number) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<Template | null>(null)
  const ratio = ed.width / ed.height
  // 今のページと縦横比が近いものを先に
  const list = useMemo(() => [...TEMPLATES]
    .filter((t) => !q || (t.name + t.category + (t.tags ?? []).join(' ')).includes(q))
    .sort((a, b) => Math.abs(a.w / a.h - ratio) - Math.abs(b.w / b.h - ratio)), [q, ratio])
  if (open) {
    // 複数ページのテンプレ: ページを選んで適用(Canva と同じ流れ)
    return (
      <>
        <button className="link-btn" onClick={() => setOpen(null)}>← テンプレート一覧</button>
        <div className="panel-title" style={{ marginTop: 8 }}>{open.name}<small className="hint">{pageCount(open)} ページ</small></div>
        <button className="primary-btn wide" onClick={() => onApply(open, 'all')}><Plus size={14} />全 {pageCount(open)} ページを追加</button>
        <p className="hint">ページをクリックすると今のページに適用(取り消し可)、「+」で新しいページとして追加します。</p>
        <div className="tpl-grid">
          {Array.from({ length: pageCount(open) }, (_, i) => (
            <div key={i} className="tpl-card-wrap">
              <button className="tpl-card" onClick={() => onApply(open, 'replace', i)}><div className="tpl-media"><TemplateThumb t={open} page={i} width={140} /></div><span className="t-meta">{i + 1}. {pageOf(open, i).label ?? ''}</span></button>
              <button className="tpl-add" title="新しいページとして追加" onClick={() => onApply(open, 'new', i)}><Plus size={14} /></button>
            </div>
          ))}
        </div>
      </>
    )
  }
  return (
    <>
      <input className="search" placeholder="テンプレートを検索(業種・用途)" value={q} onChange={(e) => setQ(e.target.value)} />
      <p className="hint">クリックで今のページに適用(取り消し可)。複数ページのテンプレはページを選べます。「+」で新しいページとして追加。</p>
      <div className="tpl-grid">
        {list.map((t) => (
          <div key={t.id} className="tpl-card-wrap">
            <button className="tpl-card" onClick={() => (pageCount(t) > 1 ? setOpen(t) : onApply(t))} title={`${t.category} / ${t.name}`}>
              <div className="tpl-media"><TemplateThumb t={t} width={140} />{pageCount(t) > 1 && <span className="tpl-badge">{pageCount(t)}p</span>}</div>
              <span className="t-name">{t.name}</span>
            </button>
            <button className="tpl-add" title="新しいページとして追加" onClick={() => onApply(t, 'new')}><Plus size={14} /></button>
          </div>
        ))}
      </div>
      <p className="hint">カテゴリ: {TEMPLATE_CATEGORIES.join(' / ')}</p>
    </>
  )
}

function frameSvg(shape: string) {
  // プレビュー用: 形の SVG を作る
  const o = frameShape(shape, 100, 100) as any
  if (o.type === 'rect') return `<svg viewBox="-50 -50 100 100"><rect x="-50" y="-50" width="100" height="100" rx="${o.rx ?? 0}" fill="#d4d4d8"/></svg>`
  return `<svg viewBox="-55 -55 110 110"><g transform="scale(${o.scaleX ?? 1},${o.scaleY ?? 1}) translate(${-(o.pathOffset?.x ?? 0)},${-(o.pathOffset?.y ?? 0)})"><path d="${(o.path ?? []).map((c: any[]) => c.join(' ')).join(' ')}" fill="#d4d4d8" fill-rule="evenodd"/></g></svg>`
}

function ElementsTab({ ed }: { ed: EditorCore }) {
  const [q, setQ] = useState('')
  const groups = [...new Set(SHAPES.map((s) => s.group))]
  const size = Math.round(Math.min(ed.width, ed.height) * 0.4)
  const addFrame = (id: string) => ed.place(makeFrame(id, size))
  const addTable = (rows: number, cols: number) => {
    const g = makeTable({ rows, cols, header: '#7c3aed', border: '#d4d4d8' })
    const s = Math.min(1, (ed.width * 0.8) / g.width)
    g.set({ scaleX: s, scaleY: s })
    ed.place(g)
  }
  const addChart = (type: 'bar' | 'line' | 'pie' | 'donut' | 'hbar') => {
    const g = makeChart({ type, labels: ['1月', '2月', '3月', '4月', '5月'], values: [30, 52, 41, 68, 75], colors: type === 'line' ? ['#7c3aed'] : CHART_COLORS, title: 'グラフのタイトル', w: 640, h: 420 })
    const s = Math.min(ed.width * 0.7, ed.height * 0.7 * (640 / 420)) / 640
    g.set({ scaleX: s, scaleY: s })
    ed.place(g)
  }
  const addQR = () => ed.place(makeQR('https://example.com', '#111827', Math.min(ed.width, ed.height) * 0.3))
  return (
    <>
      <input className="search" placeholder="素材を検索(例: 星、矢印、フレーム)" value={q} onChange={(e) => setQ(e.target.value)} />
      <IconsSection ed={ed} query={q} />
      <GraphicsSection ed={ed} query={q} />
      {groups.map((g) => {
        const items = SHAPES.filter((s) => s.group === g && (!q || (s.label + s.group).includes(q)))
        if (!items.length) return null
        return (
          <div key={g}>
            <div className="sec-title">{g}</div>
            <div className="shape-grid">
              {items.map((s) => (
                <button key={s.id} className="shape-btn" title={s.label} draggable onDragStart={dragAdd((e) => e.addShape(s.make))} onClick={() => ed.addShape(s.make)} dangerouslySetInnerHTML={{ __html: s.preview }} />
              ))}
            </div>
          </div>
        )
      })}
      {(!q || 'フレーム写真枠'.includes(q)) && <>
        <div className="sec-title">フレーム(写真を型抜き)</div>
        <p className="hint">フレームを選んだ状態で写真やアップロード画像をクリックすると、枠の中に入ります。</p>
        <div className="shape-grid">
          {FRAME_SHAPES.map((f) => <button key={f.id} className="shape-btn" title={f.label} draggable onDragStart={dragAdd((e) => e.place(makeFrame(f.id, size)))} onClick={() => addFrame(f.id)} dangerouslySetInnerHTML={{ __html: frameSvg(f.shape) }} />)}
        </div>
      </>}
      {(!q || '写真グリッドコラージュフレーム'.includes(q)) && <>
        <div className="sec-title">写真グリッド・コラージュ</div>
        <p className="hint">ページいっぱいに写真フレームを並べます。各フレームを選んで写真をクリックすると入ります。</p>
        <div className="collage-grid">
          {COLLAGE_LAYOUTS.map((l) => (
            <button key={l.id} className="collage-btn" title={l.label} onClick={() => {
              const objs = buildCollage(l.id, ed.width, ed.height, Math.round(Math.min(ed.width, ed.height) * 0.015), 0)
              for (const o of objs) { (o as any).id = Math.random().toString(36).slice(2, 10); ed.canvas.add(o) }
              ed.canvas.requestRenderAll(); ed.commit(); toast.success(`${l.label}(${l.count}枚)を配置しました`)
            }}>
              <svg viewBox="0 0 100 100">{l.cells.map((c: any, i: number) => <rect key={i} x={c.x * 100 + 2} y={c.y * 100 + 2} width={Math.max(1, c.w * 100 - 4)} height={Math.max(1, c.h * 100 - 4)} rx="3" />)}</svg>
            </button>
          ))}
        </div>
      </>}
      {(!q || '表グラフチャートQRコード'.includes(q)) && <>
        <div className="sec-title">表・グラフ・QRコード</div>
        <div className="grid2">
          <button className="tool-tile" onClick={() => addTable(3, 3)}><Table size={20} />表 3×3</button>
          <button className="tool-tile" onClick={() => addTable(4, 2)}><Table size={20} />表 4×2</button>
          <button className="tool-tile" onClick={() => addChart('bar')}><BarChart3 size={20} />棒グラフ</button>
          <button className="tool-tile" onClick={() => addChart('hbar')}><BarChart3 size={20} style={{ transform: 'rotate(90deg)' }} />横棒グラフ</button>
          <button className="tool-tile" onClick={() => addChart('line')}><LineChart size={20} />折れ線グラフ</button>
          <button className="tool-tile" onClick={() => addChart('pie')}><PieChart size={20} />円グラフ</button>
          <button className="tool-tile" onClick={() => addChart('donut')}><PieChart size={20} />ドーナツ</button>
          <button className="tool-tile" onClick={addQR}><QrCode size={20} />QRコード</button>
        </div>
      </>}
    </>
  )
}

/** アイコン・イラスト(データ層は src/data/icons.ts)。セットは 40 超あるので、検索の範囲を選べる:
 *  core = おすすめセット横断(index.json の core: true)/ all = 全セット横断(重い・段階的に表示)/ セット ID = そのセットだけ */
function IconsSection({ ed, query }: { ed: EditorCore; query: string }) {
  const [sets, setSets] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [scope, setScope] = useState<string>('core')
  const [limit, setLimit] = useState(60)
  const [progress, setProgress] = useState('')
  const [err, setErr] = useState('')
  const mod = useRef<any>(null)
  useEffect(() => {
    import('../data/icons').then(async (m) => { mod.current = m; setSets(await m.loadIconIndex()) }).catch(() => setErr('アイコンを読み込めませんでした'))
  }, [])
  useEffect(() => { setLimit(60) }, [query, scope])
  useEffect(() => {
    const m = mod.current
    if (!m || !sets.length) return
    let alive = true
    const browseId = scope === 'core' || scope === 'all' ? sets[0].id : scope
    const t = setTimeout(async () => {
      try {
        setProgress('')
        if (!query) { const all = await m.loadIconSet(browseId); if (alive) setItems(all.slice(0, limit)); return }
        if (scope !== 'all') {
          const ids = scope === 'core' ? sets.filter((x) => x.core).map((x) => x.id) : [scope]
          const r = await m.searchIcons(query, ids, limit)
          if (alive) setItems(r)
          return
        }
        // 全セット: 小さいセットから順に読み込み、見つかった分を順次表示する
        const order = [...sets].sort((x, y) => x.bytes - y.bytes)
        const done: string[] = []
        for (const x of order) {
          if (!alive) return
          setProgress(`全セットを検索中… ${done.length}/${order.length}`)
          await m.loadIconSet(x.id)
          done.push(x.id)
          const r = await m.searchIcons(query, done, limit)
          if (alive) setItems(r)
        }
        if (alive) setProgress('')
      } catch { if (alive) setErr('アイコンを読み込めませんでした') }
    }, 200)
    return () => { alive = false; clearTimeout(t) }
  }, [query, scope, sets, limit])
  const add = async (it: any) => {
    const m = mod.current
    const { svgToObject } = await import('../editor/svg')
    const o = await svgToObject(m.iconSvg(it, it.color ? undefined : '#1f2937'), Math.min(ed.width, ed.height) * 0.25)
    ;(o as any).name = it.name
    ed.place(o)
  }
  if (err) return <p className="error">{err}</p>
  if (!sets.length) return null
  const m = mod.current
  const total = sets.reduce((a, x) => a + x.count, 0)
  return (
    <div>
      <div className="sec-title">{query ? `アイコン・イラストの検索結果(${items.length})` : `アイコン・イラスト(全 ${total.toLocaleString()} 点)`}</div>
      <select className="font-select" style={{ width: '100%', maxWidth: 'none', margin: '4px 0 8px' }} value={scope} onChange={(e) => setScope(e.target.value)} title="検索するセット">
        <option value="core">おすすめセットを横断して検索</option>
        <option value="all">全セットを横断して検索(初回は重い)</option>
        <optgroup label="カラー・絵文字・イラスト">{sets.filter((x) => x.color).map((x) => <option key={x.id} value={x.id}>{x.name}({x.count.toLocaleString()})</option>)}</optgroup>
        <optgroup label="線・塗り(色を変えられる)">{sets.filter((x) => !x.color).map((x) => <option key={x.id} value={x.id}>{x.name}({x.count.toLocaleString()})</option>)}</optgroup>
      </select>
      {progress && <p className="hint">{progress}</p>}
      <div className="icon-grid">
        {items.map((it) => <button key={it.set + it.name} className="icon-btn-big" title={it.name} draggable onDragStart={dragAdd(() => add(it))} onClick={() => add(it)} dangerouslySetInnerHTML={{ __html: m.iconSvg(it, it.color ? undefined : '#3f3f46') }} />)}
      </div>
      {items.length >= limit && <button className="chip wide" onClick={() => setLimit(limit + 240)}>もっと見る</button>}
    </div>
  )
}

/** パターン・グラデーション・ブロブ・装飾(src/data/graphics。すべてコード生成の自作素材) */
function GraphicsSection({ ed, query }: { ed: EditorCore; query: string }) {
  const [mod, setMod] = useState<typeof import('../data/graphics') | null>(null)
  const [group, setGroup] = useState<'pattern' | 'gradient' | 'blob' | 'decor'>('pattern')
  const [sub, setSub] = useState('')
  const [limit, setLimit] = useState(48)
  useEffect(() => { import('../data/graphics').then(setMod) }, [])
  useEffect(() => { setLimit(48) }, [group, sub, query])
  const all = useMemo(() => (mod ? mod.allGraphics() : []), [mod])
  const q = query.normalize('NFKC').trim().toLowerCase()
  const items = useMemo(() => all.filter((g) => (q ? g.label.toLowerCase().includes(q) : g.group === group && (!sub || g.sub === sub))), [all, q, group, sub])
  if (!mod) return null
  const subs = group === 'pattern' ? mod.PATTERN_TYPES.map((t) => [t.id, t.label] as [string, string]) : group === 'decor' ? mod.DECOR_SUBS : []
  const add = async (it: any) => {
    const { svgToObject } = await import('../editor/svg')
    if (it.bg) {
      // ページ全面の背景素材: ページ大で作って中央に置き、最背面へ
      const o = await svgToObject(it.svg(ed.width, ed.height), Math.max(ed.width, ed.height))
      ;(o as any).name = it.label
      ed.place(o)
      await ed.enqueue(async () => {})
      ed.order('back')
    } else {
      const o = await svgToObject(it.svg(100, 100), Math.min(ed.width, ed.height) * 0.3)
      ;(o as any).name = it.label
      ed.place(o)
    }
  }
  return (
    <div>
      <div className="sec-title">{q ? `パターン・装飾の検索結果(${items.length})` : `パターン・背景・装飾(全 ${all.length} 点)`}</div>
      {!q && (
        <>
          <div className="gfx-chips">{mod.GRAPHIC_GROUPS.map(([id, label]) => <button key={id} className={'chip' + (group === id ? ' on' : '')} onClick={() => { setGroup(id); setSub('') }}>{label}</button>)}</div>
          {subs.length > 0 && <div className="gfx-chips"><button className={'chip' + (!sub ? ' on' : '')} onClick={() => setSub('')}>すべて</button>{subs.map(([id, label]) => <button key={id} className={'chip' + (sub === id ? ' on' : '')} onClick={() => setSub(id)}>{label}</button>)}</div>}
        </>
      )}
      {items.length === 0 && q && <p className="hint">見つかりませんでした(例: ドット、波、リボン、吹き出し)</p>}
      <div className="gfx-grid">
        {items.slice(0, limit).map((it) => <button key={it.id} className={'gfx-btn' + (it.bg ? '' : ' pad')} title={it.label} draggable onDragStart={dragAdd(() => add(it))} onClick={() => add(it)} dangerouslySetInnerHTML={{ __html: it.svg(100, 100) }} />)}
      </div>
      {items.length > limit && <button className="chip wide" style={{ marginTop: 6 }} onClick={() => setLimit(limit + 48)}>もっと見る({items.length - limit})</button>}
      {group === 'pattern' && !q && <p className="hint">パターン・グラデーションはページ全面に敷かれ、最背面に置かれます。</p>}
    </div>
  )
}

const TEXT_PRESETS = [
  { label: '見出しを追加', text: '見出し', fontSize: 96, fontWeight: 900, css: { fontSize: 26, fontWeight: 900 } },
  { label: '小見出しを追加', text: '小見出し', fontSize: 56, fontWeight: 700, css: { fontSize: 19, fontWeight: 700 } },
  { label: '本文を追加', text: '本文のテキストを入力してください', fontSize: 32, fontWeight: 400, css: { fontSize: 14 } },
]
const COMBOS = [
  { text: 'SALE', fontFamily: 'Dela Gothic One', fontSize: 140, fill: '#e63946' },
  { text: 'Thank you', fontFamily: 'Pacifico', fontSize: 110, fill: '#264653' },
  { text: 'ありがとう', fontFamily: 'Hachi Maru Pop', fontSize: 100, fill: '#f472b6' },
  { text: 'NEW OPEN', fontFamily: 'Bebas Neue', fontSize: 150, fill: '#111827' },
  { text: '期間限定', fontFamily: 'RocknRoll One', fontSize: 110, fill: '#f97316' },
  { text: '和の心', fontFamily: 'Shippori Mincho', fontSize: 120, fontWeight: 800, fill: '#7c2d12' },
  { text: 'おしらせ', fontFamily: 'Mochiy Pop One', fontSize: 100, fill: '#0ea5e9' },
  { text: 'Elegant', fontFamily: 'Playfair Display', fontSize: 120, fontWeight: 700, fill: '#1f2937' },
]
function TextTab({ ed }: { ed: EditorCore }) {
  return (
    <>
      {TEXT_PRESETS.map((p) => (
        <button key={p.label} className="text-preset" style={p.css} draggable onDragStart={dragAdd((e) => e.addText(p))} onClick={() => ed.addText(p)}>{p.label}</button>
      ))}
      <button className="text-preset vertical-preset" draggable onDragStart={dragAdd((e) => e.addVText())} onClick={() => ed.addVText()}><span>縦書きの見出しを追加</span></button>
      <button className="text-preset" style={{ fontSize: 14 }} draggable onDragStart={dragAdd((e) => e.addVText('縦書きの本文です。\n改行すると次の列になります。2026年10月6日', { fontSize: 32, fontWeight: 400 }))} onClick={() => ed.addVText('縦書きの本文です。\n改行すると次の列になります。2026年10月6日', { fontSize: 32, fontWeight: 400 })}>縦書きの本文を追加</button>
      <div className="sec-title">フォントの組み合わせ</div>
      <div className="combo-grid">
        {COMBOS.map((c) => (
          <button key={c.text} className="combo" style={{ fontFamily: c.fontFamily, color: c.fill, fontWeight: c.fontWeight ?? 400 }} onClick={() => ed.addText(c)}>{c.text}</button>
        ))}
      </div>
      <UserFonts ed={ed} />
      <div className="sec-title">フォント一覧(クリックで追加)</div>
      <div className="font-list">
        {FONTS.map((f) => (
          <button key={f.family} className="font-item" style={{ fontFamily: f.family }} onClick={() => ed.addText({ text: f.jp ? 'テキスト' : 'Text', fontSize: 72, fontFamily: f.family })}>{f.label}</button>
        ))}
      </div>
    </>
  )
}

function UploadsTab({ ed }: { ed: EditorCore }) {
  const [items, setItems] = useState<{ id: string; url: string }[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const load = async () => {
    const all = await idbAll<{ id: string; createdAt: number }>('assets')
    all.sort((a, b) => b.createdAt - a.createdAt)
    const list = await Promise.all(all.map(async (a) => ({ id: a.id, url: (await getAssetURL(a.id)) ?? '' })))
    setItems(list.filter((x) => x.url))
  }
  useEffect(() => { load() }, [])
  const onFiles = async (files: FileList | null) => {
    if (!files) return
    setBusy(true); setErr('')
    for (const f of Array.from(files)) {
      try { await ed.addImageFile(f) } catch (e: any) { setErr(`${f.name}: 読み込めませんでした(${e?.message ?? e})`) }
    }
    setBusy(false); load()
  }
  return (
    <>
      <label className="upload-btn">
        <ImagePlus size={18} /> {busy ? '読み込み中…' : '画像をアップロード'}
        <input type="file" accept="image/*" multiple hidden onChange={(e) => { onFiles(e.target.files); e.target.value = '' }} />
      </label>
      <p className="hint">画像はキャンバスにドラッグ&ドロップ、またはコピーして ⌘V でも追加できます。データはこのブラウザの中だけに保存されます。</p>
      {err && <p className="error">{err}</p>}
      <div className="upload-grid">
        {items.map((it) => (
          <button key={it.id} className="upload-item" onClick={() => ed.addImageURL(it.url, it.id)}><img src={it.url} alt="" /></button>
        ))}
      </div>
    </>
  )
}

function BackgroundTab({ ed }: { ed: EditorCore }) {
  return (
    <>
      <div className="sec-title">背景色</div>
      <div className="swatches big">
        {PALETTE.map((c) => <button key={c} className="swatch-btn" style={{ background: c }} onClick={() => ed.setBackground(c)} />)}
        <input type="color" onChange={(e) => ed.setBackground(e.target.value)} title="自由に選ぶ" />
      </div>
      <div className="sec-title">グラデーション</div>
      <div className="swatches big">
        {GRADIENTS.map((g) => <button key={g.join()} className="swatch-btn" style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})` }} onClick={() => ed.setFillGradient(g, 45, 'background')} />)}
      </div>
      <div className="sec-title">背景に画像を敷く</div>
      <label className="upload-btn">
        <ImagePlus size={18} /> 画像を選ぶ
        <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) ed.setBackgroundImage(f); e.target.value = '' }} />
      </label>
    </>
  )
}

function LayersTab({ ed }: { ed: EditorCore; version: number }) {
  const objs = [...ed.canvas.getObjects()].reverse()
  const sel = new Set(ed.selected())
  const label = (o: any) => {
    if (o.name) return o.name
    if (o instanceof Textbox) return '「' + o.text.slice(0, 14) + '」'
    if (o instanceof FabricImage) return '画像'
    return ({ Rect: '四角形', Circle: '円', Ellipse: '楕円', Path: '図形', Group: 'グループ', Polygon: '多角形', Line: '線' } as any)[o.type] ?? o.type
  }
  if (!objs.length) return <p className="hint">まだ何もありません</p>
  return (
    <div className="layers">
      <p className="hint">上にあるものほど前面です。ドラッグで並べ替え。</p>
      {objs.map((o: any, i) => (
        <div key={o.id ?? i} className={'layer' + (sel.has(o) ? ' sel' : '')} draggable
          onDragStart={(e) => e.dataTransfer.setData('text/plain', String(i))}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { const from = +e.dataTransfer.getData('text/plain'); const fromObj = objs[from]; ed.moveLayer(fromObj, objs.length - 1 - i) }}
          onClick={() => ed.selectObjects([o])}>
          <span className="layer-name">{label(o)}</span>
          {o.locked && <Lock size={14} />}
          <button className="icon-btn" title={o.visible === false ? '表示' : '非表示'} onClick={(e) => { e.stopPropagation(); o.set('visible', o.visible === false); ed.canvas.requestRenderAll(); ed.commit() }}>
            {o.visible === false ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      ))}
    </div>
  )
}

function BrandTab({ ed }: { ed: EditorCore }) {
  const [b, setB] = useState<BrandKit | null>(null)
  const [logos, setLogos] = useState<{ id: string; url: string }[]>([])
  const [color, setColor] = useState('#7c3aed')
  useEffect(() => {
    const load = async () => {
      const k = await getBrand(); setB({ ...k })
      setLogos((await Promise.all(k.logos.map(async (id) => ({ id, url: (await getAssetURL(id)) ?? '' })))).filter((x) => x.url))
    }
    load()
    return onBrandChange(load)
  }, [])
  if (!b) return null
  const sel = ed.selected()
  const applyFont = async (family: string, size: number, weight: number) => {
    const texts = sel.filter((o) => o instanceof Textbox)
    if (texts.length) await ed.setFont(family)
    else await ed.addText({ text: size > 60 ? '見出し' : '本文のテキスト', fontSize: size, fontWeight: weight, fontFamily: family })
  }
  return (
    <>
      <BrandSwitcher />
      <p className="hint">よく使う色・フォント・ロゴを登録しておくと、どのデザインでもすぐ使えます。登録した色は色選びの一番上に出ます。</p>
      <div className="sec-title">ブランドカラー</div>
      <div className="swatches big">
        {b.colors.map((c) => (
          <div key={c} className="brand-swatch">
            <button className="swatch-btn" style={{ background: c }} title={`${c}(選択中のものに適用)`} onClick={() => sel.length ? ed.setProp({ fill: c }) : ed.setBackground(c)} />
            <button className="x" title="削除" onClick={() => saveBrand({ colors: b.colors.filter((x) => x !== c) })}><X size={10} /></button>
          </div>
        ))}
      </div>
      <div className="row">
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        <button className="chip" onClick={() => !b.colors.includes(color) && saveBrand({ colors: [...b.colors, color] })}>色を追加</button>
        <button className="chip" onClick={() => {
          // 今のページで使われている色をまとめて登録
          const found = new Set<string>()
          const walk = (o: any) => { for (const k of ['fill', 'stroke']) if (typeof o[k] === 'string' && /^#[0-9a-f]{6}$/i.test(o[k])) found.add(o[k].toLowerCase()); o.objects?.forEach(walk) }
          ed.toJSON().objects.forEach(walk)
          saveBrand({ colors: [...new Set([...b.colors, ...found])].slice(0, 24) })
        }}>このページの色を取り込む</button>
      </div>
      <div className="sec-title">ブランドフォント</div>
      {(['headingFont', 'bodyFont'] as const).map((k) => (
        <div key={k} className="brand-font">
          <span>{k === 'headingFont' ? '見出し' : '本文'}</span>
          <select className="font-select" value={b[k]} onChange={(e) => saveBrand({ [k]: e.target.value })}>
            <option value="">(未設定)</option>
            {FONTS.map((f) => <option key={f.family} value={f.family}>{f.label}</option>)}
          </select>
          {b[k] && <button className="chip" style={{ fontFamily: b[k] }} onClick={() => applyFont(b[k], k === 'headingFont' ? 96 : 32, k === 'headingFont' ? 700 : 400)}>{sel.length ? '適用' : '追加'}</button>}
        </div>
      ))}
      <div className="sec-title">ロゴ</div>
      <label className="upload-btn">
        <ImagePlus size={18} /> ロゴを登録
        <input type="file" accept="image/*" hidden onChange={async (e) => {
          const f = e.target.files?.[0]; e.target.value = ''
          if (!f) return
          const { id } = await putAsset(await downscale(f, 1600))
          await saveBrand({ logos: [...b.logos, id] })
        }} />
      </label>
      <div className="upload-grid" style={{ marginTop: 8 }}>
        {logos.map((l) => (
          <div key={l.id} className="brand-swatch">
            <button className="upload-item contain" onClick={() => ed.addImageURL(l.url, l.id)}><img src={l.url} alt="" /></button>
            <button className="x" title="登録を外す" onClick={() => saveBrand({ logos: b.logos.filter((x) => x !== l.id) })}><X size={10} /></button>
          </div>
        ))}
      </div>
    </>
  )
}

function DrawTab({ ed }: { ed: EditorCore }) {
  const [color, setColor] = useState('#111827')
  const [width, setWidth] = useState(6)
  const [kind, setKind] = useState<null | 'pen' | 'marker'>(ed.drawing)
  const set = (k: null | 'pen' | 'marker', c = color, w = width) => { setKind(k); ed.setDrawing(k, c, w) }
  useEffect(() => () => { ed.setDrawing(null) }, [ed]) // パネルを閉じたら描画をやめる
  return (
    <>
      <div className="panel-title">描く</div>
      <div className="grid3">
        <button className={'tool-tile' + (kind === 'pen' ? ' on' : '')} onClick={() => set('pen')}><PenLine size={18} />ペン</button>
        <button className={'tool-tile' + (kind === 'marker' ? ' on' : '')} onClick={() => set('marker')}><Highlighter size={18} />マーカー</button>
        <button className={'tool-tile' + (!kind ? ' on' : '')} onClick={() => set(null)}><MousePointer2 size={18} />選択</button>
      </div>
      <div className="sec-title">色</div>
      <div className="swatches big">{PALETTE.slice(0, 21).map((c) => <button key={c} className="swatch-btn" style={{ background: c, outline: c === color ? '2px solid var(--accent)' : undefined }} onClick={() => { setColor(c); if (kind) set(kind, c) }} />)}</div>
      <label className="slider"><span>太さ</span><input type="range" min={1} max={40} value={width} onChange={(e) => { setWidth(+e.target.value); if (kind) set(kind, color, +e.target.value) }} /><span className="num" style={{ border: 0 }}>{width}</span></label>
      <p className="hint">描いた線は1本ずつ選択・移動・取り消し(⌘Z)できます。描き終えたら「選択」に戻してください。</p>
    </>
  )
}

function UserFonts({ ed }: { ed: EditorCore }) {
  const [names, setNames] = useState<string[]>(userFontNames())
  useEffect(() => { loadUserFonts().then(() => setNames(userFontNames())); return onUserFontsChange(() => setNames(userFontNames())) }, [])
  return (
    <>
      <div className="sec-title">自分のフォント</div>
      <label className="secondary-btn" style={{ cursor: 'pointer' }}><FileUp size={14} />フォントを取り込む(ttf / otf / woff)
        <input type="file" accept=".ttf,.otf,.woff,.woff2" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; try { const n = await addUserFont(f); toast.success(`「${n}」を追加しました`) } catch (er: any) { toast.error(er?.message ?? String(er)) } }} />
      </label>
      {names.length > 0 && <div className="font-list" style={{ marginTop: 6 }}>{names.map((n) => <button key={n} className="font-item" style={{ fontFamily: n }} onClick={() => ed.addText({ text: 'テキスト', fontSize: 72, fontFamily: n })}>{n}</button>)}</div>}
      <p className="hint">取り込んだフォントはこのブラウザの中にだけ保存されます。商用利用などはフォントのライセンスに従ってください。</p>
    </>
  )
}

function BrandSwitcher() {
  const [list, setList] = useState<{ id: string; name: string }[]>([])
  const [active, setActive] = useState('')
  const load = async () => { setList((await listBrands()).map((b: any) => ({ id: b.id, name: b.name }))); setActive(await getActiveBrandId()) }
  useEffect(() => { load(); return onBrandsChange(load) }, [])
  return (
    <div className="row" style={{ marginBottom: 8 }}>
      <select className="font-select" style={{ flex: 1, maxWidth: 'none' }} value={active} onChange={async (e) => { await setActiveBrand(e.target.value); setActive(e.target.value) }}>
        {list.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
      <button className="secondary-btn" onClick={async () => { const n = prompt('新しいブランドキットの名前', `ブランド${list.length + 1}`); if (!n) return; try { const b = await createBrand(n); await setActiveBrand(b.id) } catch (er: any) { toast.error(er?.message ?? String(er)) } }}><Plus size={14} />追加</button>
    </div>
  )
}
