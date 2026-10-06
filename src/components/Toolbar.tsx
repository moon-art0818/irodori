import { ActiveSelection, FabricImage, Group, Rect, Textbox } from 'fabric'
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Copy, FlipHorizontal, FlipVertical, Group as GroupIcon, Italic, Lock,
  Strikethrough, Trash2, Underline, Ungroup, Unlock, Layers, SlidersHorizontal, Sparkles, Minus, Plus, CaseSensitive,
} from 'lucide-react'
import { useState } from 'react'
import { Crop, ImageOff, Columns3, Wand2, List, ListOrdered, Replace } from 'lucide-react'
import { CropModal } from './CropModal'
import { makeChart, makeQR, makeTable, readTable, makeCurvedText, CHART_COLORS, type ChartSpec, type CurveSpec } from '../editor/elements'
import { loadFonts } from '../editor/core'
import { Textbox as TB } from 'fabric'
import { VText } from '../editor/vtext'
import type { EditorCore } from '../editor/core'
import { FONTS } from '../data/fonts'
import { ColorButton, usePopover } from './ColorPicker'

function Pop({ label, icon, children, title }: { label?: string; icon?: React.ReactNode; children: React.ReactNode; title: string }) {
  const { open, setOpen, ref } = usePopover()
  return (
    <div className="pop-wrap" ref={ref}>
      <button className={'tb-btn' + (open ? ' on' : '')} title={title} onClick={() => setOpen(!open)}>{icon}{label && <span>{label}</span>}</button>
      {open && <div className="popover">{children}</div>}
    </div>
  )
}

function Slider({ label, value, min, max, step = 1, onChange, onCommit }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; onCommit: () => void }) {
  return (
    <label className="slider">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} onPointerUp={onCommit} onKeyUp={onCommit} />
      <input type="number" className="num" value={Math.round(value * 100) / 100} step={step} onChange={(e) => { onChange(+e.target.value); }} onBlur={onCommit} />
    </label>
  )
}

