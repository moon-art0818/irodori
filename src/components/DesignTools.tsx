// エディタ上部の「ツール」: デザインチェック・色とフォントの一括置換・PDF の読み込み
import { Wrench, ShieldCheck, Replace, FileUp, Wand } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { EditorCore } from '../editor/core'
import type { DesignDoc } from '../editor/types'
import { createDoc, repo, newPageId } from '../editor/repo'
import { usePopover } from './ColorPicker'
import { FONTS } from '../data/fonts'

type Issue = { page: number; index: number; severity: string; message: string; fix?: { props: Record<string, any> } }

export function DesignTools({ ed, getDoc, gotoPage, reload }: { ed: EditorCore; getDoc: () => DesignDoc; gotoPage: (i: number) => Promise<void>; reload: () => void }) {
  const { open, setOpen, ref } = usePopover()
  const [tab, setTab] = useState<'check' | 'replace' | 'pdf'>('check')
  return (
    <div className="pop-wrap" ref={ref}>
      <button className={'tb-btn' + (open ? ' on' : '')} title="ツール(デザインチェック・一括置換・PDF 読み込み)" onClick={() => setOpen(!open)}><Wrench size={18} /><span className="hide-sm">ツール</span></button>
      {open && (
        <div className="popover right tools-pop">
          <div className="seg" style={{ alignSelf: 'flex-start' }}>
            <button className={tab === 'check' ? 'on' : ''} onClick={() => setTab('check')}><ShieldCheck size={13} /> チェック</button>
            <button className={tab === 'replace' ? 'on' : ''} onClick={() => setTab('replace')}><Replace size={13} /> 一括置換</button>
            <button className={tab === 'pdf' ? 'on' : ''} onClick={() => setTab('pdf')}><FileUp size={13} /> PDF</button>
          </div>
          {tab === 'check' && <Check ed={ed} getDoc={getDoc} gotoPage={gotoPage} />}
          {tab === 'replace' && <ReplaceTool getDoc={getDoc} reload={reload} />}
          {tab === 'pdf' && <PdfTool />}
        </div>
      )}
    </div>
  )
}

function Check({ ed, getDoc, gotoPage }: { ed: EditorCore; getDoc: () => DesignDoc; gotoPage: (i: number) => Promise<void> }) {
  const [issues, setIssues] = useState<Issue[] | null>(null)
  const run = async () => { const { checkDesign } = await import('../features/quality'); setIssues(await Promise.resolve(checkDesign(getDoc())) as Issue[]) }
  const jump = async (x: Issue) => {
    if (x.page > 0) await gotoPage(x.page - 1)
    const o = ed.canvas.getObjects()[x.index]
    if (o) ed.selectObjects([o])
  }
  const fix = async (x: Issue) => {
    await jump(x)
    const o = ed.canvas.getObjects()[x.index]
    if (o && x.fix) { o.set(x.fix.props); o.setCoords(); ed.canvas.requestRenderAll(); ed.commit(); setIssues((l) => l?.filter((y) => y !== x) ?? null); toast.success('修正しました') }
  }
  return (
    <>
      <p className="hint">文字のはみ出し・ページ外・コントラスト不足・小さすぎる文字・余白・画像の解像度・フォント数を自動で点検します。AI エージェントも同じ点検を使います。</p>
      <button className="primary-btn" onClick={run}><ShieldCheck size={14} />点検する</button>
      {issues && (issues.length === 0 ? <p className="ok-line">問題は見つかりませんでした。</p> : (
        <div className="issue-list">
          {issues.map((x, i) => (
            <div key={i} className={'issue ' + x.severity}>
              <button className="issue-main" onClick={() => jump(x)}><span className="sev">{x.severity === 'error' ? '要修正' : x.severity === 'warn' ? '注意' : '情報'}</span><span>{x.page > 0 ? `${x.page}ページ ` : ''}{x.message}</span></button>
              {x.fix && <button className="icon-btn" title="自動で直す" onClick={() => fix(x)}><Wand size={14} /></button>}
            </div>
          ))}
        </div>
      ))}
    </>
  )
}

function ReplaceTool({ getDoc, reload }: { getDoc: () => DesignDoc; reload: () => void }) {
  const [data, setData] = useState<{ colors: string[]; fonts: string[] } | null>(null)
  const [to, setTo] = useState<Record<string, string>>({})
  const load = async () => { const r = await import('../features/replace'); const pages = getDoc().pages.map((p) => p.json); setData({ colors: r.listColors(pages).map((x) => x.color), fonts: r.listFonts(pages).map((x) => x.font) }) }
  const apply = async (kind: 'color' | 'font', from: string) => {
    const r = await import('../features/replace')
    const d = getDoc(), target = to[kind + from]
    if (!target) return
    const pages = d.pages.map((p) => p.json)
    const n = kind === 'color' ? r.replaceColor(pages, from, target) : r.replaceFont(pages, from, target)
    toast.success(`${n} か所を置き換えました`)
    reload(); load()
  }
  if (!data) return <><p className="hint">全ページで使っている色・フォントを、まとめて別のものに置き換えます(取り消しは「履歴」から)。</p><button className="primary-btn" onClick={load}>使っている色とフォントを調べる</button></>
  return (
    <div className="replace-list">
      <div className="pop-label">色({data.colors.length})</div>
      {data.colors.slice(0, 24).map((c) => (
        <div key={c} className="replace-row"><span className="swatch" style={{ background: c }} /><code>{c}</code>→<input type="color" value={to['color' + c] ?? (c.length === 7 ? c : '#000000')} onChange={(e) => setTo({ ...to, ['color' + c]: e.target.value })} /><button className="chip" onClick={() => apply('color', c)}>置換</button></div>
      ))}
      <div className="pop-label">フォント({data.fonts.length})</div>
      {data.fonts.map((f) => (
        <div key={f} className="replace-row"><span style={{ fontFamily: f, flex: 1 }}>{f}</span>→<select className="font-select" value={to['font' + f] ?? ''} onChange={(e) => setTo({ ...to, ['font' + f]: e.target.value })}><option value="">選ぶ</option>{FONTS.map((x) => <option key={x.family} value={x.family}>{x.label}</option>)}</select><button className="chip" onClick={() => apply('font', f)}>置換</button></div>
      ))}
    </div>
  )
}

function PdfTool() {
  const [busy, setBusy] = useState('')
  const run = async (f: File) => {
    setBusy('読み込み中…')
    try {
      const { importPDF } = await import('../features/pdfImport')
      const r = await importPDF(f, (done, total) => setBusy(`読み込み中… ${done}/${total}`))
      const d = createDoc(f.name.replace(/\.pdf$/i, ''), r.width, r.height)
      d.pages = r.pages.map((p, i) => ({ id: newPageId() + i, json: p.json }))
      d.updatedAt = await repo.put(d, { baseUpdatedAt: null })
      toast.success(`${r.pages.length} ページを読み込みました`)
      location.hash = '#/d/' + d.id
    } catch (e: any) { toast.error('PDF を読み込めませんでした: ' + (e?.message ?? e)) }
    finally { setBusy('') }
  }
  return (
    <>
      <p className="hint">PDF の各ページを画像として取り込み、新しいデザインを作ります(上に文字や図形を重ねて編集できます)。</p>
      <label className="primary-btn" style={{ cursor: 'pointer', alignSelf: 'flex-start' }}><FileUp size={14} />{busy || 'PDF を選ぶ'}
        <input type="file" accept="application/pdf,.pdf" hidden disabled={!!busy} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) run(f) }} />
      </label>
    </>
  )
}
