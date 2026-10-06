import type { Template } from '../templates'
import { T, R, Ci, S } from './kit'

export const MISC_TEMPLATES: Template[] = [
  // ---------- ロゴ ----------
  { id: 'lgx-bakery', name: 'ベーカリー ロゴ', category: 'ロゴ', w: 500, h: 500, bg: '#fff7ed',
    build: () => [
      Ci(250, 250, 200, '#f97316'), Ci(250, 250, 180, '', { stroke: '#fff7ed', strokeWidth: 3, fill: '' }),
      T('MARU', 50, 175, 400, 80, { font: 'Dela Gothic One', weight: 400, fill: '#fff7ed', align: 'center' }),
      T('BAKERY', 50, 265, 400, 36, { font: 'Montserrat', weight: 700, fill: '#ffedd5', align: 'center', spacing: 500 }),
    ] },
  { id: 'lgx-tech', name: 'テック ロゴ', category: 'ロゴ', w: 500, h: 500, bg: '#0b1b33',
    build: () => [
      S('hexagon', 185, 100, 130, '#22d3ee'),
      Ci(250, 165, 24, '#0b1b33'),
      T('nexora', 50, 280, 400, 76, { font: 'Poppins', weight: 700, fill: '#ffffff', align: 'center' }),
      T('CLOUD SOLUTIONS', 50, 370, 400, 20, { font: 'Montserrat', weight: 400, fill: '#22d3ee', align: 'center', spacing: 400 }),
    ] },
  { id: 'lgx-wa', name: '和風 ロゴ', category: 'ロゴ', w: 500, h: 500, bg: '#efe8d8',
    build: () => [
      R(150, 90, 200, 200, '#b91c1c', 8),
      T('梅\n屋', 150, 105, 200, 84, { font: 'Shippori Mincho', weight: 800, fill: '#efe8d8', align: 'center', lh: 1.0 }),
      T('うめや', 50, 330, 400, 56, { font: 'Shippori Mincho', weight: 800, fill: '#27241b', align: 'center', spacing: 400 }),
      T('UMEYA  Japanese Sweets', 50, 410, 400, 18, { font: 'Montserrat', weight: 400, fill: '#6b6552', align: 'center', spacing: 200 }),
    ] },
  { id: 'lgx-fit', name: 'フィットネス ロゴ', category: 'ロゴ', w: 500, h: 500, bg: '#111111',
    build: () => [
      S('parallelogram', 130, 120, 110, '#d9f99d'), S('parallelogram', 260, 120, 110, '#d9f99d'),
      R(210, 160, 80, 24, '#d9f99d'),
      T('IRON', 50, 270, 400, 100, { font: 'Bebas Neue', weight: 400, fill: '#ffffff', align: 'center', spacing: 200 }),
      T('FITNESS CLUB', 50, 385, 400, 24, { font: 'Oswald', weight: 700, fill: '#d9f99d', align: 'center', spacing: 500 }),
    ] },
  // ---------- はがき・招待状 ----------
  { id: 'pcx-newyear', name: '年賀状', category: 'はがき・招待状', w: 591, h: 874, bg: '#fff8e7',
    build: () => [
      Ci(295, 800, 260, '#fde68a'), S('star8', 420, 70, 100, '#dc2626'),
      T('謹賀\n新年', 60, 90, 300, 130, { font: 'Shippori Mincho', weight: 800, fill: '#b91c1c', lh: 1.1 }),
      T('2027', 60, 380, 471, 90, { font: 'Bebas Neue', weight: 400, fill: '#92400e', align: 'center', spacing: 300 }),
      T('旧年中は大変お世話になりました\n本年もよろしくお願いいたします', 60, 520, 471, 22, { font: 'Shippori Mincho', weight: 700, fill: '#7c2d12', align: 'center', lh: 1.9 }),
      T('令和九年 元旦', 60, 780, 471, 22, { font: 'Shippori Mincho', weight: 400, fill: '#7c2d12', align: 'center' }),
    ] },
  { id: 'pcx-wedding', name: 'ウェディング 招待状', category: 'はがき・招待状', w: 591, h: 874, bg: '#fbf7f0',
    build: () => [
      R(40, 40, 511, 794, '', 0, { stroke: '#c9a96e', strokeWidth: 2 }),
      T('We are getting married', 60, 130, 471, 36, { font: 'Playfair Display', weight: 400, fill: '#8a6d3b', align: 'center' }),
      T('Hiroto\n&\nMio', 60, 220, 471, 84, { font: 'Playfair Display', weight: 400, fill: '#4b4033', align: 'center', lh: 1.15 }),
      R(265, 530, 60, 2, '#c9a96e'),
      T('2027年5月22日(土) 15:00\nホテル サンプル 2F 「ローズ」', 60, 580, 471, 22, { font: 'Shippori Mincho', weight: 400, fill: '#4b4033', align: 'center', lh: 1.9 }),
      T('お返事は 4月10日までに\nご連絡ください', 60, 710, 471, 18, { font: 'Shippori Mincho', weight: 400, fill: '#8a6d3b', align: 'center', lh: 1.8 }),
    ] },
  { id: 'pcx-party', name: 'パーティー 招待', category: 'はがき・招待状', w: 591, h: 874, bg: ['#fb7185', '#f59e0b', 160],
    build: () => [
      Ci(500, 140, 110, 'rgba(255,255,255,0.2)'), Ci(90, 760, 90, 'rgba(255,255,255,0.2)'),
      S('star5', 60, 70, 60, '#fde047'),
      T("YOU'RE\nINVITED!", 60, 200, 471, 90, { font: 'Dela Gothic One', weight: 400, fill: '#ffffff', align: 'center', lh: 1.1 }),
      R(60, 470, 471, 230, '#ffffff', 28),
      T('ゆうなの誕生日会', 60, 505, 471, 34, { font: 'Mochiy Pop One', weight: 400, fill: '#e11d48', align: 'center' }),
      T('8/23(土) 13:00〜\nサンプル公園 BBQ広場', 60, 570, 471, 24, { weight: 700, fill: '#44403c', align: 'center', lh: 1.7 }),
      T('ご連絡は 000-0000-0000 まで', 60, 770, 471, 20, { weight: 500, fill: '#ffffff', align: 'center' }),
    ] },
]
