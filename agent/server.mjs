#!/usr/bin/env node
// irodori のローカルサーバー(AI エージェント連携用)。依存なし(Node 18+)。
// - ビルド済みの画面(dist/)を配る
// - designs/ フォルダの JSON を「デザイン」として読み書きする(AI が直接編集してよい)
// - フォルダの変更をブラウザへ即通知する(SSE)
// - MCP サーバーなどからの「描画して」依頼を、開いているブラウザに中継する
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const argv = process.argv.slice(2)
const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined }
const DIR = path.resolve(arg('--designs') ?? process.env.IRODORI_DESIGNS ?? path.join(process.cwd(), 'designs'))
const ASSETS = path.join(DIR, 'assets')
const EXPORTS = path.join(DIR, 'exports')
const PORT = Number(arg('--port') ?? process.env.PORT ?? 4600)
const HOST = process.env.HOST ?? '127.0.0.1'
for (const d of [DIR, ASSETS, EXPORTS]) fs.mkdirSync(d, { recursive: true })

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.webm': 'video/webm' }
const ID_RE = /^[\w\-.぀-ヿ㐀-鿿]{1,120}$/ // ファイル名に使える id(日本語可・パス区切り不可)

const json = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)) }
const readBody = (req, limit = 50 * 1024 * 1024) => new Promise((resolve, reject) => {
  const chunks = []; let n = 0
  req.on('data', (c) => { n += c.length; if (n > limit) { reject(Object.assign(new Error('大きすぎます'), { status: 413 })); req.destroy() } else chunks.push(c) })
  req.on('end', () => resolve(Buffer.concat(chunks))); req.on('error', reject)
})
const fileOf = (id) => { if (!ID_RE.test(id) || id.includes('..')) throw Object.assign(new Error('不正な id です'), { status: 400 }); return path.join(DIR, id + '.json') }

/** ファイルを読み、id はファイル名に揃える(AI が id を書き忘れても動くように) */
function readDesign(id) {
  const doc = JSON.parse(fs.readFileSync(fileOf(id), 'utf8'))
  const st = fs.statSync(fileOf(id))
  doc.id = id
  doc.name ??= id
  doc.width ??= 1080; doc.height ??= 1080
  doc.pages ??= [{ id: 'p1', json: { objects: [], background: '#ffffff' } }]
  doc.pages.forEach((p, i) => { p.id ??= `p${i + 1}`; p.json ??= { objects: [] } })
  doc.createdAt ??= Math.round(st.birthtimeMs)
  doc.updatedAt = Math.round(st.mtimeMs) // 版はファイルの更新時刻(AI がファイルを書き換えても検知できる)
  return doc
}
function listDesigns() {
  return fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).filter((id) => ID_RE.test(id)).flatMap((id) => {
    try {
      const d = readDesign(id)
      return [{ id, name: d.name, width: d.width, height: d.height, pageCount: d.pages.length, updatedAt: d.updatedAt, createdAt: d.createdAt, thumb: d.thumb ?? null, deck: !!d.deck }]
    } catch { return [{ id, name: `${id}(読み込めません: JSON を確認してください)`, width: 1, height: 1, pageCount: 0, updatedAt: 0, createdAt: 0, thumb: null, broken: true }] }
  }).sort((a, b) => b.updatedAt - a.updatedAt)
}

// ---- 変更の通知(SSE) ----
const clients = new Set()
const send = (msg) => { const s = `data: ${JSON.stringify(msg)}\n\n`; for (const c of clients) c.write(s) }
let selfWrites = new Map() // 自分(画面)が書いた直後の変更通知は送らない
const timers = new Map()
fs.watch(DIR, (ev, file) => {
  if (!file || !file.endsWith('.json')) return
  const id = file.slice(0, -5)
  clearTimeout(timers.get(id))
  timers.set(id, setTimeout(() => {
    let mtime = 0
    try { mtime = Math.round(fs.statSync(path.join(DIR, file)).mtimeMs) } catch { send({ type: 'removed', id }); return }
    if (selfWrites.get(id) === mtime) return
    send({ type: 'changed', id, updatedAt: mtime })
  }, 150))
})

