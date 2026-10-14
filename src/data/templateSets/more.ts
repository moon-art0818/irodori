import type { FabricObject } from 'fabric'
import type { Template, TemplatePage, TemplateBg } from '../templates'
import { T, R, Ci, S, PH } from '../templates/kit'
import { makeChart, makeTable } from '../../editor/elements'

// 追加テンプレートセット 20種(履歴書・求人・不動産・飲食・美容・学習塾・クリニック・カレンダー・ウェディング・EC・ポッドキャスト・
// 自治体・子ども・ジム・IR・リリースノート・レシピ・旅館・ライブ・学習ノート)。1セット = 1 Template、2ページ目以降は more。
const pg = (label: string, bg: TemplateBg, build: () => FabricObject[]): TemplatePage => ({ label, bg, build })
const mkSet = (id: string, name: string, category: string, w: number, h: number, tags: string[], pages: TemplatePage[]): Template => ({
  id, name, category, w, h, tags, bg: pages[0].bg, build: pages[0].build, more: pages.slice(1),
})
const MINCHO = 'Shippori Mincho'
const MONT = 'Montserrat'
const BEBAS = 'Bebas Neue'

interface Pal { main: string; acc: string; pale: string; ink: string; mid: string; line: string }
/** A4 系の共通ヘッダー・フッター(ブランド名・章名・ページ番号) */
const hf = (p: Pal, W: number, H: number, brand: string, n: number, sec: string, m = 100, ff = MONT): FabricObject[] => [
  T(brand, m, 56, W / 2, 22, { font: ff, weight: 700, fill: p.mid, spacing: 200 }),
  T(sec, W / 2, 56, W / 2 - m, 22, { weight: 500, fill: p.mid, align: 'right' }),
  R(m, 98, W - 2 * m, 2, p.main),
  R(m, H - 112, W - 2 * m, 1, p.line),
  T(String(n).padStart(2, '0'), m, H - 92, 120, 26, { font: ff, weight: 700, fill: p.main }),
]
/** 見出し(英字ラベル + 日本語タイトル) */
const ttl = (p: Pal, en: string, ja: string, y = 150, m = 100, W = 1240, font = 'Noto Sans JP', size = 64): FabricObject[] => [
  T(en, m, y, W - 2 * m, 24, { font: MONT, weight: 700, fill: p.acc, spacing: 300 }),
  T(ja, m, y + 42, W - 2 * m, size, { font, weight: 800, fill: p.main, lh: 1.3 }),
]
/** ラベル + 値の行(項目表)。rows = [[ラベル, 値], ...] */
const fieldRows = (p: Pal, x: number, y: number, wl: number, wv: number, rh: number, rows: string[][], size = 26, font = 'Noto Sans JP'): FabricObject[] =>
  rows.flatMap(([l, v], i) => [
    R(x, y + i * rh, wl + wv, 1, p.line),
    T(l, x, y + i * rh + (rh - size * 1.3) / 2, wl - 20, size - 3, { weight: 700, fill: p.mid }),
    T(v, x + wl, y + i * rh + (rh - size * 1.3) / 2, wv, size, { weight: 500, fill: p.ink, font, lh: 1.3 }),
  ]).concat([R(x, y + rows.length * rh, wl + wv, 1, p.line)])
/** 地図のピン(円 + 白い芯) */
const pin = (x: number, y: number, size: number, fill: string): FabricObject[] => [Ci(x + size / 2, y + size / 2, size / 2, fill), Ci(x + size / 2, y + size / 2, size / 5, '#ffffff')]

// =====================================================================
// 1. 履歴書・職務経歴書(A4 縦 / ネイビー + ミント / しっぽり明朝 + Noto Sans JP)
// =====================================================================
const RS: Pal = { main: '#1e3a5f', acc: '#2f9a8c', pale: '#f1f4f7', ink: '#1f2937', mid: '#586273', line: '#d5dbe3' }
const rsHF = (n: number, sec: string) => hf(RS, 1240, 1754, 'RESUME  /  YAMAMOTO HARUKA', n, sec)
const rsTitle = (en: string, ja: string, y = 150) => ttl(RS, en, ja, y, 100, 1240, MINCHO)
const RESUME = mkSet('mx-resume', '履歴書・職務経歴書セット', '履歴書・職務経歴書', 1240, 1754,
  ['履歴書', '職務経歴書', '転職', '就職活動', 'A4', 'キャリア'], [
  pg('表紙', RS.main, () => [
    R(100, 150, 80, 8, RS.acc),
    T('RESUME & CAREER SUMMARY', 100, 190, 900, 24, { font: MONT, weight: 700, fill: '#b8c7d9', spacing: 300 }),
    T('履歴書\n職務経歴書', 100, 300, 1040, 150, { font: MINCHO, weight: 800, fill: '#ffffff', lh: 1.25 }),
    R(100, 700, 1040, 2, '#4a6585'),
    T('氏名', 100, 740, 200, 24, { weight: 500, fill: '#b8c7d9' }),
    T('山本 春香', 100, 780, 700, 64, { font: MINCHO, weight: 800, fill: '#ffffff' }),
    T('Yamamoto Haruka', 100, 870, 700, 28, { font: MONT, weight: 400, fill: '#b8c7d9', spacing: 100 }),
    T('応募先', 100, 990, 200, 24, { weight: 500, fill: '#b8c7d9' }),
    T('株式会社ミライ工房  営業企画職', 100, 1030, 1040, 36, { weight: 700, fill: '#ffffff' }),
    T('作成日', 100, 1120, 200, 24, { weight: 500, fill: '#b8c7d9' }),
    T('2027年4月1日', 100, 1160, 700, 36, { weight: 700, fill: '#ffffff' }),
    R(100, 1480, 1040, 1, '#4a6585'),
    T('同封書類:履歴書 / 職務経歴書(全10枚)', 100, 1510, 1040, 24, { weight: 400, fill: '#b8c7d9' }),
  ]),
  pg('履歴書:基本情報', '#ffffff', () => [
    ...rsHF(2, '履歴書'),
    T('履 歴 書', 100, 150, 600, 76, { font: MINCHO, weight: 800, fill: RS.main, spacing: 200 }),
    T('2027年4月1日 現在', 700, 190, 440, 26, { weight: 500, fill: RS.mid, align: 'right' }),
    ...PH(840, 280, 300, 400, 6),
    T('写真(縦40×横30mm)', 840, 700, 300, 22, { weight: 400, fill: RS.mid, align: 'center' }),
    ...fieldRows(RS, 100, 280, 200, 520, 100, [['ふりがな', 'やまもと はるか'], ['氏名', '山本 春香'], ['生年月日', '1996年7月12日(満30歳)'], ['性別', '女性'], ['電話番号', '000-0000-0000']]),
    ...fieldRows(RS, 100, 840, 200, 840, 110, [['現住所', '〒000-0000\n東京都サンプル区サンプル町1-2-3 サンプルハイツ201'], ['メール', 'haruka.yamamoto@example.com'], ['連絡先', '現住所に同じ']]),
    T('通勤時間', 100, 1230, 300, 24, { weight: 700, fill: RS.mid }),
    T('約 45 分', 100, 1270, 300, 34, { weight: 700, fill: RS.main }),
    T('扶養家族', 460, 1230, 300, 24, { weight: 700, fill: RS.mid }),
    T('0 人', 460, 1270, 300, 34, { weight: 700, fill: RS.main }),
    T('配偶者', 820, 1230, 300, 24, { weight: 700, fill: RS.mid }),
    T('無', 820, 1270, 300, 34, { weight: 700, fill: RS.main }),
    R(100, 1380, 1040, 200, RS.pale, 6),
    T('本人希望記入欄', 130, 1400, 600, 24, { weight: 700, fill: RS.acc }),
    T('勤務地・職種・勤務時間などの希望は特にありません。貴社の規定に従います。', 130, 1450, 980, 26, { weight: 400, fill: RS.ink, lh: 1.6 }),
  ]),
  pg('履歴書:学歴・職歴', '#ffffff', () => [
    ...rsHF(3, '履歴書'),
    ...rsTitle('HISTORY', '学歴・職歴'),
    ...[
      ['2012', '4', '学歴', true], ['2012', '4', '東京都立サンプル高等学校 入学', false], ['2015', '3', '東京都立サンプル高等学校 卒業', false],
      ['2015', '4', 'サンプル大学 経済学部 入学', false], ['2019', '3', 'サンプル大学 経済学部 卒業', false],
      ['', '', '職歴', true], ['2019', '4', '株式会社アオバ商事 入社(営業部 配属)', false], ['2022', '4', '同社 マーケティング部 へ異動', false],
      ['2025', '3', '一身上の都合により退社', false], ['2025', '4', '株式会社ソラノ食品 入社(販促企画課)', false], ['', '', '現在に至る', false],
    ].flatMap(([y, m, t, head], i) => {
      const yy = 330 + i * 100
      return [
        R(100, yy, 1040, 1, RS.line),
        ...(head ? [R(100, yy + 1, 1040, 99, RS.pale), T(String(t), 100, yy + 32, 1040, 28, { weight: 800, fill: RS.main, align: 'center', spacing: 600 })] : [
          T(String(y), 120, yy + 32, 110, 28, { font: MONT, weight: 700, fill: RS.main }),
          T(String(m), 250, yy + 32, 70, 28, { font: MONT, weight: 700, fill: RS.main, align: 'center' }),
          T(String(t), 350, yy + 32, 780, 28, { weight: 500, fill: RS.ink, align: String(t) === '現在に至る' ? 'left' : 'left' }),
        ]),
      ]
    }),
    R(100, 1430, 1040, 1, RS.line),
    T('以上', 100, 1470, 1040, 28, { weight: 500, fill: RS.ink, align: 'right' }),
    T('年', 120, 290, 110, 22, { weight: 700, fill: RS.mid }), T('月', 250, 290, 70, 22, { weight: 700, fill: RS.mid, align: 'center' }),
  ]),
  pg('履歴書:資格・志望動機', '#ffffff', () => [
    ...rsHF(4, '履歴書'),
    ...rsTitle('LICENSE & MOTIVATION', '免許・資格 / 志望動機'),
    ...fieldRows(RS, 100, 330, 160, 880, 90, [['2016.9', '普通自動車第一種運転免許 取得'], ['2018.12', '日商簿記検定2級 合格'], ['2020.6', 'ウェブ解析士 認定'], ['2023.3', 'TOEIC L&R 780点']], 26),
    T('志望動機', 100, 780, 600, 36, { font: MINCHO, weight: 800, fill: RS.main }),
    R(100, 836, 60, 4, RS.acc),
    R(100, 880, 1040, 560, RS.pale, 6),
    T('前職では販促企画として、地域の食品メーカーの商品を売り場に届ける仕事をしてきました。貴社の「食卓に小さな発見を」という考え方に共感し、これまで培った売り場づくりの経験を、より多くのお客様に新しい商品を届けることに活かしたいと考え、志望いたしました。\n\n入社後は、市場の声を丁寧に集めて企画に反映させ、チームの成果に貢献してまいります。', 140, 920, 960, 26, { weight: 400, fill: RS.ink, lh: 1.85 }),
  ]),
  pg('職務経歴書:要約', RS.pale, () => [
    ...rsHF(5, '職務経歴書'),
    ...rsTitle('CAREER SUMMARY', '職務要約'),
    R(100, 330, 1040, 340, '#ffffff', 6),
    T('営業職として約6年、食品・日用品の法人営業と販促企画に携わってきました。新規取引先の開拓から売り場提案、販売データを用いた改善まで一貫して担当し、直近3年は担当エリアの売上を前年比115%に伸ばしています。', 140, 370, 960, 28, { weight: 400, fill: RS.ink, lh: 1.85 }),
    T('活かせる強み', 100, 730, 600, 36, { font: MINCHO, weight: 800, fill: RS.main }),
    ...[['01', '課題を数字で捉える力', '販売データから売り場の課題を見つけ、仮説を立てて改善する習慣があります。'], ['02', '関係を築く力', '取引先との定例訪問を欠かさず、長期の信頼関係を築いてきました。'], ['03', '最後までやり切る力', '企画から実行、振り返りまでを自分で完結させ、次の改善につなげます。']].flatMap(([n, t, b], i) => [
      R(100 + i * 354, 810, 332, 560, '#ffffff', 6),
      R(100 + i * 354, 810, 332, 8, RS.acc),
      T(n, 130 + i * 354, 860, 200, 64, { font: MONT, weight: 900, fill: RS.acc }),
      T(t, 130 + i * 354, 960, 272, 32, { font: MINCHO, weight: 800, fill: RS.main, lh: 1.4 }),
      T(b, 130 + i * 354, 1070, 272, 24, { weight: 400, fill: RS.ink, lh: 1.7 }),
    ]),
  ]),
  pg('職務経歴書:経歴1', '#ffffff', () => [
    ...rsHF(6, '職務経歴書'),
    ...rsTitle('EXPERIENCE 01', '株式会社ソラノ食品'),
    T('2025年4月 〜 現在  /  販促企画課  /  正社員', 100, 290, 1040, 26, { weight: 500, fill: RS.mid }),
    ...fieldRows(RS, 100, 360, 200, 840, 80, [['事業内容', '冷凍食品・惣菜の製造販売'], ['従業員数', '約 450 名'], ['役職', '主任(メンバー 3 名)']]),
    T('担当業務', 100, 680, 600, 32, { font: MINCHO, weight: 800, fill: RS.main }),
    T('・量販店向けの販促施策の企画と運用\n・新商品の売り場提案資料の作成\n・販促費の予算管理(年間 約 3,000 万円)\n・店頭での販売データの分析と報告', 100, 740, 1040, 26, { weight: 400, fill: RS.ink, lh: 1.9 }),
    T('主な実績', 100, 1010, 600, 32, { font: MINCHO, weight: 800, fill: RS.main }),
    R(100, 1070, 1040, 440, RS.pale, 6),
    ...[['+18%', '担当カテゴリの売上(前年比)'], ['12 社', '新規で獲得した取引先'], ['-15%', '販促費の削減率']].flatMap(([n, l], i) => [
      T(n, 130 + i * 340, 1120, 320, 70, { font: MONT, weight: 900, fill: RS.main }),
      T(l, 130 + i * 340, 1230, 290, 24, { weight: 500, fill: RS.ink, lh: 1.6 }),
    ]),
    T('売り場ごとに反応が違うことに気づき、店舗別の陳列案を作る運用に変えたことで、全体の売上と販促費の両方を改善しました。', 130, 1340, 980, 24, { weight: 400, fill: RS.ink, lh: 1.7 }),
  ]),
  pg('職務経歴書:経歴2', '#ffffff', () => [
    ...rsHF(7, '職務経歴書'),
    ...rsTitle('EXPERIENCE 02', '株式会社アオバ商事'),
    T('2019年4月 〜 2025年3月  /  営業部・マーケティング部  /  正社員', 100, 290, 1040, 26, { weight: 500, fill: RS.mid }),
    ...fieldRows(RS, 100, 360, 200, 840, 80, [['事業内容', '日用品・雑貨の卸売'], ['従業員数', '約 120 名'], ['役職', '一般職']]),
    ...[['2019.4 - 2022.3', '営業部', '小売店約 60 社の法人営業を担当。新規開拓と既存フォローを一人で受け持つ。'], ['2022.4 - 2025.3', 'マーケティング部', '販売データの集計と分析を担当。月次レポートの仕組みを作り、全社に展開。']].flatMap(([d, s, b], i) => [
      R(100, 700 + i * 330, 8, 280, RS.acc),
      T(d, 140, 700 + i * 330, 600, 26, { font: MONT, weight: 700, fill: RS.acc }),
      T(s, 140, 748 + i * 330, 600, 38, { font: MINCHO, weight: 800, fill: RS.main }),
      T(b, 140, 810 + i * 330, 1000, 26, { weight: 400, fill: RS.ink, lh: 1.7 }),
    ]),
    R(100, 1380, 1040, 140, RS.pale, 6),
    T('社内表彰', 130, 1405, 300, 24, { weight: 700, fill: RS.acc }),
    T('2021年度 新規開拓賞 / 2024年度 業務改善賞', 130, 1450, 980, 28, { weight: 500, fill: RS.ink }),
  ]),
  pg('職務経歴書:実績', RS.main, () => [
    ...hf({ ...RS, main: '#ffffff', mid: '#b8c7d9', line: '#3d5a7d' }, 1240, 1754, 'RESUME  /  YAMAMOTO HARUKA', 8, '職務経歴書'),
    T('ACHIEVEMENTS', 100, 150, 800, 24, { font: MONT, weight: 700, fill: '#7fd3c6', spacing: 300 }),
    T('数字で見る6年間の成果', 100, 192, 1040, 64, { font: MINCHO, weight: 800, fill: '#ffffff' }),
    ...[['115', '%', '担当エリア売上(前年比)'], ['72', '社', '新規開拓した取引先'], ['3', '件', '全社展開した改善提案'], ['480', '万円', '年間の販促費削減額']].flatMap(([n, u, l], i) => {
      const x = 100 + (i % 2) * 540, y = 400 + Math.floor(i / 2) * 520
      return [
        R(x, y, 500, 460, '#27496f', 6),
        T(n, x + 40, y + 70, 420, 150, { font: MONT, weight: 900, fill: '#ffffff' }),
        T(u, x + 40, y + 250, 300, 44, { font: MINCHO, weight: 800, fill: '#7fd3c6' }),
        T(l, x + 40, y + 340, 420, 28, { weight: 500, fill: '#dbe5f0', lh: 1.5 }),
      ]
    }),
    T('※ 数値は在職中の担当範囲におけるものです。', 100, 1530, 1040, 22, { weight: 400, fill: '#b8c7d9' }),
  ]),
  pg('職務経歴書:スキル', '#ffffff', () => [
    ...rsHF(9, '職務経歴書'),
    ...rsTitle('SKILLS', '活用できるスキル'),
    ...[['営業・提案', 90], ['データ分析(Excel / スプレッドシート)', 85], ['資料作成(PowerPoint)', 80], ['販促企画', 85], ['英語(日常会話)', 60]].flatMap(([t, v], i) => [
      T(String(t), 100, 340 + i * 150, 760, 28, { weight: 700, fill: RS.ink }),
      T(v + '%', 940, 340 + i * 150, 200, 28, { font: MONT, weight: 700, fill: RS.main, align: 'right' }),
      R(100, 392 + i * 150, 1040, 16, RS.pale, 8),
      R(100, 392 + i * 150, 1040 * (v as number) / 100, 16, i % 2 ? RS.acc : RS.main, 8),
    ]),
    T('使用ツール', 100, 1130, 600, 32, { font: MINCHO, weight: 800, fill: RS.main }),
    ...['Excel', 'Google スプレッドシート', 'PowerPoint', 'Slack', 'Looker Studio', 'kintone'].map((t, i) => {
      const x = 100 + (i % 3) * 354, y = 1200 + Math.floor(i / 3) * 110
      return [R(x, y, 332, 80, RS.pale, 40), T(t, x, y + 24, 332, 26, { weight: 700, fill: RS.main, align: 'center' })]
    }).flat(),
  ]),
  pg('自己PR', RS.pale, () => [
    ...rsHF(10, '自己PR'),
    ...rsTitle('SELF PR', '自己PR'),
    R(100, 330, 1040, 8, RS.acc),
    T('「聞く」から始める提案', 100, 380, 1040, 46, { font: MINCHO, weight: 800, fill: RS.main }),
    T('営業で最も大切にしているのは、提案の前にお客様の話を十分に聞くことです。売り場の担当者との雑談から課題を見つけ、小さな改善を積み重ねて信頼を得てきました。', 100, 470, 1040, 28, { weight: 400, fill: RS.ink, lh: 1.85 }),
    T('「数字で振り返る」習慣', 100, 790, 1040, 46, { font: MINCHO, weight: 800, fill: RS.main }),
    T('施策ごとに目標と結果を記録し、うまくいった理由・いかなかった理由を言葉にして次に活かします。この習慣はチーム全体にも広げました。', 100, 880, 1040, 28, { weight: 400, fill: RS.ink, lh: 1.85 }),
    R(100, 1200, 1040, 300, RS.main, 6),
    T('最後に', 150, 1240, 400, 24, { weight: 700, fill: '#7fd3c6' }),
    T('貴社の一員として、現場の声と数字の両方を大切にしながら、商品が届く先の笑顔をつくる仕事に挑戦したいです。ご検討のほど、よろしくお願い申し上げます。', 150, 1290, 940, 26, { weight: 400, fill: '#ffffff', lh: 1.8 }),
  ]),
])

// =====================================================================
// 2. 求人ポスター・求人票(A4 縦 / イエロー + ブラック / Dela Gothic + Noto Sans JP)
// =====================================================================
const JB: Pal = { main: '#111111', acc: '#f2b600', pale: '#fff6d1', ink: '#1a1a1a', mid: '#6b6b6b', line: '#dcdcdc' }
const jbHF = (n: number, sec: string) => hf(JB, 1240, 1754, 'HATOBA LOGISTICS RECRUIT', n, sec)
const jbTitle = (en: string, ja: string, y = 150) => [
  T(en, 100, y, 800, 24, { font: MONT, weight: 700, fill: '#8a6a00', spacing: 300 }),
  R(100, y + 44, 14, 80, JB.acc),
  T(ja, 140, y + 44, 1000, 64, { font: 'Dela Gothic One', weight: 400, fill: JB.main, lh: 1.3 }),
]
const JOBS = mkSet('mx-jobs', '求人ポスター・求人票セット', '求人・採用', 1240, 1754,
  ['求人', '採用', 'ポスター', '求人票', 'アルバイト', '物流'], [
  pg('ポスター', JB.acc, () => [
    R(60, 60, 1120, 1634, '#ffffff', 0),
    R(60, 60, 1120, 560, JB.main),
    T('WE ARE HIRING', 120, 120, 900, 34, { font: MONT, weight: 900, fill: JB.acc, spacing: 400 }),
    T('一緒に\n運ぶ仲間、\n募集中。', 120, 185, 1000, 108, { font: 'Dela Gothic One', weight: 400, fill: '#ffffff', lh: 1.1 }),
    ...PH(120, 680, 1000, 420, 0, '#d9d9d9'),
    S('star5', 850, 540, 260, JB.acc),
    T('未経験\nOK', 850, 625, 260, 44, { font: 'Dela Gothic One', weight: 400, fill: JB.main, align: 'center', lh: 1.05 }),
    ...['時給 1,350円〜', '週3日・1日4時間からOK', '交通費 全額支給 / 制服貸与'].flatMap((t, i) => [
      R(120, 1150 + i * 92, 18, 62, JB.acc),
      T(t, 160, 1155 + i * 92, 960, 46, { weight: 900, fill: JB.main }),
    ]),
    R(120, 1450, 1000, 200, JB.main),
    T('ハトバ物流株式会社  さくら配送センター', 150, 1480, 940, 28, { weight: 700, fill: JB.acc }),
    T('応募はお電話で  000-0000-0000', 150, 1530, 940, 52, { weight: 900, fill: '#ffffff' }),
  ]),
  pg('ポスター2:職場の魅力', '#ffffff', () => [
    ...jbHF(2, 'POSTER'),
    ...jbTitle('POINT', 'ここが働きやすい!'),
    ...[['SHORT', '短時間OK', '1日4時間から。学校や家事と両立しやすいシフトです。'], ['TEAM', '少人数チーム', '5〜6名で動くので、すぐに名前を覚えてもらえます。'], ['WARM', '倉庫は空調完備', '夏も冬も快適。休憩室にはドリンクサーバーあり。']].flatMap(([en, t, b], i) => [
      R(100, 340 + i * 430, 1040, 390, i % 2 ? JB.pale : '#f4f4f4'),
      T(en, 140, 390 + i * 430, 300, 24, { font: MONT, weight: 900, fill: '#8a6a00', spacing: 300 }),
      T(t, 140, 450 + i * 430, 560, 54, { font: 'Dela Gothic One', weight: 400, fill: JB.main }),
      T(b, 140, 545 + i * 430, 560, 26, { weight: 500, fill: JB.ink, lh: 1.7 }),
      ...PH(760, 370 + i * 430, 340, 330, 0),
    ]),
  ]),
  pg('求人票:募集要項', '#ffffff', () => [
    ...jbHF(3, '求人票'),
    ...jbTitle('JOB OVERVIEW', '募集要項'),
    ...fieldRows(JB, 100, 340, 240, 800, 116, [['職種', '倉庫内スタッフ(仕分け・梱包・検品)'], ['雇用形態', 'アルバイト・パート(社員登用あり)'], ['給与', '時給 1,350円〜(22時以降は 1,690円)'], ['勤務時間', '9:00〜13:00 / 13:00〜17:00 / 17:00〜21:00\nから選べます'], ['勤務地', 'さくら配送センター\n(サンプル県サンプル市サンプル町 4-5-6)'], ['休日', 'シフト制(週3日〜)']]),
    R(100, 1130, 1040, 340, JB.main),
    T('応募資格', 140, 1170, 400, 28, { weight: 900, fill: JB.acc }),
    T('・18歳以上(高校生不可)\n・未経験・ブランクのある方も歓迎\n・週3日以上、長く働ける方', 140, 1225, 960, 28, { weight: 500, fill: '#ffffff', lh: 1.9 }),
  ]),
  pg('仕事内容', '#ffffff', () => [
    ...jbHF(4, '求人票'),
    ...jbTitle('WHAT YOU DO', '仕事内容'),
    ...[['01', '仕分け', '届いた荷物を、行き先ごとのカゴに分けます。バーコードを読み取るだけなので、初日から覚えられます。'], ['02', '梱包', '商品を箱に詰めて、緩衝材を入れ、テープで閉じます。丁寧さが求められる作業です。'], ['03', '検品', '伝票と中身が合っているか確認します。ミスを防ぐ大事なチェックの仕事です。']].flatMap(([n, t, b], i) => [
      T(n, 100, 370 + i * 430, 220, 120, { font: BEBAS, weight: 400, fill: JB.acc }),
      T(t, 330, 390 + i * 430, 600, 54, { font: 'Dela Gothic One', weight: 400, fill: JB.main }),
      T(b, 330, 480 + i * 430, 810, 26, { weight: 500, fill: JB.ink, lh: 1.75 }),
      R(100, 750 + i * 430, 1040, 2, JB.line),
    ]),
  ]),
  pg('1日の流れ', JB.pale, () => [
    ...jbHF(5, '求人票'),
    ...jbTitle('DAILY FLOW', '1日の流れ(午前シフト)'),
    R(250, 380, 4, 1020, JB.main),
    ...[['9:00', '出勤・朝礼', '今日の荷物の量と注意点を共有'], ['9:30', '仕分け作業', 'ペアで荷物を行き先別に分ける'], ['11:00', '梱包・検品', '商品を箱詰めして伝票を確認'], ['12:00', '休憩(45分)', '休憩室でお弁当や軽食を'], ['12:45', '出荷準備', 'トラックへの積み込みを手伝う'], ['13:00', '終礼・退勤', '日報を書いてお疲れさまでした']].flatMap(([t, h, b], i) => [
      Ci(252, 405 + i * 196, 20, JB.acc, { stroke: JB.main, strokeWidth: 4 }),
      T(t, 100, 388 + i * 196, 110, 30, { font: MONT, weight: 900, fill: JB.main, align: 'right' }),
      T(h, 310, 378 + i * 196, 800, 36, { weight: 900, fill: JB.main }),
      T(b, 310, 428 + i * 196, 800, 26, { weight: 400, fill: JB.ink }),
    ]),
  ]),
  pg('待遇・福利厚生', '#ffffff', () => [
    ...jbHF(6, '求人票'),
    ...jbTitle('BENEFITS', '待遇・福利厚生'),
    ...[['交通費', '全額支給'], ['制服', '無料貸与'], ['まかない', 'ドリンク無料'], ['社員登用', '実績で可能'], ['昇給', '年2回'], ['駐車場', '無料完備']].flatMap(([t, b], i) => {
      const x = 100 + (i % 2) * 540, y = 340 + Math.floor(i / 2) * 400
      return [
        R(x, y, 500, 360, i % 3 === 0 ? JB.main : JB.pale),
        T(String(i + 1).padStart(2, '0'), x + 36, y + 30, 120, 30, { font: MONT, weight: 900, fill: i % 3 === 0 ? JB.acc : '#8a6a00' }),
        T(t, x + 36, y + 130, 430, 36, { weight: 700, fill: i % 3 === 0 ? '#d9d9d9' : JB.mid }),
        T(b, x + 36, y + 200, 430, 54, { font: 'Dela Gothic One', weight: 400, fill: i % 3 === 0 ? '#ffffff' : JB.main }),
      ]
    }),
  ]),
  pg('先輩の声', '#ffffff', () => [
    ...jbHF(7, '先輩の声'),
    ...jbTitle('VOICE', '先輩スタッフの声'),
    ...[['田村 さん', '勤務1年 / 大学生', '授業の合間にシフトを入れられるのが助かっています。最初はバーコードの読み取りに戸惑いましたが、先輩が横で見てくれて、1週間で慣れました。'], ['石井 さん', '勤務3年 / 主婦', '子どもが学校に行っている間だけ働いています。急な休みにも「大丈夫だよ」と言ってもらえるので、気持ちが楽です。']].flatMap(([n, s, b], i) => [
      ...PH(100, 340 + i * 600, 300, 360, 0),
      R(100, 340 + i * 600, 12, 360, JB.acc),
      T(n, 450, 340 + i * 600, 690, 48, { font: 'Dela Gothic One', weight: 400, fill: JB.main }),
      T(s, 450, 405 + i * 560, 690, 24, { weight: 700, fill: '#8a6a00' }),
      T(b, 450, 470 + i * 560, 690, 26, { weight: 400, fill: JB.ink, lh: 1.75 }),
    ]),
  ]),
  pg('数字で見る職場', JB.main, () => [
    ...hf({ ...JB, main: JB.acc, mid: '#a9a9a9', line: '#3a3a3a' }, 1240, 1754, 'HATOBA LOGISTICS RECRUIT', 8, 'DATA'),
    T('BY THE NUMBERS', 100, 150, 800, 24, { font: MONT, weight: 700, fill: JB.acc, spacing: 300 }),
    T('数字で見る\nさくら配送センター', 100, 194, 1040, 76, { font: 'Dela Gothic One', weight: 400, fill: '#ffffff', lh: 1.3 }),
    ...[['42', '名', 'スタッフ数'], ['18〜64', '歳', '年齢の幅'], ['2.8', '年', '平均勤続年数'], ['92', '%', '「また働きたい」と答えた割合']].flatMap(([n, u, l], i) => {
      const x = 100 + (i % 2) * 540, y = 520 + Math.floor(i / 2) * 480
      return [
        R(x, y, 500, 440, '#1d1d1d'), R(x, y, 500, 10, JB.acc),
        T(n, x + 40, y + 70, 420, n.length > 3 ? 100 : 140, { font: BEBAS, weight: 400, fill: JB.acc }),
        T(u, x + 40, y + 250, 300, 40, { weight: 900, fill: '#ffffff' }),
        T(l, x + 40, y + 320, 420, 26, { weight: 500, fill: '#d9d9d9', lh: 1.5 }),
      ]
    }),
    T('※ サンプルの数値です。実際の数字に差し替えてください。', 100, 1520, 1040, 22, { weight: 400, fill: '#a9a9a9' }),
  ]),
  pg('選考フロー', '#ffffff', () => [
    ...jbHF(9, '応募方法'),
    ...jbTitle('FLOW', '応募から入社まで'),
    ...[['STEP 1', 'ご応募', 'お電話またはWebフォームから。お名前と希望のシフトをお伝えください。'], ['STEP 2', '面接(30分)', 'センターで簡単な面談を行います。服装は自由、履歴書は持参ください。'], ['STEP 3', '採用のご連絡', '面接から3日以内にご連絡します。'], ['STEP 4', '初出勤', '研修は先輩とペアで。わからないことはすぐ聞けます。']].flatMap(([s, t, b], i) => [
      R(100, 340 + i * 330, 1040, 290, i % 2 ? '#f4f4f4' : JB.pale),
      R(100, 340 + i * 330, 220, 290, JB.main),
      T(s, 100, 460 + i * 330, 220, 32, { font: MONT, weight: 900, fill: JB.acc, align: 'center' }),
      T(t, 350, 385 + i * 330, 760, 42, { weight: 900, fill: JB.main }),
      T(b, 350, 455 + i * 330, 760, 25, { weight: 400, fill: JB.ink, lh: 1.65 }),
    ]),
  ]),
  pg('応募・お問い合わせ', JB.acc, () => [
    R(60, 60, 1120, 1634, '#ffffff'),
    T('APPLY NOW', 120, 130, 900, 34, { font: MONT, weight: 900, fill: '#8a6a00', spacing: 400 }),
    T('まずは気軽に\n話を聞きに\n来てください。', 120, 200, 1000, 96, { font: 'Dela Gothic One', weight: 400, fill: JB.main, lh: 1.1 }),
    R(120, 640, 1000, 360, JB.main),
    T('お電話', 160, 680, 400, 28, { weight: 700, fill: JB.acc }),
    T('000-0000-0000', 160, 730, 920, 80, { font: BEBAS, weight: 400, fill: '#ffffff', spacing: 100 }),
    T('受付 平日 10:00〜18:00 / 採用担当:松井', 160, 860, 920, 28, { weight: 500, fill: '#d9d9d9' }),
    ...PH(120, 1060, 340, 340, 0, '#d9d9d9'),
    T('QRコードを\nここに配置', 120, 1200, 340, 28, { weight: 700, fill: JB.mid, align: 'center', lh: 1.5 }),
    T('Webからの応募', 500, 1070, 620, 34, { weight: 900, fill: JB.main }),
    T('recruit.example.com\n24時間受付中です。', 500, 1130, 620, 28, { weight: 500, fill: JB.ink, lh: 1.7 }),
    T('ハトバ物流株式会社 / サンプル県サンプル市サンプル町 4-5-6', 120, 1520, 1000, 24, { weight: 500, fill: JB.mid }),
  ]),
])

