import { ChevronLeft, Redo2, Undo2, Plus, Copy, Trash2, ChevronUp, ChevronDown, Maximize, Cloud, CloudOff } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { EditorCore, renderPage } from '../editor/core'
import { blankPage, newPageId, repo, localRepo, newId as newDocId, ConflictError, GoneError } from '../editor/repo'
import { storageOk } from '../editor/idb'
import type { DesignAudio, DesignDoc } from '../editor/types'

const bc = new BroadcastChannel('irodori-docs')
import { templateToJSON, templatePagesJSON, type Template } from '../data/templates'
import { toast } from 'sonner'
import { LeftPanel, TABS, type Tab } from './LeftPanel'
import { AudioBar } from './AudioBar'
import { addVideoFiles } from './Videos'
import { audioFromFile } from './Music'
import { setMediaCollab } from '../features/media'
import { Toolbar } from './Toolbar'
import { DownloadButton, exportDoc } from './Download'
import { ContextMenu, SHORTCUTS } from './ContextMenu'
import { takeDrop, isIrodoriDrag } from '../editor/dnd'
import { SHAPES } from '../data/shapes'
import { ShareButton, collabUrl } from './Share'
import { CollabSession, createRoom } from '../collab/session'
import { CollabBinding, type RemoteInfo } from '../collab/binding'
import { colorFor, initPresence, saveName, savedName } from '../collab/presence'
import { CollabBar, CursorLayer, NameModal } from '../collab/ui'
import { migrateOne } from './Account'
import { DeckEditor } from './DeckEditor'
import { VTextEditor } from './VTextEditor'
import { RequestBoard } from './AgentConnect'
import { DesignTools } from './DesignTools'
import { isLocal } from '../api/local'
import { Bot } from 'lucide-react'
import type { VText } from '../editor/vtext'
import { initSession } from '../api/session'
import { onLocalEvent } from '../api/local'
import { ResizeModal, VersionsModal } from './Modals'
import { Present } from './Present'
import { AnimatePanel } from './AnimatePanel'
import { maybeSnapshot } from '../editor/versions'
import { getBrand, brandSync, onBrandChange } from '../editor/brand'
import { usePopover } from './ColorPicker'
import { Scaling, History, Play, Clapperboard, MoreHorizontal } from 'lucide-react'
import { useIsMobile, isMobileNow } from './mobile/useMobile'
import { BottomSheet, MobileTabBar } from './mobile/BottomSheet'
import { attachTouchGestures } from './mobile/gestures'
import './mobile/mobile.css'

const isTyping = (e: KeyboardEvent) => {
  const t = e.target as HTMLElement
  return e.isComposing || t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable
}

/** ページ内で使われている色(色選択の候補に出す) */
function collectColors(json: any): string[] {
  const set = new Set<string>()
  const walk = (o: any) => {
    for (const k of ['fill', 'stroke']) if (typeof o[k] === 'string' && o[k].startsWith('#')) set.add(o[k].toLowerCase())
    o.objects?.forEach(walk)
  }
  json?.objects?.forEach(walk)
  if (typeof json?.background === 'string' && json.background.startsWith('#')) set.add(json.background.toLowerCase())
  return [...set].slice(0, 14)
}

