import { jsPDF } from 'jspdf'
import { Download as DlIcon } from 'lucide-react'
import { useState } from 'react'
import { renderPage, renderPageSVG, MAX_PIXELS } from '../editor/core'
import type { DesignDoc } from '../editor/types'
import { usePopover } from './ColorPicker'

type Fmt = 'png' | 'jpeg' | 'pdf' | 'svg'

function save(url: string, name: string) {
  // 大きな dataURL はブラウザによって失敗するので Blob の URL に変えて保存する
  const href = url.startsWith('data:') ? URL.createObjectURL(dataURLtoBlob(url)) : url
  const a = document.createElement('a')
  a.href = href; a.download = name
  document.body.appendChild(a); a.click(); a.remove()
  if (href !== url) setTimeout(() => URL.revokeObjectURL(href), 60_000)
}
function dataURLtoBlob(u: string) {
  const [head, b64] = u.split(',')
  const mime = head.match(/data:(.*?);/)?.[1] ?? 'application/octet-stream'
  const bin = atob(b64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type: mime })
}
const safe = (s: string) => s.replace(/[\\/:*?"<>|]/g, '_') || 'design'

export async function exportDoc(doc: DesignDoc, fmt: Fmt, scale: number, pageIdx: number[] | 'all', transparent = false) {
  const pages = pageIdx === 'all' ? doc.pages : pageIdx.map((i) => doc.pages[i])
  if (fmt === 'pdf') {
    const unit = doc.print ? 'mm' : 'px'
    const pw = doc.print?.mmW ?? doc.width, ph = doc.print?.mmH ?? doc.height
    const orient = pw >= ph ? 'landscape' : 'portrait'
    const pdf = new jsPDF({ orientation: orient, unit, format: [pw, ph], hotfixes: ['px_scaling'], compress: true })
    for (let i = 0; i < pages.length; i++) {
      // 印刷物は 300dpi 相当(150dpi の 2 倍)で描く
      const url = await renderPage(pages[i].json, doc.width, doc.height, { multiplier: doc.print ? 2 : scale, format: 'jpeg', quality: 0.92 })
      if (i > 0) pdf.addPage([pw, ph], orient)
      pdf.addImage(url, 'JPEG', 0, 0, pw, ph, undefined, 'FAST')
    }
    const url = URL.createObjectURL(pdf.output('blob'))
    save(url, safe(doc.name) + '.pdf')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
    return
  }
  if (fmt === 'svg') {
    for (let i = 0; i < pages.length; i++) {
      const svg = await renderPageSVG(pages[i].json, doc.width, doc.height)
      const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
      save(url, `${safe(doc.name)}${pages.length > 1 ? '-' + (i + 1) : ''}.svg`)
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
      await new Promise((r) => setTimeout(r, 250))
    }
    return
  }
  for (let i = 0; i < pages.length; i++) {
    const url = await renderPage(pages[i].json, doc.width, doc.height, { multiplier: scale, format: fmt, transparent: fmt === 'png' && transparent })
    save(url, `${safe(doc.name)}${pages.length > 1 ? '-' + (i + 1) : ''}.${fmt === 'jpeg' ? 'jpg' : 'png'}`)
    await new Promise((r) => setTimeout(r, 250)) // 連続ダウンロードがブロックされないよう少し待つ
  }
}

export function DownloadButton({ getDoc, peekDoc, currentPage }: { getDoc: () => DesignDoc; peekDoc: () => DesignDoc; currentPage: number }) {
  const { open, setOpen, ref } = usePopover()
  const [fmt, setFmt] = useState<Fmt>('png')
  const [scale, setScale] = useState(2)
  const [which, setWhich] = useState<'all' | 'current'>('all')
  const [transparent, setTransparent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  // 描画中は中身を確定させない(getDoc は編集中の文字を確定するので、クリック時だけ呼ぶ)
  const doc = peekDoc()
  const go = async () => {
    setBusy(true); setErr('')
    try { await exportDoc(getDoc(), fmt, scale, which === 'all' ? 'all' : [currentPage], transparent); setOpen(false) }
    catch (e: any) { setErr('書き出しに失敗しました: ' + (e?.message ?? e)) }
    finally { setBusy(false) }
  }
  return (
    <div className="pop-wrap" ref={ref}>
      <button className="primary-btn" onClick={() => setOpen(!open)}><DlIcon size={18} />ダウンロード</button>
      {open && (
        <div className="popover right dl-pop">
          <div className="pop-label">ファイルの種類</div>
          <div className="row">
            {([['png', 'PNG(高画質)'], ['jpeg', 'JPG(軽い)'], ['pdf', 'PDF'], ['svg', 'SVG(ベクター)']] as [Fmt, string][]).map(([v, l]) =>
              <button key={v} className={'chip' + (fmt === v ? ' on' : '')} onClick={() => setFmt(v)}>{l}</button>)}
          </div>
          {(fmt === 'png' || fmt === 'jpeg') && <>
            <div className="pop-label">サイズ</div>
            <div className="row">{[1, 2, 3].map((s) => { const m = Math.min(s, Math.sqrt(MAX_PIXELS / (doc.width * doc.height))); return <button key={s} className={'chip' + (scale === s ? ' on' : '')} onClick={() => setScale(s)}>{s}倍({Math.round(doc.width * m)}×{Math.round(doc.height * m)})</button> })}</div>
          </>}
          {fmt === 'png' && <label className="check"><input type="checkbox" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} /> 背景を透明にする</label>}
          {fmt === 'svg' && <p className="hint">拡大しても劣化しない形式です。文字はフォント名で保存されるため、フォントが入っていない環境では別の書体で表示されます。</p>}
          {fmt === 'pdf' && <p className="hint">{doc.print ? `印刷用(${doc.print.mmW}×${doc.print.mmH}mm・300dpi相当)` : '画面用(ページ=デザインのピクセルサイズ)'}</p>}
          {doc.pages.length > 1 && <>
            <div className="pop-label">ページ</div>
            <div className="row">
              <button className={'chip' + (which === 'all' ? ' on' : '')} onClick={() => setWhich('all')}>全ページ({doc.pages.length})</button>
              <button className={'chip' + (which === 'current' ? ' on' : '')} onClick={() => setWhich('current')}>今のページだけ</button>
            </div>
          </>}
          {err && <p className="error">{err}</p>}
          <button className="primary-btn wide" disabled={busy} onClick={go}>{busy ? '作成中…' : 'ダウンロード'}</button>
        </div>
      )}
    </div>
  )
}
