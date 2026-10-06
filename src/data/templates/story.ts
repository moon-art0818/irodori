import type { Template } from '../templates'
import { T, R, Ci, S, PH, SH } from './kit'

const C = 'ストーリー'

export const STORY_TEMPLATES: Template[] = [
  { id: 'stx-sale', name: 'タイムセール', category: C, w: 1080, h: 1920, bg: '#e11d48',
    build: () => [
      Ci(900, 300, 320, '#fb7185'), Ci(100, 1700, 360, '#be123c'),
      T('TIME SALE', 100, 400, 880, 80, { font: 'Bebas Neue', weight: 400, fill: '#fecdd3', spacing: 500 }),
      T('24時間\n限定', 100, 520, 880, 240, { font: 'Dela Gothic One', weight: 400, fill: '#ffffff', lh: 1.05 }),
      S('burst', 560, 900, 420, '#fde047'),
      T('全品\n30%\nOFF', 600, 990, 340, 90, { font: 'Dela Gothic One', weight: 400, fill: '#9f1239', align: 'center', lh: 1.0 }),
      T('本日23:59まで\nオンラインストアで開催中', 100, 1450, 880, 48, { weight: 700, fill: '#ffffff', lh: 1.6 }),
      R(100, 1640, 880, 120, '#ffffff', 60),
      T('今すぐチェック', 100, 1672, 880, 52, { fill: '#e11d48', align: 'center' }),
    ] },
  { id: 'stx-new', name: '新商品ティザー', category: C, w: 1080, h: 1920, bg: ['#111827', '#374151', 90],
    build: () => [
      ...PH(160, 380, 760, 760, 380, '#4b5563'),
      T('COMING SOON', 100, 220, 880, 50, { font: 'Montserrat', weight: 700, fill: '#fbbf24', align: 'center', spacing: 500 }),
      T('10.15', 100, 1220, 880, 200, { font: 'Bebas Neue', weight: 400, fill: '#ffffff', align: 'center' }),
      T('あの定番が、生まれ変わる。', 100, 1480, 880, 52, { font: 'Shippori Mincho', weight: 700, fill: '#e5e7eb', align: 'center' }),
      T('お楽しみに', 100, 1600, 880, 36, { weight: 400, fill: '#9ca3af', align: 'center', spacing: 300 }),
    ] },
  { id: 'stx-cafe', name: 'カフェ 営業案内', category: C, w: 1080, h: 1920, bg: '#f3e9dc',
    build: () => [
      Ci(540, 560, 360, '#e3cfb4'), Ci(540, 560, 300, '#3d2b1f'),
      T('cafe\nnoel', 240, 440, 600, 140, { font: 'Pacifico', weight: 400, fill: '#f3e9dc', align: 'center', lh: 1.1 }),
      T('OPEN', 100, 1100, 880, 60, { font: 'Montserrat', weight: 700, fill: '#c08552', align: 'center', spacing: 600 }),
      T('9:00 - 18:00', 100, 1190, 880, 100, { font: 'Oswald', weight: 700, fill: '#3d2b1f', align: 'center' }),
      T('水曜定休\nモーニング 〜11:00', 100, 1360, 880, 46, { weight: 500, fill: '#5e3023', align: 'center', lh: 1.7 }),
      T('@cafe_noel_sample', 100, 1700, 880, 36, { font: 'Montserrat', weight: 400, fill: '#8b6b4f', align: 'center' }),
    ] },
  { id: 'stx-countdown', name: 'カウントダウン', category: C, w: 1080, h: 1920, bg: ['#4c1d95', '#be185d', 160],
    build: () => [
      Ci(540, 820, 400, 'rgba(255,255,255,0.1)'), Ci(540, 820, 320, 'rgba(255,255,255,0.12)'),
      T('開催まで', 100, 300, 880, 60, { weight: 700, fill: '#fbcfe8', align: 'center', spacing: 300 }),
      T('3', 100, 560, 880, 520, { font: 'Bebas Neue', weight: 400, fill: '#ffffff', align: 'center' }),
      T('DAYS', 100, 1160, 880, 80, { font: 'Montserrat', weight: 900, fill: '#fde047', align: 'center', spacing: 600 }),
      T('秋のライブイベント\n10.25 SAT OPEN 17:00', 100, 1400, 880, 54, { weight: 700, fill: '#ffffff', align: 'center', lh: 1.6 }),
    ] },
  { id: 'stx-qa', name: '質問募集 Q&A', category: C, w: 1080, h: 1920, bg: '#ecfdf5',
    build: () => [
      Ci(540, 560, 240, '#34d399'),
      T('Q', 300, 380, 480, 360, { font: 'Poppins', weight: 900, fill: '#ffffff', align: 'center' }),
      T('質問、\n受け付けます', 100, 880, 880, 130, { font: 'Zen Maru Gothic', weight: 900, fill: '#064e3b', align: 'center', lh: 1.25 }),
      T('お仕事のこと・ご飯のこと\n何でもどうぞ!', 100, 1180, 880, 50, { weight: 500, fill: '#047857', align: 'center', lh: 1.7 }),
      R(190, 1420, 700, 190, '#ffffff', 40, { stroke: '#34d399', strokeWidth: 4 }),
      T('↓ 質問ボックスをここに配置 ↓', 190, 1488, 700, 38, { weight: 500, fill: '#6b7280', align: 'center' }),
    ] },
  { id: 'stx-travel', name: '旅の思い出', category: C, w: 1080, h: 1920, bg: '#fef3c7',
    build: () => [
      R(120, 220, 840, 1000, '#ffffff', 8, { angle: -3, ...SH(0.15, 40, 16) }),
      ...PH(170, 270, 740, 760, 4, '#e5e7eb'),
      T('Kyoto, 2026.10', 180, 1070, 720, 60, { font: 'Pacifico', weight: 400, fill: '#92400e' }),
      T('紅葉の嵐山で\nゆっくり歩いた一日', 120, 1380, 840, 62, { font: 'Klee One', weight: 600, fill: '#78350f', align: 'center', lh: 1.6 }),
      T('#週末旅 #京都', 120, 1640, 840, 38, { weight: 500, fill: '#b45309', align: 'center' }),
    ] },
  { id: 'stx-minimal', name: 'ミニマル ひとこと', category: C, w: 1080, h: 1920, bg: '#fafafa',
    build: () => [
      R(100, 160, 60, 6, '#111111'),
      T('Less,\nbut better.', 100, 700, 880, 150, { font: 'Playfair Display', weight: 400, fill: '#111111', lh: 1.15 }),
      T('少ないほうが、\nうまくいく。', 100, 1060, 880, 64, { font: 'Shippori Mincho', weight: 400, fill: '#525252', lh: 1.7 }),
      T('@minimal_note', 100, 1700, 880, 32, { font: 'Montserrat', weight: 400, fill: '#a3a3a3', spacing: 200 }),
    ] },
  { id: 'stx-gym', name: 'ジム 今日のメニュー', category: C, w: 1080, h: 1920, bg: '#09090b',
    build: () => [
      T('TODAY', 100, 200, 880, 60, { font: 'Oswald', weight: 700, fill: '#bef264', spacing: 500 }),
      T('WORKOUT', 100, 280, 880, 170, { font: 'Bebas Neue', weight: 400, fill: '#ffffff' }),
      ...['スクワット  3 × 12', 'ベンチプレス  3 × 10', 'デッドリフト  3 × 8', 'プランク  60秒 × 3'].flatMap((t, i) => [
        R(100, 620 + i * 230, 880, 180, '#18181b', 24),
        T(String(i + 1).padStart(2, '0'), 140, 665 + i * 230, 140, 90, { font: 'Oswald', weight: 700, fill: '#bef264' }),
        T(t, 300, 685 + i * 230, 650, 50, { fill: '#fafafa' }),
      ]),
    ] },
]