// =====================================================================
// 3. 不動産 物件チラシ・間取り紹介(A4 縦 / フォレストグリーン + カッパー / しっぽり明朝)
// =====================================================================
const RE: Pal = { main: '#1f4d3f', acc: '#b5714a', pale: '#f4efe6', ink: '#222a27', mid: '#566660', line: '#d9d2c3' }
const reHF = (n: number, sec: string) => hf(RE, 1240, 1754, 'GREEN TERRACE SAKURADAI', n, sec)
const reTitle = (en: string, ja: string, y = 150) => ttl(RE, en, ja, y, 100, 1240, MINCHO)
const room = (x: number, y: number, w: number, h: number, name: string, sub: string, fill = '#ffffff'): FabricObject[] => [
  R(x, y, w, h, fill, 0, { stroke: RE.main, strokeWidth: 4 }),
  T(name, x + 10, y + h / 2 - 34, w - 20, 28, { weight: 800, fill: RE.main, align: 'center' }),
  T(sub, x + 10, y + h / 2 + 4, w - 20, 24, { weight: 500, fill: RE.mid, align: 'center' }),
]
const REAL = mkSet('mx-realestate', '不動産 物件チラシ・間取り紹介', '不動産', 1240, 1754,
  ['不動産', '物件', 'マンション', '間取り', 'チラシ', '内覧'], [
  pg('表紙', RE.pale, () => [
    R(0, 0, 1240, 120, RE.main),
    T('NEW LISTING  /  新規物件のご案内', 100, 40, 1040, 28, { font: MONT, weight: 700, fill: '#f4efe6', spacing: 200 }),
    ...PH(0, 120, 1240, 760, 0, '#d4d0c4'),
    R(100, 800, 1040, 300, '#ffffff', 0, { shadow: { color: 'rgba(0,0,0,0.12)', blur: 30, offsetX: 0, offsetY: 10 } }),
    T('グリーンテラス桜台  305号室', 140, 830, 960, 54, { font: MINCHO, weight: 800, fill: RE.main }),
    T('3,980', 140, 920, 420, 130, { font: MONT, weight: 900, fill: RE.acc }),
    T('万円', 520, 985, 160, 48, { font: MINCHO, weight: 800, fill: RE.acc }),
    T('3LDK  /  68.4㎡\n築7年  /  南向き 角部屋', 700, 930, 400, 32, { weight: 700, fill: RE.ink, lh: 1.6 }),
    T('駅徒歩7分、緑に囲まれた\n角部屋の暮らし。', 100, 1180, 1040, 64, { font: MINCHO, weight: 800, fill: RE.main, lh: 1.4 }),
    ...['南向き・角部屋', 'ペット相談可', '全室収納付き', '駐車場空きあり'].map((t, i) => [R(100 + (i % 2) * 520, 1420 + Math.floor(i / 2) * 90, 500, 70, '#ffffff', 35, { stroke: RE.acc, strokeWidth: 3 }), T(t, 100 + (i % 2) * 520, 1440 + Math.floor(i / 2) * 90, 500, 28, { weight: 700, fill: RE.acc, align: 'center' })]).flat(),
    T('サンプル不動産株式会社  TEL 000-0000-0000', 100, 1620, 1040, 26, { weight: 500, fill: RE.mid }),
  ]),
  pg('物件の特長', '#ffffff', () => [
    ...reHF(2, '特長'),
    ...reTitle('POINT', 'この住まいの3つの魅力'),
    ...[['光', '南と東の二面採光', 'リビングは2方向から光が入り、朝から夕方まで明るく過ごせます。'], ['緑', '桜並木に面した眺め', 'バルコニーの正面は公園の桜並木。四季の移ろいを感じられます。'], ['収', '家族を支える収納力', '各部屋のクローゼットに加え、ウォークインクローゼットを備えます。']].flatMap(([k, t, b], i) => [
      ...PH(i % 2 ? 560 : 100, 340 + i * 420, 580, 360, 0),
      R(i % 2 ? 100 : 720, 340 + i * 420, 420, 360, RE.pale),
      T(k, i % 2 ? 130 : 750, 365 + i * 420, 120, 64, { font: MINCHO, weight: 800, fill: RE.acc }),
      T(t, i % 2 ? 130 : 750, 450 + i * 420, 360, 34, { font: MINCHO, weight: 800, fill: RE.main, lh: 1.35 }),
      T(b, i % 2 ? 130 : 750, 540 + i * 420, 360, 23, { weight: 400, fill: RE.ink, lh: 1.65 }),
    ]),
  ]),
  pg('間取り図', '#ffffff', () => [
    ...reHF(3, '間取り'),
    ...reTitle('FLOOR PLAN', '間取り図  3LDK'),
    R(100, 340, 1040, 860, RE.pale),
    ...room(130, 370, 560, 420, 'LDK', '15.0帖', '#ffffff'),
    ...room(690, 370, 420, 300, '洋室 A', '6.0帖'),
    ...room(690, 670, 420, 260, '洋室 B', '5.5帖'),
    ...room(130, 790, 280, 230, '洋室 C', '4.5帖'),
    ...room(410, 790, 280, 140, '浴室', ''),
    ...room(410, 930, 280, 90, '洗面', ''),
    ...room(690, 930, 420, 90, '収納', 'WIC'),
    ...room(130, 1020, 980, 150, 'バルコニー', '南向き  幅 6.2m', '#e8efe9'),
    T('N ↑', 1020, 300, 100, 28, { font: MONT, weight: 900, fill: RE.acc, align: 'right' }),
    ...[['専有面積', '68.4㎡'], ['バルコニー', '12.4㎡'], ['所在階', '3階 / 全5階']].flatMap(([l, v], i) => [
      T(l, 100 + i * 354, 1260, 330, 24, { weight: 700, fill: RE.mid }),
      T(v, 100 + i * 354, 1300, 330, 44, { font: MINCHO, weight: 800, fill: RE.main }),
    ]),
    T('※ 図面と現況が異なる場合は現況を優先します。', 100, 1520, 1040, 22, { weight: 400, fill: RE.mid }),
  ]),
  pg('室内ギャラリー', RE.pale, () => [
    ...reHF(4, '室内'),
    ...reTitle('GALLERY', '室内のようす'),
    ...['リビング・ダイニング', 'キッチン', '洋室 A', '洗面・浴室', 'バルコニー', '玄関'].flatMap((t, i) => {
      const x = 100 + (i % 2) * 530, y = 340 + Math.floor(i / 2) * 400
      return [...PH(x, y, 510, 320, 0), T(t, x, y + 336, 510, 28, { weight: 700, fill: RE.main })]
    }),
  ]),
  pg('設備・仕様', '#ffffff', () => [
    ...reHF(5, '設備'),
    ...reTitle('EQUIPMENT', '設備・仕様'),
    ...['システムキッチン(食洗機付き)', '浴室乾燥機', '床暖房(リビング)', 'ウォークインクローゼット', 'インターネット無料', '宅配ボックス', 'オートロック', 'ペット飼育可(小型犬・猫)', '24時間ゴミ出し可', '自転車置き場'].flatMap((t, i) => {
      const x = 100 + (i % 2) * 530, y = 340 + Math.floor(i / 2) * 190
      return [
        R(x, y, 510, 150, i % 4 < 2 ? RE.pale : '#ffffff', 0, { stroke: RE.line, strokeWidth: 2 }),
        S('check', x + 24, y + 45, 60, RE.acc),
        T(t, x + 110, y + 55, 390, 28, { weight: 700, fill: RE.ink, lh: 1.3 }),
      ]
    }),
  ]),
  pg('周辺環境', '#ffffff', () => [
    ...reHF(6, '周辺'),
    ...reTitle('NEIGHBORHOOD', '暮らしを支える周辺環境'),
    ...[['桜台駅', '徒歩 7分', '560m', '急行停車駅 / 都心まで 28分'], ['スーパー', '徒歩 3分', '240m', '朝8時から夜10時まで営業'], ['桜台公園', '徒歩 2分', '150m', '遊具・ドッグランあり'], ['小学校', '徒歩 8分', '620m', '桜台小学校の学区です'], ['クリニック', '徒歩 4分', '310m', '内科・小児科が入る医療モール']].flatMap(([t, d, m, n], i) => [
      R(100, 340 + i * 250, 1040, 210, i % 2 ? '#ffffff' : RE.pale),
      T(t, 140, 390 + i * 250, 360, 40, { font: MINCHO, weight: 800, fill: RE.main }),
      T(n, 140, 460 + i * 250, 520, 23, { weight: 400, fill: RE.mid }),
      T(d, 700, 385 + i * 250, 400, 48, { weight: 900, fill: RE.acc, align: 'right' }),
      T(m, 700, 460 + i * 250, 400, 26, { font: MONT, weight: 700, fill: RE.mid, align: 'right' }),
    ]),
  ]),
  pg('アクセス', RE.pale, () => [
    ...reHF(7, 'アクセス'),
    ...reTitle('ACCESS', 'アクセスマップ'),
    R(100, 340, 1040, 900, '#ffffff'),
    R(100, 700, 1040, 70, '#e6e1d4'), R(560, 340, 70, 900, '#e6e1d4'), R(100, 1000, 1040, 40, '#efebe0'),
    R(700, 400, 360, 240, '#cfe0d4'), T('桜台公園', 700, 500, 360, 30, { weight: 700, fill: RE.main, align: 'center' }),
    R(150, 400, 360, 240, '#f1ece0'), T('桜台駅', 150, 500, 360, 30, { weight: 700, fill: RE.ink, align: 'center' }),
    R(150, 820, 360, 150, '#f1ece0'), T('スーパー', 150, 870, 360, 28, { weight: 700, fill: RE.ink, align: 'center' }),
    ...pin(770, 800, 120, RE.acc),
    T('グリーンテラス\n桜台', 910, 830, 220, 28, { weight: 800, fill: RE.main, lh: 1.3 }),
    R(100, 1290, 1040, 220, RE.main),
    T('桜台駅から徒歩7分', 140, 1330, 960, 44, { font: MINCHO, weight: 800, fill: '#ffffff' }),
    T('改札を出て右、スーパーの角を曲がって桜並木を直進。\nバス停「桜台公園前」からは徒歩1分です。', 140, 1400, 960, 26, { weight: 400, fill: '#e3ecdf', lh: 1.65 }),
  ]),
  pg('物件概要', '#ffffff', () => [
    ...reHF(8, '概要'),
    ...reTitle('SPECIFICATION', '物件概要'),
    ...fieldRows(RE, 100, 340, 260, 780, 130, [['物件名', 'グリーンテラス桜台 305号室'], ['価格', '3,980万円(税込)'], ['所在地', 'サンプル県サンプル市桜台2-4-6'], ['交通', '桜台駅 徒歩7分'], ['構造・階数', '鉄筋コンクリート造 / 地上5階建'], ['築年月', '2020年3月(築7年)'], ['管理費等', '管理費 12,500円 / 修繕積立金 9,800円'], ['取引態様', '売主(仲介手数料不要)']], 26),
    T('サンプル不動産株式会社 / サンプル県知事(1)第00000号', 100, 1480, 1040, 22, { weight: 400, fill: RE.mid }),
  ]),
  pg('資金計画', RE.pale, () => [
    ...reHF(9, '資金計画'),
    ...reTitle('MONEY PLAN', '月々のお支払いの目安'),
    makeChart({ type: 'donut', labels: ['ローン返済', '管理費', '修繕積立金'], values: [118, 12, 10], colors: [RE.main, RE.acc, '#a9b8ae'], w: 520, h: 300 }).set({ left: 110, top: 360, scaleX: 1.15, scaleY: 1.15 }),
    T('月々の支払い', 740, 400, 400, 26, { weight: 700, fill: RE.mid }),
    T('約 14万円', 740, 450, 400, 64, { font: MINCHO, weight: 800, fill: RE.main }),
    T('頭金 400万円 / 35年 / 変動金利 0.5% で試算', 740, 540, 400, 23, { weight: 400, fill: RE.mid, lh: 1.6 }),
    ...[['ローン返済', '約 11.8 万円'], ['管理費', '1.25 万円'], ['修繕積立金', '0.98 万円']].flatMap(([l, v], i) => [
      R(100, 840 + i * 130, 1040, 110, '#ffffff'),
      R(100, 840 + i * 130, 10, 110, [RE.main, RE.acc, '#a9b8ae'][i]),
      T(l, 140, 875 + i * 130, 520, 30, { weight: 700, fill: RE.ink }),
      T(v, 640, 868 + i * 130, 460, 40, { font: MINCHO, weight: 800, fill: RE.main, align: 'right' }),
    ]),
    T('※ 試算は目安です。実際の条件は金融機関によって異なります。', 100, 1290, 1040, 22, { weight: 400, fill: RE.mid }),
  ]),
  pg('内覧・お問い合わせ', RE.main, () => [
    T('VIEWING', 100, 150, 800, 26, { font: MONT, weight: 700, fill: '#d9a98a', spacing: 400 }),
    T('実際の光と\n眺めを、\n見にきませんか。', 100, 210, 1040, 100, { font: MINCHO, weight: 800, fill: '#ffffff', lh: 1.35 }),
    R(100, 640, 1040, 2, '#4b7566'),
    T('内覧会', 100, 690, 300, 28, { weight: 700, fill: '#d9a98a' }),
    T('毎週 土・日  10:00〜17:00', 100, 735, 1040, 44, { weight: 800, fill: '#ffffff' }),
    T('平日をご希望の方は事前にご相談ください。', 100, 800, 1040, 26, { weight: 400, fill: '#cfe0d4' }),
    R(100, 920, 1040, 480, '#ffffff'),
    T('お問い合わせ', 140, 960, 600, 28, { weight: 700, fill: RE.acc }),
    T('000-0000-0000', 140, 1010, 960, 90, { font: MONT, weight: 900, fill: RE.main }),
    T('営業時間 10:00〜19:00(水曜定休)', 140, 1130, 960, 28, { weight: 500, fill: RE.ink }),
    T('サンプル不動産株式会社\nサンプル県サンプル市桜台1-1-1\ninfo@example.com', 140, 1200, 960, 26, { weight: 400, fill: RE.mid, lh: 1.65 }),
  ]),
])

// =====================================================================
// 4. 飲食店 SNS 投稿(カフェ / Instagram 正方形 / ブラウン + テラコッタ)
// =====================================================================
const CF = { dark: '#3b2a20', cream: '#f5ebdd', terra: '#c8643c', mid: '#7a6354', light: '#e9d8c3' }
const cfBar = (n: number, dark = false, c = dark ? CF.light : CF.mid): FabricObject[] => [
  T('MORI NO COFFEE', 80, 56, 500, 24, { font: MONT, weight: 700, fill: c, spacing: 300 }),
  T(String(n).padStart(2, '0') + ' / 10', 700, 56, 300, 24, { font: MONT, weight: 700, fill: c, align: 'right' }),
]
const CAFE = mkSet('mx-cafe', 'カフェ SNS 投稿セット(Instagram)', 'Instagram 投稿', 1080, 1080,
  ['カフェ', '飲食店', 'Instagram', 'メニュー', '新商品', '喫茶'], [
  pg('新メニュー', CF.dark, () => [
    ...cfBar(1, true),
    Ci(540, 560, 360, CF.cream), Ci(540, 560, 330, '', { stroke: CF.terra, strokeWidth: 4, fill: '' }),
    T('AUTUMN NEW', 190, 330, 700, 30, { font: MONT, weight: 700, fill: CF.terra, align: 'center', spacing: 400 }),
    T('焼き栗の\nモンブランラテ', 190, 400, 700, 72, { font: 'Zen Maru Gothic', weight: 900, fill: CF.dark, align: 'center', lh: 1.3 }),
    T('¥680', 190, 610, 700, 80, { font: 'Playfair Display', weight: 700, fill: CF.terra, align: 'center' }),
    T('10.1 THU  START', 190, 740, 700, 30, { font: MONT, weight: 700, fill: CF.mid, align: 'center', spacing: 300 }),
    T('森のコーヒー 駅前店', 80, 1000, 920, 26, { weight: 500, fill: CF.light, align: 'center' }),
  ]),
  pg('こだわり', CF.cream, () => [
    ...cfBar(2),
    ...PH(80, 130, 460, 800, 24, CF.light),
    T('POINT 01', 600, 150, 400, 26, { font: MONT, weight: 700, fill: CF.terra, spacing: 300 }),
    T('国産の栗を\n丁寧に焼く', 600, 200, 420, 60, { font: 'Zen Maru Gothic', weight: 900, fill: CF.dark, lh: 1.3 }),
    T('長野県産の栗を、店で一つずつ焼いて皮をむきます。香ばしさがラテの甘さを引き立てます。', 600, 400, 400, 26, { weight: 500, fill: CF.dark, lh: 1.75 }),
    R(600, 700, 60, 4, CF.terra),
    T('POINT 02', 600, 740, 400, 26, { font: MONT, weight: 700, fill: CF.terra, spacing: 300 }),
    T('深煎りの豆と相性◎', 600, 790, 400, 34, { weight: 900, fill: CF.dark }),
  ]),
  pg('メニュー表', CF.dark, () => [
    ...cfBar(3, true),
    T('MENU', 80, 130, 600, 80, { font: 'Playfair Display', weight: 700, fill: CF.cream }),
    ...[['ブレンドコーヒー', '¥480'], ['カフェラテ', '¥560'], ['モンブランラテ', '¥680'], ['ほうじ茶ラテ', '¥580'], ['自家製プリン', '¥520'], ['季節のタルト', '¥640']].flatMap(([n, p], i) => [
      T(n, 80, 290 + i * 110, 600, 40, { weight: 700, fill: CF.cream }),
      T(p, 700, 290 + i * 110, 300, 40, { font: 'Playfair Display', weight: 700, fill: CF.terra, align: 'right' }),
      R(80, 350 + i * 110, 920, 1, '#6b5444'),
    ]),
    T('すべて税込価格です', 80, 990, 920, 24, { weight: 400, fill: CF.light }),
  ]),
  pg('スイーツ', CF.terra, () => [
    ...cfBar(4, true, '#ffffff'),
    ...PH(80, 130, 920, 560, 24, '#d98a68'),
    T('毎朝焼く、', 80, 740, 920, 40, { weight: 700, fill: '#ffe9d9' }),
    T('ふわとろプリン', 80, 790, 920, 90, { font: 'Zen Maru Gothic', weight: 900, fill: '#ffffff' }),
    T('卵とミルクだけで作る、やさしい甘さ。1日20個限定です。', 80, 910, 920, 28, { weight: 500, fill: '#ffe9d9' }),
  ]),
  pg('営業案内', CF.cream, () => [
    ...cfBar(5),
    T('INFORMATION', 80, 130, 900, 30, { font: MONT, weight: 700, fill: CF.terra, spacing: 400 }),
    T('営業時間とお席', 80, 190, 920, 80, { font: 'Zen Maru Gothic', weight: 900, fill: CF.dark }),
    ...[['営業時間', '8:00 – 18:00(ラストオーダー 17:30)'], ['定休日', '毎週水曜日'], ['お席', 'カウンター 6 / テーブル 14 / テラス 6'], ['Wi-Fi', '無料・電源席あり']].flatMap(([l, v], i) => [
      R(80, 340 + i * 160, 920, 1, '#cdb89d'),
      T(l, 80, 375 + i * 160, 240, 28, { weight: 700, fill: CF.terra }),
      T(v, 330, 372 + i * 160, 670, 32, { weight: 700, fill: CF.dark, lh: 1.4 }),
    ]),
  ]),
  pg('スタッフ紹介', CF.dark, () => [
    ...cfBar(6, true),
    ...PH(80, 130, 400, 520, 200, '#6b5444'),
    T('STAFF', 540, 150, 400, 26, { font: MONT, weight: 700, fill: CF.terra, spacing: 400 }),
    T('店長 森田 さん', 540, 200, 460, 46, { weight: 900, fill: CF.cream }),
    T('「今日の一杯を、\nゆっくり味わって\nほしいです」', 540, 300, 460, 36, { font: 'Zen Maru Gothic', weight: 700, fill: CF.light, lh: 1.55 }),
    R(80, 720, 920, 1, '#6b5444'),
    T('焙煎歴12年。豆の違いを、お席でご説明します。', 80, 770, 920, 30, { weight: 500, fill: CF.cream, lh: 1.7 }),
  ]),
  pg('口コミ', CF.cream, () => [
    ...cfBar(7),
    T('“', 80, 100, 200, 240, { font: 'Playfair Display', weight: 700, fill: CF.terra }),
    T('仕事帰りに寄ると、\n肩の力がふっと抜けます。\n席が広くて長居できる。', 80, 340, 920, 60, { font: 'Zen Maru Gothic', weight: 900, fill: CF.dark, lh: 1.5 }),
    R(80, 640, 80, 4, CF.terra),
    T('常連のお客さま(30代)', 80, 680, 920, 28, { weight: 500, fill: CF.mid }),
    T('ご感想は #もりのこーひー でシェアしてください', 80, 920, 920, 26, { weight: 700, fill: CF.terra }),
  ]),
  pg('持ち帰り', '#ffffff', () => [
    ...cfBar(8),
    R(0, 120, 1080, 960, CF.light),
    ...PH(80, 170, 440, 640, 24, '#d9c4a8'),
    T('TAKE OUT', 580, 190, 420, 28, { font: MONT, weight: 700, fill: '#a24a26', spacing: 300 }),
    T('おうちでも\n森のコーヒー', 580, 250, 420, 52, { font: 'Zen Maru Gothic', weight: 900, fill: CF.dark, lh: 1.35 }),
    T('ドリップバッグ 5 袋入り\n¥1,200', 580, 440, 420, 34, { weight: 700, fill: CF.dark, lh: 1.6 }),
    T('豆の販売(100g ¥900〜)も\n承っています。', 580, 580, 420, 26, { weight: 500, fill: CF.mid, lh: 1.7 }),
    R(80, 870, 920, 120, CF.dark, 60),
    T('レジでお気軽にお声がけください', 80, 912, 920, 32, { weight: 700, fill: CF.cream, align: 'center' }),
  ]),
  pg('アクセス', CF.dark, () => [
    ...cfBar(9, true),
    T('ACCESS', 80, 130, 600, 30, { font: MONT, weight: 700, fill: CF.terra, spacing: 400 }),
    T('駅前の小さな森', 80, 190, 920, 80, { font: 'Zen Maru Gothic', weight: 900, fill: CF.cream }),
    R(80, 330, 920, 460, '#4d3a2d', 24),
    R(80, 530, 920, 50, '#6b5444'), R(470, 330, 50, 460, '#6b5444'),
    ...pin(570, 380, 110, CF.terra),
    T('森のコーヒー', 700, 420, 280, 30, { weight: 800, fill: CF.cream }),
    T('緑ヶ丘駅 東口から 徒歩 1 分\nサンプル県サンプル市緑ヶ丘 1-2-3', 80, 840, 920, 30, { weight: 500, fill: CF.light, lh: 1.7 }),
  ]),
  pg('フォローのお願い', CF.terra, () => [
    ...cfBar(10, true, '#ffffff'),
    Ci(540, 440, 220, '#ffffff'),
    T('MORI', 320, 360, 440, 100, { font: 'Playfair Display', weight: 700, fill: CF.terra, align: 'center' }),
    T('@morinocoffee_sample', 80, 740, 920, 44, { font: MONT, weight: 700, fill: '#ffffff', align: 'center' }),
    T('新メニューと営業のお知らせを\n毎週お届けします', 80, 820, 920, 34, { weight: 700, fill: '#ffe9d9', align: 'center', lh: 1.6 }),
  ]),
])

