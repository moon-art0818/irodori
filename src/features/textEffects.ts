// 文字の効果(影・浮き上がり・中抜き・袋文字・エコー・グリッチ・ネオン・背景ハイライト)。
// fabric の shadow / stroke / paintFirst / textBackgroundColor の組み合わせだけで実現する(Group 化しない)
import { Shadow, type Textbox } from 'fabric'

export const TEXT_EFFECTS: { id: string; label: string }[] = [
  { id: 'none', label: 'なし' },
  { id: 'shadow', label: '影' },
  { id: 'lift', label: '浮き上がり' },
  { id: 'hollow', label: '中抜き' },
  { id: 'splice', label: '袋文字' },
  { id: 'echo', label: 'エコー' },
  { id: 'glitch', label: 'グリッチ' },
  { id: 'neon', label: 'ネオン' },
  { id: 'background', label: '背景ハイライト' },
]

const isClear = (f: unknown) => f === 'transparent' || f === '' || f == null || (typeof f === 'string' && /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\s*\)$/.test(f))

/** 効果を外して素の状態に戻す(中抜きで消した塗りは縁の色から復元する) */
function reset(t: Textbox) {
  if (isClear(t.fill) && typeof t.stroke === 'string' && t.stroke) t.set('fill', t.stroke)
  t.set({ shadow: null, stroke: null, strokeWidth: 0, paintFirst: 'fill', textBackgroundColor: '' })
}

/**
 * 文字オブジェクトに効果を適用する。他の効果は一度外してから付けるので重ねがけにはならない。
 * color は効果の色(省略時は効果ごとの既定色)。呼び出し側で canvas の再描画と commit を行うこと。
 * ネオンは塗りを白にする(元の色には戻らない)。エコー/グリッチは fabric の影が1つだけなので近似表現。
 */
export function applyTextEffect(obj: Textbox, id: string, color?: string) {
  reset(obj)
  const fs = obj.fontSize ?? 40 // scale は fabric が掛けるので fontSize のまま使う
  const sw = Math.max(2, Math.round(fs * 0.06))
  switch (id) {
    case 'shadow':
      obj.set('shadow', new Shadow({ color: color ?? 'rgba(0,0,0,0.4)', blur: Math.round(fs * 0.12), offsetX: Math.round(fs * 0.07), offsetY: Math.round(fs * 0.07) }))
      break
    case 'lift':
      obj.set('shadow', new Shadow({ color: color ?? 'rgba(0,0,0,0.45)', blur: Math.round(fs * 0.45), offsetX: 0, offsetY: Math.round(fs * 0.22) }))
      break
    case 'hollow': {
      const line = color ?? (typeof obj.fill === 'string' && !isClear(obj.fill) ? obj.fill : '#111827')
      obj.set({ fill: 'transparent', stroke: line, strokeWidth: Math.max(1.5, Math.round(fs * 0.035)), paintFirst: 'stroke' })
      break
    }
    case 'splice': {
      const c = color ?? '#111827'
      obj.set({ stroke: c, strokeWidth: sw * 2, paintFirst: 'stroke', strokeLineJoin: 'round', shadow: new Shadow({ color: c, blur: 0, offsetX: Math.round(fs * 0.09), offsetY: Math.round(fs * 0.09) }) })
      break
    }
    case 'echo':
      // 本来は影を何段か重ねる表現。fabric の影は1つなので、硬い影+同色の細い縁で近似する
      obj.set({ shadow: new Shadow({ color: color ?? 'rgba(236,72,153,0.55)', blur: 0, offsetX: Math.round(fs * 0.1), offsetY: Math.round(fs * 0.1) }) })
      break
    case 'glitch': {
      const [a, b] = color ? [color, '#06b6d4'] : ['#ec4899', '#06b6d4']
      obj.set({ stroke: a, strokeWidth: Math.max(1, Math.round(fs * 0.025)), paintFirst: 'stroke', shadow: new Shadow({ color: b, blur: 0, offsetX: -Math.round(fs * 0.05), offsetY: 0 }) })
      break
    }
    case 'neon': {
      const c = color ?? '#22d3ee'
      obj.set({ fill: '#ffffff', stroke: c, strokeWidth: Math.max(1, Math.round(fs * 0.02)), shadow: new Shadow({ color: c, blur: Math.round(fs * 0.5), offsetX: 0, offsetY: 0 }) })
      break
    }
    case 'background':
      obj.set({ textBackgroundColor: color ?? '#fde047' })
      break
    default: break // none
  }
  obj.dirty = true
}

/** いま付いている効果を推定する(UI のハイライト用。完全一致ではなく目安) */
export function detectTextEffect(obj: Textbox): string {
  const sh = obj.shadow as Shadow | null
  if (obj.textBackgroundColor) return 'background'
  if (isClear(obj.fill) && obj.stroke) return 'hollow'
  if (obj.stroke && sh && sh.blur === 0 && sh.offsetX < 0) return 'glitch'
  if (obj.stroke && sh && sh.blur === 0) return 'splice'
  if (obj.stroke && sh && sh.blur > 0) return 'neon'
  if (sh && sh.blur === 0) return 'echo'
  if (sh && sh.offsetX === 0 && sh.offsetY > 0) return 'lift'
  if (sh) return 'shadow'
  return 'none'
}
