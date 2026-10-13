import type { FabricObject } from 'fabric'
import type { Template, TemplatePage, TemplateBg } from '../templates'
import { T, R, Ci, S, PH } from '../templates/kit'
import { makeChart, makeTable } from '../../editor/elements'
import { VText } from '../../editor/vtext'

// 印刷物系テンプレートセット(A4 冊子・名刺・はがき・賞状)。1セット = 1 Template、2ページ目以降は more に入れる。
const pg = (label: string, bg: TemplateBg, build: () => FabricObject[]): TemplatePage => ({ label, bg, build })
const mkSet = (id: string, name: string, category: string, w: number, h: number, tags: string[], pages: TemplatePage[]): Template => ({
  id, name, category, w, h, tags, bg: pages[0].bg, build: pages[0].build, more: pages.slice(1),
})
const MINCHO = 'Shippori Mincho'
const MONT = 'Montserrat'

/** n 文字ごとに改行を入れる(文末記号は行頭に来ないよう1文字だけはみ出して許容)。Textbox の width は (n+1) 文字ぶん確保すること */
const wrap = (s: string, n: number) =>
  s.split('\n').map((p) => {
    const out: string[] = []
    let line = ''
    for (const ch of [...p]) {
      if ([...line].length >= n && !'。、」』）)・,.!?'.includes(ch)) { out.push(line); line = '' }
      line += ch
    }
    out.push(line)
    return out.join('\n')
  }).join('\n')

// =====================================================================
// 1. 会社案内パンフレット(A4 縦 / ネイビー + オレンジ / しっぽり明朝 + Noto Sans JP)
// =====================================================================
const CO = { navy: '#17304a', acc: '#d9732f', pale: '#f3f0ea', ink: '#1c2733', mid: '#6b7684', line: '#d8d3c9' }
const coHF = (n: number, sec: string): FabricObject[] => [
  T('MINATO DESIGN  COMPANY PROFILE', 100, 64, 700, 22, { font: MONT, weight: 700, fill: CO.mid, spacing: 200 }),
  T(sec, 740, 64, 400, 22, { weight: 500, fill: CO.mid, align: 'right' }),
  R(100, 104, 1040, 2, CO.navy),
  R(100, 1620, 1040, 1, CO.line),
  T(String(n).padStart(2, '0'), 100, 1640, 120, 26, { font: MONT, weight: 700, fill: CO.navy }),
  T('株式会社ミナト設計', 640, 1640, 500, 22, { weight: 500, fill: CO.mid, align: 'right' }),
]
const coHead = (en: string, ja: string, y = 150): FabricObject[] => [
  T(en, 100, y, 700, 24, { font: MONT, weight: 700, fill: CO.acc, spacing: 300 }),
  T(ja, 100, y + 44, 1040, 72, { font: MINCHO, weight: 800, fill: CO.navy }),
]

const COMPANY = mkSet('pr-company', '会社案内パンフレット(建築設計)', '会社案内・パンフレット', 1240, 1754,
  ['会社案内', 'パンフレット', '建築', '設計事務所', 'コーポレート', '冊子'], [
  pg('表紙', CO.navy, () => [
    R(100, 150, 80, 8, CO.acc),
    T('COMPANY PROFILE 2027', 100, 186, 800, 24, { font: MONT, weight: 700, fill: '#c9d3df', spacing: 300 }),
    T('まちと暮らしを、\nていねいに設計する。', 100, 320, 1040, 92, { font: MINCHO, weight: 800, fill: '#ffffff', lh: 1.4 }),
    T('株式会社ミナト設計  会社案内', 100, 640, 900, 34, { weight: 500, fill: '#c9d3df' }),
    ...PH(100, 800, 1040, 680, 0, '#d9dde2'),
    R(100, 1420, 280, 60, CO.acc),
    T('SINCE 1998', 124, 1436, 240, 26, { font: MONT, weight: 700, fill: '#ffffff', spacing: 150 }),
    T('MINATO DESIGN INC.', 100, 1590, 600, 24, { font: MONT, weight: 700, fill: '#8fa1b5', spacing: 200 }),
    T('www.example.com', 740, 1590, 400, 24, { font: MONT, weight: 400, fill: '#8fa1b5', align: 'right' }),
  ]),
  pg('ごあいさつ', '#ffffff', () => [
    ...coHF(2, 'ごあいさつ'),
    ...coHead('GREETING', '建てる前に、まず聞く。'),
    ...PH(100, 340, 400, 600, 8),
    T('ミナト設計は創業以来、住まいや\n店舗、公共の場づくりに携わって\nきました。大切にしてきたのは、\n「誰が、どう過ごす場所か」を\n先に深く聞くことです。\n\n建物は完成して終わりではなく、\n暮らしの中で少しずつ育ちます。\n十年後、二十年後にも「ここで\nよかった」と思っていただける\n設計を、これからも続けます。', 560, 340, 580, 26, { weight: 400, fill: CO.ink, lh: 1.85 }),
    T('代表取締役  水野 大和', 560, 962, 580, 28, { weight: 700, fill: CO.navy }),
    R(100, 1060, 1040, 480, CO.pale, 6),
    T('MANAGEMENT PHILOSOPHY', 150, 1095, 800, 24, { font: MONT, weight: 700, fill: CO.acc, spacing: 200 }),
    T('経営理念', 150, 1135, 600, 44, { font: MINCHO, weight: 800, fill: CO.navy }),
    ...['聞く', '描く', '見届ける'].flatMap((t, i) => [
      R(150 + i * 335, 1230, 4, 270, CO.acc),
      T('0' + (i + 1), 180 + i * 335, 1228, 100, 40, { font: MONT, weight: 900, fill: CO.acc }),
      T(t, 180 + i * 335, 1280, 260, 44, { font: MINCHO, weight: 800, fill: CO.navy }),
      T(['使う人の声と\n暮らしの時間を、\n時間をかけて\nうかがいます。', '聞いた言葉を\n形にして、何度も\n試しながら\n図面にします。', '完成後も点検と\n相談に伴走し、\n場所の成長を\n見届けます。'][i], 180 + i * 335, 1345, 270, 24, { weight: 400, fill: CO.ink, lh: 1.65 }),
    ]),
  ]),
  pg('目次', CO.pale, () => [
    ...coHF(3, '目次'),
    T('CONTENTS', 100, 150, 700, 24, { font: MONT, weight: 700, fill: CO.acc, spacing: 300 }),
    T('目次', 100, 194, 600, 96, { font: MINCHO, weight: 800, fill: CO.navy }),
    ...[['ごあいさつ', '02'], ['事業内容', '04'], ['選ばれる理由', '05'], ['施工事例', '06'], ['沿革', '07'], ['会社概要', '08'], ['スタッフ紹介', '09']].flatMap(([t, p], i) => [
      T(String(i + 1).padStart(2, '0'), 100, 430 + i * 150, 140, 54, { font: MONT, weight: 900, fill: CO.acc }),
      T(t, 260, 436 + i * 150, 600, 46, { font: MINCHO, weight: 800, fill: CO.navy }),
      T('p.' + p, 940, 442 + i * 150, 200, 34, { font: MONT, weight: 700, fill: CO.mid, align: 'right' }),
      R(100, 516 + i * 150, 1040, 1, CO.line),
    ]),
  ]),
  pg('事業内容', '#ffffff', () => [
    ...coHF(4, '事業内容'),
    ...coHead('SERVICE', '三つの設計で、場所をつくる'),
    ...[
      ['住宅設計', 'HOUSING', '注文住宅から集合住宅まで。\n家族の暮らし方を丁寧に\n聞き取り、光と風の通る\n住まいをかたちにします。'],
      ['店舗・商業施設', 'COMMERCIAL', '飲食店や小売店の内装と\n建築を一体で設計。お店の\n世界観が伝わる空間と、\n働きやすい動線をつくります。'],
      ['公共・福祉施設', 'PUBLIC', '図書館や保育園など、地域の\n人が集まる場所を設計。\n誰にとっても使いやすい\nかたちを大切にします。'],
    ].flatMap(([t, en, b], i) => {
      const y = 370 + i * 410, right = i === 1
      return [
        ...PH(right ? 720 : 100, y, 420, 340, 6),
        T(en, right ? 100 : 570, y + 6, 500, 22, { font: MONT, weight: 700, fill: CO.acc, spacing: 250 }),
        T(t, right ? 100 : 570, y + 44, 570, 44, { font: MINCHO, weight: 800, fill: CO.navy }),
        R(right ? 100 : 570, y + 112, 60, 4, CO.acc),
        T(b, right ? 100 : 570, y + 140, 570, 26, { weight: 400, fill: CO.ink, lh: 1.75 }),
      ]
    }),
  ]),
  pg('選ばれる理由', CO.pale, () => [
    ...coHF(5, '選ばれる理由'),
    ...coHead('STRENGTH', '数字で見るミナト設計'),
    ...[['25', '年', '設計実績', '創業から積み重ねた\n設計の経験があります。'], ['480', '件', '設計した建物', '住宅・店舗・公共施設を\nあわせた累計の件数です。'], ['30', '名', '設計スタッフ', '一級建築士を中心とした\n専門チームが担当します。'], ['9', '割', 'リピート・ご紹介', '次のご相談につながる\nお客さまが多くいます。']].flatMap(([n, u, l, d], i) => {
      const x = 100 + (i % 2) * 540, y = 380 + Math.floor(i / 2) * 540
      return [
        R(x, y, 500, 480, '#ffffff', 6),
        R(x, y, 500, 8, CO.acc),
        T(n, x + 40, y + 60, 380, 150, { font: MONT, weight: 900, fill: CO.navy }),
        T(u, x + 40 + (n.length * 108 + 10), y + 140, 100, 54, { font: MINCHO, weight: 800, fill: CO.acc }),
        T(l, x + 40, y + 300, 420, 32, { weight: 700, fill: CO.navy }),
        T(d, x + 40, y + 360, 420, 24, { weight: 400, fill: CO.mid, lh: 1.6 }),
      ]
    }),
    T('※ 数値はサンプル(例)です。実際の数値に差し替えてご利用ください。', 100, 1560, 1040, 22, { weight: 400, fill: CO.mid }),
  ]),
  pg('施工事例', '#ffffff', () => [
    ...coHF(6, '施工事例'),
    ...coHead('WORKS', '丘の上の小さな図書館'),
    ...PH(100, 340, 1040, 600, 6),
    T('CASE 01', 100, 990, 300, 24, { font: MONT, weight: 700, fill: CO.acc, spacing: 250 }),
    ...[['所在地', '例)長野県○○市'], ['用途', '公共図書館'], ['規模', '木造平屋 / 延床 420㎡'], ['竣工', '2025年春']].flatMap(([k, v], i) => [
      T(k, 100, 1050 + i * 100, 140, 24, { weight: 700, fill: CO.mid }),
      T(v, 250, 1050 + i * 100, 380, 26, { weight: 500, fill: CO.ink }),
      R(100, 1100 + i * 100 + 18, 450, 1, CO.line),
    ]),
    T('地域の子どもたちが\n放課後に立ち寄れる、\nやわらかな居場所を\n目指しました。', 640, 1040, 500, 28, { weight: 700, fill: CO.navy, lh: 1.7 }),
    T('大きな屋根の下に、読む・調べる・\n話すの三つの居場所を段差でゆるく\nつなぎ、どこにいても人の気配を\n感じられる平面計画としています。', 640, 1260, 500, 22, { weight: 400, fill: CO.ink, lh: 1.8 }),
  ]),
  pg('沿革', CO.pale, () => [
    ...coHF(7, '沿革'),
    ...coHead('HISTORY', '25年のあゆみ'),
    R(330, 340, 3, 1190, CO.navy),
    ...[['1998', '港区の小さな事務所で創業'], ['2003', '住宅設計部門を設立'], ['2008', '店舗・商業施設の設計に事業を拡大'], ['2013', '公共施設の設計に取り組み始める'], ['2018', '大阪オフィスを開設'], ['2023', '創業25周年。環境配慮設計チームを発足'], ['2026', '設計スタッフ30名の体制に']].flatMap(([y, t], i) => [
      T(y, 100, 350 + i * 170, 190, 44, { font: MONT, weight: 900, fill: i === 6 ? CO.acc : CO.navy, align: 'right' }),
      Ci(331, 372 + i * 170, 14, i === 6 ? CO.acc : CO.navy),
      T(t, 390, 354 + i * 170, 750, 32, { weight: 700, fill: CO.ink }),
    ]),
  ]),
  pg('会社概要', '#ffffff', () => [
    ...coHF(8, '会社概要'),
    ...coHead('OUTLINE', '会社概要'),
    ...[['商号', '株式会社ミナト設計'], ['設立', '1998年4月'], ['代表者', '代表取締役 水野 大和'], ['資本金', '3,000万円(例)'], ['従業員数', '30名(例)'], ['所在地', '〒000-0000 東京都○○区○○ 1-2-3'], ['事業内容', '建築設計・監理 / インテリア設計\n都市・環境計画 / 設計コンサルティング']].reduce<{ y: number; o: FabricObject[] }>((a, [k, v]) => {
      const h = v.includes('\n') ? 150 : 100
      a.o.push(R(100, a.y, 1040, 1, CO.line), T(k, 100, a.y + 30, 220, 26, { weight: 700, fill: CO.navy }), T(v, 340, a.y + 30, 800, 26, { weight: 400, fill: CO.ink, lh: 1.6 }))
      a.y += h
      return a
    }, { y: 360, o: [] }).o,
    ...PH(100, 1130, 1040, 360, 6),
    T('ACCESS  最寄り駅から徒歩5分 / 地図の画像を入れてください', 100, 1520, 1040, 24, { weight: 500, fill: CO.mid }),
  ]),
  pg('スタッフ紹介', CO.pale, () => [
    ...coHF(9, 'スタッフ紹介'),
    ...coHead('MEMBER', '設計を担う人たち'),
    ...[['水野 大和', '代表 / 一級建築士', '話を聞くことから\n始めるのが信条です。'], ['川端 さくら', '住宅設計チーム', '光の入り方に\nこだわっています。'], ['高階 亮', '公共施設チーム', '使う人みんなの\n目線で考えます。']].flatMap(([n, r, c], i) => [
      ...PH(100 + i * 357, 380, 326, 400, 6),
      T(n, 100 + i * 357, 810, 326, 34, { weight: 900, fill: CO.navy }),
      T(r, 100 + i * 357, 862, 326, 22, { weight: 500, fill: CO.acc }),
      T(c, 100 + i * 357, 912, 326, 24, { weight: 400, fill: CO.ink, lh: 1.7 }),
    ]),
    R(100, 1130, 1040, 400, '#ffffff', 6),
    T('チームの働き方', 150, 1170, 600, 40, { font: MINCHO, weight: 800, fill: CO.navy }),
    T('案件ごとに設計者・施工管理・インテリアの担当が\n一つのチームを組み、最初の打合せから引き渡し\nまで同じ顔ぶれで伴走します。担当が変わらない\nので、小さな相談も遠慮なくお寄せください。', 150, 1240, 940, 26, { weight: 400, fill: CO.ink, lh: 1.85 }),
  ]),
  pg('裏表紙', CO.navy, () => [
    R(100, 150, 80, 8, CO.acc),
    T('CONTACT', 100, 186, 600, 24, { font: MONT, weight: 700, fill: '#c9d3df', spacing: 300 }),
    T('まずは、お話を\nうかがうところから。', 100, 300, 1040, 84, { font: MINCHO, weight: 800, fill: '#ffffff', lh: 1.4 }),
    ...[['TEL', '000-0000-0000(平日 9:00-18:00)'], ['MAIL', 'info@example.com'], ['WEB', 'www.example.com'], ['ADDRESS', '〒000-0000 東京都○○区○○ 1-2-3']].flatMap(([k, v], i) => [
      R(100, 700 + i * 140, 1040, 1, '#3a5370'),
      T(k, 100, 740 + i * 140, 240, 24, { font: MONT, weight: 700, fill: CO.acc, spacing: 200 }),
      T(v, 360, 732 + i * 140, 780, 34, { weight: 500, fill: '#ffffff' }),
    ]),
    T('株式会社ミナト設計', 100, 1560, 700, 30, { font: MINCHO, weight: 800, fill: '#ffffff' }),
    T('MINATO DESIGN INC.', 700, 1568, 440, 22, { font: MONT, weight: 700, fill: '#8fa1b5', spacing: 200, align: 'right' }),
  ]),
])
// =====================================================================
// 2. サービス資料・ホワイトペーパー(A4 縦 / ティール + イエロー / Zen 角ゴシック)
// =====================================================================
const WP = { teal: '#0b5d5b', deep: '#0b3b3a', yel: '#f2b632', pale: '#eef5f4', ink: '#14262a', mid: '#5f7378', line: '#cfdcda' }
const ZK = 'Zen Kaku Gothic New'
const wpHF = (n: number, sec: string): FabricObject[] => [
  R(100, 62, 10, 30, WP.yel),
  T('WHITE PAPER', 126, 66, 400, 22, { font: MONT, weight: 700, fill: WP.teal, spacing: 250 }),
  T(sec, 640, 66, 500, 22, { weight: 500, fill: WP.mid, align: 'right' }),
  R(100, 1620, 1040, 1, WP.line),
  T(String(n).padStart(2, '0'), 100, 1640, 100, 26, { font: MONT, weight: 700, fill: WP.teal }),
  T('バックオフィス自動化の進め方', 540, 1642, 600, 22, { weight: 500, fill: WP.mid, align: 'right' }),
]
const wpHead = (no: string, ja: string, y = 140): FabricObject[] => [
  R(100, y - 6, no.length * 25 + 28, 36, WP.teal),
  T(no, 100, y, no.length * 25 + 28, 24, { font: MONT, weight: 700, fill: WP.yel, spacing: 300, align: 'center' }),
  T(ja, 100, y + 50, 1040, 66, { font: ZK, weight: 900, fill: WP.deep }),
]
const wpPoint = (x: number, y: number, t: string) => [
  S('check', x, y + 3, 34, WP.teal),
  T(t, x + 56, y, 900, 28, { weight: 500, fill: WP.ink }),
]