// =====================================================================
// 5. 美容室・サロンのメニューと料金(A4 縦 / ブラッシュ + チャコール + ゴールド)
// =====================================================================
const SA: Pal = { main: '#2b2b2b', acc: '#a8823f', pale: '#f6ece8', ink: '#2b2b2b', mid: '#6a6460', line: '#e0d3cd' }
const saHF = (n: number, sec: string) => hf(SA, 1240, 1754, 'SALON LUMIÈRE', n, sec, 100, 'Playfair Display')
const saTitle = (en: string, ja: string, y = 150) => [
  T(en, 100, y, 1040, 56, { font: 'Playfair Display', weight: 400, fill: SA.acc, spacing: 200 }),
  T(ja, 100, y + 80, 1040, 36, { font: MINCHO, weight: 700, fill: SA.main }),
  R(100, y + 140, 60, 2, SA.acc),
]
const priceRows = (items: string[][], y: number, rh = 150): FabricObject[] => items.flatMap(([n, d, p], i) => [
  T(n, 100, y + i * rh, 700, 34, { font: MINCHO, weight: 700, fill: SA.main }),
  T(d, 100, y + 48 + i * rh, 720, 23, { weight: 400, fill: SA.mid }),
  T(p, 800, y + 4 + i * rh, 340, 34, { font: 'Playfair Display', weight: 400, fill: SA.main, align: 'right' }),
  R(100, y + rh - 20 + i * rh, 1040, 1, SA.line),
])
const SALON = mkSet('mx-salon', '美容室・サロン メニューと料金', '美容室・サロン', 1240, 1754,
  ['美容室', 'サロン', 'メニュー', '料金表', 'ヘアカット', 'ネイル'], [
  pg('表紙', SA.pale, () => [
    R(100, 100, 1040, 1554, '', 0, { stroke: SA.acc, strokeWidth: 2, fill: '' }),
    T('SALON LUMIÈRE', 100, 280, 1040, 28, { font: 'Playfair Display', weight: 400, fill: SA.acc, align: 'center', spacing: 600 }),
    T('MENU &\nPRICE', 100, 380, 1040, 190, { font: 'Playfair Display', weight: 400, fill: SA.main, align: 'center', lh: 1.05 }),
    R(580, 840, 80, 2, SA.acc),
    T('メニューと料金のご案内', 100, 900, 1040, 38, { font: MINCHO, weight: 700, fill: SA.main, align: 'center' }),
    ...PH(370, 1010, 500, 400, 250, '#e3d0c8'),
    T('2027 AUTUMN & WINTER', 100, 1500, 1040, 26, { font: 'Playfair Display', weight: 400, fill: SA.mid, align: 'center', spacing: 400 }),
  ]),
  pg('ごあいさつ', '#ffffff', () => [
    ...saHF(2, 'WELCOME'),
    ...saTitle('Welcome', 'ごあいさつ'),
    ...PH(100, 380, 440, 600, 0, '#eadad4'),
    T('忙しい毎日のなかで、\nふっと力が抜ける時間を。', 600, 380, 540, 40, { font: MINCHO, weight: 700, fill: SA.main, lh: 1.5 }),
    T('サロン ルミエールは、髪のコンディションと気持ちの両方を整える場所です。\n\nカウンセリングに時間をかけ、ご自宅でも再現しやすいスタイルをご提案します。初めての方も、どうぞお気軽に。', 600, 540, 540, 25, { weight: 400, fill: SA.ink, lh: 1.9 }),
    R(100, 1100, 1040, 360, SA.pale),
    ...[['10年', '地域で営業'], ['3,200名', '年間のご来店'], ['4.8', '口コミ評価']].flatMap(([n, l], i) => [
      T(n, 100 + i * 346, 1170, 346, 64, { font: 'Playfair Display', weight: 400, fill: SA.main, align: 'center' }),
      T(l, 100 + i * 346, 1280, 346, 26, { weight: 500, fill: SA.mid, align: 'center' }),
    ]),
  ]),
  pg('カット', '#ffffff', () => [
    ...saHF(3, 'CUT'),
    ...saTitle('Cut', 'カット'),
    ...priceRows([['カット', 'シャンプー・ブロー込み', '¥5,500'], ['前髪カット', '(お一人につき)', '¥1,100'], ['メンズカット', 'シャンプー・ブロー込み', '¥4,400'], ['キッズカット', '小学生まで', '¥3,300'], ['カット + カラー', 'リタッチ(根元)プラン', '¥11,000'], ['カット + パーマ', 'デジタルパーマ別途', '¥13,200']], 380),
    T('※ 価格は税込です。ロングヘアは +¥1,100 を頂戴します。', 100, 1450, 1040, 22, { weight: 400, fill: SA.mid }),
  ]),
  pg('カラー', SA.pale, () => [
    ...saHF(4, 'COLOR'),
    ...saTitle('Color', 'カラー'),
    ...priceRows([['フルカラー', 'シャンプー・ブロー込み', '¥7,700'], ['リタッチカラー', '根元から 2cm まで', '¥5,500'], ['ハイライト', 'ポイント(5束まで)', '¥6,600'], ['ブリーチ', 'フルブリーチ + カラー', '¥14,300'], ['白髪ぼかし', 'ハイライトでやさしく', '¥9,900']], 380, 160),
    ...['#d9a89a', '#8b5e45', '#c9b79c', '#2e2622'].map((c, i) => Ci(180 + i * 160, 1330, 56, c)),
    T('お好みの色味はカウンセリングで一緒に決めます。', 100, 1460, 1040, 26, { weight: 500, fill: SA.mid }),
  ]),
  pg('パーマ・トリートメント', '#ffffff', () => [
    ...saHF(5, 'PERM / TREATMENT'),
    ...saTitle('Perm & Treatment', 'パーマ・トリートメント'),
    ...priceRows([['デジタルパーマ', 'カット別・ロング料金なし', '¥11,000'], ['コールドパーマ', 'カット別', '¥8,800'], ['縮毛矯正', '前髪のみ ¥5,500', '¥16,500'], ['ケアトリートメント', '毛先中心の集中ケア', '¥3,300'], ['プレミアムトリートメント', '全体にじっくり浸透', '¥5,500']], 380, 160),
    R(100, 1250, 1040, 300, SA.main),
    T('おすすめ', 140, 1290, 300, 26, { font: MONT, weight: 700, fill: SA.acc }),
    T('カット + カラー + トリートメント', 140, 1340, 960, 38, { font: MINCHO, weight: 700, fill: '#ffffff' }),
    T('¥14,300', 140, 1410, 960, 70, { font: 'Playfair Display', weight: 400, fill: SA.acc }),
  ]),
  pg('ヘッドスパ', SA.main, () => [
    ...hf({ ...SA, main: SA.acc, mid: '#b5aaa4', line: '#4a4642' }, 1240, 1754, 'SALON LUMIÈRE', 6, 'HEAD SPA', 100, 'Playfair Display'),
    T('Head Spa', 100, 150, 1040, 56, { font: 'Playfair Display', weight: 400, fill: SA.acc, spacing: 200 }),
    T('ヘッドスパ', 100, 230, 1040, 36, { font: MINCHO, weight: 700, fill: '#ffffff' }),
    ...PH(100, 340, 1040, 520, 0, '#4a4642'),
    ...[['ベーシック', '30分', '¥3,300'], ['リラックス', '45分', '¥4,950'], ['プレミアム', '60分', '¥6,600']].flatMap(([n, t, p], i) => [
      R(100 + i * 354, 920, 332, 400, '#383534'),
      T(n, 100 + i * 354, 970, 332, 32, { font: MINCHO, weight: 700, fill: '#ffffff', align: 'center' }),
      T(t, 100 + i * 354, 1060, 332, 56, { font: 'Playfair Display', weight: 400, fill: SA.acc, align: 'center' }),
      T(p, 100 + i * 354, 1200, 332, 38, { font: 'Playfair Display', weight: 400, fill: '#ffffff', align: 'center' }),
    ]),
    T('カットまたはカラーと同時のお申し込みで ¥550 オフ', 100, 1400, 1040, 26, { weight: 500, fill: '#d8cfca' }),
  ]),
  pg('ネイル', '#ffffff', () => [
    ...saHF(7, 'NAIL'),
    ...saTitle('Nail', 'ネイル'),
    ...priceRows([['ワンカラー', 'ジェル・オフ別', '¥5,500'], ['グラデーション', 'ジェル・オフ別', '¥6,600'], ['定額デザイン', '季節のアート 10 本', '¥7,700'], ['ハンドケア', 'ケア + 保湿パック', '¥2,200'], ['オフ', '当店のジェルのみ', '¥1,100']], 380, 160),
    ...[0, 1, 2, 3].flatMap((i) => PH(100 + i * 265, 1240, 245, 330, 0, '#eadad4')),
    T('施術例', 100, 1590, 400, 24, { weight: 500, fill: SA.mid }),
  ]),
  pg('スタイリスト', SA.pale, () => [
    ...saHF(8, 'STYLIST'),
    ...saTitle('Stylist', 'スタイリスト紹介'),
    ...[['小林 美月', 'ディレクター', '指名料 ¥1,100', 'ショートが得意です。'], ['江口 蓮', 'トップスタイリスト', '指名料 ¥550', 'メンズとカラー担当。'], ['坂井 ひなた', 'スタイリスト', '指名料 なし', 'パーマとアレンジ。']].flatMap(([n, r, f, c], i) => [
      ...PH(100 + i * 354, 380, 332, 460, 0, '#e3d0c8'),
      T(n, 100 + i * 354, 870, 332, 34, { font: MINCHO, weight: 700, fill: SA.main }),
      T(r, 100 + i * 354, 920, 332, 24, { weight: 500, fill: SA.acc }),
      T(c, 100 + i * 354, 980, 332, 24, { weight: 400, fill: SA.ink, lh: 1.7 }),
      T(f, 100 + i * 354, 1100, 332, 22, { weight: 500, fill: SA.mid }),
    ]),
  ]),
  pg('ご予約の流れ', '#ffffff', () => [
    ...saHF(9, 'FLOW'),
    ...saTitle('Flow', 'ご予約からご来店まで'),
    ...[['01', 'ご予約', 'Web または電話から。希望のメニューをお知らせください。'], ['02', 'カウンセリング', 'お悩みやご希望を、ゆっくりお聞きします。'], ['03', '施術', '髪の状態を見ながら丁寧に仕上げます。'], ['04', 'お会計', '次回のご予約もこの場で承れます。']].flatMap(([n, t, b], i) => [
      T(n, 100, 390 + i * 250, 200, 90, { font: 'Playfair Display', weight: 400, fill: SA.acc }),
      T(t, 310, 400 + i * 250, 800, 40, { font: MINCHO, weight: 700, fill: SA.main }),
      T(b, 310, 465 + i * 250, 800, 26, { weight: 400, fill: SA.ink, lh: 1.6 }),
      R(100, 590 + i * 250, 1040, 1, SA.line),
    ]),
  ]),
  pg('店舗情報', SA.main, () => [
    T('Salon Lumière', 100, 220, 1040, 100, { font: 'Playfair Display', weight: 400, fill: '#ffffff' }),
    T('営業時間 10:00 – 20:00(火曜定休)\n〒000-0000 サンプル市サンプル町 3-4-5 2F\nTEL 000-0000-0000\nreserve@example.com', 100, 420, 1040, 32, { weight: 400, fill: '#d8cfca', lh: 1.9 }),
    R(100, 900, 1040, 1, '#5a5552'),
    T('初回ご来店の方', 100, 960, 1040, 26, { weight: 700, fill: SA.acc }),
    T('カット・カラーが 10%オフ', 100, 1010, 1040, 56, { font: MINCHO, weight: 700, fill: '#ffffff' }),
    T('ご予約時に「メニュー表を見た」とお伝えください。', 100, 1100, 1040, 26, { weight: 400, fill: '#d8cfca' }),
    ...PH(100, 1250, 1040, 300, 0, '#4a4642'),
  ]),
])

// =====================================================================
// 6. 学習塾・スクールの募集チラシ(A4 縦 / コバルト + サンイエロー / M PLUS Rounded)
// =====================================================================
const SC: Pal = { main: '#1f3fa8', acc: '#f5b800', pale: '#eef2fd', ink: '#1e2a4a', mid: '#566086', line: '#d3dbf2' }
const RD = 'M PLUS Rounded 1c'
const scHF = (n: number, sec: string) => hf(SC, 1240, 1754, 'HINODE GAKUSHUJUKU', n, sec)
const scTitle = (en: string, ja: string, y = 150) => [
  T(en, 100, y, 900, 24, { font: MONT, weight: 700, fill: SC.mid, spacing: 300 }),
  R(100, y + 44, 70, 10, SC.acc),
  T(ja, 100, y + 70, 1040, 64, { font: RD, weight: 900, fill: SC.main }),
]
const SCHOOL = mkSet('mx-school', '学習塾・スクール 生徒募集チラシ', '学習塾・スクール', 1240, 1754,
  ['学習塾', 'スクール', '生徒募集', '塾', '体験授業', '小中学生'], [
  pg('表紙', SC.main, () => [
    T('2027年度  新学期生募集', 100, 120, 1040, 34, { weight: 700, fill: SC.acc }),
    T('「わかった!」を\n毎日つくる。', 100, 200, 1040, 130, { font: RD, weight: 900, fill: '#ffffff', lh: 1.25 }),
    T('ひので学習塾  小学4年生〜中学3年生', 100, 560, 1040, 34, { weight: 500, fill: '#c9d5f7' }),
    ...PH(100, 680, 1040, 520, 24, '#a9b8ec'),
    S('burst', 820, 1020, 260, SC.acc),
    T('入塾金\n0円', 820, 1080, 260, 46, { font: RD, weight: 900, fill: SC.main, align: 'center', lh: 1.1 }),
    R(100, 1280, 1040, 3, '#4a68c8'),
    T('春の無料体験授業', 100, 1330, 1040, 28, { weight: 700, fill: SC.acc }),
    T('3月15日(月)〜31日(水)', 100, 1380, 1040, 70, { font: RD, weight: 900, fill: '#ffffff' }),
    T('TEL 000-0000-0000   受付 14:00〜21:00', 100, 1520, 1040, 28, { weight: 500, fill: '#c9d5f7' }),
  ]),
  pg('塾の特長', '#ffffff', () => [
    ...scHF(2, '特長'),
    ...scTitle('POINT', 'ひので学習塾の3つの約束'),
    ...[['01', '少人数制', '1クラス最大6名。一人ひとりの手が止まった所に講師がすぐ気づきます。', SC.main], ['02', '自分の言葉で説明', '解き方を口で説明する時間を毎回とり、「わかったつもり」を防ぎます。', SC.acc], ['03', '毎週の小テスト', '前回の復習を毎週確認。苦手を早い段階で見つけ、次の授業で補います。', SC.main]].flatMap(([n, t, b, c], i) => [
      R(100, 350 + i * 360, 1040, 320, i === 1 ? '#fff8e1' : SC.pale, 24),
      Ci(210, 510 + i * 360, 70, c as string),
      T(n, 140, 478 + i * 360, 140, 60, { font: MONT, weight: 900, fill: i === 1 ? SC.main : '#ffffff', align: 'center' }),
      T(t, 330, 400 + i * 360, 760, 48, { font: RD, weight: 900, fill: SC.main }),
      T(b, 330, 480 + i * 360, 760, 26, { weight: 500, fill: SC.ink, lh: 1.75 }),
    ]),
  ]),
  pg('コース案内', SC.pale, () => [
    ...scHF(3, 'コース'),
    ...scTitle('COURSE', 'コース案内'),
    ...[['小学生コース', '小4〜小6', '算数・国語', '週1〜2回 / 80分', SC.acc], ['中学生コース', '中1〜中3', '英語・数学・国語・理科・社会', '週2〜3回 / 90分', SC.main], ['受験対策コース', '中3・小6', '志望校別の演習', '週3〜4回 / 120分', SC.main]].flatMap(([t, g, s, w, c], i) => [
      R(100, 350 + i * 360, 1040, 320, '#ffffff', 24),
      R(100, 350 + i * 360, 24, 320, c as string, 0),
      T(t, 170, 390 + i * 360, 700, 46, { font: RD, weight: 900, fill: SC.main }),
      R(830, 392 + i * 360, 270, 52, c as string, 26),
      T(g, 830, 404 + i * 360, 270, 28, { weight: 900, fill: c === SC.acc ? SC.main : '#ffffff', align: 'center' }),
      T('科目', 170, 500 + i * 360, 160, 26, { weight: 700, fill: SC.mid }),
      T(s, 330, 500 + i * 360, 760, 26, { weight: 700, fill: SC.ink }),
      T('授業', 170, 570 + i * 360, 160, 26, { weight: 700, fill: SC.mid }),
      T(w, 330, 570 + i * 360, 760, 26, { weight: 700, fill: SC.ink }),
    ]),
  ]),
  pg('授業料', '#ffffff', () => [
    ...scHF(4, '授業料'),
    ...scTitle('TUITION', '授業料のご案内'),
    makeTable({ rows: 5, cols: 4, header: SC.main, border: SC.line, cellW: 260, cellH: 130, fontSize: 26, cells: [['コース', '週の回数', '月額(税込)', '教材費'], ['小学生', '週1回', '9,900円', '月 1,100円'], ['小学生', '週2回', '16,500円', '月 1,100円'], ['中学生', '週2回', '19,800円', '月 1,650円'], ['受験対策', '週3回', '29,700円', '月 2,200円']] }).set({ left: 100, top: 380 }),
    R(100, 1100, 1040, 300, SC.acc, 24),
    T('入塾金 0円キャンペーン', 150, 1140, 940, 32, { weight: 900, fill: SC.main }),
    T('2027年4月末までのお申し込みで、入塾金 22,000円が無料になります。', 150, 1200, 940, 28, { weight: 700, fill: SC.ink, lh: 1.7 }),
  ]),
  pg('時間割', SC.pale, () => [
    ...scHF(5, '時間割'),
    ...scTitle('TIMETABLE', '授業の時間割'),
    ...['月', '火', '水', '木', '金'].flatMap((d, c) => [
      R(250 + c * 178, 360, 170, 70, SC.main, 8),
      T(d, 250 + c * 178, 378, 170, 30, { weight: 900, fill: '#ffffff', align: 'center' }),
    ]),
    ...['16:30', '18:00', '19:40'].flatMap((t, r) => [
      T(t, 100, 540 + r * 300, 140, 28, { font: MONT, weight: 700, fill: SC.main }),
      ...[0, 1, 2, 3, 4].map((c) => {
        const cells = [['小4算数', '中1英語', '中2数学', '小5国語', '中3理科'], ['中1数学', '中2英語', '中3数学', '中2国語', '中1英語'], ['中3英語', '受験演習', '中3国語', '受験演習', '中2数学']]
        return [R(250 + c * 178, 450 + r * 300, 170, 270, '#ffffff', 8), T(cells[r][c], 255 + c * 178, 560 + r * 300, 160, 26, { weight: 700, fill: c % 2 ? SC.main : SC.ink, align: 'center', lh: 1.3 })]
      }).flat(),
    ]),
    T('※ 土曜日は 9:30〜12:00 に振替授業・自習室を開放しています。', 100, 1370, 1040, 24, { weight: 500, fill: SC.mid }),
  ]),
  pg('合格実績', '#ffffff', () => [
    ...scHF(6, '実績'),
    ...scTitle('RESULTS', '2026年度の合格実績'),
    makeChart({ type: 'bar', labels: ['A高校', 'B高校', 'C高校', 'D高校', 'E高校'], values: [12, 9, 15, 7, 11], colors: [SC.main, SC.main, SC.acc, SC.main, SC.main], w: 620, h: 400 }).set({ left: 100, top: 360, scaleX: 1.6, scaleY: 1.6 }),
    T('志望校に合格した人数(のべ)', 100, 1060, 1040, 24, { weight: 500, fill: SC.mid }),
    ...[['98', '%', '志望校合格率'], ['+14', '点', '平均の点数アップ'], ['6', '名', '1クラスの定員']].flatMap(([n, u, l], i) => [
      R(100 + i * 354, 1130, 332, 280, SC.pale, 24),
      T(n, 100 + i * 354, 1160, 332, 90, { font: MONT, weight: 900, fill: SC.main, align: 'center' }),
      T(u + '  ' + l, 100 + i * 354, 1290, 332, 26, { weight: 700, fill: SC.ink, align: 'center' }),
    ]),
  ]),
  pg('講師紹介', SC.pale, () => [
    ...scHF(7, '講師'),
    ...scTitle('TEACHERS', '講師紹介'),
    ...[['教室長 桐生 さん', '数学・理科', '「なぜ?」を大切に、考え方から一緒に整理します。'], ['高橋 さん', '英語・国語', '音読と書き取りで、言葉の力を毎日少しずつ。'], ['宮本 さん', '算数・社会', '小学生が笑顔で通える授業づくりを心がけています。']].flatMap(([n, s, c], i) => [
      R(100, 350 + i * 360, 1040, 320, '#ffffff', 24),
      ...PH(130, 380 + i * 360, 260, 260, 130, '#c9d5f7'),
      T(n, 430, 400 + i * 360, 680, 42, { font: RD, weight: 900, fill: SC.main }),
      T('担当:' + s, 430, 465 + i * 360, 680, 26, { weight: 700, fill: '#9b7400' }),
      T(c, 430, 525 + i * 360, 680, 26, { weight: 500, fill: SC.ink, lh: 1.7 }),
    ]),
  ]),
  pg('保護者の声', '#ffffff', () => [
    ...scHF(8, '声'),
    ...scTitle('VOICE', '保護者・生徒さんの声'),
    ...[['小6 保護者', '以前は宿題の話をするとけんかでしたが、今は塾の話を自分から楽しそうにします。'], ['中2 生徒', '先生が質問しやすい雰囲気で、数学の定期テストが20点上がりました。'], ['中3 保護者', '面談で志望校までの計画を一緒に立ててくれて、安心して任せられました。']].flatMap(([w, b], i) => [
      R(100, 350 + i * 360, 1040, 300, i % 2 ? SC.pale : '#fff8e1', 28),
      T(b, 170, 395 + i * 360, 900, 30, { weight: 700, fill: SC.ink, lh: 1.7 }),
      T(w, 170, 590 + i * 360, 900, 26, { weight: 700, fill: SC.mid, align: 'right' }),
    ]),
  ]),
  pg('入塾の流れ', SC.pale, () => [
    ...scHF(9, '流れ'),
    ...scTitle('FLOW', '入塾までの4ステップ'),
    ...[['1', 'お問い合わせ', 'お電話かWebフォームで体験授業をご予約ください。'], ['2', '無料体験授業', '60分。実際の授業と教室の雰囲気を体験できます。'], ['3', '面談', '学習の状況やお悩みをうかがい、進め方をご提案します。'], ['4', '入塾手続き', '書類のご提出後、初回授業の日程をご案内します。']].flatMap(([n, t, b], i) => [
      Ci(190, 440 + i * 280, 60, i % 2 ? SC.acc : SC.main),
      T(n, 130, 405 + i * 280, 120, 70, { font: MONT, weight: 900, fill: i % 2 ? SC.main : '#ffffff', align: 'center' }),
      ...(i < 3 ? [R(187, 505 + i * 280, 6, 160, SC.line)] : []),
      T(t, 300, 400 + i * 280, 800, 46, { font: RD, weight: 900, fill: SC.main }),
      T(b, 300, 470 + i * 280, 800, 26, { weight: 500, fill: SC.ink, lh: 1.7 }),
    ]),
  ]),
  pg('体験申込・連絡先', SC.acc, () => [
    T('FREE TRIAL', 100, 150, 900, 30, { font: MONT, weight: 900, fill: SC.main, spacing: 400 }),
    T('まずは体験授業で、\n塾の雰囲気を\n見てください。', 100, 220, 1040, 96, { font: RD, weight: 900, fill: SC.main, lh: 1.3 }),
    R(100, 700, 1040, 420, '#ffffff', 24),
    T('お電話', 150, 745, 400, 28, { weight: 700, fill: SC.mid }),
    T('000-0000-0000', 150, 795, 940, 90, { font: MONT, weight: 900, fill: SC.main }),
    T('受付 14:00〜21:00(日曜・祝日休み)', 150, 920, 940, 28, { weight: 500, fill: SC.ink }),
    T('Web   hinode.example.com/trial', 150, 1000, 940, 32, { weight: 700, fill: SC.main }),
    T('ひので学習塾\nサンプル県サンプル市日の出町 2-3-4 サンプルビル 3F\n駅から徒歩 5 分 / 自転車置き場あり', 100, 1220, 1040, 28, { weight: 700, fill: SC.main, lh: 1.8 }),
  ]),
])

// =====================================================================
// 7. クリニックの院内掲示(A4 縦 / ティール + イエロー)
// =====================================================================
const CL: Pal = { main: '#17605f', acc: '#e8a935', pale: '#eaf5f4', ink: '#1f3b4d', mid: '#516b78', line: '#cfe3e2' }
const clHF = (n: number, sec: string) => hf(CL, 1240, 1754, 'MIDORIGAOKA CLINIC', n, sec)
const clTitle = (ja: string, en: string, y = 150) => [
  T(en, 100, y, 900, 24, { font: MONT, weight: 700, fill: '#8a5a00', spacing: 300 }),
  T(ja, 100, y + 44, 1040, 76, { font: 'Zen Kaku Gothic New', weight: 900, fill: CL.main }),
]
const CLINIC = mkSet('mx-clinic', 'クリニック 院内掲示セット', 'クリニック・院内掲示', 1240, 1754,
  ['クリニック', '病院', '院内掲示', '診療時間', '注意事項', '受付'], [
  pg('ようこそ', CL.main, () => [
    R(100, 150, 80, 8, CL.acc),
    T('MIDORIGAOKA CLINIC', 100, 190, 900, 26, { font: MONT, weight: 700, fill: '#a9d4d2', spacing: 300 }),
    T('みどりが丘\nクリニック', 100, 290, 1040, 140, { font: 'Zen Kaku Gothic New', weight: 900, fill: '#ffffff', lh: 1.2 }),
    T('内科 / 小児科 / 予防接種', 100, 640, 1040, 38, { weight: 700, fill: CL.acc }),
    ...PH(100, 760, 1040, 560, 24, '#4f9a99'),
    T('ご来院の皆さまへ', 100, 1390, 1040, 28, { weight: 700, fill: '#a9d4d2' }),
    T('院内でのご案内をまとめました。ご不明な点は受付までお声がけください。', 100, 1440, 1040, 28, { weight: 400, fill: '#ffffff', lh: 1.7 }),
  ]),
  pg('診療時間', '#ffffff', () => [
    ...clHF(2, '診療時間'),
    ...clTitle('診療時間', 'OPENING HOURS'),
    R(100, 330, 1040, 90, CL.main),
    ...['', '月', '火', '水', '木', '金', '土', '日'].map((d, i) => T(d, i === 0 ? 100 : 330 + (i - 1) * 116, 355, i === 0 ? 230 : 116, 30, { weight: 900, fill: '#ffffff', align: 'center' })),
    ...[['午前  9:00〜12:30', '●●●●●●―'], ['午後  15:00〜18:30', '●●●―●〇―']].flatMap(([t, m], r) => [
      R(100, 420 + r * 150, 1040, 150, r ? '#ffffff' : CL.pale),
      T(t, 100, 470 + r * 150, 230, 24, { weight: 700, fill: CL.ink, align: 'center', lh: 1.4 }),
      ...[...m].map((c, i) => T(c, 330 + i * 116, 468 + r * 150, 116, 44, { weight: 900, fill: c === '●' ? CL.main : c === '〇' ? '#8a5a00' : CL.mid, align: 'center' })),
    ]),
    T('● 診療   〇 土曜午後は 14:00〜16:30   ― 休診', 100, 740, 1040, 24, { weight: 500, fill: CL.mid }),
    R(100, 850, 1040, 500, CL.pale, 16),
    T('休診日', 140, 890, 400, 28, { weight: 900, fill: CL.main }),
    T('日曜日・祝日・年末年始(12/29〜1/3)\n木曜午後・土曜午後(一部)', 140, 950, 960, 30, { weight: 700, fill: CL.ink, lh: 1.7 }),
    T('受付時間', 140, 1130, 400, 28, { weight: 900, fill: CL.main }),
    T('診療終了の 30 分前までにお越しください。', 140, 1190, 960, 30, { weight: 700, fill: CL.ink }),
  ]),
  pg('受付の流れ', CL.pale, () => [
    ...clHF(3, '受付'),
    ...clTitle('ご来院の流れ', 'FLOW'),
    ...[['1', '受付', '保険証(マイナ保険証)と診察券を受付にお出しください。'], ['2', '問診票', '症状や飲んでいる薬を、問診票にご記入ください。'], ['3', '待合室でお待ちください', '順番にお名前をお呼びします。'], ['4', '診察・検査', '診察室へ。症状に応じて検査を行います。'], ['5', '会計・お薬', '会計後、処方箋をお渡しします。']].flatMap(([n, t, b], i) => [
      R(100, 330 + i * 230, 1040, 200, '#ffffff', 16),
      R(100, 330 + i * 230, 130, 200, CL.main, 16),
      T(n, 100, 380 + i * 230, 130, 90, { font: MONT, weight: 900, fill: '#ffffff', align: 'center' }),
      T(t, 270, 370 + i * 230, 820, 40, { weight: 900, fill: CL.main }),
      T(b, 270, 430 + i * 230, 820, 26, { weight: 500, fill: CL.ink, lh: 1.6 }),
    ]),
  ]),
  pg('初めての方へ', '#ffffff', () => [
    ...clHF(4, '初診'),
    ...clTitle('初めての方へ', 'FIRST VISIT'),
    ...[['保険証', '毎月、確認のためご提示ください。'], ['お薬手帳', '現在飲んでいるお薬がわかるものを。'], ['診察券', '2回目以降は診察券をお出しください。']].flatMap(([t, b], i) => [
      R(100 + i * 354, 340, 332, 380, CL.pale, 16),
      Ci(266 + i * 354, 460, 56, CL.acc),
      T(String(i + 1), 210 + i * 354, 425, 112, 64, { font: MONT, weight: 900, fill: CL.ink, align: 'center' }),
      T(t, 100 + i * 354, 555, 332, 34, { weight: 900, fill: CL.main, align: 'center' }),
      T(b, 125 + i * 354, 615, 282, 24, { weight: 500, fill: CL.ink, align: 'center', lh: 1.6 }),
    ]),
    R(100, 800, 1040, 560, CL.main, 16),
    T('ご記入いただく問診票について', 150, 850, 940, 32, { weight: 900, fill: CL.acc }),
    T('・症状がいつから始まったか\n・アレルギーや持病の有無\n・服用中のお薬の名前\n・妊娠中・授乳中の方はお知らせください', 150, 920, 940, 30, { weight: 500, fill: '#ffffff', lh: 1.9 }),
  ]),
  pg('感染対策', CL.pale, () => [
    ...clHF(5, '感染対策'),
    ...clTitle('感染対策のお願い', 'INFECTION CONTROL'),
    ...[['マスク', '待合室ではマスクの着用にご協力ください。'], ['手指消毒', '入口の消毒液をご利用ください。'], ['発熱・咳のある方', '受付の前にスタッフへお知らせください。別室でお待ちいただきます。'], ['付き添いは1名まで', '混雑時は人数を調整させていただく場合があります。']].flatMap(([t, b], i) => [
      R(100, 330 + i * 270, 1040, 240, '#ffffff', 16),
      R(100, 330 + i * 270, 14, 240, i === 2 ? CL.acc : CL.main),
      T(t, 160, 370 + i * 270, 900, 42, { weight: 900, fill: CL.main }),
      T(b, 160, 440 + i * 270, 900, 28, { weight: 500, fill: CL.ink, lh: 1.7 }),
    ]),
  ]),
  pg('お薬・会計', '#ffffff', () => [
    ...clHF(6, '会計'),
    ...clTitle('お会計・お薬について', 'PAYMENT'),
    ...fieldRows(CL, 100, 340, 300, 740, 150, [['お支払い方法', '現金・クレジットカード・交通系ICが使えます'], ['処方箋', '院外処方です。お近くの薬局でお受け取りください。'], ['領収書・明細書', '無料で発行します。受付でお申し出ください。'], ['診断書', '発行まで 3〜5 営業日かかります。']], 28),
    R(100, 1050, 1040, 300, CL.pale, 16),
    T('会計のあと、お忘れ物がないか\nもう一度ご確認ください。', 150, 1110, 940, 40, { weight: 900, fill: CL.main, lh: 1.6 }),
  ]),
  pg('予約案内', CL.main, () => [
    ...hf({ ...CL, main: '#ffffff', mid: '#d3ecea', line: '#3f8f8f' }, 1240, 1754, 'MIDORIGAOKA CLINIC', 7, '予約'),
    T('RESERVATION', 100, 150, 900, 24, { font: MONT, weight: 700, fill: CL.acc, spacing: 300 }),
    T('予約は\n24時間受付中', 100, 194, 1040, 90, { font: 'Zen Kaku Gothic New', weight: 900, fill: '#ffffff', lh: 1.25 }),
    ...[['Web予約', 'reserve.example.com', '24時間・当日の順番予約もできます'], ['お電話', '000-0000-0000', '診療時間内にお電話ください'], ['受付で', '直接ご予約', '次回の予約をその場で承ります']].flatMap(([t, m, b], i) => [
      R(100, 540 + i * 270, 1040, 230, '#ffffff', 16),
      T(t, 140, 580 + i * 270, 300, 30, { weight: 900, fill: CL.mid }),
      T(m, 140, 630 + i * 270, 960, 56, { font: i === 2 ? 'Zen Kaku Gothic New' : MONT, weight: 900, fill: CL.main }),
      T(b, 140, 705 + i * 270, 960, 26, { weight: 500, fill: CL.ink }),
    ]),
  ]),
  pg('休診のお知らせ', '#ffffff', () => [
    ...clHF(8, 'お知らせ'),
    ...clTitle('休診のお知らせ', 'NOTICE'),
    R(100, 330, 1040, 340, '#fff6e0', 16, { stroke: CL.acc, strokeWidth: 4 }),
    T('年末年始の休診', 150, 370, 940, 40, { weight: 900, fill: CL.ink }),
    T('12月29日(水)〜 1月3日(月)', 150, 450, 940, 64, { weight: 900, fill: CL.main }),
    T('1月4日(火)から通常どおり診療します。', 150, 560, 940, 28, { weight: 500, fill: CL.ink }),
    ...[['11月', '3日(水・祝)  23日(火・祝)'], ['12月', '29日(水)〜31日(金)'], ['1月', '1日(土)〜3日(月)']].flatMap(([m, d], i) => [
      R(100, 740 + i * 150, 1040, 1, CL.line),
      T(m, 100, 780 + i * 150, 200, 38, { weight: 900, fill: CL.main }),
      T(d, 330, 782 + i * 150, 780, 34, { weight: 500, fill: CL.ink }),
    ]),
    R(100, 1190, 1040, 1, CL.line),
  ]),
  pg('院内マップ', CL.pale, () => [
    ...clHF(9, '院内案内'),
    ...clTitle('院内のご案内', 'FLOOR GUIDE'),
    R(100, 330, 1040, 800, '#ffffff', 0, { stroke: CL.main, strokeWidth: 6 }),
    ...[['受付', 100, 330, 380, 260], ['待合室', 480, 330, 660, 260], ['診察室 1', 100, 590, 380, 270], ['診察室 2', 100, 860, 380, 270], ['処置室', 480, 590, 330, 270], ['検査室', 810, 590, 330, 270], ['トイレ', 480, 860, 200, 270], ['授乳室', 680, 860, 220, 270], ['出口', 900, 860, 240, 270]].flatMap(([n, x, y, w, h], i) => [
      R(x as number, y as number, w as number, h as number, i % 3 === 0 ? CL.pale : '#ffffff', 0, { stroke: CL.main, strokeWidth: 3 }),
      T(String(n), x as number, (y as number) + (h as number) / 2 - 18, w as number, 30, { weight: 900, fill: CL.main, align: 'center' }),
    ]),
    T('入口は 1 階です。エレベーターは受付の奥にあります。', 100, 1190, 1040, 26, { weight: 500, fill: CL.mid }),
  ]),
  pg('アクセス・連絡先', CL.main, () => [
    T('CONTACT', 100, 150, 900, 26, { font: MONT, weight: 700, fill: CL.acc, spacing: 300 }),
    T('みどりが丘クリニック', 100, 210, 1040, 70, { font: 'Zen Kaku Gothic New', weight: 900, fill: '#ffffff' }),
    R(100, 340, 1040, 2, '#4f9a99'),
    T('〒000-0000\nサンプル県サンプル市緑が丘 1-2-3\nみどりが丘駅 北口から 徒歩 3 分', 100, 400, 1040, 32, { weight: 500, fill: '#ffffff', lh: 1.9 }),
    T('TEL', 100, 700, 200, 26, { font: MONT, weight: 700, fill: CL.acc, spacing: 300 }),
    T('000-0000-0000', 100, 750, 1040, 90, { font: MONT, weight: 900, fill: '#ffffff' }),
    R(100, 960, 1040, 380, '#ffffff', 16),
    T('急を要する症状のとき', 150, 1000, 940, 32, { weight: 900, fill: CL.main }),
    T('夜間・休診日に症状が重い場合は、お近くの救急外来、または 119 番にご連絡ください。', 150, 1070, 940, 28, { weight: 500, fill: CL.ink, lh: 1.7 }),
  ]),
])