export function Editor({ docId }: { docId: string }) {
  const [doc, setDoc] = useState<DesignDoc | null>(null)
  const [missing, setMissing] = useState(false)
  const [pageIdx, setPageIdx] = useState(0)
  const isMobile = useIsMobile()
  const [menuOpen, setMenuOpen] = useState(false) // スマホ: 上部バーの「…」メニュー
  // スマホでは最初はシートを閉じて、キャンバスを広く見せる
  const [tab, setTab] = useState<Tab | null>(() => (isMobileNow() ? null : 'templates'))
  const [, setVersion] = useState(0)
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved')
  const [thumbs, setThumbs] = useState<Record<string, string>>({})
  const [dragOver, setDragOver] = useState(false)
  const canvasEl = useRef<HTMLCanvasElement>(null)
  const areaRef = useRef<HTMLDivElement>(null)
  const edRef = useRef<EditorCore | null>(null)
  const docRef = useRef<DesignDoc | null>(null)
  const saveTimer = useRef<number>(0)
  const thumbTimers = useRef(new Map<string, number>())
  const disposed = useRef(false)
  const lastSaved = useRef(0)
  const [conflict, setConflict] = useState(false)
  const [loadErr, setLoadErr] = useState('')
  const [localOnlyState, setLocalOnlyState] = useState(false)
  const localOnly = useRef(false)
  const setLocalOnly = (v: boolean) => { localOnly.current = v; setLocalOnlyState(v) }
  const version = useRef(0)
  // 共同編集(doc.collab があれば自動で部屋につなぐ)
  const [collab, setCollab] = useState<{ session: CollabSession; binding: CollabBinding } | null>(null)
  const collabRef = useRef<{ session: CollabSession; binding: CollabBinding } | null>(null)
  const [collabBusy, setCollabBusy] = useState(false)
  const [myName, setMyName] = useState(savedName)
  const [askName, setAskName] = useState<'' | 'start' | 'join'>('')
  const declinedName = useRef(false)
  const pageIdxRef = useRef(0)
  /** いま見ている(見に行く途中の)ページ id。他の人の変更でページ一覧が動いても、見ているページを見失わないため */
  const viewIdRef = useRef('')
  const bump = useCallback(() => { version.current++; setVersion(version.current) }, [])

  // 読み込み
  useEffect(() => {
    initSession().then(async () => {
      let d = await repo.get(docId)
      // ログイン中にクラウドに無い → この端末だけに保存されたデザインかもしれない
      if (!d && repo.kind === 'cloud') { const local = await localRepo.get(docId); if (local) { setLocalOnly(true); return } }
      return d
    }).then((d) => {
      if (d === undefined && localOnly.current) return
      if (!d || !Array.isArray(d.pages) || !d.pages.length) { setMissing(true); return }
      docRef.current = d
      lastSaved.current = d.updatedAt
      setDoc(d)
      maybeSnapshot(d).catch(() => {}) // 開いた時点の状態を履歴に残す
    }).catch((e) => setLoadErr(e?.message ?? String(e)))
  }, [docId])

  // 画面が非表示の間は描画が止まるので、表示に戻ったら描き直す
  useEffect(() => { const f = () => { if (document.visibilityState === 'visible') edRef.current?.canvas.requestRenderAll() }; document.addEventListener('visibilitychange', f); return () => document.removeEventListener('visibilitychange', f) }, [])

  // ブランドキットを読み込んで色候補に反映
  useEffect(() => { getBrand().then(bump); return onBrandChange(bump) }, [bump])

  // 別タブで同じデザインが保存されたら知らせる
  useEffect(() => {
    const f = (e: MessageEvent) => { if (e.data?.docId === docId && e.data.at !== lastSaved.current) setConflict(true) }
    bc.addEventListener('message', f)
    return () => bc.removeEventListener('message', f)
  }, [docId])

  const thumbDocTimer = useRef<number>(0)
  const dirty = useRef(false)
  const saving = useRef(false)
  const saveAgain = useRef(false)
  const flush = useCallback(async () => {
    const d = docRef.current
    if (!d || !dirty.current) return
    clearTimeout(saveTimer.current)
    if (saving.current) { saveAgain.current = true; return } // 保存の重複実行を防ぐ(版の確認が崩れるため)
    saving.current = true
    try {
      dirty.current = false
      // 保存先の版が前回保存時と違えば(別タブ・別端末・削除)上書きしない
      d.updatedAt = await repo.put(structuredClone(d), { baseUpdatedAt: lastSaved.current || null, thumb: d.thumb })
      lastSaved.current = d.updatedAt
      maybeSnapshot(d).catch(() => {})
      bc.postMessage({ docId: d.id, at: d.updatedAt })
      if (!dirty.current) setSaveState(storageOk ? 'saved' : 'error')
    } catch (e) {
      dirty.current = true
      setSaveState('error')
      if (e instanceof ConflictError || e instanceof GoneError) { setConflict(true); dirty.current = false }
    } finally {
      saving.current = false
      if (saveAgain.current) { saveAgain.current = false; if (dirty.current) setTimeout(() => flushRef.current(), 0) }
    }
  }, [])
  const flushRef = useRef(flush)
  flushRef.current = flush
  // 保存は内容を先に書き、サムネは後から作る(閉じる直前の変更を失わないため)
  const persist = useCallback((opts?: { remote?: boolean; live?: boolean }) => {
    if (!docRef.current || disposed.current) return
    // 共同編集中は、変更を部屋にも書く(他の人から来た変更の保存では書き戻さない)
    if (!opts?.remote) collabRef.current?.binding.pushLocal(docRef.current, !!opts?.live)
    dirty.current = true
    setSaveState('saving')
    clearTimeout(saveTimer.current)
    // 共同編集の他の人の変更・文字入力の途中経過は、保存の回数を抑えるため間を空ける
    saveTimer.current = window.setTimeout(flush, opts?.remote || opts?.live ? 2500 : 400)
    clearTimeout(thumbDocTimer.current)
    thumbDocTimer.current = window.setTimeout(async () => {
      const d = docRef.current
      if (!d || disposed.current) return
      try {
        d.thumb = await renderPage(d.pages[0].json, d.width, d.height, { multiplier: 400 / Math.max(d.width, d.height), format: 'jpeg', quality: 0.8 })
        if (disposed.current) return
        dirty.current = true
        await flush()
      } catch { /* サムネ失敗は保存に影響させない */ }
    }, 2500)
  }, [flush])

  const refreshThumb = useCallback((pageId: string) => {
    const timers = thumbTimers.current
    clearTimeout(timers.get(pageId))
    timers.set(pageId, window.setTimeout(async () => {
      timers.delete(pageId)
      const d = docRef.current
      const p = d?.pages.find((x) => x.id === pageId)
      if (!d || !p || disposed.current) return
      try {
        const url = await renderPage(p.json, d.width, d.height, { multiplier: 160 / d.width, format: 'jpeg', quality: 0.7 })
        setThumbs((t) => ({ ...t, [pageId]: url }))
      } catch { /* サムネ失敗は無視 */ }
    }, 400))
  }, [])

  // ローカル版: AI エージェントなどがファイルを書き換えたら、画面に反映する
  useEffect(() => onLocalEvent(async (m) => {
    if (m.type !== 'changed' || m.id !== docId || m.updatedAt === lastSaved.current) return
    if (dirty.current || saving.current) { setConflict(true); return } // 画面側に未保存の変更があるときは上書きしない
    const d = await repo.get(docId)
    const ed = edRef.current
    if (!d || !ed || d.deck) return
    const cur = docRef.current?.pages.findIndex((p) => p.id === ed.pageId) ?? 0
    docRef.current = d
    lastSaved.current = d.updatedAt
    if (d.width !== ed.width || d.height !== ed.height) ed.resizePage(d.width, d.height)
    const i = Math.max(0, Math.min(d.pages.length - 1, cur))
    setPageIdx(i)
    setDoc({ ...d })
    await ed.showPage(d.pages[i].id, d.pages[i].json).catch(() => {})
    d.pages.forEach((p) => refreshThumb(p.id))
  }), [docId, refreshThumb])

  const fit = useCallback(() => {
    const ed = edRef.current, area = areaRef.current
    if (!ed || !area) return
    const pad = isMobileNow() ? 32 : 96 // スマホは余白を小さくして大きく見せる
    const w = area.clientWidth - pad, h = area.clientHeight - pad
    // 非表示などで 0 のときは無視する(0 を通すと canvas が復帰しない)
    if (w <= 0 || h <= 0) return
    ed.setZoom(Math.min(w / ed.width, h / ed.height))
  }, [])

  // エディタ生成(最初の読み込み時に1回だけ。doc の変更で後始末が走ると監視が外れるため loaded で判定)
  const loaded = !!doc
  useEffect(() => {
    const doc = docRef.current
    if (!loaded || !doc || edRef.current || doc.deck) return // HTML スライドは DeckEditor が表示する
    const ed = new EditorCore(canvasEl.current!, doc.width, doc.height)
    edRef.current = ed
    if (import.meta.env.DEV) { ;(window as any).__ed = ed; ;(window as any).__doc = docRef }
    const off1 = ed.onUpdate(bump)
    const off2 = ed.onChange(() => {
      const d = docRef.current!
      const p = d.pages.find((x) => x.id === ed.pageId)
      if (p) { const anim = p.json?.animation; p.json = ed.toJSON(); if (anim) p.json.animation = anim; refreshThumb(p.id) }
      persist({ live: ed.liveNow })
    })
    fit()
    ed.showPage(doc.pages[0].id, doc.pages[0].json)
    doc.pages.forEach((p) => refreshThumb(p.id))
    // サムネはまとめて作る
    ;(async () => {
      const out: Record<string, string> = {}
      for (const p of doc.pages) out[p.id] = await renderPage(p.json, doc.width, doc.height, { multiplier: 160 / doc.width, format: 'jpeg', quality: 0.7 })
      setThumbs(out)
    })()
    const ro = new ResizeObserver(() => fit())
    if (areaRef.current) ro.observe(areaRef.current)
    return () => { off1(); off2(); ro.disconnect() }
  }, [loaded, bump, fit, persist, refreshThumb])

  // ---------------- 共同編集 ----------------
  useEffect(() => { pageIdxRef.current = pageIdx }, [pageIdx])
  const collabRoom = !isLocal() ? (doc?.collab?.room ?? null) : null
  /** 部屋で他の人の変更が届いた(binding が doc.pages を更新済み): 画面とページ一覧を合わせる */
  const handleRemote = useCallback(async (i: RemoteInfo) => {
    const d = docRef.current, ed = edRef.current
    if (!d || !ed || disposed.current) return
    if (d.width !== ed.width || d.height !== ed.height) { ed.resizePage(d.width, d.height); fit() }
    setDoc({ ...d })
    let idx = d.pages.findIndex((p) => p.id === (viewIdRef.current || ed.pageId))
    if (idx < 0 && viewIdRef.current) idx = d.pages.findIndex((p) => p.id === ed.pageId)
    if (idx < 0 || i.adopt) {
      // 開いていたページが無くなった、または部屋の内容に切り替えた: 開き直す
      idx = Math.max(0, Math.min(d.pages.length - 1, idx < 0 ? pageIdxRef.current : idx))
      setPageIdx(idx)
      viewIdRef.current = d.pages[idx].id
      await ed.showPage(d.pages[idx].id, d.pages[idx].json).catch(() => {})
    } else {
      setPageIdx(idx)
      await collabRef.current?.binding.syncCurrentPage()
    }
    if (disposed.current) return
    for (const p of d.pages) if (i.adopt || i.structural || i.meta || i.changedPages.includes(p.id)) refreshThumb(p.id)
    persist({ remote: true })
  }, [fit, refreshThumb, persist])

  useEffect(() => {
    const ed = edRef.current
    if (!loaded || !ed || !collabRoom) return
    if (!myName) { if (!declinedName.current) setAskName('join'); return }
    const session = new CollabSession(collabRoom)
    const aw = session.awareness
    initPresence(aw, myName)
    const binding = new CollabBinding(session, () => docRef.current, (m) => toast.error(m))
    binding.onRemote = (i) => { void handleRemote(i) }
    binding.attach(ed)
    collabRef.current = { session, binding }
    setCollab({ session, binding })
    const offErr = session.onError((m) => toast.error(m))
    // 自分の居場所(ページ・選択)とカーソルを知らせる
    let lastPage = '', lastSel = ''
    const pub = () => {
      if (ed.pageId !== lastPage) { lastPage = ed.pageId; aw.setLocalStateField('page', ed.pageId) }
      const sel = ed.selected().map((o: any) => o.id as string).filter(Boolean)
      const key = sel.join(',')
      if (key !== lastSel) { lastSel = key; aw.setLocalStateField('sel', sel) }
    }
    pub()
    const offUpd = ed.onUpdate(pub)
    let lastMove = 0
    const onMove = (e: any) => {
      const now = performance.now()
      if (now - lastMove < 100) return
      lastMove = now
      const pt = ed.canvas.getScenePoint(e.e)
      aw.setLocalStateField('cursor', { x: Math.round(pt.x), y: Math.round(pt.y) })
    }
    const onLeave = () => aw.setLocalStateField('cursor', null)
    ed.canvas.on('mouse:move', onMove)
    const upper = ed.canvas.upperCanvasEl
    upper.addEventListener('mouseleave', onLeave)
    return () => {
      offErr(); offUpd()
      ed.canvas.off('mouse:move', onMove)
      upper.removeEventListener('mouseleave', onLeave)
      binding.destroy()
      session.destroy()
      collabRef.current = null
      setCollab(null)
    }
  }, [loaded, collabRoom, myName, handleRemote])

  const startCollab = async (skipAsk = false) => {
    if (!skipAsk && !savedName()) { setAskName('start'); return }
    setCollabBusy(true)
    try {
      const room = await createRoom()
      const d = syncDoc()
      d.collab = { room }
      setDoc({ ...d })
      dirty.current = true
      await flush()
      navigator.clipboard?.writeText(collabUrl(room)).then(() => toast.success('招待リンクをコピーしました')).catch(() => {})
    } catch (e: any) { toast.error(e?.message ?? String(e)) } finally { setCollabBusy(false) }
  }
  const stopCollab = () => {
    const d = docRef.current
    if (!d) return
    delete d.collab
    setDoc({ ...d })
    dirty.current = true
    flush()
    toast('共同編集をやめました。このデザインは手元のコピーとして残ります')
  }

  useEffect(() => () => {
    // ホームへ戻る前に編集中の文字を確定してから破棄する
    try { edRef.current?.finishEditing() } catch { /* */ }
    edRef.current?.dispose(); edRef.current = null
  }, [])

  // 離脱・タブ切替・ホームへ戻る時に保存を確定
  useEffect(() => {
    const settle = () => { try { edRef.current?.finishEditing() } catch { /* 破棄済み */ } return flush() }
    const onHide = () => { if (document.visibilityState === 'hidden') settle() }
    const onPageHide = () => { settle() }
    const onUnload = (e: BeforeUnloadEvent) => { try { edRef.current?.finishEditing() } catch { /* */ } if (dirty.current) { flush(); e.preventDefault() } }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('beforeunload', onUnload)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('beforeunload', onUnload)
    }
  }, [saveState, flush])
  useEffect(() => () => {
    // ホームへ戻る時: 未保存分だけ書き、以後のタイマーは止める(削除済みの復活を防ぐ)
    flush().finally(() => { disposed.current = true })
    clearTimeout(thumbDocTimer.current)
    thumbTimers.current.forEach((t) => clearTimeout(t))
  }, [flush])

  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [help, setHelp] = useState(false)
  const [vEdit, setVEdit] = useState<VText | null>(null)
  useEffect(() => { const ed = edRef.current; if (ed) { ed.onContextMenu = (x, y) => setMenu({ x, y }); ed.onEditVText = (o) => setVEdit(o) } })

  // ⌘/Ctrl+ホイール(トラックパッドのピンチ)でズーム。カーソル位置を中心に拡大する
  useEffect(() => {
    const area = areaRef.current
    if (!area) return
    const onWheel = (e: WheelEvent) => {
      const ed = edRef.current
      if (!ed || !(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      const before = ed.clientToPage(e.clientX, e.clientY)
      ed.setZoom(ed.zoom * Math.exp(-e.deltaY * 0.01))
      const r = ed.canvas.upperCanvasEl.getBoundingClientRect()
      area.scrollLeft += r.left + before.x * ed.zoom - e.clientX
      area.scrollTop += r.top + before.y * ed.zoom - e.clientY
    }
    area.addEventListener('wheel', onWheel, { passive: false })
    return () => area.removeEventListener('wheel', onWheel)
  }, [loaded])

  // スペースを押しながらドラッグで表示を移動
  useEffect(() => {
    let space = false, drag: { x: number; y: number } | null = null
    const area = areaRef.current
    const setPan = (on: boolean) => {
      const ed = edRef.current
      if (!ed) return
      ed.canvas.selection = !on
      ed.canvas.skipTargetFind = on
      ed.canvas.defaultCursor = on ? 'grab' : 'default'
      area?.classList.toggle('panning', on)
    }
    const kd = (e: KeyboardEvent) => { if (e.code === 'Space' && !isTyping(e) && !(edRef.current?.active() as any)?.isEditing) { if (!space) { space = true; setPan(true) } e.preventDefault() } }
    const ku = (e: KeyboardEvent) => { if (e.code === 'Space') { space = false; drag = null; setPan(false) } }
    const md = (e: MouseEvent) => { if (space) { drag = { x: e.clientX, y: e.clientY }; e.preventDefault() } }
    const mm = (e: MouseEvent) => { if (drag && area) { area.scrollLeft -= e.clientX - drag.x; area.scrollTop -= e.clientY - drag.y; drag = { x: e.clientX, y: e.clientY } } }
    const mu = () => { drag = null }
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku)
    area?.addEventListener('mousedown', md, true); window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu)
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); area?.removeEventListener('mousedown', md, true); window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu) }
  }, [loaded])

  // スマホ: ピンチ・2 本指の移動・長押し・ダブルタップ。範囲選択は指の移動と紛らわしいので切る
  useEffect(() => {
    const area = areaRef.current
    if (!loaded || !isMobile || !area) return
    const ed = edRef.current
    if (ed) ed.canvas.selection = false
    const off = attachTouchGestures(area, () => edRef.current)
    return () => { off(); if (edRef.current) edRef.current.canvas.selection = true }
  }, [loaded, isMobile])
  // スマホ: オブジェクトを選んだら、ツール用のシートを閉じて選択中のツールバーを見せる
  const hasSel = !!edRef.current?.active()
  useEffect(() => { if (isMobile && hasSel) setTab(null) }, [isMobile, hasSel])

  // キーボードショートカット
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ed = edRef.current
      if (!ed || isTyping(e)) return
      if (document.querySelector('.modal-back, .present, .ctx-menu')) return // 前面の画面があるときは編集しない
      const active = ed.active() as any
      if (active?.isEditing) return
      const mod = e.metaKey || e.ctrlKey
      const k = e.key.toLowerCase()
      if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? ed.redo() : ed.undo() }
      else if (mod && k === 'y') { e.preventDefault(); ed.redo() }
      else if (mod && k === 'c') { if (active) { e.preventDefault(); ed.copy().then((ok) => { if (ok) navigator.clipboard?.writeText(ed.clipboardStamp).catch(() => {}) }) } }
      else if (mod && k === 'x') { if (active) { e.preventDefault(); ed.copy().then((ok) => { if (ok) { navigator.clipboard?.writeText(ed.clipboardStamp).catch(() => {}); ed.remove() } }) } }
      else if (mod && k === 'v') { /* paste イベントで処理(画像貼り付けと両立させる) */ }
      else if (mod && k === 'd') { e.preventDefault(); ed.duplicate() }
      else if (mod && k === 'a') { e.preventDefault(); ed.selectAll() }
      else if (mod && k === 'g') { e.preventDefault(); e.shiftKey ? ed.ungroup() : ed.group() }
      else if (mod && k === 'l') { e.preventDefault(); ed.toggleLock() }
      else if (mod && (k === '=' || k === '+')) { e.preventDefault(); ed.setZoom(ed.zoom * 1.2) }
      else if (mod && k === '-') { e.preventDefault(); ed.setZoom(ed.zoom / 1.2) }
      else if (mod && k === '0') { e.preventDefault(); fit() }
      else if (k === 'delete' || k === 'backspace') { if (active) { e.preventDefault(); ed.remove() } }
      else if (k === 'escape') { ed.canvas.discardActiveObject(); ed.canvas.requestRenderAll(); ed.emit() }
      else if (k.startsWith('arrow') && active) {
        e.preventDefault()
        const d = e.shiftKey ? 10 : 1
        ed.nudge(k === 'arrowleft' ? -d : k === 'arrowright' ? d : 0, k === 'arrowup' ? -d : k === 'arrowdown' ? d : 0)
      }
      else if (!mod && k === 't') { ed.addText({ text: 'テキスト', fontSize: 64 }) }
      else if (!mod && (k === 'r' || k === 'c' || k === 'l')) { ed.addShape(SHAPES.find((s) => s.id === ({ r: 'rect', c: 'circle', l: 'line' } as any)[k])!.make) }
      else if (mod && (e.code === 'BracketRight' || e.code === 'BracketLeft')) { e.preventDefault(); ed.order(e.code === 'BracketRight' ? (e.shiftKey ? 'front' : 'forward') : (e.shiftKey ? 'back' : 'backward')) }
      else if (e.key === '?') { setHelp((h) => !h) }
    }
    const onPaste = async (e: ClipboardEvent) => {
      const ed = edRef.current
      if (!ed || (e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return
      if ((ed.active() as any)?.isEditing) return
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith('image/'))
      if (files.length) { e.preventDefault(); for (const f of files) await ed.addImageFile(f); return }
      const text = e.clipboardData?.getData('text/plain') ?? ''
      e.preventDefault()
      // irodori 内のコピーなら図形を貼る。外部からのテキストなら文字として追加
      if (text.startsWith('irodori:')) { ed.paste(); return } // irodori 内のコピー(別タブ・再読込後は中身が無いので何もしない)
      if (text) { ed.addText({ text: text.slice(0, 2000), fontSize: 48 }); return }
      ed.paste()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('paste', onPaste)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('paste', onPaste) }
  }, [fit])

  // ---------------- ページ操作 ----------------
  const gotoPage = async (i: number) => {
    const d = docRef.current!, ed = edRef.current!
    if (i < 0 || i >= d.pages.length) return
    const prev = pageIdx
    setPageIdx(i)
    const prevView = viewIdRef.current
    viewIdRef.current = d.pages[i].id
    try { await ed.showPage(d.pages[i].id, d.pages[i].json) }
    catch (e: any) {
      setPageIdx(prev)
      viewIdRef.current = prevView
      alert(`ページ ${i + 1} を開けませんでした(データが壊れている可能性があります)。${e?.message ?? ''}`)
      await ed.showPage(d.pages[prev].id, d.pages[prev].json).catch(() => {})
    }
  }
  const mutatePages = (fn: (d: DesignDoc) => number) => {
    const d = docRef.current!
    const next = fn(d)
    setDoc({ ...d })
    docRef.current = d
    persist()
    gotoPage(next)
    d.pages.forEach((p) => refreshThumb(p.id))
  }
  const addPage = () => mutatePages((d) => { d.pages.splice(pageIdx + 1, 0, blankPage()); return pageIdx + 1 })
  const dupPage = () => { syncDoc(); mutatePages((d) => { d.pages.splice(pageIdx + 1, 0, { id: newPageId(), json: structuredClone(d.pages[pageIdx].json) }); return pageIdx + 1 }) }
  const delPage = () => { if (docRef.current!.pages.length > 1) mutatePages((d) => { d.pages.splice(pageIdx, 1); return Math.max(0, pageIdx - 1) }) }
  const movePage = (dir: -1 | 1) => mutatePages((d) => {
    const j = pageIdx + dir
    if (j < 0 || j >= d.pages.length) return pageIdx
    ;[d.pages[pageIdx], d.pages[j]] = [d.pages[j], d.pages[pageIdx]]
    return j
  })

  const applyTemplate = (t: Template, mode: 'replace' | 'new' | 'all' = 'replace', page = 0) => {
    const d = docRef.current!
    if (mode === 'all') {
      const all = templatePagesJSON(t, d.width, d.height)
      mutatePages((dd) => { dd.pages.splice(pageIdx + 1, 0, ...all.map((json, i) => ({ id: newPageId() + i, json }))); return pageIdx + 1 })
      toast.success(`${all.length} ページを追加しました`)
      return
    }
    const json = templateToJSON(t, d.width, d.height, page)
    if (mode === 'new') mutatePages((dd) => { dd.pages.splice(pageIdx + 1, 0, { id: newPageId(), json }); return pageIdx + 1 })
    else edRef.current!.replaceCurrent(json)
  }
  // ページのドラッグ並べ替え
  const dragPage = useRef<number | null>(null)
  const dropPage = (to: number) => {
    const from = dragPage.current
    dragPage.current = null
    if (from === null || from === to) return
    mutatePages((d) => { const [p] = d.pages.splice(from, 1); d.pages.splice(to, 0, p); return to })
  }

  /** 今のページの最新内容を doc に反映して返す(書き出し・リサイズ・プレゼン前) */
  const syncDoc = () => {
    const ed = edRef.current, d = docRef.current!
    ed?.finishEditing()
    const p = d.pages.find((x) => x.id === ed?.pageId)
    if (p && ed) { const anim = p.json?.animation; p.json = ed.toJSON(); if (anim) p.json.animation = anim }
    return d
  }
  const [modal, setModal] = useState<'' | 'resize' | 'versions'>('')
  const [presenting, setPresenting] = useState(false)
  const reloadFromRepo = async () => {
    // 共同編集中は、サイズ変更・履歴の復元の結果を先に部屋へ書く(再読込のあと部屋の内容に上書きされないように)
    const c = collabRef.current
    if (c) {
      try { const d = await repo.get(docId); if (d) { c.binding.pushLocal(d); await new Promise((r) => setTimeout(r, 400)) } } catch { /* 書けなくても再読込はする */ }
    }
    disposed.current = true; dirty.current = false; location.reload()
  }

  const saveAsCopy = async () => {
    const d = structuredClone(syncDoc())
    d.id = newDocId(); d.name = d.name + '(自分の版)'; d.createdAt = Date.now()
    try { await repo.put(d, { baseUpdatedAt: null, thumb: d.thumb }); disposed.current = true; dirty.current = false; location.hash = '#/d/' + d.id; location.reload() }
    catch (e: any) { alert('保存できませんでした: ' + (e?.message ?? e)) }
  }

  /** BGM を設定・変更・外す(デザインに 1 本) */
  const setAudio = (a: DesignAudio | undefined) => {
    const d = docRef.current!
    if (a) d.audio = a; else delete d.audio
    setDoc({ ...d }); persist()
  }
  useEffect(() => { setMediaCollab(!!collab); return () => setMediaCollab(false) }, [collab])

  const rename = (name: string) => { const d = docRef.current!; d.name = name || '無題のデザイン'; setDoc({ ...d }); persist() }

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const ed = edRef.current
    const add = isIrodoriDrag(e) ? takeDrop() : null
    if (add && ed) {
      const pt = ed.clientToPage(e.clientX, e.clientY)
      await add(ed)
      await ed.moveActiveCenterTo(pt.x, pt.y)
      return
    }
    const all = Array.from(e.dataTransfer.files)
    for (const f of all.filter((f) => f.type.startsWith('image/'))) await edRef.current?.addImageFile(f)
    const vids = all.filter((f) => f.type.startsWith('video/'))
    if (vids.length && ed) { try { await addVideoFiles(ed, vids) } catch (er: any) { toast.error(er?.message ?? '動画を置けませんでした') } }
    const aud = all.find((f) => f.type.startsWith('audio/'))
    if (aud) { try { setAudio(await audioFromFile(aud)); toast.success('BGM に設定しました') } catch (er: any) { toast.error(er?.message ?? '音声を設定できませんでした') } }
  }

  if (loadErr) return <div className="center-msg">デザインを読み込めませんでした: {loadErr}<button className="chip" onClick={() => location.reload()}>再読み込み</button><a href="#/">ホームへ戻る</a></div>
  if (localOnlyState) return <div className="center-msg">このデザインは「この端末」だけに保存されています(ログイン前に作成)。<button className="primary-btn" onClick={async () => { const d = await localRepo.get(docId); if (!d) return; try { await migrateOne(d); location.reload() } catch (e: any) { alert(e?.message ?? e) } }}>クラウドに移して開く</button><a href="#/">ホームへ戻る</a></div>
  if (missing) return <div className="center-msg">デザインが見つかりませんでした。<a href="#/">ホームへ戻る</a></div>
  if (!doc) return <div className="center-msg">読み込み中…</div>
  if (doc.deck) return <DeckEditor initial={doc} />
  const ed = edRef.current
  const docColors = ed ? [...new Set([...brandSync().colors, ...collectColors(ed.toJSON())])].slice(0, 24) : []

  // 上部バーの機能ボタン(PC: バーに並べる / スマホ: 「…」メニューの中に並べる)
  const extras = (
    <>
      <button className="tb-btn" title="サイズを変更(マジックリサイズ)" onClick={() => { setMenuOpen(false); syncDoc(); flush(); setModal('resize') }}><Scaling size={18} /><span className="hide-sm">サイズ変更</span></button>
      {ed && <DesignTools ed={ed} getDoc={syncDoc} gotoPage={gotoPage} reload={() => { const d = docRef.current!; const p = d.pages[pageIdx]; persist(); ed.replaceCurrent(p.json); d.pages.forEach((x) => refreshThumb(x.id)) }} />}
      <AnimateButton getDoc={syncDoc} pageIdx={pageIdx} onChange={persist} />
      {isLocal() && <AskAIButton docId={doc.id} page={pageIdx + 1} />}
      <button className="tb-btn" title="バージョン履歴" onClick={() => { setMenuOpen(false); syncDoc(); flush(); setModal('versions') }}><History size={18} /><span className="only-m">履歴</span></button>
      <button className="tb-btn" title="プレゼンテーション(全画面)" onClick={() => { setMenuOpen(false); syncDoc(); setPresenting(true) }}><Play size={18} /><span className="hide-sm">プレゼン</span></button>
      <ShareButton docId={doc.id} initialShareId={(doc as any).shareId ?? null} beforeShare={async () => { syncDoc(); dirty.current = true; await flush() }}
        collab={isLocal() ? undefined : { room: collabRoom, busy: collabBusy, onStart: () => { void startCollab() }, onStop: stopCollab }} />
    </>
  )

  return (
    <div className="editor">
      {isMobile ? (
        <header className="topbar mobile">
          <a className="tb-btn" href="#/" aria-label="ホームへ戻る"><ChevronLeft size={22} /></a>
          <button className="tb-btn" aria-label="元に戻す" disabled={!ed?.canUndo()} onClick={() => ed?.undo()}><Undo2 size={20} /></button>
          <button className="tb-btn" aria-label="やり直す" disabled={!ed?.canRedo()} onClick={() => ed?.redo()}><Redo2 size={20} /></button>
          <span className={'save-state icon ' + saveState} aria-label={saveState === 'error' ? '保存できません' : saveState === 'saving' ? '保存中' : '保存済み'}>
            {saveState === 'error' ? <CloudOff size={18} /> : <Cloud size={18} />}
          </span>
          <div className="tb-spacer" />
          <DownloadButton getDoc={syncDoc} peekDoc={() => docRef.current!} currentPage={pageIdx} />
          <button className={'tb-btn' + (menuOpen ? ' on' : '')} aria-label="メニュー" onClick={() => setMenuOpen(!menuOpen)}><MoreHorizontal size={22} /></button>
          {menuOpen && <>
            <div className="m-menu-back" onPointerDown={() => setMenuOpen(false)} />
            <div className="m-menu">
              <input className="doc-name" value={doc.name} onChange={(e) => rename(e.target.value)} aria-label="デザインの名前" />
              <div className="m-menu-sub">{doc.width}×{doc.height}{doc.print ? ` (${doc.print.mmW}×${doc.print.mmH}mm)` : ''} ・ {saveState === 'error' ? '保存できません' : saveState === 'saving' ? '保存中…' : '保存済み'}</div>
              {doc.audio && <AudioBar audio={doc.audio} onChange={setAudio} />}
              {collab && myName && <CollabBar session={collab.session} selfName={myName} selfColor={colorFor(myName)} />}
              <div className="m-menu-grid">{extras}</div>
            </div>
          </>}
        </header>
      ) : (
      <header className="topbar">
        <a className="tb-btn home-link" href="#/"><ChevronLeft size={18} />ホーム</a>
        <input className="doc-name" value={doc.name} onChange={(e) => rename(e.target.value)} />
        <span className="size-label">{doc.width}×{doc.height}{doc.print ? ` (${doc.print.mmW}×${doc.print.mmH}mm)` : ''}</span>
        <button className="tb-btn" title="元に戻す (⌘Z)" disabled={!ed?.canUndo()} onClick={() => ed?.undo()}><Undo2 size={18} /></button>
        <button className="tb-btn" title="やり直す (⇧⌘Z)" disabled={!ed?.canRedo()} onClick={() => ed?.redo()}><Redo2 size={18} /></button>
        <span className={'save-state ' + saveState} title={saveState === 'error' ? 'このブラウザでは保存できません(プライベートモード等)。ダウンロードして保存してください' : ''}>
          {saveState === 'error' ? <><CloudOff size={16} />保存できません</> : saveState === 'saving' ? <><Cloud size={16} />保存中…</> : <><Cloud size={16} />保存済み</>}
        </span>
        {doc.audio && <AudioBar audio={doc.audio} onChange={setAudio} />}
        {collab && myName && <CollabBar session={collab.session} selfName={myName} selfColor={colorFor(myName)} />}
        <div className="tb-spacer" />
        {extras}
        <DownloadButton getDoc={syncDoc} peekDoc={() => docRef.current!} currentPage={pageIdx} />
      </header>
      )}
      {modal === 'resize' && <ResizeModal getDoc={syncDoc} onClose={() => setModal('')} onResized={reloadFromRepo} />}
      {modal === 'versions' && <VersionsModal getDoc={syncDoc} onClose={() => setModal('')} onRestore={reloadFromRepo} />}
      {presenting && <Present doc={docRef.current!} startPage={pageIdx} onClose={() => setPresenting(false)} />}
      {saveState === 'error' && !conflict && <div className="conflict">保存できていません(通信が切れたか、このブラウザでは保存できない設定です)。作業を失わないよう、いまダウンロードしておくことをおすすめします。<button className="chip" onClick={() => exportDoc(syncDoc(), 'pdf', 1, 'all')}>PDF で保存</button><button className="chip" onClick={() => { dirty.current = true; flush() }}>もう一度保存</button></div>}
      {askName && <NameModal initial="" onCancel={() => { declinedName.current = true; setAskName('') }}
        onOk={(n) => { const mode = askName; saveName(n); setMyName(n); setAskName(''); if (mode === 'start') void startCollab(true) }} />}
      {vEdit && ed && <VTextEditor ed={ed} v={vEdit} onClose={() => setVEdit(null)} />}
      {menu && ed && <ContextMenu ed={ed} x={menu.x} y={menu.y} onClose={() => setMenu(null)} />}
      {help && <div className="modal-back" onPointerDown={() => setHelp(false)}><div className="modal" onPointerDown={(e) => e.stopPropagation()}><h3>キーボードショートカット</h3><table className="keys"><tbody>{SHORTCUTS.map(([k, v]) => <tr key={k}><td><kbd>{k}</kbd></td><td>{v}</td></tr>)}</tbody></table><div className="row" style={{ justifyContent: 'flex-end', marginTop: 12 }}><button className="chip" onClick={() => setHelp(false)}>閉じる</button></div></div></div>}
      {conflict && <div className="conflict">このデザインは別のタブ(または別の操作)で更新されました。上書きを防ぐため保存を止めています。<button className="chip" onClick={() => location.reload()}>最新を読み込む(この画面の変更は破棄)</button><button className="chip" onClick={saveAsCopy}>この画面の内容を別のデザインとして保存</button></div>}
      <div className="workspace">
        {!isMobile && <nav className="rail">
          {TABS.map(([id, label, icon]) => (
            <button key={id} className={'rail-btn' + (tab === id ? ' on' : '')} onClick={() => setTab(tab === id ? null : id)}>{icon}<span>{label}</span></button>
          ))}
        </nav>}
        {tab && ed && !isMobile && <LeftPanel tab={tab} ed={ed} onApplyTemplate={applyTemplate} version={version.current} audio={doc.audio} onAudio={setAudio} />}
        {tab && ed && isMobile && <BottomSheet key={tab} title={TABS.find((t) => t[0] === tab)?.[1] ?? ''} onClose={() => setTab(null)}>
          <LeftPanel tab={tab} ed={ed} onApplyTemplate={applyTemplate} version={version.current} audio={doc.audio} onAudio={setAudio} />
        </BottomSheet>}
        <main className="stage-col">
          {ed && <Toolbar ed={ed} docColors={docColors} />}
          <div ref={areaRef} className={'stage' + (dragOver ? ' drag' : '')}
            onContextMenu={(e) => e.preventDefault()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}
            onMouseDown={(e) => { if (e.target === areaRef.current && ed) { ed.canvas.discardActiveObject(); ed.canvas.requestRenderAll(); ed.emit() } }}>
            <div className="page-wrap">
              <div className="page-shadow"><canvas ref={canvasEl} /></div>
              {ed && collab && <CursorLayer ed={ed} awareness={collab.session.awareness} />}
            </div>
          </div>
          <footer className="bottombar">
            <div className="pages">
              {doc.pages.map((p, i) => (
                <button key={p.id} className={'page-thumb' + (i === pageIdx ? ' on' : '')} onClick={() => gotoPage(i)} title={`ページ ${i + 1}(ドラッグで並べ替え)`}
                  draggable={!isMobile} onDragStart={() => { dragPage.current = i }} onDragOver={(e) => { if (dragPage.current !== null) e.preventDefault() }} onDrop={(e) => { e.preventDefault(); e.stopPropagation(); dropPage(i) }}>
                  {thumbs[p.id] ? <img src={thumbs[p.id]} alt="" style={{ aspectRatio: `${doc.width}/${doc.height}` }} /> : <div className="thumb-ph" style={{ aspectRatio: `${doc.width}/${doc.height}` }} />}
                  <span>{i + 1}</span>
                </button>
              ))}
              <button className="page-add" onClick={addPage} title="ページを追加"><Plus size={20} /></button>
            </div>
            <div className="page-ops">
              <button className="tb-btn" title="ページを複製" onClick={dupPage}><Copy size={16} /></button>
              <button className="tb-btn" title="前へ移動" onClick={() => movePage(-1)}><ChevronUp size={16} /></button>
              <button className="tb-btn" title="後ろへ移動" onClick={() => movePage(1)}><ChevronDown size={16} /></button>
              <button className="tb-btn" title="ページを削除" disabled={doc.pages.length <= 1} onClick={delPage}><Trash2 size={16} /></button>
            </div>
            <div className="zoom">
              <input type="range" min={5} max={300} value={Math.round((ed?.zoom ?? 1) * 100)} onChange={(e) => ed?.setZoom(+e.target.value / 100)} />
              <span>{Math.round((ed?.zoom ?? 1) * 100)}%</span>
              <button className="tb-btn" title="画面に合わせる (⌘0)" onClick={fit}><Maximize size={16} /></button>
            </div>
          </footer>
        </main>
        {isMobile && <MobileTabBar tab={tab} setTab={setTab} />}
      </div>
    </div>
  )
}

function AnimateButton({ getDoc, pageIdx, onChange }: { getDoc: () => DesignDoc; pageIdx: number; onChange: () => void }) {
  const { open, setOpen, ref } = usePopover()
  return (
    <div className="pop-wrap" ref={ref}>
      <button className={'tb-btn' + (open ? ' on' : '')} title="アニメーション・動画" onClick={() => setOpen(!open)}><Clapperboard size={18} /><span className="hide-sm">アニメ</span></button>
      {open && <div className="popover right anim-pop"><AnimatePanel getDoc={getDoc} pageIdx={pageIdx} onChange={onChange} /></div>}
    </div>
  )
}

/** エディタ上部: このデザインについて AI に頼む(ローカル版のみ) */
function AskAIButton({ docId, page }: { docId: string; page: number }) {
  const { open, setOpen, ref } = usePopover()
  return (
    <div className="pop-wrap" ref={ref}>
      <button className={'tb-btn' + (open ? ' on' : '')} title="このデザインについて AI エージェントに依頼" onClick={() => setOpen(!open)}><Bot size={18} /><span className="hide-sm">AI に依頼</span></button>
      {open && <div className="popover right ask-pop"><RequestBoard designId={docId} page={page} compact /></div>}
    </div>
  )
}
