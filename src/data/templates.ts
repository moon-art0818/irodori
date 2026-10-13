import { Circle, FabricObject, Rect, StaticCanvas, Textbox, Gradient } from 'fabric'
import { SHAPES } from './shapes'
import { ensureFonts } from '../editor/core'

// すべてこのアプリ用に作ったオリジナルのレイアウト
export type TemplateBg = string | [string, string, number?]
/** 2ページ目以降(1ページ目は bg/build) */
export interface TemplatePage { bg: TemplateBg; build: () => FabricObject[]; label?: string }
export interface Template {
  id: string; name: string; category: string; w: number; h: number
  bg: TemplateBg
  build: () => FabricObject[]
  /** 複数ページのテンプレート(2ページ目以降)。プレゼン10枚・カルーセル10枚など */
  more?: TemplatePage[]
  /** 検索用のキーワード(業種・用途) */
  tags?: string[]
}

/** テンプレのページ数 */
export const pageCount = (t: Template) => 1 + (t.more?.length ?? 0)
/** n ページ目(0 始まり)の定義 */
export const pageOf = (t: Template, i: number): TemplatePage => (i === 0 ? { bg: t.bg, build: t.build } : t.more![i - 1])

const T = (text: string, x: number, y: number, w: number, size: number, o: Partial<{ weight: number; font: string; fill: string; align: string; lh: number; spacing: number; bg: string }> = {}) =>
  new Textbox(text, {
    left: x, top: y, width: w, fontSize: size, fontWeight: o.weight ?? 700, fontFamily: o.font ?? 'Noto Sans JP',
    fill: o.fill ?? '#1f2937', textAlign: (o.align as any) ?? 'left', lineHeight: o.lh ?? 1.25, charSpacing: o.spacing ?? 0,
    splitByGrapheme: true, textBackgroundColor: o.bg ?? '',
  })
const R = (x: number, y: number, w: number, h: number, fill: string, rx = 0, o: Record<string, any> = {}) =>
  new Rect({ left: x, top: y, width: w, height: h, fill, rx, ry: rx, ...o })
const Ci = (cx: number, cy: number, r: number, fill: string, o: Record<string, any> = {}) =>
  new Circle({ left: cx - r, top: cy - r, radius: r, fill, ...o })
const S = (id: string, x: number, y: number, size: number, fill: string, o: Record<string, any> = {}) => {
  const p = SHAPES.find((s) => s.id === id)!.make(size)
  p.set({ left: x, top: y, fill, ...o })
  return p
}

