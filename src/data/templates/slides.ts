import type { Template } from '../templates'
import { T, R, Ci, S, PH, SH } from './kit'

const C = 'プレゼン'

// ---- セットA: IT / SaaS(ネイビー + シアン) ----
const A = { bg: '#0b1b33', ink: '#0b1b33', cy: '#22d3ee', mid: '#64748b', pale: '#e6f7fb' }
// ---- セットB: 教育(グリーン + イエロー) ----
const B = { ink: '#14432f', g: '#2f9e6b', y: '#fcd34d', pale: '#f1faf4' }
// ---- セットC: 高級感(ブラック + ゴールド) ----
const G = { bg: '#121212', gold: '#c9a96e', ink: '#f5f1e8', mid: '#9b9487' }

export const SLIDE_TEMPLATES: Template[] = [
  // A: SaaS
  { id: 'slx-a-cover', name: 'SaaS 表紙', category: C, w: 1920, h: 1080, bg: A.bg,
    build: () => [
      Ci(1560, 360, 420, 'rgba(34,211,238,0.12)'), Ci(1560, 360, 260, 'rgba(34,211,238,0.18)'),
      T('PRODUCT DECK 2026', 140, 260, 1000, 40, { font: 'Montserrat', weight: 700, fill: A.cy, spacing: 500 }),
      T('チームの仕事を\nひとつにまとめる', 140, 360, 1200, 130, { weight: 900, fill: '#ffffff', lh: 1.2 }),
      R(140, 710, 120, 6, A.cy),
      T('株式会社サンプル / プロダクト事業部', 140, 770, 1000, 38, { weight: 400, fill: '#94a3b8' }),
    ] },
  { id: 'slx-a-agenda', name: 'SaaS 目次', category: C, w: 1920, h: 1080, bg: '#ffffff',
    build: () => [
      R(0, 0, 640, 1080, A.bg),
      T('AGENDA', 120, 160, 440, 44, { font: 'Montserrat', weight: 700, fill: A.cy, spacing: 500 }),
      T('本日の\nお話', 120, 240, 440, 100, { weight: 900, fill: '#ffffff', lh: 1.2 }),
      ...['課題と背景', 'プロダクト概要', '導入事例', '料金とサポート'].flatMap((t, i) => [
        T('0' + (i + 1), 780, 190 + i * 200, 160, 80, { font: 'Montserrat', weight: 900, fill: '#0e7490' }),
        T(t, 980, 205 + i * 200, 800, 60, { fill: A.ink }),
        R(780, 320 + i * 200, 1020, 2, '#e2e8f0'),
      ]),
    ] },
  { id: 'slx-a-chapter', name: 'SaaS 章扉', category: C, w: 1920, h: 1080, bg: A.cy,
    build: () => [
      T('02', 140, 150, 900, 460, { font: 'Bebas Neue', weight: 400, fill: 'rgba(11,27,51,0.15)' }),
      T('プロダクト概要', 140, 620, 1500, 120, { weight: 900, fill: A.ink }),
      T('Product Overview', 140, 780, 1500, 48, { font: 'Montserrat', weight: 400, fill: A.ink, spacing: 200 }),
    ] },
  { id: 'slx-a-compare', name: 'SaaS 比較', category: C, w: 1920, h: 1080, bg: '#f8fafc',
    build: () => [
      T('導入前と導入後', 140, 100, 1640, 72, { weight: 900, fill: A.ink }),
      R(140, 220, 100, 8, A.cy),
      R(140, 300, 780, 640, '#ffffff', 28, SH(0.06)),
      R(1000, 300, 780, 640, A.bg, 28),
      T('BEFORE', 200, 350, 600, 40, { font: 'Montserrat', weight: 700, fill: A.mid, spacing: 400 }),
      T('AFTER', 1060, 350, 600, 40, { font: 'Montserrat', weight: 700, fill: A.cy, spacing: 400 }),
      T('ツールが分散\n進捗確認に毎日30分\n情報の更新漏れ', 200, 460, 660, 48, { weight: 500, fill: '#334155', lh: 1.9 }),
      T('1画面で一元管理\n進捗は自動で可視化\n常に最新の状態', 1060, 460, 660, 48, { weight: 500, fill: '#e2e8f0', lh: 1.9 }),
      S('arrowR', 893, 580, 134, A.cy),
    ] },
  { id: 'slx-a-chart', name: 'SaaS グラフ(棒)', category: C, w: 1920, h: 1080, bg: '#ffffff',
    build: () => [
      T('月間アクティブ数の推移', 140, 100, 1640, 72, { weight: 900, fill: A.ink }),
      R(140, 220, 100, 8, A.cy),
      ...[0, 1, 2, 3, 4].flatMap((i) => {
        const hs = [180, 260, 340, 450, 560][i]
        return [
          R(240 + i * 190, 920 - hs, 120, hs, i === 4 ? A.cy : '#cbd5e1', 12),
          T(['4月', '5月', '6月', '7月', '8月'][i], 220 + i * 190, 940, 160, 32, { weight: 500, fill: A.mid, align: 'center' }),
        ]
      }),
      R(140, 920, 1000, 2, '#94a3b8'),
      R(1280, 320, 500, 560, A.pale, 28),
      T('+211%', 1280, 400, 500, 120, { font: 'Montserrat', weight: 900, fill: '#0891b2', align: 'center' }),
      T('4月比\n(グラフはサンプルです)', 1320, 590, 420, 36, { weight: 400, fill: '#475569', align: 'center', lh: 1.7 }),
    ] },
  // B: 教育
  { id: 'slx-b-cover', name: '教育 表紙', category: C, w: 1920, h: 1080, bg: B.pale,
    build: () => [
      Ci(1500, 540, 420, B.g), Ci(1500, 540, 300, B.y),
      S('star5', 1380, 420, 240, '#ffffff'),
      T('2026年度 第2学期', 140, 270, 1000, 44, { weight: 700, fill: B.g }),
      T('わくわく\n理科教室', 140, 360, 1000, 150, { font: 'Zen Maru Gothic', weight: 900, fill: B.ink, lh: 1.15 }),
      T('やまなみ小学校 5年生向け', 140, 740, 1000, 40, { weight: 500, fill: '#4b6b5a' }),
    ] },
  { id: 'slx-b-body', name: '教育 本文(ポイント)', category: C, w: 1920, h: 1080, bg: '#ffffff',
    build: () => [
      R(0, 0, 1920, 200, B.g),
      T('今日のめあて', 140, 52, 1000, 80, { font: 'Zen Maru Gothic', weight: 900, fill: '#ffffff' }),
      ...['水にとけるものを調べよう', '「とけた」とは何かを説明できる', '食塩とミョウバンのちがいを知る'].flatMap((t, i) => [
        Ci(200, 400 + i * 190, 54, i === 1 ? B.y : '#d1fae5'),
        T(String(i + 1), 146, 366 + i * 190, 108, 64, { font: 'Poppins', weight: 900, fill: B.ink, align: 'center' }),
        T(t, 300, 375 + i * 190, 1450, 60, { weight: 700, fill: B.ink }),
      ]),
    ] },
  { id: 'slx-b-timeline', name: '教育 年間スケジュール', category: C, w: 1920, h: 1080, bg: B.pale,
    build: () => [
      T('年間スケジュール', 140, 100, 1640, 72, { font: 'Zen Maru Gothic', weight: 900, fill: B.ink }),
      R(200, 560, 1520, 8, B.g, 4),
      ...[['4月', '入学式'], ['6月', '遠足'], ['9月', '運動会'], ['12月', '発表会'], ['3月', '卒業式']].flatMap(([m, e], i) => [
        Ci(240 + i * 360, 564, 36, i % 2 ? B.y : B.g),
        T(m, 140 + i * 360, 380, 200, 56, { font: 'Zen Maru Gothic', weight: 900, fill: B.ink, align: 'center' }),
        T(e, 140 + i * 360, 650, 200, 44, { weight: 500, fill: '#4b6b5a', align: 'center' }),
      ]),
    ] },
  { id: 'slx-b-team', name: '教育 先生紹介', category: C, w: 1920, h: 1080, bg: '#ffffff',
    build: () => [
      T('先生の紹介', 140, 100, 1640, 72, { font: 'Zen Maru Gothic', weight: 900, fill: B.ink }),
      R(140, 210, 100, 8, B.y),
      ...[['佐藤 先生', '担任・国語'], ['鈴木 先生', '理科・算数'], ['田中 先生', '音楽・図工']].flatMap(([n, r], i) => [
        ...PH(140 + i * 590, 320, 500, 380, 40, '#e5e7eb'),
        T(n, 140 + i * 590, 750, 500, 52, { font: 'Zen Maru Gothic', weight: 900, fill: B.ink, align: 'center' }),
        T(r, 140 + i * 590, 830, 500, 36, { weight: 400, fill: '#4b6b5a', align: 'center' }),
      ]),
    ] },
  { id: 'slx-b-end', name: '教育 まとめ', category: C, w: 1920, h: 1080, bg: B.g,
    build: () => [
      Ci(260, 880, 300, 'rgba(255,255,255,0.12)'), Ci(1700, 200, 200, 'rgba(255,255,255,0.12)'),
      T('今日のまとめ', 0, 200, 1920, 90, { font: 'Zen Maru Gothic', weight: 900, fill: B.y, align: 'center' }),
      T('ものが水にとけても\nなくなったわけではない', 0, 400, 1920, 96, { font: 'Zen Maru Gothic', weight: 900, fill: '#ffffff', align: 'center', lh: 1.4 }),
      T('次回:とけたものを取り出してみよう', 0, 800, 1920, 44, { weight: 500, fill: '#d1fae5', align: 'center' }),
    ] },
  // C: 高級感
  { id: 'slx-c-cover', name: '高級感 表紙', category: C, w: 1920, h: 1080, bg: G.bg,
    build: () => [
      R(100, 100, 1720, 880, '', 0, { stroke: G.gold, strokeWidth: 2 }),
      T('BRAND PROPOSAL', 0, 330, 1920, 36, { font: 'Montserrat', weight: 400, fill: G.gold, align: 'center', spacing: 800 }),
      T('Maison Étoile', 0, 410, 1920, 150, { font: 'Playfair Display', weight: 400, fill: G.ink, align: 'center' }),
      R(930, 620, 60, 2, G.gold),
      T('新ブランド戦略のご提案', 0, 680, 1920, 44, { font: 'Shippori Mincho', weight: 400, fill: G.mid, align: 'center', spacing: 300 }),
    ] },
  { id: 'slx-c-chapter', name: '高級感 章扉', category: C, w: 1920, h: 1080, bg: G.gold,
    build: () => [
      T('I', 140, 120, 400, 300, { font: 'Playfair Display', weight: 400, fill: 'rgba(18,18,18,0.2)' }),
      T('ブランドの哲学', 140, 600, 1600, 110, { font: 'Shippori Mincho', weight: 800, fill: G.bg }),
      T('Philosophy', 140, 760, 1600, 48, { font: 'Playfair Display', weight: 400, fill: G.bg, spacing: 300 }),
    ] },
  { id: 'slx-c-body', name: '高級感 画像+本文', category: C, w: 1920, h: 1080, bg: G.bg,
    build: () => [
      ...PH(140, 140, 800, 800, 0, '#262626'),
      T('Craftsmanship', 1060, 200, 720, 60, { font: 'Playfair Display', weight: 400, fill: G.gold }),
      R(1060, 300, 80, 2, G.gold),
      T('一針ごとに、\n時間を縫い込む。', 1060, 360, 720, 72, { font: 'Shippori Mincho', weight: 700, fill: G.ink, lh: 1.5 }),
      T('熟練の職人が一点ずつ手仕上げ。\n素材の選定から縫製まで、\n半年をかけて一つのバッグが生まれます。', 1060, 640, 720, 36, { font: 'Shippori Mincho', weight: 400, fill: G.mid, lh: 2 }),
    ] },
  { id: 'slx-c-compare', name: '高級感 ラインナップ比較', category: C, w: 1920, h: 1080, bg: '#f5f1e8',
    build: () => [
      T('Collection', 140, 100, 1640, 80, { font: 'Playfair Display', weight: 400, fill: G.bg }),
      R(140, 210, 80, 2, G.gold),
      ...[['Classic', '定番の黒革', '¥148,000'], ['Premium', '希少な素材', '¥268,000']].flatMap(([n, d, p], i) => [
        R(140 + i * 860, 300, 780, 640, i ? G.bg : '#ffffff', 0, i ? {} : SH(0.06)),
        T(n, 140 + i * 860, 380, 780, 80, { font: 'Playfair Display', weight: 400, fill: i ? G.gold : G.bg, align: 'center' }),
        T(d, 140 + i * 860, 540, 780, 44, { font: 'Shippori Mincho', weight: 400, fill: i ? G.ink : '#44403c', align: 'center' }),
        R(140 + i * 860 + 360, 640, 60, 2, G.gold),
        T(p, 140 + i * 860, 720, 780, 80, { font: 'Playfair Display', weight: 400, fill: i ? G.ink : G.bg, align: 'center' }),
      ]),
    ] },
  { id: 'slx-c-end', name: '高級感 エンディング', category: C, w: 1920, h: 1080, bg: G.bg,
    build: () => [
      T('Thank you', 0, 330, 1920, 150, { font: 'Playfair Display', weight: 400, fill: G.ink, align: 'center' }),
      R(930, 540, 60, 2, G.gold),
      T('ご清聴ありがとうございました', 0, 600, 1920, 40, { font: 'Shippori Mincho', weight: 400, fill: G.mid, align: 'center', spacing: 300 }),
      T('contact@example.com', 0, 880, 1920, 30, { font: 'Montserrat', weight: 400, fill: G.gold, align: 'center', spacing: 200 }),
    ] },
]
