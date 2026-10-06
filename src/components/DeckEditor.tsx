// HTML スライド(slide-studio を取り込んだもの)の編集画面。
// 画面本体は public/slides/(slide-studio のコピー)を iframe で表示し、通信は bridge.js 経由でここが受ける。
import { ChevronLeft, Cloud, CloudOff, Download, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import { newId } from '../editor/repo'
import { repo, ConflictError, GoneError } from '../editor/repo'
import type { DesignDoc, DeckData, DeckMemo } from '../editor/types'

/** 一覧用サムネ(1枚目の題名を描いた JPEG) */
export function deckThumb(deck: DeckData): string {
  const c = document.createElement('canvas')
  c.width = 400; c.height = 225
  const x = c.getContext('2d')!
  const g = x.createLinearGradient(0, 0, 400, 225)
  g.addColorStop(0, '#1e1b4b'); g.addColorStop(1, '#4f46e5')
  x.fillStyle = g; x.fillRect(0, 0, 400, 225)
  x.fillStyle = 'rgba(255,255,255,.7)'; x.font = '600 12px "Noto Sans JP", sans-serif'
  x.fillText(`HTMLスライド ・ ${deck.slides.length}枚`, 20, 30)
  x.fillStyle = '#fff'; x.font = '900 24px "Noto Sans JP", sans-serif'
  const t = deck.title || '無題のスライド'
  let line = '', y = 100
  for (const ch of t) { if (x.measureText(line + ch).width > 360) { x.fillText(line, 20, y); line = ''; y += 32 } line += ch }
  x.fillText(line, 20, y)
  return c.toDataURL('image/jpeg', 0.85)
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

/** スライド HTML から危険な部分を除く(他人の共有デザインをコピーした場合などに備える)。DOMPurify で無害化する */
export function sanitizeSlideHtml(html: string): string {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true, svg: true }, FORBID_TAGS: ['style', 'form', 'animate', 'set', 'animateMotion', 'animateTransform'] }) as string
}
const MEMO_ID = /^[\w-]{1,40}$/
const cleanDeck = (d: DeckData): DeckData => ({
  ...d,
  slides: d.slides.map((s) => ({ ...s, id: String(s.id), html: sanitizeSlideHtml(String(s.html ?? '')) })),
  // メモの id は属性に入るので形式を確かめる。本文は画面側でエスケープされる
  memos: (d.memos ?? []).filter((m) => MEMO_ID.test(String(m.id)) && (m.slideId === null || MEMO_ID.test(String(m.slideId)))).map((m) => ({ ...m, text: String(m.text).slice(0, 2000), author: String(m.author ?? '').slice(0, 40) })),
})