export const TEMPLATES: Template[] = [
  // ---------- Instagram 投稿 ----------
  { id: 'ig-sale', name: 'セール告知', category: 'Instagram 投稿', w: 1080, h: 1080, bg: '#fff1e6',
    build: () => [
      Ci(900, 180, 260, '#ffd6a5'), Ci(160, 960, 220, '#ffadad'),
      S('burst', 690, 610, 330, '#e63946'),
      T('SUMMER', 90, 150, 900, 72, { font: 'Montserrat', weight: 900, fill: '#e76f51', spacing: 300 }),
      T('大感謝\nセール', 90, 250, 900, 190, { font: 'Dela Gothic One', weight: 400, fill: '#264653', lh: 1.05 }),
      T('8.1 SAT — 8.15 SUN', 90, 690, 600, 44, { font: 'Montserrat', fill: '#264653' }),
      T('最大\n50%\nOFF', 715, 680, 280, 64, { font: 'Dela Gothic One', weight: 400, fill: '#ffffff', align: 'center', lh: 1.0 }),
      T('店舗・オンラインストア同時開催', 90, 930, 700, 36, { weight: 500, fill: '#264653' }),
    ] },
  { id: 'ig-quote', name: '名言・ひとこと', category: 'Instagram 投稿', w: 1080, h: 1080, bg: ['#a18cd1', '#fbc2eb', 135],
    build: () => [
      R(90, 90, 900, 900, 'rgba(255,255,255,0.85)', 48),
      T('“', 150, 120, 200, 260, { font: 'Playfair Display', fill: '#a18cd1' }),
      T('小さな一歩が、\n大きな景色を\n連れてくる。', 150, 380, 780, 84, { font: 'Shippori Mincho', weight: 700, fill: '#2d2a4a', align: 'center', lh: 1.5 }),
      R(470, 780, 140, 4, '#a18cd1'),
      T('@your_account', 150, 830, 780, 36, { font: 'Montserrat', weight: 400, fill: '#6b6790', align: 'center' }),
    ] },
  { id: 'ig-tips', name: 'お役立ちまとめ', category: 'Instagram 投稿', w: 1080, h: 1080, bg: '#f4f7f5',
    build: () => [
      R(0, 0, 1080, 300, '#2a9d8f'),
      T('保存版', 80, 70, 400, 44, { fill: '#e9f5f2', weight: 700 }),
      T('朝が変わる3つの習慣', 80, 140, 920, 80, { fill: '#ffffff', weight: 900 }),
      ...[0, 1, 2].flatMap((i) => [
        Ci(150, 420 + i * 200, 55, '#e9c46a'),
        T(String(i + 1), 95, 382 + i * 200, 110, 64, { font: 'Montserrat', weight: 900, fill: '#264653', align: 'center' }),
        T(['白湯を一杯飲む', '5分だけ外を歩く', '今日の予定を3つ書く'][i], 250, 385 + i * 200, 760, 56, { fill: '#264653' }),
      ]),
      T('続きはプロフィールのリンクから →', 80, 980, 920, 34, { weight: 500, fill: '#2a9d8f', align: 'right' }),
    ] },
  { id: 'ig-cafe', name: 'カフェ新メニュー', category: 'Instagram 投稿', w: 1080, h: 1080, bg: '#3d2b1f',
    build: () => [
      Ci(540, 520, 330, '#f3e9dc'), Ci(540, 520, 300, '', { stroke: '#c08552', strokeWidth: 4, fill: '' }),
      T('NEW MENU', 240, 300, 600, 46, { font: 'Montserrat', weight: 700, fill: '#c08552', align: 'center', spacing: 400 }),
      T('キャラメル\nほうじ茶ラテ', 240, 380, 600, 84, { font: 'Zen Maru Gothic', weight: 900, fill: '#3d2b1f', align: 'center', lh: 1.25 }),
      T('¥580', 240, 640, 600, 64, { font: 'Playfair Display', weight: 700, fill: '#5e3023', align: 'center' }),
      T('10.1 START', 0, 930, 1080, 40, { font: 'Montserrat', weight: 400, fill: '#f3e9dc', align: 'center', spacing: 300 }),
    ] },
  // ---------- ストーリー ----------
  { id: 'story-event', name: 'イベント告知', category: 'ストーリー', w: 1080, h: 1920, bg: ['#0f2027', '#2c5364', 90],
    build: () => [
      Ci(900, 300, 380, 'rgba(255,255,255,0.06)'), Ci(150, 1600, 300, 'rgba(255,255,255,0.06)'),
      T('ONLINE SEMINAR', 100, 380, 880, 48, { font: 'Montserrat', fill: '#7fdbda', spacing: 300 }),
      T('はじめての\nAI活用講座', 100, 470, 880, 130, { weight: 900, fill: '#ffffff', lh: 1.15 }),
      R(100, 860, 880, 4, '#7fdbda'),
      T('10.20 MON  20:00〜21:00', 100, 920, 880, 52, { font: 'Montserrat', weight: 700, fill: '#ffffff' }),
      T('参加費無料 / Zoom開催', 100, 1010, 880, 44, { weight: 500, fill: '#cfe8ef' }),
      R(240, 1480, 600, 130, '#7fdbda', 65),
      T('詳しくはリンクから', 240, 1518, 600, 46, { fill: '#0f2027', align: 'center' }),
    ] },
  { id: 'story-poll', name: '質問・アンケート', category: 'ストーリー', w: 1080, h: 1920, bg: '#ffe066',
    build: () => [
      S('bubbleRound', 120, 420, 840, '#ffffff'),
      T('みんなに質問!', 120, 520, 840, 60, { weight: 700, fill: '#f76707', align: 'center' }),
      T('朝ごはんは\nパン派?ごはん派?', 180, 630, 720, 84, { font: 'Mochiy Pop One', weight: 400, fill: '#343a40', align: 'center', lh: 1.4 }),
      T('↓ ここにアンケートを置いてね ↓', 120, 1420, 840, 44, { weight: 500, fill: '#343a40', align: 'center' }),
    ] },
  // ---------- YouTube ----------
  { id: 'yt-bold', name: '強調サムネ', category: 'YouTube サムネイル', w: 1280, h: 720, bg: '#111827',
    build: () => [
      R(0, 0, 560, 720, '#facc15'),
      S('arrowR', 470, 250, 220, '#ef4444'),
      T('知らないと\n損する', 50, 120, 480, 110, { weight: 900, fill: '#111827', lh: 1.1 }),
      T('5つの\n節約術', 720, 160, 520, 150, { font: 'Dela Gothic One', weight: 400, fill: '#ffffff', lh: 1.1 }),
      T('2026年版', 60, 560, 400, 60, { weight: 900, fill: '#ef4444' }),
    ] },
  { id: 'yt-vlog', name: 'Vlog', category: 'YouTube サムネイル', w: 1280, h: 720, bg: ['#ff9a9e', '#fecfef', 0],
    build: () => [
      R(60, 60, 1160, 600, '', 30, { stroke: '#ffffff', strokeWidth: 10 }),
      T('vlog', 110, 90, 400, 120, { font: 'Pacifico', weight: 400, fill: '#831843' }),
      T('週末ひとり旅\nin 京都', 110, 330, 1000, 120, { font: 'M PLUS Rounded 1c', weight: 900, fill: '#831843', lh: 1.15 }),
    ] },
  // ---------- スライド ----------
  { id: 'slide-title', name: '表紙', category: 'プレゼン', w: 1920, h: 1080, bg: '#ffffff',
    build: () => [
      R(0, 0, 760, 1080, '#4f46e5'), Ci(760, 540, 180, '#a5b4fc'),
      T('PROPOSAL', 120, 200, 600, 40, { font: 'Montserrat', fill: '#c7d2fe', spacing: 400 }),
      T('業務効率化の\nご提案', 1040, 360, 800, 110, { weight: 900, fill: '#1e1b4b', lh: 1.2 }),
      T('2026年10月 / 株式会社サンプル', 1040, 680, 800, 40, { weight: 400, fill: '#6b7280' }),
    ] },
  { id: 'slide-3col', name: '3つのポイント', category: 'プレゼン', w: 1920, h: 1080, bg: '#f8fafc',
    build: () => [
      T('導入のメリット', 120, 100, 1680, 72, { weight: 900, fill: '#1e1b4b' }),
      R(120, 210, 120, 8, '#4f46e5'),
      ...[0, 1, 2].flatMap((i) => [
        R(120 + i * 580, 330, 520, 600, '#ffffff', 24, { shadow: { color: 'rgba(15,23,42,0.08)', blur: 30, offsetX: 0, offsetY: 10 } }),
        Ci(380 + i * 580, 470, 70, ['#e0e7ff', '#dcfce7', '#fef3c7'][i]),
        T(String(i + 1).padStart(2, '0'), 310 + i * 580, 435, 140, 64, { font: 'Montserrat', weight: 900, fill: ['#4f46e5', '#16a34a', '#d97706'][i], align: 'center' }),
        T(['時間を削減', 'ミスを防ぐ', 'すぐ始められる'][i], 160 + i * 580, 590, 440, 52, { fill: '#1e1b4b', align: 'center' }),
        T(['定型作業を自動化し、月20時間を創出します。', '入力ミスや抜け漏れをシステムで防ぎます。', '既存ツールのまま、最短1週間で導入できます。'][i], 170 + i * 580, 680, 420, 34, { weight: 400, fill: '#475569', align: 'center', lh: 1.6 }),
      ]),
    ] },
  { id: 'slide-end', name: 'まとめ・お問い合わせ', category: 'プレゼン', w: 1920, h: 1080, bg: ['#1e1b4b', '#4f46e5', 135],
    build: () => [
      T('Thank you', 0, 360, 1920, 150, { font: 'Playfair Display', weight: 700, fill: '#ffffff', align: 'center' }),
      T('お問い合わせ:info@example.com', 0, 600, 1920, 44, { weight: 400, fill: '#c7d2fe', align: 'center' }),
    ] },
  // ---------- チラシ ----------
  { id: 'flyer-open', name: 'オープン告知チラシ', category: 'チラシ・ポスター', w: 1240, h: 1754, bg: '#fffaf0',
    build: () => [
      R(0, 0, 1240, 620, '#2f855a'), S('arch', 320, 380, 600, '#fffaf0'),
      T('GRAND OPEN', 0, 140, 1240, 70, { font: 'Montserrat', weight: 900, fill: '#f0fff4', align: 'center', spacing: 300 }),
      T('11.3', 0, 230, 1240, 160, { font: 'Bebas Neue', weight: 400, fill: '#ffffff', align: 'center' }),
      T('まちの小さな\nパン屋さん', 120, 720, 1000, 120, { font: 'Zen Maru Gothic', weight: 900, fill: '#22543d', align: 'center', lh: 1.25 }),
      T('オープン記念として、先着100名様に\n焼きたてクロワッサンをプレゼント!', 120, 1060, 1000, 44, { weight: 500, fill: '#2d3748', align: 'center', lh: 1.6 }),
      R(120, 1320, 1000, 2, '#2f855a'),
      T('営業時間 7:00〜18:00(火曜定休)\n〒000-0000 サンプル市サンプル町1-2-3', 120, 1380, 1000, 36, { weight: 400, fill: '#2d3748', align: 'center', lh: 1.7 }),
    ] },
  { id: 'flyer-recruit', name: '求人募集チラシ', category: 'チラシ・ポスター', w: 1240, h: 1754, bg: '#ffffff',
    build: () => [
      R(0, 0, 1240, 1754, '#fef08a'), R(60, 60, 1120, 1634, '#ffffff', 30),
      T('スタッフ\n募集中!', 120, 140, 1000, 190, { font: 'Dela Gothic One', weight: 400, fill: '#1d4ed8', lh: 1.1 }),
      S('star5', 860, 140, 260, '#facc15'),
      T('未経験OK', 860, 238, 260, 40, { weight: 900, fill: '#1d4ed8', align: 'center' }),
      ...['時給 1,200円〜', '週2日・1日3時間からOK', '交通費 全額支給', 'まかない付き'].flatMap((t, i) => [
        S('check', 130, 650 + i * 150, 70, '#22c55e'),
        T(t, 230, 650 + i * 150, 880, 60, { fill: '#1f2937' }),
      ]),
      R(120, 1340, 1000, 260, '#1d4ed8', 20),
      T('お気軽にお電話ください\n000-0000-0000', 120, 1385, 1000, 64, { fill: '#ffffff', align: 'center', lh: 1.5 }),
    ] },
  // ---------- その他 ----------
  { id: 'card-simple', name: 'シンプル名刺', category: '名刺', w: 537, h: 325, bg: '#ffffff',
    build: () => [
      R(0, 0, 14, 325, '#0f766e'),
      T('山田 花子', 50, 90, 440, 38, { weight: 700, fill: '#111827' }),
      T('Hanako Yamada', 50, 140, 440, 16, { font: 'Montserrat', weight: 400, fill: '#6b7280', spacing: 100 }),
      T('株式会社サンプル / デザイナー\nTEL 000-0000-0000\nhanako@example.com', 50, 210, 440, 15, { weight: 400, fill: '#374151', lh: 1.6 }),
    ] },
  { id: 'x-announce', name: 'お知らせ', category: 'X(Twitter)', w: 1600, h: 900, bg: '#0ea5e9',
    build: () => [
      R(80, 80, 1440, 740, '#ffffff', 40),
      T('お知らせ', 160, 160, 600, 56, { fill: '#0ea5e9' }),
      T('年末年始の営業について', 160, 260, 1280, 100, { weight: 900, fill: '#0f172a' }),
      T('12月29日(月)〜1月3日(土)はお休みをいただきます。\n1月5日(月)より通常営業いたします。', 160, 450, 1280, 46, { weight: 400, fill: '#334155', lh: 1.7 }),
    ] },
  { id: 'ogp-blog', name: 'ブログアイキャッチ', category: 'Web・ブログ', w: 1200, h: 630, bg: ['#43e97b', '#38f9d7', 45],
    build: () => [
      R(60, 60, 1080, 510, '#ffffff', 28),
      T('初心者でもわかる', 120, 140, 960, 44, { weight: 700, fill: '#10b981' }),
      T('家計簿アプリの\n選び方ガイド', 120, 210, 960, 96, { weight: 900, fill: '#064e3b', lh: 1.2 }),
      T('myblog.example.com', 120, 480, 960, 28, { font: 'Montserrat', weight: 400, fill: '#6b7280' }),
    ] },
  { id: 'line-rich6', name: 'リッチメニュー6分割', category: 'LINE', w: 2500, h: 1686, bg: '#ffffff',
    build: () => ['予約する', 'メニュー', 'クーポン', 'アクセス', 'よくある質問', 'お問い合わせ'].flatMap((t, i) => {
      const x = (i % 3) * 833, y = Math.floor(i / 3) * 843
      return [
        R(x + 10, y + 10, 813, 823, ['#06c755', '#059669', '#d97706', '#60a5fa', '#a78bfa', '#f472b6'][i], 20),
        T(t, x + 10, y + 360, 813, 100, { fill: '#ffffff', align: 'center', weight: 900 }),
      ]
    }) },
]