export function Toolbar({ ed, docColors }: { ed: EditorCore; docColors: string[] }) {
  const objs = ed.selected()
  const o = ed.active()
  if (!o) return <div className="toolbar empty">オブジェクトをクリックすると、ここで色や文字を編集できます</div>

  const multi = o instanceof ActiveSelection
  const texts = objs.filter((x) => x instanceof Textbox) as Textbox[]
  const t = texts[0]
  const img = objs.length === 1 && o instanceof FabricImage ? o : null
  const isGroup = o instanceof Group && !multi
  const locked = objs.every((x: any) => x.locked)
  const vt = objs.length === 1 && o instanceof VText ? o : null
  const special = (o as any).chart ? 'chart' : (o as any).table ? 'table' : (o as any).qr ? 'qr' : (o as any).curved ? 'curved' : ''
  const shapeLike = !t && !img && !isGroup && !multi && !vt
  const strokeOnly = shapeLike && !o.fill && !!o.stroke

  return (
    <div className="toolbar">
      {t && <TextControls ed={ed} t={t} docColors={docColors} />}
      {vt && <VTextControls key={(vt as any).id} ed={ed} v={vt} docColors={docColors} />}
      {shapeLike && !strokeOnly && (
        <ColorButton title="塗り" value={o.fill} extra={docColors} allowNone onPick={(c) => ed.setProp({ fill: c })} onGradient={(g) => ed.setFillGradient(g, 45)} />
      )}
      {shapeLike && (
        <>
          <ColorButton title="線の色" value={o.stroke} extra={docColors} allowNone icon={<span className="stroke-ico" />} onPick={(c) => ed.setProp({ stroke: c || null, strokeWidth: c && !o.strokeWidth ? 4 : o.strokeWidth })} />
          <Pop title="線のスタイル" icon={<Minus size={18} />} >
            <StrokeControls ed={ed} />
          </Pop>
        </>
      )}
      {shapeLike && o instanceof Rect && (
        <Pop title="角の丸み" label="角丸">
          <RangeProp ed={ed} label="角の丸み" get={() => o.rx ?? 0} set={(v) => ({ rx: v, ry: v })} min={0} max={Math.min(o.width, o.height) / 2} />
        </Pop>
      )}
      {img && <ImageControls key={(img as any).id} ed={ed} img={img} />}
      {multi && (
        <>
          <button className="tb-btn" title="グループ化 (⌘G)" onClick={() => ed.group()}><GroupIcon size={18} /><span>グループ化</span></button>
        </>
      )}
      {special === 'curved' && <CurvedControls key={(o as any).id} ed={ed} docColors={docColors} />}
      {special === 'chart' && <Pop title="グラフを編集" label="グラフを編集"><ChartEditor key={(o as any).id} ed={ed} /></Pop>}
      {special === 'table' && <Pop title="表を編集" icon={<Columns3 size={18} />} label="表の設定"><TableEditor key={(o as any).id} ed={ed} /></Pop>}
      {special === 'qr' && <Pop title="QRコードを編集" label="QRコードを編集"><QREditor key={(o as any).id} ed={ed} /></Pop>}
      {special === 'table' && <span className="hint" style={{ margin: '0 8px' }}>セルをダブルクリックで文字を編集</span>}
      {isGroup && !special && <button className="tb-btn" title="グループ解除 (⇧⌘G)" onClick={() => ed.ungroup()}><Ungroup size={18} /><span>グループ解除</span></button>}

      <div className="tb-spacer" />

      <Pop title="エフェクト(影)" icon={<Sparkles size={18} />} label="エフェクト">
        <EffectControls ed={ed} />
      </Pop>
      <Pop title="透明度" icon={<SlidersHorizontal size={18} />}>
        <RangeProp ed={ed} label="透明度(%)" get={() => Math.round((o.opacity ?? 1) * 100)} set={(v) => ({ opacity: v / 100 })} min={0} max={100} />
      </Pop>
      <Pop title="配置" icon={<Layers size={18} />} label="配置">
        <PositionControls ed={ed} multi={multi} />
      </Pop>
      <button className="tb-btn" title="左右反転" onClick={() => ed.flip('x')}><FlipHorizontal size={18} /></button>
      <button className="tb-btn" title="上下反転" onClick={() => ed.flip('y')}><FlipVertical size={18} /></button>
      <button className="tb-btn" title={locked ? 'ロック解除' : 'ロック'} onClick={() => ed.toggleLock()}>{locked ? <Lock size={18} /> : <Unlock size={18} />}</button>
      <button className="tb-btn" title="複製 (⌘D)" onClick={() => ed.duplicate()}><Copy size={18} /></button>
      <button className="tb-btn danger" title="削除 (Delete)" onClick={() => ed.remove()}><Trash2 size={18} /></button>
    </div>
  )
}

/** スライダー操作中は履歴に積まず、離したときに1回だけ積む */
function RangeProp({ ed, label, get, set, min, max, step = 1 }: { ed: EditorCore; label: string; get: () => number; set: (v: number) => Record<string, any>; min: number; max: number; step?: number }) {
  const [, force] = useState(0)
  return <Slider label={label} value={get()} min={min} max={max} step={step} onChange={(v) => { ed.setProp(set(v), { commit: false }); force((n) => n + 1) }} onCommit={() => ed.commit()} />
}