export function DeckEditor({ initial }: { initial: DesignDoc }) {
  const docRef = useRef<DesignDoc>({ ...initial, deck: cleanDeck(initial.deck!) })
  const lastSaved = useRef(initial.updatedAt)
  const subs = useRef(new Set<(m: any) => void>())
  const version = useRef(1)
  const timer = useRef(0)
  const [state, setState] = useState<'saved' | 'saving' | 'error' | 'conflict'>('saved')
  const [name, setName] = useState(initial.name)
  const iframe = useRef<HTMLIFrameElement>(null)

  const dirty = useRef(false)
  const saving = useRef(false)
  const again = useRef(false)
  const stopped = useRef(false)
  // 保存は1本ずつ。前の保存が終わってから(新しい版を基準に)次を送る
  const save = async () => {
    timer.current = 0
    if (stopped.current || !dirty.current) return
    if (saving.current) { again.current = true; return }
    saving.current = true
    dirty.current = false
    const d = docRef.current
    try {
      d.thumb = deckThumb(d.deck!)
      d.updatedAt = await repo.put(structuredClone(d), { baseUpdatedAt: lastSaved.current, thumb: d.thumb })
      lastSaved.current = d.updatedAt
      if (!dirty.current) setState('saved')
    } catch (e) {
      if (e instanceof ConflictError || e instanceof GoneError) { stopped.current = true; setState('conflict') }
      else { dirty.current = true; setState('error') }
    } finally {
      saving.current = false
      if (again.current) { again.current = false; save() }
    }
  }
  const persist = () => { dirty.current = true; setState('saving'); clearTimeout(timer.current); timer.current = window.setTimeout(save, 500) }
  const saveAsCopy = async () => {
    const d = structuredClone(docRef.current)
    d.id = newId(); d.name = d.name + '(自分の版)'; d.createdAt = Date.now()
    try { await repo.put(d, { baseUpdatedAt: null, thumb: d.thumb }); location.hash = '#/d/' + d.id; location.reload() }
    catch (e: any) { alert('保存できませんでした: ' + (e?.message ?? e)) }
  }
  const broadcast = (msg: any) => subs.current.forEach((f) => f(msg))

  // iframe 内の slide-studio から呼ばれる窓口(public/slides/bridge.js)
  useEffect(() => {
    const deck = () => docRef.current.deck!
    ;(window as any).irodoriDeckBridge = {
      getDeck: () => ({ deck: structuredClone({ ...deck(), memos: undefined }), version: version.current, memos: deck().memos ?? [] }),
      putSlide: async (id: string, patch: any) => {
        const s = deck().slides.find((x) => x.id === id)
        if (!s) throw new Error('slide not found')
        if (typeof patch.html === 'string') s.html = sanitizeSlideHtml(patch.html)
        if (typeof patch.notes === 'string') s.notes = patch.notes
        version.current++
        persist()
        broadcast({ type: 'slide', slide: structuredClone(s), version: version.current, client: patch.client })
        return { ok: true, version: version.current }
      },
      addMemo: async (b: any) => {
        const text = String(b.text ?? '').trim()
        if (!text) throw new Error('empty')
        const memo: DeckMemo = { id: uid(), slideId: b.slideId ?? null, text, author: String(b.author ?? ''), at: new Date().toISOString() }
        deck().memos = [...(deck().memos ?? []), memo]
        persist()
        broadcast({ type: 'memos', memos: deck().memos, client: b.client })
        return { ok: true, memo }
      },
      deleteMemo: async (id: string | null) => {
        deck().memos = id ? (deck().memos ?? []).filter((m) => m.id !== id) : []
        persist()
        broadcast({ type: 'memos', memos: deck().memos })
        return { ok: true }
      },
      subscribe: (f: (m: any) => void) => { subs.current.add(f); return () => subs.current.delete(f) },
      viewers: () => 1,
    }
    const flushNow = () => { if (dirty.current) { clearTimeout(timer.current); save() } }
    const warn = (e: BeforeUnloadEvent) => { if (dirty.current || saving.current) { flushNow(); e.preventDefault() } }
    window.addEventListener('pagehide', flushNow)
    window.addEventListener('beforeunload', warn)
    return () => { window.removeEventListener('pagehide', flushNow); window.removeEventListener('beforeunload', warn); flushNow(); delete (window as any).irodoriDeckBridge }
  }, [])

  // deck.json の読み込み(Claude Code で作った・直したものを取り込む)
  const importJson = async (f: File) => {
    try {
      const d = JSON.parse(await f.text())
      if (!d || !Array.isArray(d.slides) || d.slides.some((s: any) => typeof s?.id !== 'string' || typeof s?.html !== 'string')) throw new Error('slides(id と html を持つ配列)がありません')
      docRef.current.deck = cleanDeck({ title: String(d.title ?? ''), subtitle: d.subtitle, brand: d.brand, slides: d.slides, memos: docRef.current.deck?.memos ?? [] })
      version.current++
      persist()
      broadcast({ type: 'deck', deck: structuredClone({ ...docRef.current.deck, memos: undefined }) })
    } catch (e: any) { alert('deck.json を読み込めませんでした: ' + (e?.message ?? e)) }
  }
  const exportJson = () => {
    const { memos, ...deck } = docRef.current.deck!
    const url = URL.createObjectURL(new Blob([JSON.stringify(deck, null, 2) + '\n'], { type: 'application/json' }))
    const a = document.createElement('a'); a.href = url; a.download = 'deck.json'; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
    void memos
  }
  const rename = (v: string) => { setName(v); docRef.current.name = v || '無題のスライド'; persist() }

  return (
    <div className="editor">
      <header className="topbar">
        <a className="tb-btn home-link" href="#/"><ChevronLeft size={18} />ホーム</a>
        <input className="doc-name" value={name} onChange={(e) => rename(e.target.value)} />
        <span className="size-label">HTMLスライド(slide-studio)</span>
        <span className={'save-state ' + (state === 'conflict' ? 'error' : state)}>
          {state === 'error' ? <><CloudOff size={16} />保存できません</> : state === 'conflict' ? <><CloudOff size={16} />保存を止めています</> : state === 'saving' ? <><Cloud size={16} />保存中…</> : <><Cloud size={16} />保存済み</>}
        </span>
        <div className="tb-spacer" />
        <label className="tb-btn" title="Claude Code などで作った deck.json を読み込む"><Upload size={18} /><span className="hide-sm">deck.json を読み込む</span>
          <input type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) importJson(f) }} />
        </label>
        <button className="primary-btn" onClick={exportJson} title="Claude Code で直すために deck.json として保存"><Download size={18} />deck.json</button>
      </header>
      {state === 'conflict' && <div className="conflict">このスライドは別の場所で更新されたため、上書きを防ぐために保存を止めています。<button className="chip" onClick={saveAsCopy}>この画面の内容を別のデザインとして保存</button><button className="chip" onClick={exportJson}>deck.json で保存</button><button className="chip" onClick={() => location.reload()}>最新を読み込む(この画面の変更は破棄)</button></div>}
      <iframe ref={iframe} className="deck-frame" src="/slides/index.html" title="スライド編集" />
    </div>
  )
}
