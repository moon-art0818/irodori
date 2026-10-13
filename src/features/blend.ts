// 描画の合成モード(Photoshop の「描画モード」相当)。fabric のオブジェクトの globalCompositeOperation に入れる
import type { FabricObject } from 'fabric'

export interface BlendMode { id: string; label: string; /** globalCompositeOperation の値 */ value: GlobalCompositeOperation }

/** 合成モード一覧(id は value と同じ。'source-over' が通常) */
export const BLEND_MODES: BlendMode[] = [
  { id: 'source-over', label: '通常', value: 'source-over' },
  { id: 'multiply', label: '乗算', value: 'multiply' },
  { id: 'screen', label: 'スクリーン', value: 'screen' },
  { id: 'overlay', label: 'オーバーレイ', value: 'overlay' },
  { id: 'darken', label: '比較(暗)', value: 'darken' },
  { id: 'lighten', label: '比較(明)', value: 'lighten' },
  { id: 'color-dodge', label: '覆い焼き', value: 'color-dodge' },
  { id: 'color-burn', label: '焼き込み', value: 'color-burn' },
  { id: 'hard-light', label: 'ハードライト', value: 'hard-light' },
  { id: 'soft-light', label: 'ソフトライト', value: 'soft-light' },
  { id: 'difference', label: '差の絶対値', value: 'difference' },
  { id: 'exclusion', label: '除外', value: 'exclusion' },
  { id: 'hue', label: '色相', value: 'hue' },
  { id: 'saturation', label: '彩度', value: 'saturation' },
  { id: 'color', label: 'カラー', value: 'color' },
  { id: 'luminosity', label: '輝度', value: 'luminosity' },
]

/** オブジェクトに合成モードを設定する(呼び出し側で canvas の再描画と commit を行うこと) */
export function applyBlendMode(obj: FabricObject, id: string) {
  const m = BLEND_MODES.find((b) => b.id === id) ?? BLEND_MODES[0]
  obj.set({ globalCompositeOperation: m.value })
}

/** オブジェクトに設定されている合成モードの id(未設定は 'source-over') */
export function getBlendMode(obj: FabricObject): string {
  const v = (obj as any).globalCompositeOperation as string | undefined
  return BLEND_MODES.some((b) => b.id === v) ? v! : 'source-over'
}
