import {
  ActiveSelection, Canvas, FabricImage, PencilBrush, FabricObject, Gradient, Group, Path, Point, Shadow, StaticCanvas, Textbox, cache, filters, util,
} from 'fabric'
import { collabMediaProblem, downscale, putAsset, putMediaAsset, resolveAssets, resolveAssetsAsDataURL } from './assets'
import { Video, createVideo } from './video'
import { fillFrame } from './elements'
import { VText } from './vtext'

// ---- 全キャンバス共通の既定値(どの canvas を作るより前に1回だけ実行される) ----
// v7 の既定は中心基準。テンプレ座標を左上基準で書けるように戻す
FabricObject.ownDefaults.originX = 'left'
FabricObject.ownDefaults.originY = 'top'
Object.assign(FabricObject.ownDefaults, {
  transparentCorners: false, cornerColor: '#ffffff', cornerStrokeColor: '#8b5cf6', borderColor: '#8b5cf6',
  cornerStyle: 'circle', cornerSize: 11, borderScaleFactor: 1.5, padding: 2,
  // 回転は 45° ごとに吸い付く(±5°以内)
  snapAngle: 45, snapThreshold: 5,
})
// toObject で保存したい独自の値
FabricObject.customProperties = ['id', 'name', 'assetId', 'locked', 'frame', 'chart', 'qr', 'table', 'vertical', 'curved', 'credit']

export const SAVE_PROPS = ['id', 'name', 'assetId', 'locked', 'frame', 'chart', 'qr', 'table', 'vertical', 'curved', 'credit', 'subTargetCheck', 'cropX', 'cropY']

export const uid = () => Math.random().toString(36).slice(2, 10)

export type Listener = () => void

/** 共同編集中の取り消し(Y.UndoManager)。あれば undo/redo はこちらを使う */
export interface UndoHandler { undo(): void; redo(): void; canUndo(): boolean; canRedo(): boolean }

/** ロック状態をオブジェクトの操作可否に反映する(toObject は lockMovement* を保存しないため読み込み後に付け直す) */
export function applyLock(o: FabricObject, locked: boolean) {
  o.set({
    locked, lockMovementX: locked, lockMovementY: locked, lockScalingX: locked, lockScalingY: locked,
    lockRotation: locked, hasControls: !locked, editable: !locked,
  } as any)
}

/** JSON に含まれるフォントをすべて読み込んでから描く(未読込のまま読むと文字幅が代替フォントで確定してしまう) */
export async function ensureFonts(json: any, timeoutMs = 4000) {
  const fams = new Map<string, string>()
  const walk = (o: any) => {
    if (!o) return
    if (o.fontFamily) fams.set(o.fontFamily, (fams.get(o.fontFamily) ?? '') + (o.text ?? '').slice(0, 200))
    o.objects?.forEach(walk)
  }
  ;(json.objects ?? []).forEach(walk)
  await loadFonts([...fams.entries()], timeoutMs)
}

export async function loadFonts(list: [string, string][], timeoutMs = 4000) {
  if (!list.length || !document.fonts) return
  const p = Promise.all(list.map(([f, sample]) =>
    Promise.all([400, 700].map((w) => document.fonts.load(`${w} 32px "${f}"`, sample || 'あA')))
      .then(() => cache.clearFontCache(f)).catch(() => {})))
  await Promise.race([p, new Promise((r) => setTimeout(r, timeoutMs))])
}

export class EditorCore {
  canvas: Canvas
  width: number
  height: number
  zoom = 1
  pageId = ''
  private history = new Map<string, { stack: string[]; index: number }>()
  private restoring = false
  private queue: Promise<unknown> = Promise.resolve()
  private listeners = new Set<Listener>()
  private changeListeners = new Set<Listener>()
  private clipboard: FabricObject[] = []
  private guides: { v: number[]; h: number[] } = { v: [], h: [] }
  private pendingNudge = 0
  private undoHandler: UndoHandler | null = null
  private remoteDeferred = false
  private liveTimer = 0
  /** true なら文字入力中の変化も 300ms ごとに changeListeners へ届ける(共同編集用) */
  liveText = false
  /** いま届けている変化が文字入力途中のもの(共同編集が取り消しの区切りに使う) */
  liveNow = false
  /** ページを表示し終えた(共同編集が基準を取り直す) */
  onShown?: (pageId: string) => void
  /** 操作中で保留していた他の人の変更を、操作が終わったので反映し直してほしい */
  onRemoteFlush?: () => void
  onContextMenu?: (x: number, y: number) => void
  /** 縦書きテキストをダブルクリックしたとき(編集欄を開く) */
  onEditVText?: (o: VText) => void