const WHITEPAPER = mkSet('pr-whitepaper', 'ホワイトペーパー(業務自動化ガイド)', 'ドキュメント', 1240, 1754,
  ['ホワイトペーパー', 'サービス資料', 'ガイドブック', 'BtoB', '資料請求', 'リード獲得'], [
  pg('表紙', WP.deep, () => [
    ...PH(640, 0, 600, 1754, 0, '#cfd8d7'),
    R(100, 150, 10, 150, WP.yel),
    T('WHITE PAPER  2027', 140, 150, 460, 24, { font: MONT, weight: 700, fill: WP.yel, spacing: 250 }),
    T('中小企業のための実践ガイド', 140, 214, 480, 28, { weight: 500, fill: '#b9d0cf' }),
    T('バックオフィス\n自動化の\n進め方', 100, 520, 500, 64, { font: ZK, weight: 900, fill: '#ffffff', lh: 1.35 }),
    T('「人手が足りない」を\n仕組みで解決する\n四つの手順', 100, 880, 500, 30, { weight: 500, fill: '#dcebea', lh: 1.7 }),
    R(100, 1560, 60, 4, WP.yel),
    T('株式会社ミライワークス', 100, 1584, 500, 26, { weight: 700, fill: '#ffffff' }),
  ]),
  pg('サマリー', '#ffffff', () => [
    ...wpHF(2, '要約'),
    ...wpHead('SUMMARY', 'この資料のポイント'),
    ...[
      ['課題を見える化する', '毎月どの作業に何時間かかっているかを\n棚卸しし、自動化の優先順位を決めます。'],
      ['小さく始めて広げる', '全社導入ではなく、一つの業務から試して\n効果を測り、成功パターンを横展開します。'],
      ['運用を仕組みにする', '担当者が変わっても回るよう、手順書と\n見直しの場を最初から用意しておきます。'],
    ].flatMap(([t, b], i) => [
      T('0' + (i + 1), 100, 340 + i * 280, 200, 120, { font: MONT, weight: 900, fill: WP.yel }),
      T(t, 300, 360 + i * 280, 840, 44, { font: ZK, weight: 900, fill: WP.deep }),
      T(b, 300, 430 + i * 280, 840, 26, { weight: 400, fill: WP.ink, lh: 1.75 }),
      R(300, 540 + i * 280, 840, 1, WP.line),
    ]),
    R(100, 1210, 1040, 360, WP.pale, 6),
    T('こんな方におすすめです', 150, 1250, 900, 34, { font: ZK, weight: 900, fill: WP.teal }),
    ...['毎月の締め作業が特定の人に集中している', '紙やメールでの転記作業が多い', '何から自動化すべきか決められずにいる', '導入しても定着しなかった経験がある'].flatMap((t, i) => wpPoint(150, 1320 + i * 56, t)),
  ]),
  pg('目次', '#ffffff', () => [
    R(0, 0, 440, 1754, WP.teal),
    T('CONTENTS', 100, 150, 300, 24, { font: MONT, weight: 700, fill: WP.yel, spacing: 250 }),
    T('目次', 100, 200, 300, 84, { font: ZK, weight: 900, fill: '#ffffff' }),
    T('全4章で、自動化の\n進め方をまとめました。', 100, 330, 320, 24, { weight: 400, fill: '#cfe3e2', lh: 1.8 }),
    ...[['序章', '現場で起きている課題', '04'], ['第1章', '業務時間の実態', '06'], ['第2章', '進め方の4ステップ', '07'], ['第3章', '手段の選び方', '08'], ['第4章', '導入事例', '09'], ['終章', 'まとめと次の一歩', '10']].flatMap(([c, t, p], i) => [
      T(c, 520, 190 + i * 230, 200, 24, { weight: 700, fill: WP.teal }),
      T(t, 520, 232 + i * 230, 520, 38, { font: ZK, weight: 900, fill: WP.deep }),
      T(p, 1040, 232 + i * 230, 100, 34, { font: MONT, weight: 700, fill: WP.mid, align: 'right' }),
      R(520, 316 + i * 230, 620, 1, WP.line),
    ]),
  ]),
  pg('章扉', WP.teal, () => [
    T('00', 60, 160, 900, 500, { font: MONT, weight: 900, fill: 'rgba(255,255,255,0.08)' }),
    R(100, 800, 10, 220, WP.yel),
    T('PROLOGUE', 140, 800, 700, 26, { font: MONT, weight: 700, fill: WP.yel, spacing: 300 }),
    T('現場で起きている\n三つの課題', 140, 860, 1000, 90, { font: ZK, weight: 900, fill: '#ffffff', lh: 1.3 }),
    T(wrap('属人化・転記ミス・締め作業の集中。多くの会社に共通する悩みを整理します。', 22), 140, 1160, 960, 28, { weight: 400, fill: '#cfe3e2', lh: 1.8 }),
  ]),
  pg('本文(2段組)', '#ffffff', () => [
    ...wpHF(5, '序章'),
    ...wpHead('PROLOGUE', '属人化が生む、見えない負担'),
    T(wrap('バックオフィスの仕事は、会社の成長とともに少しずつ増えていきます。その多くは「前任者のやり方」のまま引き継がれ、手順が文書になっていません。', 40), 100, 330, 1040, 28, { weight: 700, fill: WP.ink, lh: 1.8 }),
    T(wrap('特定の担当者だけが知っている作業は、休暇や退職のたびに業務を止めるリスクになります。しかも本人も「忙しい」とは言い出しにくく、負担は外から見えません。\n\nまず必要なのは、誰が・何を・どれくらいの時間で行っているかを一覧にすることです。', 20), 100, 520, 500, 24, { weight: 400, fill: WP.ink, lh: 1.85 }),
    T(wrap('二つ目の課題は、システム間の転記です。メールの注文内容を表計算に写し、さらに会計ソフトへ入力する。この「写す」作業は、時間がかかるうえに入力ミスの温床です。\n\nミスが見つかるのは月末の締め処理の直前になりがちで、そこから修正すると、確認作業が一気に増えてしまいます。', 20), 640, 520, 500, 24, { weight: 400, fill: WP.ink, lh: 1.85 }),
    R(100, 1290, 1040, 260, WP.pale, 6),
    R(100, 1290, 10, 260, WP.yel),
    T('“', 150, 1280, 120, 140, { font: 'Playfair Display', weight: 900, fill: WP.teal }),
    T(wrap('自動化の前に、まず「棚卸し」。見えない仕事は、改善することもできません。', 28), 260, 1350, 840, 32, { font: ZK, weight: 900, fill: WP.deep, lh: 1.6 }),
  ]),
  pg('グラフ', '#ffffff', () => [
    ...wpHF(6, '第1章'),
    ...wpHead('CHAPTER 1', '業務時間の実態'),
    T('部署別の月間事務作業時間(例)', 100, 300, 1040, 28, { weight: 700, fill: WP.ink }),
    makeChart({ type: 'bar', labels: ['経理', '総務', '営業事務', '人事', '物流'], values: [38, 26, 31, 18, 22], colors: [WP.teal], w: 620, h: 380 }).set({ left: 100, top: 360, scaleX: 1.6, scaleY: 1.6 }),
    T('作業の種類別の割合(例)', 100, 1010, 600, 28, { weight: 700, fill: WP.ink }),
    makeChart({ type: 'donut', labels: ['転記・入力', '確認・照合', '問い合わせ', 'その他'], values: [42, 28, 18, 12], colors: [WP.teal, WP.yel, '#7fb0ae', '#c9d6d5'], w: 520, h: 300 }).set({ left: 100, top: 1070, scaleX: 1.2, scaleY: 1.2 }),
    R(790, 1070, 350, 400, WP.pale, 6),
    T('ここがポイント', 820, 1100, 300, 30, { font: ZK, weight: 900, fill: WP.teal }),
    T(wrap('転記と確認で作業の約7割を占めます。ここが自動化の最有力候補です。', 12), 820, 1160, 300, 24, { weight: 400, fill: WP.ink, lh: 1.8 }),
    T('※ 数値はサンプル(例)です。', 100, 1560, 700, 22, { weight: 400, fill: WP.mid }),
  ]),
  pg('4ステップ', WP.pale, () => [
    ...wpHF(7, '第2章'),
    ...wpHead('CHAPTER 2', '進め方の4ステップ'),
    ...[
      ['棚卸し', '1〜2週間', '全ての定型業務を書き出し、頻度と所要時間を記録します。'],
      ['優先順位づけ', '1週間', '「回数が多い」「ミスが多い」業務から候補を3つに絞ります。'],
      ['試行', '1か月', '一つの業務で小さく試し、削減時間とミスの数を測ります。'],
      ['展開と定着', '3か月', '手順書を整え、成功した型を他の業務へ広げます。'],
    ].flatMap(([t, d, b], i) => [
      R(100, 330 + i * 300, 1040, 260, '#ffffff', 6),
      R(100, 330 + i * 300, 160, 260, i === 3 ? WP.yel : WP.teal, 6),
      T('STEP', 100, 400 + i * 300, 160, 22, { font: MONT, weight: 700, fill: i === 3 ? WP.deep : '#cfe3e2', align: 'center', spacing: 200 }),
      T(String(i + 1), 100, 432 + i * 300, 160, 90, { font: MONT, weight: 900, fill: i === 3 ? WP.deep : '#ffffff', align: 'center' }),
      T(t, 300, 370 + i * 300, 560, 42, { font: ZK, weight: 900, fill: WP.deep }),
      T(d, 900, 376 + i * 300, 200, 26, { weight: 700, fill: WP.teal, align: 'right' }),
      T(wrap(b, 25), 300, 450 + i * 300, 800, 26, { weight: 400, fill: WP.ink, lh: 1.75 }),
    ]),
  ]),
  pg('比較表', '#ffffff', () => [
    ...wpHF(8, '第3章'),
    ...wpHead('CHAPTER 3', '手段の選び方'),
    makeTable({ rows: 5, cols: 4, header: WP.teal, border: WP.line, cellW: 260, cellH: 120, fontSize: 26, cells: [
      ['比較項目', '手作業', '表計算+マクロ', '自動化ツール'],
      ['初期費用', 'なし', '低い', '中程度'],
      ['ミスの出にくさ', '低い', '中程度', '高い'],
      ['引き継ぎやすさ', '低い', '低い', '高い'],
      ['向いている規模', '〜5名', '〜30名', '全規模'],
    ] }).set({ left: 100, top: 330 }),
    R(100, 1010, 1040, 520, WP.pale, 6),
    T('選ぶときの3つの視点', 150, 1050, 900, 36, { font: ZK, weight: 900, fill: WP.teal }),
    ...['業務の回数:月に数回なら手作業でも十分です', '担当者の入れ替わり:多いなら、ツール化が有利です', '将来の広がり:対象業務が増える見込みなら、早めの導入を'].flatMap((t, i) => [
      Ci(172, 1156 + i * 120, 22, WP.teal),
      T(String(i + 1), 150, 1138 + i * 120, 44, 28, { font: MONT, weight: 900, fill: '#ffffff', align: 'center' }),
      T(t, 220, 1138 + i * 120, 880, 28, { weight: 500, fill: WP.ink }),
    ]),
  ]),
  pg('導入事例', '#ffffff', () => [
    ...wpHF(9, '第4章'),
    ...wpHead('CHAPTER 4', '導入事例:請求書処理を半分以下に'),
    ...PH(100, 340, 440, 540, 6),
    T('サンプル商事(例)', 600, 340, 540, 26, { weight: 700, fill: WP.mid }),
    T('請求書の処理時間が', 600, 392, 540, 36, { font: ZK, weight: 900, fill: WP.deep }),
    T('62%', 600, 450, 540, 170, { font: MONT, weight: 900, fill: WP.teal }),
    T('減りました', 600, 650, 540, 54, { font: ZK, weight: 900, fill: WP.deep }),
    T(wrap('取引先ごとにばらばらだった請求書の受け取りを一か所に集約し、読み取りから会計ソフトへの登録までを自動化しました。', 21), 600, 740, 540, 24, { weight: 400, fill: WP.ink, lh: 1.8 }),
    ...[['62%', '処理時間の削減'], ['12h', '月あたりの削減'], ['0件', '入力ミス(試行期間中)']].flatMap(([n, l], i) => [
      R(100 + i * 357, 940, 326, 220, WP.pale, 6),
      T(n, 100 + i * 357, 970, 326, 80, { font: MONT, weight: 900, fill: WP.teal, align: 'center' }),
      T(l, 100 + i * 357, 1085, 326, 24, { weight: 700, fill: WP.ink, align: 'center' }),
    ]),
    R(100, 1230, 10, 270, WP.yel),
    T('“', 140, 1210, 100, 120, { font: 'Playfair Display', weight: 900, fill: WP.teal }),
    T(wrap('最初は半信半疑でしたが、月末の残業がなくなったのが一番の変化です。空いた時間で取引先への確認が丁寧にできるようになりました。', 33), 140, 1290, 1000, 28, { weight: 500, fill: WP.ink, lh: 1.8 }),
    T('経理部門 責任者(例)', 140, 1450, 800, 24, { weight: 700, fill: WP.mid }),
    T('※ 数値はサンプル(例)です。', 100, 1560, 700, 22, { weight: 400, fill: WP.mid }),
  ]),
  pg('まとめ', WP.pale, () => [
    ...wpHF(10, '終章'),
    ...wpHead('EPILOGUE', 'まとめと次の一歩'),
    ...['見えない仕事を棚卸しして、数字で把握する', '転記・確認の多い業務から、小さく試す', '手順書と見直しの場で、運用を仕組みにする'].flatMap((t, i) => [
      R(100, 340 + i * 150, 1040, 120, '#ffffff', 6),
      T('POINT ' + (i + 1), 140, 380 + i * 150, 200, 24, { font: MONT, weight: 700, fill: '#a16207', spacing: 150 }),
      T(t, 340, 380 + i * 150, 780, 30, { weight: 700, fill: WP.deep }),
    ]),
    R(100, 830, 1040, 700, WP.teal, 6),
    T('NEXT STEP', 160, 880, 600, 24, { font: MONT, weight: 700, fill: WP.yel, spacing: 300 }),
    T('まずは無料の\n業務診断から', 160, 940, 900, 64, { font: ZK, weight: 900, fill: '#ffffff', lh: 1.35 }),
    T(wrap('現在の業務を30分ほどうかがい、自動化できる候補を3つに絞ってご提案します。', 28), 160, 1160, 900, 28, { weight: 400, fill: '#dcebea', lh: 1.8 }),
    R(160, 1330, 420, 90, WP.yel, 45),
    T('相談を申し込む', 160, 1356, 420, 32, { weight: 900, fill: WP.deep, align: 'center' }),
    T('www.example.com/consult', 620, 1362, 480, 24, { font: MONT, weight: 400, fill: '#dcebea' }),
  ]),
  pg('裏表紙', WP.deep, () => [
    R(100, 150, 10, 150, WP.yel),
    T('株式会社ミライワークス', 140, 150, 900, 40, { font: ZK, weight: 900, fill: '#ffffff' }),
    T('業務設計・自動化支援', 140, 214, 900, 26, { weight: 400, fill: '#b9d0cf' }),
    ...[['TEL', '000-0000-0000'], ['MAIL', 'info@example.com'], ['WEB', 'www.example.com'], ['ADDRESS', '〒000-0000 東京都○○区○○ 1-2-3']].flatMap(([k, v], i) => [
      R(100, 1200 + i * 90, 1040, 1, '#2d5857'),
      T(k, 100, 1228 + i * 90, 220, 22, { font: MONT, weight: 700, fill: WP.yel, spacing: 200 }),
      T(v, 340, 1222 + i * 90, 800, 30, { weight: 500, fill: '#ffffff' }),
    ]),
    T('© 2027 Mirai Works Inc.  掲載内容は例です。', 100, 1600, 1040, 22, { weight: 400, fill: '#7fa09f' }),
  ]),
])

