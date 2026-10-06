import { useEffect, useRef, useState } from 'react'
import type { EditorCore } from '../editor/core'
import { loadFonts } from '../editor/core'
import type { VText } from '../editor/vtext'

/** 縦書きテキストの編集欄(入力欄そのものも縦書きで表示する) */
export function VTextEditor({ ed, v, onClose }: { ed: EditorCore; v: VText; onClose: () => void }) {
  const [text, setText] = useState(v.text)
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { ref.current?.focus(); ref.current?.select() }, [])
  const done = async () => {
    if (text !== v.text) {
      await loadFonts([[v.fontFamily, text]])
      ed.setProp({ text })
    }
    onClose()
  }
  return (
    <div className="modal-back" onPointerDown={done}>
      <div className="modal" onPointerDown={(e) => e.stopPropagation()}>
        <h3>縦書きの文字を編集</h3>
        <textarea ref={ref} className="vtext-area" maxLength={5000} value={text} onChange={(e) => setText(e.target.value)}
          style={{ fontFamily: v.fontFamily, fontWeight: v.fontWeight as any }}
          onKeyDown={(e) => { if (e.key === 'Escape') onClose(); if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) done() }} />
        <p className="hint">Enter で改行(次の列)。⌘Enter または枠の外をクリックで確定、Esc で取り消し。</p>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button className="chip" onClick={onClose}>取り消し</button>
          <button className="primary-btn" onClick={done}>確定</button>
        </div>
      </div>
    </div>
  )
}
