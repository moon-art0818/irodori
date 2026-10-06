// irodori 用の中継: slide-studio の画面(app.js)がサーバーに送る通信を、親画面(irodori)の保存処理に流す。
// app.js は変更せず、fetch('/api/...') と EventSource('/api/events') だけを差し替える。
(function () {
  // 親(irodori の DeckEditor)が用意した窓口を探す。発表者ツール等の別ウィンドウは opener をたどる
  function findBridge() {
    let w = window
    for (let i = 0; i < 6 && w; i++) {
      try {
        if (w.parent && w.parent !== w && w.parent.irodoriDeckBridge) return w.parent.irodoriDeckBridge
        if (w.irodoriDeckBridge) return w.irodoriDeckBridge
      } catch (e) { /* 別オリジンは見ない */ }
      w = w.opener
    }
    return null
  }
  const bridge = findBridge()
  if (!bridge) { document.addEventListener('DOMContentLoaded', () => { document.body.innerHTML = '<p style="padding:40px;font:16px sans-serif">このページは irodori のエディタから開いてください。</p>' }); return }

  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  const realFetch = window.fetch.bind(window)
  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : input.url
    const path = new URL(url, location.href).pathname
    if (!path.includes('/api/')) return realFetch(input, init) // 中継するのは /api/ だけ
    const method = ((init && init.method) || 'GET').toUpperCase()
    try {
      const body = init && typeof init.body === 'string' ? JSON.parse(init.body) : {}
      if (path.endsWith('/api/deck') && method === 'GET') return json(200, bridge.getDeck())
      let m = path.match(/\/api\/slides\/([^/]+)$/)
      if (m && method === 'PUT') return json(200, await bridge.putSlide(decodeURIComponent(m[1]), body))
      if (path.endsWith('/api/memos') && method === 'POST') return json(200, await bridge.addMemo(body))
      m = path.match(/\/api\/memos(?:\/([\w-]+))?$/)
      if (m && method === 'DELETE') return json(200, await bridge.deleteMemo(m[1] || null))
    } catch (e) { return json(500, { error: String((e && e.message) || e) }) }
    if (path.includes('/api/')) return json(404, { error: 'not found' })
    return realFetch(input, init)
  }

  // サーバーからの通知(EventSource)の代わりに、親の変更通知を受け取る
  window.EventSource = function () {
    const es = this
    es.onopen = null; es.onmessage = null
    const off = bridge.subscribe((msg) => { if (es.onmessage) es.onmessage({ data: JSON.stringify(msg) }) })
    setTimeout(() => { if (es.onopen) es.onopen({}); if (es.onmessage) es.onmessage({ data: JSON.stringify({ type: 'presence', count: bridge.viewers() }) }) }, 0)
    es.close = off
    window.addEventListener('pagehide', off)
  }
})()