// =====================================================================
// 3. 飲食店のメニューブック(A4 縦 / 深いえんじ + ゴールド / イタリアン)
// =====================================================================
const MN = { wine: '#4a1620', gold: '#b8924a', cream: '#f8f1e4', ink: '#2a1a1a', mid: '#7b6a62', line: '#d9cdb8', dark: '#2b0d13' }
type MenuItem = [name: string, desc: string, price: string]
const mnFrame = (en: string, ja: string, n: number, dark = false): FabricObject[] => [
  R(60, 60, 1120, 1634, dark ? MN.dark : MN.cream, 0, { stroke: MN.gold, strokeWidth: 3 }),
  R(80, 80, 1080, 1594, dark ? MN.dark : MN.cream, 0, { stroke: MN.gold, strokeWidth: 1 }),
  T(en, 100, 170, 1040, 28, { font: MONT, weight: 600, fill: MN.gold, align: 'center', spacing: 500 }),
  T(ja, 100, 220, 1040, 70, { font: MINCHO, weight: 800, fill: dark ? MN.cream : MN.wine, align: 'center', spacing: 200 }),
  R(580, 320, 80, 2, MN.gold),
  T('Trattoria Bella Mare', 100, 1600, 600, 22, { font: 'Playfair Display', weight: 400, fill: MN.mid }),
  T(String(n), 940, 1600, 200, 22, { font: MONT, weight: 600, fill: MN.gold, align: 'right' }),
]
const mnRows = (items: MenuItem[], y0 = 400, step = 190, dark = false): FabricObject[] =>
  items.flatMap(([n, d, p], i) => {
    const y = y0 + i * step
    return [
      T(n, 160, y, 700, 40, { font: MINCHO, weight: 800, fill: dark ? MN.cream : MN.wine }),
      T(d, 160, y + 62, 700, 24, { weight: 400, fill: dark ? '#cdbfa8' : MN.mid, lh: 1.6 }),
      T(p, 900, y + 4, 180, 38, { font: MONT, weight: 600, fill: MN.gold, align: 'right' }),
      R(160, y + step - 38, 920, 1, dark ? '#5a2a33' : MN.line),
    ]
  })
const mnPage = (label: string, en: string, ja: string, n: number, items: MenuItem[], note = '', dark = false) =>
  pg(label, dark ? MN.dark : MN.cream, () => [
    ...mnFrame(en, ja, n, dark),
    ...mnRows(items, 400, items.length > 6 ? 160 : 190, dark),
    ...(note ? [T(note, 160, 1520, 920, 22, { weight: 400, fill: dark ? '#cdbfa8' : MN.mid })] : []),
  ])
const MENU = mkSet('pr-menu', 'メニューブック(イタリアン)', 'メニュー', 1240, 1754,
  ['メニュー', 'レストラン', 'イタリアン', '飲食店', 'ディナー', 'コース', '冊子'], [
  pg('表紙', MN.wine, () => [
    R(70, 70, 1100, 1614, MN.wine, 0, { stroke: MN.gold, strokeWidth: 3 }),
    R(94, 94, 1052, 1566, MN.wine, 0, { stroke: MN.gold, strokeWidth: 1 }),
    S('star5', 560, 360, 120, MN.gold),
    T('Trattoria', 100, 600, 1040, 70, { font: 'Playfair Display', weight: 400, fill: MN.gold, align: 'center', spacing: 300 }),
    T('Bella Mare', 100, 700, 1040, 160, { font: 'Playfair Display', weight: 700, fill: MN.cream, align: 'center' }),
    R(560, 940, 120, 2, MN.gold),
    T('海辺のトラットリア', 100, 990, 1040, 44, { font: MINCHO, weight: 800, fill: MN.cream, align: 'center', spacing: 300 }),
    T('MENU', 100, 1380, 1040, 36, { font: MONT, weight: 600, fill: MN.gold, align: 'center', spacing: 800 }),
  ]),
  pg('ごあいさつ', MN.cream, () => [
    ...mnFrame('WELCOME', 'ごあいさつ', 2),
    ...PH(160, 400, 920, 500, 0, '#e4d9c3'),
    T(wrap('当店は、毎朝港で仕入れる魚介と、契約農家の野菜を中心に、シンプルなイタリアンをお出ししています。素材の味を引き出すことを何より大切にしました。ゆっくりと、お食事をお楽しみください。', 33), 160, 960, 940, 30, { font: MINCHO, weight: 500, fill: MN.ink, lh: 2.0 }),
    ...[['産地直送', '毎朝の仕入れ'], ['自家製パスタ', '毎日手打ち'], ['薪窯ピッツァ', '450度で焼成']].flatMap(([a, b], i) => [
      R(160 + i * 320, 1300, 280, 200, MN.cream, 0, { stroke: MN.gold, strokeWidth: 1 }),
      T(a, 160 + i * 320, 1345, 280, 32, { font: MINCHO, weight: 800, fill: MN.wine, align: 'center' }),
      T(b, 160 + i * 320, 1410, 280, 22, { weight: 400, fill: MN.mid, align: 'center' }),
    ]),
  ]),
  mnPage('前菜', 'ANTIPASTI', '前菜', 3, [
    ['本日の前菜盛り合わせ', '旬の魚介と野菜を5種盛りにして', '1,800'],
    ['真鯛のカルパッチョ', 'レモンとオリーブオイル、ハーブ', '1,400'],
    ['生ハムとモッツァレラ', '24か月熟成のプロシュート', '1,600'],
    ['ブラータチーズのサラダ', '完熟トマトとバジルソース', '1,500'],
    ['しらすとキャベツのフリット', '軽い衣でさっくりと', '1,100'],
  ], '価格は税込です。アレルギーはスタッフへお尋ねください。'),
  mnPage('パスタ', 'PASTA', 'パスタ', 4, [
    ['トマトとバジルのスパゲッティ', 'シンプルな定番の一皿', '1,500'],
    ['ボンゴレ・ビアンコ', 'アサリの旨みを白ワインで', '1,800'],
    ['カルボナーラ', '黒胡椒の効いた濃厚ソース', '1,700'],
    ['ウニのクリームタリオリーニ', '手打ち麺に濃厚ソースを絡めて', '2,400'],
    ['猪肉のラグー パッパルデッレ', '8時間煮込んだ自家製ソース', '2,100'],
    ['季節野菜のペペロンチーノ', '香味野菜とにんにくのオイル', '1,600'],
  ]),
  mnPage('ピッツァ', 'PIZZA', 'ピッツァ', 5, [
    ['マルゲリータ', 'トマト・モッツァレラ・バジル', '1,600'],
    ['クアトロフォルマッジ', '4種のチーズとはちみつ', '1,900'],
    ['ビスマルク', '半熟卵とベーコン、ほうれん草', '1,800'],
    ['シラスとルッコラ', '釜揚げしらすをのせて', '1,800'],
    ['ほたてと柚子胡椒', '白ソースが香る一枚', '2,000'],
  ], 'ハーフ&ハーフもお受けします(+300円)。'),
  mnPage('肉料理', 'CARNE', 'お肉料理', 6, [
    ['国産牛の炭火焼き', '赤身の旨みをシンプルな塩で', '3,800'],
    ['仔羊のロースト', 'ローズマリーとガーリックの香り', '3,200'],
    ['豚肩ロースの煮込み', '赤ワインで柔らかく煮て', '2,400'],
    ['ミラノ風カツレツ', '仔牛を薄く叩いて揚げ焼きに', '2,800'],
  ]),
  mnPage('魚料理', 'PESCE', 'お魚料理', 7, [
    ['本日の鮮魚のアクアパッツァ', '丸ごと一尾をトマトと貝の出汁で', '3,400'],
    ['天然鯛のポワレ', 'ケッパーとレモンのバターソース', '2,800'],
    ['甲殻類のグリル', 'エビ・ホタテ・イカの盛り合わせ', '3,200'],
    ['サバのマリネ', '自家製ピクルスと', '1,600'],
  ]),
  mnPage('デザート', 'DOLCI', 'デザート', 8, [
    ['ティラミス', '濃いエスプレッソとマスカルポーネ', '900'],
    ['パンナコッタ', 'ミルクの風味と季節のソース', '800'],
    ['ジェラート3種盛り', '日替わりのフレーバーから', '900'],
    ['焼きたてチーズケーキ', 'バニラビーンズ入りの濃厚生地', '950'],
    ['アフォガート', 'エスプレッソをかけて', '850'],
  ]),
  mnPage('ドリンク', 'DRINK', 'ドリンク', 9, [
    ['グラスワイン 赤・白', '日替わり 3種よりお選びください', '900〜'],
    ['ボトルワイン', 'イタリア産を中心に20種', '4,500〜'],
    ['クラフトビール', '地元のブルワリー直送', '850'],
    ['自家製レモンチェッロ', '食後のお供に', '700'],
    ['エスプレッソ', '深煎りのブレンド', '450'],
    ['ノンアルコールスパークリング', 'ぶどうの果汁とハーブ', '650'],
  ]),
  pg('コース', MN.dark, () => [
    ...mnFrame('COURSE', 'おまかせコース', 10, true),
    T('Cena Bella', 100, 400, 1040, 80, { font: 'Playfair Display', weight: 700, fill: MN.gold, align: 'center' }),
    T('6,800', 100, 520, 1040, 140, { font: MONT, weight: 600, fill: MN.cream, align: 'center' }),
    T('円(税込)/ お一人様', 100, 690, 1040, 28, { weight: 400, fill: '#cdbfa8', align: 'center' }),
    ...['前菜 3種盛り合わせ', '本日のパスタ', '鮮魚または肉料理', 'デザートとコーヒー'].flatMap((t, i) => [
      T('0' + (i + 1), 300, 800 + i * 150, 100, 40, { font: MONT, weight: 600, fill: MN.gold }),
      T(t, 420, 802 + i * 150, 600, 38, { font: MINCHO, weight: 800, fill: MN.cream }),
      R(300, 880 + i * 150, 640, 1, '#5a2a33'),
    ]),
    T('2名様より、前日までのご予約で承ります。', 100, 1450, 1040, 24, { weight: 400, fill: '#cdbfa8', align: 'center' }),
  ]),
  pg('店舗情報', MN.cream, () => [
    ...mnFrame('INFORMATION', '店舗のご案内', 11),
    ...PH(160, 400, 920, 420, 0, '#e4d9c3'),
    ...[['住所', '〇〇県〇〇市港町1-2-3'], ['電話', '00-0000-0000'], ['営業', '11:30〜15:00 / 17:30〜22:00'], ['定休日', '毎週水曜日'], ['席数', '36席(個室1室)']].flatMap(([a, b], i) => [
      T(a, 160, 880 + i * 110, 200, 30, { weight: 700, fill: MN.gold }),
      T(b, 360, 878 + i * 110, 720, 32, { font: MINCHO, weight: 700, fill: MN.ink }),
      R(160, 940 + i * 110, 920, 1, MN.line),
    ]),
  ]),
])