// =====================================================================
// 8. 年間カレンダー 2027(A4 横 / 生成り + 朱 / しっぽり明朝 + Montserrat)
// =====================================================================
const CA = { bg: '#faf7f2', side: '#efe8dc', red: '#c9402a', ink: '#23201d', mid: '#6b655d', line: '#ddd5c7' }
const CAL_YEAR = 2027
// 2027年の祝日(春分・秋分は国立天文台「令和9年暦要項」2026-02-02 発表で確認済み)
const HOLIDAYS: Record<string, string> = {
  '1-1': '元日', '1-11': '成人の日', '2-11': '建国記念の日', '2-23': '天皇誕生日', '3-21': '春分の日', '3-22': '振替休日', '4-29': '昭和の日',
  '5-3': '憲法記念日', '5-4': 'みどりの日', '5-5': 'こどもの日', '7-19': '海の日', '8-11': '山の日', '9-20': '敬老の日', '9-23': '秋分の日',
  '10-11': 'スポーツの日', '11-3': '文化の日', '11-23': '勤労感謝の日',
}
const MONTH_INFO: [string, string, string, string][] = [
  ['JANUARY', '睦月', '新しい一年の、静かな始まり。', '初詣・書き初め'], ['FEBRUARY', '如月', '寒さのなかに、梅のつぼみ。', '節分・バレンタイン'], ['MARCH', '弥生', '春の気配が、そっと近づく。', 'ひな祭り・卒業'],
  ['APRIL', '卯月', '桜の下で、新しい出会い。', 'お花見・入学'], ['MAY', '皐月', '風が薫る、緑の季節。', '新緑・端午の節句'], ['JUNE', '水無月', '雨音を楽しむ、あじさいの頃。', '衣替え・梅雨'],
  ['JULY', '文月', '七夕と、夏の入り口。', '七夕・海開き'], ['AUGUST', '葉月', '入道雲と、夕立のあと。', '花火・お盆'], ['SEPTEMBER', '長月', '秋の虫の声、月の夜。', 'お月見・敬老'],
  ['OCTOBER', '神無月', '色づく山と、実りの季節。', '運動会・紅葉'], ['NOVEMBER', '霜月', '朝の冷たさと、あたたかい鍋。', '七五三・酉の市'], ['DECEMBER', '師走', 'ゆく年を振り返る、一年の締め。', '冬至・大掃除'],
]
const monthPage = (m: number): TemplatePage => pg(`${m + 1}月`, CA.bg, () => {
  const [en, ja, phrase, events] = MONTH_INFO[m]
  const first = new Date(CAL_YEAR, m, 1).getDay()
  const days = new Date(CAL_YEAR, m + 1, 0).getDate()
  const cells: FabricObject[] = []
  const x0 = 640, cw = 144, y0 = 330, rh = 130
  ;['日', '月', '火', '水', '木', '金', '土'].forEach((d, i) => cells.push(T(d, x0 + i * cw, 262, cw, 28, { weight: 700, fill: i === 0 ? CA.red : CA.mid, align: 'center' })))
  cells.push(R(x0, 310, cw * 7, 2, CA.ink))
  for (let d = 1; d <= days; d++) {
    const idx = first + d - 1, col = idx % 7, row = Math.floor(idx / 7)
    const hol = HOLIDAYS[`${m + 1}-${d}`], red = col === 0 || !!hol
    cells.push(T(String(d), x0 + col * cw + 14, y0 + row * rh + 10, 70, 40, { font: MONT, weight: 700, fill: red ? CA.red : CA.ink }))
    if (hol) cells.push(T(hol, x0 + col * cw + 8, y0 + row * rh + 62, cw - 12, 20, { weight: 500, fill: CA.red, lh: 1.2 }))
  }
  for (let r = 0; r <= 6; r++) cells.push(R(x0, y0 + r * rh - (r === 0 ? 0 : 0), cw * 7, 1, CA.line))
  return [
    R(0, 0, 560, 1240, CA.side),
    T(String(m + 1), 60, 50, 440, 280, { font: 'Bebas Neue', weight: 400, fill: CA.red }),
    T(ja, 60, 390, 440, 44, { font: MINCHO, weight: 800, fill: CA.ink }),
    T(phrase, 60, 450, 440, 26, { font: MINCHO, weight: 700, fill: CA.mid, lh: 1.6 }),
    ...PH(60, 560, 440, 480, 12, '#ddd2c0'),
    T(events, 60, 1075, 440, 24, { weight: 500, fill: CA.mid }),
    T(en, x0, 90, 700, 44, { font: MONT, weight: 700, fill: CA.ink, spacing: 400 }),
    T(String(CAL_YEAR), x0 + 560, 90, 454, 44, { font: MONT, weight: 400, fill: CA.mid, align: 'right', spacing: 200 }),
    T('令和9年', x0 + 560, 150, 454, 28, { font: MINCHO, weight: 700, fill: CA.mid, align: 'right' }),
    ...cells,
    T('※ 祝日は2027年の暦要項にもとづきます。法改正などで変わる場合があります。', x0, 1170, 1014, 20, { weight: 400, fill: CA.mid }),
  ]
})
const CALENDAR = mkSet('mx-calendar', '年間カレンダー 2027(A4 横)', 'カレンダー', 1754, 1240,
  ['カレンダー', '2027', '年間', 'A4横', '祝日', '壁掛け'], [
  pg('表紙', CA.side, () => [
    R(100, 100, 1554, 1040, '', 0, { stroke: CA.red, strokeWidth: 3, fill: '' }),
    T('CALENDAR', 160, 170, 700, 30, { font: MONT, weight: 700, fill: CA.red, spacing: 500 }),
    T('2027', 160, 230, 800, 360, { font: 'Bebas Neue', weight: 400, fill: CA.ink }),
    T('季節をめくる、\n十二か月のこよみ。', 160, 640, 800, 56, { font: MINCHO, weight: 800, fill: CA.ink, lh: 1.5 }),
    T('令和9年  /  January – December', 160, 900, 800, 28, { font: MINCHO, weight: 700, fill: CA.mid }),
    ...PH(960, 170, 640, 900, 12, '#ddd2c0'),
    T('KOTOYOMI STUDIO', 160, 1020, 700, 24, { font: MONT, weight: 700, fill: CA.mid, spacing: 400 }),
  ]),
  ...Array.from({ length: 12 }, (_, m) => monthPage(m)),
])

// =====================================================================
// 9. ウェディング SNS・席次表(Instagram 正方形 / セージ + アイボリー + ゴールド)
// =====================================================================
const WD = { sage: '#6f8161', ivory: '#fbf8f2', gold: '#8d6f3f', ink: '#38382f', mid: '#68685c', pale: '#e9eee3', line: '#d9d4c5' }
const wdBar = (n: number, dark = false): FabricObject[] => [
  T('Takumi  &  Ayano', 80, 56, 500, 26, { font: 'Playfair Display', weight: 400, fill: dark ? '#e3ebd9' : WD.gold, spacing: 150 }),
  T(String(n).padStart(2, '0'), 800, 56, 200, 26, { font: 'Playfair Display', weight: 400, fill: dark ? '#e3ebd9' : WD.gold, align: 'right' }),
]
const tableBlock = (cx: number, label: string, names: string[]): FabricObject[] => [
  Ci(cx, 440, 100, WD.pale, { stroke: WD.sage, strokeWidth: 3 }),
  T(label, cx - 100, 405, 200, 56, { font: 'Playfair Display', weight: 700, fill: WD.sage, align: 'center' }),
  ...names.map((n, i) => T(n, cx - 150, 570 + i * 52, 300, 28, { font: MINCHO, weight: 700, fill: WD.ink, align: 'center' })),
]
const WEDDING = mkSet('mx-wedding', 'ウェディング SNS・席次表', 'ウェディング', 1080, 1080,
  ['ウェディング', '結婚式', '席次表', 'Instagram', '招待', 'プロフィール'], [
  pg('Save the date', WD.sage, () => [
    R(60, 60, 960, 960, '', 0, { stroke: '#d9e2cf', strokeWidth: 2, fill: '' }),
    T('SAVE THE DATE', 80, 180, 920, 30, { font: MONT, weight: 700, fill: '#e3ebd9', align: 'center', spacing: 500 }),
    T('Takumi\n&\nAyano', 80, 260, 920, 130, { font: 'Playfair Display', weight: 400, fill: '#ffffff', align: 'center', lh: 1.1 }),
    R(500, 770, 80, 2, '#d9e2cf'),
    T('2027.05.22  SAT', 80, 810, 920, 40, { font: MONT, weight: 700, fill: '#ffffff', align: 'center', spacing: 300 }),
    T('ホテル グランヴェール 横浜', 80, 880, 920, 28, { font: MINCHO, weight: 700, fill: '#e3ebd9', align: 'center' }),
  ]),
  pg('ご挨拶', WD.ivory, () => [
    ...wdBar(2),
    T('Invitation', 80, 140, 920, 70, { font: 'Playfair Display', weight: 400, fill: WD.sage, align: 'center' }),
    R(500, 250, 80, 2, WD.gold),
    T('このたび 私たちは\n結婚式を挙げることになりました。\n\n日頃お世話になっている皆さまに\nささやかなお披露目の席を\n設けたく存じます。\n\nご多用のところ恐縮ですが\nご出席くださいますよう\nお願い申し上げます。', 80, 300, 920, 34, { font: MINCHO, weight: 700, fill: WD.ink, align: 'center', lh: 1.8 }),
    T('2027年 吉日   新郎 山岡 拓海   新婦 小野寺 彩乃', 80, 990, 920, 22, { weight: 500, fill: WD.mid, align: 'center' }),
  ]),
  pg('プロフィール', WD.ivory, () => [
    ...wdBar(3),
    ...[['GROOM', '山岡 拓海', 'Takumi Yamaoka', '建築設計士 / 趣味はコーヒーと登山。ふたりで山に登る時間が好きです。'], ['BRIDE', '小野寺 彩乃', 'Ayano Onodera', '小学校教諭 / 趣味はお菓子づくり。笑顔の絶えない家庭をつくりたいです。']].flatMap(([r, n, e, b], i) => [
      ...PH(80 + i * 470, 130, 450, 460, 225, WD.pale),
      T(r, 80 + i * 470, 625, 450, 24, { font: MONT, weight: 700, fill: WD.gold, align: 'center', spacing: 400 }),
      T(n, 80 + i * 470, 665, 450, 44, { font: MINCHO, weight: 800, fill: WD.ink, align: 'center' }),
      T(e, 80 + i * 470, 725, 450, 24, { font: 'Playfair Display', weight: 400, fill: WD.mid, align: 'center' }),
      T(b, 100 + i * 470, 790, 410, 24, { weight: 500, fill: WD.ink, align: 'center', lh: 1.75 }),
    ]),
  ]),
  pg('日程・会場', WD.pale, () => [
    ...wdBar(4),
    T('Date & Venue', 80, 140, 920, 70, { font: 'Playfair Display', weight: 400, fill: WD.sage }),
    ...fieldRows({ main: WD.sage, acc: WD.gold, pale: WD.pale, ink: WD.ink, mid: WD.gold, line: WD.line }, 80, 280, 220, 700, 120, [['日時', '2027年5月22日(土)\n受付 11:00 / 挙式 11:30 / 披露宴 12:30'], ['会場', 'ホテル グランヴェール 横浜\nサンプル県横浜市サンプル町 1-2-3'], ['アクセス', 'みなとみらい駅から 徒歩 5 分\n(無料送迎バスあり)'], ['お返事', '2027年4月10日(土)までに\nご返信ください']], 26, MINCHO),
  ]),
  pg('当日の流れ', WD.ivory, () => [
    ...wdBar(5),
    T('Timeline', 80, 140, 920, 70, { font: 'Playfair Display', weight: 400, fill: WD.sage }),
    R(250, 300, 3, 640, WD.sage),
    ...[['11:00', '受付'], ['11:30', '挙式'], ['12:00', 'フラワーシャワー・集合写真'], ['12:30', '披露宴 開宴'], ['15:00', '披露宴 お開き'], ['15:30', 'お見送り']].flatMap(([t, h], i) => [
      Ci(251, 320 + i * 125, 12, WD.gold),
      T(t, 80, 303 + i * 125, 140, 30, { font: MONT, weight: 700, fill: WD.sage, align: 'right' }),
      T(h, 300, 300 + i * 125, 700, 34, { font: MINCHO, weight: 800, fill: WD.ink }),
    ]),
  ]),
  pg('席次表 1', WD.ivory, () => [
    ...wdBar(6),
    T('Seating Chart  1/2', 80, 130, 920, 60, { font: 'Playfair Display', weight: 400, fill: WD.sage, align: 'center' }),
    R(340, 220, 400, 60, WD.sage, 30),
    T('新郎新婦  メインテーブル', 340, 235, 400, 26, { font: MINCHO, weight: 700, fill: '#ffffff', align: 'center' }),
    ...tableBlock(200, 'A', ['鈴木 浩二 様', '鈴木 麻衣 様', '石田 健 様', '石田 菜月 様', '岡本 隼人 様']).map((o) => { o.set({ top: o.top + 0 }); return o }),
    ...tableBlock(540, 'B', ['青山 悠真 様', '青山 理沙 様', '久保田 大地 様', '森 美咲 様', '水野 蓮 様']),
    ...tableBlock(880, 'C', ['川村 純 様', '川村 麻美 様', '丸山 慎吾 様', '宮下 優 様', '安藤 彩 様']),
  ]),
  pg('席次表 2', WD.ivory, () => [
    ...wdBar(7),
    T('Seating Chart  2/2', 80, 130, 920, 60, { font: 'Playfair Display', weight: 400, fill: WD.sage, align: 'center' }),
    R(340, 220, 400, 60, WD.sage, 30),
    T('新郎新婦  メインテーブル', 340, 235, 400, 26, { font: MINCHO, weight: 700, fill: '#ffffff', align: 'center' }),
    ...tableBlock(200, 'D', ['山岡 勝 様', '山岡 幸子 様', '山岡 千秋 様', '山岡 太一 様', '山岡 和香 様']),
    ...tableBlock(540, 'E', ['小野寺 誠 様', '小野寺 恵子 様', '小野寺 悠 様', '大西 一平 様', '大西 ゆい 様']),
    ...tableBlock(880, 'F', ['松尾 圭 様', '松尾 沙耶 様', '柴田 亮 様', '堀内 奈々 様', '高梨 光 様']),
  ]),
  pg('お料理', WD.pale, () => [
    ...wdBar(8),
    T('Menu', 80, 140, 920, 70, { font: 'Playfair Display', weight: 400, fill: WD.sage, align: 'center' }),
    ...[['前菜', '季節の野菜と 帆立のマリネ'], ['スープ', '冷製とうもろこしのポタージュ'], ['魚料理', '旬の白身魚 レモンバターソース'], ['肉料理', '国産牛フィレ肉のロースト'], ['デザート', 'ふたりのウェディングケーキ']].flatMap(([k, d], i) => [
      T(k, 80, 270 + i * 130, 920, 24, { font: MONT, weight: 700, fill: WD.gold, align: 'center', spacing: 200 }),
      T(d, 80, 310 + i * 130, 920, 34, { font: MINCHO, weight: 800, fill: WD.ink, align: 'center' }),
    ]),
  ]),
  pg('ゲストのお願い', WD.ivory, () => [
    ...wdBar(9),
    T('Notes for Guests', 80, 140, 920, 70, { font: 'Playfair Display', weight: 400, fill: WD.sage }),
    ...[['ドレスコード', 'セミフォーマットでお越しください。\n白一色の装いはご遠慮ください。'], ['お写真について', '挙式中の撮影はカメラマンにお任せください。\n披露宴では自由に撮影いただけます。'], ['お子さま・ご持病のある方', '席の配慮やお料理の変更ができます。\n事前にお知らせください。']].flatMap(([t, b], i) => [
      R(80, 280 + i * 250, 920, 210, '#ffffff', 12, { stroke: WD.line, strokeWidth: 2 }),
      T(t, 120, 310 + i * 250, 840, 32, { font: MINCHO, weight: 800, fill: WD.sage }),
      T(b, 120, 370 + i * 250, 840, 26, { weight: 500, fill: WD.ink, lh: 1.7 }),
    ]),
  ]),
  pg('Thank you', WD.sage, () => [
    R(60, 60, 960, 960, '', 0, { stroke: '#d9e2cf', strokeWidth: 2, fill: '' }),
    T('Thank you', 80, 300, 920, 130, { font: 'Playfair Display', weight: 400, fill: '#ffffff', align: 'center' }),
    T('ふたりの新しい門出を\n見守ってください。', 80, 520, 920, 40, { font: MINCHO, weight: 700, fill: '#ffffff', align: 'center', lh: 1.7 }),
    T('#takumi_ayano_wedding', 80, 800, 920, 30, { font: MONT, weight: 700, fill: '#e3ebd9', align: 'center', spacing: 100 }),
  ]),
])

// =====================================================================
// 10. EC 商品ページ用画像(正方形 / オフホワイト + コーラル + ブラック)
// =====================================================================
const EC = { bg: '#f4f2ef', coral: '#e8482a', ink: '#1a1a1a', mid: '#5f5a55', line: '#dbd6d0', white: '#ffffff' }
const ZK = 'Zen Kaku Gothic New'
const ecTag = (t: string, x = 80, y = 80, dark = false): FabricObject[] => [R(x, y, 40, 6, EC.coral), T(t, x, y + 20, Math.min(700, 1000 - x), 24, { font: MONT, weight: 700, fill: dark ? '#e6e1db' : EC.mid, spacing: 300 })]
const ECOM = mkSet('mx-ec', 'EC 商品ページ画像セット', 'EC・商品画像', 1080, 1080,
  ['EC', '商品ページ', '商品画像', 'ネットショップ', 'サイズ表', 'レビュー'], [
  pg('メイン', EC.bg, () => [
    ...PH(0, 0, 1080, 1080, 0, '#e6e1db'),
    R(0, 700, 1080, 380, EC.ink),
    T('NURUKU  /  500ml', 80, 740, 700, 26, { font: MONT, weight: 700, fill: EC.coral, spacing: 300 }),
    T('朝のお茶が、\n夕方まで熱いまま。', 80, 790, 920, 64, { font: ZK, weight: 900, fill: '#ffffff', lh: 1.3 }),
    T('真空断熱ステンレスボトル', 80, 960, 700, 30, { weight: 500, fill: '#d6d1ca' }),
    Ci(920, 880, 120, EC.coral),
    T('保温\n12h', 800, 835, 240, 56, { font: ZK, weight: 900, fill: '#ffffff', align: 'center', lh: 1.1 }),
  ]),
  pg('特長3つ', EC.white, () => [
    ...ecTag('FEATURES'),
    T('選ばれる3つの理由', 80, 150, 920, 64, { font: ZK, weight: 900, fill: EC.ink }),
    ...[['01', '12時間保温・24時間保冷', '真空二重構造で、氷は丸一日とけにくい。'], ['02', '230gの軽さ', '毎日持ち歩いても負担にならない重さ。'], ['03', 'パーツは3つだけ', 'すべて外して洗える、シンプルな作り。']].flatMap(([n, t, b], i) => [
      R(80, 290 + i * 260, 920, 230, EC.bg),
      T(n, 110, 340 + i * 260, 140, 90, { font: BEBAS, weight: 400, fill: EC.coral }),
      T(t, 260, 345 + i * 260, 720, 40, { font: ZK, weight: 900, fill: EC.ink }),
      T(b, 260, 415 + i * 260, 720, 26, { weight: 500, fill: EC.mid, lh: 1.6 }),
    ]),
  ]),
  pg('こだわり', EC.bg, () => [
    ...PH(0, 0, 540, 1080, 0, '#e0dbd4'),
    ...ecTag('MATERIAL', 600, 100),
    T('医療器具にも使われる\nステンレスを採用', 600, 170, 420, 38, { font: ZK, weight: 900, fill: EC.ink, lh: 1.4 }),
    T('においが移りにくく、お茶もコーヒーも本来の味わいに。内側は磨き仕上げで汚れが落ちやすい。', 600, 360, 420, 26, { weight: 500, fill: EC.mid, lh: 1.8 }),
    R(600, 760, 400, 1, EC.line),
    T('素材', 600, 800, 120, 24, { weight: 700, fill: EC.coral }),
    T('本体 ステンレス鋼\nフタ ポリプロピレン', 730, 800, 280, 26, { weight: 500, fill: EC.ink, lh: 1.7 }),
  ]),
  pg('使い方', EC.white, () => [
    ...ecTag('HOW TO USE'),
    T('使い方は、かんたん3ステップ', 80, 150, 920, 56, { font: ZK, weight: 900, fill: EC.ink }),
    ...[['STEP 1', '予熱する', 'お湯で1分温めます。'], ['STEP 2', '飲み物を入れる', '8分目までが目安です。'], ['STEP 3', 'しっかり閉める', 'カチッと音がするまで回します。']].flatMap(([s, t, b], i) => [
      ...PH(80 + i * 320, 290, 280, 470, 0, '#e6e1db'),
      T(s, 80 + i * 320, 790, 280, 24, { font: MONT, weight: 700, fill: EC.coral, spacing: 200 }),
      T(t, 80 + i * 320, 830, 280, 34, { font: ZK, weight: 900, fill: EC.ink }),
      T(b, 80 + i * 320, 890, 280, 24, { weight: 500, fill: EC.mid, lh: 1.6 }),
    ]),
  ]),
  pg('サイズ表', EC.bg, () => [
    ...ecTag('SIZE'),
    T('サイズ・仕様', 80, 150, 920, 64, { font: ZK, weight: 900, fill: EC.ink }),
    makeTable({ rows: 5, cols: 3, header: EC.ink, border: EC.line, cellW: 306, cellH: 100, fontSize: 26, cells: [['', '350ml', '500ml'], ['高さ', '17.5cm', '21.0cm'], ['直径', '6.5cm', '7.0cm'], ['重さ', '190g', '230g'], ['保温', '10時間', '12時間']] }).set({ left: 80, top: 290 }),
    T('※ 製造上、数値に多少の誤差が出る場合があります。', 80, 840, 920, 24, { weight: 400, fill: EC.mid }),
    T('食洗機は不可 / 直火・電子レンジ不可', 80, 900, 920, 26, { weight: 700, fill: EC.ink }),
  ]),
  pg('カラー', EC.white, () => [
    ...ecTag('COLOR'),
    T('選べる4色', 80, 150, 920, 64, { font: ZK, weight: 900, fill: EC.ink }),
    ...[['ブラック', '#222222'], ['ストーン', '#c9c2b8'], ['フォレスト', '#4a6350'], ['コーラル', '#e8482a']].flatMap(([n, c], i) => [
      R(80 + (i % 2) * 470, 290 + Math.floor(i / 2) * 370, 450, 340, EC.bg),
      R(240 + (i % 2) * 470, 320 + Math.floor(i / 2) * 370, 130, 220, c, 30),
      T(n, 80 + (i % 2) * 470, 565 + Math.floor(i / 2) * 370, 450, 32, { font: ZK, weight: 900, fill: EC.ink, align: 'center' }),
    ]),
  ]),
  pg('レビュー', EC.bg, () => [
    ...ecTag('REVIEW'),
    T('ご購入者さまの声', 80, 150, 920, 64, { font: ZK, weight: 900, fill: EC.ink }),
    T('4.7', 80, 260, 260, 130, { font: MONT, weight: 900, fill: EC.coral }),
    T('★★★★★', 340, 285, 500, 50, { weight: 400, fill: EC.coral }),
    T('レビュー 1,280 件', 340, 350, 500, 28, { weight: 500, fill: EC.mid }),
    ...[['朝入れたお茶が夕方まで熱い。通勤のおともです。', '30代 女性'], ['軽くて洗いやすい。フタのパッキンも外せて清潔に使えます。', '40代 男性']].flatMap(([b, w], i) => [
      R(80, 450 + i * 280, 920, 250, '#ffffff'),
      T(b, 120, 490 + i * 280, 840, 30, { weight: 700, fill: EC.ink, lh: 1.7 }),
      T(w, 120, 640 + i * 280, 840, 24, { weight: 500, fill: EC.mid }),
    ]),
  ]),
  pg('よくある質問', EC.white, () => [
    ...ecTag('Q&A'),
    T('よくあるご質問', 80, 150, 920, 64, { font: ZK, weight: 900, fill: EC.ink }),
    ...[['炭酸飲料は入れられますか?', '内圧が上がり危険なため、おやめください。'], ['においが気になるときは?', '重曹を溶かしたぬるま湯で、ひと晩つけ置きしてください。'], ['保証はありますか?', 'お届けから1年間、自然故障を無料で修理します。']].flatMap(([q, a], i) => [
      T('Q', 80, 290 + i * 240, 70, 60, { font: MONT, weight: 900, fill: EC.coral }),
      T(q, 160, 300 + i * 240, 840, 34, { font: ZK, weight: 900, fill: EC.ink }),
      T(a, 160, 360 + i * 240, 840, 26, { weight: 500, fill: EC.mid, lh: 1.7 }),
      R(80, 480 + i * 240, 920, 1, EC.line),
    ]),
  ]),
  pg('付属品', EC.bg, () => [
    ...ecTag('IN THE BOX'),
    T('セット内容', 80, 150, 920, 64, { font: ZK, weight: 900, fill: EC.ink }),
    ...['ボトル本体', 'フタ', '専用パッキン(予備)', '洗浄ブラシ'].flatMap((t, i) => {
      const x = 80 + (i % 2) * 470, y = 290 + Math.floor(i / 2) * 340
      return [...PH(x, y, 450, 250, 0, '#e6e1db'), T(t, x, y + 270, 450, 28, { font: ZK, weight: 900, fill: EC.ink })]
    }),
  ]),
  pg('配送・ギフト', EC.ink, () => [
    ...ecTag('SHIPPING & GIFT', 80, 80, true),
    T('ギフトにも\nおすすめです', 80, 150, 920, 80, { font: ZK, weight: 900, fill: '#ffffff', lh: 1.3 }),
    ...[['送料', '全国一律 550円(5,000円以上で無料)'], ['お届け', 'ご注文から 2〜3 日で発送'], ['ギフト', '無料ラッピング・メッセージカード対応'], ['返品', '到着後 14 日以内なら未使用品の返品OK']].flatMap(([l, v], i) => [
      R(80, 390 + i * 150, 920, 1, '#4a4642'),
      T(l, 80, 425 + i * 150, 200, 28, { weight: 700, fill: EC.coral }),
      T(v, 290, 422 + i * 150, 710, 30, { weight: 500, fill: '#ffffff', lh: 1.5 }),
    ]),
  ]),
])

