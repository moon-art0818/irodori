import { useEffect, useRef } from 'react'
import { ActiveSelection, Group } from 'fabric'
import type { EditorCore } from '../editor/core'

/** 右クリックメニュー */
export function ContextMenu({ ed, x, y, onClose }: { ed: EditorCore; x: number; y: number; onClose: () => void }) {
  const openedAt = useRef(performance.now())
  useEffect(() => {
    // 長押しで開いた直後に指を離すと mousedown が来ることがあるので、開いてすぐは無視する
    const close = (e: Event) => { if (e.type === 'mousedown' && performance.now() - openedAt.current < 700) return; onClose() }
    window.addEventListener('mousedown', close)
    window.addEventListener('wheel', close)
    window.addEventListener('keydown', close)
    return () => { window.removeEventListener('mousedown', close); window.removeEventListener('wheel', close); window.removeEventListener('keydown', close) }
  }, [onClose])
  const o = ed.active()
  const multi = o instanceof ActiveSelection
  const group = o instanceof Group && !multi && !(o as any).table && !(o as any).chart && !(o as any).qr && !(o as any).curved
  const locked = !!o && ed.selected().every((x: any) => x.locked)
  const items: ([string, string, () => unknown] | '-')[] = o ? [
    ['コピー', '⌘C', () => ed.copy()],
    ['貼り付け', '⌘V', () => ed.paste()],
    ['複製', '⌘D', () => ed.duplicate()],
    ['削除', 'Del', () => ed.remove()],
    '-',
    ['最前面へ', '⌘⇧]', () => ed.order('front')],
    ['前面へ', '⌘]', () => ed.order('forward')],
    ['背面へ', '⌘[', () => ed.order('backward')],
    ['最背面へ', '⌘⇧[', () => ed.order('back')],
    '-',
    ...(multi ? [['グループ化', '⌘G', () => ed.group()] as [string, string, () => unknown]] : []),
    ...(group ? [['グループ解除', '⇧⌘G', () => ed.ungroup()] as [string, string, () => unknown]] : []),
    [locked ? 'ロック解除' : 'ロック', '⌘L', () => ed.toggleLock()],
    ['ページの左右中央', '', () => ed.align('hcenter')],
    ['ページの上下中央', '', () => ed.align('vcenter')],
  ] : [
    ['貼り付け', '⌘V', () => ed.paste()],
    ['すべて選択', '⌘A', () => ed.selectAll()],
  ]
  const touch = matchMedia('(pointer: coarse)').matches
  const W = 220, H = items.length * (touch ? 44 : 30)
  const left = Math.min(x, window.innerWidth - W - 8), top = Math.min(y, window.innerHeight - H - 8)
  return (
    <div className="ctx-menu" style={{ left, top, width: W }} onMouseDown={(e) => e.stopPropagation()} onContextMenu={(e) => e.preventDefault()}>
      {items.map((it, i) => it === '-' ? <hr key={i} /> : (
        <button key={it[0]} onClick={() => { it[2](); onClose() }}><span>{it[0]}</span><kbd>{it[1]}</kbd></button>
      ))}
    </div>
  )
}

export const SHORTCUTS: [string, string][] = [
  ['⌘Z / ⇧⌘Z', '元に戻す / やり直す'], ['⌘C / ⌘X / ⌘V', 'コピー / 切り取り / 貼り付け'], ['⌘D', '複製'], ['Delete', '削除'],
  ['⌘A', 'すべて選択'], ['⌘G / ⇧⌘G', 'グループ化 / 解除'], ['⌘L', 'ロック'], ['⌘] / ⌘[', '前面へ / 背面へ(⇧で最前面・最背面)'],
  ['矢印(⇧で10px)', '少しずつ移動'], ['T', 'テキストを追加'], ['R / C / L', '四角 / 円 / 線を追加'],
  ['⌘+ / ⌘- / ⌘0', '拡大 / 縮小 / 画面に合わせる'], ['⌘+ホイール', 'ズーム'], ['スペース+ドラッグ', '表示を移動'],
  ['ダブルクリック', '文字・表のセルを編集'], ['右クリック', 'メニュー'], ['Esc', '選択解除'], ['?', 'この一覧'],
]
