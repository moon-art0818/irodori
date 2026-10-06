// slide-studio から自動で取り込んだファイル(scripts/sync-slide-studio.mjs)。直接編集しない
// スライド編集システムの画面側。
// view=main(通常) / presenter(発表者ツール) / audience(投影用)を同じファイルで切り替える。
const VIEW = new URLSearchParams(location.search).get('view') || 'main';
const CLIENT = Math.random().toString(36).slice(2);
const bc = 'BroadcastChannel' in window ? new BroadcastChannel('slide-studio') : null;
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

let deck = null;
let memos = [];
let cur = 0;
let mode = 'slide';
let editing = false;
let linked = VIEW !== 'main'; // 発表者ツールと連動中か(main は発表者ツールを開いたら連動)
let pendingDeck = null;
let editBase = ''; // 編集開始時のスライド HTML(自分が何か変えたかの判定用)
let needRefetch = false; // 編集中に再接続したら、編集後に取り直す

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const n = () => deck.slides.length;

function slideTitle(s) {
  const d = document.createElement('div');
  d.innerHTML = s.html;
  const h = d.querySelector('h1, h2, .q');
  return (h ? h.textContent : '').replace(/\s+/g, ' ').trim() || '(無題)';
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2400);
}

// ---------- スライドの描画と拡大縮小 ----------
function makeSlide(s, i) {
  const el = document.createElement('div');
  el.className = 'slide l-' + (s.layout || 'plain');
  el.dataset.id = s.id;
  el.innerHTML = s.html + `<div class="foot"><span>${esc(deck.brand || '')}${s.chapter ? ' ・ ' + esc(s.chapter) : ''}</span><span><b>${i + 1}</b> / ${n()}</span></div>`;
  return el;
}

const ro = new ResizeObserver((entries) => entries.forEach((e) => fitOne(e.target)));
function fitOne(box) {
  const sc = box.firstElementChild;
  if (!sc) return;
  const w = box.clientWidth, h = box.clientHeight;
  if (!w || !h) return; // 非表示の間は 0 になるので触らない(表示されたら ResizeObserver がもう一度呼ぶ)
  const s = Math.min(w / 1280, h / 720);
  sc.style.width = 1280 * s + 'px';
  sc.style.height = 720 * s + 'px';
  sc.firstElementChild.style.transform = `scale(${s})`;
}
function mount(box, i, shadow) {
  box.classList.add('fit');
  box.innerHTML = '';
  const sc = document.createElement('div');
  sc.className = 'scaler' + (shadow ? ' shadow' : '');
  sc.appendChild(makeSlide(deck.slides[i], i));
  box.appendChild(sc);
  ro.observe(box);
  fitOne(box);
  return sc.firstElementChild;
}

// ---------- 通常画面 ----------
function memoCountOf(id) { return memos.filter((m) => m.slideId === id).length; }

function renderToc() {
  let html = '', chap = null;
  deck.slides.forEach((s, i) => {
    if (s.chapter && s.chapter !== chap) html += `<div class="chap">${esc(s.chapter)}</div>`;
    chap = s.chapter;
    const c = memoCountOf(s.id);
    html += `<div class="item" data-i="${i}"><span class="n">${i + 1}</span><span>${esc(slideTitle(s))}</span>${c ? `<span class="dot" title="メモ ${c}件">●</span>` : ''}</div>`;
  });
  $('#toc').innerHTML = html;
}
function renderThumbs() {
  const wrap = $('#thumbs'); wrap.innerHTML = '';
  deck.slides.forEach((s, i) => {
    const row = document.createElement('div');
    row.className = 'th'; row.dataset.i = i;
    row.innerHTML = `<span class="n">${i + 1}</span><div class="box"></div>`;
    wrap.appendChild(row); mount(row.querySelector('.box'), i);
  });
}
function renderGrid() {
  const wrap = $('#grid'); wrap.innerHTML = '';
  deck.slides.forEach((s, i) => {
    const cell = document.createElement('div');
    cell.className = 'cell'; cell.dataset.i = i;
    cell.innerHTML = `<div class="box"></div><div class="cap">${i + 1}. ${esc(slideTitle(s))}</div>`;
    wrap.appendChild(cell); mount(cell.querySelector('.box'), i);
  });
}
function renderScroll() {
  const wrap = $('#scroll'); wrap.innerHTML = '';
  deck.slides.forEach((s, i) => {
    const row = document.createElement('div');
    row.className = 'srow'; row.dataset.i = i;
    row.innerHTML = `<div class="cap">${i + 1} / ${n()}  ${esc(slideTitle(s))}</div><div class="box"></div>`;
    wrap.appendChild(row); mount(row.querySelector('.box'), i, true);
  });
}