// =====================================================================
// 11. ポッドキャスト・ラジオ(正方形 / ディープパープル + イエロー)
// =====================================================================
const PC = { bg: '#2a1650', bg2: '#3a2269', yel: '#ffd84a', cream: '#f6f1e8', ink: '#2a1650', mid: '#c9bde6' }
const pcBar = (n: number, light = false): FabricObject[] => [
  T('HOSHIZORA RADIO', 80, 56, 500, 24, { font: MONT, weight: 700, fill: light ? PC.ink : PC.yel, spacing: 300 }),
  T(n ? 'EP.' + String(n).padStart(2, '0') : 'PODCAST', 700, 56, 300, 24, { font: MONT, weight: 700, fill: light ? PC.ink : PC.mid, align: 'right' }),
]
const PODCAST = mkSet('mx-podcast', 'ポッドキャスト・ラジオ カバー&告知', 'ポッドキャスト', 1080, 1080,
  ['ポッドキャスト', 'ラジオ', 'カバーアート', '音声配信', 'エピソード', '告知'], [
  pg('カバーアート', PC.bg, () => [
    Ci(540, 540, 430, PC.bg2), Ci(540, 540, 330, '', { stroke: PC.yel, strokeWidth: 4, fill: '' }),
    S('star5', 140, 130, 90, PC.yel), S('star5', 850, 800, 70, PC.yel),
    T('夜ふかし\nラジオ', 140, 330, 800, 150, { font: 'Dela Gothic One', weight: 400, fill: '#ffffff', align: 'center', lh: 1.1 }),
    T('ほしぞら', 140, 700, 800, 60, { font: 'Dela Gothic One', weight: 400, fill: PC.yel, align: 'center' }),
    T('毎週 水曜 24:00 更新', 140, 800, 800, 30, { weight: 700, fill: PC.mid, align: 'center' }),
  ]),
  pg('番組紹介', PC.cream, () => [
    ...pcBar(0, true),
    T('ABOUT', 80, 150, 600, 28, { font: MONT, weight: 900, fill: '#7a5a00', spacing: 400 }),
    T('眠れない夜の、\nとなりにいる声。', 80, 200, 920, 100, { font: 'Dela Gothic One', weight: 400, fill: PC.ink, lh: 1.25 }),
    T('「夜ふかしラジオ ほしぞら」は、ふたりのパーソナリティが日常の小さな話を30分お届けする音声番組です。作業のおともに、眠る前のひとときに。', 80, 520, 920, 32, { weight: 500, fill: PC.ink, lh: 1.8 }),
    R(80, 860, 920, 100, PC.ink, 50),
    T('毎週水曜 24:00 / 約 30 分', 80, 887, 920, 34, { weight: 900, fill: PC.yel, align: 'center' }),
  ]),
  pg('最新エピソード', PC.yel, () => [
    ...pcBar(24, true),
    T('NEW EPISODE', 80, 150, 600, 30, { font: MONT, weight: 900, fill: PC.ink, spacing: 400 }),
    T('#24', 80, 200, 400, 200, { font: BEBAS, weight: 400, fill: PC.ink }),
    T('秋の夜長に、\n読んだ本の話をしよう', 80, 430, 920, 80, { font: 'Dela Gothic One', weight: 400, fill: PC.ink, lh: 1.3 }),
    T('10月13日(水)配信  /  32分', 80, 700, 920, 36, { weight: 900, fill: PC.ink }),
    R(80, 800, 920, 140, PC.ink, 70),
    T('▶  今すぐ聴く', 80, 840, 920, 54, { weight: 900, fill: PC.yel, align: 'center' }),
  ]),
  pg('ゲスト', PC.bg, () => [
    ...pcBar(25),
    ...PH(80, 140, 440, 600, 220, '#4a3384'),
    T('GUEST', 580, 160, 400, 28, { font: MONT, weight: 900, fill: PC.yel, spacing: 400 }),
    T('古川 美波 さん', 580, 210, 420, 56, { font: 'Dela Gothic One', weight: 400, fill: '#ffffff', lh: 1.3 }),
    T('本屋の店主・\nエッセイスト', 580, 380, 420, 30, { weight: 700, fill: PC.mid, lh: 1.6 }),
    T('「本の選び方」と「読めない日の過ごし方」についてゆっくりお話しします。', 580, 520, 420, 28, { weight: 500, fill: '#ffffff', lh: 1.8 }),
    R(80, 800, 920, 1, '#5a4390'),
    T('10月20日(水)24:00 配信', 80, 840, 920, 36, { weight: 900, fill: PC.yel }),
  ]),
  pg('エピソード一覧', PC.cream, () => [
    ...pcBar(0, true),
    T('EPISODES', 80, 140, 700, 56, { font: 'Dela Gothic One', weight: 400, fill: PC.ink }),
    ...[['#24', '秋の夜長に、読んだ本の話', '32分'], ['#23', 'はじめて一人暮らしをした夜', '28分'], ['#22', 'リスナーさんのお悩み相談', '35分'], ['#21', '朝型に挑戦して一週間', '30分']].flatMap(([n, t, m], i) => [
      R(80, 260 + i * 185, 920, 160, i === 0 ? PC.yel : '#ffffff', 16),
      T(n, 110, 305 + i * 185, 150, 70, { font: BEBAS, weight: 400, fill: PC.ink }),
      T(t, 260, 295 + i * 185, 600, 34, { weight: 900, fill: PC.ink, lh: 1.3 }),
      T(m, 260, 355 + i * 185, 300, 26, { weight: 500, fill: '#5a4a80' }),
      T('▶', 880, 310 + i * 185, 90, 50, { weight: 900, fill: PC.ink, align: 'center' }),
    ]),
  ]),
  pg('聴き方', PC.bg, () => [
    ...pcBar(0),
    T('HOW TO LISTEN', 80, 150, 800, 28, { font: MONT, weight: 900, fill: PC.yel, spacing: 400 }),
    T('いつもの\nアプリで聴けます', 80, 200, 920, 80, { font: 'Dela Gothic One', weight: 400, fill: '#ffffff', lh: 1.3 }),
    ...[['01', 'ポッドキャストアプリで', '「ほしぞら」で検索して、フォロー。'], ['02', 'ウェブサイトで', 'hoshizora.example.com でそのまま再生。'], ['03', '更新をお知らせ', 'SNS をフォローすると配信日に通知が届きます。']].flatMap(([n, t, b], i) => [
      R(80, 500 + i * 160, 920, 140, PC.bg2, 16),
      T(n, 110, 535 + i * 160, 110, 70, { font: BEBAS, weight: 400, fill: PC.yel }),
      T(t, 240, 525 + i * 160, 740, 34, { weight: 900, fill: '#ffffff' }),
      T(b, 240, 580 + i * 160, 740, 26, { weight: 500, fill: PC.mid }),
    ]),
  ]),
  pg('パーソナリティ', PC.cream, () => [
    ...pcBar(0, true),
    T('PERSONALITY', 80, 140, 800, 28, { font: MONT, weight: 900, fill: '#7a5a00', spacing: 400 }),
    ...[['ミナト', '深夜ラジオが大好きな会社員。声がやさしい担当。', PC.yel], ['ソラ', '雑談のスイッチ役。話がよく脱線します。', PC.bg]].flatMap(([n, b, c], i) => [
      ...PH(80 + i * 470, 220, 450, 450, 225, '#ddd3ee'),
      R(80 + i * 470, 700, 450, 8, c as string),
      T(n, 80 + i * 470, 735, 450, 52, { font: 'Dela Gothic One', weight: 400, fill: PC.ink }),
      T(b, 80 + i * 470, 810, 450, 26, { weight: 500, fill: PC.ink, lh: 1.7 }),
    ]),
  ]),
  pg('お便り募集', PC.yel, () => [
    ...pcBar(0, true),
    S('bubbleRound', 100, 160, 420, PC.ink),
    T('おたより\n募集中!', 100, 270, 420, 70, { font: 'Dela Gothic One', weight: 400, fill: PC.yel, align: 'center', lh: 1.2 }),
    T('番組で読んでほしい\n悩み・ひとこと・\n今週の小さな幸せを\n送ってください。', 580, 230, 420, 34, { weight: 900, fill: PC.ink, lh: 1.7 }),
    R(80, 700, 920, 240, PC.ink, 24),
    T('送り先', 120, 730, 300, 26, { weight: 700, fill: PC.yel }),
    T('mail@example.com', 120, 780, 840, 50, { font: MONT, weight: 900, fill: '#ffffff' }),
    T('ハッシュタグ  #ほしぞらラジオ', 120, 860, 840, 30, { weight: 700, fill: PC.mid }),
  ]),
  pg('目次', PC.bg, () => [
    ...pcBar(24),
    T('TIME CODE', 80, 150, 700, 28, { font: MONT, weight: 900, fill: PC.yel, spacing: 400 }),
    T('#24 の目次', 80, 200, 920, 64, { font: 'Dela Gothic One', weight: 400, fill: '#ffffff' }),
    ...[['00:00', 'オープニング・近況'], ['04:30', '今月読んだ3冊'], ['14:10', '本を読む場所の話'], ['23:20', 'おたより紹介'], ['30:00', 'エンディング']].flatMap(([t, h], i) => [
      R(80, 340 + i * 120, 920, 1, '#5a4390'),
      T(t, 80, 375 + i * 120, 200, 40, { font: MONT, weight: 900, fill: PC.yel }),
      T(h, 300, 375 + i * 120, 700, 40, { weight: 700, fill: '#ffffff' }),
    ]),
  ]),
  pg('フォロー', PC.cream, () => [
    ...pcBar(0, true),
    Ci(540, 400, 220, PC.ink),
    T('毎週水曜\n24:00', 320, 330, 440, 70, { font: 'Dela Gothic One', weight: 400, fill: PC.yel, align: 'center', lh: 1.2 }),
    T('フォロー・評価・おたより\nお待ちしています', 80, 700, 920, 44, { weight: 900, fill: PC.ink, align: 'center', lh: 1.6 }),
    T('@hoshizora_radio', 80, 880, 920, 36, { font: MONT, weight: 700, fill: '#5a4a80', align: 'center' }),
  ]),
])

// =====================================================================
// 12. 自治体・町内会のお知らせ(A4 縦 / グリーン + オレンジ)
// =====================================================================
const TC: Pal = { main: '#2c6b43', acc: '#c9741a', pale: '#f6f1e3', ink: '#243126', mid: '#566656', line: '#d9d3bd' }
const ZM = 'Zen Maru Gothic'
const tcHF = (n: number, sec: string) => hf(TC, 1240, 1754, 'SAKURA-CHO KAIKAN NEWS', n, sec)
const tcTitle = (en: string, ja: string, y = 150) => [
  T(en, 100, y, 900, 24, { font: MONT, weight: 700, fill: TC.acc, spacing: 300 }),
  T(ja, 100, y + 42, 1040, 70, { font: ZM, weight: 900, fill: TC.main }),
]
const TOWN = mkSet('mx-town', '自治体・町内会のお知らせセット', '自治会・お知らせ', 1240, 1754,
  ['町内会', '自治体', 'お知らせ', '回覧', '防災', '広報'], [
  pg('広報 表紙', TC.pale, () => [
    R(0, 0, 1240, 120, TC.main),
    T('さくら町内会 会報', 100, 38, 700, 36, { font: ZM, weight: 900, fill: '#ffffff' }),
    T('2027年 10月号  No.58', 640, 42, 500, 28, { font: MONT, weight: 700, fill: '#d8e6d4', align: 'right' }),
    T('まちの\nおたより', 100, 220, 1040, 190, { font: ZM, weight: 900, fill: TC.main, lh: 1.15 }),
    R(100, 640, 140, 10, TC.acc),
    ...PH(100, 720, 1040, 560, 24, '#d9d6c3'),
    T('今月の特集', 100, 1340, 400, 26, { weight: 700, fill: TC.acc }),
    T('秋の防災訓練と、町内あき祭りのご案内', 100, 1390, 1040, 46, { font: ZM, weight: 900, fill: TC.ink }),
    T('発行:さくら町内会  / サンプル県サンプル市さくら町', 100, 1600, 1040, 24, { weight: 500, fill: TC.mid }),
  ]),
  pg('今月のお知らせ', '#ffffff', () => [
    ...tcHF(2, 'お知らせ'),
    ...tcTitle('NOTICE', '今月のお知らせ'),
    ...[['10/16', '土', '防災訓練', '9:00〜 さくら公園'], ['10/23', '土', '資源回収', '8:00〜 集会所前'], ['10/30', '土', 'あき祭り', '14:00〜 さくら公園'], ['11/6', '土', '防犯パトロール', '19:00〜 集会所集合']].flatMap(([d, w, t, b], i) => [
      R(100, 330 + i * 280, 1040, 250, i % 2 ? '#ffffff' : TC.pale, 20, { stroke: TC.line, strokeWidth: 2 }),
      R(100, 330 + i * 280, 230, 250, TC.main, 20),
      T(d, 100, 380 + i * 280, 230, 70, { font: MONT, weight: 900, fill: '#ffffff', align: 'center' }),
      T(w + '曜日', 100, 480 + i * 280, 230, 30, { weight: 700, fill: '#d8e6d4', align: 'center' }),
      T(t, 380, 380 + i * 280, 700, 56, { font: ZM, weight: 900, fill: TC.main }),
      T(b, 380, 470 + i * 280, 700, 30, { weight: 500, fill: TC.ink }),
    ]),
  ]),
  pg('防災訓練', TC.pale, () => [
    ...tcHF(3, '防災'),
    ...tcTitle('DISASTER DRILL', '秋の防災訓練'),
    R(100, 330, 1040, 340, TC.main, 20),
    T('10月16日(土)  9:00 – 11:30', 150, 380, 940, 56, { font: ZM, weight: 900, fill: '#ffffff' }),
    T('さくら公園(雨天時:集会所)\n服装は動きやすいもの / 持ち物は飲み物・タオル', 150, 480, 940, 30, { weight: 500, fill: '#d8e6d4', lh: 1.8 }),
    ...[['消火器の使い方', '実際に消火器を使って、水で練習します。'], ['AED・応急手当', '救急隊員から使い方を教わります。'], ['炊き出し体験', '非常食のアルファ米を食べてみましょう。']].flatMap(([t, b], i) => [
      R(100, 720 + i * 220, 1040, 190, '#ffffff', 16),
      S('check', 135, 770 + i * 220, 70, TC.acc),
      T(t, 240, 745 + i * 220, 880, 40, { font: ZM, weight: 900, fill: TC.main }),
      T(b, 240, 805 + i * 220, 880, 26, { weight: 500, fill: TC.ink }),
    ]),
    T('参加の申し込みは不要です。どなたでも参加できます。', 100, 1420, 1040, 28, { weight: 700, fill: TC.acc }),
  ]),
  pg('ごみ収集', '#ffffff', () => [
    ...tcHF(4, 'ごみ'),
    ...tcTitle('GARBAGE', 'ごみ収集日のご案内'),
    makeTable({ rows: 6, cols: 3, header: TC.main, border: TC.line, cellW: 346, cellH: 120, fontSize: 28, cells: [['種類', '収集日', '出し方'], ['燃やすごみ', '月・木', '朝8時までに'], ['燃やさないごみ', '第2・4水', '透明な袋で'], ['ビン・缶', '毎週 火', '中を軽くすすぐ'], ['ペットボトル', '毎週 金', 'ラベルをはがす'], ['古紙・段ボール', '第1・3土', 'ひもで十字に']] }).set({ left: 100, top: 340 }),
    R(100, 1130, 1040, 280, '#fdf0dc', 16),
    T('年末年始の収集', 140, 1170, 900, 32, { font: ZM, weight: 900, fill: TC.acc }),
    T('12月29日〜1月3日はお休みです。\n12月28日が年内の最終収集日です。', 140, 1235, 900, 28, { weight: 500, fill: TC.ink, lh: 1.8 }),
  ]),
  pg('総会のお知らせ', TC.pale, () => [
    ...tcHF(5, '総会'),
    ...tcTitle('GENERAL MEETING', '令和9年度 定期総会のお知らせ'),
    ...fieldRows(TC, 100, 340, 240, 800, 180, [['日時', '11月20日(土)  19:00 〜 20:30'], ['場所', 'さくら町 集会所(1階ホール)'], ['議題', '1. 今年度の活動報告\n2. 決算報告と来年度の予算\n3. 役員の改選'], ['出欠', '同封のはがきを11月10日までに\n班長へお渡しください。']], 28),
    R(100, 1100, 1040, 300, TC.main, 16),
    T('ご出席が難しい方へ', 140, 1140, 900, 32, { font: ZM, weight: 900, fill: '#f3d9a8' }),
    T('委任状の提出で議決に参加できます。\nはがきの裏面にご記入ください。', 140, 1200, 900, 30, { weight: 500, fill: '#ffffff', lh: 1.8 }),
  ]),
  pg('子育て・見守り', '#ffffff', () => [
    ...tcHF(6, '子育て'),
    ...tcTitle('KIDS & CARE', '子どもたちを見守る活動'),
    ...PH(100, 330, 1040, 420, 20, '#e2ddc9'),
    ...[['登下校の見守り', '毎朝7:30〜8:15 通学路に立ちます。'], ['子ども食堂', '毎月第3土曜 11:30〜 集会所'], ['お便りポスト', '集会所の入口にあります。']].flatMap(([t, b], i) => [
      R(100 + i * 354, 800, 332, 400, TC.pale, 16),
      R(100 + i * 354, 800, 332, 10, i === 1 ? TC.acc : TC.main),
      T(t, 125 + i * 354, 850, 282, 36, { font: ZM, weight: 900, fill: TC.main, lh: 1.3 }),
      T(b, 125 + i * 354, 980, 282, 26, { weight: 500, fill: TC.ink, lh: 1.7 }),
    ]),
    T('お手伝いできる方は、いつでもご連絡ください。', 100, 1290, 1040, 28, { weight: 700, fill: TC.acc }),
  ]),
  pg('あき祭り', TC.main, () => [
    ...hf({ ...TC, main: '#ffffff', mid: '#d8e6d4', line: '#4d8662' }, 1240, 1754, 'SAKURA-CHO KAIKAN NEWS', 7, 'あき祭り'),
    T('AUTUMN FESTIVAL', 100, 150, 900, 24, { font: MONT, weight: 700, fill: '#f3d9a8', spacing: 300 }),
    T('町内あき祭り', 100, 194, 1040, 120, { font: ZM, weight: 900, fill: '#ffffff' }),
    T('10月30日(土) 14:00 – 18:00 / さくら公園', 100, 340, 1040, 36, { weight: 700, fill: '#f3d9a8' }),
    ...[['やきそば・豚汁', '100円〜'], ['金魚すくい', '1回 100円'], ['ステージ', '太鼓・ダンス'], ['フリーマーケット', '出店募集中']].flatMap(([t, b], i) => [
      R(100 + (i % 2) * 540, 480 + Math.floor(i / 2) * 400, 500, 360, '#ffffff', 20),
      T(t, 100 + (i % 2) * 540, 590 + Math.floor(i / 2) * 400, 500, 44, { font: ZM, weight: 900, fill: TC.main, align: 'center' }),
      T(b, 100 + (i % 2) * 540, 680 + Math.floor(i / 2) * 400, 500, 34, { weight: 700, fill: TC.acc, align: 'center' }),
    ]),
    T('雨天の場合は集会所で規模を縮小して行います。', 100, 1330, 1040, 26, { weight: 500, fill: '#d8e6d4' }),
  ]),
  pg('ボランティア募集', TC.pale, () => [
    ...tcHF(8, '募集'),
    ...tcTitle('VOLUNTEER', 'ボランティア募集'),
    ...[['清掃', '毎月第1日曜 8:00〜 / 公園・通学路の清掃', '30分だけでもOK'], ['防犯パトロール', '毎月第1土曜 19:00〜 / 1時間', '二人一組で歩きます'], ['会報づくり', '年4回 / 取材・写真・レイアウト', 'パソコンが得意な方歓迎']].flatMap(([t, d, n], i) => [
      R(100, 330 + i * 330, 1040, 290, '#ffffff', 20),
      T(t, 140, 370 + i * 330, 600, 52, { font: ZM, weight: 900, fill: TC.main }),
      T(d, 140, 450 + i * 330, 960, 28, { weight: 500, fill: TC.ink }),
      R(140, 520 + i * 330, 300, 54, '#fdf0dc', 27),
      T(n, 140, 534 + i * 330, 300, 26, { weight: 700, fill: '#8a4f0c', align: 'center' }),
    ]),
  ]),
  pg('相談窓口', '#ffffff', () => [
    ...tcHF(9, '窓口'),
    ...tcTitle('CONSULTATION', '困ったときの相談窓口'),
    ...fieldRows(TC, 100, 340, 360, 680, 140, [['市役所 くらし相談', '000-0000-0000(平日 8:30〜17:15)'], ['地域包括支援センター', '000-0000-0000(高齢者の相談)'], ['子育て支援センター', '000-0000-0000(平日 9:00〜17:00)'], ['消費生活センター', '000-0000-0000(契約トラブル)'], ['町内会事務所', '000-0000-0000(火・金 10:00〜)']], 26),
    T('緊急のときは 110 番・119 番へ', 100, 1160, 1040, 36, { font: ZM, weight: 900, fill: TC.acc }),
  ]),
  pg('連絡先', TC.main, () => [
    T('CONTACT', 100, 150, 900, 26, { font: MONT, weight: 700, fill: '#f3d9a8', spacing: 300 }),
    T('さくら町内会', 100, 210, 1040, 110, { font: ZM, weight: 900, fill: '#ffffff' }),
    R(100, 380, 1040, 2, '#4d8662'),
    T('〒000-0000\nサンプル県サンプル市さくら町 1-2-3\nさくら町 集会所内', 100, 440, 1040, 34, { weight: 500, fill: '#ffffff', lh: 1.9 }),
    T('TEL', 100, 760, 200, 26, { font: MONT, weight: 700, fill: '#f3d9a8', spacing: 300 }),
    T('000-0000-0000', 100, 810, 1040, 90, { font: MONT, weight: 900, fill: '#ffffff' }),
    T('開所日:火曜・金曜 10:00〜15:00', 100, 930, 1040, 30, { weight: 500, fill: '#d8e6d4' }),
    R(100, 1080, 1040, 300, '#ffffff', 16),
    T('会報への投稿・ご意見を\nお待ちしています', 150, 1130, 940, 44, { font: ZM, weight: 900, fill: TC.main, lh: 1.5 }),
    T('sakura-town@example.com', 150, 1280, 940, 34, { font: MONT, weight: 700, fill: TC.acc }),
  ]),
])

