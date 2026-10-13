import type { Template } from '../templates'
import { T, R, Ci } from './kit'

const C = 'LINE'

export const LINE_TEMPLATES: Template[] = [
  { id: 'lnx-salon4', name: 'サロン 4分割', category: C, w: 2500, h: 1686, bg: '#f7ede8',
    build: () => [['ご予約', 'RESERVE', '#c98b76'], ['メニュー', 'MENU', '#a0604a'], ['スタイル', 'STYLE', '#a0604a'], ['クーポン', 'COUPON', '#c98b76']].flatMap(([t, e, c], i) => {
      const x = (i % 2) * 1250, y = Math.floor(i / 2) * 843
      return [
        R(x + 40, y + 40, 1170, 763, c, 40),
        T(e, x + 40, y + 280, 1170, 70, { font: 'Montserrat', weight: 700, fill: 'rgba(255,255,255,0.75)', align: 'center', spacing: 500 }),
        T(t, x + 40, y + 390, 1170, 130, { font: 'Zen Maru Gothic', weight: 900, fill: '#ffffff', align: 'center' }),
      ]
    }) },
  { id: 'lnx-cafe3', name: 'カフェ 3分割(上1下2)', category: C, w: 2500, h: 1686, bg: '#3d2b1f',
    build: () => [
      R(40, 40, 2420, 763, '#f3e9dc', 40),
      Ci(2000, 420, 260, '#e3cfb4'),
      T('Cafe Mori', 160, 230, 1700, 190, { font: 'Pacifico', weight: 400, fill: '#5e3023' }),
      T('今日のおすすめ・ご予約はこちら', 160, 500, 1700, 80, { weight: 700, fill: '#7c4a1d' }),
      ...[['メニュー', '#c08552'], ['アクセス', '#a47551']].flatMap(([t, c], i) => [
        R(40 + i * 1220, 843, 1200, 803, c, 40),
        T(t, 40 + i * 1220, 1170, 1200, 120, { font: 'Zen Maru Gothic', weight: 900, fill: '#ffffff', align: 'center' }),
      ]),
    ] },
  { id: 'lnx-biz6', name: '店舗 6分割(シンプル)', category: C, w: 2500, h: 1686, bg: '#0f172a',
    build: () => ['新着情報', 'サービス', 'ご予約', '料金', 'よくある質問', 'お問い合わせ'].flatMap((t, i) => {
      const x = (i % 3) * 833, y = Math.floor(i / 3) * 843
      return [
        R(x + 30, y + 30, 773, 783, '#1e293b', 32),
        T(String(i + 1).padStart(2, '0'), x + 30, y + 250, 773, 90, { font: 'Montserrat', weight: 900, fill: '#38bdf8', align: 'center' }),
        T(t, x + 30, y + 400, 773, 90, { fill: '#f1f5f9', align: 'center' }),
      ]
    }) },
]