function renderCurrent() {
  const s = deck.slides[cur];
  mount($('#stageInner'), cur, true);
  $$('#toc .item, #thumbs .th, #grid .cell').forEach((el) => el.classList.toggle('on', +el.dataset.i === cur));
  $('#pageNo').textContent = `${cur + 1} / ${n()}`;
  $('#progressBar').style.width = ((cur + 1) / n()) * 100 + '%';
  $('#curTitle').textContent = slideTitle(s);
  $('#memoSlideTitle').textContent = `#${cur + 1} ${slideTitle(s)}`;
  $('#notesText').value = s.notes || '';
  history.replaceState(null, '', `${location.search}#${cur + 1}`);
  $('#toc .item.on')?.scrollIntoView({ block: 'nearest' });
  $('#thumbs .th.on')?.scrollIntoView({ block: 'nearest' });
  renderMemos();
}

function renderAll() {
  if (cur >= n()) cur = n() - 1;
  $('#docTitle').textContent = deck.title || '';
  $('#docSub').textContent = deck.subtitle || '';
  document.title = deck.title || 'スライド編集システム';
  renderToc(); renderThumbs(); renderGrid(); renderScroll(); renderCurrent();
}

function go(i, { broadcast = true } = {}) {
  i = Math.max(0, Math.min(n() - 1, i));
  if (editing) saveEdit();
  cur = i;
  if (VIEW === 'main') renderCurrent();
  else renderPresenterOrAudience();
  if (broadcast && linked && bc) bc.postMessage({ type: 'goto', i, from: CLIENT });
}

function setMode(m) {
  if (m !== 'slide' && editing) saveEdit();
  mode = m;
  ['slide', 'grid', 'scroll'].forEach((x) => $('#app').classList.toggle('mode-' + x, x === m));
  $$('.seg').forEach((b) => b.classList.toggle('on', b.dataset.mode === m));
  if (m === 'scroll') $(`#scroll .srow[data-i="${cur}"]`)?.scrollIntoView({ block: 'start' });
  if (m === 'grid') $(`#grid .cell[data-i="${cur}"]`)?.scrollIntoView({ block: 'nearest' });
}

// ---------- その場で編集 ----------
function stageSlide() { return $('#stageInner .slide'); }
function normHtml(html) { const d = document.createElement('div'); d.innerHTML = html; return d.innerHTML; }

function startEdit() {
  if (mode !== 'slide') setMode('slide');
  openPanel('edit');
  editing = true;
  const el = stageSlide();
  editBase = normHtml(deck.slides[cur].html);
  // 直下に文字を持つ要素だけを書き換え可能にする(枠や並びの構造は崩さない)
  el.querySelectorAll('*').forEach((node) => {
    if (node.closest('.foot')) return;
    const hasText = [...node.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim());
    if (hasText && !node.parentElement.closest('[contenteditable]')) node.contentEditable = 'true';
  });
  $('#app').classList.add('editing');
  $('#btnEdit').classList.add('on');
  $('#editToggle').textContent = '編集中…';
  $('#editToggle').disabled = true;
  $('#editSave').disabled = $('#editCancel').disabled = false;
  toast('編集モード:文字をクリックして書き換え → ⌘S で保存');
}

function stopEditUi() {
  editing = false;
  $('#app').classList.remove('editing');
  $('#btnEdit').classList.remove('on');
  $('#editToggle').textContent = '編集を始める(E)';
  $('#editToggle').disabled = false;
  $('#editSave').disabled = $('#editCancel').disabled = true;
}

