import { Copy, Pencil, Plus, Trash2, Search, LayoutGrid, Home as HomeIcon, Folder, Bot, Moon, Sun, Presentation, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createDoc, newPageId, repo, newId, type DocSummary } from '../editor/repo'
import { AccountButton, useSession } from './Account'
import { initSession, sessionProblem, isDemo } from '../api/session'
import { isLocal, onLocalEvent } from '../api/local'
import { deleteVersionsOf } from '../editor/versions'
import { storageOk } from '../editor/idb'
import type { DesignDoc } from '../editor/types'
import { SIZES, type SizePreset } from '../data/sizes'
import { TEMPLATES, TEMPLATE_CATEGORIES, templatePagesJSON, pageCount, type Template } from '../data/templates'
import { TemplateThumb } from './LeftPanel'
import { deckThumb } from './DeckEditor'
import { AgentConnect } from './AgentConnect'
import { CommandPalette, openPalette } from './CommandPalette'
import { useTheme } from './theme'
import sampleDeck from '../data/sampleDeck.json'

async function openNew(doc: DesignDoc) {
  doc.updatedAt = await repo.put(doc, { baseUpdatedAt: null })
  location.hash = '#/d/' + doc.id
}
export function createFromTemplate(t: Template) {
  const size = SIZES.find((s) => s.w === t.w && s.h === t.h)
  const d = createDoc(t.name, t.w, t.h, undefined, size?.print)
  d.pages = templatePagesJSON(t).map((json, i) => ({ id: newPageId() + i, json }))
  return openNew(d)
}
export const createFromSize = (s: SizePreset) => openNew(createDoc(`無題 - ${s.label}`, s.w, s.h, undefined, s.print))

type View = 'home' | 'templates' | 'designs' | 'agent'
const storeLabel = (user: unknown) => (isLocal() ? 'designs フォルダ(ローカル)' : user ? 'クラウド' : isDemo() ? 'このブラウザ(デモ)' : 'このブラウザ')