// =====================================================================
// 4. 月次レポート(A4 縦 / ホワイト + インディゴ / グラフ・表)
// =====================================================================
const MR = { ind: '#3730a3', deep: '#1e1b4b', sky: '#e0e7ff', pale: '#f5f6fc', ink: '#1b1d33', mid: '#6b6f8d', line: '#d9dcee', ora: '#f97316', grn: '#10b981' }
const putG = <G extends { set: (o: any) => any }>(g: G, x: number, y: number, s = 1): G => { g.set({ left: x, top: y, scaleX: s, scaleY: s }); return g }
const mrHF = (n: number, sec: string): FabricObject[] => [
  R(0, 0, 1240, 14, MR.ind),
  T('MONTHLY REPORT  2027.03', 100, 62, 600, 22, { font: MONT, weight: 700, fill: MR.ind, spacing: 200 }),
  T(sec, 640, 62, 500, 22, { weight: 500, fill: MR.mid, align: 'right' }),
  R(100, 1620, 1040, 1, MR.line),
  T('株式会社サンプル 営業企画部', 100, 1640, 600, 22, { weight: 500, fill: MR.mid }),
  T(String(n), 1040, 1640, 100, 26, { font: MONT, weight: 700, fill: MR.ind, align: 'right' }),
]
const mrHead = (t: string, lead = '', y = 130): FabricObject[] => [
  T(t, 100, y, 1040, 56, { font: ZK, weight: 900, fill: MR.deep }),
  R(100, y + 80, 60, 5, MR.ora),
  ...(lead ? [T(lead, 100, y + 112, 1040, 26, { weight: 400, fill: MR.mid, lh: 1.7 })] : []),
]
const kpi = (x: number, y: number, w: number, label: string, v: string, d: string, up = true): FabricObject[] => [
  R(x, y, w, 220, MR.pale, 10),
  R(x, y, 8, 220, up ? MR.grn : MR.ora),
  T(label, x + 34, y + 26, w - 60, 24, { weight: 700, fill: MR.mid }),
  T(v, x + 34, y + 70, w - 60, 72, { font: MONT, weight: 800, fill: MR.deep }),
  T(d, x + 34, y + 164, w - 60, 24, { weight: 700, fill: up ? '#059669' : '#ea580c' }),
]
const REPORT = mkSet('pr-report', '月次レポート(売上・集客)', 'ドキュメント', 1240, 1754,
  ['月次レポート', '報告書', 'グラフ', '表', '売上', 'KPI', 'ビジネス'], [
  pg('表紙', MR.deep, () => [
    R(100, 150, 90, 8, MR.ora),
    T('MONTHLY REPORT', 100, 190, 800, 28, { font: MONT, weight: 700, fill: '#a5b0f0', spacing: 400 }),
    T('2027年3月度\n営業・集客レポート', 100, 330, 1040, 88, { font: ZK, weight: 900, fill: '#ffffff', lh: 1.35 }),
    T('対象期間:2027年3月1日〜3月31日', 100, 640, 900, 30, { weight: 500, fill: '#c9d0f5' }),
    putG(makeChart({ type: 'bar', labels: ['1月', '2月', '3月'], values: [62, 71, 88], colors: ['#818cf8', '#818cf8', '#f97316'], w: 600, h: 400 }), 160, 840, 1.5),
    T('株式会社サンプル  営業企画部', 100, 1600, 700, 26, { weight: 500, fill: '#c9d0f5' }),
  ]),
  pg('サマリー', '#ffffff', () => [
    ...mrHF(2, 'サマリー'),
    ...mrHead('今月のハイライト', '売上・新規顧客・Webからの問い合わせはいずれも前月を上回りました。'),
    ...kpi(100, 400, 500, '売上', '8,820万円', '前月比 +24%'),
    ...kpi(640, 400, 500, '新規顧客数', '146件', '前月比 +18%'),
    ...kpi(100, 660, 500, '客単価', '6.0万円', '前月比 +5%'),
    ...kpi(640, 660, 500, 'Web問い合わせ', '312件', '前月比 -4%', false),
    R(100, 960, 1040, 560, MR.pale, 10),
    T('今月のトピック', 140, 1000, 900, 32, { font: ZK, weight: 900, fill: MR.ind }),
    ...['春の新商品が発売3週間で目標の118%を達成', '展示会の来場者フォローで商談化率が12%に改善', '広告費は予算内に収まり、獲得単価が前月より低下', 'Web問い合わせはキャンペーン終了の影響で微減'].flatMap((t, i) => [
      Ci(150, 1090 + i * 100, 8, MR.ora), T(t, 180, 1074 + i * 100, 920, 28, { weight: 500, fill: MR.ink }),
    ]),
  ]),
  pg('売上推移', '#ffffff', () => [
    ...mrHF(3, '売上'),
    ...mrHead('売上の推移', '直近6か月の月次売上です。3月は過去最高を更新しました。'),
    putG(makeChart({ type: 'bar', labels: ['10月', '11月', '12月', '1月', '2月', '3月'], values: [58, 64, 79, 62, 71, 88], colors: [MR.ind], w: 680, h: 430, title: '月次売上(百万円)' }), 130, 400, 1.35),
    R(100, 1100, 1040, 2, MR.line),
    ...[['最高月', '3月  88百万円'], ['6か月平均', '70.3百万円'], ['年度累計', '421百万円']].flatMap(([a, b], i) => [
      T(a, 100 + i * 350, 1140, 330, 26, { weight: 700, fill: MR.mid }),
      T(b, 100 + i * 350, 1190, 340, 34, { font: ZK, weight: 900, fill: MR.deep }),
    ]),
    T('12月の繁忙期に次ぐ水準で、新商品と法人向け大型案件が押し上げました。', 100, 1330, 1040, 28, { weight: 400, fill: MR.ink, lh: 1.8 }),
  ]),
  pg('商品別売上', '#ffffff', () => [
    ...mrHF(4, '商品別'),
    ...mrHead('商品カテゴリ別の売上'),
    putG(makeChart({ type: 'donut', labels: ['A 定番', 'B 新商品', 'C 法人', 'D その他'], values: [38, 27, 24, 11], colors: [MR.ind, MR.ora, MR.grn, '#cbd5e1'], w: 560, h: 420 }), 100, 330, 1.2),
    ...[['定番(A)', '38%'], ['新商品(B)', '27%'], ['法人(C)', '24%']].flatMap(([a, b], i) => [
      T(a, 800, 400 + i * 120, 340, 26, { weight: 700, fill: MR.mid }),
      T(b, 800, 440 + i * 120, 340, 54, { font: MONT, weight: 800, fill: MR.deep }),
    ]),
    putG(makeTable({ rows: 5, cols: 4, header: MR.ind, border: MR.line, cellW: 260, cellH: 90, fontSize: 24, cells: [['カテゴリ', '売上(百万円)', '前月比', '目標達成率'], ['A 定番', '33.5', '+4%', '102%'], ['B 新商品', '23.8', '新規', '118%'], ['C 法人', '21.2', '+31%', '96%'], ['D その他', '9.7', '-6%', '88%']] }), 100, 1000, 1),
    T('※ 目標達成率は月次予算に対する比率です。', 100, 1500, 1040, 22, { weight: 400, fill: MR.mid }),
  ]),
  pg('チャネル別', '#ffffff', () => [
    ...mrHF(5, 'チャネル'),
    ...mrHead('集客チャネル別の成果', '問い合わせ件数と、そこから成約した件数の比較です。'),
    putG(makeChart({ type: 'hbar', labels: ['自然検索', '広告', 'SNS', 'メール', '紹介', '展示会'], values: [96, 82, 54, 40, 22, 18], colors: [MR.ind], w: 640, h: 450, title: '問い合わせ件数' }), 100, 380, 1.5),
    R(100, 1130, 1040, 400, MR.pale, 10),
    T('読み取り', 140, 1165, 400, 28, { font: ZK, weight: 900, fill: MR.ind }),
    T(wrap('自然検索と広告で全体の57%を占めています。紹介と展示会は件数こそ少ないものの、成約率が高く(紹介38%・展示会31%)、案件単価の押し上げに貢献しています。来月は紹介の仕組みづくりを強化します。', 36), 140, 1225, 980, 28, { weight: 400, fill: MR.ink, lh: 1.85 }),
  ]),
  pg('Webアクセス', '#ffffff', () => [
    ...mrHF(6, 'Web'),
    ...mrHead('Webサイトのアクセス状況'),
    putG(makeChart({ type: 'line', labels: ['1週', '2週', '3週', '4週', '5週'], values: [11.2, 12.8, 14.1, 13.5, 12.4], colors: [MR.ora], w: 620, h: 400, title: '週別訪問数(千)' }), 130, 330, 1.4),
    ...kpi(100, 960, 330, '訪問数', '6.4万', '+9%'),
    ...kpi(455, 960, 330, '直帰率', '41%', '+2pt', false),
    ...kpi(810, 960, 330, '転換率', '2.1%', '+0.3pt'),
    T('第3週のメール配信日にアクセスが最大となりました。施策後の持続が課題です。', 100, 1250, 1040, 28, { weight: 400, fill: MR.ink, lh: 1.8 }),
  ]),
  pg('課題と対策', '#ffffff', () => [
    ...mrHF(7, '課題と対策'),
    ...mrHead('見えてきた課題と対策'),
    ...[['課題 1', 'Web問い合わせの減少', 'キャンペーン終了後に件数が落ち込む傾向。常設の資料請求導線を追加する。'], ['課題 2', '法人案件の目標未達(96%)', '大型案件の受注が来月にずれ込み。提案書のレビュー体制を見直す。'], ['課題 3', 'その他カテゴリの伸び悩み', '主力3カテゴリに集中し、販売方針を再検討する。']].flatMap(([a, b, c], i) => [
      R(100, 330 + i * 380, 1040, 340, MR.pale, 10),
      T(a, 140, 365 + i * 380, 300, 24, { font: ZK, weight: 900, fill: MR.ora, spacing: 100 }),
      T(b, 140, 415 + i * 380, 960, 40, { font: ZK, weight: 900, fill: MR.deep }),
      T('対策', 140, 505 + i * 380, 120, 24, { weight: 700, fill: MR.ind }),
      T(wrap(c, 33), 140, 545 + i * 380, 960, 26, { weight: 400, fill: MR.ink, lh: 1.7 }),
    ]),
  ]),
  pg('来月の計画', '#ffffff', () => [
    ...mrHF(8, '計画'),
    ...mrHead('4月の計画と目標'),
    makeTable({ rows: 6, cols: 3, header: MR.ind, border: MR.line, cellW: 346, cellH: 100, fontSize: 26, cells: [['指標', '3月実績', '4月目標'], ['売上', '88.2百万円', '92.0百万円'], ['新規顧客', '146件', '160件'], ['Web問い合わせ', '312件', '340件'], ['成約率', '23%', '25%'], ['広告費', '4.1百万円', '4.2百万円']] }).set({ left: 100, top: 330 }),
    T('主な施策', 100, 1010, 600, 32, { font: ZK, weight: 900, fill: MR.ind }),
    ...['資料請求ページの改善とABテストの実施', '紹介キャンペーンの開始(4/10)', '既存顧客向けのメール配信を月2回に増やす'].flatMap((t, i) => [
      T(String(i + 1), 100, 1080 + i * 100, 60, 44, { font: MONT, weight: 800, fill: MR.ora }),
      T(t, 170, 1086 + i * 100, 960, 30, { weight: 500, fill: MR.ink }),
      R(100, 1146 + i * 100, 1040, 1, MR.line),
    ]),
  ]),
  pg('担当別実績', '#ffffff', () => [
    ...mrHF(9, '担当別'),
    ...mrHead('担当者別の実績', '個人の評価ではなく、案件の配分の確認に使います。'),
    putG(makeChart({ type: 'bar', labels: ['A', 'B', 'C', 'D', 'E'], values: [21, 19, 17, 16, 15], colors: ['#818cf8'], w: 560, h: 380, title: '成約件数' }), 130, 400, 1.5),
    putG(makeTable({ rows: 6, cols: 3, header: MR.deep, border: MR.line, cellW: 346, cellH: 84, fontSize: 24, cells: [['担当', '売上(百万円)', '成約率'], ['A', '21.4', '28%'], ['B', '19.0', '24%'], ['C', '17.2', '22%'], ['D', '16.1', '21%'], ['E', '14.5', '20%']] }), 100, 1020, 1),
  ]),
  pg('用語・集計条件', MR.pale, () => [
    ...mrHF(10, '付録'),
    ...mrHead('用語と集計条件'),
    ...[['売上', '請求書の発行日が当月に含まれるものを計上。税抜。'], ['新規顧客', '過去12か月に取引のない顧客の初回取引。'], ['転換率', '訪問数に対する問い合わせ・資料請求の割合。'], ['成約率', '商談数に対する成約件数の割合。'], ['前月比', '前月の確定値との差。速報値は含みません。']].flatMap(([a, b], i) => [
      T(a, 100, 340 + i * 190, 260, 32, { font: ZK, weight: 900, fill: MR.ind }),
      T(wrap(b, 28), 380, 342 + i * 190, 760, 28, { weight: 400, fill: MR.ink, lh: 1.7 }),
      R(100, 450 + i * 190, 1040, 1, MR.line),
    ]),
    T('お問い合わせ:営業企画部 report@example.com', 100, 1500, 1040, 24, { weight: 500, fill: MR.mid }),
  ]),
])