// =====================================================================
// 13. 子ども向け(誕生会・保育園のおたより / A4 縦 / スカイ + ピンク + イエロー)
// =====================================================================
const KD: Pal = { main: '#1681aa', acc: '#d63f6d', pale: '#fff7d6', ink: '#3a3550', mid: '#6a6580', line: '#cfe9f3' }
const MOCHI = 'Mochiy Pop One'
const kdHF = (n: number, sec: string) => [
  T('ひまわり保育園  おたより', 100, 60, 700, 26, { font: ZM, weight: 900, fill: KD.main }),
  T(sec, 740, 60, 400, 26, { font: ZM, weight: 700, fill: KD.mid, align: 'right' }),
  R(100, 108, 1040, 6, '#ffd23f', 3),
  T(String(n), 100, 1640, 100, 30, { font: MONT, weight: 900, fill: KD.acc }),
]
const kdTitle = (ja: string, y = 150) => [R(100, y + 14, 16, 70, KD.acc, 8), T(ja, 140, y, 1000, 80, { font: MOCHI, weight: 400, fill: KD.ink })]
const KIDS = mkSet('mx-kids', '子ども向け 誕生会・おたより', '子ども・保育園', 1240, 1754,
  ['子ども', '保育園', '誕生会', 'おたより', '幼稚園', 'キッズ'], [
  pg('誕生会 招待状', '#fff7d6', () => [
    S('cloud', 60, 90, 360, '#d6f0fa'), S('cloud', 820, 160, 300, '#d6f0fa'),
    T('HAPPY BIRTHDAY', 100, 330, 1040, 40, { font: MONT, weight: 900, fill: KD.acc, align: 'center', spacing: 300 }),
    T('おたんじょうびかい', 100, 420, 1040, 104, { font: MOCHI, weight: 400, fill: KD.ink, align: 'center', lh: 1.25 }),
    ...[KD.acc, KD.main, '#ffd23f', '#6cc9a0', KD.acc, KD.main].map((c, i) => Ci(180 + i * 176, 770, 46, c)),
    T('ゆうたくんの', 100, 880, 1040, 56, { font: ZM, weight: 900, fill: KD.main, align: 'center' }),
    T('5さい', 100, 960, 1040, 150, { font: MOCHI, weight: 400, fill: KD.acc, align: 'center' }),
    R(170, 1250, 900, 360, '#ffffff', 36, { stroke: KD.main, strokeWidth: 6 }),
    T('11月6日(土)  14:00〜16:00\nさくら町 ひまわり保育園 ホール', 170, 1300, 900, 40, { font: ZM, weight: 900, fill: KD.ink, align: 'center', lh: 1.7 }),
    T('おへんじは 10月30日までに先生へ', 170, 1500, 900, 28, { weight: 700, fill: KD.mid, align: 'center' }),
  ]),
  pg('おたより 表紙', KD.main, () => [
    S('cloud', 800, 120, 340, '#ffffff'),
    T('ひまわり保育園', 100, 140, 700, 36, { font: ZM, weight: 900, fill: '#ffffff' }),
    T('10月の\nおたより', 100, 240, 1040, 150, { font: MOCHI, weight: 400, fill: '#ffffff', lh: 1.2 }),
    T('うめぐみ  2027年', 100, 680, 1040, 34, { font: ZM, weight: 700, fill: '#ffffff' }),
    ...PH(100, 790, 1040, 640, 36, '#a8dcef'),
    T('どんぐりを ひろったよ!', 100, 1480, 1040, 56, { font: MOCHI, weight: 400, fill: '#ffffff' }),
  ]),
  pg('今月の行事', '#ffffff', () => [
    ...kdHF(3, '行事'),
    ...kdTitle('10月の ぎょうじ'),
    ...[['4', '月', 'あたらしい もくひょうを きめよう'], ['10', '日', 'うんどうかい(予行)'], ['16', '土', 'うんどうかい'], ['22', '金', 'おいもほり えんそく'], ['28', '木', 'たんじょうかい'], ['31', '日', 'ハロウィン パーティー']].flatMap(([d, w, t], i) => [
      R(100, 310 + i * 200, 1040, 170, i % 2 ? '#e8f6fb' : KD.pale, 28),
      Ci(210, 395 + i * 200, 66, i % 2 ? KD.main : KD.acc),
      T(d, 144, 360 + i * 200, 132, 66, { font: MONT, weight: 900, fill: '#ffffff', align: 'center' }),
      T(w + 'よう', 330, 340 + i * 200, 200, 26, { font: ZM, weight: 700, fill: KD.mid }),
      T(t, 330, 385 + i * 200, 780, 40, { font: ZM, weight: 900, fill: KD.ink }),
    ]),
  ]),
  pg('給食メニュー', KD.pale, () => [
    ...kdHF(4, '給食'),
    ...kdTitle('こんげつの きゅうしょく'),
    ...[['10/ 5', 'ごはん・さけの塩焼き・みそしる'], ['10/ 6', 'カレーライス・コーンサラダ'], ['10/ 7', 'ミートソースパスタ・スープ'], ['10/ 8', 'ちらし寿司・すまし汁・くだもの'], ['10/12', 'ハンバーグ・ポテト・野菜スープ'], ['10/13', 'うどん・かぼちゃの天ぷら']].flatMap(([d, m], i) => [
      R(100, 310 + i * 190, 1040, 160, '#ffffff', 24),
      T(d, 130, 365 + i * 190, 200, 44, { font: MONT, weight: 900, fill: KD.acc }),
      T(m, 360, 360 + i * 190, 740, 34, { font: ZM, weight: 700, fill: KD.ink, lh: 1.4 }),
    ]),
    T('※ アレルギーのあるお子さんは別メニューです。', 100, 1480, 1040, 24, { weight: 500, fill: KD.mid }),
  ]),
  pg('クラスだより', '#ffffff', () => [
    ...kdHF(5, 'うめぐみ'),
    ...kdTitle('うめぐみの まいにち'),
    ...PH(100, 310, 500, 400, 28, '#e8f6fb'), ...PH(640, 310, 500, 400, 28, KD.pale),
    T('お散歩で 大きな どんぐりを 見つけました。「見て見て!」と 先生に 教えてくれる 笑顔が とても すてきでした。', 100, 760, 1040, 30, { weight: 500, fill: KD.ink, lh: 1.9 }),
    R(100, 1000, 1040, 460, KD.pale, 28),
    T('せんせいから', 150, 1040, 600, 34, { font: ZM, weight: 900, fill: KD.acc }),
    T('朝晩が冷えてきました。登園のときは、羽織れる上着を一枚、カバンに入れておいてください。', 150, 1100, 940, 30, { weight: 500, fill: KD.ink, lh: 1.9 }),
  ]),
  pg('お願い・持ち物', KD.main, () => [
    T('ひまわり保育園  おたより', 100, 60, 700, 26, { font: ZM, weight: 900, fill: '#ffffff' }),
    T('お願い', 740, 60, 400, 26, { font: ZM, weight: 700, fill: '#ffffff', align: 'right' }),
    R(100, 108, 1040, 6, '#ffd23f', 3),
    T('おねがい・もちもの', 100, 150, 1040, 80, { font: MOCHI, weight: 400, fill: '#ffffff' }),
    ...[['うんどうかいの日', 'お弁当・水筒・レジャーシート・帽子'], ['おいもほり', '汚れてもよい服・着替え・軍手・ビニール袋'], ['毎日のもちもの', '連絡帳・タオル・コップ・着替え一式']].flatMap(([t, b], i) => [
      R(100, 320 + i * 360, 1040, 320, '#ffffff', 32),
      T(t, 150, 370 + i * 360, 940, 48, { font: ZM, weight: 900, fill: KD.main }),
      T(b, 150, 460 + i * 360, 940, 34, { weight: 700, fill: KD.ink, lh: 1.7 }),
      T('お名前を すべてに ご記入ください。', 150, 570 + i * 360, 940, 26, { weight: 500, fill: KD.mid }),
    ]),
  ]),
  pg('10月うまれ', '#ffffff', () => [
    ...kdHF(7, 'たんじょうび'),
    ...kdTitle('10がつうまれ'),
    ...[['ゆうた くん', '10/3', 5], ['みお ちゃん', '10/11', 4], ['そうま くん', '10/19', 3], ['はなの ちゃん', '10/27', 5]].flatMap(([n, d, a], i) => {
      const x = 100 + (i % 2) * 540, y = 330 + Math.floor(i / 2) * 560, c = [KD.acc, KD.main, '#a86e00', '#2a8a62'][i]
      return [
        R(x, y, 500, 510, KD.pale, 36),
        ...PH(x + 130, y + 40, 240, 240, 120, '#ffffff'),
        T(n as string, x, y + 310, 500, 44, { font: ZM, weight: 900, fill: KD.ink, align: 'center' }),
        T(`${d}  ${a}さい`, x, y + 380, 500, 40, { font: MOCHI, weight: 400, fill: c, align: 'center' }),
      ]
    }),
  ]),
  pg('あそびのレシピ', KD.pale, () => [
    ...kdHF(8, 'あそび'),
    ...kdTitle('どんぐりこまを つくろう'),
    ...[['1', 'どんぐりに つまようじを さす', '大人が きりで 穴を あけると ラクです。'], ['2', 'ペンで もようを かく', '水性ペンで すきな いろを ぬります。'], ['3', 'まわして あそぼう', 'つくえの 上で くるくる まわします。']].flatMap(([n, t, b], i) => [
      Ci(190, 440 + i * 280, 66, [KD.acc, KD.main, KD.ink][i]),
      T(n, 130, 395 + i * 280, 120, 90, { font: MOCHI, weight: 400, fill: '#ffffff', align: 'center' }),
      T(t, 300, 390 + i * 280, 800, 44, { font: ZM, weight: 900, fill: KD.ink }),
      T(b, 300, 460 + i * 280, 800, 28, { weight: 500, fill: KD.mid, lh: 1.6 }),
    ]),
    ...PH(100, 1250, 1040, 330, 28, '#ffffff'),
  ]),
  pg('ほけんだより', '#ffffff', () => [
    ...kdHF(9, 'ほけん'),
    ...kdTitle('ほけんだより'),
    T('かぜを ひかないための 3つの やくそく', 100, 290, 1040, 36, { font: ZM, weight: 900, fill: KD.acc }),
    ...[['て あらい', 'そとから かえったら、せっけんで 30びょう。'], ['うがい', 'みずで ガラガラ。のどを まもろう。'], ['はやね', '9じには ねむろう。ぐっすり あさまで。']].flatMap(([t, b], i) => [
      R(100 + i * 354, 400, 332, 560, [KD.pale, '#e8f6fb', '#ffe8ef'][i], 36),
      T(String(i + 1), 100 + i * 354, 440, 332, 110, { font: MOCHI, weight: 400, fill: [KD.acc, KD.main, KD.acc][i], align: 'center' }),
      T(t, 100 + i * 354, 620, 332, 48, { font: ZM, weight: 900, fill: KD.ink, align: 'center' }),
      T(b, 130 + i * 354, 720, 272, 28, { weight: 500, fill: KD.ink, align: 'center', lh: 1.7 }),
    ]),
    R(100, 1040, 1040, 380, '#fff7d6', 32),
    T('おうちの かたへ', 150, 1080, 940, 34, { font: ZM, weight: 900, fill: KD.acc }),
    T('熱が37.5度以上ある、または元気がないときは、無理せずお休みください。登園前の検温をお願いします。', 150, 1145, 940, 28, { weight: 500, fill: KD.ink, lh: 1.9 }),
  ]),
  pg('ありがとう', KD.acc, () => [
    S('cloud', 60, 140, 380, '#ffffff'), S('cloud', 800, 1160, 340, '#ffffff'),
    T('いつも\nありがとう', 100, 380, 1040, 190, { font: MOCHI, weight: 400, fill: '#ffffff', align: 'center', lh: 1.3 }),
    T('おたよりへの ごいけんは\nいつでも おまちしています。', 100, 790, 1040, 40, { font: ZM, weight: 900, fill: '#ffffff', align: 'center', lh: 1.7 }),
    R(240, 1000, 760, 300, '#ffffff', 36),
    T('ひまわり保育園', 240, 1040, 760, 46, { font: ZM, weight: 900, fill: KD.acc, align: 'center' }),
    T('TEL 000-0000-0000\n受付 7:00〜19:00(日・祝を除く)', 240, 1120, 760, 30, { weight: 700, fill: KD.ink, align: 'center', lh: 1.8 }),
  ]),
])

// =====================================================================
// 14. フィットネスジム 料金・トレーナー紹介(Instagram 縦 1080×1350 / ブラック + オレンジレッド)
// =====================================================================
const GY = { bg: '#0d0d0d', card: '#1c1c1c', red: '#ff4b1f', gray: '#9a9a9a', line: '#333333', white: '#ffffff' }
const gyBar = (n: number): FabricObject[] => [
  T('IRON FIELD GYM', 80, 60, 500, 24, { font: MONT, weight: 900, fill: GY.red, spacing: 300 }),
  T(String(n).padStart(2, '0') + ' / 10', 700, 60, 300, 24, { font: MONT, weight: 700, fill: GY.gray, align: 'right' }),
]
const GYM = mkSet('mx-gym', 'フィットネスジム 料金・トレーナー紹介', 'フィットネス', 1080, 1350,
  ['ジム', 'フィットネス', '料金', 'トレーナー', 'Instagram', '筋トレ'], [
  pg('表紙', GY.bg, () => [
    ...PH(0, 0, 1080, 1350, 0, '#262626'),
    R(0, 700, 1080, 650, GY.bg),
    T('IRON FIELD GYM', 80, 740, 900, 30, { font: MONT, weight: 900, fill: GY.red, spacing: 400 }),
    T('STRONGER\nEVERY DAY.', 80, 790, 920, 140, { font: BEBAS, weight: 400, fill: GY.white, lh: 0.95 }),
    T('昨日の自分より、一つ強く。', 80, 1110, 920, 40, { weight: 900, fill: GY.white }),
    R(80, 1190, 280, 70, GY.red),
    T('入会金 0円', 80, 1206, 280, 36, { weight: 900, fill: GY.white, align: 'center' }),
    T('24時間営業 / シャワー完備', 400, 1208, 600, 28, { weight: 500, fill: GY.gray }),
  ]),
  pg('ジム紹介', GY.bg, () => [
    ...gyBar(2),
    T('ABOUT', 80, 140, 700, 28, { font: MONT, weight: 900, fill: GY.red, spacing: 400 }),
    T('初めてでも、\n通い続けられるジム。', 80, 190, 920, 76, { weight: 900, fill: GY.white, lh: 1.3 }),
    ...[['24H', '24時間営業', '仕事帰りも早朝も、好きな時間に。'], ['120', 'マシン台数', '待たずに使える、広いフロア。'], ['0', '勧誘ゼロ', '無理な営業は一切ありません。']].flatMap(([n, t, b], i) => [
      R(80, 440 + i * 270, 920, 240, GY.card),
      R(80, 440 + i * 270, 10, 240, GY.red),
      T(n, 120, 480 + i * 270, 340, 130, { font: BEBAS, weight: 400, fill: GY.red }),
      T(t, 440, 495 + i * 270, 540, 44, { weight: 900, fill: GY.white }),
      T(b, 440, 565 + i * 270, 540, 26, { weight: 500, fill: GY.gray, lh: 1.6 }),
    ]),
  ]),
  pg('料金プラン', GY.bg, () => [
    ...gyBar(3),
    T('PRICE', 80, 140, 700, 28, { font: MONT, weight: 900, fill: GY.red, spacing: 400 }),
    T('料金プラン', 80, 190, 920, 80, { weight: 900, fill: GY.white }),
    ...[['LIGHT', '月 4回', '3,980', false], ['STANDARD', '通い放題', '7,480', true], ['PREMIUM', '通い放題 + 個別指導', '14,800', false]].flatMap(([n, d, p, hot], i) => [
      R(80, 340 + i * 300, 920, 270, hot ? GY.red : GY.card),
      T(n as string, 120, 375 + i * 300, 400, 34, { font: BEBAS, weight: 400, fill: hot ? GY.white : GY.red, spacing: 200 }),
      T(d as string, 120, 440 + i * 300, 480, 30, { weight: 700, fill: hot ? GY.white : GY.gray }),
      T('¥' + p, 440, 410 + i * 300, 520, 110, { font: BEBAS, weight: 400, fill: GY.white, align: 'right' }),
      T('/ 月(税込)', 700, 530 + i * 300, 260, 26, { weight: 500, fill: hot ? GY.white : GY.gray, align: 'right' }),
    ]),
  ]),
  pg('プラン比較', GY.bg, () => [
    ...gyBar(4),
    T('COMPARE', 80, 140, 700, 28, { font: MONT, weight: 900, fill: GY.red, spacing: 400 }),
    T('プランの違い', 80, 190, 920, 80, { weight: 900, fill: GY.white }),
    makeTable({ rows: 6, cols: 4, header: GY.red, border: GY.line, cellW: 230, cellH: 120, fontSize: 24, cells: [['', 'LIGHT', 'STANDARD', 'PREMIUM'], ['月の回数', '4回', '無制限', '無制限'], ['24時間利用', '×', '○', '○'], ['シャワー', '○', '○', '○'], ['個別指導', '×', '×', '月2回'], ['月額', '3,980円', '7,480円', '14,800円']] }).set({ left: 80, top: 330 }),
    T('すべてのプランで、ウェアとタオルの貸出は無料です。', 80, 1100, 920, 26, { weight: 500, fill: GY.gray }),
  ]),
  pg('トレーナー 1', GY.bg, () => [
    ...gyBar(5),
    ...PH(0, 120, 1080, 640, 0, '#262626'),
    T('TRAINER', 80, 800, 500, 26, { font: MONT, weight: 900, fill: GY.red, spacing: 400 }),
    T('黒木 剛', 80, 845, 600, 76, { weight: 900, fill: GY.white }),
    T('ボディメイク / 元ラグビー選手', 80, 950, 920, 30, { weight: 700, fill: GY.gray }),
    T('「まず10分の運動から。続けられる形を一緒に探します。」', 80, 1030, 920, 30, { weight: 500, fill: GY.white, lh: 1.7 }),
    T('指導歴 12 年  /  担当 1,000 名以上', 80, 1200, 920, 26, { weight: 700, fill: GY.red }),
  ]),
  pg('トレーナー 2', GY.bg, () => [
    ...gyBar(6),
    ...PH(0, 120, 1080, 640, 0, '#262626'),
    T('TRAINER', 80, 800, 500, 26, { font: MONT, weight: 900, fill: GY.red, spacing: 400 }),
    T('白石 凛', 80, 845, 600, 76, { weight: 900, fill: GY.white }),
    T('ダイエット / 姿勢改善', 80, 950, 920, 30, { weight: 700, fill: GY.gray }),
    T('「体の変化を数字と写真で見える化して、やる気につなげます。」', 80, 1030, 920, 30, { weight: 500, fill: GY.white, lh: 1.7 }),
    T('指導歴 7 年  /  管理栄養士の資格あり', 80, 1200, 920, 26, { weight: 700, fill: GY.red }),
  ]),
  pg('スケジュール', GY.bg, () => [
    ...gyBar(7),
    T('LESSON', 80, 140, 700, 28, { font: MONT, weight: 900, fill: GY.red, spacing: 400 }),
    T('レッスンスケジュール', 80, 190, 920, 70, { weight: 900, fill: GY.white }),
    ...[['月', '19:30', 'ヨガ', '60分'], ['火', '20:00', 'ボクササイズ', '45分'], ['水', '12:15', 'ランチタイムHIIT', '30分'], ['木', '19:30', 'ピラティス', '60分'], ['金', '20:00', 'フルボディ筋トレ', '45分'], ['土', '10:00', 'ストレッチ', '45分']].flatMap(([d, t, n, m], i) => [
      R(80, 320 + i * 150, 920, 130, i % 2 ? GY.bg : GY.card),
      T(d, 110, 345 + i * 150, 80, 76, { weight: 900, fill: GY.red, align: 'center' }),
      T(t, 220, 350 + i * 150, 220, 40, { font: BEBAS, weight: 400, fill: GY.white }),
      T(n, 440, 355 + i * 150, 420, 34, { weight: 900, fill: GY.white }),
      T(m, 860, 360 + i * 150, 110, 26, { weight: 500, fill: GY.gray, align: 'right' }),
    ]),
  ]),
  pg('キャンペーン', GY.red, () => [
    T('IRON FIELD GYM', 80, 60, 500, 24, { font: MONT, weight: 900, fill: GY.bg, spacing: 300 }),
    T('08 / 10', 700, 60, 300, 24, { font: MONT, weight: 700, fill: GY.bg, align: 'right' }),
    T('CAMPAIGN', 80, 200, 920, 36, { font: MONT, weight: 900, fill: GY.bg, spacing: 500 }),
    T('入会金\n0円', 80, 260, 920, 190, { font: 'Dela Gothic One', weight: 400, fill: GY.white, lh: 1.0 }),
    T('+ 初月会費 半額', 80, 800, 920, 70, { weight: 900, fill: GY.bg }),
    R(80, 930, 920, 4, GY.bg),
    T('お申し込み期間\n10月31日(日)まで', 80, 980, 920, 42, { weight: 900, fill: GY.white, lh: 1.6 }),
    T('無料体験(60分)もご予約いただけます。', 80, 1180, 920, 30, { weight: 700, fill: GY.bg }),
  ]),
  pg('会員の声', GY.bg, () => [
    ...gyBar(9),
    T('VOICE', 80, 140, 700, 28, { font: MONT, weight: 900, fill: GY.red, spacing: 400 }),
    T('3か月で、\nこんなに変わった。', 80, 190, 920, 76, { weight: 900, fill: GY.white, lh: 1.3 }),
    ...PH(80, 440, 440, 460, 0, '#262626'), ...PH(560, 440, 440, 460, 0, '#262626'),
    T('BEFORE', 80, 915, 440, 28, { font: MONT, weight: 900, fill: GY.gray, spacing: 300 }),
    T('AFTER', 560, 915, 440, 28, { font: MONT, weight: 900, fill: GY.red, spacing: 300 }),
    T('-6.2kg', 80, 990, 440, 100, { font: BEBAS, weight: 400, fill: GY.white }),
    T('「仕事の合間に通えて、体が軽くなりました」 30代 男性', 560, 1000, 440, 28, { weight: 500, fill: GY.white, lh: 1.7 }),
  ]),
  pg('アクセス', GY.bg, () => [
    ...gyBar(10),
    T('ACCESS', 80, 140, 700, 28, { font: MONT, weight: 900, fill: GY.red, spacing: 400 }),
    T('まずは見学へ。', 80, 190, 920, 80, { weight: 900, fill: GY.white }),
    R(80, 330, 920, 400, GY.card),
    R(80, 500, 920, 50, '#2a2a2a'), R(480, 330, 50, 400, '#2a2a2a'),
    ...pin(560, 400, 90, GY.red),
    ...[['住所', 'サンプル県サンプル市鉄町 5-6-7 B1F'], ['営業時間', '24時間(スタッフ常駐 10:00〜22:00)'], ['TEL', '000-0000-0000']].flatMap(([l, v], i) => [
      T(l, 80, 800 + i * 120, 220, 26, { weight: 700, fill: GY.red }),
      T(v, 300, 796 + i * 120, 700, 30, { weight: 700, fill: GY.white, lh: 1.4 }),
    ]),
    R(80, 1190, 920, 80, GY.red),
    T('無料体験を予約する', 80, 1210, 920, 36, { weight: 900, fill: GY.white, align: 'center' }),
  ]),
])

// =====================================================================
// 15. 投資家向け IR 資料(16:9 / インディゴ + グリーン + ライトグレー)
// =====================================================================
const IR = { navy: '#161c4f', green: '#17936c', bg: '#f4f5fa', ink: '#1d2140', mid: '#5b6182', line: '#d5d8e8', white: '#ffffff' }
const irFrame = (n: number, sec: string, dark = false): FabricObject[] => [
  T('ALPHALINK CORPORATION  決算説明資料', 100, 50, 900, 24, { weight: 700, fill: dark ? '#b8bddf' : IR.mid }),
  T(sec, 1220, 50, 600, 24, { weight: 700, fill: dark ? '#b8bddf' : IR.mid, align: 'right' }),
  T(String(n), 100, 1000, 100, 28, { font: MONT, weight: 700, fill: dark ? '#b8bddf' : IR.mid }),
  T('2027年3月期 第2四半期', 1220, 1000, 600, 24, { weight: 500, fill: dark ? '#b8bddf' : IR.mid, align: 'right' }),
]
const irTitle = (en: string, ja: string): FabricObject[] => [
  T(en, 100, 110, 900, 24, { font: MONT, weight: 700, fill: IR.green, spacing: 300 }),
  T(ja, 100, 150, 1700, 64, { weight: 900, fill: IR.navy }),
]
const IRSET = mkSet('mx-ir', '投資家向け IR 資料セット', 'IR・決算資料', 1920, 1080,
  ['IR', '決算説明', '投資家', '財務', 'グラフ', '業績'], [
  pg('表紙', IR.navy, () => [
    R(100, 360, 100, 10, IR.green),
    T('FINANCIAL RESULTS', 100, 400, 1200, 32, { font: MONT, weight: 700, fill: '#b8bddf', spacing: 400 }),
    T('2027年3月期\n第2四半期 決算説明資料', 100, 470, 1500, 100, { weight: 900, fill: IR.white, lh: 1.3 }),
    T('アルファリンク株式会社  /  2026年11月12日', 100, 800, 1500, 34, { weight: 500, fill: '#b8bddf' }),
    T('ALPHALINK', 1220, 900, 600, 56, { font: MONT, weight: 900, fill: '#8d95d4', align: 'right', spacing: 200 }),
  ]),
  pg('ハイライト', IR.bg, () => [
    ...irFrame(2, 'HIGHLIGHTS'), ...irTitle('HIGHLIGHTS', '上期は増収増益、通期予想を上方修正'),
    ...[['412', '億円', '売上高', '+12.4%'], ['58.6', '億円', '営業利益', '+21.8%'], ['14.2', '%', '営業利益率', '+1.1pt'], ['38.1', '億円', '純利益', '+18.9%']].flatMap(([n, u, l, c], i) => [
      R(100 + i * 440, 320, 400, 560, IR.white, 12),
      R(100 + i * 440, 320, 400, 10, IR.green),
      T(l, 140 + i * 440, 370, 320, 34, { weight: 700, fill: IR.mid }),
      T(n, 140 + i * 440, 450, 320, 120, { font: MONT, weight: 900, fill: IR.navy }),
      T(u, 140 + i * 440, 600, 320, 40, { weight: 700, fill: IR.navy }),
      T('前年同期比 ' + c, 140 + i * 440, 740, 320, 30, { weight: 700, fill: IR.green }),
    ]),
  ]),
  pg('業績サマリー', IR.white, () => [
    ...irFrame(3, 'SUMMARY'), ...irTitle('SUMMARY', '連結業績サマリー(上期累計)'),
    makeTable({ rows: 6, cols: 5, header: IR.navy, border: IR.line, cellW: 340, cellH: 100, fontSize: 30, cells: [['(億円)', '前年同期', '当期', '増減額', '増減率'], ['売上高', '366.5', '412.0', '+45.5', '+12.4%'], ['営業利益', '48.1', '58.6', '+10.5', '+21.8%'], ['経常利益', '49.0', '59.2', '+10.2', '+20.8%'], ['親会社株主に帰属する純利益', '32.0', '38.1', '+6.1', '+18.9%'], ['1株当たり利益(円)', '63.9', '76.0', '+12.1', '+18.9%']] }).set({ left: 110, top: 290 }),
    T('※ 数値は架空のサンプルです。', 100, 920, 1000, 24, { weight: 400, fill: IR.mid }),
  ]),
  pg('売上推移', IR.bg, () => [
    ...irFrame(4, 'REVENUE'), ...irTitle('REVENUE', '売上高は5期連続で成長'),
    makeChart({ type: 'bar', labels: ['22/3', '23/3', '24/3', '25/3', '26/3', '27/3予'], values: [520, 580, 640, 710, 790, 880], colors: ['#9aa0c8', '#9aa0c8', '#9aa0c8', '#9aa0c8', '#9aa0c8', IR.green], w: 700, h: 400 }).set({ left: 100, top: 270, scaleX: 1.7, scaleY: 1.7 }),
    T('売上高の推移(億円)', 1360, 300, 460, 34, { weight: 900, fill: IR.navy }),
    T('サブスクリプション事業の拡大が成長をけん引。年平均成長率は 11.1% です。', 1360, 370, 460, 30, { weight: 500, fill: IR.ink, lh: 1.8 }),
  ]),
  pg('セグメント別', IR.white, () => [
    ...irFrame(5, 'SEGMENT'), ...irTitle('SEGMENT', 'セグメント別の売上構成'),
    makeChart({ type: 'donut', labels: ['クラウド', 'コンサル', '機器', 'その他'], values: [52, 28, 14, 6], colors: [IR.navy, IR.green, '#9aa0c8', '#d5d8e8'], w: 600, h: 400 }).set({ left: 100, top: 270, scaleX: 1.6, scaleY: 1.6 }),
    ...[['クラウド', '52%', '214億円'], ['コンサルティング', '28%', '115億円'], ['機器販売', '14%', '58億円'], ['その他', '6%', '25億円']].flatMap(([n, p, v], i) => [
      R(1150, 300 + i * 150, 12, 100, [IR.navy, IR.green, '#9aa0c8', '#d5d8e8'][i]),
      T(n, 1190, 300 + i * 150, 500, 34, { weight: 900, fill: IR.navy }),
      T(`${p}  ${v}`, 1190, 355 + i * 150, 600, 40, { font: MONT, weight: 700, fill: IR.ink }),
    ]),
  ]),
  pg('営業利益の増減', IR.bg, () => [
    ...irFrame(6, 'PROFIT'), ...irTitle('OPERATING PROFIT', '営業利益の増減要因'),
    makeChart({ type: 'hbar', labels: ['売上増の寄与', '原価率の改善', '人件費の増加', '広告宣伝費', '研究開発費'], values: [13.2, 4.1, -3.8, -1.6, -1.4], colors: [IR.green, IR.green, '#d96a5b', '#d96a5b', '#d96a5b'], w: 700, h: 420 }).set({ left: 100, top: 270, scaleX: 1.6, scaleY: 1.6 }),
    R(1300, 300, 520, 560, IR.white, 12),
    T('ポイント', 1340, 340, 400, 32, { weight: 900, fill: IR.green }),
    T('単価の上昇と原価の改善により、増収分のほとんどが利益に結びつきました。', 1340, 410, 440, 30, { weight: 500, fill: IR.ink, lh: 1.8 }),
  ]),
  pg('通期予想', IR.white, () => [
    ...irFrame(7, 'FORECAST'), ...irTitle('FORECAST', '通期業績予想を上方修正'),
    ...[['売上高', '860', '880', '+20'], ['営業利益', '112', '121', '+9'], ['純利益', '74', '80', '+6']].flatMap(([l, a, b, d], i) => [
      R(100 + i * 600, 300, 560, 520, IR.bg, 12),
      T(l, 140 + i * 600, 340, 480, 40, { weight: 900, fill: IR.navy }),
      T('従来予想  ' + a + '億円', 140 + i * 600, 430, 480, 30, { weight: 500, fill: IR.mid }),
      T('↓', 140 + i * 600, 490, 480, 40, { weight: 900, fill: IR.green }),
      T(b + '億円', 140 + i * 600, 560, 480, 100, { font: MONT, weight: 900, fill: IR.navy }),
      T('修正額 ' + d + '億円', 140 + i * 600, 710, 480, 34, { weight: 700, fill: IR.green }),
    ]),
  ]),
  pg('成長戦略', IR.navy, () => [
    ...irFrame(8, 'STRATEGY', true),
    T('GROWTH STRATEGY', 100, 110, 900, 24, { font: MONT, weight: 700, fill: '#55d6a8', spacing: 300 }),
    T('中期経営計画:3つの成長ドライバー', 100, 150, 1700, 64, { weight: 900, fill: IR.white }),
    ...[['01', 'クラウドの拡大', '既存顧客の利用範囲を広げ、1社あたり売上を 1.4 倍へ。'], ['02', 'AI機能の提供', '請求・在庫など業務ごとのAI機能を追加し、単価を引き上げます。'], ['03', '海外展開', '東南アジアに拠点を開設し、2029年度に海外売上比率 15%を目指します。']].flatMap(([n, t, b], i) => [
      R(100 + i * 600, 300, 560, 560, '#232b6c', 12),
      T(n, 140 + i * 600, 340, 200, 90, { font: MONT, weight: 900, fill: '#55d6a8' }),
      T(t, 140 + i * 600, 470, 480, 44, { weight: 900, fill: IR.white }),
      T(b, 140 + i * 600, 560, 480, 30, { weight: 400, fill: '#d0d4ee', lh: 1.8 }),
    ]),
  ]),
  pg('株主還元', IR.bg, () => [
    ...irFrame(9, 'DIVIDEND'), ...irTitle('SHAREHOLDER RETURN', '配当は4期連続の増配を予定'),
    makeChart({ type: 'line', labels: ['23/3', '24/3', '25/3', '26/3', '27/3予'], values: [24, 28, 32, 38, 44], colors: [IR.green], w: 700, h: 400 }).set({ left: 100, top: 270, scaleX: 1.6, scaleY: 1.6 }),
    R(1300, 300, 520, 560, IR.white, 12),
    T('年間配当(予想)', 1340, 340, 440, 32, { weight: 900, fill: IR.navy }),
    T('44円', 1340, 400, 440, 150, { font: MONT, weight: 900, fill: IR.green }),
    T('配当性向 30% を目安に、安定的な増配を続けます。', 1340, 600, 440, 30, { weight: 500, fill: IR.ink, lh: 1.8 }),
  ]),
  pg('免責・お問い合わせ', IR.white, () => [
    ...irFrame(10, 'CONTACT'), ...irTitle('DISCLAIMER & CONTACT', '将来の見通しについて・お問い合わせ'),
    T('本資料に記載の業績予想などの将来に関する記述は、現時点で入手可能な情報に基づく判断であり、実際の業績は様々な要因により異なる可能性があります。なお、本資料の数値はすべて架空のサンプルです。', 100, 290, 1700, 30, { weight: 400, fill: IR.mid, lh: 1.9 }),
    R(100, 560, 1720, 330, IR.navy, 12),
    T('IR お問い合わせ', 160, 600, 800, 32, { weight: 700, fill: '#55d6a8' }),
    T('アルファリンク株式会社  経営企画部 IR 担当', 160, 670, 1600, 44, { weight: 900, fill: IR.white }),
    T('TEL 000-0000-0000   /   ir@example.com', 160, 760, 1600, 36, { font: MONT, weight: 500, fill: '#d0d4ee' }),
  ]),
])