function TextControls({ ed, t, docColors }: { ed: EditorCore; t: Textbox; docColors: string[] }) {
  const size = Math.round(t.fontSize * (t.scaleY ?? 1))
  const setSize = (v: number) => ed.setProp({ fontSize: Math.max(4, v) / (t.scaleY ?? 1) })
  const bold = Number(t.fontWeight) >= 700 || t.fontWeight === 'bold'
  const aligns: [string, React.ReactNode][] = [['left', <AlignLeft size={18} />], ['center', <AlignCenter size={18} />], ['right', <AlignRight size={18} />], ['justify', <AlignJustify size={18} />]]
  const nextAlign = aligns[(aligns.findIndex((a) => a[0] === t.textAlign) + 1) % aligns.length]
  return (
    <>
      <select className="font-select" value={t.fontFamily} onChange={(e) => ed.setFont(e.target.value)} style={{ fontFamily: t.fontFamily }}>
        {FONTS.map((f) => <option key={f.family} value={f.family} style={{ fontFamily: f.family }}>{f.label}</option>)}
      </select>
      <div className="size-ctl">
        <button className="tb-btn" onClick={() => setSize(size - 2)} title="小さく"><Minus size={14} /></button>
        <input className="num" type="number" value={size} onChange={(e) => setSize(+e.target.value)} />
        <button className="tb-btn" onClick={() => setSize(size + 2)} title="大きく"><Plus size={14} /></button>
      </div>
      <ColorButton title="文字色" value={t.fill} extra={docColors} icon={<span className="a-ico">A</span>} onPick={(c) => ed.setProp({ fill: c })} onGradient={(g) => ed.setFillGradient(g, 0)} />
      <button className={'tb-btn' + (bold ? ' on' : '')} title="太字" onClick={() => ed.setProp({ fontWeight: bold ? 400 : 700 })}><Bold size={18} /></button>
      <button className={'tb-btn' + (t.fontStyle === 'italic' ? ' on' : '')} title="斜体" onClick={() => ed.setProp({ fontStyle: t.fontStyle === 'italic' ? 'normal' : 'italic' })}><Italic size={18} /></button>
      <button className={'tb-btn' + (t.underline ? ' on' : '')} title="下線" onClick={() => ed.setProp({ underline: !t.underline })}><Underline size={18} /></button>
      <button className={'tb-btn' + (t.linethrough ? ' on' : '')} title="取り消し線" onClick={() => ed.setProp({ linethrough: !t.linethrough })}><Strikethrough size={18} /></button>
      <button className="tb-btn" title="文字揃え" onClick={() => ed.setProp({ textAlign: nextAlign[0] })}>{aligns.find((a) => a[0] === t.textAlign)?.[1] ?? <AlignLeft size={18} />}</button>
      <button className="tb-btn" title="箇条書き" onClick={() => ed.toggleList('bullet')}><List size={18} /></button>
      <button className="tb-btn" title="番号付きリスト" onClick={() => ed.toggleList('number')}><ListOrdered size={18} /></button>
      <button className={'tb-btn' + ((t as any).vertical ? ' on' : '')} title="縦書きにする" onClick={() => (t as any).vertical ? ed.setVertical(false) : ed.toggleVertical()}><span style={{ writingMode: 'vertical-rl', fontSize: 12, fontWeight: 700 }}>縦</span></button>
      <Pop title="文字間隔・行間" icon={<CaseSensitive size={18} />} label="間隔">
        <RangeProp ed={ed} label="文字間隔" get={() => t.charSpacing ?? 0} set={(v) => ({ charSpacing: v })} min={-200} max={1000} step={10} />
        <RangeProp ed={ed} label="行間" get={() => t.lineHeight ?? 1.2} set={(v) => ({ lineHeight: v })} min={0.6} max={3} step={0.05} />
      </Pop>
      <Pop title="文字の装飾" label="装飾">
        <div className="pop-label">縁取り</div>
        <div className="row">
          <ColorButton title="縁取りの色" value={t.stroke} allowNone onPick={(c) => ed.setProp({ stroke: c || null, strokeWidth: c ? Math.max(1, t.strokeWidth || 2) : 0, paintFirst: 'stroke', strokeLineJoin: 'round' })} />
          <RangeProp ed={ed} label="太さ" get={() => t.strokeWidth ?? 0} set={(v) => ({ strokeWidth: v, paintFirst: 'stroke', strokeLineJoin: 'round' })} min={0} max={30} />
        </div>
        <div className="pop-label">文字の背景色(マーカー)</div>
        <ColorButton title="背景色" value={t.textBackgroundColor} allowNone onPick={(c) => ed.setProp({ textBackgroundColor: c })} />
        <div className="pop-label">曲線(文字を弧に沿わせる)</div>
        <CurveSlider ed={ed} />
        <div className="pop-label">大文字・小文字</div>
        <div className="row">
          <button className="chip" onClick={() => ed.setProp({ text: t.text.toUpperCase() })}>ABC</button>
          <button className="chip" onClick={() => ed.setProp({ text: t.text.toLowerCase() })}>abc</button>
        </div>
      </Pop>
    </>
  )
}