// ---- 描画の中継(MCP → ブラウザ → MCP) ----
const pending = new Map()
function askBrowser(msg, timeoutMs = 60000) {
  if (!clients.size) return Promise.reject(Object.assign(new Error('irodori をブラウザで開いてください(描画はブラウザで行います): http://' + HOST + ':' + PORT), { status: 503 }))
  const reqId = crypto.randomUUID()
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => { pending.delete(reqId); reject(Object.assign(new Error('ブラウザからの応答がありません(タブを開いたままにしてください)'), { status: 504 })) }, timeoutMs)
    pending.set(reqId, { resolve: (v) => { clearTimeout(t); resolve(v) }, reject: (e) => { clearTimeout(t); reject(e) } })
    send({ ...msg, type: 'bridge', reqId })
  })
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x')
  const p = decodeURIComponent(url.pathname)
  try {
    // 他サイトからの操作を防ぐ(ブラウザからの変更系は同じオリジンのみ)
    const origin = req.headers.origin
    if (req.method !== 'GET' && origin && new URL(origin).host !== req.headers.host) return json(res, 403, { error: '別のサイトからの操作は受け付けません' })

    if (p === '/local/ping') return json(res, 200, { ok: true, dir: DIR, version: 1 })
    if (p === '/local/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' })
      res.write('retry: 2000\n\n'); clients.add(res); req.on('close', () => clients.delete(res)); return
    }
    if (p === '/local/designs' && req.method === 'GET') return json(res, 200, { docs: listDesigns() })
    let m = p.match(/^\/local\/designs\/([^/]+)$/)
    if (m) {
      const id = m[1]
      if (req.method === 'GET') { if (!fs.existsSync(fileOf(id))) return json(res, 404, { error: '見つかりません' }); return json(res, 200, { doc: readDesign(id) }) }
      if (req.method === 'PUT') {
        const { doc, baseUpdatedAt } = JSON.parse((await readBody(req)).toString('utf8'))
        const exists = fs.existsSync(fileOf(id))
        if (exists && baseUpdatedAt != null && Math.round(fs.statSync(fileOf(id)).mtimeMs) !== baseUpdatedAt) return json(res, 409, { error: 'conflict' })
        if (!exists && baseUpdatedAt != null) return json(res, 404, { error: '削除されています' })
        const { updatedAt: _u, ...save } = doc
        save.id = id
        const tmp = fileOf(id) + '.tmp'
        fs.writeFileSync(tmp, JSON.stringify(save, null, 2)); fs.renameSync(tmp, fileOf(id)) // 途中で壊れないよう置き換え
        const mtime = Math.round(fs.statSync(fileOf(id)).mtimeMs)
        selfWrites.set(id, mtime)
        return json(res, 200, { updatedAt: mtime })
      }
      if (req.method === 'DELETE') { fs.rmSync(fileOf(id), { force: true }); return json(res, 200, { ok: true }) }
    }
    if (p === '/local/assets' && req.method === 'POST') {
      const buf = await readBody(req, 30 * 1024 * 1024)
      const ext = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif', 'image/svg+xml': '.svg' }[req.headers['content-type']] ?? '.bin'
      const id = crypto.randomUUID() + ext
      fs.writeFileSync(path.join(ASSETS, id), buf)
      return json(res, 200, { id })
    }
    m = p.match(/^\/local\/assets\/([^/]+)$/)
    if (m && req.method === 'GET') {
      const f = path.join(ASSETS, m[1])
      if (!f.startsWith(ASSETS + path.sep) || !fs.existsSync(f)) return json(res, 404, { error: '見つかりません' })
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] ?? 'application/octet-stream', 'Cache-Control': 'no-store' })
      return fs.createReadStream(f).pipe(res)
    }
    // MCP などから: ブラウザに処理を頼む(render: 画像書き出し / template: テンプレ適用 / templates: 一覧)
    if (p === '/local/bridge' && req.method === 'POST') {
      const msg = JSON.parse((await readBody(req)).toString('utf8'))
      const result = await askBrowser(msg)
      if (result?.dataURL) {
        const ext = result.dataURL.startsWith('data:image/png') ? 'png' : result.dataURL.startsWith('data:image/jpeg') ? 'jpg' : result.dataURL.startsWith('data:application/pdf') ? 'pdf' : 'svg'
        const file = path.join(EXPORTS, `${msg.id ?? 'export'}-${Date.now()}.${ext}`)
        const b64 = result.dataURL.split(',')[1]
        fs.writeFileSync(file, result.dataURL.startsWith('data:image/svg') && !result.dataURL.includes(';base64') ? decodeURIComponent(b64) : Buffer.from(b64, 'base64'))
        return json(res, 200, { file })
      }
      return json(res, 200, result ?? { ok: true })
    }
    if (p === '/local/bridge-result' && req.method === 'POST') {
      const { reqId, result, error } = JSON.parse((await readBody(req)).toString('utf8'))
      const w = pending.get(reqId); pending.delete(reqId)
      if (w) error ? w.reject(Object.assign(new Error(error), { status: 500 })) : w.resolve(result)
      return json(res, 200, { ok: true })
    }
    if (p.startsWith('/api/')) return json(res, 404, { error: 'ローカル版ではこの機能はありません' })

    // 画面(dist/)。見つからなければ index.html(画面内の移動用)
    if (!fs.existsSync(DIST)) return json(res, 500, { error: '先に npm run build を実行してください' })
    let file = path.normalize(path.join(DIST, p === '/' ? 'index.html' : p))
    if (!file.startsWith(DIST)) return json(res, 403, { error: 'forbidden' })
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html')
    if (!fs.existsSync(file)) file = path.join(DIST, 'index.html')
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream', 'Cache-Control': 'no-store' })
    fs.createReadStream(file).pipe(res)
  } catch (e) {
    if (!res.headersSent) json(res, e.status ?? 500, { error: String(e.message ?? e) })
  }
})
server.listen(PORT, HOST, () => {
  console.log(`irodori(ローカル版): http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`)
  console.log(`デザインのフォルダ: ${DIR}`)
  console.log('AI エージェントはこのフォルダの .json を読み書きできます(形式は AGENTS.md)。ブラウザに即反映されます。')
})