// =====================================================================
// 5. 業務マニュアル(A4 縦 / グリーン + 白 / 手順・注意書き)
// =====================================================================
const MA = { grn: '#1f7a4d', deep: '#12482e', pale: '#eaf5ee', ink: '#1d2a23', mid: '#667a6f', line: '#cfdfd5', warn: '#d97706', warnBg: '#fff4e0', red: '#c2410c' }
const maHF = (n: number, sec: string): FabricObject[] => [
  R(0, 0, 1240, 110, MA.grn),
  T('受付・出荷業務マニュアル', 100, 36, 700, 30, { weight: 700, fill: '#ffffff' }),
  T(sec, 640, 40, 500, 24, { weight: 500, fill: '#cfeedd', align: 'right' }),
  R(100, 1620, 1040, 1, MA.line),
  T('第3版  2027年4月改訂', 100, 1640, 500, 22, { weight: 500, fill: MA.mid }),
  T(String(n), 1040, 1640, 100, 26, { font: MONT, weight: 700, fill: MA.grn, align: 'right' }),
]
const maTitle = (no: string, t: string, y = 170): FabricObject[] => [
  T(no, 100, y, 140, 60, { font: MONT, weight: 800, fill: MA.grn }),
  T(t, 240, y + 4, 900, 52, { font: ZK, weight: 900, fill: MA.deep }),
  R(100, y + 90, 1040, 3, MA.grn),
]
const maStep = (n: number, y: number, t: string, d: string, h = 180): FabricObject[] => [
  Ci(150, y + 50, 40, MA.grn),
  T(String(n), 110, y + 28, 80, 46, { font: MONT, weight: 800, fill: '#ffffff', align: 'center' }),
  R(150, y + 94, 3, h - 100, MA.line),
  T(t, 230, y + 24, 880, 36, { font: ZK, weight: 900, fill: MA.deep }),
  T(wrap(d, 33), 230, y + 78, 910, 26, { weight: 400, fill: MA.ink, lh: 1.7 }),
]
const maNote = (y: number, kind: string, t: string, h = 150, c = MA.warn, bg = MA.warnBg): FabricObject[] => [
  R(100, y, 1040, h, bg, 8), R(100, y, 8, h, c),
  T(kind, 140, y + 24, 200, 26, { font: ZK, weight: 900, fill: c }),
  T(wrap(t, 34), 140, y + 66, 960, 26, { weight: 500, fill: MA.ink, lh: 1.6 }),
]
const MANUAL = mkSet('pr-manual', '業務マニュアル(受付・出荷)', 'ドキュメント', 1240, 1754,
  ['業務マニュアル', '手順書', 'SOP', '研修', '新人教育', '社内資料'], [
  pg('表紙', MA.grn, () => [
    R(0, 1100, 1240, 654, MA.deep),
    R(100, 220, 90, 8, '#a7f3c6'),
    T('OPERATION MANUAL', 100, 260, 800, 28, { font: MONT, weight: 700, fill: '#a7f3c6', spacing: 400 }),
    T('受付・出荷\n業務マニュアル', 100, 380, 1040, 110, { font: ZK, weight: 900, fill: '#ffffff', lh: 1.3 }),
    T('新入社員・パートスタッフ向け\n第3版', 100, 760, 900, 32, { weight: 500, fill: '#d4f1e0', lh: 1.8 }),
    T('このマニュアルは社外秘です。持ち出しや複製はできません。', 100, 1240, 1040, 24, { weight: 400, fill: '#a7c9b6' }),
    T('株式会社サンプル物流  業務推進部', 100, 1600, 700, 26, { weight: 500, fill: '#d4f1e0' }),
  ]),
  pg('目次', '#ffffff', () => [
    ...maHF(2, '目次'),
    ...maTitle('', '目次'),
    ...[['1', '業務の全体像', '3'], ['2', '注文の受付', '4'], ['3', '在庫の確認と引当', '5'], ['4', 'ピッキングと検品', '6'], ['5', '梱包と出荷', '7'], ['6', '返品・交換の対応', '8'], ['7', 'トラブル時の連絡先', '9'], ['8', 'よくある質問', '10']].flatMap(([n, t, p], i) => [
      T(n.padStart(2, '0'), 100, 330 + i * 150, 120, 44, { font: MONT, weight: 800, fill: MA.grn }),
      T(t, 240, 334 + i * 150, 700, 40, { font: ZK, weight: 700, fill: MA.ink }),
      T(p, 980, 336 + i * 150, 160, 36, { font: MONT, weight: 600, fill: MA.mid, align: 'right' }),
      R(100, 410 + i * 150, 1040, 1, MA.line),
    ]),
  ]),
  pg('全体像', '#ffffff', () => [
    ...maHF(3, '1 業務の全体像'),
    ...maTitle('01', '業務の全体像'),
    T(wrap('注文を受けてからお客様に商品が届くまでの流れは、次の5つの工程に分かれます。各工程の担当者と目安時間を確認してください。', 36), 100, 300, 1040, 28, { weight: 400, fill: MA.ink, lh: 1.8 }),
    ...[['受付', '事務'], ['引当', '事務'], ['ピッキング', '倉庫'], ['検品', '倉庫'], ['出荷', '倉庫']].flatMap(([a, b], i) => [
      R(100 + i * 212, 500, 190, 200, i % 2 ? MA.pale : MA.grn, 10),
      T(a, 100 + i * 212, 560, 190, 30, { font: ZK, weight: 900, fill: i % 2 ? MA.deep : '#ffffff', align: 'center' }),
      T(b, 100 + i * 212, 630, 190, 24, { weight: 500, fill: i % 2 ? MA.mid : '#cfeedd', align: 'center' }),
    ]),
    T('受付から出荷まで 目安:当日 15:00 までの注文は当日出荷', 100, 760, 1040, 26, { weight: 700, fill: MA.grn }),
    ...maNote(900, '大切なこと', '遅延の原因の多くは、受付時点の入力ミスです。氏名・住所・商品コードは必ず二人で確認します。', 170, MA.grn, MA.pale),
    ...PH(100, 1130, 1040, 400, 8, '#e1ebe5'),
  ]),
  pg('手順1 受付', '#ffffff', () => [
    ...maHF(4, '2 注文の受付'),
    ...maTitle('02', '注文の受付'),
    ...maStep(1, 300, '注文メールを開く', '受信箱の「新着注文」フォルダを確認します。1時間に1回は必ず見てください。'),
    ...maStep(2, 480, '内容を管理画面に入力する', '注文番号・氏名・住所・商品コード・数量を、注文メールを見ながら入力します。'),
    ...maStep(3, 660, '入力内容を読み上げ確認する', '担当者が入力した内容を、もう一人が声に出して読み上げて照合します。'),
    ...maStep(4, 840, '受付完了メールを送る', '管理画面の「受付完了」ボタンを押すと、お客様に自動送信されます。', 120),
    ...maNote(1030, '注意', '同じ注文が二重に届くことがあります。注文番号が同じ場合は、入力せず上長に知らせてください。', 160),
    ...PH(100, 1250, 1040, 300, 8, '#e1ebe5'),
  ]),
  pg('手順2 在庫', '#ffffff', () => [
    ...maHF(5, '3 在庫の確認と引当'),
    ...maTitle('03', '在庫の確認と引当'),
    ...maStep(1, 300, '在庫数を確認する', '管理画面の「在庫一覧」で、商品コードを検索して現在庫を確認します。'),
    ...maStep(2, 480, '在庫がある場合は引当する', '「引当」ボタンを押すと、その数量が他の注文に使われなくなります。'),
    ...maStep(3, 660, '在庫が足りない場合は連絡する', '不足数と入荷予定日を確認し、お客様へ案内メールを送ります。テンプレートを使います。', 200),
    makeTable({ rows: 4, cols: 3, header: MA.grn, border: MA.line, cellW: 346, cellH: 90, fontSize: 24, cells: [['状況', '対応', '期限'], ['在庫あり', '引当して出荷準備', '当日'], ['一部不足', '分納の可否を確認', '当日中'], ['在庫なし', '入荷予定を案内', '翌営業日']] }).set({ left: 100, top: 920 }),
    ...maNote(1330, '注意', '在庫数は毎朝9時にまとめて更新されます。午前中の数字は前日夜のものである点に注意してください。', 170),
  ]),
  pg('手順3 ピッキング', '#ffffff', () => [
    ...maHF(6, '4 ピッキングと検品'),
    ...maTitle('04', 'ピッキングと検品'),
    ...PH(100, 300, 500, 380, 8, '#e1ebe5'),
    T('ピッキングリスト', 660, 300, 480, 32, { font: ZK, weight: 900, fill: MA.deep }),
    T(wrap('印刷したリストを持ち、棚番号の順に回ります。同じ棚の商品はまとめて取ります。', 17), 660, 360, 480, 26, { weight: 400, fill: MA.ink, lh: 1.7 }),
    ...maStep(1, 740, '商品を取り、バーコードを読み取る', 'ハンディ端末で商品のバーコードを読むと、リストが「済」になります。'),
    ...maStep(2, 920, '数量と状態を目で確認する', '外箱の破れ・汚れがないか確認します。あれば同じ商品の別のものに交換します。'),
    ...maStep(3, 1100, '検品台に運ぶ', 'カゴに入れて検品台へ。1注文につき1つのカゴを使い、他の注文と混ぜません。', 120),
    ...maNote(1290, '禁止', '商品を床に直接置いたり、段ボールの上に重ねて運んだりしてはいけません。', 140, MA.red, '#fdeee8'),
  ]),
  pg('手順4 梱包', '#ffffff', () => [
    ...maHF(7, '5 梱包と出荷'),
    ...maTitle('05', '梱包と出荷'),
    ...[['小物', 'S箱', '緩衝材は不要'], ['衣類', 'M箱', 'ビニール袋に入れる'], ['割れ物', 'L箱', '緩衝材で全面を包む']].flatMap(([a, b, c], i) => [
      R(100 + i * 360, 300, 320, 320, MA.pale, 10),
      T(a, 100 + i * 360, 340, 320, 36, { font: ZK, weight: 900, fill: MA.deep, align: 'center' }),
      T(b, 100 + i * 360, 410, 320, 70, { font: MONT, weight: 800, fill: MA.grn, align: 'center' }),
      T(c, 110 + i * 360, 530, 300, 24, { weight: 500, fill: MA.mid, align: 'center' }),
    ]),
    ...maStep(1, 680, '納品書を同封する', '納品書は商品の上、箱を開けて最初に見える位置に置きます。', 170),
    ...maStep(2, 850, '送り状を貼る', '送り状は箱の最も広い面の中央に、浮きやしわのないように貼ります。', 170),
    ...maStep(3, 1020, '配送業者ごとの棚に置く', '集荷時間は 15:00(A社)/ 17:00(B社)です。置き場を間違えないこと。', 150),
    ...maNote(1230, 'POINT', '送り状の宛先は、梱包の前に注文画面ともう一度照らし合わせます。', 140, MA.grn, MA.pale),
  ]),
  pg('返品対応', '#ffffff', () => [
    ...maHF(8, '6 返品・交換'),
    ...maTitle('06', '返品・交換の対応'),
    T('返品を受けられる条件', 100, 300, 800, 36, { font: ZK, weight: 900, fill: MA.deep }),
    ...['商品到着から7日以内の申し出であること', '未開封、または初期不良であること', '納品書または注文番号が分かること'].flatMap((t, i) => [
      S('check', 100, 376 + i * 90, 44, MA.grn),
      T(t, 170, 380 + i * 90, 960, 30, { weight: 500, fill: MA.ink }),
    ]),
    T('対応の流れ', 100, 700, 800, 36, { font: ZK, weight: 900, fill: MA.deep }),
    ...['申し出を受け、条件に合うか確認する', '返送先と返送方法をメールで案内する', '返品が届いたら状態を確認し、返金手続きへ'].flatMap((t, i) => [
      R(100, 780 + i * 150, 1040, 120, i === 2 ? MA.grn : MA.pale, 10),
      T('STEP ' + (i + 1), 140, 818 + i * 150, 180, 26, { font: MONT, weight: 800, fill: i === 2 ? '#a7f3c6' : MA.grn }),
      T(t, 330, 815 + i * 150, 780, 30, { weight: 700, fill: i === 2 ? '#ffffff' : MA.ink }),
    ]),
    ...maNote(1260, '注意', 'お客様の都合による返送費用は、原則お客様のご負担です。ただし初期不良は当社負担です。迷ったら必ず上長へ。', 190),
  ]),
  pg('連絡先', '#ffffff', () => [
    ...maHF(9, '7 トラブル時の連絡先'),
    ...maTitle('07', 'トラブル時の連絡先'),
    T('困ったときは、自分で判断せず、次の順に連絡します。', 100, 300, 1040, 28, { weight: 500, fill: MA.ink }),
    makeTable({ rows: 6, cols: 3, header: MA.grn, border: MA.line, cellW: 346, cellH: 110, fontSize: 24, cells: [['状況', '連絡先', '内線'], ['システムが動かない', '情報システム', '201'], ['商品が破損していた', '倉庫リーダー', '305'], ['お客様からのクレーム', '営業課長', '112'], ['配送の遅れ', '配送担当', '308'], ['けが・体調不良', '総務', '101']] }).set({ left: 100, top: 380 }),
    ...maNote(1100, '緊急', '火災・地震などの非常時は、まず身の安全を確保し、館内放送の指示に従ってください。', 170, MA.red, '#fdeee8'),
    ...PH(100, 1330, 1040, 220, 8, '#e1ebe5'),
  ]),
  pg('よくある質問', MA.pale, () => [
    ...maHF(10, '8 よくある質問'),
    ...maTitle('08', 'よくある質問'),
    ...[['Q. 注文が午後3時を過ぎてしまったら?', 'A. 翌営業日の出荷になります。お客様には受付完了メールで出荷予定日を案内します。'], ['Q. 住所の入力を間違えてしまった', 'A. 出荷前なら管理画面で修正できます。出荷後は、すぐに上長へ連絡してください。'], ['Q. 同じ商品が二重に届いたら?', 'A. 注文番号が同じなら重複です。入力せず、上長に確認します。'], ['Q. 在庫の数字が実物と合わない', 'A. 倉庫リーダーに伝え、棚卸しを依頼します。自分で数字を直さないでください。']].flatMap(([q, a], i) => [
      R(100, 300 + i * 290, 1040, 260, '#ffffff', 10),
      T(wrap(q, 32), 140, 335 + i * 290, 960, 30, { font: ZK, weight: 900, fill: MA.deep }),
      T(wrap(a, 34), 140, 410 + i * 290, 960, 26, { weight: 400, fill: MA.ink, lh: 1.7 }),
    ]),
  ]),
])

