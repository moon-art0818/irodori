// ~/Public/slide-studio の画面を irodori に取り込む(元は変更しない)。
// slide-studio を更新したら `npm run sync-slides` で取り込み直す。
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const SRC = process.env.SLIDE_STUDIO ?? join(homedir(), 'Public/slide-studio')
const DST = 'public/slides'
const must = (s, a, b) => { if (!s.includes(a)) throw new Error(`想定した記述が見つかりません: ${a}`); return s.split(a).join(b) }

copyFileSync(join(SRC, 'public/slides.css'), join(DST, 'slides.css'))
copyFileSync(join(SRC, 'public/app.css'), join(DST, 'app.css'))

// app.js: 絶対パスで開く発表者ツール/投影用だけ相対にする(ほかは一切変えない)
let js = readFileSync(join(SRC, 'public/app.js'), 'utf8')
js = must(js, "window.open(`/?view=presenter", "window.open(`/slides/index.html?view=presenter")
js = must(js, "window.open(`/?view=audience", "window.open(`/slides/index.html?view=audience")
writeFileSync(join(DST, 'app.js'), '// slide-studio から自動で取り込んだファイル(scripts/sync-slide-studio.mjs)。直接編集しない\n' + js)

// index.html: 参照を相対にし、app.js より先に中継(bridge.js)を読む
let html = readFileSync(join(SRC, 'public/index.html'), 'utf8')
html = must(html, '<link rel="stylesheet" href="/slides.css">', '<link rel="stylesheet" href="slides.css">')
html = must(html, '<link rel="stylesheet" href="/app.css">', '<link rel="stylesheet" href="app.css">')
html = must(html, '<script src="/app.js"></script>', '<script src="bridge.js"></script>\n<script src="app.js"></script>')
writeFileSync(join(DST, 'index.html'), html)
console.log('slide-studio を取り込みました:', SRC)
