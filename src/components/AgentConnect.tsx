// AI エージェント連携: ワンクリック登録・接続状態・人と AI の分担・依頼の一覧
import { Check, Copy, ExternalLink, Terminal, MessageSquarePlus, CircleCheck, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { agentInfo, agentStatus, isLocal, onLocalEvent, listRequests, addRequest, updateRequest, REQUEST_LABEL, type AgentInfo, type AgentRequest } from '../api/local'

const b64 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s)))
function copy(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => toast.success(`${label}をコピーしました`), () => toast.error('コピーできませんでした。手動で選択してください'))
}

interface Client { id: string; name: string; how: 'link' | 'command' | 'json'; note: string; value: (i: AgentInfo) => string; target?: string }
const cfg = (i: AgentInfo) => ({ command: i.node, args: [i.mcpPath], env: { IRODORI_DESIGNS: i.designs, IRODORI_URL: i.url } })
const CLIENTS: Client[] = [
  { id: 'claude-code', name: 'Claude Code', how: 'command', note: 'ターミナルに貼り付けて実行(全プロジェクトで使える user スコープ)',
    value: (i) => `claude mcp add --transport stdio --scope user --env IRODORI_DESIGNS=${JSON.stringify(i.designs)} --env IRODORI_URL=${i.url} irodori -- ${JSON.stringify(i.node)} ${JSON.stringify(i.mcpPath)}` },
  { id: 'cursor', name: 'Cursor', how: 'link', note: 'Cursor が開き、追加の確認が出ます',
    value: (i) => `cursor://anysphere.cursor-deeplink/mcp/install?name=irodori&config=${encodeURIComponent(b64(JSON.stringify(cfg(i))))}` },
  { id: 'vscode', name: 'VS Code(Copilot)', how: 'link', note: 'VS Code が開き、追加の確認が出ます',
    value: (i) => `vscode:mcp/install?${encodeURIComponent(JSON.stringify({ name: 'irodori', ...cfg(i) }))}` },
  { id: 'claude-desktop', name: 'Claude Desktop', how: 'json', note: '設定ファイルの mcpServers に追記して、Claude Desktop を再起動',
    target: '~/Library/Application Support/Claude/claude_desktop_config.json(Windows は %APPDATA%\\Claude\\claude_desktop_config.json)',
    value: (i) => JSON.stringify({ mcpServers: { irodori: cfg(i) } }, null, 2) },
  { id: 'codex', name: 'Codex CLI', how: 'command', note: 'ターミナルに貼り付けて実行',
    value: (i) => `codex mcp add irodori --env IRODORI_DESIGNS=${JSON.stringify(i.designs)} --env IRODORI_URL=${i.url} -- ${JSON.stringify(i.node)} ${JSON.stringify(i.mcpPath)}` },
  { id: 'gemini', name: 'Gemini CLI', how: 'command', note: 'ターミナルに貼り付けて実行',
    value: (i) => `gemini mcp add -s user -e IRODORI_DESIGNS=${JSON.stringify(i.designs)} -e IRODORI_URL=${i.url} irodori ${JSON.stringify(i.node)} ${JSON.stringify(i.mcpPath)}` },
  { id: 'other', name: 'その他(Windsurf・Cline・Zed など)', how: 'json', note: '各アプリの MCP 設定に貼り付け(Zed は context_servers)',
    value: (i) => JSON.stringify({ mcpServers: { irodori: cfg(i) } }, null, 2) },
]

const LOOP_PROMPT = 'irodori の依頼を処理して。get_requests で未処理の依頼を取り、1件ずつ update_request で working にしてから作業し、check_design の指摘をすべて直し、export_design で確認用の画像を書き出してから、update_request で review にする(note に「やったこと」と「人に確認してほしい事実」を書く)。依頼が無ければ待つ。'