function editedHtml() {
  const clone = stageSlide().cloneNode(true);
  clone.querySelector('.foot')?.remove();
  clone.querySelectorAll('[contenteditable]').forEach((x) => x.removeAttribute('contenteditable'));
  return clone.innerHTML;
}

async function saveEdit() {
  if (!editing) return;
  const s = deck.slides[cur];
  const html = editedHtml();
  stopEditUi();
  // 自分が何も変えていなければ保存しない(編集中に届いた他の人の変更をそのまま表示する)
  if (html !== editBase) {
    s.html = html;
    const ok = await putSlide(s, { html });
    if (ok) toast('保存しました');
  }
  afterEdit();
}
function editChanged() { return editing && editedHtml() !== editBase; }
function cancelEdit() {
  if (!editing) return;
  if (editChanged() && !confirm('このスライドの編集内容を取り消しますか?')) return;
  stopEditUi();
  afterEdit();
  toast('編集を取り消しました');
}
async function putSlide(s, patch) {
  try {
    const r = await fetch(`/api/slides/${encodeURIComponent(s.id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...patch, client: CLIENT }) });
    if (r.ok) return true;
    toast('保存に失敗しました:' + (await r.text()));
  } catch (e) {
    toast('保存に失敗しました(サーバーにつながりません)。ページを閉じずに再起動してください');
  }
  return false;
}
function afterEdit() {
  if (editing) return; // 保存待ちの間に次の編集が始まっていたら、画面を作り直さない
  applyPendingDeck();
  if (needRefetch) { needRefetch = false; refetch(); return; }
  renderAfterChange();
}
function renderAfterChange() {
  // 目次の題名やサムネイルにも反映する
  renderToc(); renderThumbs(); renderGrid(); renderScroll(); renderCurrent();
}

// ---------- メモ ----------
function openPanel(tab) {
  $('#panel').hidden = false;
  $('#btnMemo').classList.add('on');
  setPanelTab(tab || 'this');
}
function closePanel() {
  if (editing) saveEdit();
  $('#panel').hidden = true;
  $('#btnMemo').classList.remove('on');
}
function setPanelTab(t) {
  $$('[data-ptab]').forEach((b) => b.classList.toggle('on', b.dataset.ptab === t));
  $$('[data-pane]').forEach((p) => (p.hidden = p.dataset.pane !== t));
}

function memoHtml(m) {
  const d = new Date(m.at);
  return `<div class="memo${m.slideId ? '' : ' g'}"><div>${esc(m.text).replace(/\n/g, '<br>')}</div><div class="who">${m.slideId ? '' : '資料全体 ・ '}${esc(m.author)} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}</div><button class="del" data-del="${m.id}" title="削除">×</button></div>`;
}
function renderMemos() {
  if (!deck) return;
  const id = deck.slides[cur].id;
  const mine = memos.filter((m) => m.slideId === id || !m.slideId);
  $('#memoList').innerHTML = mine.length ? mine.map(memoHtml).join('') : '<div class="empty">まだメモはありません</div>';
  $('#memoCount').textContent = memos.length || '';
  let all = '';
  const g = memos.filter((m) => !m.slideId);
  if (g.length) all += `<div class="memo-group">資料全体</div>` + g.map(memoHtml).join('');
  deck.slides.forEach((s, i) => {
    const ms = memos.filter((m) => m.slideId === s.id);
    if (ms.length) all += `<div class="memo-group" data-i="${i}">#${i + 1} ${esc(slideTitle(s))}</div>` + ms.map(memoHtml).join('');
  });
  $('#memoAll').innerHTML = all || '<div class="empty">まだメモはありません</div>';
}

