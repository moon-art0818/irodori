// マジックリサイズ: デザインを別のサイズに作り直す
import { Gradient, StaticCanvas, Textbox } from 'fabric'
import { resolveAssets } from './assets'
import { SAVE_PROPS } from './core'

/**
 * 1ページ分の JSON を新しいサイズに合わせて組み直す。
 * - ページいっぱいに広がる要素(背景の帯・背景画像)は新しいページを覆うように伸ばす
 * - それ以外は比率を保って縮尺し、中心の相対位置を保つ。はみ出したら内側へ寄せる
 */
export async function resizePageJSON(json: any, w: number, h: number, nw: number, nh: number): Promise<any> {
  const sc = new StaticCanvas(document.createElement('canvas'), { width: nw, height: nh, renderOnAddRemove: false })
  try {
    const src = await resolveAssets(json)
    await sc.loadFromJSON(src)
    const s = Math.min(nw / w, nh / h)
    const sx = nw / w, sy = nh / h
    for (const o of sc.getObjects()) {
      const b = o.getBoundingRect()
      // 背景として伸ばすのは四角と画像だけ(QR・グループ・円などは縦横比を保つ)
      const full = b.width >= w * 0.92 && b.height >= h * 0.92 && (o.type === 'rect' || o.type === 'image')
      const fullW = b.width >= w * 0.92
      const fullH = b.height >= h * 0.92
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2
      if (full) {
        // 背景扱い: 覆うように拡大(画像は縦横比を保つ)
        const k = o.type === 'image' ? Math.max(sx, sy) : 0
        if (k) o.set({ scaleX: o.scaleX * k, scaleY: o.scaleY * k })
        else o.set({ scaleX: o.scaleX * sx, scaleY: o.scaleY * sy })
      } else if ((fullW || fullH) && o.type === 'rect') {
        // 横帯・縦帯: 長い方向だけページに合わせ、太さは縮尺
        o.set({ scaleX: o.scaleX * (fullW ? sx : s), scaleY: o.scaleY * (fullH ? sy : s) })
      } else {
        o.set({ scaleX: o.scaleX * s, scaleY: o.scaleY * s })
      }
      o.setCoords()
      const nb = o.getBoundingRect()
      // 中心の相対位置を保つ
      let ncx = (cx / w) * nw, ncy = (cy / h) * nh
      // はみ出し防止(元がページ内に収まっていた要素だけ)
      const inside = b.left >= -1 && b.top >= -1 && b.left + b.width <= w + 1 && b.top + b.height <= h + 1
      if (inside && !full) {
        ncx = Math.min(Math.max(ncx, nb.width / 2), nw - nb.width / 2)
        ncy = Math.min(Math.max(ncy, nb.height / 2), nh - nb.height / 2)
      }
      o.set({ left: o.left + (ncx - (nb.left + nb.width / 2)), top: o.top + (ncy - (nb.top + nb.height / 2)) })
      o.setCoords()
      if (o instanceof Textbox) o.initDimensions()
    }
    // 背景グラデーションの座標を伸ばす
    const bg: any = sc.backgroundColor
    if (bg instanceof Gradient) {
      const c: any = bg.coords
      sc.backgroundColor = new Gradient({ type: bg.type, gradientUnits: 'pixels', coords: { ...c, x1: c.x1 * sx, x2: c.x2 * sx, y1: c.y1 * sy, y2: c.y2 * sy }, colorStops: bg.colorStops })
    }
    const out = sc.toObject(SAVE_PROPS)
    const strip = (o: any) => { if (o.assetId) delete o.src; o.objects?.forEach(strip) }
    out.objects.forEach(strip)
    if (json.animation) out.animation = json.animation
    return out
  } finally {
    sc.dispose()
  }
}
