import type { Template } from '../templates'
import { T, R, Ci, S, PH, SH } from './kit'

const C = 'Instagram 縦'

export const INSTAGRAM_PORTRAIT_TEMPLATES: Template[] = [
  { id: 'igp-product', name: '商品紹介', category: C, w: 1080, h: 1350, bg: '#f5f0e8',
    build: () => [
      ...PH(90, 90, 900, 760, 40),
      T('NEW ARRIVAL', 90, 910, 900, 36, { font: 'Montserrat', weight: 700, fill: '#a16207', spacing: 400 }),
      T('手織りリネン\nブランケット', 90, 975, 900, 80, { font: 'Shippori Mincho', weight: 700, fill: '#3b2f1e', lh: 1.3 }),
      T('¥12,800', 90, 1210, 400, 64, { font: 'Playfair Display', weight: 700, fill: '#3b2f1e' }),
      T('全3色 / 送料無料', 530, 1232, 460, 34, { weight: 500, fill: '#78716c', align: 'right' }),
    ] },
  { id: 'igp-recipe', name: 'レシピ カード', category: C, w: 1080, h: 1350, bg: '#fefce8',
    build: () => [
      ...PH(0, 0, 1080, 640, 0),
      R(90, 560, 900, 150, '#ffffff', 30, SH(0.1)),
      T('10分で作れる\nとろとろ親子丼', 130, 585, 820, 50, { weight: 900, fill: '#422006', lh: 1.35 }),
      T('材料(2人分)', 90, 780, 900, 40, { weight: 700, fill: '#ca8a04' }),
      T('鶏もも肉 1枚 / 卵 3個 / 玉ねぎ 1/2個\nめんつゆ 大さじ3 / 水 100ml', 90, 840, 900, 38, { weight: 400, fill: '#44403c', lh: 1.8 }),
      T('作り方', 90, 1030, 900, 40, { weight: 700, fill: '#ca8a04' }),
      T('① 具材を煮る  ② 卵を2回に分けて回し入れる\n③ 半熟で火を止めてごはんにのせる', 90, 1090, 900, 38, { weight: 400, fill: '#44403c', lh: 1.8 }),
    ] },
  { id: 'igp-interview', name: 'お客様の声', category: C, w: 1080, h: 1350, bg: ['#e0f2fe', '#ffffff', 90],
    build: () => [
      T('VOICE', 90, 100, 600, 40, { font: 'Montserrat', weight: 700, fill: '#0284c7', spacing: 500 }),
      T('お客様の声', 90, 160, 900, 80, { weight: 900, fill: '#0c4a6e' }),
      ...PH(90, 320, 300, 300, 150),
      T('M.Sさん\n30代・会社員', 440, 400, 550, 44, { weight: 700, fill: '#0c4a6e', lh: 1.5 }),
      S('bubbleRound', 90, 700, 900, '#ffffff', SH(0.08)),
      T('「相談から施工まで丁寧で、\n想像以上の仕上がりに\n大満足です!」', 170, 780, 740, 50, { weight: 700, fill: '#0c4a6e', lh: 1.6 }),
      T('★★★★★', 90, 1210, 900, 54, { weight: 400, fill: '#f59e0b', align: 'center', spacing: 100 }),
    ] },
  { id: 'igp-travel', name: '旅行 おすすめスポット', category: C, w: 1080, h: 1350, bg: '#0e3b43',
    build: () => [
      ...PH(90, 90, 900, 700, 360, '#2a5f68'),
      T('TRAVEL NOTE', 90, 850, 900, 34, { font: 'Montserrat', weight: 700, fill: '#f6c177', spacing: 500 }),
      T('冬の北海道\n小樽ぶらり旅', 90, 910, 900, 88, { font: 'Zen Maru Gothic', weight: 900, fill: '#ffffff', lh: 1.25 }),
      R(90, 1140, 90, 5, '#f6c177'),
      T('運河・ガラス工房・海鮮丼\n1泊2日モデルコースをご紹介', 90, 1180, 900, 36, { weight: 400, fill: '#c7e0e4', lh: 1.7 }),
    ] },
  { id: 'igp-wa', name: '和風 茶会のご案内', category: C, w: 1080, h: 1350, bg: '#f3ede0',
    build: () => [
      Ci(540, 400, 220, '#b91c1c'),
      T('茶\n会', 330, 270, 420, 150, { font: 'Shippori Mincho', weight: 800, fill: '#f3ede0', align: 'center', lh: 1.05 }),
      R(160, 760, 760, 2, '#3f3f46'),
      T('秋の野点', 90, 820, 900, 80, { font: 'Shippori Mincho', weight: 800, fill: '#27272a', align: 'center', spacing: 300 }),
      T('十月十八日(土)午前十時より\n庭園にてお待ち申し上げます', 90, 950, 900, 40, { font: 'Shippori Mincho', weight: 400, fill: '#3f3f46', align: 'center', lh: 1.9 }),
      T('参加費 二千円(お菓子付)', 90, 1180, 900, 34, { font: 'Shippori Mincho', weight: 700, fill: '#b91c1c', align: 'center' }),
    ] },
  { id: 'igp-nordic', name: '北欧 ワークショップ', category: C, w: 1080, h: 1350, bg: '#f4f1ea',
    build: () => [
      S('arch', 90, 110, 420, '#5b7c99'), S('halfCircle', 560, 330, 260, '#e9b872'), Ci(880, 190, 90, '#c7d3c0'),
      T('Workshop', 90, 640, 900, 100, { font: 'Poppins', weight: 700, fill: '#2f3e4e' }),
      T('はじめての\n木のスプーン作り', 90, 770, 900, 70, { font: 'Zen Kaku Gothic New', weight: 700, fill: '#2f3e4e', lh: 1.35 }),
      R(90, 980, 900, 2, '#c8c2b4'),
      T('11/9 (日) 13:00-16:00\n定員6名 / 材料費込み ¥4,500', 90, 1030, 900, 38, { weight: 400, fill: '#4b5563', lh: 1.8 }),
      T('studio-kinoko.example.com', 90, 1230, 900, 28, { font: 'Poppins', weight: 400, fill: '#5b7c99' }),
    ] },
]