export function Home() {
  const [docs, setDocs] = useState<DocSummary[]>([])
  const [loadErr, setLoadErr] = useState('')
  const { user } = useSession()
  const [theme, toggleTheme] = useTheme()
  const [view, setView] = useState<View>(() => (location.hash.includes('agent') ? 'agent' : 'home'))
  // Google ログインから戻ったときの結果(#/?auth=…)を表示して URL から消す
  const [authMsg] = useState(() => { const m = location.hash.match(/[?&]auth=([^&]+)/); if (m) history.replaceState(null, '', location.pathname + '#/'); return m ? decodeURIComponent(m[1]) : '' })
  const load = () => repo.list().then((d) => { setDocs(d); setLoadErr('') }).catch((e) => setLoadErr(e?.message ?? String(e)))
  useEffect(() => { initSession().then(load) }, [user?.id])
  useEffect(() => onLocalEvent(() => load()), [])

  const dup = async (s: DocSummary) => {
    const d = await repo.get(s.id)
    if (!d) return
    const c = structuredClone(d)
    c.id = newId(); c.name = d.name + 'のコピー'; c.createdAt = c.updatedAt = Date.now()
    c.pages = c.pages.map((p) => ({ ...p, id: newPageId() }))
    await repo.put(c, { baseUpdatedAt: null, thumb: s.thumb?.startsWith('data:') ? s.thumb : undefined }); load()
  }
  const del = async (d: DocSummary) => { if (confirm(`「${d.name}」を削除しますか?(元に戻せません)`)) { await repo.delete(d.id); deleteVersionsOf(d.id).catch(() => {}); load() } }
  const ren = async (d: DocSummary) => { const n = prompt('新しい名前', d.name); if (!n) return; const cur = await repo.get(d.id); if (cur) { cur.name = n; await repo.put(cur, { baseUpdatedAt: cur.updatedAt }) } load() }
  const newDeck = (sample: boolean) => {
    const deck = sample ? structuredClone(sampleDeck) as any : { title: '新しいスライド', subtitle: '', brand: '', slides: [{ id: 's01', chapter: '', layout: 'cover', html: "<div class='kicker'>サブタイトル</div><h1>タイトルを<br><em>入力</em></h1><p class='lead'>E キーで編集モード → 文字をクリックして書き換え → ⌘S で保存</p>", notes: '' }] }
    const d = createDoc(deck.title || 'HTMLスライド', 1280, 720)
    d.pages = [{ id: 'deck', json: { objects: [] } }]
    d.deck = { ...deck, memos: [] }
    d.thumb = deckThumb(d.deck!)
    openNew(d)
  }

  const nav: [View, string, React.ReactNode, number?][] = [
    ['home', 'ホーム', <HomeIcon size={16} />],
    ['templates', 'テンプレート', <LayoutGrid size={16} />, TEMPLATES.length],
    ['designs', 'マイデザイン', <Folder size={16} />, docs.length],
    ['agent', 'AI エージェント連携', <Bot size={16} />],
  ]
  return (
    <div className="app-shell">
      <aside className="sidenav">
        <div className="brand"><span className="brand-mark" />irodori</div>
        {nav.map(([id, label, icon, count]) => (
          <button key={id} className={'nav-item' + (view === id ? ' on' : '')} onClick={() => setView(id)}>{icon}{label}{count !== undefined && <span className="count">{count}</span>}</button>
        ))}
        <div className="nav-sec">作成</div>
        <button className="nav-item" onClick={() => createFromSize(SIZES.find((s) => s.id === 'ig-post')!)}><Plus size={16} />Instagram 投稿</button>
        <button className="nav-item" onClick={() => createFromSize(SIZES.find((s) => s.id === 'slide-169')!)}><Presentation size={16} />プレゼン資料</button>
        <button className="nav-item" onClick={() => newDeck(true)}><Sparkles size={16} />HTML スライド</button>
        <div className="nav-foot">
          <div className="store-pill" title="デザインの保存先"><span className={'dot' + (storageOk ? ' ok' : ' warn')} />保存先: {storeLabel(user)}</div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <AccountButton onChanged={load} />
            <button className="icon-btn" title={theme === 'dark' ? 'ライトテーマ' : 'ダークテーマ'} onClick={toggleTheme}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
          </div>
        </div>
      </aside>
      <main className="main">
        <div className="topnav">
          <button className="cmd-trigger" onClick={openPalette}><Search size={15} />テンプレート・サイズ・操作を検索<kbd>⌘K</kbd></button>
          <div className="tb-spacer" />
          <button className="primary-btn" onClick={() => setView('home')}><Plus size={16} />デザインを作成</button>
        </div>
        {isDemo() && <p className="banner-info">公開デモです。デザインはこのブラウザの中だけに保存されます。AI エージェント(Claude Code など)と連携するには、自分の PC で動かしてください(左の「AI エージェント連携」)。</p>}
        {authMsg && <p className="banner-info">{authMsg}</p>}
        {!storageOk && <p className="error banner">このブラウザでは保存機能が使えません(プライベートモード等)。作ったデザインはダウンロードして保存してください。</p>}
        {sessionProblem() && <p className="error banner">サーバーに接続できず、ログイン状態を確認できませんでした({sessionProblem()})。</p>}
        {loadErr && <p className="error banner">デザインの一覧を読み込めませんでした: {loadErr}</p>}
        <div className="page">
          {view === 'home' && <HomeView docs={docs} onDup={dup} onDel={del} onRen={ren} onDeck={newDeck} goto={setView} />}
          {view === 'templates' && <TemplatesView />}
          {view === 'designs' && <DesignsView docs={docs} onDup={dup} onDel={del} onRen={ren} />}
          {view === 'agent' && <AgentConnect />}
        </div>
      </main>
      <CommandPalette docs={docs} onNewDeck={() => newDeck(true)} goto={setView} toggleTheme={toggleTheme} />
    </div>
  )
}

type DocActions = { onDup: (d: DocSummary) => void; onDel: (d: DocSummary) => void; onRen: (d: DocSummary) => void }

function HomeView({ docs, onDeck, goto, ...act }: { docs: DocSummary[]; onDeck: (sample: boolean) => void; goto: (v: View) => void } & DocActions) {
  const [group, setGroup] = useState('SNS')
  const [cw, setCw] = useState(1080), [ch, setCh] = useState(1080)
  const groups = [...new Set(SIZES.map((s) => s.group))]
  const featured = useMemo(() => TEMPLATES.filter((t) => pageCount(t) > 1).slice(0, 8).concat(TEMPLATES.filter((t) => pageCount(t) === 1).slice(0, Math.max(0, 8 - TEMPLATES.filter((t) => pageCount(t) > 1).length))), [])
  return (
    <>
      <div className="page-head"><div><h1>作成</h1><p>サイズを選ぶか、テンプレートから始めます。</p></div></div>
      <div className="row" style={{ marginBottom: 12, justifyContent: 'space-between' }}>
        <div className="seg">{groups.map((g) => <button key={g} className={group === g ? 'on' : ''} onClick={() => setGroup(g)}>{g}</button>)}</div>
        <div className="custom-size">カスタム <input type="number" value={cw} onChange={(e) => setCw(+e.target.value)} />×<input type="number" value={ch} onChange={(e) => setCh(+e.target.value)} />px
          <button className="secondary-btn" onClick={() => { const w = Math.max(16, Math.min(8000, Math.round(cw))), h = Math.max(16, Math.min(8000, Math.round(ch))); openNew(createDoc(`無題 - ${w}×${h}`, w, h)) }}>作成</button></div>
      </div>
      <div className="create-grid">
        {SIZES.filter((s) => s.group === group).map((s) => {
          const k = 44 / Math.max(s.w, s.h)
          return (
            <button key={s.id} className="create-card" onClick={() => createFromSize(s)}>
              <div className="frame-wrap"><div className="frame" style={{ width: s.w * k, height: s.h * k }} /></div>
              <b>{s.label}</b><small>{s.print ? `${s.print.mmW}×${s.print.mmH} mm` : `${s.w}×${s.h} px`}</small>
            </button>
          )
        })}
      </div>

      <div className="section">
        <div className="section-head"><h2>最近のデザイン</h2>{docs.length > 0 && <button className="link-btn" onClick={() => goto('designs')}>すべて表示</button>}</div>
        {docs.length ? <DocGrid docs={docs.slice(0, 8)} {...act} /> : <div className="empty-state">まだデザインがありません。上のサイズか、下のテンプレートから作成してください。</div>}
      </div>

      <div className="section">
        <div className="section-head"><h2>おすすめのテンプレート</h2><button className="link-btn" onClick={() => goto('templates')}>すべて表示({TEMPLATES.length})</button></div>
        <TemplateGrid list={featured} />
      </div>

      <div className="section">
        <div className="deck-row">
          <div><b>HTML スライド</b><small>台本から AI エージェントでスライドを作り、ブラウザで直す形式。発表者ツール・メモ・PDF 付き。deck.json で AI と行き来できます。</small></div>
          <button className="secondary-btn" onClick={() => onDeck(false)}>空から作る</button>
          <button className="primary-btn" onClick={() => onDeck(true)}>サンプルから作る</button>
        </div>
      </div>
    </>
  )
}