function StrokeControls({ ed }: { ed: EditorCore }) {
  const o = ed.active()!
  const dashes: [string, number[] | null][] = [['実線', null], ['破線', [14, 10]], ['点線', [1, 10]], ['長破線', [30, 12]]]
  return (
    <>
      <RangeProp ed={ed} label="線の太さ" get={() => o.strokeWidth ?? 0} set={(v) => ({ strokeWidth: v, strokeUniform: true, stroke: o.stroke || '#1f2937' })} min={0} max={60} />
      <div className="pop-label">線の種類</div>
      <div className="row">{dashes.map(([l, d]) => <button key={l} className="chip" onClick={() => ed.setProp({ strokeDashArray: d, strokeLineCap: d && d[0] === 1 ? 'round' : o.strokeLineCap })}>{l}</button>)}</div>
      <div className="pop-label">線の端</div>
      <div className="row">{[['butt', '平ら'], ['round', '丸'], ['square', '四角']].map(([v, l]) => <button key={v} className="chip" onClick={() => ed.setProp({ strokeLineCap: v })}>{l}</button>)}</div>
    </>
  )
}

function EffectControls({ ed }: { ed: EditorCore }) {
  const o = ed.active()!
  const sh: any = o.shadow
  const [blur, setBlur] = useState(sh?.blur ?? 12)
  const [off, setOff] = useState(sh?.offsetX ?? 6)
  const [color, setColor] = useState(sh?.color ?? 'rgba(0,0,0,0.35)')
  const apply = (b = blur, f = off, c = color) => ed.setShadow(true, { blur: b, offsetX: f, offsetY: f, color: c })
  return (
    <>
      <div className="row">
        <button className={'chip' + (!sh ? ' on' : '')} onClick={() => ed.setShadow(false)}>なし</button>
        <button className="chip" onClick={() => { setBlur(12); setOff(6); setColor('rgba(0,0,0,0.35)'); ed.setShadow(true, { blur: 12, offsetX: 6, offsetY: 6 }) }}>ドロップ影</button>
        <button className="chip" onClick={() => { setBlur(30); setOff(0); setColor('rgba(0,0,0,0.25)'); ed.setShadow(true, { blur: 30, offsetX: 0, offsetY: 0, color: 'rgba(0,0,0,0.25)' }) }}>ふんわり</button>
        <button className="chip" onClick={() => { setBlur(0); setOff(8); setColor('rgba(0,0,0,0.9)'); ed.setShadow(true, { blur: 0, offsetX: 8, offsetY: 8, color: 'rgba(0,0,0,0.9)' }) }}>くっきり</button>
        <button className="chip" onClick={() => { setBlur(24); setOff(0); setColor('#fde047'); ed.setShadow(true, { blur: 24, offsetX: 0, offsetY: 0, color: '#fde047' }) }}>ネオン</button>
      </div>
      {sh && <>
        <Slider label="ぼかし" value={blur} min={0} max={80} onChange={(v) => { setBlur(v) }} onCommit={() => apply()} />
        <Slider label="距離" value={off} min={-50} max={50} onChange={(v) => { setOff(v) }} onCommit={() => apply()} />
        <div className="row"><span className="pop-label">影の色</span><ColorButton title="影の色" value={color} onPick={(c) => { setColor(c); apply(blur, off, c) }} /></div>
      </>}
    </>
  )
}

function GeometryInputs({ ed }: { ed: EditorCore }) {
  const o = ed.active()!
  const b = o.getBoundingRect()
  const [lock, setLock] = useState(true)
  const f = (v: number) => Math.round(v)
  const field = (label: string, value: number, on: (v: number) => void) => (
    <label className="geo"><span>{label}</span><input className="num" type="number" defaultValue={f(value)} key={label + f(value)}
      onKeyDown={(e) => { if (e.key === 'Enter') on(+(e.target as HTMLInputElement).value) }} onBlur={(e) => { if (+e.target.value !== f(value)) on(+e.target.value) }} /></label>
  )
  return (
    <>
      <div className="pop-label">位置・大きさ(px)</div>
      <div className="grid2">
        {field('X', b.left, (v) => ed.setGeometry({ x: v }))}
        {field('Y', b.top, (v) => ed.setGeometry({ y: v }))}
        {field('幅', o.getScaledWidth(), (v) => ed.setGeometry({ w: v, keepRatio: lock }))}
        {field('高さ', o.getScaledHeight(), (v) => lock ? ed.setGeometry({ w: (v / o.getScaledHeight()) * o.getScaledWidth(), keepRatio: true }) : ed.setGeometry({ h: v }))}
        {field('角度', o.angle ?? 0, (v) => ed.setGeometry({ angle: v }))}
        <label className="check"><input type="checkbox" checked={lock} onChange={(e) => setLock(e.target.checked)} />縦横比を保つ</label>
      </div>
    </>
  )
}

