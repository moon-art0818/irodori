// ⌘K で開くコマンドパレット(cmdk)。テンプレ・サイズ・自分のデザイン・操作をまとめて検索する
import { Command } from 'cmdk'
import { useEffect, useState } from 'react'
import { LayoutGrid, Maximize, FileText, Bot, Moon, Sparkles } from 'lucide-react'
import { TEMPLATES, pageCount } from '../data/templates'
import { SIZES } from '../data/sizes'
import type { DocSummary } from '../editor/repo'
import { createFromSize, createFromTemplate } from './Home'

let opener: (() => void) | null = null
export const openPalette = () => opener?.()

export function CommandPalette({ docs, onNewDeck, goto, toggleTheme }: { docs: DocSummary[]; onNewDeck: () => void; goto: (v: any) => void; toggleTheme: () => void }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    opener = () => setOpen(true)
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o) } }
    window.addEventListener('keydown', k)
    return () => { window.removeEventListener('keydown', k); opener = null }
  }, [])
  const run = (f: () => void) => { setOpen(false); f() }
  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="コマンドパレット">
      <Command.Input placeholder="テンプレート・サイズ・デザイン・操作を検索…" />
      <Command.List>
        <Command.Empty>見つかりませんでした</Command.Empty>
        {docs.length > 0 && (
          <Command.Group heading="マイデザイン">
            {docs.slice(0, 20).map((d) => <Command.Item key={d.id} value={'design ' + d.name} onSelect={() => run(() => { location.hash = '#/d/' + d.id })}><FileText size={15} />{d.name}<small>{d.width}×{d.height}</small></Command.Item>)}
          </Command.Group>
        )}
        <Command.Group heading="操作">
          <Command.Item value="ai agent 連携 エージェント" onSelect={() => run(() => goto('agent'))}><Bot size={15} />AI エージェントと連携</Command.Item>
          <Command.Item value="html スライド slide" onSelect={() => run(onNewDeck)}><Sparkles size={15} />HTML スライドを作成</Command.Item>
          <Command.Item value="テーマ ダーク ライト theme dark" onSelect={() => run(toggleTheme)}><Moon size={15} />テーマを切り替え</Command.Item>
        </Command.Group>
        <Command.Group heading="サイズから作成">
          {SIZES.map((s) => <Command.Item key={s.id} value={'size ' + s.label + ' ' + s.group} onSelect={() => run(() => createFromSize(s))}><Maximize size={15} />{s.label}<small>{s.print ? `${s.print.mmW}×${s.print.mmH}mm` : `${s.w}×${s.h}`}</small></Command.Item>)}
        </Command.Group>
        <Command.Group heading="テンプレート">
          {TEMPLATES.map((t) => <Command.Item key={t.id} value={'template ' + t.name + ' ' + t.category + ' ' + (t.tags ?? []).join(' ')} onSelect={() => run(() => createFromTemplate(t))}><LayoutGrid size={15} />{t.name}<small>{t.category}{pageCount(t) > 1 ? ` ・ ${pageCount(t)}p` : ''}</small></Command.Item>)}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}