import { MORE_TEMPLATES } from './templates/index'
import { TEMPLATE_SETS } from './templateSets/index'
// 複数ページのセットを先頭に(おすすめに出す)、その後に1枚ものを並べる
TEMPLATES.unshift(...TEMPLATE_SETS)
TEMPLATES.push(...MORE_TEMPLATES)

export const TEMPLATE_CATEGORIES = [...new Set(TEMPLATES.map((t) => t.category))]

/** テンプレをページ JSON にする。サイズが違う場合は比率を保って中央に収める */
export function templateToJSON(t: Template, w = t.w, h = t.h, pageIndex = 0): any {
  const pg = pageOf(t, Math.max(0, Math.min(pageCount(t) - 1, pageIndex)))
  const sc = new StaticCanvas(document.createElement('canvas'), { width: w, height: h, renderOnAddRemove: false })
  const objs = pg.build()
  const s = Math.min(w / t.w, h / t.h)
  const ox = (w - t.w * s) / 2, oy = (h - t.h * s) / 2
  for (const o of objs) {
    ;(o as any).id = Math.random().toString(36).slice(2, 10)
    if (s !== 1 || ox || oy) o.set({ left: o.left * s + ox, top: o.top * s + oy, scaleX: (o.scaleX ?? 1) * s, scaleY: (o.scaleY ?? 1) * s })
    sc.add(o)
  }
  if (typeof pg.bg === 'string') sc.backgroundColor = pg.bg
  else {
    const [a, b, angle = 90] = pg.bg
    const rad = (angle * Math.PI) / 180, dx = Math.cos(rad) / 2, dy = Math.sin(rad) / 2
    sc.backgroundColor = new Gradient({ type: 'linear', gradientUnits: 'pixels', coords: { x1: w * (0.5 - dx), y1: h * (0.5 - dy), x2: w * (0.5 + dx), y2: h * (0.5 + dy) }, colorStops: [{ offset: 0, color: a }, { offset: 1, color: b }] })
  }
  const json = sc.toObject(['id', 'name', 'assetId', 'locked'])
  sc.dispose()
  return json
}

/** 全ページの JSON */
export function templatePagesJSON(t: Template, w = t.w, h = t.h): any[] {
  return Array.from({ length: pageCount(t) }, (_, i) => templateToJSON(t, w, h, i))
}

export async function preloadTemplateFonts(t: Template) { await ensureFonts(templateToJSON(t)) }
