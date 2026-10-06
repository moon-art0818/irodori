import type { Template } from '../templates'
import { T, R, Ci, S } from './kit'

const C = '名刺'

export const CARD_TEMPLATES: Template[] = [
  { id: 'cdx-minimal', name: 'ミニマル 白', category: C, w: 537, h: 325, bg: '#ffffff',
    build: () => [
      T('田中 太郎', 40, 40, 300, 30, { weight: 700, fill: '#111827' }),
      T('Taro Tanaka', 40, 80, 300, 14, { font: 'Montserrat', weight: 400, fill: '#9ca3af', spacing: 150 }),
      R(40, 200, 24, 2, '#111827'),
      T('サンプル株式会社\n営業部 マネージャー', 40, 222, 300, 13, { weight: 400, fill: '#374151', lh: 1.6 }),
      T('TEL 000-0000-0000\ntaro@example.com\nexample.com', 330, 222, 170, 12, { weight: 400, fill: '#6b7280', lh: 1.7, align: 'right' }),
    ] },
  { id: 'cdx-dark', name: 'ダーク ゴールド', category: C, w: 537, h: 325, bg: '#141414',
    build: () => [
      R(24, 24, 489, 277, '', 0, { stroke: '#c9a96e', strokeWidth: 1 }),
      T('高橋 美咲', 60, 100, 417, 30, { font: 'Shippori Mincho', weight: 800, fill: '#f5f1e8', align: 'center', spacing: 200 }),
      T('Misaki Takahashi', 60, 148, 417, 14, { font: 'Playfair Display', weight: 400, fill: '#c9a96e', align: 'center', spacing: 200 }),
      T('Maison Étoile  Creative Director\nmisaki@example.com  /  000-0000-0000', 60, 220, 417, 11, { weight: 400, fill: '#9b9487', align: 'center', lh: 1.8 }),
    ] },
  { id: 'cdx-color', name: 'カラーブロック', category: C, w: 537, h: 325, bg: '#fff7ed',
    build: () => [
      R(0, 0, 190, 325, '#f97316'), Ci(95, 100, 44, '#fed7aa'),
      T('MARU\nBAKERY', 20, 170, 150, 24, { font: 'Dela Gothic One', weight: 400, fill: '#ffffff', align: 'center', lh: 1.15 }),
      T('佐藤 あかり', 230, 50, 280, 28, { weight: 900, fill: '#431407' }),
      T('パティシエ / 店長', 230, 94, 280, 13, { weight: 500, fill: '#9a3412' }),
      T('〒000-0000 サンプル市緑町1-2-3\nTEL 000-0000-0000\nakari@example.com', 230, 190, 280, 12, { weight: 400, fill: '#57534e', lh: 1.8 }),
    ] },
  { id: 'cdx-nature', name: 'ナチュラル サロン', category: C, w: 537, h: 325, bg: '#f2efe6',
    build: () => [
      S('blob1', 350, 130, 230, '#d9e2cc'), Ci(60, 290, 70, '#e5dcc8'),
      T('Salon Midori', 40, 40, 300, 26, { font: 'Playfair Display', weight: 400, fill: '#4f6b45' }),
      T('美容師  伊藤 すみれ', 40, 130, 300, 22, { font: 'Zen Maru Gothic', weight: 900, fill: '#33402c' }),
      T('ご予約はお電話・LINEから\n000-0000-0000\n@salon_midori', 40, 200, 280, 12, { weight: 400, fill: '#5b6552', lh: 1.8 }),
    ] },
  { id: 'cdx-tech', name: 'テック ライン', category: C, w: 537, h: 325, bg: '#0b1b33',
    build: () => [
      R(40, 40, 40, 4, '#22d3ee'),
      T('山本 健', 40, 70, 300, 30, { weight: 900, fill: '#ffffff' }),
      T('Backend Engineer', 40, 118, 300, 14, { font: 'Montserrat', weight: 700, fill: '#22d3ee', spacing: 100 }),
      T('株式会社サンプルテック\nken@example.com\nGitHub: github.com/example', 40, 210, 300, 12, { weight: 400, fill: '#94a3b8', lh: 1.8 }),
      Ci(440, 160, 60, 'rgba(34,211,238,0.15)'), Ci(440, 160, 30, 'rgba(34,211,238,0.35)'),
    ] },
]