  constructor(el: HTMLCanvasElement, width: number, height: number) {
    this.width = width
    this.height = height
    this.canvas = new Canvas(el, {
      width, height, backgroundColor: '#ffffff', preserveObjectStacking: true,
      selectionColor: 'rgba(139,92,246,0.08)', selectionBorderColor: '#8b5cf6', selectionLineWidth: 1,
      stopContextMenu: true, fireRightClick: true,
    })
    const c = this.canvas
    const emit = () => this.emit()
    c.on('selection:created', emit)
    c.on('selection:updated', emit)
    c.on('selection:cleared', emit)
    c.on('object:modified', () => this.commit())
    c.on('text:editing:exited', () => this.commit())
    c.on('text:changed', () => { emit(); if (this.liveText) this.scheduleLive() })
    c.on('mouse:up', () => this.flushRemote())
    c.on('text:editing:exited', () => this.flushRemote())
    c.on('object:moving', (e) => this.snap(e.target))
    c.on('mouse:up', () => { this.guides = { v: [], h: [] }; c.requestRenderAll() })
    c.on('after:render', () => this.drawGuides())
    // 右クリック: 対象を選択してからメニューを出す
    c.on('mouse:down', (e: any) => {
      if (e.e?.button !== 2) return
      const t = e.target as FabricObject | undefined
      if (t && !this.selected().includes(t)) { c.setActiveObject(t); c.requestRenderAll(); this.emit() }
      if (!t) { c.discardActiveObject(); c.requestRenderAll(); this.emit() }
      this.onContextMenu?.(e.e.clientX, e.e.clientY)
    })
    // 縦書き: ダブルクリックで編集欄を開く
    c.on('mouse:dblclick', (e: any) => { if (e.target instanceof VText && !(e.target as any).locked) this.onEditVText?.(e.target) })
    // 表: ダブルクリックでセルの文字を編集
    c.on('mouse:dblclick', (e: any) => {
      const g = e.target
      if (!(g instanceof Group) || !(g as any).table) return
      // クリック位置を表の座標に直して、何行目・何列目かを計算する(当たり判定は空セルで不正確なため)
      const t = (g as any).table
      const kids = g.getObjects()
      const p = util.sendPointToPlane(e.scenePoint ?? c.getScenePoint(e.e), undefined, g.calcTransformMatrix())
      const lx = p.x + g.width / 2, ly = p.y + g.height / 2
      const col = Math.max(0, Math.min(t.cols - 1, Math.floor((lx / g.width) * t.cols)))
      const row = Math.max(0, Math.min(t.rows - 1, Math.floor((ly / g.height) * t.rows)))
      const cell = kids[(row * t.cols + col) * 2 + 1]
      if (!(cell instanceof Textbox)) return
      g.set({ interactive: true })
      c.setActiveObject(cell)
      // fabric 自身のダブルクリック処理が終わってから編集に入る(同期だと直後に解除される)
      setTimeout(() => {
        if (c.getActiveObject() !== cell) return
        cell.enterEditing()
        cell.selectAll()
        c.requestRenderAll()
      }, 0)
    })
    c.on('text:editing:exited', (e: any) => {
      const g = e.target?.group
      if (g && (g as any).table) { g.set({ interactive: false }); g.triggerLayout?.(); g.setCoords() }
    })
    c.on('selection:cleared', () => {
      for (const o of c.getObjects()) if ((o as any).table && (o as any).interactive) o.set({ interactive: false } as any)
    })
  }

  // ---------------- イベント ----------------
  /** 選択や属性が変わった(UI 再描画用) */
  onUpdate(fn: Listener) { this.listeners.add(fn); return () => { this.listeners.delete(fn) } }
  /** 内容が確定した(自動保存用) */
  onChange(fn: Listener) { this.changeListeners.add(fn); return () => { this.changeListeners.delete(fn) } }
  emit() { this.listeners.forEach((f) => f()) }