// =====================================================================
// 6. 季節のチラシ連作 10 枚(A4 縦 / 洋菓子店の年間キャンペーン)
// =====================================================================
const DELA = 'Dela Gothic One'
const flFoot = (bg: string, fg: string, sub = fg): FabricObject[] => [
  R(0, 1534, 1240, 220, bg),
  T('パティスリー ハルノ', 80, 1572, 620, 44, { font: MINCHO, weight: 800, fill: fg }),
  T('〇〇市緑町1-2-3  TEL 00-0000-0000\n営業 10:00〜19:00 / 水曜定休', 80, 1640, 700, 24, { weight: 500, fill: sub, lh: 1.6 }),
  R(860, 1580, 300, 120, 'rgba(255,255,255,0.18)', 10),
  T('ご予約・\nお問い合わせ', 860, 1604, 300, 28, { weight: 700, fill: fg, align: 'center', lh: 1.4 }),
]
const flTag = (t: string, x: number, y: number, bg: string, fg: string, w = 300): FabricObject[] => [
  R(x, y, w, 64, bg, 32), T(t, x, y + 14, w, 30, { font: MONT, weight: 800, fill: fg, align: 'center', spacing: 200 }),
]
const FLYER = mkSet('pr-flyer-season', '季節のチラシ連作(洋菓子店)', 'チラシ・ポスター', 1240, 1754,
  ['チラシ', '季節', 'イベント', 'キャンペーン', '洋菓子', 'ケーキ', '年間'], [
  pg('1月 新春福袋', '#b3261e', () => [
    Ci(1000, 360, 460, '#c93a30'), Ci(180, 1100, 300, '#9d1f18'),
    ...flTag('NEW YEAR 2027', 80, 100, '#ffffff', '#b3261e', 380),
    T('新春', 80, 240, 1000, 280, { font: MINCHO, weight: 800, fill: '#f6d27a' }),
    T('福袋', 80, 540, 1000, 280, { font: MINCHO, weight: 800, fill: '#ffffff' }),
    T('焼き菓子とケーキ券の\n詰め合わせです', 80, 900, 900, 48, { font: MINCHO, weight: 700, fill: '#ffffff', lh: 1.6 }),
    R(80, 1130, 1080, 330, '#ffffff', 16),
    T('3,000円', 130, 1170, 520, 100, { font: MONT, weight: 800, fill: '#b3261e' }),
    T('(税込・中身は5,000円相当)', 130, 1290, 600, 28, { weight: 500, fill: '#6b3a35' }),
    T('1/2(土)より販売\n各日50個限定', 680, 1180, 440, 36, { weight: 800, fill: '#2b1a18', lh: 1.6 }),
    T('先着順・なくなり次第終了', 680, 1350, 440, 24, { weight: 500, fill: '#6b3a35' }),
    ...flFoot('#7a1710', '#ffffff', '#f3c9c5'),
  ]),
  pg('2月 バレンタイン', '#3b1f1a', () => [
    S('heart', 760, 120, 520, '#7a2f35', { angle: 14 }), S('heart', 80, 1000, 280, '#5c2a27', { angle: -12 }),
    T('VALENTINE', 80, 120, 900, 40, { font: MONT, weight: 700, fill: '#e8b98a', spacing: 600 }),
    T('心をこめた\nショコラ', 80, 220, 1000, 190, { font: MINCHO, weight: 800, fill: '#ffffff', lh: 1.25 }),
    ...PH(80, 760, 1080, 520, 0, '#5a342e'),
    R(80, 1250, 520, 130, '#e8b98a'),
    T('ボンボンショコラ 6個入り', 100, 1272, 480, 30, { weight: 800, fill: '#3b1f1a' }),
    T('2,160円', 100, 1320, 480, 40, { font: MONT, weight: 800, fill: '#3b1f1a' }),
    T('2/14まで ご予約承り中', 80, 1430, 900, 40, { weight: 800, fill: '#e8b98a' }),
    ...flFoot('#26120f', '#ffffff', '#cdb2a4'),
  ]),
  pg('3月 ホワイトデー', '#f4f1fa', () => [
    ...flTag('WHITE DAY 3.14', 80, 100, '#6c4fb0', '#ffffff', 380),
    T('ありがとうを\nお返しに', 80, 230, 1000, 150, { font: MINCHO, weight: 800, fill: '#3d2c6b', lh: 1.3 }),
    ...[['マカロン詰め合わせ', '8個入', '1,800円'], ['クッキーギフト', '缶入り', '2,400円'], ['プチケーキ3種', '保冷袋付き', '2,900円']].flatMap(([a, b, p], i) => [
      R(80 + i * 365, 640, 340, 700, '#ffffff', 16),
      ...PH(100 + i * 365, 660, 300, 300, 12, '#e5def3'),
      T(a, 100 + i * 365, 1000, 300, 32, { font: MINCHO, weight: 800, fill: '#3d2c6b', align: 'center' }),
      T(b, 100 + i * 365, 1120, 300, 24, { weight: 500, fill: '#7d71a1', align: 'center' }),
      T(p, 100 + i * 365, 1210, 300, 40, { font: MONT, weight: 800, fill: '#6c4fb0', align: 'center' }),
    ]),
    T('リボン・メッセージカード無料', 80, 1410, 1000, 40, { weight: 800, fill: '#6c4fb0' }),
    ...flFoot('#3d2c6b', '#ffffff', '#cbc2e4'),
  ]),
  pg('4月 さくら', '#fde6ec', () => [
    S('blob1', 700, 80, 640, '#fbc9d6'), S('star8', 60, 1000, 260, '#f9b6c7'),
    T('SAKURA  FAIR', 80, 110, 800, 36, { font: MONT, weight: 700, fill: '#d6577b', spacing: 500 }),
    T('春の\nさくらフェア', 80, 190, 1000, 130, { font: MINCHO, weight: 800, fill: '#7a2a40', lh: 1.25 }),
    ...PH(80, 640, 640, 640, 320, '#f7cdd8'),
    T('さくらのモンブラン', 760, 700, 400, 44, { font: MINCHO, weight: 800, fill: '#7a2a40', lh: 1.4 }),
    T('桜の葉の塩漬けと、\nほんのり甘い桜餡を\n重ねました。', 760, 840, 400, 28, { weight: 500, fill: '#8a4a5a', lh: 1.8 }),
    T('680円', 760, 1070, 400, 70, { font: MONT, weight: 800, fill: '#d6577b' }),
    T('3/20〜4/20 数量限定', 80, 1340, 900, 40, { weight: 800, fill: '#7a2a40' }),
    ...flFoot('#d6577b', '#ffffff', '#ffe3ea'),
  ]),
  pg('5月 母の日', '#eef7f1', () => [
    S('heart', 60, 80, 220, '#f6a5b8'),
    ...flTag("MOTHER'S DAY", 760, 110, '#d9627f', '#ffffff', 400),
    T('いつもの\nありがとう', 80, 340, 1000, 190, { font: MINCHO, weight: 800, fill: '#2f5d43', lh: 1.25 }),
    ...PH(80, 760, 1080, 460, 0, '#d9eadf'),
    R(80, 1190, 660, 190, '#ffffff', 16),
    T('花束のようなタルトセット', 120, 1218, 600, 34, { font: MINCHO, weight: 800, fill: '#2f5d43' }),
    T('2,800円(税込)', 120, 1280, 600, 56, { font: MONT, weight: 800, fill: '#d9627f' }),
    T('5/8〜5/11\nお届けも承ります', 780, 1220, 380, 30, { weight: 800, fill: '#2f5d43', lh: 1.6 }),
    ...flFoot('#2f5d43', '#ffffff', '#cfe6d8'),
  ]),
  pg('6月 梅雨', '#dbeaf5', () => [
    ...[0, 1, 2, 3, 4].map((i) => S('drop', 100 + i * 230, 110 + (i % 2) * 70, 90, '#8cb8d8')),
    T('RAINY  DAYS', 80, 330, 900, 36, { font: MONT, weight: 700, fill: '#2f6a96', spacing: 500 }),
    T('雨の日は、\nお得に。', 80, 410, 1000, 190, { font: MINCHO, weight: 800, fill: '#1c4766', lh: 1.25 }),
    Ci(930, 1000, 230, '#ffffff'),
    T('雨の日\nデー', 700, 880, 460, 80, { font: MINCHO, weight: 800, fill: '#2f6a96', align: 'center', lh: 1.3 }),
    T('全品 10%OFF', 80, 880, 620, 60, { font: ZK, weight: 900, fill: '#1c4766' }),
    T('傘をさしてご来店の方は、\nお会計から10%引き。\n6月中は雨の日ごとに実施します。', 80, 1000, 600, 30, { weight: 500, fill: '#1c4766', lh: 1.8 }),
    ...PH(80, 1250, 1080, 220, 16, '#c3d8e8'),
    ...flFoot('#1c4766', '#ffffff', '#b9d3e6'),
  ]),
  pg('7月 かき氷', '#17a6c6', () => [
    Ci(1000, 280, 420, '#f7d54a'), Ci(1040, 330, 300, '#fbe58a'),
    T('SUMMER', 80, 100, 800, 130, { font: MONT, weight: 900, fill: '#ffffff', spacing: 100 }),
    T('冷たい', 80, 420, 700, 160, { font: DELA, weight: 400, fill: '#073d4d' }),
    T('かき氷はじめました', 80, 590, 1100, 110, { font: DELA, weight: 400, fill: '#073d4d' }),
    ...PH(80, 800, 640, 580, 20, '#8fdcec'),
    ...[['いちごミルク', '780円'], ['宇治金時', '850円'], ['マンゴー', '950円']].flatMap(([a, p], i) => [
      R(760, 830 + i * 190, 400, 160, '#ffffff', 16),
      T(a, 780, 860 + i * 190, 360, 34, { font: ZK, weight: 900, fill: '#073d4d' }),
      T(p, 780, 920 + i * 190, 360, 44, { font: MONT, weight: 800, fill: '#e0457b' }),
    ]),
    ...flFoot('#073d4d', '#ffffff', '#b5dfe8'),
  ]),
  pg('9月 お月見', '#1d2a4d', () => [
    Ci(900, 380, 300, '#f9e6a0'), Ci(1010, 330, 270, '#1d2a4d'),
    ...[[120, 160], [300, 300], [520, 120], [700, 220]].map(([x, y]) => S('star5', x, y, 36, '#f9e6a0')),
    T('十五夜', 80, 520, 1000, 200, { font: MINCHO, weight: 800, fill: '#f9e6a0' }),
    T('月見だんごと\n栗のモンブラン', 80, 770, 1000, 90, { font: MINCHO, weight: 800, fill: '#ffffff', lh: 1.4 }),
    ...PH(80, 1010, 620, 440, 220, '#33426e'),
    T('秋の味覚、はじまる。', 760, 1040, 400, 34, { font: MINCHO, weight: 700, fill: '#f9e6a0', lh: 1.5 }),
    T('国産栗を使った\n限定ケーキが\n登場します。', 760, 1130, 400, 28, { weight: 500, fill: '#c9d0e8', lh: 1.8 }),
    T('9/1〜9/30', 760, 1340, 400, 40, { font: MONT, weight: 800, fill: '#f9e6a0' }),
    ...flFoot('#111a33', '#ffffff', '#aab4d4'),
  ]),
  pg('10月 ハロウィン', '#ff7a1a', () => [
    S('burst2', 700, 60, 520, '#ffa347'),
    T('HAPPY', 80, 130, 700, 100, { font: MONT, weight: 900, fill: '#2a1235' }),
    T('HALLOWEEN', 80, 240, 1100, 150, { font: MONT, weight: 900, fill: '#ffffff' }),
    T('おばけケーキ、焼きました', 80, 450, 1100, 80, { font: DELA, weight: 400, fill: '#2a1235' }),
    Ci(620, 960, 360, '#2a1235'),
    T('仮装で来店', 320, 760, 600, 70, { font: DELA, weight: 400, fill: '#ff7a1a', align: 'center' }),
    T('お菓子を\nプレゼント!', 320, 880, 600, 90, { font: ZK, weight: 900, fill: '#ffffff', align: 'center', lh: 1.3 }),
    T('10/31(日)限定・お子様から大人まで', 320, 1130, 600, 24, { weight: 500, fill: '#ffd7a8', align: 'center' }),
    T('かぼちゃのプリン 450円 / おばけシュー 380円', 80, 1400, 1100, 30, { weight: 800, fill: '#2a1235' }),
    ...flFoot('#2a1235', '#ffffff', '#cbb5d6'),
  ]),
  pg('11月 秋の味覚', '#f7ead7', () => [
    R(0, 0, 1240, 570, '#8a4b1f'),
    T('AUTUMN  TASTE', 80, 100, 900, 36, { font: MONT, weight: 700, fill: '#f0c38a', spacing: 500 }),
    T('実りの秋の\nタルト', 80, 180, 1100, 140, { font: MINCHO, weight: 800, fill: '#ffffff', lh: 1.25 }),
    ...[['栗', '焦がしバターのタルト', '650円'], ['芋', 'さつまいもと黒蜜', '580円'], ['梨', '洋梨とキャラメル', '720円']].flatMap(([a, b, p], i) => [
      Ci(230 + i * 390, 790, 150, '#ffffff'),
      T(a, 80 + i * 390, 720, 300, 130, { font: MINCHO, weight: 800, fill: '#8a4b1f', align: 'center' }),
      T(b, 80 + i * 390, 990, 300, 26, { weight: 700, fill: '#4a2a10', align: 'center' }),
      T(p, 80 + i * 390, 1040, 300, 44, { font: MONT, weight: 800, fill: '#c2410c', align: 'center' }),
    ]),
    R(80, 1200, 1080, 250, '#ffffff', 16),
    T('3種セット 1,680円', 130, 1240, 900, 50, { font: ZK, weight: 900, fill: '#4a2a10' }),
    T('お好きなタルトを3つ選べます。11月末までの限定価格です。', 130, 1330, 980, 26, { weight: 500, fill: '#7a5a3a', lh: 1.7 }),
    ...flFoot('#8a4b1f', '#ffffff', '#f0d6b5'),
  ]),
  pg('12月 クリスマス', '#14532d', () => [
    ...[0, 1, 2, 3, 4, 5, 6].map((i) => S('star5', 90 + i * 170, 90 + (i % 2) * 50, 50, '#fde68a')),
    T('MERRY  CHRISTMAS', 80, 250, 1100, 56, { font: MONT, weight: 800, fill: '#fde68a', spacing: 300 }),
    T('聖夜を彩る\nクリスマスケーキ', 80, 350, 1100, 120, { font: MINCHO, weight: 800, fill: '#ffffff', lh: 1.3 }),
    ...PH(80, 700, 560, 560, 280, '#2f7a4d'),
    ...[['苺のショート 5号', '4,200円'], ['ブッシュ・ド・ノエル', '4,600円'], ['ショコラ 4号', '3,400円']].flatMap(([a, p], i) => [
      R(690, 720 + i * 190, 470, 170, '#ffffff', 14),
      T(a, 710, 752 + i * 190, 430, 32, { font: MINCHO, weight: 800, fill: '#14532d' }),
      T(p, 710, 812 + i * 190, 430, 44, { font: MONT, weight: 800, fill: '#c62828' }),
    ]),
    T('12/20まで予約受付 / お渡し 12/23〜25', 80, 1340, 1100, 36, { weight: 800, fill: '#fde68a' }),
    ...flFoot('#0b3a1f', '#ffffff', '#b8d8c4'),
  ]),
])

// =====================================================================
// 7. 名刺 5 デザイン × 表・裏(537×325)
// =====================================================================
const mc = (lines: string[], x: number, y: number, w: number, fill: string, size = 17, align = 'left') =>
  T(lines.join('\n'), x, y, w, size, { font: 'Noto Sans JP', weight: 400, fill, align, lh: 1.55 })
const MEISHI = mkSet('pr-meishi', '名刺 5デザイン(表・裏)', '名刺', 537, 325,
  ['名刺', 'ビジネス', '表裏', 'シンプル', '和風', 'デザイナー', '個人事業'], [
  // A ミニマル
  pg('A 表(ミニマル)', '#ffffff', () => [
    R(0, 0, 14, 325, '#17304a'),
    T('営業部 課長', 54, 48, 400, 18, { weight: 500, fill: '#6b7684', spacing: 100 }),
    T('山田 太郎', 54, 84, 440, 42, { font: MINCHO, weight: 800, fill: '#17304a', spacing: 100 }),
    T('Taro Yamada', 54, 142, 400, 18, { font: MONT, weight: 500, fill: '#6b7684', spacing: 100 }),
    R(54, 190, 40, 3, '#d9732f'),
    mc(['TEL  00-0000-0000', 'MAIL  yamada@example.com', '〇〇県〇〇市港町1-2-3'], 54, 212, 440, '#1c2733', 16),
  ]),
  pg('A 裏(ミニマル)', '#17304a', () => [
    R(250, 112, 36, 4, '#d9732f'),
    T('MINATO DESIGN', 40, 138, 457, 30, { font: MONT, weight: 700, fill: '#ffffff', align: 'center', spacing: 300 }),
    T('株式会社ミナト設計', 40, 186, 457, 20, { weight: 500, fill: '#aebdcc', align: 'center', spacing: 200 }),
  ]),
  // B ダーク×ゴールド
  pg('B 表(ダーク)', '#15151a', () => [
    R(20, 20, 497, 285, '#15151a', 0, { stroke: '#b8924a', strokeWidth: 1 }),
    T('弁護士', 56, 56, 300, 18, { weight: 500, fill: '#b8924a', spacing: 300 }),
    T('佐藤 美咲', 56, 92, 440, 42, { font: MINCHO, weight: 800, fill: '#f4ead6', spacing: 150 }),
    T('MISAKI SATO', 56, 150, 400, 17, { font: MONT, weight: 500, fill: '#9a8a68', spacing: 300 }),
    R(56, 196, 60, 1, '#b8924a'),
    mc(['〇〇法律事務所', 'TEL 00-0000-0000  /  sato@example.com'], 56, 218, 440, '#c9c0ae', 15),
  ]),
  pg('B 裏(ダーク)', '#15151a', () => [
    R(20, 20, 497, 285, '#15151a', 0, { stroke: '#b8924a', strokeWidth: 1 }),
    S('diamond', 238, 80, 60, '#b8924a'),
    T('〇〇法律事務所', 40, 170, 457, 32, { font: MINCHO, weight: 800, fill: '#f4ead6', align: 'center', spacing: 300 }),
    T('LAW OFFICE', 40, 218, 457, 16, { font: MONT, weight: 600, fill: '#b8924a', align: 'center', spacing: 600 }),
  ]),
  // C デザイナー(幾何学)
  pg('C 表(カラフル)', '#fff7e8', () => [
    Ci(470, 40, 120, '#ff5a5f'), R(360, 190, 177, 135, '#2b6cff'), S('triangle', 380, 30, 90, '#ffc83d'),
    T('Designer', 40, 40, 300, 17, { font: MONT, weight: 700, fill: '#111111', spacing: 200 }),
    T('鈴木 あかり', 40, 84, 330, 40, { font: ZK, weight: 900, fill: '#111111' }),
    T('Akari Suzuki', 40, 136, 300, 18, { font: MONT, weight: 600, fill: '#555555' }),
    mc(['akari@example.com', '090-0000-0000', 'akari-design.example.com'], 40, 214, 300, '#111111', 16),
  ]),
  pg('C 裏(カラフル)', '#2b6cff', () => [
    Ci(80, 270, 150, '#ff5a5f'), S('triangle', 380, 160, 110, '#ffc83d'), R(40, 40, 70, 70, '#fff7e8'),
    T('Akari\nDesign\nStudio', 150, 90, 330, 56, { font: 'Dela Gothic One', weight: 400, fill: '#fff7e8', lh: 1.1 }),
  ]),
  // D 和風(縦書き)
  pg('D 表(和)', '#f5efe3', () => [
    new VText({ text: '高橋 健一', fontFamily: MINCHO, fontSize: 40, fontWeight: 800, maxChars: 6, fill: '#2a2a2a', left: 400, top: 56, charSpacing: 0.2 }),
    new VText({ text: '代表取締役', fontFamily: MINCHO, fontSize: 18, fontWeight: 500, maxChars: 6, fill: '#6b5f4e', left: 332, top: 60, charSpacing: 0.2 }),
    R(54, 52, 3, 222, '#b3261e'),
    mc(['高橋工務店', '〇〇県〇〇市本町4-5-6', 'TEL 00-0000-0000', 'FAX 00-0000-0001', 'takahashi@example.com'], 80, 64, 250, '#2a2a2a', 16),
  ]),
  pg('D 裏(和)', '#b3261e', () => [
    R(207, 62, 124, 200, '#b3261e', 0, { stroke: '#f5efe3', strokeWidth: 2 }),
    T('高橋\n工務店', 207, 98, 124, 36, { font: MINCHO, weight: 800, fill: '#f5efe3', align: 'center', lh: 1.5 }),
    T('TAKAHASHI KOMUTEN', 40, 286, 457, 14, { font: MONT, weight: 600, fill: '#f0c9c5', align: 'center', spacing: 400 }),
  ]),
  // E ナチュラル
  pg('E 表(ナチュラル)', '#eef3e6', () => [
    S('blob2', 330, -40, 280, '#cfe0bb'), S('blob1', -60, 215, 180, '#dce9cc'),
    T('Cafe & Bakery', 50, 44, 300, 17, { font: 'Playfair Display', weight: 400, fill: '#4f7a3a', spacing: 100 }),
    T('中村 ひなた', 50, 84, 330, 40, { font: ZK, weight: 900, fill: '#2f4a22' }),
    T('オーナー', 50, 136, 300, 18, { weight: 500, fill: '#6b8a58' }),
    mc(['〇〇市森町7-8-9', 'TEL 00-0000-0000', 'hinata@example.com'], 50, 202, 400, '#2f4a22', 16),
  ]),
  pg('E 裏(ナチュラル)', '#4f7a3a', () => [
    Ci(268, 130, 70, '#eef3e6'), S('blob2', 228, 90, 80, '#4f7a3a'),
    T('森のパン工房 ことり', 40, 224, 457, 30, { font: MINCHO, weight: 800, fill: '#eef3e6', align: 'center', spacing: 150 }),
    T('open 8:00 - 17:00  /  Wed. closed', 40, 272, 457, 15, { font: MONT, weight: 500, fill: '#cfe0bb', align: 'center', spacing: 100 }),
  ]),
])

