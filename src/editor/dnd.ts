// 左パネルの素材をキャンバスへドラッグして置くための受け渡し
import type { EditorCore } from './core'

type Drop = (ed: EditorCore) => Promise<unknown> | unknown
let pending: Drop | null = null

/** draggable な要素の onDragStart に渡す */
export function dragAdd(add: Drop) {
  return (e: React.DragEvent) => {
    pending = add
    e.dataTransfer.setData('application/x-irodori', '1')
    e.dataTransfer.effectAllowed = 'copy'
  }
}
export function takeDrop(): Drop | null { const p = pending; pending = null; return p }
export const isIrodoriDrag = (e: React.DragEvent) => e.dataTransfer.types.includes('application/x-irodori')