function PositionControls({ ed, multi }: { ed: EditorCore; multi: boolean }) {
  return (
    <>
      {!multi && <GeometryInputs ed={ed} />}
      <div className="pop-label">重なり順</div>
      <div className="grid2">
        <button className="chip" onClick={() => ed.order('front')}>最前面へ</button>
        <button className="chip" onClick={() => ed.order('forward')}>前面へ</button>
        <button className="chip" onClick={() => ed.order('back')}>最背面へ</button>
        <button className="chip" onClick={() => ed.order('backward')}>背面へ</button>
      </div>
      <div className="pop-label">{multi ? '整列(選択範囲に合わせる)' : '整列(ページに合わせる)'}</div>
      <div className="grid3">
        <button className="chip" onClick={() => ed.align('left')}>左揃え</button>
        <button className="chip" onClick={() => ed.align('hcenter')}>左右中央</button>
        <button className="chip" onClick={() => ed.align('right')}>右揃え</button>
        <button className="chip" onClick={() => ed.align('top')}>上揃え</button>
        <button className="chip" onClick={() => ed.align('vcenter')}>上下中央</button>
        <button className="chip" onClick={() => ed.align('bottom')}>下揃え</button>
      </div>
      {multi && <>
        <div className="pop-label">等間隔に並べる(3つ以上)</div>
        <div className="grid2">
          <button className="chip" onClick={() => ed.distribute('h')}>横に等間隔</button>
          <button className="chip" onClick={() => ed.distribute('v')}>縦に等間隔</button>
        </div>
      </>}
    </>
  )
}

function ImageControls({ ed, img }: { ed: EditorCore; img: FabricImage }) {
  const [st, setSt] = useState(() => ed.imageFilterState(img))
  const upd = (patch: any, commit = false) => { const n = { ...st, ...patch }; setSt(n); ed.setImageFilters(n); if (commit) ed.commit() }
  const presets: [string, any][] = [
    ['元に戻す', {}], ['モノクロ', { grayscale: true }], ['セピア', { sepia: true }], ['鮮やか', { saturation: 0.4, contrast: 0.1 }],
    ['明るく', { brightness: 0.12, contrast: 0.05 }], ['しっとり', { brightness: -0.05, saturation: -0.3, contrast: 0.1 }], ['反転', { invert: true }],
  ]
  const [crop, setCrop] = useState(false)
  const [bgBusy, setBgBusy] = useState('')
  return (
    <>
      <button className="tb-btn" title="背景除去(AI)" disabled={!!bgBusy} onClick={async () => {
        setBgBusy('準備中…')
        try { await ed.removeImageBackground(img, (t, r) => setBgBusy(`${t} ${Math.round(r * 100)}%`)) }
        catch (e: any) { alert(e?.message ?? '背景除去に失敗しました') }
        finally { setBgBusy('') }
      }}><Wand2 size={18} /><span>{bgBusy || '背景除去'}</span></button>
      <label className="tb-btn" title="画像を差し替え(大きさと位置はそのまま)"><Replace size={18} /><span className="hide-sm">差し替え</span>
        <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) ed.replaceImage(img, f).catch((er) => alert(er?.message ?? er)) }} />
      </label>
      <button className="tb-btn" title="トリミング" onClick={() => setCrop(true)}><Crop size={18} /><span>トリミング</span></button>
      {crop && <CropModal ed={ed} img={img} onClose={() => setCrop(false)} />}
      {(img as any).credit && <a className="credit-chip" href={/^https:\/\/(unsplash\.com|www\.pexels\.com)\//.test(String((img as any).credit.pageUrl)) ? (img as any).credit.pageUrl : undefined} target="_blank" rel="noopener noreferrer" title="写真のクレジット">Photo by {(img as any).credit.author} / {(img as any).credit.source}</a>}
      {(img as any).frame && <button className="tb-btn" title="写真をフレームから外す" onClick={() => ed.clearFrame()}><ImageOff size={18} /></button>}
      <Pop title="画像の調整" icon={<SlidersHorizontal size={18} />} label="調整">
        <div className="pop-label">フィルター</div>
        <div className="row wrap">{presets.map(([l, p]) => <button key={l} className="chip" onClick={() => { setSt(p); ed.setImageFilters(p); ed.commit() }}>{l}</button>)}</div>
        <Slider label="明るさ" value={st.brightness ?? 0} min={-0.6} max={0.6} step={0.02} onChange={(v) => upd({ brightness: v })} onCommit={() => ed.commit()} />
        <Slider label="コントラスト" value={st.contrast ?? 0} min={-0.6} max={0.6} step={0.02} onChange={(v) => upd({ contrast: v })} onCommit={() => ed.commit()} />
        <Slider label="彩度" value={st.saturation ?? 0} min={-1} max={1} step={0.02} onChange={(v) => upd({ saturation: v })} onCommit={() => ed.commit()} />
        <Slider label="ぼかし" value={st.blur ?? 0} min={0} max={0.5} step={0.01} onChange={(v) => upd({ blur: v })} onCommit={() => ed.commit()} />
      </Pop>
      <Pop title="角の丸み" label="角丸">
        <RangeProp ed={ed} label="角の丸み" get={() => Math.round(((img.clipPath as any)?.rx ?? 0) * (img.scaleX || 1))} set={(v) => {
          const r = new Rect({ width: img.width, height: img.height, rx: v / (img.scaleX || 1), ry: v / (img.scaleY || 1), originX: 'center', originY: 'center' })
          return { clipPath: v > 0 ? r : undefined }
        }} min={0} max={Math.round(Math.min(img.getScaledWidth(), img.getScaledHeight()) / 2)} />
      </Pop>
    </>
  )
}

