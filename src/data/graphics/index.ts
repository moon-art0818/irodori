// 手続き生成の素材(パターン・グラデーション・ブロブ・装飾)。合計 850 点超。コードで作るので外部素材のライセンスは関係しない。
import type { GraphicItem, GraphicGroup } from './types'
import { patternItems, PATTERN_TYPES } from './patterns'
import { gradientItems } from './gradients'
import { blobItems } from './blobs'
import { decorItems, DECOR_SUBS } from './decor'

export type { GraphicItem, GraphicGroup }
export { PATTERN_TYPES, DECOR_SUBS }

let cache: GraphicItem[] | null = null
export function allGraphics(): GraphicItem[] {
  return (cache ??= [...patternItems(), ...gradientItems(), ...blobItems(), ...decorItems()])
}

export const GRAPHIC_GROUPS: [GraphicGroup, string][] = [['pattern', 'パターン'], ['gradient', 'グラデーション'], ['blob', 'ブロブ'], ['decor', '装飾']]