  /** 非同期処理を1本の列で順番に実行する(undo 連打・ページ切替・保存の競合を防ぐ) */
  enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.queue.then(fn, fn)
    this.queue = next.catch(() => {})
    return next
  }

  // ---------------- シリアライズ ----------------
  toJSON(): any {
    // 共同編集はオブジェクト id で同期するので、id の無い物には必ず付ける
    for (const o of this.canvas.getObjects()) if (!(o as any).id) (o as any).id = uid()
    const json = this.canvas.toObject(SAVE_PROPS)
    // 画像の src は一時 URL なので保存しない(assetId から復元する)
    const strip = (o: any) => { if (o.assetId) delete o.src; o.objects?.forEach(strip) }
    json.objects.forEach(strip)
    return json
  }

  private async load(json: any) {
    this.restoring = true
    try {
      await ensureFonts(json)
      const resolved = await resolveAssets(json)
      this.canvas.discardActiveObject()
      this.pauseVideos()
      await this.canvas.loadFromJSON(resolved)
      this.canvas.getObjects().forEach((o: any) => { if (o.locked) applyLock(o, true); if (o.table) o.set({ interactive: false }) })
      if (!this.canvas.backgroundColor) this.canvas.backgroundColor = '#ffffff'
      this.canvas.requestRenderAll()
    } finally {
      this.restoring = false
    }
  }

  /** 編集中のテキストを確定する(ページ切替・取り消し・書き出しの前に同期で呼ぶ) */
  finishEditing() {
    const a = this.active() as any
    if (a?.isEditing) a.exitEditing()
    else if (this.restoring === false && this.pendingNudge) { clearTimeout(this.pendingNudge); this.pendingNudge = 0; this.commit() }
  }

  /** ページを表示する。履歴はページごとに持つ */
  showPage(pageId: string, json: any) {
    this.finishEditing()
    return this.enqueue(async () => {
      const prevJSON = this.pageId ? this.toJSON() : null
      try { await this.load(json ?? { objects: [], background: '#ffffff' }) }
      catch (e) { if (prevJSON) await this.load(prevJSON).catch(() => {}); throw e } // 失敗したら元のページに戻す
      this.pageId = pageId
      if (!this.history.has(pageId)) this.history.set(pageId, { stack: [JSON.stringify(this.toJSON())], index: 0 })
      this.emit()
      this.onShown?.(pageId)
    })
  }

  /** 今のページの内容を丸ごと置き換える(テンプレ適用など)。取り消し可能 */
  replaceCurrent(json: any) {
    this.finishEditing()
    return this.enqueue(async () => {
      await this.load(json)
      this.commit()
    })
  }

  // ---------------- 履歴 ----------------
  /** 変更を確定して履歴に積む。パネル操作などコードからの変更は必ずこれを呼ぶ */
  commit() {
    if (this.restoring) return
    const h = this.history.get(this.pageId)
    const snap = JSON.stringify(this.toJSON())
    if (h) {
      if (h.stack[h.index] === snap) { this.emit(); return }
      h.stack = h.stack.slice(0, h.index + 1)
      h.stack.push(snap)
      if (h.stack.length > 80) h.stack.shift()
      h.index = h.stack.length - 1
    }
    this.emit()
    this.changeListeners.forEach((f) => f())
  }
  canUndo() { if (this.undoHandler) return this.undoHandler.canUndo(); const h = this.history.get(this.pageId); return !!h && h.index > 0 }
  canRedo() { if (this.undoHandler) return this.undoHandler.canRedo(); const h = this.history.get(this.pageId); return !!h && h.index < h.stack.length - 1 }
  undo() { return this.undoHandler ? this.viaHandler('undo') : this.step(-1) }
  redo() { return this.undoHandler ? this.viaHandler('redo') : this.step(1) }
  private viaHandler(kind: 'undo' | 'redo') {
    this.finishEditing()
    return this.enqueue(async () => { this.undoHandler?.[kind](); this.emit() })
  }
  /** 共同編集中は Y.UndoManager に切り替える(自分の操作だけを取り消す)。null で元に戻す */
  setUndoHandler(h: UndoHandler | null) { this.undoHandler = h; this.emit() }

  private scheduleLive() {
    if (this.liveTimer) return
    this.liveTimer = window.setTimeout(() => {
      this.liveTimer = 0
      this.liveNow = true
      try { this.changeListeners.forEach((f) => f()) } finally { this.liveNow = false }
    }, 300)
  }
  private flushRemote() {
    if (!this.remoteDeferred) return
    this.remoteDeferred = false
    setTimeout(() => this.onRemoteFlush?.(), 0)
  }

  /** いま自分が操作中(文字の編集中・ドラッグ中)のオブジェクトの id。表の中のセルなら表の id も含む */
  private busyIds(): Set<string> {
    const s = new Set<string>()
    const add = (o: any) => {
      for (let x = o; x; x = x.group && !(x.group instanceof ActiveSelection) ? x.group : null) if (x.id) s.add(x.id)
    }
    const a = this.canvas.getActiveObject() as any
    if (a?.isEditing) add(a)
    const t = (this.canvas as any)._currentTransform?.target
    if (t) (t instanceof ActiveSelection ? t.getObjects() : [t]).forEach(add)
    return s
  }

  /**
   * 共同編集: 他の人の変更を表示中のページに反映する(履歴は積まず、commit も出さない)。
   * json = 反映したいページの全体(objects は並び順どおり)。changed = 作り直す物の id、removed = 消す物の id。
   * 自分が編集中・ドラッグ中の物は触らず、その id を返す(操作が終わったら onRemoteFlush で呼び直してもらう)。
   */
  applyRemote(json: any, opts: { changed: Set<string>; removed: Set<string>; pageId?: string }): Promise<Set<string>> {
    return this.enqueue(async () => {
      const deferred = new Set<string>()
      if (opts.pageId && opts.pageId !== this.pageId) return deferred
      const c = this.canvas
      const target: any[] = Array.isArray(json?.objects) ? json.objects : []
      // 作り直す物は先に用意する(フォント・画像の読み込みを待つ間は通常どおり操作できる)
      const built = new Map<string, FabricObject>()
      const toBuild = target.filter((o) => o?.id && opts.changed.has(o.id))
      if (toBuild.length) {
        await ensureFonts({ objects: toBuild })
        const resolved = await resolveAssets({ objects: toBuild })
        for (const o of resolved.objects) {
          try {
            const [obj] = await util.enlivenObjects<FabricObject>([o])
            if (!obj) continue
            if ((obj as any).locked) applyLock(obj, true)
            if ((obj as any).table) obj.set({ interactive: false })
            built.set(o.id, obj)
          } catch (e) { console.warn('共同編集: オブジェクトを復元できませんでした', o?.id, e) }
        }
      }
      // 背景
      let newBg: any
      const curBg = c.backgroundColor as any
      const curBgStr = JSON.stringify(curBg && typeof curBg === 'object' && typeof curBg.toObject === 'function' ? curBg.toObject() : curBg ?? '')
      if (curBgStr !== JSON.stringify(json?.background ?? '')) {
        if (!json?.background || typeof json.background === 'string') newBg = json?.background || '#ffffff'
        else { try { newBg = (await util.enlivenObjectEnlivables<{ backgroundColor: any }>({ backgroundColor: json.background })).backgroundColor } catch { /* 背景は諦める */ } }
      }
      if (opts.pageId && opts.pageId !== this.pageId) return deferred
      // ここから先は同期(途中で自分の操作が割り込まない)
      const busy = this.busyIds()
      this.restoring = true
      try {
        const old = c.getObjects()
        const byId = new Map<string, FabricObject>()
        for (const o of old) if ((o as any).id) byId.set((o as any).id, o)
        const selIds = this.selected().map((o: any) => o.id as string | undefined)
        const replaced = [...built.keys()].filter((id) => !busy.has(id))
        const gone = [...opts.removed].filter((id) => byId.has(id) && !busy.has(id))
        for (const id of opts.changed) if (busy.has(id)) deferred.add(id)
        for (const id of opts.removed) if (busy.has(id)) deferred.add(id)
        // 選択中の物が差し替え・削除されるなら、先に選択を外す(複数選択の座標を絶対座標に戻すため)
        const touched = new Set([...replaced, ...gone])
        const reselect = selIds.length > 0 && selIds.some((id) => id && touched.has(id))
        if (reselect) c.discardActiveObject()
        for (const id of gone) c.remove(byId.get(id)!)
        for (const id of replaced) {
          const o = byId.get(id)
          if (o) c.remove(o)
          c.add(built.get(id)!)
        }
        // 並び順を揃える。Y に載っていない自分だけの物(画像の送信待ちなど)は、元の隣り合わせを保つ
        const present = new Map<string, FabricObject>()
        for (const o of c.getObjects()) if ((o as any).id) present.set((o as any).id, o)
        const desired: FabricObject[] = []
        const inTarget = new Set<string>()
        for (const o of target) { const x = o?.id && present.get(o.id); if (x && !inTarget.has(o.id)) { desired.push(x); inTarget.add(o.id) } }
        let prev: FabricObject | null = null
        for (const o of old) {
          const id = (o as any).id as string | undefined
          const now = id ? present.get(id) : o
          if (!now || !c.getObjects().includes(now)) continue
          if (id && inTarget.has(id)) { prev = now; continue }
          const at = prev ? desired.indexOf(prev) + 1 : 0
          desired.splice(at, 0, now)
          prev = now
        }
        desired.forEach((o, i) => { if (c.getObjects()[i] !== o) c.moveObjectTo(o, i) })
        if (newBg !== undefined) c.backgroundColor = newBg
        if (reselect) {
          const objs = selIds.map((id) => (id ? present.get(id) : undefined)).filter((o): o is FabricObject => !!o && c.getObjects().includes(o))
          if (objs.length === 1) c.setActiveObject(objs[0])
          else if (objs.length > 1) c.setActiveObject(new ActiveSelection(objs, { canvas: c }))
        }
        c.requestRenderAll()
      } finally {
        this.restoring = false
      }
      if (deferred.size) this.remoteDeferred = true
      this.emit()
      return deferred
    })
  }

  private step(d: number) {
    this.finishEditing()
    return this.enqueue(async () => {
      const h = this.history.get(this.pageId)
      if (!h) return
      const ni = h.index + d
      if (ni < 0 || ni >= h.stack.length) return
      h.index = ni
      await this.load(JSON.parse(h.stack[ni]))
      this.emit()
      this.changeListeners.forEach((f) => f())
    })
  }

  // ---------------- 表示 ----------------
  setZoom(z: number) {
    this.zoom = Math.max(0.05, Math.min(4, z))
    this.canvas.setDimensions({ width: Math.round(this.width * this.zoom), height: Math.round(this.height * this.zoom) })
    this.canvas.setZoom(this.zoom)
    this.emit()
  }
  resizePage(w: number, h: number) { this.width = w; this.height = h; this.setZoom(this.zoom) }

  // ---------------- 追加 ----------------
  /** 中央付近に置き、選択して確定する */
  place(o: FabricObject, opts: { center?: boolean } = {}) {
    // 読み込み(テンプレ適用・取り消し)の最中に追加すると消えるため、列に並べて実行する
    this.enqueue(async () => this.placeNow(o, opts))
    return o
  }
  private placeNow(o: FabricObject, opts: { center?: boolean } = {}) {
    ;(o as any).id ??= uid()
    if (opts.center !== false) {
      const w = o.getScaledWidth(), h = o.getScaledHeight()
      o.set({ left: (this.width - w) / 2, top: (this.height - h) / 2 })
    }
    this.canvas.add(o)
    this.canvas.setActiveObject(o)
    o.setCoords()
    this.canvas.requestRenderAll()
    this.commit()
    return o
  }

  async addText(preset: { text: string; fontSize: number; fontWeight?: string | number; fontFamily?: string; fill?: string }) {
    const fontFamily = preset.fontFamily ?? 'Noto Sans JP'
    await loadFonts([[fontFamily, preset.text]])
    const t = new Textbox(preset.text, {
      fontFamily, fontSize: preset.fontSize, fontWeight: preset.fontWeight ?? 400, fill: preset.fill ?? '#1f2937',
      width: Math.min(this.width * 0.8, Math.max(200, preset.text.length * preset.fontSize * 0.9)),
      textAlign: 'center', lineHeight: 1.3, splitByGrapheme: true,
    })
    // 大きなキャンバスでは文字も大きく
    const k = Math.max(1, Math.min(this.width, this.height) / 1080)
    t.set({ fontSize: preset.fontSize * k, width: (t.width ?? 200) * k })
    this.place(t)
  }

  addShape(make: (size: number) => FabricObject) {
    const size = Math.round(Math.min(this.width, this.height) * 0.3)
    this.place(make(size))
  }

  async addImageFile(file: Blob) {
    if (!file.type.startsWith('image/')) throw new Error('画像ファイルではありません')
    const small = await downscale(file)
    const { id, url } = await putAsset(small)
    await this.addImageURL(url, id)
  }

  /** 動画ファイルを置く。素材庫に Blob で保存してから配置する。共同編集で共有できない場合は理由を返す */
  async addVideoFile(file: Blob, credit?: Video['credit']): Promise<{ video: Video; collabNote: string | null }> {
    if (!file.type.startsWith('video/')) throw new Error('動画ファイルではありません')
    const { id, url } = await putMediaAsset(file)
    const v = await createVideo(url, id)
    if (credit) v.credit = credit
    const k = Math.min(1, (this.width * 0.6) / v.width, (this.height * 0.6) / v.height)
    v.set({ scaleX: k, scaleY: k, name: '動画' })
    this.place(v)
    await this.enqueue(async () => {})
    return { video: v, collabNote: collabMediaProblem(file) }
  }

  /** 今のページの動画を止める */
  pauseVideos() {
    for (const o of this.canvas.getObjects()) if (o instanceof Video) o.pause()
  }

  async addImageURL(url: string, assetId?: string): Promise<FabricObject | undefined> {
    // フレーム(または写真入りフレーム)を選択中なら、その中に入れる
    const target = this.active() as any
    if (target?.frame && !(target instanceof ActiveSelection)) {
      const img = await fillFrame(target, url, assetId)
      img.set({ scaleX: img.scaleX, scaleY: img.scaleY })
      if (target instanceof FabricImage) {
        // 既存の写真を差し替え: 枠の大きさを保つ
        const fw = target.getScaledWidth(), fh = target.getScaledHeight()
        const s = Math.max(fw / img.getElement().width, fh / img.getElement().height)
        const cw = fw / s, ch = fh / s
        const nw = img.getElement().width, nh = img.getElement().height
        img.set({ cropX: (nw - cw) / 2, cropY: (nh - ch) / 2, width: cw, height: ch, scaleX: s, scaleY: s })
        const { frameShape } = await import('./elements')
        img.clipPath = frameShape((target as any).frame, cw, ch)
      }
      this.replaceObject(target, img)
      return img
    }
    const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' })
    const maxW = this.width * 0.6, maxH = this.height * 0.6
    const s = Math.min(1, maxW / img.width, maxH / img.height)
    img.set({ scaleX: s, scaleY: s, assetId } as any)
    this.place(img)
    return img
  }

  /** 選択中の中心をページ上の点に移す(ドラッグ&ドロップで置いたとき) */
  async moveActiveCenterTo(x: number, y: number) {
    await this.enqueue(async () => {})
    const o = this.active()
    if (!o) return
    o.setPositionByOrigin(new Point(x, y), 'center', 'center')
    o.setCoords()
    this.canvas.requestRenderAll()
    this.commit()
  }

  /** 画面上の座標(clientX/Y)→ページ上の座標 */
  clientToPage(cx: number, cy: number) {
    const r = this.canvas.upperCanvasEl.getBoundingClientRect()
    return { x: (cx - r.left) / this.zoom, y: (cy - r.top) / this.zoom }
  }

  /** 位置・大きさ・角度を数値で設定(見た目の大きさ=拡大率込み) */
  setGeometry(g: { x?: number; y?: number; w?: number; h?: number; angle?: number; keepRatio?: boolean }) {
    const o = this.active()
    if (!o || (o as any).locked) return
    if (g.w !== undefined && g.w > 0) {
      const k = g.w / o.getScaledWidth()
      o.set({ scaleX: o.scaleX * k, ...(g.keepRatio ? { scaleY: o.scaleY * k } : {}) })
    }
    if (g.h !== undefined && g.h > 0 && !g.keepRatio) o.set({ scaleY: o.scaleY * (g.h / o.getScaledHeight()) })
    if (g.angle !== undefined) o.rotate(g.angle)
    if (g.x !== undefined || g.y !== undefined) {
      const b = o.getBoundingRect()
      o.set({ left: o.left + ((g.x ?? b.left) - b.left), top: o.top + ((g.y ?? b.top) - b.top) })
    }
    o.setCoords()
    this.canvas.requestRenderAll()
    this.commit()
  }

  /** 画像の差し替え(見た目の大きさ・位置・フレームを保ち、中央で覆うように切り抜く) */
  async replaceImage(img: FabricImage, file: Blob) {
    const { id, url } = await putAsset(await downscale(file))
    const fw = img.getScaledWidth(), fh = img.getScaledHeight()
    await img.setSrc(url, { crossOrigin: 'anonymous' })
    const nw = img.width, nh = img.height
    const s = Math.max(fw / nw, fh / nh)
    const cw = fw / s, ch = fh / s
    img.set({ cropX: (nw - cw) / 2, cropY: (nh - ch) / 2, width: cw, height: ch, scaleX: s, scaleY: s })
    ;(img as any).assetId = id
    if ((img as any).frame) { const { frameShape } = await import('./elements'); img.clipPath = frameShape((img as any).frame, cw, ch) }
    else if (img.clipPath) img.clipPath.set({ width: cw, height: ch })
    img.setCoords()
    this.canvas.requestRenderAll()
    this.commit()
  }

  /** 箇条書き: 各行の先頭に記号/番号を付け外しする */
  toggleList(kind: 'bullet' | 'number') {
    for (const o of this.editable()) {
      if (!(o instanceof Textbox)) continue
      const lines = o.text.split('\n')
      const has = kind === 'bullet' ? lines.every((l) => l.startsWith('・')) : lines.every((l, i) => l.startsWith(`${i + 1}. `))
      const strip = (l: string) => l.replace(/^(・|\d+\. )/, '')
      o.set('text', lines.map((l, i) => (has ? strip(l) : (kind === 'bullet' ? '・' : `${i + 1}. `) + strip(l))).join('\n'))
      if (!has) o.set('textAlign', 'left')
      o.initDimensions()
      o.setCoords()
    }
    this.canvas.requestRenderAll()
    this.commit()
  }

  /** オブジェクトを同じ重なり位置で置き換える */
  replaceObject(oldObj: FabricObject, newObj: FabricObject) {
    const idx = this.canvas.getObjects().indexOf(oldObj)
    ;(newObj as any).id = (oldObj as any).id ?? uid()
    this.canvas.discardActiveObject()
    this.canvas.remove(oldObj)
    this.canvas.insertAt(Math.max(0, idx), newObj)
    newObj.setCoords()
    this.canvas.setActiveObject(newObj)
    this.canvas.requestRenderAll()
    this.commit()
  }

  /** 位置・回転を引き継いで作り直す(グラフ・表・QR の再生成) */
  regenerate(oldObj: FabricObject, newObj: FabricObject, keepWidth = true) {
    const w = oldObj.getScaledWidth()
    newObj.set({ left: oldObj.left, top: oldObj.top, angle: oldObj.angle })
    if (keepWidth && newObj.width) { const s = w / newObj.width; newObj.set({ scaleX: s, scaleY: s }) }
    this.replaceObject(oldObj, newObj)
  }

  /** 写真をフレームから外す(枠だけ残す) */
  async clearFrame() {
    const o = this.active() as any
    if (!(o instanceof FabricImage) || !(o as any).frame) return
    const { frameShape } = await import('./elements')
    const ph = frameShape((o as any).frame, o.getScaledWidth(), o.getScaledHeight())
    ph.set({ originX: 'left', originY: 'top', left: o.left, top: o.top, angle: o.angle, fill: '#d4d4d8', name: 'フレーム' } as any)
    ;(ph as any).frame = (o as any).frame
    this.replaceObject(o, ph)
  }

  /** 手描き: kind=pen(ペン)/ marker(半透明の蛍光ペン)/ null(終了)。描いた線は1本ずつ取り消せる */
  drawing: null | 'pen' | 'marker' = null
  setDrawing(kind: null | 'pen' | 'marker', color = '#111827', width = 6) {
    const c = this.canvas
    this.drawing = kind
    c.isDrawingMode = !!kind
    if (kind) {
      const b = new PencilBrush(c)
      b.color = kind === 'marker' ? color + (color.length === 7 ? '66' : '') : color
      b.width = kind === 'marker' ? width * 3 : width
      b.decimate = 2
      c.freeDrawingBrush = b
      c.discardActiveObject()
      if (!(c as any).__drawHook) {
        ;(c as any).__drawHook = true
        c.on('path:created', (e: any) => { (e.path as any).id = uid(); (e.path as any).name = this.drawing === 'marker' ? 'マーカー' : '手描き'; this.commit() })
      }
    }
    c.requestRenderAll()
    this.emit()
  }

  /** 縦書きテキストを追加 */
  async addVText(text = '縦書きの\n見出し', opts: Partial<{ fontFamily: string; fontSize: number; fontWeight: number }> = {}) {
    const fontFamily = opts.fontFamily ?? 'Noto Serif JP'
    await loadFonts([[fontFamily, text]])
    const k = Math.max(1, Math.min(this.width, this.height) / 1080)
    this.place(new VText({ text, fontFamily, fontSize: (opts.fontSize ?? 64) * k, fontWeight: opts.fontWeight ?? 700 }))
  }

  /** 横書き(Textbox)⇔ 縦書き(VText)を切り替える。位置は右上を揃える */
  async toggleVertical() {
    const o = this.active()
    if (!o || (o as any).locked) return
    const b = o.getBoundingRect()
    if (o instanceof VText) {
      const t = new Textbox(o.text, { fontFamily: o.fontFamily, fontSize: o.fontSize * (o.scaleY ?? 1), fontWeight: o.fontWeight, fontStyle: o.fontStyle as any, fill: o.fill, width: Math.max(200, o.height * (o.scaleY ?? 1)), textAlign: 'left', splitByGrapheme: true, opacity: o.opacity, shadow: o.shadow, stroke: o.textStroke, strokeWidth: o.textStrokeWidth, paintFirst: 'stroke' })
      t.set({ left: b.left, top: b.top })
      this.replaceObject(o, t)
    } else if (o instanceof Textbox) {
      const lines = o.text.split('\n')
      const maxChars = Math.max(4, Math.min(30, Math.max(...lines.map((l) => Array.from(l).length))))
      const v = new VText({ text: o.text, fontFamily: o.fontFamily, fontSize: o.fontSize * (o.scaleY ?? 1), fontWeight: o.fontWeight, fontStyle: o.fontStyle, fill: o.fill, maxChars, opacity: o.opacity, shadow: o.shadow, textStroke: (o.stroke as string) ?? null, textStrokeWidth: o.strokeWidth ?? 0 })
      v.set({ left: b.left + b.width - v.width, top: b.top })
      await loadFonts([[v.fontFamily, v.text]])
      this.replaceObject(o, v)
    }
  }

  /** 縦書き(旧方式: 1文字ずつ改行する簡易方式。過去のデータ用に残す) */
  setVertical(on: boolean) {
    for (const o of this.selected()) {
      if (!(o instanceof Textbox)) continue
      ;(o as any).vertical = on
      o.set({ splitByGrapheme: true, width: on ? o.fontSize * 1.15 : Math.max(o.fontSize * 6, 300), textAlign: on ? 'center' : o.textAlign, lineHeight: on ? 1.05 : 1.3 })
      o.initDimensions()
      o.setCoords()
    }
    this.canvas.requestRenderAll()
    this.commit()
  }

  // ---------------- 選択中への操作 ----------------
  active(): FabricObject | undefined { return this.canvas.getActiveObject() }
  selected(): FabricObject[] { return this.canvas.getActiveObjects() }
  /** ロックされていない選択中オブジェクト(移動・変形・削除の対象) */
  editable(): FabricObject[] { return this.selected().filter((o: any) => !o.locked) }

  /** 選択中の全オブジェクト(グループ内のテキスト等も含む)に属性を設定 */
  setProp(props: Record<string, any>, opts: { commit?: boolean } = {}) {
    const objs = this.editable()
    for (const o of objs) {
      o.set(props)
      if (o instanceof Textbox && (o as any).vertical && 'fontSize' in props) o.set({ width: o.fontSize * 1.15 })
      if (o instanceof Textbox) o.initDimensions()
      o.setCoords()
    }
    this.canvas.getActiveObject()?.setCoords()
    this.canvas.requestRenderAll()
    if (opts.commit === false) this.emit(); else this.commit()
  }

  async setFont(family: string) {
    const objs = this.selected().filter((o) => o instanceof Textbox) as Textbox[]
    await loadFonts([[family, objs.map((o) => o.text).join('')]])
    this.setProp({ fontFamily: family })
  }

  setShadow(on: boolean, opts: { color?: string; blur?: number; offsetX?: number; offsetY?: number } = {}) {
    for (const o of this.selected()) {
      o.set('shadow', on ? new Shadow({ color: opts.color ?? 'rgba(0,0,0,0.35)', blur: opts.blur ?? 12, offsetX: opts.offsetX ?? 4, offsetY: opts.offsetY ?? 4 }) : null)
    }
    this.canvas.requestRenderAll()
    this.commit()
  }

  setFillGradient(colors: [string, string], angle = 90, target: FabricObject | 'background' = this.active()!) {
    const w = target === 'background' ? this.width : target.width!
    const h = target === 'background' ? this.height : target.height!
    const rad = (angle * Math.PI) / 180
    const dx = Math.cos(rad) / 2, dy = Math.sin(rad) / 2
    const g = new Gradient({
      type: 'linear', gradientUnits: 'pixels',
      coords: { x1: w * (0.5 - dx), y1: h * (0.5 - dy), x2: w * (0.5 + dx), y2: h * (0.5 + dy) },
      colorStops: [{ offset: 0, color: colors[0] }, { offset: 1, color: colors[1] }],
    })
    if (target === 'background') this.canvas.backgroundColor = g
    else target.set('fill', g)
    this.canvas.requestRenderAll()
    this.commit()
  }

  setBackground(color: string) {
    this.canvas.backgroundColor = color
    this.canvas.requestRenderAll()
    this.commit()
  }

  async setBackgroundImage(file: Blob) {
    const { id, url } = await putAsset(await downscale(file))
    const img = await FabricImage.fromURL(url)
    const s = Math.max(this.width / img.width, this.height / img.height)
    img.set({ scaleX: s, scaleY: s, left: (this.width - img.width * s) / 2, top: (this.height - img.height * s) / 2, assetId: id, name: '背景画像' } as any)
    ;(img as any).id = uid()
    this.canvas.insertAt(0, img)
    this.canvas.requestRenderAll()
    this.commit()
  }

  /** 画像の背景を消す(ブラウザ内の AI。初回はモデルをダウンロード) */
  async removeImageBackground(img: FabricImage, onProgress?: (text: string, ratio: number) => void) {
    const startPage = this.pageId
    const { removeBackground } = await import('./bgremove')
    const { idbGet } = await import('./idb')
    const id = (img as any).assetId as string | undefined
    let blob: Blob | undefined
    if (id) blob = (await idbGet<{ blob: Blob }>('assets', id))?.blob
    if (!blob) blob = await (await fetch(img.getSrc())).blob()
    const out = await removeBackground(blob, (p) => onProgress?.(p.text, p.ratio))
    if (this.pageId !== startPage || !this.canvas.getObjects().includes(img)) throw new Error('処理中にページを移動したか画像を削除したため、結果を反映できませんでした。もう一度お試しください')
    const { id: newId, url } = await putAsset(out)
    // setSrc は切り抜き範囲(cropX/Y・幅・高さ)を新しい画像の大きさに戻すので、前後で保つ
    const keep = { cropX: img.cropX, cropY: img.cropY, width: img.width, height: img.height }
    await img.setSrc(url, { crossOrigin: 'anonymous' })
    img.set(keep)
    ;(img as any).assetId = newId
    img.setCoords()
    this.canvas.requestRenderAll()
    this.commit()
  }

  /** 画像の色調整。値は -1〜1(blur は 0〜1) */
  setImageFilters(f: { brightness?: number; contrast?: number; saturation?: number; blur?: number; grayscale?: boolean; sepia?: boolean; invert?: boolean }) {
    for (const o of this.selected()) {
      if (!(o instanceof FabricImage)) continue
      const list: any[] = []
      if (f.brightness) list.push(new filters.Brightness({ brightness: f.brightness }))
      if (f.contrast) list.push(new filters.Contrast({ contrast: f.contrast }))
      if (f.saturation) list.push(new filters.Saturation({ saturation: f.saturation }))
      if (f.blur) list.push(new filters.Blur({ blur: f.blur }))
      if (f.grayscale) list.push(new filters.Grayscale())
      if (f.sepia) list.push(new filters.Sepia())
      if (f.invert) list.push(new filters.Invert())
      o.filters = list
      o.applyFilters()
    }
    this.canvas.requestRenderAll()
  }
  imageFilterState(o: FabricImage) {
    const st: any = {}
    for (const f of o.filters ?? []) {
      const t = (f as any).type
      if (t === 'Brightness') st.brightness = (f as any).brightness
      if (t === 'Contrast') st.contrast = (f as any).contrast
      if (t === 'Saturation') st.saturation = (f as any).saturation
      if (t === 'Blur') st.blur = (f as any).blur
      if (t === 'Grayscale') st.grayscale = true
      if (t === 'Sepia') st.sepia = true
      if (t === 'Invert') st.invert = true
    }
    return st
  }

  remove() {
    const objs = this.selected().filter((o: any) => !o.locked)
    if (!objs.length) return
    this.canvas.discardActiveObject()
    this.canvas.remove(...objs)
    this.canvas.requestRenderAll()
    this.commit()
  }

  async copy() {
    const objs = this.selected()
    if (!objs.length) return false // 空選択では直前のコピーを消さない
    const a = this.active()
    // 複数選択中の子は選択枠からの相対座標なので、選択を外して絶対座標に戻してから複製する
    if (a instanceof ActiveSelection) this.canvas.discardActiveObject()
    this.clipboard = await Promise.all(objs.map((o) => o.clone(SAVE_PROPS)))
    if (a instanceof ActiveSelection) this.selectObjects(objs)
    this.clipboardStamp = 'irodori:' + Date.now()
    return true
  }
  clipboardStamp = ''
  async paste(offset = 24) {
    if (!this.clipboard.length) return
    const clones = await Promise.all(this.clipboard.map((o) => o.clone(SAVE_PROPS)))
    this.canvas.discardActiveObject()
    for (const c of clones) {
      c.set({ left: (c.left ?? 0) + offset, top: (c.top ?? 0) + offset })
      ;(c as any).id = uid()
      applyLock(c, false)
      this.canvas.add(c)
    }
    this.clipboard = clones
    this.selectObjects(clones)
    this.commit()
  }
  async duplicate() { await this.copy(); await this.paste() }

  selectObjects(objs: FabricObject[]) {
    this.canvas.discardActiveObject()
    if (objs.length === 1) this.canvas.setActiveObject(objs[0])
    else if (objs.length > 1) this.canvas.setActiveObject(new ActiveSelection(objs, { canvas: this.canvas }))
    this.canvas.requestRenderAll()
    this.emit()
  }
  selectAll() { this.selectObjects(this.canvas.getObjects().filter((o: any) => !o.locked)) }

  /** 重なり順 */
  order(dir: 'front' | 'back' | 'forward' | 'backward') {
    const c = this.canvas
    for (const o of this.editable()) {
      if (dir === 'front') c.bringObjectToFront(o)
      if (dir === 'back') c.sendObjectToBack(o)
      if (dir === 'forward') c.bringObjectForward(o)
      if (dir === 'backward') c.sendObjectBackwards(o)
    }
    c.requestRenderAll()
    this.commit()
  }
  moveLayer(obj: FabricObject, toIndex: number) {
    this.canvas.moveObjectTo(obj, toIndex)
    this.canvas.requestRenderAll()
    this.commit()
  }

  /** 整列。1つならページ基準、複数なら選択範囲基準 */
  align(kind: 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom') {
    const objs = this.editable()
    if (!objs.length) return
    this.canvas.discardActiveObject()
    const rects = objs.map((o) => o.getBoundingRect())
    const box = objs.length === 1
      ? { left: 0, top: 0, right: this.width, bottom: this.height }
      : {
          left: Math.min(...rects.map((r) => r.left)), top: Math.min(...rects.map((r) => r.top)),
          right: Math.max(...rects.map((r) => r.left + r.width)), bottom: Math.max(...rects.map((r) => r.top + r.height)),
        }
    objs.forEach((o, i) => {
      const r = rects[i]
      let dx = 0, dy = 0
      if (kind === 'left') dx = box.left - r.left
      if (kind === 'right') dx = box.right - (r.left + r.width)
      if (kind === 'hcenter') dx = (box.left + box.right) / 2 - (r.left + r.width / 2)
      if (kind === 'top') dy = box.top - r.top
      if (kind === 'bottom') dy = box.bottom - (r.top + r.height)
      if (kind === 'vcenter') dy = (box.top + box.bottom) / 2 - (r.top + r.height / 2)
      o.set({ left: o.left + dx, top: o.top + dy })
      o.setCoords()
    })
    this.selectObjects(objs)
    this.commit()
  }

  /** 等間隔に並べる(3つ以上) */
  distribute(axis: 'h' | 'v') {
    const objs = this.editable()
    if (objs.length < 3) return
    this.canvas.discardActiveObject()
    const items = objs.map((o) => ({ o, r: o.getBoundingRect() }))
    const key = axis === 'h' ? 'left' : 'top'
    const size = axis === 'h' ? 'width' : 'height'
    items.sort((a, b) => a.r[key] - b.r[key])
    const first = items[0].r, last = items[items.length - 1].r
    const total = items.reduce((s, it) => s + it.r[size], 0)
    const gap = (last[key] + last[size] - first[key] - total) / (items.length - 1)
    let cur = first[key]
    for (const it of items) {
      const d = cur - it.r[key]
      it.o.set(key, (it.o as any)[key] + d)
      it.o.setCoords()
      cur += it.r[size] + gap
    }
    this.selectObjects(objs)
    this.commit()
  }

  group() {
    const objs = this.selected()
    if (objs.length < 2) return
    this.canvas.discardActiveObject()
    this.canvas.remove(...objs)
    const g = new Group(objs)
    ;(g as any).id = uid()
    this.canvas.add(g)
    this.canvas.setActiveObject(g)
    this.canvas.requestRenderAll()
    this.commit()
  }
  ungroup() {
    const g = this.active()
    if (!(g instanceof Group) || g instanceof ActiveSelection) return
    const idx = this.canvas.getObjects().indexOf(g)
    const objs = g.removeAll()
    this.canvas.remove(g)
    this.canvas.insertAt(idx, ...objs)
    objs.forEach((o) => o.setCoords())
    this.selectObjects(objs)
    this.commit()
  }

  toggleLock() {
    const objs = this.selected()
    const lock = !objs.every((o: any) => o.locked)
    objs.forEach((o) => applyLock(o, lock))
    this.canvas.requestRenderAll()
    this.commit()
  }

  flip(axis: 'x' | 'y') {
    for (const o of this.editable()) o.set(axis === 'x' ? 'flipX' : 'flipY', !(axis === 'x' ? o.flipX : o.flipY))
    this.canvas.requestRenderAll()
    this.commit()
  }

  nudge(dx: number, dy: number) {
    const o = this.active()
    if (!o || (o as any).locked) return
    o.set({ left: o.left + dx, top: o.top + dy })
    o.setCoords()
    this.canvas.requestRenderAll()
    this.emit()
    clearTimeout(this.pendingNudge)
    this.pendingNudge = window.setTimeout(() => { this.pendingNudge = 0; this.commit() }, 400)
  }

  // ---------------- スナップとガイド ----------------
  private snap(target: FabricObject) {
    const th = 6 / this.zoom
    const r = target.getBoundingRect()
    const xs = [0, this.width / 2, this.width]
    const ys = [0, this.height / 2, this.height]
    for (const o of this.canvas.getObjects()) {
      if (o === target || (target as any)._objects?.includes(o)) continue
      const b = o.getBoundingRect()
      xs.push(b.left, b.left + b.width / 2, b.left + b.width)
      ys.push(b.top, b.top + b.height / 2, b.top + b.height)
    }
    const v: number[] = [], h: number[] = []
    const cand = (pts: number[], edges: number[]) => {
      let best: { d: number; at: number } | null = null
      for (const e of edges) for (const p of pts) {
        const d = p - e
        if (Math.abs(d) < th && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, at: p }
      }
      return best
    }
    const bx = cand(xs, [r.left, r.left + r.width / 2, r.left + r.width])
    const by = cand(ys, [r.top, r.top + r.height / 2, r.top + r.height])
    if (bx) { target.set('left', target.left + bx.d); v.push(bx.at) }
    if (by) { target.set('top', target.top + by.d); h.push(by.at) }
    target.setCoords()
    this.guides = { v, h }
  }
  private drawGuides() {
    const { v, h } = this.guides
    if (!v.length && !h.length) return
    const ctx = this.canvas.getTopContext()
    this.canvas.clearContext(ctx)
    ctx.save()
    ctx.strokeStyle = '#ec4899'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    const z = this.zoom
    for (const x of v) { ctx.beginPath(); ctx.moveTo(x * z + 0.5, 0); ctx.lineTo(x * z + 0.5, this.height * z); ctx.stroke() }
    for (const y of h) { ctx.beginPath(); ctx.moveTo(0, y * z + 0.5); ctx.lineTo(this.width * z, y * z + 0.5); ctx.stroke() }
    ctx.restore()
  }

  dispose() { this.pauseVideos(); this.canvas.dispose() }
}

