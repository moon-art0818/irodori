import type { Template } from '../templates'
import { T, R, Ci, S, PH } from './kit'

const C = 'Web・ブログ'

export const WEB_TEMPLATES: Template[] = [
  { id: 'wbx-tech', name: '技術ブログ', category: C, w: 1200, h: 630, bg: '#0f172a',
    build: () => [
      R(0, 0, 14, 630, '#22d3ee'),
      T('TECH BLOG', 90, 80, 800, 32, { font: 'Montserrat', weight: 700, fill: '#22d3ee', spacing: 500 }),
      T('React 19 で変わる\nフォーム実装の基本', 90, 160, 900, 84, { weight: 900, fill: '#ffffff', lh: 1.3 }),
      T('example-dev.com', 90, 520, 600, 28, { font: 'Montserrat', weight: 400, fill: '#94a3b8' }),
      Ci(1040, 480, 180, 'rgba(34,211,238,0.12)'),
    ] },
  { id: 'wbx-life', name: '暮らしブログ', category: C, w: 1200, h: 630, bg: '#faf5ee',
    build: () => [
      ...PH(700, 70, 430, 490, 215, '#e7ddcd'),
      T('くらしの手帖', 90, 90, 500, 34, { font: 'Shippori Mincho', weight: 700, fill: '#a16207' }),
      T('朝時間が整う\n5つの習慣', 90, 170, 580, 78, { font: 'Zen Maru Gothic', weight: 900, fill: '#44342a', lh: 1.35 }),
      R(90, 400, 80, 4, '#a16207'),
      T('2026.10.06 UPDATE', 90, 450, 500, 26, { font: 'Montserrat', weight: 400, fill: '#78716c' }),
    ] },
  { id: 'wbx-biz', name: 'ビジネス記事', category: C, w: 1200, h: 630, bg: '#ffffff',
    build: () => [
      R(0, 0, 1200, 630, '#1e3a8a'),
      R(60, 60, 1080, 510, '#ffffff', 0),
      R(60, 60, 20, 510, '#f59e0b'),
      T('COLUMN', 130, 110, 700, 30, { font: 'Montserrat', weight: 700, fill: '#f59e0b', spacing: 500 }),
      T('経営者が知っておきたい\nインボイス制度の要点', 130, 180, 960, 72, { weight: 900, fill: '#1e3a8a', lh: 1.35 }),
      T('税理士監修 / 5分で読める', 130, 470, 960, 28, { weight: 500, fill: '#64748b' }),
    ] },
  { id: 'wbx-pop', name: 'ポップ 特集', category: C, w: 1200, h: 630, bg: '#fef3c7',
    build: () => [
      S('burst', 830, 70, 300, '#f472b6'), Ci(130, 540, 90, '#67e8f9'),
      T('初心者さん必見!', 90, 100, 700, 42, { font: 'Mochiy Pop One', weight: 400, fill: '#db2777' }),
      T('はじめての\nキャンプ入門', 90, 180, 760, 100, { font: 'Mochiy Pop One', weight: 400, fill: '#1f2937', lh: 1.25 }),
      T('持ち物リスト\n付き', 855, 190, 250, 38, { font: 'Mochiy Pop One', weight: 400, fill: '#ffffff', align: 'center', lh: 1.3 }),
      T('outdoor-note.example.com', 90, 520, 700, 26, { font: 'Montserrat', weight: 400, fill: '#78716c' }),
    ] },
]