async function addMemo() {
  const text = $('#memoText').value.trim();
  if (!text) return;
  const body = { text, slideId: $('#memoGlobal').checked ? null : deck.slides[cur].id, author: '', client: CLIENT };
  const r = await fetch('/api/memos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) return toast('メモを保存できませんでした');
  const { memo } = await r.json();
  if (!memos.some((m) => m.id === memo.id)) memos.push(memo);
  $('#memoText').value = '';
  $('#memoGlobal').checked = false;
  renderMemos(); renderToc(); renderCurrentMarks();
}
function renderCurrentMarks() { $$('#toc .item').forEach((el) => el.classList.toggle('on', +el.dataset.i === cur)); }

function memosAsPrompt() {
  const lines = ['data/deck.json のスライドを、以下のメモに従って修正してください。',
    'スライドは id で特定してください。見た目は public/slides.css にあるクラスだけを使い、変更後に何を直したか一覧で教えてください。', ''];
  const g = memos.filter((m) => !m.slideId);
  if (g.length) { lines.push('## 資料全体'); g.forEach((m) => lines.push('- ' + m.text.replace(/\n/g, '\n  '))); lines.push(''); }
  deck.slides.forEach((s, i) => {
    const ms = memos.filter((m) => m.slideId === s.id);
    if (!ms.length) return;
    lines.push(`## #${i + 1}「${slideTitle(s)}」(id: ${s.id})`);
    ms.forEach((m) => lines.push('- ' + m.text.replace(/\n/g, '\n  ')));
    lines.push('');
  });
  return lines.join('\n');
}
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch {
    const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy'); ta.remove(); return ok;
  }
}

// ---------- 同時編集(サーバーからの通知) ----------
function applyPendingDeck() {
  if (!pendingDeck) return;
  deck = pendingDeck; pendingDeck = null;
}
function connectEvents() {
  const es = new EventSource('/api/events');
  let opened = false;
  es.onopen = () => {
    // 再接続したら取りこぼし分を取り直す(初回も、起動時の取得との間の変更を拾うため取り直す)
    if (opened) { if (editing) needRefetch = true; else refetch(); }
    opened = true;
  };
  es.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'presence' && VIEW === 'main') $('#presence').textContent = `${msg.count}人が開いています`;
    if (msg.type === 'slide') {
      if (msg.client === CLIENT) return;
      const i = deck.slides.findIndex((s) => s.id === msg.slide.id);
      if (i < 0) return;
      if (editing && i === cur) {
        // 編集中の画面はそのまま。何か変えて保存すると相手の変更を上書きし、変えずに終えると相手の内容が表示される
        deck.slides[i] = msg.slide;
        toast(`#${i + 1} を他の人が保存しました。あなたが保存すると上書きします`);
        return;
      }
      deck.slides[i] = msg.slide;
      if (VIEW === 'main') { refresh(); toast(`#${i + 1} が更新されました`); }
      else renderPresenterOrAudience();
    }
    if (msg.type === 'deck') {
      if (editing) { pendingDeck = msg.deck; toast('deck.json が更新されました(編集を終えると反映)'); return; }
      deck = msg.deck;
      if (VIEW === 'main') { refresh(); toast('deck.json の変更を反映しました'); }
      else renderPresenterOrAudience();
    }
    if (msg.type === 'memos') {
      memos = msg.memos;
      if (VIEW === 'main') { renderMemos(); renderToc(); renderCurrentMarks(); }
    }
  };
}
async function refetch() {
  try {
    const d = await (await fetch('/api/deck')).json();
    if (editing) { needRefetch = true; return; }
    deck = d.deck; memos = d.memos || []; refresh();
  } catch { /* 次の再接続で取り直す */ }
}
function refresh() {
  if (VIEW !== 'main') return renderPresenterOrAudience();
  if (cur >= n()) cur = n() - 1;
  renderAll();
}

