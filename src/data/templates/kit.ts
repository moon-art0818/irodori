import { Circle, FabricObject, Rect, Textbox } from 'fabric'
import { SHAPES } from '../shapes'

// templates.ts 内の部品関数と同じ実装(templates.ts は未 export のためここに複製)
export const T = (text: string, x: number, y: number, w: number, size: number, o: Partial<{ weight: number; font: string; fill: string; align: string; lh: number; spacing: number; bg: string }> = {}) =>
  new Textbox(text, {
    left: x, top: y, width: w, fontSize: size, fontWeight: o.weight ?? 700, fontFamily: o.font ?? 'Noto Sans JP',
    fill: o.fill ?? '#1f2937', textAlign: (o.align as any) ?? 'left', lineHeight: o.lh ?? 1.25, charSpacing: o.spacing ?? 0,
    splitByGrapheme: true, textBackgroundColor: o.bg ?? '',
  })
export const R = (x: number, y: number, w: number, h: number, fill: string, rx = 0, o: Record<string, any> = {}) =>
  new Rect({ left: x, top: y, width: w, height: h, fill, rx, ry: rx, ...o })
export const Ci = (cx: number, cy: number, r: number, fill: string, o: Record<string, any> = {}) =>
  new Circle({ left: cx - r, top: cy - r, radius: r, fill, ...o })
export const S = (id: string, x: number, y: number, size: number, fill: string, o: Record<string, any> = {}) => {
  const p = SHAPES.find((s) => s.id === id)!.make(size)
  p.set({ left: x, top: y, fill, ...o })
  return p
}

/** 写真枠 = フレーム(選択して写真をクリックすると中に入る)。角丸は短辺に対する比率で記録する */
export const PH = (x: number, y: number, w: number, h: number, rx = 24, fill = '#e5e7eb', _label = '写真'): FabricObject[] => {
  const r = R(x, y, w, h, fill, rx, { name: '写真枠' })
  ;(r as any).frame = rx > 0 ? `rr:${(rx / Math.min(w, h)).toFixed(4)}` : 'rect'
  return [r]
}

/** やわらかい影 */
export const SH = (a = 0.1, blur = 30, dy = 10) => ({ shadow: { color: `rgba(15,23,42,${a})`, blur, offsetX: 0, offsetY: dy } })
