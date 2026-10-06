import type { Template } from '../templates'
import { T, R, Ci, PH, SH } from './kit'

const C = 'X(Twitter)'

export const X_TEMPLATES: Template[] = [
  { id: 'xx-campaign', name: 'フォロー&RT キャンペーン', category: C, w: 1600, h: 900, bg: '#fde047',
    build: () => [
      Ci(1400, 200, 320, '#facc15'), Ci(200, 800, 220, '#fef08a'),
      R(100, 100, 360, 70, '#111827', 35),
      T('PRESENT', 100, 118, 360, 34, { font: 'Montserrat', weight: 900, fill: '#fde047', align: 'center', spacing: 300 }),
      T('フォロー&RTで\n豪華賞品が当たる!', 100, 230, 1000, 110, { weight: 900, fill: '#111827', lh: 1.25 }),
      T('抽選で3名様に\nギフトカード 5,000円分', 100, 560, 1000, 52, { weight: 700, fill: '#422006', lh: 1.6 }),
      T('応募〆切 11/30(日) 23:59', 100, 740, 1000, 38, { weight: 500, fill: '#422006' }),
    ] },
  { id: 'xx-news', name: 'リリース告知', category: C, w: 1600, h: 900, bg: '#0f172a',
    build: () => [
      ...PH(920, 120, 580, 660, 36, '#1e293b'),
      T('NEWS', 100, 130, 600, 40, { font: 'Montserrat', weight: 700, fill: '#38bdf8', spacing: 500 }),
      T('新アプリ\n本日リリース', 100, 220, 760, 120, { weight: 900, fill: '#ffffff', lh: 1.2 }),
      R(100, 540, 100, 6, '#38bdf8'),
      T('iOS / Android 両対応\nApp Store・Google Play で配信中', 100, 600, 760, 40, { weight: 400, fill: '#94a3b8', lh: 1.7 }),
    ] },
  { id: 'xx-event', name: 'イベント登壇', category: C, w: 1600, h: 900, bg: '#f5f3ff',
    build: () => [
      R(0, 0, 1600, 220, '#7c3aed'),
      T('SPEAKER', 100, 80, 700, 56, { font: 'Montserrat', weight: 900, fill: '#ddd6fe', spacing: 500 }),
      ...PH(100, 320, 400, 400, 200, '#e5e7eb'),
      T('明日のAI活用を\n考える会', 580, 320, 900, 96, { weight: 900, fill: '#2e1065', lh: 1.25 }),
      T('登壇:中村 里奈(株式会社サンプル)\n11/14(金) 19:00 オンライン / 参加無料', 580, 580, 920, 38, { weight: 500, fill: '#4c1d95', lh: 1.8 }),
    ] },
  { id: 'xx-quote', name: '今日のひとこと', category: C, w: 1600, h: 900, bg: ['#f0abfc', '#818cf8', 120],
    build: () => [
      R(100, 100, 1400, 700, 'rgba(255,255,255,0.9)', 48, SH(0.15, 40, 14)),
      T('“', 180, 130, 200, 240, { font: 'Playfair Display', weight: 700, fill: '#a855f7' }),
      T('続けた人だけが\n見られる景色がある。', 220, 330, 1160, 100, { font: 'Shippori Mincho', weight: 700, fill: '#2e1065', lh: 1.5 }),
      T('@sample_account', 220, 680, 1160, 34, { font: 'Montserrat', weight: 400, fill: '#7e22ce', align: 'right' }),
    ] },
]
