#!/usr/bin/env node
// irodori の MCP サーバー(stdio)。Claude Code / Cursor / Claude Desktop などの AI エージェントから
// デザインを作る・直す・書き出すための道具を渡す。
// - デザインのファイル(designs/*.json)は fs で直接読み書きする
// - 描画・テンプレ・サイズ一覧だけ、起動中の agent/server.mjs(ブラウザが開いていること)に HTTP で頼む
// 設定: IRODORI_DESIGNS(既定 ./designs)、IRODORI_URL(既定 http://127.0.0.1:4600)
// 注意: stdout は MCP の通信用。ログは必ず stderr に出す。
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const DIR = path.resolve(process.env.IRODORI_DESIGNS ?? path.join(process.cwd(), 'designs'))
const ASSETS = path.join(DIR, 'assets')
const URL_BASE = (process.env.IRODORI_URL ?? 'http://127.0.0.1:4600').replace(/\/+$/, '')
const ID_RE = /^[\w\-.぀-ヿ㐀-鿿]{1,120}$/ // server.mjs と同じ(日本語可・パス区切り不可)
const MAX_IMAGE = 15 * 1024 * 1024

class UserError extends Error {}
const fail = (msg) => { throw new UserError(msg) }

// ---------- ファイル操作 ----------
const fileOf = (id) => {
  if (!ID_RE.test(id) || id.includes('..')) fail(`不正な id です: ${id}(英数字・日本語・- _ . のみ、120 文字まで)`)
  return path.join(DIR, id + '.json')
}
function readDoc(id) {
  const f = fileOf(id)
  if (!fs.existsSync(f)) fail(`デザイン「${id}」が見つかりません(${DIR})。list_designs で id を確認してください。`)
  let doc
  try { doc = JSON.parse(fs.readFileSync(f, 'utf8')) } catch (e) { fail(`デザイン「${id}」の JSON が壊れています: ${e.message}`) }
  doc.pages ??= [{ id: 'p1', json: { objects: [], background: '#ffffff' } }]
  doc.pages.forEach((p, i) => { p.id ??= `p${i + 1}`; p.json ??= {}; p.json.objects ??= [] })
  return doc
}
/** 一時ファイルに書いてから rename(途中で壊れた JSON を残さない) */
function writeDoc(id, doc) {
  const f = fileOf(id)
  const text = JSON.stringify(doc, null, 2)
  JSON.parse(text) // 念のため再パースできることを確認
  const tmp = `${f}.${process.pid}.${Date.now()}.tmp`
  fs.mkdirSync(DIR, { recursive: true })
  fs.writeFileSync(tmp, text)
  fs.renameSync(tmp, f)
}
function pageOf(doc, page) {
  const n = doc.pages.length
  if (!Number.isInteger(page) || page < 1 || page > n) fail(`ページ ${page} はありません。このデザインは 1〜${n} ページです(ページ番号は 1 始まり)。`)
  return doc.pages[page - 1]
}
function objOf(pg, index) {
  const n = pg.json.objects.length
  if (!Number.isInteger(index) || index < 0 || index >= n) fail(n ? `オブジェクト番号 ${index} はありません。このページは 0〜${n - 1} です(get_design で確認)。` : 'このページにはオブジェクトがありません。')
  return pg.json.objects[index]
}
/** 読む→変更→書く */
function mutate(id, fn) {
  const doc = readDoc(id)
  const out = fn(doc)
  writeDoc(id, doc)
  return out
}