// =====================================================================
// 8. 結婚式の招待一式(はがき・招待状 591×874 / アイボリー + セージ + ゴールド)
// =====================================================================
const WD = { iv: '#fbf8f1', sage: '#8da58a', deep: '#4b6249', gold: '#b99a5b', ink: '#3a3a35', mid: '#807d72', pale: '#e9efe5' }
const wdSprig = (x: number, y: number, c = WD.sage, k = 1): FabricObject[] => [
  S('blob2', x, y, 70 * k, c, { angle: -20 }), S('blob2', x + 52 * k, y + 40 * k, 56 * k, c, { angle: 30 }), S('blob2', x - 10 * k, y + 80 * k, 56 * k, c, { angle: -50 }),
]
const wdFrame = (bg = WD.iv): FabricObject[] => [
  R(0, 0, 591, 874, bg), R(24, 24, 543, 826, bg, 0, { stroke: WD.gold, strokeWidth: 1.5 }),
]
const wdTitle = (en: string, ja: string, y = 90): FabricObject[] => [
  T(en, 40, y, 511, 18, { font: MONT, weight: 600, fill: WD.gold, align: 'center', spacing: 500 }),
  T(ja, 40, y + 36, 511, 40, { font: MINCHO, weight: 800, fill: WD.deep, align: 'center', spacing: 200 }),
  R(266, y + 100, 60, 1.5, WD.gold),
]
const WEDDING = mkSet('pr-wedding', '結婚式 招待状一式(10点)', 'はがき・招待状', 591, 874,
  ['結婚式', '招待状', 'ウェディング', '席次表', '出欠はがき', 'ペーパーアイテム'], [
  pg('招待状 表紙', WD.iv, () => [
    ...wdFrame(),
    ...wdSprig(100, 110), ...wdSprig(440, 110, WD.sage, 0.9),
    T('WEDDING  INVITATION', 40, 330, 511, 20, { font: MONT, weight: 600, fill: WD.gold, align: 'center', spacing: 600 }),
    T('悠斗 & 結衣', 40, 400, 511, 56, { font: MINCHO, weight: 800, fill: WD.deep, align: 'center', spacing: 150 }),
    T('Yuto  &  Yui', 40, 480, 511, 34, { font: 'Playfair Display', weight: 400, fill: WD.mid, align: 'center' }),
    R(266, 560, 60, 1.5, WD.gold),
    T('2027.05.22  SAT', 40, 590, 511, 24, { font: MONT, weight: 600, fill: WD.ink, align: 'center', spacing: 300 }),
  ]),
  pg('招待状 本文(縦書き)', WD.iv, () => [
    ...wdFrame(),
    new VText({ text: '謹啓 若葉の候 皆様にはご清祥のこととお慶び申し上げます\nこのたび私たちは結婚式を挙げることになりました\nつきましてはご報告かたがた\nささやかな披露の宴を催したく存じます\nご多用中恐縮ではございますが\nぜひご出席賜りますようお願い申し上げます', fontFamily: MINCHO, fontSize: 24, fontWeight: 500, maxChars: 16, fill: WD.ink, left: 115, top: 120, charSpacing: 0.12, lineHeight: 1.5 }),
    T('2027年5月\n悠斗  結衣', 70, 640, 300, 24, { font: MINCHO, weight: 700, fill: WD.deep, lh: 1.7 }),
    ...wdSprig(450, 720, WD.sage, 0.7),
  ]),
  pg('ご案内', WD.iv, () => [
    ...wdFrame(),
    ...wdTitle('INFORMATION', 'ご案内'),
    ...[['日時', '2027年5月22日(土)\n挙式 11:30 / 披露宴 12:30'], ['会場', 'ホテル グランシエル\n〇〇県〇〇市港町1-2-3'], ['会費', '20,000円'], ['お願い', 'お返事は4月20日までに\n同封のはがきにてお知らせください']].flatMap(([a, b], i) => [
      T(a, 70, 260 + i * 140, 120, 22, { weight: 700, fill: WD.gold, spacing: 200 }),
      T(b, 190, 258 + i * 140, 340, 24, { font: MINCHO, weight: 600, fill: WD.ink, lh: 1.7 }),
      R(70, 354 + i * 140, 451, 1, WD.pale),
    ]),
    ...wdSprig(250, 770, WD.sage, 0.6),
  ]),
  pg('会場アクセス', WD.iv, () => [
    ...wdFrame(),
    ...wdTitle('ACCESS', 'アクセス'),
    ...PH(70, 260, 451, 320, 0, WD.pale),
    S('drop', 270, 360, 50, WD.deep),
    T('ホテル グランシエル', 70, 610, 451, 28, { font: MINCHO, weight: 800, fill: WD.deep, align: 'center' }),
    T('〇〇駅 東口より徒歩5分\n無料送迎バスを10:30から運行します。\n駐車場もご利用いただけます。', 70, 665, 451, 20, { weight: 400, fill: WD.ink, align: 'center', lh: 1.9 }),
  ]),
  pg('出欠はがき 表', '#ffffff', () => [
    R(0, 0, 591, 874, '#ffffff'),
    T('返信', 40, 70, 150, 36, { font: MINCHO, weight: 800, fill: WD.deep }),
    R(40, 130, 511, 1, WD.gold),
    T('〒000-0000', 40, 170, 300, 24, { font: MONT, weight: 500, fill: WD.ink }),
    T('〇〇県〇〇市港町4-5-6\n結婚式係', 40, 220, 511, 28, { font: MINCHO, weight: 600, fill: WD.ink, lh: 1.7 }),
    T('悠斗 & 結衣 行', 40, 430, 511, 56, { font: MINCHO, weight: 800, fill: WD.deep, align: 'center' }),
    ...wdSprig(100, 620, WD.sage, 0.8),
    T('お返事は4月20日(火)までに\nご投函ください', 40, 770, 511, 20, { weight: 500, fill: WD.mid, align: 'center', lh: 1.7 }),
  ]),
  pg('出欠はがき 裏', '#ffffff', () => [
    R(0, 0, 591, 874, '#ffffff'),
    T('RSVP', 40, 56, 511, 20, { font: MONT, weight: 600, fill: WD.gold, align: 'center', spacing: 600 }),
    T('ご出欠のお返事', 40, 94, 511, 34, { font: MINCHO, weight: 800, fill: WD.deep, align: 'center' }),
    R(70, 180, 190, 90, '#ffffff', 45, { stroke: WD.sage, strokeWidth: 2 }), R(330, 180, 190, 90, '#ffffff', 45, { stroke: WD.sage, strokeWidth: 2 }),
    T('ご出席', 70, 208, 190, 30, { font: MINCHO, weight: 800, fill: WD.deep, align: 'center' }),
    T('ご欠席', 330, 208, 190, 30, { font: MINCHO, weight: 800, fill: WD.deep, align: 'center' }),
    ...[['お名前', 330], ['ご住所', 450], ['アレルギー等', 600]].flatMap(([a, y]) => [
      T(String(a), 70, Number(y), 300, 20, { weight: 700, fill: WD.gold }),
      R(70, Number(y) + 70, 451, 1.5, WD.sage),
    ]),
    T('お二人へのメッセージ', 70, 750, 451, 20, { weight: 700, fill: WD.gold }),
    R(70, 830, 451, 1.5, WD.sage),
  ]),
  pg('席次表', WD.iv, () => [
    ...wdFrame(),
    ...wdTitle('SEATING', '席次表'),
    R(196, 230, 200, 70, WD.deep, 8),
    T('新郎新婦', 196, 248, 200, 28, { font: MINCHO, weight: 800, fill: '#ffffff', align: 'center' }),
    ...[0, 1, 2].flatMap((c) => [0, 1].map((r) => [c, r])).flatMap(([c, r]) => [
      Ci(125 + c * 170, 440 + r * 200, 66, WD.pale), Ci(125 + c * 170, 440 + r * 200, 66, 'rgba(0,0,0,0)', { stroke: WD.sage, strokeWidth: 2 }),
      T(String.fromCharCode(65 + c + r * 3) + ' 卓', 125 + c * 170 - 60, 440 + r * 200 - 14, 120, 28, { font: MINCHO, weight: 800, fill: WD.deep, align: 'center' }),
    ]),
    T('A卓:新郎ご親族 / B卓:新婦ご親族 / C卓:ご友人', 40, 800, 511, 16, { weight: 400, fill: WD.mid, align: 'center' }),
  ]),
  pg('席札', WD.iv, () => [
    R(0, 0, 591, 874, WD.iv), R(0, 437, 591, 1, WD.pale),
    ...wdSprig(240, 130, WD.sage, 0.9),
    T('Welcome', 40, 330, 511, 40, { font: 'Playfair Display', weight: 400, fill: WD.gold, align: 'center' }),
    T('佐藤 花子 様', 40, 560, 511, 60, { font: MINCHO, weight: 800, fill: WD.deep, align: 'center', spacing: 150 }),
    T('悠斗 & 結衣', 40, 760, 511, 24, { font: MINCHO, weight: 600, fill: WD.mid, align: 'center', spacing: 200 }),
  ]),
  pg('お料理メニュー', WD.iv, () => [
    ...wdFrame(),
    ...wdTitle('MENU', 'お料理'),
    ...['アミューズ ブーシュ', '冷前菜 季節の魚介と野菜', '温前菜 帆立のポワレ', 'スープ とうもろこしの冷製', '魚料理 鯛のロースト', '肉料理 国産牛のグリル', 'デザート ウェディングケーキ', 'コーヒー・小菓子'].map((t, i) =>
      T(t, 70, 260 + i * 66, 451, 22, { font: MINCHO, weight: 600, fill: WD.ink, align: 'center' })),
    ...wdSprig(250, 780, WD.sage, 0.5),
  ]),
  pg('サンクスカード', WD.sage, () => [
    R(40, 40, 511, 794, WD.sage, 0, { stroke: '#ffffff', strokeWidth: 1.5 }),
    T('Thank you', 40, 200, 511, 80, { font: 'Playfair Display', weight: 400, fill: '#ffffff', align: 'center' }),
    R(266, 330, 60, 1.5, '#ffffff'),
    T('本日はご多用のところ\nお越しくださり\n誠にありがとうございました。\n\nこれからも変わらぬお付き合いを\nよろしくお願いいたします。', 70, 380, 451, 22, { font: MINCHO, weight: 500, fill: '#ffffff', align: 'center', lh: 2.0 }),
    T('悠斗 & 結衣', 40, 740, 511, 30, { font: MINCHO, weight: 800, fill: '#ffffff', align: 'center', spacing: 200 }),
  ]),
])

// =====================================================================
// 9. 年賀状・季節の挨拶状 10 パターン(はがき 591×874)
// =====================================================================
const gr = (t: string, x: number, y: number, w: number, size: number, fill: string, o: Record<string, any> = {}) =>
  T(t, x, y, w, size, { font: MINCHO, weight: 800, fill, align: 'center', ...o })