function ChartEditor({ ed }: { ed: EditorCore }) {
  const o = ed.active() as any
  const spec: ChartSpec = o.chart
  const [type, setType] = useState(spec.type)
  const [title, setTitle] = useState(spec.title ?? '')
  const [rows, setRows] = useState(spec.labels.map((l, i) => `${l}, ${spec.values[i] ?? 0}`).join('\n'))
  const [palette, setPalette] = useState(spec.colors)
  const apply = (next: Partial<{ type: ChartSpec['type']; title: string; rows: string; colors: string[] }> = {}) => {
    const lines = (next.rows ?? rows).split('\n').map((l) => l.split(/[,、\t]/)).filter((p) => p[0]?.trim())
    const labels = lines.map((p) => p[0].trim())
    const values = lines.map((p) => parseFloat((p[1] ?? '0').replace(/[^0-9.\-]/g, '')) || 0)
    const ty = next.type ?? type
    const g = makeChart({ ...spec, type: ty, title: next.title ?? title, labels, values, colors: next.colors ?? palette })
    ed.regenerate(o, g)
  }
  const pals = [CHART_COLORS, ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#0369a1'], ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#c2410c'], ['#111827', '#4b5563', '#9ca3af', '#d1d5db', '#6b7280'], ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6']]
  return (
    <>
      <div className="pop-label">種類</div>
      <div className="row">{([['bar', '棒'], ['hbar', '横棒'], ['line', '折れ線'], ['pie', '円'], ['donut', 'ドーナツ']] as [ChartSpec['type'], string][]).map(([v, l]) =>
        <button key={v} className={'chip' + (type === v ? ' on' : '')} onClick={() => { setType(v); apply({ type: v }) }}>{l}</button>)}</div>
      <div className="pop-label">タイトル</div>
      <input className="search" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => apply()} />
      <div className="pop-label">データ(1行に「項目, 数値」)</div>
      <textarea className="data-area" rows={7} value={rows} onChange={(e) => setRows(e.target.value)} onBlur={() => apply()} />
      <div className="pop-label">色</div>
      <div className="row">{pals.map((p, i) => <button key={i} className="pal" onClick={() => { setPalette(p); apply({ colors: p }) }}>{p.slice(0, 5).map((c) => <i key={c} style={{ background: c }} />)}</button>)}</div>
      <button className="primary-btn wide" onClick={() => apply()}>反映する</button>
    </>
  )
}

