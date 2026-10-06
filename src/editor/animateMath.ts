// アニメーションの純粋な計算部分(fabric に依存しない。node でも単体確認できる)

export const ANIMATIONS: { id: string; label: string }[] = [
  { id: 'none', label: 'なし' },
  { id: 'fade', label: 'フェード' },
  { id: 'rise', label: 'ライズ(上に浮かぶ)' },
  { id: 'drop', label: 'ドロップ(上から)' },
  { id: 'pop', label: 'ポップ(拡大)' },
  { id: 'slide', label: 'スライド(左から)' },
  { id: 'typewriter', label: 'タイプライター' },
  { id: 'blend', label: 'ブレンド' },
]

export const DEFAULT_DURATION = 1.2

export interface ElState { opacity: number; dx: number; dy: number; scale: number; chars: number }

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3)
const easeOutBack = (p: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2) }

/** 要素ごとの進行度 p(0〜1)から、元の値に対する変化量を返す。p=1 は必ず元の見た目(opacity 倍率1・移動0・倍率1・全文字) */
export function elementState(preset: string, p0: number, o: { isText: boolean; textLen: number; w: number; h: number }): ElState {
  const p = clamp01(p0)
  const e = easeOut(p)
  const s: ElState = { opacity: 1, dx: 0, dy: 0, scale: 1, chars: o.textLen }
  switch (preset) {
    case 'fade': s.opacity = e; break
    case 'rise': s.opacity = e; s.dy = (1 - e) * o.h * 0.06; break
    case 'drop': s.opacity = e; s.dy = -(1 - e) * o.h * 0.06; break
    case 'slide': s.opacity = clamp01(p * 2); s.dx = -(1 - e) * o.w * 0.15; break
    case 'pop': s.opacity = clamp01(p * 3); s.scale = 0.6 + 0.4 * easeOutBack(p); break
    case 'blend': s.opacity = e; s.scale = 1.08 - 0.08 * e; break
    case 'typewriter':
      if (o.isText) { s.chars = Math.ceil(o.textLen * p); s.opacity = s.chars > 0 ? 1 : 0 }
      else s.opacity = e
      break
    default: break // none
  }
  return s
}

/** 要素 i / n 個のときの進行度。全要素が時刻 duration ちょうどに完了する(順番に少しずつ遅れて登場) */
export function elementProgress(t: number, i: number, n: number, duration: number): number {
  if (duration <= 0) return 1
  const stagger = n > 1 ? Math.min(0.15, (duration * 0.5) / (n - 1)) : 0
  const dur = duration - stagger * (n - 1)
  return clamp01((t - i * stagger) / dur)
}