export function AgentConnect() {
  const local = isLocal()
  const [info, setInfo] = useState<AgentInfo | null>(null)
  const [st, setSt] = useState<{ connected: boolean; client: string } | null>(null)
  useEffect(() => {
    if (!local) return
    agentInfo().then(setInfo).catch(() => {})
    const poll = () => agentStatus().then(setSt).catch(() => {})
    poll()
    const t = setInterval(poll, 10000)
    const off = onLocalEvent((m) => { if (m.type === 'agent') poll() })
    return () => { clearInterval(t); off() }
  }, [local])

  return (
    <>
      <div className="page-head"><div><h1>AI エージェント連携</h1><p>Claude Code・Cursor などの AI に irodori を道具として渡し、デザインの作成・修正・書き出しを任せます。AI の利用料は各自のサブスクの範囲です。</p></div>
        {local && <div className="store-pill"><span className={'dot' + (st?.connected ? ' ok' : '')} />{st?.connected ? `接続中: ${st.client}` : 'まだ接続されていません'}</div>}</div>

      {!local ? <NotLocal /> : !info ? <p className="hint">読み込み中…</p> : (
        <>
          <div className="section-head"><h2>1. 使っている AI を選んで登録</h2></div>
          <div className="client-grid">{CLIENTS.map((c) => <ClientCard key={c.id} c={c} info={info} />)}</div>
          <p className="hint">登録後、AI に「irodori で〇〇を作って」と頼めます。このページを開いたままにしてください(書き出し・テンプレ適用は画面が行います)。詳しい仕様は <code>AGENTS.md</code>。</p>

          <div className="section">
            <div className="section-head"><h2>2. 人と AI の分担</h2></div>
            <div className="flow">
              <FlowStep who="人" title="依頼を一言書く" body="目的・対象・使う素材(ロゴや写真)だけ。下の「AI に依頼」か、エディタ上部のボタンから。" />
              <FlowStep who="AI" title="作成・修正" body="テンプレ選び、文章、配置、サイズ展開。品質の自動点検(はみ出し・コントラスト・余白)で引っかかった所は AI が直す。" />
              <FlowStep who="AI" title="確認用の画像を出して「確認待ち」に" body="何をしたか、人に確かめてほしい事実(価格・日付・社名など)を添える。" />
              <FlowStep who="人" title="採用 か やり直し(一言)" body="ここだけが人の判断。採用で完了、やり直しは理由を一言書くと AI が再開。" />
            </div>
            <div className="loop-box">
              <div><b>任せきりにする(推奨)</b><p className="hint">Claude Code で次のように頼むと、依頼が来るたびに AI が自動で処理します。人は「依頼」と「採用」だけ。</p></div>
              <code className="code">/loop 5m {LOOP_PROMPT}</code>
              <button className="secondary-btn" onClick={() => copy('/loop 5m ' + LOOP_PROMPT, '指示文')}><Copy size={14} />コピー</button>
            </div>
          </div>

          <div className="section"><RequestBoard /></div>
        </>
      )}
    </>
  )
}

function ClientCard({ c, info }: { c: Client; info: AgentInfo }) {
  const v = c.value(info)
  const [done, setDone] = useState(false)
  const act = () => {
    if (c.how === 'link') { location.href = v; setDone(true); return }
    copy(v, c.how === 'command' ? 'コマンド' : '設定'); setDone(true)
  }
  return (
    <div className="client-card">
      <div className="client-head"><b>{c.name}</b>{done && <span className="ok-tag"><Check size={12} />{c.how === 'link' ? '開きました' : 'コピー済み'}</span>}</div>
      <p className="hint">{c.note}</p>
      {c.target && <p className="hint">貼り付け先: <code>{c.target}</code></p>}
      {c.how !== 'link' && <pre className="code small">{v}</pre>}
      <button className={c.how === 'link' ? 'primary-btn' : 'secondary-btn'} onClick={act}>
        {c.how === 'link' ? <><ExternalLink size={14} />{c.name} に追加</> : c.how === 'command' ? <><Terminal size={14} />コマンドをコピー</> : <><Copy size={14} />設定をコピー</>}
      </button>
    </div>
  )
}