function TemplatesView() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('すべて')
  const [multi, setMulti] = useState(false)
  const list = useMemo(() => TEMPLATES.filter((t) => (cat === 'すべて' || t.category === cat) && (!multi || pageCount(t) > 1) && (!q || (t.name + t.category + (t.tags ?? []).join(' ')).includes(q))), [q, cat, multi])
  return (
    <>
      <div className="page-head"><div><h1>テンプレート</h1><p>{TEMPLATES.length} 件(すべてオリジナル)。クリックすると全ページ入りのデザインを作成します。</p></div>
        <input className="field" style={{ width: 280, margin: 0 }} placeholder="業種・用途で検索(例: 飲食、採用、提案)" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="cat-row">
        {['すべて', ...TEMPLATE_CATEGORIES].map((c) => <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>)}
        <label className="check" style={{ marginLeft: 8 }}><input type="checkbox" checked={multi} onChange={(e) => setMulti(e.target.checked)} />複数ページのみ</label>
      </div>
      {list.length ? <TemplateGrid list={list} /> : <div className="empty-state">見つかりませんでした。</div>}
    </>
  )
}

export function TemplateGrid({ list }: { list: Template[] }) {
  return (
    <div className="tpl-gallery">
      {list.map((t) => (
        <button key={t.id} className="tpl-card" onClick={() => createFromTemplate(t)} title={`${t.name}(${t.category})`}>
          <div className="tpl-media"><TemplateThumb t={t} width={240} />{pageCount(t) > 1 && <span className="tpl-badge">{pageCount(t)} ページ</span>}</div>
          <span className="t-name">{t.name}</span><span className="t-meta">{t.category} ・ {t.w}×{t.h}</span>
        </button>
      ))}
    </div>
  )
}

function DesignsView({ docs, ...act }: { docs: DocSummary[] } & DocActions) {
  const [q, setQ] = useState('')
  const list = docs.filter((d) => !q || d.name.includes(q))
  return (
    <>
      <div className="page-head"><div><h1>マイデザイン</h1><p>{docs.length} 件 ・ 保存先: {isLocal() ? 'designs フォルダ' : 'このブラウザ / クラウド'}</p></div>
        <input className="field" style={{ width: 260, margin: 0 }} placeholder="名前で検索" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {list.length ? <DocGrid docs={list} {...act} /> : <div className="empty-state">デザインがありません。</div>}
    </>
  )
}

function DocGrid({ docs, onDup, onDel, onRen }: { docs: DocSummary[] } & DocActions) {
  return (
    <div className="doc-grid">
      {docs.map((d) => (
        <div key={d.id} className="doc-card">
          <a href={'#/d/' + d.id} className="doc-thumb">{d.thumb ? <img src={d.thumb} alt="" /> : <div className="thumb-ph" />}</a>
          <div className="doc-meta">
            <a href={'#/d/' + d.id} className="doc-title">{d.name}</a>
            <small>{d.width}×{d.height} ・ {d.pageCount} ページ ・ {new Date(d.updatedAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>
          </div>
          <div className="doc-actions">
            <button className="icon-btn" title="名前を変更" onClick={() => onRen(d)}><Pencil size={14} /></button>
            <button className="icon-btn" title="複製" onClick={() => onDup(d)}><Copy size={14} /></button>
            <button className="icon-btn" title="削除" onClick={() => onDel(d)}><Trash2 size={14} /></button>
          </div>
        </div>
      ))}
    </div>
  )
}