// =====================================================================
// 16. 製品のリリースノート・アップデート告知(16:9 / ダークネイビー + バイオレット + ミント)
// =====================================================================
const RN = { dark: '#14122b', violet: '#6a4ae8', mint: '#2ecf9e', bg: '#f6f5fb', ink: '#1c1a3a', mid: '#5f5c80', line: '#dcd9ee', white: '#ffffff' }
const rnFrame = (n: number, sec: string, dark = false): FabricObject[] => [
  T('TSUMUGI  RELEASE NOTES', 100, 50, 900, 24, { font: MONT, weight: 700, fill: dark ? '#a9a5d6' : RN.mid, spacing: 200 }),
  T(sec, 1220, 50, 600, 24, { font: MONT, weight: 700, fill: dark ? '#a9a5d6' : RN.mid, align: 'right' }),
  T('v3.0', 100, 1000, 200, 26, { font: MONT, weight: 700, fill: dark ? '#a9a5d6' : RN.violet }),
  T(String(n).padStart(2, '0'), 1720, 1000, 100, 26, { font: MONT, weight: 700, fill: dark ? '#a9a5d6' : RN.mid, align: 'right' }),
]
const rnTitle = (en: string, ja: string): FabricObject[] => [
  T(en, 100, 110, 900, 24, { font: MONT, weight: 700, fill: RN.violet, spacing: 300 }),
  T(ja, 100, 150, 1700, 64, { weight: 900, fill: RN.dark }),
]
const mock = (x: number, y: number, w: number, h: number): FabricObject[] => [
  R(x, y, w, h, RN.white, 16, { shadow: { color: 'rgba(20,18,43,0.14)', blur: 40, offsetX: 0, offsetY: 16 } }),
  R(x, y, w, 56, '#ece9fb', 16), R(x, y + 40, w, 16, '#ece9fb'),
  Ci(x + 30, y + 28, 7, '#ef6b6b'), Ci(x + 56, y + 28, 7, '#f2c14e'), Ci(x + 82, y + 28, 7, RN.mint),
  R(x + 30, y + 90, w * 0.5, 22, RN.violet, 11), R(x + 30, y + 130, w - 60, 14, '#e7e4f5', 7), R(x + 30, y + 160, w - 120, 14, '#e7e4f5', 7),
  R(x + 30, y + 210, (w - 90) / 2, h - 250, '#f1effb', 12), R(x + 60 + (w - 90) / 2, y + 210, (w - 90) / 2, h - 250, '#f1effb', 12),
]
const RELEASE = mkSet('mx-release', '製品リリースノート・アップデート告知', 'リリースノート', 1920, 1080,
  ['リリースノート', 'アップデート', 'SaaS', '新機能', '製品', '告知'], [
  pg('バージョン告知', RN.dark, () => [
    T('NEW RELEASE', 100, 260, 900, 30, { font: MONT, weight: 700, fill: RN.mint, spacing: 500 }),
    T('Tsumugi', 100, 330, 1000, 150, { font: MONT, weight: 900, fill: RN.white }),
    T('v3.0', 100, 500, 1000, 240, { font: MONT, weight: 900, fill: RN.violet }),
    T('もっと速く、もっと見やすく。\nチームの仕事を、もう一段なめらかに。', 100, 780, 1000, 40, { weight: 500, fill: '#cfcbf0', lh: 1.7 }),
    ...mock(1080, 200, 740, 640),
  ]),
  pg('ハイライト', RN.bg, () => [
    ...rnFrame(2, 'HIGHLIGHTS'), ...rnTitle('HIGHLIGHTS', 'v3.0 の3つのハイライト'),
    ...[['01', '新しいダッシュボード', '状況を、ひと目で。'], ['02', '2倍速い検索', '探しものが、すぐ見つかる。'], ['03', 'ダークモード対応', '夜の作業にも優しい表示。']].flatMap(([n, t, b], i) => [
      R(100 + i * 600, 300, 560, 560, RN.white, 16),
      T(n, 140 + i * 600, 340, 200, 80, { font: MONT, weight: 900, fill: RN.violet }),
      T(t, 140 + i * 600, 470, 480, 44, { weight: 900, fill: RN.dark }),
      T(b, 140 + i * 600, 560, 480, 32, { weight: 500, fill: RN.mid, lh: 1.7 }),
    ]),
  ]),
  pg('新機能:ダッシュボード', RN.white, () => [
    ...rnFrame(3, 'NEW'), ...rnTitle('NEW FEATURE', '新しいダッシュボード'),
    ...mock(100, 270, 900, 640),
    T('担当・期限・進み具合を\n1画面に集約', 1100, 330, 720, 48, { weight: 900, fill: RN.dark, lh: 1.5 }),
    T('・ウィジェットを自由に並べ替え\n・チームごとの表示を保存\n・毎朝のサマリーをメールで通知', 1100, 500, 720, 32, { weight: 500, fill: RN.ink, lh: 2.0 }),
    R(1100, 790, 280, 70, RN.violet, 35),
    T('すべてのプランで利用可', 1100, 810, 280, 24, { weight: 700, fill: RN.white, align: 'center' }),
  ]),
  pg('新機能:検索', RN.bg, () => [
    ...rnFrame(4, 'NEW'), ...rnTitle('NEW FEATURE', '2倍速くなった検索'),
    R(100, 290, 1000, 90, RN.white, 45, { stroke: RN.violet, strokeWidth: 3 }),
    T('「請求書」を含む未完了のタスク', 160, 315, 880, 36, { weight: 500, fill: RN.mid }),
    ...['請求書の送付(10/20)', '請求書フォーマットの更新', '請求書の承認フロー見直し'].flatMap((t, i) => [
      R(100, 420 + i * 130, 1000, 110, RN.white, 12),
      Ci(160, 475 + i * 130, 18, i === 0 ? RN.mint : '#e1def4'),
      T(t, 210, 455 + i * 130, 850, 36, { weight: 700, fill: RN.dark }),
    ]),
    T('0.4秒', 1260, 330, 560, 200, { font: MONT, weight: 900, fill: RN.violet }),
    T('10万件のタスクを検索したときの平均応答時間(従来は 0.9秒)', 1260, 570, 560, 32, { weight: 500, fill: RN.ink, lh: 1.8 }),
  ]),
  pg('改善一覧', RN.white, () => [
    ...rnFrame(5, 'IMPROVED'), ...rnTitle('IMPROVEMENTS', '改善された点'),
    makeTable({ rows: 6, cols: 2, header: RN.violet, border: RN.line, cellW: 860, cellH: 100, fontSize: 30, cells: [['項目', '変更内容'], ['タスク一覧', '並べ替えの条件を3つまで保存できるように'], ['通知', '1日のまとめ通知の時間を選べるように'], ['コメント', '画像の貼り付けに対応'], ['モバイル', 'タップできる範囲を広げ、操作しやすく'], ['エクスポート', 'CSV に「担当者」の列を追加']] }).set({ left: 100, top: 290 }),
  ]),
  pg('修正された不具合', RN.bg, () => [
    ...rnFrame(6, 'FIXED'), ...rnTitle('BUG FIXES', '修正された不具合'),
    ...[['#2814', '期限が日本時間の0時に切り替わらない問題を修正'], ['#2790', 'コメントの「元に戻す」が効かない場合がある問題を修正'], ['#2761', '添付ファイル名に空白があると開けない問題を修正'], ['#2733', '一覧の件数が実際と異なって表示される問題を修正'], ['#2702', '通知メールの件名が文字化けする問題を修正']].flatMap(([n, t], i) => [
      R(100, 290 + i * 130, 1720, 110, RN.white, 12),
      T(n, 140, 325 + i * 130, 200, 36, { font: MONT, weight: 700, fill: RN.violet }),
      T(t, 360, 325 + i * 130, 1400, 36, { weight: 500, fill: RN.dark }),
    ]),
  ]),
  pg('パフォーマンス', RN.white, () => [
    ...rnFrame(7, 'PERFORMANCE'), ...rnTitle('PERFORMANCE', '起動と表示が、速くなりました'),
    makeChart({ type: 'bar', labels: ['v2.8 起動', 'v3.0 起動', 'v2.8 検索', 'v3.0 検索'], values: [3.2, 1.6, 0.9, 0.4], colors: ['#c9c5e6', RN.violet, '#c9c5e6', RN.mint], w: 600, h: 400 }).set({ left: 100, top: 270, scaleX: 1.7, scaleY: 1.7 }),
    T('平均応答時間(秒)', 1260, 300, 560, 34, { weight: 900, fill: RN.dark }),
    T('アプリの起動時間は約2倍、検索は約2.2倍の速さになりました。', 1260, 370, 560, 32, { weight: 500, fill: RN.ink, lh: 1.8 }),
  ]),
  pg('注意事項', RN.dark, () => [
    ...rnFrame(8, 'NOTICE', true),
    T('BREAKING CHANGES', 100, 110, 900, 24, { font: MONT, weight: 700, fill: RN.mint, spacing: 300 }),
    T('アップデート前にご確認ください', 100, 150, 1700, 64, { weight: 900, fill: RN.white }),
    ...[['旧 API v1 の提供終了', '2027年3月31日をもって終了します。v2 への移行をお願いします。'], ['Web ブラウザの対応', '古いバージョンのブラウザは対象外になります。'], ['古いスマホアプリ', 'v2.5 以前はアップデートが必要です。']].flatMap(([t, b], i) => [
      R(100, 300 + i * 220, 1720, 190, '#201d44', 12),
      R(100, 300 + i * 220, 10, 190, RN.mint),
      T(t, 150, 335 + i * 220, 1600, 40, { weight: 900, fill: RN.white }),
      T(b, 150, 400 + i * 220, 1600, 32, { weight: 400, fill: '#cfcbf0' }),
    ]),
  ]),
  pg('ロードマップ', RN.white, () => [
    ...rnFrame(9, 'ROADMAP'), ...rnTitle('ROADMAP', 'これからの予定'),
    R(140, 520, 1640, 6, RN.line),
    ...[['2027 1月', 'v3.1', 'カレンダー連携'], ['2027 3月', 'v3.2', 'テンプレート機能'], ['2027 6月', 'v3.3', 'レポート自動作成'], ['2027 9月', 'v4.0', '新しい権限管理']].flatMap(([d, v, t], i) => [
      Ci(260 + i * 460, 523, 22, i === 0 ? RN.mint : RN.violet),
      T(d, 110 + i * 460, 430, 300, 32, { weight: 700, fill: RN.mid, align: 'center' }),
      T(v, 110 + i * 460, 580, 300, 60, { font: MONT, weight: 900, fill: RN.dark, align: 'center' }),
      T(t, 110 + i * 460, 670, 300, 32, { weight: 500, fill: RN.ink, align: 'center' }),
    ]),
    T('※ 予定は変更になる場合があります。', 100, 900, 1000, 24, { weight: 400, fill: RN.mid }),
  ]),
  pg('アップデート方法', RN.violet, () => [
    T('UPDATE NOW', 100, 200, 900, 30, { font: MONT, weight: 700, fill: '#d9d1ff', spacing: 500 }),
    T('アップデートは\nいつもの画面から。', 100, 270, 1700, 120, { weight: 900, fill: RN.white, lh: 1.3 }),
    ...[['Web 版', '自動で更新されます。操作は不要です。'], ['デスクトップ版', '起動時の「更新する」を押してください。'], ['モバイル版', 'ストアから最新版を入手してください。']].flatMap(([t, b], i) => [
      R(100 + i * 600, 570, 560, 260, '#7d60ee', 16),
      T(t, 140 + i * 600, 610, 480, 40, { weight: 900, fill: RN.white }),
      T(b, 140 + i * 600, 680, 480, 30, { weight: 400, fill: '#ece8ff', lh: 1.7 }),
    ]),
    T('ご意見・ご要望は  feedback@example.com  まで', 100, 900, 1700, 34, { weight: 700, fill: RN.white }),
  ]),
])

// =====================================================================
// 17. 料理教室・ワークショップのレシピカード(A5 横 / トマト + クリーム + オリーブ)
// =====================================================================
const RC = { bg: '#fff6e8', red: '#c9402a', olive: '#56672c', ink: '#34261d', mid: '#7a6354', line: '#e6d3b8', white: '#ffffff' }
const rcRecipe = (n: number, title: string, sub: string, ing: string[][], steps: string[]): TemplatePage => pg(`レシピ${n}`, RC.bg, () => [
  R(0, 0, 1240, 14, RC.red),
  T('RECIPE ' + String(n).padStart(2, '0'), 80, 56, 500, 24, { font: MONT, weight: 700, fill: RC.red, spacing: 300 }),
  T('MAME-TSUBU COOKING STUDIO', 640, 56, 520, 22, { font: MONT, weight: 700, fill: RC.mid, align: 'right', spacing: 150 }),
  T(title, 80, 100, 1080, 60, { font: MINCHO, weight: 800, fill: RC.ink }),
  T(sub, 80, 180, 1080, 28, { weight: 700, fill: RC.olive }),
  R(80, 236, 1080, 2, RC.ink),
  T('材料', 80, 262, 300, 32, { font: MINCHO, weight: 800, fill: RC.red }),
  ...ing.flatMap(([a, b], i) => [
    T(a, 80, 318 + i * 62, 300, 26, { weight: 500, fill: RC.ink }),
    T(b, 340, 318 + i * 62, 180, 26, { weight: 700, fill: RC.ink, align: 'right' }),
    R(80, 354 + i * 62, 440, 1, RC.line),
  ]),
  R(580, 262, 1, 540, RC.line),
  T('作り方', 620, 262, 300, 32, { font: MINCHO, weight: 800, fill: RC.red }),
  ...steps.flatMap((t, i) => [
    Ci(646, 352 + i * 118, 24, RC.olive),
    T(String(i + 1), 622, 337 + i * 118, 48, 28, { font: MONT, weight: 900, fill: RC.white, align: 'center' }),
    T(t, 690, 326 + i * 118, 470, 25, { weight: 500, fill: RC.ink, lh: 1.55 }),
  ]),
])
const RECIPE = mkSet('mx-recipe', '料理教室 レシピカードセット', '料理教室・レシピ', 1240, 874,
  ['料理教室', 'レシピ', 'ワークショップ', 'レシピカード', 'A5', '秋'], [
  pg('表紙', RC.red, () => [
    ...PH(640, 0, 600, 874, 0, '#e08a76'),
    T('AUTUMN COOKING CLASS', 80, 100, 520, 24, { font: MONT, weight: 700, fill: '#ffd9cf', spacing: 300 }),
    T('秋の味を\nつくる日。', 80, 170, 520, 80, { font: MINCHO, weight: 800, fill: RC.white, lh: 1.4 }),
    T('まめつぶ料理教室  レシピカード集', 80, 450, 520, 28, { weight: 700, fill: '#ffe9dc', lh: 1.5 }),
    R(80, 540, 80, 4, '#ffd9cf'),
    T('2027年 10月〜11月\n全 3 回 / 各 2 時間', 80, 580, 520, 28, { weight: 500, fill: RC.white, lh: 1.7 }),
  ]),
  pg('今月のメニュー', RC.bg, () => [
    R(0, 0, 1240, 14, RC.red),
    T('MENU', 80, 56, 500, 24, { font: MONT, weight: 700, fill: RC.red, spacing: 300 }),
    T('今月つくる3品', 80, 100, 1080, 60, { font: MINCHO, weight: 800, fill: RC.ink }),
    ...[['第1回  10/9(土)', 'きのこの炊き込みごはん', '香りを味わう、土鍋ごはん'], ['第2回  10/23(土)', 'かぼちゃのポタージュ', 'バター少なめ、やさしい甘さ'], ['第3回  11/6(土)', 'さつまいもの豚バラ巻き', 'お弁当にもおすすめの一品']].flatMap(([d, t, b], i) => [
      R(80 + i * 365, 250, 340, 520, RC.white, 8),
      ...PH(80 + i * 365, 250, 340, 230, 8, '#f0e0c8'),
      T(d, 100 + i * 365, 500, 300, 22, { weight: 700, fill: RC.red }),
      T(t, 100 + i * 365, 540, 310, 26, { font: MINCHO, weight: 800, fill: RC.ink, lh: 1.35 }),
      T(b, 100 + i * 365, 650, 300, 22, { weight: 500, fill: RC.mid, lh: 1.6 }),
    ]),
  ]),
  rcRecipe(1, 'きのこの炊き込みごはん', '4人分 / 調理時間 約45分(浸水を除く)', [['米', '2合'], ['しめじ・まいたけ', '各1パック'], ['油揚げ', '1枚'], ['だし汁', '360ml'], ['しょうゆ', '大さじ2'], ['みりん', '大さじ1']], ['米は洗って、30分ほど水に浸けてからざるにあげます。', 'きのこはほぐし、油揚げは細切りにします。', '土鍋に米・だし汁・調味料を入れ、具材をのせて強火にかけます。', '沸騰したら弱火で12分、火を止めて10分蒸らします。']),
  rcRecipe(2, 'かぼちゃのポタージュ', '4人分 / 調理時間 約30分', [['かぼちゃ', '1/4個'], ['玉ねぎ', '1/2個'], ['バター', '10g'], ['牛乳', '300ml'], ['水', '200ml'], ['塩・こしょう', '少々']], ['かぼちゃは皮をむき、玉ねぎと一緒に薄く切ります。', '鍋にバターを溶かし、玉ねぎを透き通るまで炒めます。', 'かぼちゃと水を加え、やわらかくなるまで10分煮ます。', 'ミキサーにかけ、牛乳を加えて温め、塩で味をととのえます。']),
  rcRecipe(3, 'さつまいもの豚バラ巻き', '4人分 / 調理時間 約25分', [['さつまいも', '中1本'], ['豚バラ薄切り', '8枚'], ['小麦粉', '適量'], ['しょうゆ', '大さじ1'], ['みりん', '大さじ1'], ['砂糖', '小さじ1']], ['さつまいもは1cm角の棒状に切り、水にさらします。', '水気をふき、豚肉で巻いて、小麦粉を薄くまぶします。', '巻き終わりを下にして、フライパンで転がしながら焼きます。', '合わせた調味料を加え、煮からめて照りを出します。']),
  pg('おいしくなるコツ', RC.olive, () => [
    T('POINT', 80, 60, 500, 24, { font: MONT, weight: 700, fill: '#d6e0b4', spacing: 300 }),
    T('3品に共通する\n3つのコツ', 80, 110, 1080, 56, { font: MINCHO, weight: 800, fill: RC.white, lh: 1.35 }),
    ...[['1', '火加減は、待つ', '強火のあとは、焦らずじっくり弱火で。'], ['2', '水気をしっかり', '具材の水気をふくだけで、味がぼやけません。'], ['3', '味見は2回', '途中と仕上げ。少しずつ足すのが失敗しないコツ。']].flatMap(([n, t, b], i) => [
      R(80 + i * 365, 330, 340, 420, '#46561f', 8),
      T(n, 100 + i * 365, 360, 100, 80, { font: BEBAS, weight: 400, fill: '#f6d9a3' }),
      T(t, 100 + i * 365, 470, 300, 30, { font: MINCHO, weight: 800, fill: RC.white }),
      T(b, 100 + i * 365, 540, 300, 23, { weight: 500, fill: '#e6edcf', lh: 1.7 }),
    ]),
  ]),
  pg('道具と持ち物', RC.bg, () => [
    R(0, 0, 1240, 14, RC.red),
    T('ITEMS', 80, 56, 500, 24, { font: MONT, weight: 700, fill: RC.red, spacing: 300 }),
    T('持ち物と、お貸しする道具', 80, 100, 1080, 60, { font: MINCHO, weight: 800, fill: RC.ink }),
    R(80, 230, 520, 540, RC.white, 8), R(640, 230, 520, 540, RC.white, 8),
    T('お持ちいただくもの', 120, 266, 440, 30, { font: MINCHO, weight: 800, fill: RC.red }),
    T('・エプロン\n・三角巾またはバンダナ\n・手拭きタオル\n・持ち帰り用の容器', 120, 330, 440, 28, { weight: 500, fill: RC.ink, lh: 1.9 }),
    T('お貸しするもの', 680, 266, 440, 30, { font: MINCHO, weight: 800, fill: RC.olive }),
    T('・調理器具一式\n・土鍋・ミキサー\n・レシピカード\n・試食用のお皿', 680, 330, 440, 28, { weight: 500, fill: RC.ink, lh: 1.9 }),
  ]),
  pg('先生より', RC.bg, () => [
    ...PH(80, 80, 380, 714, 8, '#f0e0c8'),
    T('MESSAGE', 520, 80, 600, 24, { font: MONT, weight: 700, fill: RC.red, spacing: 300 }),
    T('料理は、\n気楽に始めて\nいいんです。', 520, 130, 640, 56, { font: MINCHO, weight: 800, fill: RC.ink, lh: 1.45 }),
    T('「計量カップがなくても大丈夫。教室では、目分量でも失敗しない方法をお伝えします。」', 520, 440, 640, 28, { weight: 500, fill: RC.ink, lh: 1.85 }),
    T('講師  松岡 千尋', 520, 700, 640, 28, { font: MINCHO, weight: 800, fill: RC.olive }),
  ]),
  pg('日程と参加費', RC.bg, () => [
    R(0, 0, 1240, 14, RC.red),
    T('SCHEDULE', 80, 56, 500, 24, { font: MONT, weight: 700, fill: RC.red, spacing: 300 }),
    T('日程と参加費', 80, 100, 1080, 60, { font: MINCHO, weight: 800, fill: RC.ink }),
    makeTable({ rows: 4, cols: 3, header: RC.red, border: RC.line, cellW: 360, cellH: 100, fontSize: 28, cells: [['回', '日時', '参加費'], ['第1回', '10/9(土) 10:00〜12:00', '4,800円'], ['第2回', '10/23(土) 10:00〜12:00', '4,800円'], ['第3回', '11/6(土) 10:00〜12:00', '4,800円']] }).set({ left: 80, top: 240 }),
    T('3回通しで申し込むと 13,000円(材料費込み)', 80, 700, 1080, 30, { weight: 700, fill: RC.red }),
  ]),
  pg('お申し込み', RC.red, () => [
    T('ENTRY', 80, 80, 500, 24, { font: MONT, weight: 700, fill: '#ffd9cf', spacing: 300 }),
    T('お申し込みは\nこちらから', 80, 130, 1080, 80, { font: MINCHO, weight: 800, fill: RC.white, lh: 1.4 }),
    R(80, 440, 1080, 300, RC.white, 8),
    T('Web  mametsubu.example.com', 120, 480, 1000, 36, { font: MONT, weight: 700, fill: RC.red }),
    T('電話  000-0000-0000(平日 10:00〜17:00)', 120, 550, 1000, 30, { weight: 700, fill: RC.ink }),
    T('各回 8 名まで。キャンセルは前々日までにご連絡ください。', 120, 620, 1000, 26, { weight: 500, fill: RC.mid }),
  ]),
])

// =====================================================================
// 18. 旅館・ホテルの館内案内(A4 縦 / 藍墨 + 金 + 和紙色)
// =====================================================================
const RY: Pal = { main: '#1f2535', acc: '#9a7a3a', pale: '#f3eee2', ink: '#262a35', mid: '#625f58', line: '#d9d1bd' }
const OLD = 'Zen Old Mincho'
const ryHF = (n: number, sec: string) => hf(RY, 1240, 1754, 'YADO SERAGI  館内のご案内', n, sec, 100, OLD)
const ryTitle = (en: string, ja: string, y = 150) => [
  T(en, 100, y, 900, 24, { font: MONT, weight: 700, fill: RY.acc, spacing: 400 }),
  T(ja, 100, y + 44, 1040, 76, { font: OLD, weight: 700, fill: RY.main }),
  R(100, y + 140, 60, 3, RY.acc),
]
const RYOKAN = mkSet('mx-ryokan', '旅館・ホテル 館内案内セット', '旅館・ホテル', 1240, 1754,
  ['旅館', 'ホテル', '館内案内', '宿泊', '温泉', 'インフォメーション'], [
  pg('表紙', RY.main, () => [
    ...PH(100, 100, 1040, 760, 0, '#3b4358'),
    T('WELCOME', 100, 930, 700, 26, { font: MONT, weight: 700, fill: '#c9a965', spacing: 500 }),
    T('山あいの宿\nせせらぎ', 100, 990, 1040, 120, { font: OLD, weight: 700, fill: '#ffffff', lh: 1.3 }),
    R(100, 1300, 80, 3, '#c9a965'),
    T('館内のご案内', 100, 1340, 1040, 40, { font: OLD, weight: 700, fill: '#e6dcc3' }),
    T('どうぞごゆっくり、おくつろぎください。', 100, 1410, 1040, 28, { weight: 400, fill: '#bfc4d1' }),
  ]),
  pg('館内マップ', '#ffffff', () => [
    ...ryHF(2, '館内'),
    ...ryTitle('FLOOR MAP', '館内のご案内図'),
    ...[['2F', 330, [['客室 201〜206', 100, 330, 600, 190], ['ラウンジ', 700, 330, 440, 190]]], ['1F', 560, [['フロント', 100, 560, 300, 230], ['ご夕食処', 400, 560, 420, 230], ['売店', 820, 560, 320, 230]]], ['B1', 790, [['大浴場', 100, 790, 540, 220], ['貸切風呂', 640, 790, 500, 220]]]].flatMap(([, , rooms]) => (rooms as (string | number)[][]).map(([n, x, y, w, h]) => [
      R(x as number, y as number, w as number, h as number, '#faf7ef', 0, { stroke: RY.main, strokeWidth: 3 }),
      T(String(n), x as number, (y as number) + (h as number) / 2 - 18, w as number, 30, { font: OLD, weight: 700, fill: RY.main, align: 'center' }),
    ]).flat()),
    T('2F', 100, 1050, 120, 44, { font: MONT, weight: 900, fill: RY.acc }), T('客室・ラウンジ', 220, 1058, 400, 28, { weight: 500, fill: RY.ink }),
    T('1F', 100, 1120, 120, 44, { font: MONT, weight: 900, fill: RY.acc }), T('フロント・ご夕食処・売店', 220, 1128, 600, 28, { weight: 500, fill: RY.ink }),
    T('B1', 100, 1190, 120, 44, { font: MONT, weight: 900, fill: RY.acc }), T('大浴場・貸切風呂', 220, 1198, 600, 28, { weight: 500, fill: RY.ink }),
    T('エレベーターは、フロント右手にございます。', 100, 1330, 1040, 26, { weight: 500, fill: RY.mid }),
  ]),
  pg('お食事', RY.pale, () => [
    ...ryHF(3, 'お食事'),
    ...ryTitle('DINING', 'ご夕食・ご朝食'),
    ...[['ご夕食', '17:30 〜 20:00', 'ご夕食処「せせらぎ」(1階)\n季節の会席をお部屋出しまたは食事処で。'], ['ご朝食', '7:30 〜 9:30', 'ご夕食処(1階)\n和定食をご用意しています。']].flatMap(([t, h, b], i) => [
      R(100, 340 + i * 420, 1040, 380, '#ffffff'),
      R(100, 340 + i * 420, 8, 380, RY.acc),
      T(t, 150, 380 + i * 420, 600, 50, { font: OLD, weight: 700, fill: RY.main }),
      T(h, 150, 460 + i * 420, 900, 70, { font: MONT, weight: 700, fill: RY.acc }),
      T(b, 150, 570 + i * 420, 940, 28, { weight: 400, fill: RY.ink, lh: 1.8 }),
    ]),
    T('アレルギーや苦手な食材は、事前にお知らせください。', 100, 1230, 1040, 26, { weight: 500, fill: RY.mid }),
  ]),
  pg('大浴場', '#ffffff', () => [
    ...ryHF(4, '温泉'),
    ...ryTitle('HOT SPRING', '大浴場・露天風呂'),
    ...PH(100, 340, 1040, 420, 0, '#e8e1cf'),
    ...[['男湯・女湯', '15:00〜24:00 / 5:30〜9:00'], ['お湯', 'アルカリ性単純温泉(源泉かけ流し)'], ['ご注意', '入浴前にかけ湯を。タオルは湯に入れないで。']].flatMap(([l, v], i) => [
      T(l, 100, 820 + i * 130, 260, 28, { weight: 700, fill: RY.acc }),
      T(v, 380, 818 + i * 130, 760, 30, { weight: 500, fill: RY.ink, lh: 1.6 }),
      R(100, 780 + i * 130, 1040, 1, RY.line),
    ]),
  ]),
  pg('貸切風呂', RY.pale, () => [
    ...ryHF(5, '貸切風呂'),
    ...ryTitle('PRIVATE BATH', '貸切風呂のご予約'),
    ...fieldRows(RY, 100, 340, 300, 740, 150, [['ご利用時間', '1組 50分(15:00〜22:00)'], ['料金', '宿泊のお客様 2,200円'], ['ご予約', 'フロントにて承ります(先着順)'], ['空き状況', 'フロント前の掲示でご確認いただけます']], 28, OLD),
    R(100, 1050, 1040, 300, '#ffffff'),
    T('ご予約は、お早めに', 140, 1100, 960, 40, { font: OLD, weight: 700, fill: RY.main }),
    T('夕食前は特に混み合います。到着後すぐのご予約がおすすめです。', 140, 1170, 960, 28, { weight: 400, fill: RY.ink, lh: 1.8 }),
  ]),
  pg('館内施設', '#ffffff', () => [
    ...ryHF(6, '施設'),
    ...ryTitle('FACILITIES', '館内の施設'),
    ...[['売店', '9:00〜21:00', 'お土産・地酒・お菓子'], ['ラウンジ', '15:00〜23:00', 'お飲み物・軽食'], ['湯上がり処', '終日', 'お水・麦茶の無料サービス'], ['マッサージ', '要予約', '40分 4,400円〜']].flatMap(([t, h, b], i) => [
      ...PH(100 + (i % 2) * 530, 340 + Math.floor(i / 2) * 540, 510, 300, 0, '#e8e1cf'),
      T(t, 100 + (i % 2) * 530, 665 + Math.floor(i / 2) * 540, 510, 38, { font: OLD, weight: 700, fill: RY.main }),
      T(h, 100 + (i % 2) * 530, 720 + Math.floor(i / 2) * 540, 510, 26, { font: MONT, weight: 700, fill: RY.acc }),
      T(b, 100 + (i % 2) * 530, 765 + Math.floor(i / 2) * 540, 510, 26, { weight: 400, fill: RY.ink }),
    ]),
  ]),
  pg('お部屋のご案内', RY.pale, () => [
    ...ryHF(7, '客室'),
    ...ryTitle('IN YOUR ROOM', 'お部屋でのお願い'),
    ...[['浴衣・館内着', '押し入れにご用意しています。館内でもお召しいただけます。'], ['貴重品', 'お部屋の金庫をご利用ください。'], ['Wi-Fi', '全館無料。ID と パスワードは、机の上のカードに記載しています。'], ['お布団', '21:00 以降にお敷きします。ご希望の時間はお申し付けください。']].flatMap(([t, b], i) => [
      R(100, 340 + i * 270, 1040, 240, '#ffffff'),
      T(String(i + 1).padStart(2, '0'), 130, 380 + i * 270, 140, 70, { font: MONT, weight: 900, fill: RY.acc }),
      T(t, 290, 380 + i * 270, 800, 40, { font: OLD, weight: 700, fill: RY.main }),
      T(b, 290, 450 + i * 270, 810, 26, { weight: 400, fill: RY.ink, lh: 1.7 }),
    ]),
  ]),
  pg('チェックアウト', '#ffffff', () => [
    ...ryHF(8, '出発'),
    ...ryTitle('CHECK OUT', 'ご出発の前に'),
    T('10:00', 100, 340, 700, 200, { font: BEBAS, weight: 400, fill: RY.acc }),
    T('チェックアウト', 100, 560, 900, 44, { font: OLD, weight: 700, fill: RY.main }),
    ...[['お忘れ物はございませんか', 'お部屋・浴場・金庫をお確かめください。'], ['お荷物のお預かり', '出発後も、夕方 17:00 までお預かりします。'], ['タクシー・送迎', '前日までにフロントへお申し付けください。']].flatMap(([t, b], i) => [
      R(100, 700 + i * 220, 1040, 1, RY.line),
      T(t, 100, 740 + i * 220, 1040, 36, { font: OLD, weight: 700, fill: RY.main }),
      T(b, 100, 800 + i * 220, 1040, 28, { weight: 400, fill: RY.ink }),
    ]),
  ]),
  pg('周辺のご案内', RY.pale, () => [
    ...ryHF(9, '周辺'),
    ...ryTitle('AROUND', '周辺の見どころ'),
    ...[['せせらぎ遊歩道', '宿から徒歩 3 分', '川沿いの遊歩道。朝の散歩におすすめ。'], ['秋葉の滝', '車で 10 分', '紅葉の名所。高さ 24m の滝です。'], ['朝市通り', '車で 15 分', '毎朝 7:00〜 地元の野菜やパンが並びます。']].flatMap(([t, d, b], i) => [
      ...PH(100, 340 + i * 360, 380, 300, 0, '#e2dac6'),
      T(t, 520, 350 + i * 360, 620, 42, { font: OLD, weight: 700, fill: RY.main }),
      T(d, 520, 420 + i * 360, 620, 26, { weight: 700, fill: RY.acc }),
      T(b, 520, 480 + i * 360, 620, 26, { weight: 400, fill: RY.ink, lh: 1.7 }),
    ]),
  ]),
  pg('緊急時・連絡先', RY.main, () => [
    T('EMERGENCY & CONTACT', 100, 150, 900, 24, { font: MONT, weight: 700, fill: '#c9a965', spacing: 400 }),
    T('お困りのときは、\nフロントへ。', 100, 210, 1040, 100, { font: OLD, weight: 700, fill: '#ffffff', lh: 1.4 }),
    R(100, 520, 1040, 1, '#4a5268'),
    T('お部屋の電話から', 100, 570, 500, 28, { weight: 700, fill: '#c9a965' }),
    T('内線 9', 100, 620, 1040, 130, { font: OLD, weight: 700, fill: '#ffffff' }),
    T('非常時は、館内放送と係の者の案内に従い、非常口から落ち着いて避難してください。非常口は各階の廊下の突き当たりにございます。', 100, 820, 1040, 28, { weight: 400, fill: '#d5d9e4', lh: 1.9 }),
    R(100, 1100, 1040, 1, '#4a5268'),
    T('山あいの宿 せせらぎ\nサンプル県サンプル郡山あい町 1-2-3\nTEL 000-0000-0000', 100, 1150, 1040, 28, { weight: 400, fill: '#d5d9e4', lh: 1.9 }),
  ]),
])