function FlowStep({ who, title, body }: { who: '人' | 'AI'; title: string; body: string }) {
  return <div className={'flow-step ' + (who === '人' ? 'human' : 'ai')}><span className="who">{who}</span><b>{title}</b><p>{body}</p></div>
}

/** 依頼の一覧(人が書いて、AI が処理し、人が採用/やり直し) */
export function RequestBoard({ designId, page, compact }: { designId?: string; page?: number; compact?: boolean }) {
  const [list, setList] = useState<AgentRequest[]>([])
  const [text, setText] = useState('')
  const load = () => listRequests().then((l) => setList(l.filter((r) => !designId || r.designId === designId).sort((a, b) => b.updatedAt - a.updatedAt))).catch(() => {})
  useEffect(() => { load(); return onLocalEvent((m) => { if (m.type === 'requests') load() }) }, [designId])
  const submit = async () => {
    if (!text.trim()) return
    await addRequest(text.trim(), designId, page)
    setText(''); toast.success('AI への依頼を追加しました'); load()
  }
  const redo = async (r: AgentRequest) => { const note = prompt('どこを直してほしいか、一言で'); if (note === null) return; await updateRequest(r.id, 'redo', note); load() }
  return (
    <div className="request-board">
      {!compact && <div className="section-head"><h2>3. AI への依頼</h2><span className="hint">{list.filter((r) => r.status === 'review').length} 件が確認待ち</span></div>}
      <div className="req-input">
        <textarea className="field" rows={compact ? 3 : 2} placeholder={designId ? '例: 見出しをもっと大きく、価格を 1,980円 に' : '例: 来週のセール告知を Instagram カルーセル 10 枚で。ロゴは designs/assets/logo.png'} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit() }} />
        <button className="primary-btn" onClick={submit} disabled={!text.trim()}><MessageSquarePlus size={15} />AI に依頼</button>
      </div>
      <div className="req-list">
        {list.length === 0 && <div className="empty-state">依頼はまだありません。</div>}
        {list.map((r) => (
          <div key={r.id} className={'req ' + r.status}>
            <span className={'req-status ' + r.status}>{REQUEST_LABEL[r.status]}</span>
            <div className="req-body">
              <p>{r.text}</p>
              {r.note && <p className="hint">{r.status === 'redo' ? 'やり直しの指示: ' : 'AI のメモ: '}{r.note}</p>}
              <small className="hint">{new Date(r.updatedAt).toLocaleString('ja-JP')}{(r.preview || r.designId) && <> ・ <a className="link-btn" href={'#/d/' + (r.preview || r.designId)}>デザインを開く</a></>}</small>
            </div>
            {r.status === 'review' && <div className="req-actions">
              <button className="primary-btn" onClick={async () => { await updateRequest(r.id, 'done'); toast.success('採用しました'); load() }}><CircleCheck size={14} />採用</button>
              <button className="secondary-btn" onClick={() => redo(r)}><RotateCcw size={14} />やり直し</button>
            </div>}
            {(r.status === 'queued' || r.status === 'redo') && <button className="icon-btn" onClick={async () => { await updateRequest(r.id, 'cancelled'); load() }}>取り消し</button>}
          </div>
        ))}
      </div>
    </div>
  )
}

function NotLocal() {
  const cmds = 'git clone https://github.com/moon-art0818/irodori.git\ncd irodori\nnpm install\nnpm run agent'
  return (
    <div className="client-card" style={{ maxWidth: 720 }}>
      <b>AI 連携は、自分の PC で動かしたときに使えます</b>
      <p className="hint">このページは公開デモ(またはブラウザ単体)で動いています。AI エージェントは手元の PC のファイルを扱うため、次の手順で起動した irodori(http://127.0.0.1:4600)からこのページを開くと、ワンクリックで登録できます。</p>
      <pre className="code small">{cmds}</pre>
      <button className="secondary-btn" onClick={() => copy(cmds, 'コマンド')}><Copy size={14} />コマンドをコピー</button>
    </div>
  )
}