// ---------- 発表者ツール・投影用 ----------
let tStart = Date.now();
function renderPresenterOrAudience() {
  if (cur >= n()) cur = n() - 1;
  if (VIEW === 'audience') { mount($('#aCur'), cur); return; }
  mount($('#pCur'), cur, true);
  const box = $('#pNext2');
  if (cur + 1 < n()) { mount(box, cur + 1); $('#pNextTitle').textContent = `${cur + 2}. ${slideTitle(deck.slides[cur + 1])}`; }
  else { box.innerHTML = '<div style="color:#8f9ac0">最後のスライドです</div>'; $('#pNextTitle').textContent = ''; }
  $('#pPage').textContent = `${cur + 1} / ${n()}`;
  $('#pNotes').textContent = deck.slides[cur].notes || '(メモなし)';
  history.replaceState(null, '', `${location.search}#${cur + 1}`);
}
function tick() {
  const sec = Math.floor((Date.now() - tStart) / 1000);
  $('#pTimer').textContent = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  const d = new Date();
  $('#pClock').textContent = `現在 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ---------- PDF ----------
// 印刷の直前に全スライドを並べる(PDFボタンでも ⌘P でも同じ)。保存先で「PDFとして保存」を選ぶ
let titleBeforePrint = '';
function buildPrint() {
  if (!deck) return;
  if (editing) saveEdit();
  const p = $('#print'); p.innerHTML = '';
  deck.slides.forEach((s, i) => p.appendChild(makeSlide(s, i)));
  titleBeforePrint = document.title; document.title = deck.title || 'slides';
}
window.addEventListener('beforeprint', buildPrint);
window.addEventListener('afterprint', () => { $('#print').innerHTML = ''; if (titleBeforePrint) document.title = titleBeforePrint; });
function exportPdf() { window.print(); }

// ---------- 操作 ----------
function typing(e) {
  const t = e.target;
  return t.isContentEditable || /^(TEXTAREA|INPUT|SELECT)$/.test(t.tagName);
}
function keyNav(e) {
  if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(cur + 1); return true; }
  if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); go(cur - 1); return true; }
  if (e.key === 'Home') { go(0); return true; }
  if (e.key === 'End') { go(n() - 1); return true; }
  return false;
}

function bindMain() {
  $$('.seg').forEach((b) => (b.onclick = () => setMode(b.dataset.mode)));
  $$('[data-side]').forEach((b) => (b.onclick = () => {
    $$('[data-side]').forEach((x) => x.classList.toggle('on', x === b));
    $('#toc').hidden = b.dataset.side !== 'toc';
    $('#thumbs').hidden = b.dataset.side !== 'thumbs';
    $('#thumbs .th.on')?.scrollIntoView({ block: 'nearest' });
  }));
  $('#toc').onclick = (e) => { const it = e.target.closest('.item'); if (it) go(+it.dataset.i); };
  $('#thumbs').onclick = (e) => { const it = e.target.closest('.th'); if (it) go(+it.dataset.i); };
  $('#grid').onclick = (e) => { const it = e.target.closest('.cell'); if (it) { go(+it.dataset.i); setMode('slide'); } };
  $('#grid').ondblclick = () => setMode('slide');
  $('#scroll').onclick = (e) => { const it = e.target.closest('.srow'); if (it) go(+it.dataset.i); };
  $('#prev').onclick = () => go(cur - 1);
  $('#next').onclick = () => go(cur + 1);

  $('#btnMemo').onclick = () => ($('#panel').hidden ? openPanel('this') : closePanel());
  $('#panelClose').onclick = closePanel;
  $$('[data-ptab]').forEach((b) => (b.onclick = () => setPanelTab(b.dataset.ptab)));
  $('#btnEdit').onclick = () => (editing ? saveEdit() : startEdit());
  $('#editToggle').onclick = startEdit;
  $('#editSave').onclick = saveEdit;
  $('#editCancel').onclick = cancelEdit;
  $('#notesSave').onclick = async () => {
    const s = deck.slides[cur]; s.notes = $('#notesText').value;
    await putSlide(s, { notes: s.notes }); toast('発表者メモを保存しました');
  };
  $('#memoAdd').onclick = addMemo;
  $('#memoText').onkeydown = (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); addMemo(); } };
  $('#panel').addEventListener('click', async (e) => {
    const del = e.target.closest('[data-del]');
    if (del) { await fetch('/api/memos/' + del.dataset.del, { method: 'DELETE' }); memos = memos.filter((m) => m.id !== del.dataset.del); renderMemos(); renderToc(); renderCurrentMarks(); }
    const grp = e.target.closest('.memo-group[data-i]');
    if (grp) go(+grp.dataset.i);
  });
  $('#memoCopy').onclick = async () => {
    if (!memos.length) return toast('コピーするメモがありません');
    toast((await copyText(memosAsPrompt())) ? 'コピーしました。Claude Code にそのまま貼り付けてください' : 'コピーできませんでした');
  };
  $('#memoMd').onclick = () => {
    if (!memos.length) return toast('保存するメモがありません');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([memosAsPrompt()], { type: 'text/markdown' }));
    a.download = 'スライド修正メモ.md'; a.click(); URL.revokeObjectURL(a.href);
  };
  $('#memoClear').onclick = async () => {
    if (!memos.length || !confirm(`メモ ${memos.length}件をすべて消します。よろしいですか?`)) return;
    await fetch('/api/memos', { method: 'DELETE' }); memos = []; renderMemos(); renderToc(); renderCurrentMarks();
  };

  $('#btnPresenter').onclick = () => {
    linked = true;
    window.open(`/slides/index.html?view=presenter#${cur + 1}`, 'slide-presenter', 'width=1200,height=760');
  };
  $('#btnFull').onclick = enterPresent;
  $('#btnPdf').onclick = exportPdf;
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) $('#app').classList.remove('present'); });

  document.addEventListener('keydown', (e) => {
    if (e.isComposing || e.keyCode === 229) return; // 日本語の変換中のキーは無視(変換取消の Esc で編集を消さない)
    if (editing && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveEdit(); return; }
    if (editing && e.key === 'Escape') { e.preventDefault(); cancelEdit(); return; }
    if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (keyNav(e)) return;
    const k = e.key.toLowerCase();
    if (k === 'e') { e.preventDefault(); startEdit(); }
    else if (k === 'm') { e.preventDefault(); openPanel('this'); $('#memoText').focus(); }
    else if (k === 'g') setMode(mode === 'grid' ? 'slide' : 'grid');
    else if (k === 's') setMode(mode === 'scroll' ? 'slide' : 'scroll');
    else if (k === 'p') $('#btnPresenter').click();
    else if (k === 'f') enterPresent();
    else if (e.key === 'Escape') { if (!$('#panel').hidden) closePanel(); else if (mode !== 'slide') setMode('slide'); }
  });
  window.addEventListener('hashchange', () => {
    const i = (parseInt(location.hash.slice(1), 10) || 1) - 1;
    if (i !== cur) go(i);
  });
  window.addEventListener('beforeunload', (e) => { if (editChanged()) { e.preventDefault(); e.returnValue = ''; } });
}
function enterPresent() {
  if (editing) saveEdit();
  setMode('slide');
  $('#app').classList.add('present');
  document.documentElement.requestFullscreen?.().catch(() => {});
  setTimeout(() => fitOne($('#stageInner')), 100);
}

