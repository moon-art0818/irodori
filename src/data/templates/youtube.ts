import type { Template } from '../templates'
import { T, R, Ci, S, PH } from './kit'

const C = 'YouTube サムネイル'

export const YOUTUBE_TEMPLATES: Template[] = [
  { id: 'ytx-howto', name: '解説・ハウツー', category: C, w: 1280, h: 720, bg: '#0f172a',
    build: () => [
      R(0, 0, 14, 720, '#38bdf8'),
      ...PH(740, 90, 450, 540, 32, '#1e293b'),
      T('初心者向け', 90, 100, 560, 56, { weight: 900, fill: '#38bdf8' }),
      T('30分で\nわかる\nExcel', 90, 190, 620, 140, { weight: 900, fill: '#ffffff', lh: 1.1 }),
      R(90, 620, 340, 4, '#facc15'),
    ] },
  { id: 'ytx-game', name: 'ゲーム実況', category: C, w: 1280, h: 720, bg: ['#1e1b4b', '#7c3aed', 135],
    build: () => [
      S('lightning', 900, 80, 260, '#facc15'),
      T('#12', 80, 70, 300, 120, { font: 'Bebas Neue', weight: 400, fill: '#c4b5fd' }),
      T('ついに\nラスボス\n撃破!?', 80, 200, 800, 150, { font: 'Dela Gothic One', weight: 400, fill: '#ffffff', lh: 1.1 }),
      R(80, 600, 420, 70, '#facc15', 12),
      T('完全ノーダメ挑戦', 80, 612, 420, 40, { fill: '#1e1b4b', align: 'center' }),
    ] },
  { id: 'ytx-cook', name: '料理レシピ', category: C, w: 1280, h: 720, bg: '#fff7ed',
    build: () => [
      Ci(960, 360, 300, '#fdba74'),
      ...PH(710, 110, 500, 500, 250, '#fed7aa'),
      T('材料3つ!', 80, 100, 560, 64, { weight: 900, fill: '#ea580c' }),
      T('とろける\n絶品\nプリン', 80, 190, 600, 130, { font: 'Mochiy Pop One', weight: 400, fill: '#431407', lh: 1.15 }),
      T('レンジで5分', 80, 600, 500, 52, { weight: 900, fill: '#ffffff', bg: '#ea580c' }),
    ] },
  { id: 'ytx-review', name: '商品レビュー', category: C, w: 1280, h: 720, bg: '#f1f5f9',
    build: () => [
      R(0, 0, 1280, 190, '#dc2626'),
      T('正直レビュー', 80, 40, 800, 110, { font: 'Dela Gothic One', weight: 400, fill: '#ffffff' }),
      ...PH(80, 260, 520, 380, 28),
      T('買って\nよかった?', 680, 270, 540, 110, { weight: 900, fill: '#0f172a', lh: 1.15 }),
      T('1ヶ月使った本音', 680, 540, 540, 46, { weight: 700, fill: '#dc2626' }),
    ] },
  { id: 'ytx-biz', name: 'ビジネス解説', category: C, w: 1280, h: 720, bg: '#0b132b',
    build: () => [
      R(0, 520, 1280, 200, '#facc15'),
      T('年収が上がる人の', 80, 90, 1120, 64, { weight: 700, fill: '#facc15' }),
      T('仕事術\nTOP3', 80, 180, 900, 190, { font: 'Dela Gothic One', weight: 400, fill: '#ffffff', lh: 1.05 }),
      S('arrowU', 980, 120, 220, '#22c55e'),
      T('現役マネージャーが解説', 80, 575, 1120, 60, { weight: 900, fill: '#0b132b' }),
    ] },
  { id: 'ytx-vlog2', name: '日常Vlog ミニマル', category: C, w: 1280, h: 720, bg: '#e7e5e4',
    build: () => [
      ...PH(80, 80, 1120, 560, 12, '#d6d3d1'),
      R(80, 480, 700, 160, '#fafaf9', 0),
      T('A Day in My Life', 120, 505, 640, 56, { font: 'Playfair Display', weight: 400, fill: '#292524' }),
      T('一人暮らしの休日ルーティン', 120, 575, 640, 36, { weight: 500, fill: '#57534e' }),
    ] },
  { id: 'ytx-edu', name: '学習 勉強法', category: C, w: 1280, h: 720, bg: '#16a34a',
    build: () => [
      R(80, 80, 1120, 560, '#ffffff', 36),
      S('check', 120, 130, 120, '#16a34a'),
      T('東大生の', 280, 140, 880, 64, { weight: 900, fill: '#16a34a' }),
      T('最強の\n暗記術', 120, 270, 780, 160, { font: 'Dela Gothic One', weight: 400, fill: '#14532d', lh: 1.1 }),
      T('たった3ステップ', 120, 540, 700, 56, { weight: 900, fill: '#ffffff', bg: '#16a34a' }),
      S('star5', 960, 360, 190, '#fbbf24'),
    ] },
  { id: 'ytx-travel', name: '旅行 まとめ', category: C, w: 1280, h: 720, bg: ['#0ea5e9', '#e0f2fe', 90],
    build: () => [
      Ci(1000, 140, 90, '#fde047'),
      T('Okinawa', 80, 80, 800, 150, { font: 'Pacifico', weight: 400, fill: '#ffffff' }),
      T('2泊3日\n総額5万円台', 80, 290, 900, 130, { font: 'M PLUS Rounded 1c', weight: 900, fill: '#0c4a6e', lh: 1.15 }),
      T('完全プラン公開', 80, 580, 600, 56, { weight: 900, fill: '#ffffff', bg: '#0c4a6e' }),
    ] },
]