// ---------- server への HTTP ----------
async function bridge(msg) {
  let res
  try {
    res = await fetch(URL_BASE + '/local/bridge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(msg), signal: AbortSignal.timeout(90000) })
  } catch (e) {
    fail(`irodori のサーバーに接続できません(${URL_BASE})。\`node agent/server.mjs\` を起動し、ブラウザで開いてください。(${e.message})`)
  }
  let body = null
  try { body = await res.json() } catch { /* 本文なし */ }
  if (!res.ok) {
    if (res.status === 503) fail(`ブラウザで irodori が開かれていません。${URL_BASE} を開いたままにしてください。(描画・テンプレ・サイズ一覧はブラウザが行います)`)
    fail(`サーバーのエラー (${res.status}): ${body?.error ?? '不明'}`)
  }
  return body
}

// ---------- フォント(src/data/fonts.ts から読む。無ければ空) ----------
function loadFonts() {
  try {
    const src = fs.readFileSync(path.join(HERE, '..', 'src', 'data', 'fonts.ts'), 'utf8')
    return [...src.matchAll(/\{\s*family:\s*'([^']+)',\s*label:\s*'([^']+)',\s*jp:\s*(true|false),\s*weights:\s*\[([^\]]*)\]/g)]
      .map((m) => ({ family: m[1], label: m[2], jp: m[3] === 'true', weights: m[4].split(',').map((s) => Number(s.trim())).filter(Boolean) }))
  } catch { return [] }
}

// ---------- 画像 ----------
const EXT = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif', 'image/svg+xml': '.svg' }
function sniff(buf) {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) return { mime: 'image/png', w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
  if (buf.length > 10 && buf.toString('latin1', 0, 3) === 'GIF') return { mime: 'image/gif', w: buf.readUInt16LE(6), h: buf.readUInt16LE(8) }
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue }
      const mk = buf[i + 1], len = buf.readUInt16BE(i + 2)
      if (mk >= 0xc0 && mk <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(mk)) return { mime: 'image/jpeg', h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) }
      i += 2 + len
    }
    return { mime: 'image/jpeg', w: 0, h: 0 }
  }
  if (buf.length > 30 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') {
    const k = buf.toString('latin1', 12, 16)
    if (k === 'VP8X') return { mime: 'image/webp', w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) }
    if (k === 'VP8 ') return { mime: 'image/webp', w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff }
    if (k === 'VP8L') { const b = buf.readUInt32LE(21); return { mime: 'image/webp', w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 } }
    return { mime: 'image/webp', w: 0, h: 0 }
  }
  const head = buf.toString('utf8', 0, Math.min(buf.length, 2048))
  if (/<svg[\s>]/i.test(head)) {
    const w = /\bwidth="([\d.]+)(px)?"/.exec(head), h = /\bheight="([\d.]+)(px)?"/.exec(head), vb = /viewBox="[\d.\-]+[ ,]+[\d.\-]+[ ,]+([\d.]+)[ ,]+([\d.]+)"/.exec(head)
    return { mime: 'image/svg+xml', w: w ? Number(w[1]) : vb ? Number(vb[1]) : 0, h: h ? Number(h[1]) : vb ? Number(vb[2]) : 0 }
  }
  return null
}
async function loadImageSource(source) {
  let buf
  if (/^https?:\/\//i.test(source)) {
    let res
    try { res = await fetch(source, { signal: AbortSignal.timeout(30000), redirect: 'follow' }) } catch (e) { fail(`画像を取得できません: ${source}(${e.message})`) }
    if (!res.ok) fail(`画像の取得に失敗しました (${res.status}): ${source}`)
    const ct = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
    if (!ct.startsWith('image/')) fail(`画像ではありません(Content-Type: ${ct || '不明'})。画像の URL を指定してください。`)
    const len = Number(res.headers.get('content-length') ?? 0)
    if (len > MAX_IMAGE) fail(`画像が大きすぎます(${(len / 1048576).toFixed(1)}MB。上限 15MB)。`)
    const chunks = []; let n = 0
    for await (const c of res.body) { n += c.length; if (n > MAX_IMAGE) fail('画像が大きすぎます(上限 15MB)。'); chunks.push(c) }
    buf = Buffer.concat(chunks)
  } else {
    const f = path.resolve(source.replace(/^~(?=\/)/, process.env.HOME ?? '~'))
    if (!fs.existsSync(f) || !fs.statSync(f).isFile()) fail(`画像ファイルが見つかりません: ${f}`)
    if (fs.statSync(f).size > MAX_IMAGE) fail('画像が大きすぎます(上限 15MB)。')
    buf = fs.readFileSync(f)
  }
  const info = sniff(buf)
  if (!info) fail('対応していない画像形式です(PNG / JPEG / WebP / GIF / SVG)。')
  return { buf, ...info }
}

