// SVG 文字列 → fabric オブジェクト(1 つ)。アイコン/イラストの追加に使う。
import { loadSVGFromString, util, type FabricObject } from 'fabric'

/**
 * SVG を 1 つのオブジェクトにして、長辺が size px になるよう縮尺して返す。
 * 複数パーツなら Group、単一パーツならそのオブジェクト。位置は呼び出し側で決める。
 */
export async function svgToObject(svg: string, size: number): Promise<FabricObject> {
  const { objects, options } = await loadSVGFromString(svg)
  const parts = objects.filter((o): o is FabricObject => o !== null)
  if (parts.length === 0) throw new Error('SVG から図形を読み取れませんでした')
  const obj = util.groupSVGElements(parts, options)
  // 線(stroke)ベースのアイコンは、単体パスだと線幅が bbox に加わる(Group では加わらない)。
  // scale=1 での見た目の大きさ(getScaled*)を測り、線幅ごと等倍で縮尺して長辺をちょうど size にする
  obj.set({ scaleX: 1, scaleY: 1 })
  const w = obj.getScaledWidth() || 1
  const h = obj.getScaledHeight() || 1
  const scale = size / Math.max(w, h)
  obj.set({ scaleX: scale, scaleY: scale })
  obj.setCoords()
  return obj
}
