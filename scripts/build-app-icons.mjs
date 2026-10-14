// アプリアイコン(ホーム画面用)を作る: node scripts/build-app-icons.mjs
// ホームの brand-mark(円錐グラデーション + 中央の抜き)と同じ意匠を SVG で組み、sharp で PNG にする。
import sharp from 'sharp'
import { mkdirSync, writeFileSync } from 'node:fs'

const out = new URL('../public/app-icons/', import.meta.url).pathname
mkdirSync(out, { recursive: true })

// index.css の .brand-mark と同じ色(conic-gradient(from 210deg, ...))
const STOPS = ['#e8553a', '#f2b134', '#3fae6a', '#2b7de0', '#7a4fd6', '#e8553a']
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const color = (t) => {
  const x = t * (STOPS.length - 1), i = Math.min(STOPS.length - 2, Math.floor(x)), f = x - i
  const a = hex(STOPS[i]), b = hex(STOPS[i + 1])
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(',')})`
}

/** 1024 角の SVG。rounded=true なら角丸(通常アイコン)、false なら全面(maskable / iOS は OS が丸める) */
function svg(rounded) {
  const S = 1024, c = S / 2, R = S, N = 180 // 2 度ずつの扇形
  let wedges = ''
  for (let i = 0; i < N; i++) {
    const a0 = (210 + (i / N) * 360 - 90) * Math.PI / 180, a1 = (210 + ((i + 1.2) / N) * 360 - 90) * Math.PI / 180
    const p = (a) => `${(c + R * Math.cos(a)).toFixed(1)},${(c + R * Math.sin(a)).toFixed(1)}`
    wedges += `<path d="M${c},${c} L${p(a0)} L${p(a1)} Z" fill="${color(i / N)}"/>`
  }
  const hole = 0.27 * S // 一辺の 46% が白い角丸の抜き
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs><clipPath id="r"><rect width="${S}" height="${S}" rx="${rounded ? 230 : 0}"/></clipPath></defs>
  <g clip-path="url(#r)">${wedges}<rect x="${hole}" y="${hole}" width="${S - hole * 2}" height="${S - hole * 2}" rx="${S * 0.07}" fill="#ffffff"/></g>
</svg>`
}

const jobs = [
  ['icon-192.png', 192, true], ['icon-512.png', 512, true],
  ['icon-maskable-512.png', 512, false], ['apple-touch-icon.png', 180, false],
]
for (const [name, size, rounded] of jobs) {
  await sharp(Buffer.from(svg(rounded))).resize(size, size).png().toFile(out + name)
  console.log('wrote', name)
}
writeFileSync(out + 'icon.svg', svg(true))