// ---------- ツール共通 ----------
const ok = (text) => ({ content: [{ type: 'text', text }] })
// 画面に「AI 接続中」と出すための合図(失敗しても無視)
let lastPing = 0
const ping = () => {
  if (Date.now() - lastPing < 30000) return
  lastPing = Date.now()
  const c = server.server.getClientVersion?.()
  fetch(URL_BASE + '/local/agent-ping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client: c ? `${c.name} ${c.version ?? ''}`.trim() : 'AI エージェント' }) }).catch(() => {})
}
const wrap = (fn) => async (args) => {
  ping()
  try { return ok(await fn(args)) } catch (e) {
    return { isError: true, content: [{ type: 'text', text: e instanceof UserError ? e.message : `想定外のエラー: ${e?.stack ?? e}` }] }
  }
}
const id_ = z.string().describe('デザインの id(list_designs の id。ファイル名)')
const page_ = z.number().int().min(1).default(1).describe('ページ番号(1 始まり)')
const num = z.number().finite()
const color = z.string().describe('CSS 色(例 #ea580c / rgba(0,0,0,.5) / transparent)')

const summarize = (o, i) => {
  const r = (v) => (typeof v === 'number' ? Math.round(v) : v)
  const sx = o.scaleX ?? 1, sy = o.scaleY ?? 1
  const w = o.type === 'Circle' ? (o.radius ?? 0) * 2 : o.type === 'Ellipse' ? (o.rx ?? 0) * 2 : o.width
  const h = o.type === 'Circle' ? (o.radius ?? 0) * 2 : o.type === 'Ellipse' ? (o.ry ?? 0) * 2 : o.height
  const parts = [`[${i}] ${o.type}`, `x=${r(o.left ?? 0)} y=${r(o.top ?? 0)}`]
  if (w != null) parts.push(`w=${r(w * sx)}`)
  if (h != null) parts.push(`h=${r(h * sy)}`)
  if (o.text != null) parts.push(`text=${JSON.stringify(String(o.text).length > 40 ? String(o.text).slice(0, 40) + '…' : o.text)}`)
  if (o.fontSize) parts.push(`size=${o.fontSize}`)
  if (o.fontFamily) parts.push(`font=${o.fontFamily}`)
  if (typeof o.fill === 'string') parts.push(`fill=${o.fill}`)
  if (o.assetId) parts.push(`asset=${o.assetId}`)
  return parts.join(' ')
}
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined))

// ---------- サーバー ----------
const server = new McpServer({ name: 'irodori', version: '0.1.0' })
const tool = (name, description, shape, fn) => server.registerTool(name, { description, inputSchema: shape }, wrap(fn))

tool('list_designs', 'デザインの一覧(id・名前・サイズ・ページ数)を返す。List all designs.', {}, async () => {
  fs.mkdirSync(DIR, { recursive: true })
  const rows = fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).filter((id) => ID_RE.test(id)).map((id) => {
    try {
      const d = readDoc(id)
      return { id, name: d.name ?? id, width: d.width ?? 1080, height: d.height ?? 1080, pages: d.pages.length, updatedAt: new Date(fs.statSync(fileOf(id)).mtimeMs).toISOString() }
    } catch (e) { return { id, error: e.message } }
  })
  return rows.length ? `フォルダ: ${DIR}\n` + JSON.stringify(rows, null, 1) : `デザインはまだありません(${DIR})。create_design で作れます。`
})

tool('get_design', 'デザインの中身を要約して返す(ページごとのオブジェクト一覧: 番号・種類・文字・位置・大きさ)。Summarize a design.', { id: id_ }, async ({ id }) => {
  const d = readDoc(id)
  const lines = [`「${d.name ?? id}」 id=${id} ${d.width ?? 1080}x${d.height ?? 1080}px ${d.pages.length}ページ(座標は左上基準・px)`]
  d.pages.forEach((p, i) => {
    lines.push(`--- ページ ${i + 1} 背景=${typeof p.json.background === 'string' ? p.json.background : '(なし)'} オブジェクト ${p.json.objects.length} 個(下の番号ほど後ろ)`)
    p.json.objects.forEach((o, j) => lines.push(summarize(o, j)))
  })
  return lines.join('\n')
})