function bindPresenter() {
  $('#pPrev').onclick = () => go(cur - 1);
  $('#pNext').onclick = () => go(cur + 1);
  $('#pReset').onclick = () => { tStart = Date.now(); tick(); };
  $('#pOpenAudience').onclick = () => window.open(`/slides/index.html?view=audience#${cur + 1}`, 'slide-audience', 'width=1280,height=760');
  setInterval(tick, 500); tick();
  document.addEventListener('keydown', (e) => { if (!typing(e)) keyNav(e); });
}
function bindAudience() {
  document.addEventListener('keydown', (e) => {
    if (keyNav(e)) return;
    if (e.key.toLowerCase() === 'f') document.documentElement.requestFullscreen?.();
  });
  $('#audience').ondblclick = () => document.documentElement.requestFullscreen?.();
}

if (bc) bc.onmessage = (e) => {
  const m = e.data;
  if (m.type === 'goto' && m.from !== CLIENT && linked && deck) go(m.i, { broadcast: false });
};

// ---------- 起動 ----------
(async function init() {
  const d = await (await fetch('/api/deck')).json();
  deck = d.deck; memos = d.memos || [];
  cur = Math.max(0, Math.min(n() - 1, (parseInt(location.hash.slice(1), 10) || 1) - 1));
  if (VIEW === 'presenter') {
    $('#app').hidden = true; $('#presenter').hidden = false;
    document.title = '発表者ツール - ' + (deck.title || '');
    bindPresenter(); renderPresenterOrAudience();
  } else if (VIEW === 'audience') {
    $('#app').hidden = true; $('#audience').hidden = false;
    document.title = '投影用 - ' + (deck.title || '');
    bindAudience(); renderPresenterOrAudience();
  } else {
    bindMain(); renderAll();
  }
  connectEvents();
})();
