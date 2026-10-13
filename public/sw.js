// オフライン対応: 一度読み込んだ画面・スクリプト・素材を手元に保存する。
// サーバーとのやり取り(/api/・/local/)は保存しない(常に最新を使う)。
const CACHE = 'irodori-v1'
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k)
  await self.clients.claim()
})()))
self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== location.origin) return
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/local/')) return
  if (req.mode === 'navigate') {
    // 画面: まずネット、だめなら保存分
    // 画面ごとに保存する(HTML スライドの iframe などがトップ画面を上書きしないように)
    const key = url.origin + url.pathname
    e.respondWith(fetch(req).then((r) => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then((x) => x.put(key, c)) } return r }).catch(async () => (await caches.match(key)) ?? caches.match(url.origin + '/')))
    return
  }
  // スクリプト・素材: 保存分を先に返し、裏で更新
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(req)
    const net = fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r }).catch(() => hit)
    return hit ?? net
  }))
})