tool('create_design', '新しいデザインを作る。sizeId(list_sizes)か width/height を指定。Create a new design.', {
  name: z.string().min(1).describe('デザイン名'),
  sizeId: z.string().optional().describe('サイズのプリセット id(list_sizes で調べる)。width/height より優先'),
  width: z.number().int().min(16).max(8000).optional(), height: z.number().int().min(16).max(8000).optional(),
  background: color.default('#ffffff').describe('背景色'),
  id: z.string().optional().describe('任意の id。省略すると名前から作る'),
}, async ({ name, sizeId, width, height, background, id }) => {
  let w = width ?? 1080, h = height ?? 1080, print
  if (sizeId) {
    const sizes = await bridge({ action: 'sizes' })
    const s = sizes.find((x) => x.id === sizeId)
    if (!s) fail(`サイズ「${sizeId}」はありません。list_sizes で id を確認してください。`)
    w = s.width; h = s.height
    if (s.print) print = { mmW: s.print.mmW, mmH: s.print.mmH }
  }
  let base = id ?? (name.replace(/[^\w\-.぀-ヿ㐀-鿿]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'design')
  if (!ID_RE.test(base)) fail(`不正な id です: ${base}`)
  let final = base
  if (id) { if (fs.existsSync(fileOf(id))) fail(`id「${id}」は既にあります。別の id にするか省略してください。`) } else {
    for (let n = 2; fs.existsSync(fileOf(final)); n++) final = `${base}-${n}`
  }
  const doc = { id: final, name, width: w, height: h, ...(print ? { print } : {}), pages: [{ id: 'p1', json: { version: '7.0.0', objects: [], background } }], createdAt: Date.now() }
  writeDoc(final, doc)
  return `作成しました: id=${final} ${w}x${h}px 背景=${background}\nファイル: ${fileOf(final)}`
})

tool('list_sizes', 'サイズのプリセット一覧(SNS・印刷など)。irodori をブラウザで開いている必要あり。List size presets.', {}, async () => {
  const s = await bridge({ action: 'sizes' })
  return s.map((x) => `${x.id}\t${x.group}\t${x.label}\t${x.width}x${x.height}${x.print ? ` (${x.print.mmW}x${x.print.mmH}mm)` : ''}`).join('\n')
})

tool('list_templates', 'テンプレの一覧(id・名前・分類・サイズ)。query は名前か分類の部分一致。ブラウザが必要。List templates.', {
  query: z.string().optional().describe('絞り込み語(任意)'),
}, async ({ query }) => {
  const t = await bridge({ action: 'templates', query: query ?? '' })
  return t.length ? t.map((x) => `${x.id}\t${x.category}\t${x.name}\t${x.width}x${x.height}`).join('\n') : '該当するテンプレはありません。'
})

tool('apply_template', 'テンプレをデザインに適用する。mode=replace は指定ページを置き換え、append はページを追加。ブラウザが必要。Apply a template.', {
  id: id_, templateId: z.string().describe('list_templates の id'),
  mode: z.enum(['replace', 'append']).default('append'), page: page_,
}, async ({ id, templateId, mode, page }) => {
  const doc = readDoc(id)
  if (mode === 'replace') pageOf(doc, page)
  const r = await bridge({ action: 'template', id, templateId, mode, page })
  return `適用しました(${mode})。現在 ${r?.pages ?? '?'} ページ。`
})

tool('add_text', '文字を追加する。vertical=true で縦書き。座標は左上基準・px。Add a text box (vertical writing optional).', {
  id: id_, page: page_, text: z.string().min(1),
  x: num.default(0), y: num.default(0),
  width: num.positive().optional().describe('横書きの幅(px)。省略時 600。縦書きでは使わない'),
  fontSize: num.positive().default(48), fontFamily: z.string().default('Noto Sans JP').describe('list_fonts のフォント名'),
  color: color.default('#1f2937'), align: z.enum(['left', 'center', 'right']).default('left'),
  weight: z.number().int().min(100).max(900).default(400).describe('太さ(400 標準 / 700 太字 / 900 極太)'),
  vertical: z.boolean().optional().describe('true で縦書き(VText)'),
  maxChars: z.number().int().min(1).optional().describe('縦書きの 1 列の文字数(省略時 12)'),
  lineHeight: num.positive().optional(),
}, async (a) => mutate(a.id, (doc) => {
  const pg = pageOf(doc, a.page)
  const o = a.vertical
    ? clean({ type: 'VText', text: a.text, fontFamily: a.fontFamily === 'Noto Sans JP' ? 'Noto Serif JP' : a.fontFamily, fontSize: a.fontSize, fontWeight: a.weight, maxChars: a.maxChars ?? 12, lineHeight: a.lineHeight ?? 1.6, charSpacing: 0.05, fill: a.color, left: a.x, top: a.y })
    : clean({ type: 'Textbox', text: a.text, left: a.x, top: a.y, width: a.width ?? 600, fontSize: a.fontSize, fontFamily: a.fontFamily, fontWeight: a.weight, fill: a.color, textAlign: a.align, lineHeight: a.lineHeight })
  pg.json.objects.push(o)
  const fonts = loadFonts()
  const warn = fonts.length && !fonts.some((f) => f.family === o.fontFamily) ? `\n注意: フォント「${o.fontFamily}」は一覧にありません(list_fonts)。画面では別のフォントで表示される可能性があります。` : ''
  return `追加しました: [${pg.json.objects.length - 1}] ${o.type}${warn}`
}))

tool('add_shape', '図形を追加(rect 四角 / roundrect 角丸 / circle 円 / ellipse 楕円 / line 線)。x,y は左上、w,h は大きさ(px)。Add a shape.', {
  id: id_, page: page_, shape: z.enum(['rect', 'roundrect', 'circle', 'ellipse', 'line']),
  x: num.default(0), y: num.default(0), w: num.positive().default(200), h: num.positive().default(200),
  fill: color.optional().describe('塗り(省略時: line 以外は #cbd5e1、line は塗りなし)'),
  stroke: color.optional().describe('枠線の色'), strokeWidth: num.min(0).optional(),
  cornerRadius: num.min(0).optional().describe('roundrect の角丸(px)。省略時は短辺の 15%'),
}, async (a) => mutate(a.id, (doc) => {
  const pg = pageOf(doc, a.page)
  const st = a.shape === 'line' ? { stroke: a.stroke ?? a.fill ?? '#1f2937', strokeWidth: a.strokeWidth ?? 4 } : clean({ stroke: a.stroke, strokeWidth: a.stroke ? (a.strokeWidth ?? 2) : a.strokeWidth })
  const fill = a.shape === 'line' ? undefined : (a.fill ?? '#cbd5e1')
  let o
  switch (a.shape) {
    case 'rect': o = { type: 'Rect', left: a.x, top: a.y, width: a.w, height: a.h, fill, ...st }; break
    case 'roundrect': { const r = a.cornerRadius ?? Math.min(a.w, a.h) * 0.15; o = { type: 'Rect', left: a.x, top: a.y, width: a.w, height: a.h, rx: r, ry: r, fill, ...st }; break }
    case 'circle': o = { type: 'Circle', left: a.x, top: a.y, radius: Math.min(a.w, a.h) / 2, fill, ...st }; break
    case 'ellipse': o = { type: 'Ellipse', left: a.x, top: a.y, rx: a.w / 2, ry: a.h / 2, fill, ...st }; break
    case 'line': o = { type: 'Line', x1: 0, y1: 0, x2: a.w, y2: a.h, left: a.x, top: a.y, width: a.w, height: a.h, fill: null, ...st }; break
  }
  pg.json.objects.push(clean(o))
  return `追加しました: [${pg.json.objects.length - 1}] ${o.type}`
}))

tool('add_image', '画像を追加する。source はローカルのパスか https の URL(URL は取得して assets に保存。最大 15MB・画像のみ)。画像の生成はできません。Add an image from a path or URL.', {
  id: id_, page: page_, source: z.string().min(1).describe('ローカルパス(~ 可)か http(s) URL'),
  x: num.default(0), y: num.default(0), width: num.positive().optional().describe('表示幅(px)。省略時は原寸(最大でもデザイン幅まで縮小)'),
}, async (a) => {
  const doc0 = readDoc(a.id); pageOf(doc0, a.page)
  const img = await loadImageSource(a.source)
  fs.mkdirSync(ASSETS, { recursive: true })
  const name = crypto.randomUUID() + EXT[img.mime]
  const tmp = path.join(ASSETS, name + '.tmp')
  fs.writeFileSync(tmp, img.buf); fs.renameSync(tmp, path.join(ASSETS, name))
  return mutate(a.id, (doc) => {
    const pg = pageOf(doc, a.page)
    const nat = img.w || 0
    const want = a.width ?? (nat ? Math.min(nat, doc.width ?? 1080) : 400)
    const o = nat && img.h
      ? { type: 'Image', assetId: name, left: a.x, top: a.y, width: img.w, height: img.h, scaleX: want / nat, scaleY: want / nat }
      : { type: 'Image', assetId: name, left: a.x, top: a.y, scaleX: 1, scaleY: 1 }
    pg.json.objects.push(o)
    return `追加しました: [${pg.json.objects.length - 1}] Image(asset=${name}, 元 ${img.w}x${img.h}, 表示幅 ${Math.round(want)}px)${nat ? '' : '\n注意: 画像サイズを読み取れませんでした。update_object で scaleX/scaleY を調整してください。'}`
  })
})

tool('update_object', 'オブジェクトの一部のプロパティを更新する(props を上書きマージ)。type は変更不可。Patch an object by index.', {
  id: id_, page: page_, index: z.number().int().min(0).describe('オブジェクト番号(get_design)'),
  props: z.record(z.string(), z.any()).describe('例 {"left":100,"fill":"#fff","text":"新しい文"}。null で項目を削除'),
}, async ({ id, page, index, props }) => mutate(id, (doc) => {
  const o = objOf(pageOf(doc, page), index)
  if ('type' in props && props.type !== o.type) fail('type は変更できません。delete_object して追加し直してください。')
  for (const [k, v] of Object.entries(props)) { if (v === null) delete o[k]; else o[k] = v }
  return `更新しました: ${summarize(o, index)}`
}))

tool('delete_object', 'オブジェクトを削除する(番号が詰まるので、続けて消すときは後ろから)。Delete an object by index.', {
  id: id_, page: page_, index: z.number().int().min(0),
}, async ({ id, page, index }) => mutate(id, (doc) => {
  const pg = pageOf(doc, page)
  const o = objOf(pg, index)
  pg.json.objects.splice(index, 1)
  return `削除しました: ${o.type}。残り ${pg.json.objects.length} 個(番号が詰まりました)。`
}))

tool('set_background', 'ページの背景色を変える。Set a page background color.', { id: id_, page: page_, color }, async ({ id, page, color: c }) => mutate(id, (doc) => {
  pageOf(doc, page).json.background = c
  return `ページ ${page} の背景を ${c} にしました。`
}))

tool('add_page', 'ページを末尾に追加する(空白)。Append a blank page.', { id: id_, background: color.default('#ffffff') }, async ({ id, background }) => mutate(id, (doc) => {
  let n = doc.pages.length + 1
  while (doc.pages.some((p) => p.id === `p${n}`)) n++
  doc.pages.push({ id: `p${n}`, json: { version: '7.0.0', objects: [], background } })
  return `ページを追加しました。現在 ${doc.pages.length} ページ(新しいページは ${doc.pages.length} 番)。`
}))

tool('export_design', 'PNG / JPEG / SVG / PDF に書き出し、ファイルのパスを返す。ブラウザで irodori を開いている必要あり。Export to a file.', {
  id: id_, format: z.enum(['png', 'jpeg', 'svg', 'pdf']).default('png'), page: page_,
  scale: z.number().min(0.1).max(3).default(1).describe('倍率(png/jpeg のみ)。PDF は全ページ'),
}, async ({ id, format, page, scale }) => {
  const doc = readDoc(id)
  pageOf(doc, page)
  const r = await bridge({ action: 'render', id, format, page, scale })
  if (!r?.file) fail('書き出しに失敗しました(ファイルが返りませんでした)。')
  return `書き出しました: ${r.file}(${fs.existsSync(r.file) ? fs.statSync(r.file).size + ' バイト' : 'ファイルを確認できません'})`
})

tool('list_fonts', '使えるフォントの一覧(これ以外は画面で正しく出ない)。List available fonts.', {}, async () => {
  const f = loadFonts()
  if (!f.length) fail('フォント一覧を読めませんでした(src/data/fonts.ts が見つかりません)。AGENTS.md の一覧を参照してください。')
  return f.map((x) => `${x.family}\t${x.label}\t${x.jp ? '日本語可' : '欧文のみ'}\t太さ ${x.weights.join('/')}`).join('\n')
})

// ---------- 人からの依頼(画面の「AI に依頼」)----------
async function api(method, p, body) {
  let res
  try { res = await fetch(URL_BASE + p, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) }) }
  catch (e) { fail(`irodori のサーバーに接続できません(${URL_BASE})。(${e.message})`) }
  const j = await res.json().catch(() => ({}))
  if (!res.ok) fail(j.error ?? `エラー(${res.status})`)
  return j
}
const STATUS_JA = { queued: '待機中', working: '作業中', review: '確認待ち', done: '完了', redo: 'やり直し', cancelled: '取り消し' }