// ---------------- 書き出し(画面のズームと無関係に、ページ JSON から別キャンバスで描く) ----------------
export const MAX_PIXELS = 16_000_000 // iOS Safari のキャンバス上限付近を避ける

export async function renderPage(json: any, w: number, h: number, opts: { multiplier?: number; format?: 'png' | 'jpeg'; quality?: number; transparent?: boolean } = {}) {
  let m = opts.multiplier ?? 1
  if (w * h * m * m > MAX_PIXELS) m = Math.sqrt(MAX_PIXELS / (w * h))
  const el = document.createElement('canvas')
  const sc = new StaticCanvas(el, { width: w, height: h, enableRetinaScaling: false, renderOnAddRemove: false })
  try {
    await ensureFonts(json)
    await sc.loadFromJSON(await resolveAssets(json))
    if (opts.transparent) sc.backgroundColor = ''
    else if (!sc.backgroundColor) sc.backgroundColor = '#ffffff'
    sc.renderAll()
    return sc.toDataURL({ format: opts.format ?? 'png', quality: opts.quality ?? 0.92, multiplier: m })
  } finally {
    sc.getObjects().forEach((o) => { if (o instanceof Video) o.dispose() }) // 動画の読み込みを解放する
    sc.dispose()
  }
}

export { Path, Point }

/** SVG 書き出し(文字はフォント名で出力。閲覧環境にフォントが無いと置き換わる) */
export async function renderPageSVG(json: any, w: number, h: number) {
  const sc = new StaticCanvas(document.createElement('canvas'), { width: w, height: h, renderOnAddRemove: false })
  try {
    await ensureFonts(json)
    await sc.loadFromJSON(await resolveAssetsAsDataURL(json))
    if (!sc.backgroundColor) sc.backgroundColor = '#ffffff'
    return sc.toSVG()
  } finally {
    sc.dispose()
  }
}
