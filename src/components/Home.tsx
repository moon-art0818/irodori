import { Copy, Pencil, Plus, Trash2, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createDoc, newPageId, repo, newId, type DocSummary } from '../editor/repo'
import { AccountButton, useSession } from './Account'
import { initSession, sessionProblem, isDemo } from '../api/session'
import { isLocal } from '../api/local'
import { onLocalEvent } from '../api/local'
import { deleteVersionsOf } from '../editor/versions'
import { storageOk } from '../editor/idb'
import type { DesignDoc } from '../editor/types'
import { SIZES, type SizePreset } from '../data/sizes'
import { TEMPLATES, TEMPLATE_CATEGORIES, templateToJSON, type Template } from '../data/templates'
import { TemplateThumb } from './LeftPanel'
import { deckThumb } from './DeckEditor'
import sampleDeck from '../data/sampleDeck.json'

async function openNew(doc: DesignDoc) {
  doc.updatedAt = await repo.put(doc, { baseUpdatedAt: null })
  location.hash = '#/d/' + doc.id
}

export function Home() {
  const [docs, setDocs] = useState<DocSummary[]>([])
  const [loadErr, setLoadErr] = useState('')
  const { user } = useSession()
  // Google ログインから戻ったときの結果(#/?auth=…)を表示して URL から消す
  const [authMsg] = useState(() => { const m = location.hash.match(/[?&]auth=([^&]+)/); if (m) history.replaceState(null, '', location.pathname + '#/'); return m ? decodeURIComponent(m[1]) : '' })
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string>('すべて')
  const [cw, setCw] = useState(1080)
  const [ch, setCh] = useState(1080)
  const load = () => repo.list().then((d) => { setDocs(d); setLoadErr('') }).catch((e) => setLoadErr(e?.message ?? String(e)))
  useEffect(() => { initSession().then(load) }, [user?.id])
  // ローカル版: フォルダに AI がデザインを作ったら一覧を更新
  useEffect(() => onLocalEvent(() => load()), [])

  const fromSize = (s: SizePreset) => openNew(createDoc(`無題 - ${s.label}`, s.w, s.h, undefined, s.print))
  const fromTemplate = (t: Template) => {
    const size = SIZES.find((s) => s.w === t.w && s.h === t.h)
    openNew(createDoc(t.name, t.w, t.h, templateToJSON(t), size?.print))
  }
  const custom = () => {
    const w = Math.max(16, Math.min(8000, Math.round(cw))), h = Math.max(16, Math.min(8000, Math.round(ch)))
    openNew(createDoc(`無題 - ${w}×${h}`, w, h))
  }
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

  // HTML スライド(slide-studio)。サンプルから始めるか、空から始める
  const newDeck = (sample: boolean) => {
    const deck = sample ? structuredClone(sampleDeck) as any : { title: '新しいスライド', subtitle: '', brand: '', slides: [{ id: 's01', chapter: '', layout: 'cover', html: "<div class='kicker'>サブタイトル</div><h1>タイトルを<br><em>入力</em></h1><p class='lead'>E キーで編集モード → 文字をクリックして書き換え → ⌘S で保存</p>", notes: '' }] }
    const d = createDoc(deck.title || 'HTMLスライド', 1280, 720)
    d.pages = [{ id: 'deck', json: { objects: [] } }]
    d.deck = { ...deck, memos: [] }
    d.thumb = deckThumb(d.deck!)
    openNew(d)
  }

  const groups = [...new Set(SIZES.map((s) => s.group))]
  const tpls = useMemo(() => TEMPLATES.filter((t) => (cat === 'すべて' || t.category === cat) && (!q || (t.name + t.category).includes(q))), [q, cat])

  return (
    <div className="home">
      <header className="home-head">
        <div className="logo">irodori<span>デザインを、もっと自由に。</span></div>
        <AccountButton onChanged={load} />
        <div className="search-wrap"><Search size={18} /><input placeholder="テンプレートを検索(例: セール、名刺、サムネ)" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </header>
      {!storageOk && <p className="error banner">このブラウザでは保存機能が使えません(プライベートモード等)。作ったデザインはダウンロードして保存してください。</p>}

      <section>
        <h2>デザインを作成</h2>
        {groups.map((g) => (
          <div key={g} className="size-group">
            <h3>{g}</h3>
            <div className="size-row">
              {SIZES.filter((s) => s.group === g).map((s) => {
                const k = 64 / Math.max(s.w, s.h)
                return (
                  <button key={s.id} className="size-card" onClick={() => fromSize(s)}>
                    <div className="size-box-wrap"><div className="size-box" style={{ width: s.w * k, height: s.h * k }} /></div>
                    <b>{s.label}</b>
                    <small>{s.print ? `${s.print.mmW}×${s.print.mmH}mm` : `${s.w}×${s.h}px`}</small>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        <div className="deck-row">
          <div><b>HTMLスライド(slide-studio)</b><small>台本から Claude Code でスライドを作り、ブラウザで直す。発表者ツール・メモ・PDF 付き。deck.json の読み込み/書き出しで Claude Code と行き来できます。</small></div>
          <button className="chip" onClick={() => newDeck(false)}>空から作る</button>
          <button className="primary-btn" onClick={() => newDeck(true)}>サンプルから作る</button>
        </div>
        <div className="custom-size">
          <span>カスタムサイズ</span>
          <input type="number" value={cw} onChange={(e) => setCw(+e.target.value)} /> × <input type="number" value={ch} onChange={(e) => setCh(+e.target.value)} /> px
          <button className="primary-btn" onClick={custom}><Plus size={16} />作成</button>
        </div>
      </section>

      {isDemo() && <p className="hint banner-info">これは公開デモです。作ったデザインはこのブラウザの中だけに保存されます。AI エージェント(Claude Code など)と連携して使うには、GitHub の README の手順で自分のパソコンで動かしてください。</p>}
      {authMsg && <p className="hint banner-info">{authMsg}</p>}
      {sessionProblem() && <p className="error banner">サーバーに接続できず、ログイン状態を確認できませんでした({sessionProblem()})。いまはこの端末に保存されます。通信が戻ったら再読み込みしてください。</p>}
      {loadErr && <p className="error banner">デザインの一覧を読み込めませんでした: {loadErr}</p>}
      {docs.length > 0 && (
        <section>
          <h2>最近のデザイン{isLocal() ? '(designs フォルダ)' : user ? '(クラウド)' : '(この端末)'}</h2>
          <div className="doc-grid">
            {docs.map((d) => (
              <div key={d.id} className="doc-card">
                <a href={'#/d/' + d.id} className="doc-thumb">{d.thumb ? <img src={d.thumb} alt="" /> : <div className="thumb-ph" />}</a>
                <div className="doc-meta">
                  <a href={'#/d/' + d.id} className="doc-title">{d.name}</a>
                  <small>{d.width}×{d.height} ・ {d.pageCount}ページ ・ {new Date(d.updatedAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>
                </div>
                <div className="doc-actions">
                  <button className="icon-btn" title="名前を変更" onClick={() => ren(d)}><Pencil size={14} /></button>
                  <button className="icon-btn" title="複製" onClick={() => dup(d)}><Copy size={14} /></button>
                  <button className="icon-btn" title="削除" onClick={() => del(d)}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2>テンプレート</h2>
        <div className="cat-row">
          {['すべて', ...TEMPLATE_CATEGORIES].map((c) => <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>)}
        </div>
        <div className="tpl-gallery">
          {tpls.map((t) => (
            <button key={t.id} className="tpl-card big" onClick={() => fromTemplate(t)}>
              <TemplateThumb t={t} width={200} />
              <span>{t.name}</span><small>{t.category}</small>
            </button>
          ))}
          {!tpls.length && <p className="hint">見つかりませんでした</p>}
        </div>
      </section>
    </div>
  )
}
