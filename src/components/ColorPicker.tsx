import { useEffect, useRef, useState } from 'react'

export const PALETTE = [
  '#000000', '#3f3f46', '#71717a', '#d4d4d8', '#ffffff',
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
  '#fecaca', '#fed7aa', '#fef08a', '#bbf7d0', '#bae6fd', '#c7d2fe', '#e9d5ff', '#fbcfe8',
]
export const GRADIENTS: [string, string][] = [
  ['#a18cd1', '#fbc2eb'], ['#ff9a9e', '#fecfef'], ['#43e97b', '#38f9d7'], ['#4facfe', '#00f2fe'],
  ['#fa709a', '#fee140'], ['#30cfd0', '#330867'], ['#f6d365', '#fda085'], ['#0f2027', '#2c5364'],
  ['#1e1b4b', '#4f46e5'], ['#ff512f', '#dd2476'], ['#11998e', '#38ef7d'], ['#fc5c7d', '#6a82fb'],
]

export function usePopover() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    window.addEventListener('mousedown', h)
    return () => window.removeEventListener('mousedown', h)
  }, [open])
  return { open, setOpen, ref }
}

export function swatchStyle(v: any): React.CSSProperties {
  if (!v) return { background: 'repeating-conic-gradient(#ddd 0 25%, #fff 0 50%) 0 0/10px 10px' }
  if (typeof v === 'string') return { background: v }
  const stops = v.colorStops?.map((s: any) => s.color) ?? ['#ccc', '#999']
  return { background: `linear-gradient(135deg, ${stops.join(',')})` }
}

export function ColorButton(props: {
  value: any; title: string; onPick: (c: string) => void; onGradient?: (g: [string, string]) => void
  allowNone?: boolean; extra?: string[]; icon?: React.ReactNode
}) {
  const { open, setOpen, ref } = usePopover()
  const [custom, setCustom] = useState(typeof props.value === 'string' && props.value.startsWith('#') ? props.value : '#8b5cf6')
  return (
    <div className="pop-wrap" ref={ref}>
      <button className="tb-btn color-btn" title={props.title} onClick={() => setOpen(!open)}>
        {props.icon ?? null}
        <span className="swatch" style={swatchStyle(props.value)} />
      </button>
      {open && (
        <div className="popover color-pop">
          {props.extra && props.extra.length > 0 && (<><div className="pop-label">このデザインの色</div>
            <div className="swatches">{props.extra.map((c) => <button key={c} className="swatch-btn" style={{ background: c }} onClick={() => props.onPick(c)} title={c} />)}</div></>)}
          <div className="pop-label">カラー</div>
          <div className="swatches">
            {props.allowNone && <button className="swatch-btn none" title="なし" onClick={() => props.onPick('')} />}
            {PALETTE.map((c) => <button key={c} className="swatch-btn" style={{ background: c }} onClick={() => props.onPick(c)} title={c} />)}
          </div>
          {props.onGradient && (<><div className="pop-label">グラデーション</div>
            <div className="swatches">{GRADIENTS.map((g) => <button key={g.join()} className="swatch-btn" style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})` }} onClick={() => props.onGradient!(g)} />)}</div></>)}
          <div className="pop-label">自由に選ぶ</div>
          <div className="row">
            <input type="color" value={custom} onChange={(e) => { setCustom(e.target.value); props.onPick(e.target.value) }} />
            <input className="hex" value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && /^#[0-9a-f]{3,8}$/i.test(custom)) props.onPick(custom) }} />
          </div>
        </div>
      )}
    </div>
  )
}