function TableEditor({ ed }: { ed: EditorCore }) {
  const o = ed.active() as any
  const t = o.table
  const rebuild = (patch: Partial<{ rows: number; cols: number; header: string; border: string }>) => {
    const cells = readTable(o)
    const spec = { ...t, ...patch }
    const g = makeTable({ ...spec, cells })
    g.set({ scaleX: o.scaleX, scaleY: o.scaleY })
    ed.regenerate(o, g, false)
  }
  return (
    <>
      <div className="pop-label">行・列</div>
      <div className="grid2">
        <button className="chip" onClick={() => rebuild({ rows: t.rows + 1 })}>行を追加</button>
        <button className="chip" disabled={t.rows <= 1} onClick={() => rebuild({ rows: t.rows - 1 })}>行を削除</button>
        <button className="chip" onClick={() => rebuild({ cols: t.cols + 1 })}>列を追加</button>
        <button className="chip" disabled={t.cols <= 1} onClick={() => rebuild({ cols: t.cols - 1 })}>列を削除</button>
      </div>
      <div className="pop-label">見出し行の色</div>
      <div className="row">
        {['#7c3aed', '#0ea5e9', '#10b981', '#f97316', '#111827', ''].map((c) => <button key={c || 'none'} className={'swatch-btn' + (c ? '' : ' none')} style={{ background: c || undefined, width: 28 }} onClick={() => rebuild({ header: c })} />)}
      </div>
      <div className="pop-label">罫線の色</div>
      <div className="row">
        {['#d4d4d8', '#111827', '#7c3aed', '#ffffff'].map((c) => <button key={c} className="swatch-btn" style={{ background: c, width: 28 }} onClick={() => rebuild({ border: c })} />)}
      </div>
    </>
  )
}

function QREditor({ ed }: { ed: EditorCore }) {
  const o = ed.active() as any
  const [text, setText] = useState(o.qr.text)
  const [color, setColor] = useState(o.qr.color)
  const apply = (c = color) => ed.regenerate(o, makeQR(text, c, 300, o.qr.bg))
  return (
    <>
      <div className="pop-label">URL・テキスト</div>
      <input className="search" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') apply() }} />
      <div className="pop-label">色</div>
      <div className="row">{['#111827', '#7c3aed', '#0369a1', '#047857', '#b91c1c'].map((c) => <button key={c} className="swatch-btn" style={{ background: c, width: 28 }} onClick={() => { setColor(c); apply(c) }} />)}</div>
      <button className="primary-btn wide" onClick={() => apply()}>反映する</button>
    </>
  )
}

/** Textbox → 曲線テキストに変換するスライダー */
function CurveSlider({ ed }: { ed: EditorCore }) {
  const [v, setV] = useState(0)
  const convert = async () => {
    const t = ed.active()
    if (!(t instanceof TB) || v === 0) return
    const spec: CurveSpec = { text: t.text.replace(/\n/g, ' '), fontFamily: t.fontFamily, fontSize: t.fontSize * (t.scaleY ?? 1), fill: typeof t.fill === 'string' ? t.fill : '#1f2937', fontWeight: t.fontWeight, curve: v, charSpacing: t.charSpacing }
    await loadFonts([[spec.fontFamily, spec.text]])
    const g = makeCurvedText(spec)
    const b = t.getBoundingRect()
    g.set({ left: b.left + b.width / 2 - g.width / 2, top: b.top, angle: t.angle })
    ed.replaceObject(t, g)
  }
  return <Slider label="曲がり" value={v} min={-100} max={100} onChange={setV} onCommit={convert} />
}

/** 曲線テキストの編集(文字・フォント・色・曲がり) */
function CurvedControls({ ed, docColors }: { ed: EditorCore; docColors: string[] }) {
  const o = ed.active() as any
  const spec: CurveSpec = o.curved
  const [text, setText] = useState(spec.text)
  const [curve, setCurve] = useState(spec.curve)
  const apply = async (patch: Partial<CurveSpec>) => {
    const next = { ...spec, text, curve, ...patch }
    await loadFonts([[next.fontFamily, next.text]])
    if (next.curve === 0) {
      // 曲がり 0 は普通の文字に戻す
      const t = new TB(next.text, { fontFamily: next.fontFamily, fontSize: next.fontSize, fill: next.fill, fontWeight: next.fontWeight, width: Math.max(200, next.text.length * next.fontSize), textAlign: 'center', splitByGrapheme: true })
      t.set({ left: o.left, top: o.top, scaleX: o.scaleX, scaleY: o.scaleY, angle: o.angle })
      ed.replaceObject(o, t)
      return
    }
    const g = makeCurvedText(next)
    const cx = o.left + o.getScaledWidth() / 2
    g.set({ scaleX: o.scaleX, scaleY: o.scaleY, angle: o.angle })
    g.set({ left: cx - g.getScaledWidth() / 2, top: o.top })
    ed.replaceObject(o, g)
  }
  return (
    <>
      <input className="curve-text" value={text} onChange={(e) => setText(e.target.value)} onBlur={() => text !== spec.text && apply({})} onKeyDown={(e) => { if (e.key === 'Enter') apply({}) }} />
      <select className="font-select" value={spec.fontFamily} onChange={(e) => apply({ fontFamily: e.target.value })}>
        {FONTS.map((f) => <option key={f.family} value={f.family}>{f.label}</option>)}
      </select>
      <ColorButton title="文字色" value={spec.fill} extra={docColors} icon={<span className="a-ico">A</span>} onPick={(c) => apply({ fill: c })} />
      <Pop title="曲がり" label="曲がり">
        <Slider label="曲がり" value={curve} min={-100} max={100} onChange={setCurve} onCommit={() => apply({ curve })} />
        <p className="hint">0 にすると普通の文字に戻ります</p>
      </Pop>
    </>
  )
}