// =====================================================================
// 19. 音楽ライブ・フェスの告知(A3 縦 / ブラック + ホットピンク + シアン)
// =====================================================================
const FS = { bg: '#0b0b10', card: '#181821', pink: '#ff2e7e', cyan: '#2ee6d6', gray: '#a7a7b8', line: '#2e2e3b', white: '#ffffff' }
const DELA = 'Dela Gothic One'
const fsBar = (n: number, sec: string): FabricObject[] => [
  T('STARDUST SOUND FESTIVAL 2027', 120, 90, 1000, 30, { font: MONT, weight: 900, fill: FS.pink, spacing: 300 }),
  T(sec, 1000, 90, 634, 30, { font: MONT, weight: 700, fill: FS.gray, align: 'right', spacing: 200 }),
  R(120, 150, 1514, 3, FS.line),
  T(String(n).padStart(2, '0'), 120, 2340, 200, 40, { font: MONT, weight: 900, fill: FS.cyan }),
  T('11.13 SAT – 11.14 SUN  /  KAIHIN PARK', 700, 2344, 934, 28, { font: MONT, weight: 700, fill: FS.gray, align: 'right', spacing: 100 }),
]
const fsTitle = (en: string, ja: string): FabricObject[] => [
  T(en, 120, 220, 1500, 150, { font: BEBAS, weight: 400, fill: FS.white }),
  T(ja, 120, 380, 1500, 44, { weight: 700, fill: FS.cyan }),
]
const FESTIVAL = mkSet('mx-festival', '音楽フェス告知セット(ポスター + SNS)', '音楽・ライブ・フェス', 1754, 2480,
  ['音楽フェス', 'ライブ', 'ポスター', 'A3', 'ラインナップ', 'チケット'], [
  pg('メインポスター', FS.bg, () => [
    ...PH(0, 0, 1754, 1300, 0, '#1c1c28'),
    R(0, 1300, 1754, 6, FS.pink),
    T('STARDUST', 100, 1380, 1554, 330, { font: BEBAS, weight: 400, fill: FS.white }),
    T('SOUND FESTIVAL', 100, 1690, 1554, 190, { font: BEBAS, weight: 400, fill: FS.pink, spacing: 100 }),
    T('星屑サウンドフェス 2027', 100, 1900, 1554, 60, { font: DELA, weight: 400, fill: FS.cyan }),
    T('11.13 SAT  –  11.14 SUN', 100, 2000, 1554, 90, { font: MONT, weight: 900, fill: FS.white }),
    T('海浜公園 特設ステージ  /  OPEN 10:00  START 11:30', 100, 2130, 1554, 40, { weight: 700, fill: FS.gray }),
    R(100, 2260, 620, 100, FS.pink),
    T('TICKET ON SALE NOW', 100, 2288, 620, 40, { font: MONT, weight: 900, fill: FS.white, align: 'center' }),
    T('stardust-fes.example.com', 780, 2292, 874, 36, { font: MONT, weight: 700, fill: FS.gray, align: 'right' }),
  ]),
  pg('ラインナップ', FS.bg, () => [
    ...fsBar(2, 'LINE UP'), ...fsTitle('LINE UP', '出演アーティスト(五十音順・一部)'),
    T('ミッドナイト・ランタン', 120, 520, 1500, 120, { font: DELA, weight: 400, fill: FS.white }),
    T('ハチミツと雷', 120, 700, 1500, 120, { font: DELA, weight: 400, fill: FS.pink }),
    ...['青いパラソル', 'KIYOMI', 'ソラトミライ', 'THE 夕立ズ', 'Wanderlust Club', 'ねむれる森', 'ペンギンホテル', 'MAYA & the Moons', 'ゆらぎ', 'ストロベリー・ブルー'].map((n, i) => T(n, 120 + (i % 2) * 780, 940 + Math.floor(i / 2) * 200, 760, 64, { weight: 900, fill: i % 4 < 2 ? FS.white : FS.cyan })),
    T('and more ...', 120, 2000, 1500, 60, { font: MONT, weight: 700, fill: FS.gray }),
  ]),
  pg('タイムテーブル', FS.bg, () => [
    ...fsBar(3, 'TIME TABLE'), ...fsTitle('TIME TABLE', '11月13日(土) / 全ステージ'),
    ...[['SEA STAGE', FS.pink, [['11:30', 'ゆらぎ'], ['13:00', '青いパラソル'], ['15:00', 'ハチミツと雷'], ['17:30', 'ミッドナイト・ランタン']]], ['PINE STAGE', FS.cyan, [['12:00', 'ねむれる森'], ['14:00', 'KIYOMI'], ['16:00', 'ソラトミライ'], ['18:30', 'THE 夕立ズ']]]].flatMap(([n, c, items], k) => [
      R(120 + (k as number) * 770, 520, 744, 90, c as string),
      T(n as string, 120 + (k as number) * 770, 543, 744, 44, { font: MONT, weight: 900, fill: FS.bg, align: 'center', spacing: 200 }),
      ...(items as string[][]).flatMap(([t, a], i) => [
        R(120 + (k as number) * 770, 640 + i * 380, 744, 350, FS.card),
        T(t, 160 + (k as number) * 770, 680 + i * 380, 300, 80, { font: BEBAS, weight: 400, fill: c as string }),
        T(a, 160 + (k as number) * 770, 800 + i * 380, 664, 56, { weight: 900, fill: FS.white, lh: 1.3 }),
        T('45 min', 160 + (k as number) * 770, 900 + i * 380, 300, 30, { font: MONT, weight: 700, fill: FS.gray }),
      ]),
    ]),
  ]),
  pg('チケット', FS.bg, () => [
    ...fsBar(4, 'TICKET'), ...fsTitle('TICKET', 'チケット情報'),
    ...[['1日券', '8,800', '11/13 または 11/14', FS.card, FS.white], ['2日通し券', '15,800', '11/13 + 11/14', FS.pink, FS.white], ['学生券', '5,500', '1日券・要学生証', FS.card, FS.white]].flatMap(([t, p, d, bg, fg], i) => [
      R(120, 520 + i * 480, 1514, 440, bg as string),
      T(t as string, 180, 570 + i * 480, 700, 60, { font: DELA, weight: 400, fill: fg as string }),
      T(d as string, 180, 670 + i * 480, 800, 36, { weight: 700, fill: i === 1 ? FS.white : FS.gray }),
      T('¥' + p, 700, 570 + i * 480, 900, 230, { font: BEBAS, weight: 400, fill: i === 1 ? FS.white : FS.cyan, align: 'right' }),
      T('税込 / 小学生以下は無料(保護者同伴)', 180, 800 + i * 480, 1420, 30, { weight: 500, fill: i === 1 ? FS.white : FS.gray }),
    ]),
    T('チケットは公式サイトと主要コンビニで販売中。', 120, 2000, 1500, 36, { weight: 700, fill: FS.white }),
  ]),
  pg('アクセス', FS.bg, () => [
    ...fsBar(5, 'ACCESS'), ...fsTitle('ACCESS', '会場へのアクセス'),
    R(120, 520, 1514, 880, FS.card),
    R(120, 900, 1514, 90, '#262633'), R(800, 520, 90, 880, '#262633'),
    R(1000, 580, 560, 280, '#10332f'), T('海浜公園', 1000, 690, 560, 50, { weight: 900, fill: FS.cyan, align: 'center' }),
    R(180, 580, 520, 280, '#262633'), T('海浜駅', 180, 690, 520, 50, { weight: 900, fill: FS.white, align: 'center' }),
    ...pin(1180, 1060, 140, FS.pink),
    T('会場', 1340, 1100, 260, 50, { weight: 900, fill: FS.white }),
    ...fieldRows({ main: FS.white, acc: FS.pink, pale: FS.card, ink: FS.white, mid: FS.cyan, line: FS.line }, 120, 1480, 380, 1134, 160, [['電車', '海浜駅から 徒歩 15 分'], ['シャトルバス', '海浜駅 北口から 8:30〜(往復 500円)'], ['お車', '専用駐車場はありません。公共交通機関でお越しください']], 34),
  ]),
  pg('ヘッドライナー', FS.bg, () => [
    ...fsBar(6, 'HEADLINER'),
    ...PH(120, 220, 1514, 1100, 0, '#1c1c28'),
    T('HEADLINER', 120, 1380, 1500, 36, { font: MONT, weight: 900, fill: FS.pink, spacing: 500 }),
    T('ミッドナイト・\nランタン', 120, 1440, 1500, 200, { font: DELA, weight: 400, fill: FS.white, lh: 1.15 }),
    T('夜の海に灯る音。結成10年、4人組のロックバンド。11月14日(日)のラストを飾ります。', 120, 1920, 1500, 40, { weight: 500, fill: FS.gray, lh: 1.8 }),
    T('SEA STAGE  /  11.14 SUN  19:30', 120, 2150, 1500, 44, { font: MONT, weight: 900, fill: FS.cyan }),
  ]),
  pg('フード&グッズ', FS.bg, () => [
    ...fsBar(7, 'FOOD & GOODS'), ...fsTitle('FOOD & GOODS', 'フード・グッズ'),
    ...['フードエリア', '公式グッズ', 'ドリンク', 'ワークショップ'].flatMap((t, i) => {
      const x = 120 + (i % 2) * 770, y = 520 + Math.floor(i / 2) * 760
      return [...PH(x, y, 744, 500, 0, '#242432'), T(t, x, y + 530, 744, 56, { font: DELA, weight: 400, fill: i % 3 === 0 ? FS.pink : FS.white }), T(['地元の人気店 12 店が出店', 'Tシャツ・タオル・ステッカー', 'クラフトビール・ノンアルも充実', '缶バッジづくり・似顔絵など'][i], x, y + 610, 744, 30, { weight: 500, fill: FS.gray })]
    }),
  ]),
  pg('ご来場の注意', FS.bg, () => [
    ...fsBar(8, 'NOTICE'), ...fsTitle('NOTICE', 'ご来場のみなさまへ'),
    ...[['持ち物', 'チケット・飲み物・日よけ・防寒具・雨具。\n会場内にコインロッカーがあります。'], ['禁止事項', '瓶・缶の持ち込み、大型の撮影機材、\nビデオ・音声の録音はお断りします。'], ['雨天・荒天', '小雨の場合は開催します。荒天の場合は\n公式サイトで開催可否をお知らせします。'], ['お子さま', '小学生以下は保護者同伴で無料。耳栓の貸出があります。']].flatMap(([t, b], i) => [
      R(120, 520 + i * 440, 1514, 400, FS.card),
      R(120, 520 + i * 440, 14, 400, i === 2 ? FS.pink : FS.cyan),
      T(t, 190, 570 + i * 440, 1300, 56, { font: DELA, weight: 400, fill: FS.white }),
      T(b, 190, 670 + i * 440, 1380, 36, { weight: 500, fill: FS.gray, lh: 1.8 }),
    ]),
  ]),
  pg('SNS 出演者発表', FS.pink, () => [
    T('STARDUST SOUND FESTIVAL 2027', 120, 90, 1500, 30, { font: MONT, weight: 900, fill: FS.bg, spacing: 300 }),
    T('第2弾', 120, 260, 1500, 360, { font: DELA, weight: 400, fill: FS.white }),
    T('出演者\n発表!', 120, 640, 1500, 360, { font: DELA, weight: 400, fill: FS.bg, lh: 1.05 }),
    R(120, 1520, 1514, 6, FS.bg),
    T('ペンギンホテル\nMAYA & the Moons\nストロベリー・ブルー', 120, 1600, 1500, 100, { weight: 900, fill: FS.white, lh: 1.35 }),
    T('詳細は公式サイトへ  stardust-fes.example.com', 120, 2150, 1500, 44, { font: MONT, weight: 700, fill: FS.bg }),
  ]),
  pg('SNS カウントダウン', FS.bg, () => [
    T('COUNT DOWN', 120, 150, 1500, 40, { font: MONT, weight: 900, fill: FS.cyan, spacing: 500 }),
    T('あと', 120, 400, 400, 90, { font: DELA, weight: 400, fill: FS.white }),
    T('30', 100, 480, 1560, 1000, { font: BEBAS, weight: 400, fill: FS.pink }),
    T('DAYS', 120, 1560, 1500, 160, { font: BEBAS, weight: 400, fill: FS.white, spacing: 300 }),
    R(120, 1850, 1514, 3, FS.line),
    T('11.13 SAT – 11.14 SUN / 海浜公園', 120, 1920, 1500, 56, { font: MONT, weight: 900, fill: FS.white }),
    T('チケット好評発売中', 120, 2030, 1500, 50, { weight: 900, fill: FS.cyan }),
  ]),
])

// =====================================================================
// 20. 読書・学習ノート / 勉強記録(Instagram ストーリー 1080×1920 / ペーパー + ブルーインク + 蛍光イエロー)
// =====================================================================
const NT = { paper: '#f8f4ea', ink: '#2c4a7c', hi: '#ffe45c', red: '#d9503f', mid: '#6b7790', line: '#e0d9c5', white: '#fffdf6' }
const KLEE = 'Klee One'
const YOMOGI = 'Yomogi'
const ruled = (y0: number, y1: number, step = 70): FabricObject[] => {
  const out: FabricObject[] = []
  for (let y = y0; y <= y1; y += step) out.push(R(60, y, 960, 2, NT.line))
  return out
}
const ntHead = (n: number, ja: string, sub: string): FabricObject[] => [
  T('STUDY NOTE  ' + String(n).padStart(2, '0'), 70, 90, 600, 26, { font: MONT, weight: 700, fill: NT.mid, spacing: 200 }),
  R(70, 190, 520, 36, NT.hi),
  T(ja, 70, 140, 940, 72, { font: KLEE, weight: 600, fill: NT.ink }),
  T(sub, 70, 250, 940, 32, { font: YOMOGI, weight: 400, fill: NT.mid }),
]
const NOTE = mkSet('mx-studynote', '読書・学習ノート(ストーリー)', 'ストーリー・学習ノート', 1080, 1920,
  ['学習ノート', '読書記録', '勉強記録', 'ストーリー', 'Instagram', '習慣'], [
  pg('表紙', NT.paper, () => [
    R(0, 0, 90, 1920, NT.ink),
    ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => Ci(45, 200 + i * 135, 16, NT.paper)),
    T('MY STUDY LOG', 170, 300, 800, 30, { font: MONT, weight: 700, fill: NT.mid, spacing: 400 }),
    R(170, 470, 720, 60, NT.hi),
    T('読書と勉強の\n記録ノート', 170, 380, 800, 120, { font: KLEE, weight: 600, fill: NT.ink, lh: 1.3 }),
    ...PH(170, 800, 760, 560, 12, '#e9e2cf'),
    T('2027  10月', 170, 1440, 800, 70, { font: MONT, weight: 900, fill: NT.ink }),
    T('今月の目標:本を 4 冊 / 勉強 40 時間', 170, 1560, 800, 36, { font: YOMOGI, weight: 400, fill: NT.red }),
    T('name:ゆい', 170, 1740, 800, 36, { font: YOMOGI, weight: 400, fill: NT.mid }),
  ]),
  pg('今月の目標', NT.paper, () => [
    ...ntHead(2, '今月の目標', 'まずは数字で決めておく'),
    ...[['本を読む', '4 冊', 0.5], ['勉強の時間', '40 時間', 0.35], ['早起き', '15 日', 0.6]].flatMap(([t, g, p], i) => [
      T(t as string, 70, 420 + i * 420, 600, 50, { font: KLEE, weight: 600, fill: NT.ink }),
      T(g as string, 560, 410 + i * 420, 450, 70, { font: KLEE, weight: 600, fill: NT.red, align: 'right' }),
      R(70, 520 + i * 420, 940, 36, '#ebe3cf', 18),
      R(70, 520 + i * 420, 940 * (p as number), 36, NT.ink, 18),
      T('いまの進み具合  ' + Math.round((p as number) * 100) + '%', 70, 580 + i * 420, 940, 30, { font: YOMOGI, weight: 400, fill: NT.mid }),
    ]),
  ]),
  pg('読書記録', NT.paper, () => [
    ...ntHead(3, '読書記録', '読んだ本をメモしておく'),
    R(60, 350, 960, 1450, NT.white, 12, { stroke: NT.line, strokeWidth: 3 }),
    ...PH(110, 400, 360, 520, 8, '#e9e2cf'),
    T('TITLE', 510, 410, 480, 26, { font: MONT, weight: 700, fill: NT.mid, spacing: 300 }),
    T('星をめぐる\n図書館', 510, 450, 480, 64, { font: KLEE, weight: 600, fill: NT.ink, lh: 1.35 }),
    T('著者  白川 凪', 510, 640, 480, 30, { font: YOMOGI, weight: 400, fill: NT.mid }),
    T('評価', 510, 760, 480, 28, { font: MONT, weight: 700, fill: NT.mid }),
    T('★★★★☆', 510, 810, 480, 60, { weight: 400, fill: NT.red }),
    T('読了日  10 / 14', 510, 890, 480, 28, { font: YOMOGI, weight: 400, fill: NT.mid }),
    R(110, 1000, 860, 36, NT.hi), T('ひとこと感想', 110, 995, 860, 40, { font: KLEE, weight: 600, fill: NT.ink }),
    T('静かな夜に少しずつ読むのにぴったり。図書館という場所が好きになった。続編も読みたい。', 110, 1080, 860, 38, { font: YOMOGI, weight: 400, fill: NT.ink, lh: 1.9 }),
    ...ruled(1330, 1740, 80).map((o) => o),
  ]),
  pg('お気に入りの一節', NT.ink, () => [
    T('FAVORITE QUOTE', 70, 120, 900, 26, { font: MONT, weight: 700, fill: '#a8b8d6', spacing: 400 }),
    T('“', 70, 260, 300, 300, { font: 'Playfair Display', weight: 700, fill: NT.hi }),
    T('忘れてしまうことは、\nなくなることとは\n少し違う。', 100, 640, 880, 78, { font: KLEE, weight: 600, fill: '#ffffff', lh: 1.6 }),
    R(100, 1150, 120, 6, NT.hi),
    T('「星をめぐる図書館」より  p.124', 100, 1210, 880, 34, { font: YOMOGI, weight: 400, fill: '#c9d4ea' }),
    T('なぜこの言葉が好きか', 100, 1450, 880, 34, { font: KLEE, weight: 600, fill: NT.hi }),
    T('忘れても、どこかに残っていると思えると、少し気が楽になるから。', 100, 1520, 880, 36, { font: YOMOGI, weight: 400, fill: '#ffffff', lh: 1.8 }),
  ]),
  pg('今週の勉強時間', NT.paper, () => [
    ...ntHead(5, '今週の勉強時間', '1日ごとの合計(時間)'),
    makeChart({ type: 'bar', labels: ['月', '火', '水', '木', '金', '土', '日'], values: [1.5, 2, 0.5, 2.5, 1, 3.5, 2], colors: [NT.ink, NT.ink, NT.ink, NT.ink, NT.ink, NT.red, NT.ink], w: 620, h: 420 }).set({ left: 70, top: 380, scaleX: 1.5, scaleY: 1.5 }),
    T('合計', 70, 1100, 300, 36, { font: MONT, weight: 700, fill: NT.mid }),
    T('13 時間', 70, 1150, 700, 130, { font: KLEE, weight: 600, fill: NT.ink }),
    R(70, 1330, 940, 3, NT.line),
    T('いちばん集中できたのは土曜の午前。朝のうちに難しい科目をやるとはかどる。', 70, 1390, 940, 38, { font: YOMOGI, weight: 400, fill: NT.ink, lh: 1.9 }),
  ]),
  pg('習慣トラッカー', NT.paper, () => [
    ...ntHead(6, '習慣トラッカー', 'できた日にスタンプ'),
    ...['月', '火', '水', '木', '金', '土', '日'].map((d, i) => T(d, 380 + i * 90, 340, 80, 34, { font: KLEE, weight: 600, fill: i === 6 ? NT.red : NT.ink, align: 'center' })),
    ...[['早起き', [1, 1, 0, 1, 1, 1, 0]], ['30分 読書', [1, 1, 1, 0, 1, 1, 1]], ['英単語', [1, 0, 1, 1, 0, 1, 1]], ['ストレッチ', [0, 1, 0, 1, 1, 0, 1]], ['日記', [1, 1, 1, 1, 0, 1, 1]], ['水を2L', [1, 0, 1, 1, 1, 0, 1]]].flatMap(([t, v], r) => [
      T(t as string, 70, 440 + r * 170, 300, 38, { font: KLEE, weight: 600, fill: NT.ink }),
      ...(v as number[]).map((x, c) => Ci(420 + c * 90, 462 + r * 170, 30, x ? NT.hi : '#ece6d4', { stroke: NT.ink, strokeWidth: x ? 3 : 0 })),
      R(70, 540 + r * 170, 940, 2, NT.line),
    ]),
    T('今週は 29 / 42  できた!', 70, 1520, 940, 56, { font: KLEE, weight: 600, fill: NT.red }),
  ]),
  pg('勉強計画', NT.paper, () => [
    ...ntHead(7, '今日の勉強プラン', '終わったらチェック'),
    ...[['英語 長文 2題', '9:00', true], ['数学 問題集 p.40-45', '10:30', true], ['歴史 年表づくり', '13:00', false], ['英単語 30語', '15:00', false], ['理科 ノートまとめ', '16:30', false], ['明日の準備と復習', '20:00', false]].flatMap(([t, h, d], i) => [
      R(70, 420 + i * 220, 56, 56, d ? NT.hi : NT.white, 8, { stroke: NT.ink, strokeWidth: 4 }),
      ...(d ? [T('✓', 70, 417 + i * 220, 56, 60, { weight: 900, fill: NT.ink, align: 'center' })] : []),
      T(t as string, 160, 412 + i * 220, 700, 46, { font: KLEE, weight: 600, fill: NT.ink }),
      T(h as string, 160, 478 + i * 220, 400, 32, { font: MONT, weight: 700, fill: NT.mid }),
    ]),
  ]),
  pg('暗記カード', NT.paper, () => [
    ...ntHead(8, '暗記メモ', '英単語 10月の5語'),
    ...[['reliable', '信頼できる'], ['gradually', '少しずつ'], ['essential', '不可欠な'], ['contribute', '貢献する'], ['ambitious', '野心のある']].flatMap(([w, m], i) => [
      R(70, 340 + i * 290, 940, 250, NT.white, 12, { stroke: NT.line, strokeWidth: 3 }),
      R(70, 340 + i * 290, 16, 250, i % 2 ? NT.hi : NT.ink, 0),
      T(w, 130, 390 + i * 290, 820, 80, { font: MONT, weight: 700, fill: NT.ink }),
      T(m, 130, 500 + i * 290, 820, 50, { font: KLEE, weight: 600, fill: NT.red }),
    ]),
  ]),
  pg('ふりかえり', NT.paper, () => [
    ...ntHead(9, '今月のふりかえり', 'うまくいったこと・次にやること'),
    ...[['Keep', 'よかったこと', '朝の読書が習慣になった。', NT.ink], ['Problem', 'うまくいかなかったこと', '平日の夜は疲れて勉強できない日が多い。', NT.red], ['Try', '次にやってみること', '朝30分に勉強を移し、夜は復習だけにする。', NT.ink]].flatMap(([k, t, b, c], i) => [
      R(70, 360 + i * 480, 940, 440, NT.white, 12, { stroke: NT.line, strokeWidth: 3 }),
      R(70, 360 + i * 480, 940, 90, c as string, 12), R(70, 420 + i * 480, 940, 30, c as string),
      T(k as string, 110, 380 + i * 480, 360, 50, { font: MONT, weight: 900, fill: NT.white }),
      T(t as string, 400, 386 + i * 480, 580, 40, { font: KLEE, weight: 600, fill: NT.white, align: 'right' }),
      T(b as string, 110, 490 + i * 480, 860, 40, { font: YOMOGI, weight: 400, fill: NT.ink, lh: 1.8 }),
    ]),
  ]),
  pg('来週の目標', NT.hi, () => [
    T('NEXT WEEK', 70, 150, 900, 30, { font: MONT, weight: 700, fill: NT.ink, spacing: 500 }),
    T('来週の\nわたしへ', 70, 260, 940, 150, { font: KLEE, weight: 600, fill: NT.ink, lh: 1.25 }),
    R(70, 640, 940, 4, NT.ink),
    ...['本を1冊読み終える', '英単語を毎日10個', '日曜は完全に休む'].flatMap((t, i) => [
      R(70, 720 + i * 220, 70, 70, NT.white, 10, { stroke: NT.ink, strokeWidth: 5 }),
      T(t, 180, 725 + i * 220, 830, 60, { font: KLEE, weight: 600, fill: NT.ink }),
    ]),
    T('ここまで読んでくれてありがとう。\nつづきは次のストーリーで。', 70, 1500, 940, 40, { font: YOMOGI, weight: 400, fill: NT.ink, lh: 1.9 }),
    T('#勉強記録  #読書ノート', 70, 1700, 940, 36, { font: YOMOGI, weight: 400, fill: NT.ink }),
  ]),
])

export const MORE_SETS: Template[] = [RESUME, JOBS, REAL, CAFE, SALON, SCHOOL, CLINIC, CALENDAR, WEDDING, ECOM, PODCAST, TOWN, KIDS, GYM, IRSET, RELEASE, RECIPE, RYOKAN, FESTIVAL, NOTE]