tool('get_requests', '人が irodori の画面で書いた「AI への依頼」を取得する。既定は未処理(待機中・やり直し)のみ。最初に必ず呼ぶ。Get pending requests from the human.', {
  status: z.enum(['pending', 'all']).default('pending'),
}, async ({ status }) => {
  const { requests } = await api('GET', '/local/requests')
  const list = requests.filter((r) => status === 'all' || r.status === 'queued' || r.status === 'redo')
  if (!list.length) return '未処理の依頼はありません。'
  return list.map((r) => [`id=${r.id} [${STATUS_JA[r.status] ?? r.status}] ${r.designId ? `デザイン=${r.designId}${r.page ? ` ${r.page}ページ` : ''}` : '(新規)'}`, `依頼: ${r.text}`, r.status === 'redo' && r.note ? `やり直しの指示: ${r.note}` : ''].filter(Boolean).join('\n')).join('\n---\n')
})

tool('update_request', '依頼の状態を更新する。着手時は working、仕上げて人に見てほしいときは review(note に「何をしたか・人に確認してほしい事実(価格・日付・社名など)」を書く)。人の確認なしに done にしないこと。Update a request status.', {
  id: z.string(), status: z.enum(['working', 'review', 'cancelled']), note: z.string().max(4000).default(''),
  designId: z.string().optional().describe('作ったデザインの id(review のとき推奨)'),
}, async ({ id, status, note, designId }) => {
  const { request } = await api('PATCH', `/local/requests/${encodeURIComponent(id)}`, { status, note, by: 'agent', preview: designId })
  return `依頼 ${request.id} を「${STATUS_JA[request.status]}」にしました。`
})

tool('check_design', 'デザインの品質を自動点検する(文字のはみ出し・ページ外・コントラスト不足・小さすぎる文字・余白・画像の解像度・フォント数)。review にする前に必ず実行し、指摘を直すこと。ブラウザで irodori を開いている必要あり。Lint the design.', {
  id: id_,
}, async ({ id }) => {
  readDoc(id)
  const r = await bridge({ action: 'check', id })
  const issues = r?.issues ?? []
  if (!issues.length) return '問題は見つかりませんでした。'
  return issues.map((x) => `[${x.severity}] ${x.page}ページ #${x.index ?? '-'}: ${x.message}`).join('\n')
})

await server.connect(new StdioServerTransport())
console.error(`irodori MCP: designs=${DIR} url=${URL_BASE}`)