const grName = (fill: string, y = 770, extra = ''): FabricObject[] => [
  T('〒000-0000  〇〇県〇〇市港町1-2-3', 40, y, 511, 18, { weight: 400, fill, align: 'center' }),
  T('山田 太郎 ・ 花子' + extra, 40, y + 34, 511, 28, { font: MINCHO, weight: 800, fill, align: 'center', spacing: 100 }),
]
const GREET = mkSet('pr-greeting', '年賀状・季節の挨拶状 10パターン', 'はがき・招待状', 591, 874,
  ['年賀状', '寒中見舞い', '暑中見舞い', 'クリスマス', '出産報告', '結婚報告', '残暑見舞い', '挨拶状'], [
  pg('年賀 干支(紅白)', '#c1272d', () => [
    Ci(296, 380, 250, '#d8383d'),
    T('謹賀新年', 40, 80, 511, 80, { font: MINCHO, weight: 800, fill: '#ffffff', align: 'center', spacing: 200 }),
    T('未', 40, 250, 511, 280, { font: MINCHO, weight: 800, fill: '#fff4e0', align: 'center' }),
    gr('旧年中は大変お世話になりました\n本年もどうぞよろしくお願いいたします', 40, 620, 511, 22, '#ffffff', { weight: 500, lh: 1.8 }),
    gr('2027年 元旦', 40, 730, 511, 24, '#fff4e0', { spacing: 300 }),
    ...grName('#ffffff', 780),
  ]),
  pg('年賀 和(縦書き)', '#f6efe0', () => [
    R(40, 40, 511, 794, '#f6efe0', 0, { stroke: '#c1272d', strokeWidth: 1.5 }),
    new VText({ text: '新年あけましておめでとうございます\n旧年中は格別のご厚情を賜り\n厚く御礼申し上げます\n本年も変わらぬお付き合いを\n心よりお願い申し上げます', fontFamily: MINCHO, fontSize: 28, fontWeight: 600, maxChars: 18, fill: '#2a2a2a', left: 170, top: 90, charSpacing: 0.12, lineHeight: 1.5 }),
    Ci(110, 120, 40, '#c1272d'),
    T('賀', 70, 92, 80, 56, { font: MINCHO, weight: 800, fill: '#f6efe0', align: 'center' }),
    gr('2027年 元旦', 90, 650, 300, 22, '#2a2a2a', { align: 'left', spacing: 200 }),
    ...grName('#2a2a2a', 750),
  ]),
  pg('年賀 写真入り', '#ffffff', () => [
    ...PH(30, 30, 531, 560, 0, '#e5e7eb'),
    R(30, 560, 531, 284, '#ffffff'),
    T('A Happy New Year', 40, 610, 511, 44, { font: 'Playfair Display', weight: 700, fill: '#c1272d', align: 'center' }),
    gr('あけましておめでとうございます', 40, 685, 511, 26, '#2a2a2a', { weight: 700 }),
    T('2027  皆様にとって素晴らしい一年になりますように', 40, 740, 511, 17, { weight: 400, fill: '#6b7280', align: 'center' }),
    T('山田 太郎 ・ 花子 ・ 一郎', 40, 800, 511, 22, { font: MINCHO, weight: 800, fill: '#2a2a2a', align: 'center' }),
  ]),
  pg('年賀 ポップ', '#ffd23f', () => [
    S('burst', 340, 40, 300, '#ff5a5f'), S('star5', 40, 640, 120, '#2b6cff'), Ci(480, 700, 70, '#2b6cff'),
    T('HAPPY', 40, 90, 400, 90, { font: DELA, weight: 400, fill: '#1a1a1a' }),
    T('NEW', 40, 200, 400, 120, { font: DELA, weight: 400, fill: '#ffffff' }),
    T('YEAR', 40, 330, 400, 120, { font: DELA, weight: 400, fill: '#1a1a1a' }),
    T('2027', 40, 500, 400, 100, { font: MONT, weight: 900, fill: '#ff5a5f' }),
    T('今年もよろしくね!', 40, 680, 450, 34, { font: ZK, weight: 900, fill: '#1a1a1a' }),
    T('山田家', 40, 780, 300, 36, { font: ZK, weight: 900, fill: '#1a1a1a' }),
  ]),
  pg('年賀 ミニマル(金)', '#17202a', () => [
    R(40, 40, 511, 794, '#17202a', 0, { stroke: '#c8a45c', strokeWidth: 1 }),
    T('2027', 40, 240, 511, 120, { font: MONT, weight: 300, fill: '#c8a45c', align: 'center', spacing: 300 }),
    R(266, 400, 60, 1.5, '#c8a45c'),
    gr('謹賀新年', 40, 440, 511, 52, '#f1e9d6', { spacing: 400 }),
    gr('本年もよろしくお願いいたします', 40, 540, 511, 22, '#c9c0ae', { weight: 500 }),
    ...grName('#c9c0ae', 740),
  ]),
  pg('寒中見舞い', '#e9f1f7', () => [
    ...[0, 1, 2, 3, 4, 5].map((i) => S('star8', 60 + i * 90, 80 + (i % 3) * 50, 40, '#bcd4e6')),
    gr('寒中お見舞い申し上げます', 40, 280, 511, 38, '#27506f', { spacing: 100 }),
    R(266, 360, 60, 1.5, '#27506f'),
    gr('厳しい寒さが続いておりますが\nいかがお過ごしでしょうか\n皆様のご健康を心よりお祈りいたします', 40, 400, 511, 22, '#27506f', { weight: 500, lh: 2.0 }),
    gr('2027年 1月', 40, 650, 511, 22, '#5a7e98', { spacing: 200 }),
    ...grName('#27506f', 760),
  ]),
  pg('暑中見舞い', '#2ab3d6', () => [
    Ci(470, 150, 130, '#ffe066'),
    ...[0, 1, 2].map((i) => S('cloud', 40 + i * 160, 330 + i * 30, 150, '#ffffff')),
    T('暑中お見舞い', 40, 90, 400, 56, { font: DELA, weight: 400, fill: '#ffffff' }),
    T('申し上げます', 40, 160, 400, 56, { font: DELA, weight: 400, fill: '#073d4d' }),
    gr('毎日暑い日が続いています\n体調を崩さないよう\nお気をつけくださいね', 40, 520, 511, 24, '#073d4d', { weight: 700, lh: 1.9 }),
    gr('2027年 盛夏', 40, 710, 511, 22, '#ffffff', { spacing: 300 }),
    ...grName('#073d4d', 770),
  ]),
  pg('残暑見舞い', '#fff3e0', () => [
    Ci(296, 330, 200, '#ffb74d'), Ci(296, 330, 140, '#fff3e0'),
    S('cloud', 330, 560, 210, '#ffe0b2'),
    gr('残暑お見舞い申し上げます', 40, 90, 511, 34, '#8a4b1f', { spacing: 100 }),
    gr('秋', 40, 220, 511, 220, '#e65100'),
    gr('立秋とは名ばかりの暑さが続いております\nご自愛のほどお祈りいたします', 40, 600, 511, 20, '#8a4b1f', { weight: 500, lh: 1.9 }),
    gr('2027年 8月', 40, 710, 511, 22, '#8a4b1f', { spacing: 200 }),
    ...grName('#8a4b1f', 770),
  ]),
  pg('クリスマスカード', '#14532d', () => [
    ...[[60, 60], [200, 120], [340, 70], [470, 130], [120, 200], [400, 220]].map(([x, y]) => S('star5', x, y, 36, '#fde68a')),
    T('Merry Christmas', 40, 320, 511, 52, { font: 'Playfair Display', weight: 700, fill: '#ffffff', align: 'center' }),
    T('& Happy New Year', 40, 410, 511, 40, { font: 'Playfair Display', weight: 400, fill: '#fde68a', align: 'center' }),
    R(266, 500, 60, 1.5, '#fde68a'),
    gr('素敵なクリスマスと\n輝かしい新年をお迎えください', 40, 540, 511, 22, '#ffffff', { weight: 500, lh: 2.0 }),
    ...grName('#fde68a', 760),
  ]),
  pg('出産報告', '#fdf0f2', () => [
    Ci(296, 330, 190, '#fbd5dc'), S('heart', 216, 250, 160, '#ffffff'),
    T('Hello, Baby!', 40, 80, 511, 60, { font: 'Playfair Display', weight: 700, fill: '#d6577b', align: 'center' }),
    gr('私たちに家族が増えました', 40, 570, 511, 30, '#7a2a40'),
    gr('2027年6月1日生まれ\n名前 ひなた  3,120g', 40, 630, 511, 24, '#7a2a40', { weight: 500, lh: 1.8 }),
    gr('これからもよろしくお願いします', 40, 720, 511, 20, '#b4607a', { weight: 500 }),
    ...grName('#7a2a40', 780),
  ]),
])

// =====================================================================
// 10. 賞状・修了証・感謝状 10 パターン(A4 横 1754×1240)
// =====================================================================
interface Aw { title: string; to: string; body: string; date: string; issuer: string; role: string; ink: string; sub: string; bg: string; frame: (bg: string, ink: string) => FabricObject[]; tsize?: number; tfont?: string; mark?: FabricObject[] }
const awPage = (label: string, a: Aw) =>
  pg(label, a.bg, () => [
    ...a.frame(a.bg, a.ink),
    ...(a.mark ?? []),
    T(a.title, 200, 190, 1354, a.tsize ?? 140, { font: a.tfont ?? MINCHO, weight: 800, fill: a.ink, align: 'center', spacing: 600 }),
    T(a.to, 200, 450, 1354, 66, { font: MINCHO, weight: 800, fill: a.ink, align: 'center', spacing: 100 }),
    R(500, 550, 754, 2, a.sub),
    T(a.body, 230, 600, 1294, 38, { font: MINCHO, weight: 500, fill: a.ink, align: 'center', lh: 2.0 }),
    T(a.date, 200, 870, 1354, 32, { font: MINCHO, weight: 500, fill: a.ink, align: 'center', spacing: 200 }),
    T(a.role, 700, 940, 860, 28, { weight: 500, fill: a.sub, align: 'right' }),
    T(a.issuer, 700, 985, 860, 44, { font: MINCHO, weight: 800, fill: a.ink, align: 'right' }),
  ])
const fDouble = (bg: string, c: string): FabricObject[] => [
  R(60, 60, 1634, 1120, bg, 0, { stroke: c, strokeWidth: 10 }),
  R(90, 90, 1574, 1060, bg, 0, { stroke: c, strokeWidth: 2 }),
]
const fCorner = (bg: string, c: string): FabricObject[] => [
  R(50, 50, 1654, 1140, bg, 0, { stroke: c, strokeWidth: 3 }),
  ...[[50, 50], [1594, 50], [50, 1080], [1594, 1080]].map(([x, y]) => R(x, y, 110, 110, c)),
  R(100, 100, 1554, 1040, bg, 0, { stroke: c, strokeWidth: 1.5 }),
]
const fBand = (bg: string, c: string): FabricObject[] => [R(0, 0, 1754, 70, c), R(0, 1170, 1754, 70, c), R(0, 70, 30, 1100, c), R(1724, 70, 30, 1100, c), R(80, 120, 1594, 1000, bg, 0, { stroke: c, strokeWidth: 1.5 })]
const fRound = (bg: string, c: string): FabricObject[] => [R(60, 60, 1634, 1120, bg, 70, { stroke: c, strokeWidth: 8 }), R(95, 95, 1564, 1050, bg, 50, { stroke: c, strokeWidth: 2 })]
const fSide = (bg: string, c: string): FabricObject[] => [R(0, 0, 90, 1240, c), R(90, 0, 14, 1240, bg === '#ffffff' ? '#e5e7eb' : '#ffffff'), R(1664, 0, 90, 1240, c)]
const medal = (c: string, c2: string, t: string): FabricObject[] => [
  Ci(260, 300, 110, c), Ci(260, 300, 88, c2), S('star5', 210, 250, 100, c),
  T(t, 150, 430, 220, 22, { font: MONT, weight: 700, fill: c, align: 'center', spacing: 300 }),
]
const AWARDS = mkSet('pr-award', '賞状・修了証・感謝状 10パターン', '賞状・証明書', 1754, 1240,
  ['賞状', '修了証', '感謝状', '表彰状', '認定証', '証書', '卒業', '大会'], [
  awPage('賞状(金枠)', { title: '賞　状', to: '山田 太郎 殿', body: 'あなたは本年度の活動において\n特に優れた成績を収められました\nよってここに表彰し その努力をたたえます', date: '令和九年三月二十日', role: '会長', issuer: '〇〇協会　鈴木 一郎', ink: '#2b2b2b', sub: '#b8924a', bg: '#fffdf6', frame: fDouble, mark: [S('star5', 805, 90, 140, '#b8924a')] }),
  awPage('修了証', { title: '修了証書', to: '佐藤 花子 殿', body: '貴殿は 基礎コース(全12回)の課程を\n所定の成績で修了したことを証します', date: '2027年3月31日', role: '校長', issuer: '〇〇スクール　高橋 健', ink: '#1d3557', sub: '#457b9d', bg: '#ffffff', frame: fCorner, tsize: 120 }),
  awPage('感謝状', { title: '感　謝　状', to: '株式会社〇〇 御中', body: '貴社には 長年にわたり当団体の活動に\nご支援とご協力を賜りました\nここに深く感謝の意を表します', date: '令和九年十月一日', role: '理事長', issuer: '〇〇協会　田中 誠', ink: '#6b1d1d', sub: '#a64b2a', bg: '#fbf5ea', frame: fBand, tsize: 130 }),
  awPage('皆勤賞', { title: '皆勤賞', to: '中村 ひなた 殿', body: 'あなたは1年間 一日も休むことなく\n元気に通園しました\nそのがんばりをほめたたえます', date: '2027年3月18日', role: '園長', issuer: 'さくら幼稚園　森 みどり', ink: '#c2410c', sub: '#f59e0b', bg: '#fff8e8', frame: fRound, tsize: 150, tfont: 'Zen Maru Gothic', mark: [S('star5', 150, 130, 90, '#f59e0b'), S('star5', 1514, 130, 90, '#f59e0b'), S('heart', 150, 990, 80, '#f59e0b'), S('heart', 1524, 990, 80, '#f59e0b')] }),
  awPage('優秀賞', { title: '優秀賞', to: '株式会社〇〇　営業部', body: '貴部門は 本年度の売上目標を\n大幅に達成し 会社の発展に貢献されました\nその功績をたたえ ここに表彰します', date: '2027年4月1日', role: '代表取締役', issuer: '株式会社サンプル　山本 悟', ink: '#fdf6e3', sub: '#c9a45c', bg: '#0f1f3d', frame: fCorner, tsize: 150, mark: medal('#c9a45c', '#0f1f3d', 'EXCELLENCE') }),
  awPage('合格証', { title: '合格証書', to: '渡辺 蒼 殿', body: '貴殿は 第12回 ビジネス実務検定\n2級の試験に合格したことを証します', date: '2027年2月20日', role: '実施委員長', issuer: '〇〇検定協会　小林 修', ink: '#14532d', sub: '#16a34a', bg: '#f4faf5', frame: fSide, tsize: 120 }),
  awPage('参加賞', { title: 'がんばったで賞', to: '伊藤 そら くん', body: 'ぼくじょうの大会に さいごまで\nあきらめずに はしりぬきました\nとてもすてきでした', date: '2027年10月10日', role: '大会委員長', issuer: '〇〇小学校　木村 先生', ink: '#1d4ed8', sub: '#60a5fa', bg: '#f0f7ff', frame: fRound, tsize: 110, tfont: 'Zen Maru Gothic', mark: [S('cloud', 140, 120, 200, '#bfdbfe'), S('cloud', 1414, 140, 200, '#bfdbfe')] }),
  awPage('認定証', { title: '認　定　証', to: '加藤 優 殿', body: '貴殿は 所定の研修と審査を経て\nカラーコーディネーター認定\nの資格を有することを認定します', date: '2027年6月1日', role: '認定機関', issuer: '〇〇アカデミー　吉田 恵', ink: '#4a2c6b', sub: '#a78bd0', bg: '#ffffff', frame: fDouble, tsize: 120, mark: [S('badge', 750, 80, 100, '#a78bd0')] }),
  awPage('優勝', { title: '優　勝', to: 'チーム サンライズ', body: '第20回 〇〇市民スポーツ大会\nソフトボールの部において\n見事優勝されました ここに表彰します', date: '2027年9月15日', role: '実行委員長', issuer: '〇〇市スポーツ協会　松本 力', ink: '#7c2d12', sub: '#f59e0b', bg: '#fff9ec', frame: fBand, tsize: 190, mark: [S('ribbon', 1330, 60, 150, '#f59e0b')] }),
  awPage('功労賞', { title: '功労賞', to: '井上 正 様', body: '貴殿は 三十年の長きにわたり\n地域の発展と福祉の向上に尽くされました\nその功績に深く敬意を表し 記念品を贈ります', date: '令和九年十一月三日', role: '会長', issuer: '〇〇町自治会　岡田 栄', ink: '#2b2b2b', sub: '#9a7b3c', bg: '#fdfaf0', frame: fCorner, tsize: 150, mark: [S('ribbon', 820, 70, 110, '#9a7b3c')] }),
])
export const PRINT_SETS: Template[] = [COMPANY, WHITEPAPER, MENU, REPORT, MANUAL, FLYER, MEISHI, WEDDING, GREET, AWARDS]
