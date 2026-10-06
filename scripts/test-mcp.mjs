// MCP サーバー(agent/mcp.mjs)を実際に起動し、SDK のクライアントで通しで動かす確認スクリプト。
// 前提: `node agent/server.mjs --designs <dir>` が起動し、ブラウザで開いてあること。
// 使い方: IRODORI_DESIGNS=<dir> IRODORI_URL=http://127.0.0.1:4600 node scripts/test-mcp.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const transport = new StdioClientTransport({ command: process.execPath, args: [path.join(root, 'agent/mcp.mjs')], env: { ...process.env } })
const client = new Client({ name: 'irodori-test', version: '0.0.1' })
await client.connect(transport)

let failed = 0
const call = async (name, args = {}, expectError = false) => {
  const r = await client.callTool({ name, arguments: args })
  const text = r.content.map((c) => c.text).join('\n')
  const bad = !!r.isError !== expectError
  if (bad) failed++
  console.log(`${bad ? 'NG' : 'OK'} ${name}${expectError ? '(エラーを期待)' : ''}: ${text.split('\n').slice(0, 6).join(' | ').slice(0, 300)}`)
  return text
}

const tools = (await client.listTools()).tools.map((t) => t.name)
console.log('ツール数', tools.length, tools.join(','))

const created = await call('create_design', { name: 'MCPテスト', sizeId: 'ig-post', background: '#fff7ed', id: 'mcp-test-' + Date.now() })
const id = /id=(\S+)/.exec(created)[1]
await call('add_shape', { id, shape: 'roundrect', x: 60, y: 60, w: 960, h: 300, fill: '#ea580c' })
await call('add_text', { id, text: 'MCPから作成', x: 100, y: 120, width: 880, fontSize: 110, fontFamily: 'Zen Maru Gothic', weight: 900, color: '#ffffff', align: 'center' })
await call('add_text', { id, text: '縦書きの文字\n二行目です', x: 800, y: 420, vertical: true, fontSize: 56, maxChars: 8, color: '#7c2d12' })
await call('add_shape', { id, shape: 'circle', x: 120, y: 480, w: 260, h: 260, fill: '#fdba74', stroke: '#7c2d12', strokeWidth: 6 })
await call('add_shape', { id, shape: 'line', x: 120, y: 820, w: 600, h: 0.01, stroke: '#7c2d12', strokeWidth: 6 })
await call('update_object', { id, index: 1, props: { fontSize: 100 } })
await call('set_background', { id, color: '#fffbeb' })
console.log(await call('get_design', { id }))
// エラー系
await call('add_text', { id, page: 9, text: 'x' }, true)
await call('delete_object', { id, index: 99 }, true)
await call('get_design', { id: 'ない-id' }, true)
await call('add_image', { id, source: 'https://example.invalid/x.png' }, true)
// ブラウザ経由
const tpl = await call('list_templates', {})
const tid = tpl.split('\n')[0].split('\t')[0]
await call('apply_template', { id, templateId: tid, mode: 'append' })
const png = await call('export_design', { id, format: 'png', page: 1 })
const file = /書き出しました: (.+?)(?:（|\()/.exec(png)?.[1]
if (!file || !fs.existsSync(file) || fs.statSync(file).size < 1000) { failed++; console.log('NG 出力ファイルがありません', file) } else console.log('出力ファイル', file, fs.statSync(file).size, 'bytes')
await call('export_design', { id, format: 'png', page: 2 })
await client.close()
console.log(failed ? `失敗 ${failed} 件` : '全て通りました')
process.exit(failed ? 1 : 0)