/** 縦書きテキストの操作 */
function VTextControls({ ed, v, docColors }: { ed: EditorCore; v: VText; docColors: string[] }) {
  const size = Math.round(v.fontSize * (v.scaleY ?? 1))
  const setSize = (n: number) => ed.setProp({ fontSize: Math.max(4, n) / (v.scaleY ?? 1) })
  const bold = Number(v.fontWeight) >= 700
  return (
    <>
      <button className="tb-btn" title="文字を編集(ダブルクリックでも可)" onClick={() => ed.onEditVText?.(v)}><span>文字を編集</span></button>
      <select className="font-select" value={v.fontFamily} onChange={async (e) => { await loadFonts([[e.target.value, v.text]]); ed.setProp({ fontFamily: e.target.value }) }} style={{ fontFamily: v.fontFamily }}>
        {FONTS.map((f) => <option key={f.family} value={f.family} style={{ fontFamily: f.family }}>{f.label}</option>)}
      </select>
      <div className="size-ctl">
        <button className="tb-btn" onClick={() => setSize(size - 2)} title="小さく"><Minus size={14} /></button>
        <input className="num" type="number" value={size} onChange={(e) => setSize(+e.target.value)} />
        <button className="tb-btn" onClick={() => setSize(size + 2)} title="大きく"><Plus size={14} /></button>
      </div>
      <ColorButton title="文字色" value={v.fill} extra={docColors} icon={<span className="a-ico">A</span>} onPick={(c) => ed.setProp({ fill: c })} />
      <button className={'tb-btn' + (bold ? ' on' : '')} title="太字" onClick={() => ed.setProp({ fontWeight: bold ? 400 : 700 })}><Bold size={18} /></button>
      <Pop title="縦書きの設定" label="組み方">
        <RangeProp ed={ed} label="1列の文字数" get={() => v.maxChars} set={(n) => ({ maxChars: Math.round(n) })} min={1} max={60} />
        <RangeProp ed={ed} label="列の間隔" get={() => v.lineHeight} set={(n) => ({ lineHeight: n })} min={1} max={3} step={0.05} />
        <RangeProp ed={ed} label="字の間隔" get={() => v.charSpacing} set={(n) => ({ charSpacing: n })} min={-0.2} max={1} step={0.01} />
        <p className="hint">半角の数字1〜2桁は横向きのまま(縦中横)、英字や「ー」は回転、句読点は右上に置きます。改行すると次の列になります。</p>
      </Pop>
      <Pop title="縁取り" label="縁取り">
        <ColorButton title="縁取りの色" value={v.textStroke} allowNone onPick={(c) => ed.setProp({ textStroke: c || null, textStrokeWidth: c ? Math.max(2, v.textStrokeWidth || 4) : 0 })} />
        <RangeProp ed={ed} label="太さ" get={() => v.textStrokeWidth ?? 0} set={(n) => ({ textStrokeWidth: n })} min={0} max={30} />
      </Pop>
      <button className="tb-btn on" title="横書きに戻す" onClick={() => ed.toggleVertical()}><span style={{ writingMode: 'vertical-rl', fontSize: 12, fontWeight: 700 }}>縦</span></button>
    </>
  )
}
