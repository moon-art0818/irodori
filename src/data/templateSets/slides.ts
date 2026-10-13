import type { Template, TemplatePage, TemplateBg } from '../templates'
import { T, R, Ci, S, PH } from '../templates/kit'
import { makeChart, makeTable } from '../../editor/elements'
import { VText } from '../../editor/vtext'

// プレゼン(1920×1080)のテンプレートセット。1セット=1デザインシステム、各10ページ前後
const CAT = 'プレゼン'
const W = 1920
const H = 1080
const all: Template[] = []

const pg = (label: string, bg: TemplateBg, build: TemplatePage['build']): TemplatePage => ({ label, bg, build })
const mk = (id: string, name: string, tags: string[], pages: TemplatePage[]): Template => ({
  id, name, category: CAT, w: W, h: H, tags, bg: pages[0].bg, build: pages[0].build, more: pages.slice(1),
})
/** 透明(枠線だけの四角を作るとき) */
const NONE = 'rgba(0,0,0,0)'
/** グラフ・表を配置する */
const put = <G extends { set: (o: any) => any }>(g: G, x: number, y: number, s = 1): G => { g.set({ left: x, top: y, scaleX: s, scaleY: s }); return g }

// ======== 1. 営業提案書(紺×金・高級感) ========
{
  const N = '#0f1f3d', G = '#b8934a', IV = '#f7f4ee', INK = '#1c2433', GR = '#5b6475', LN = '#d9d4c7'
  const HF = 'Shippori Mincho', EF = 'Playfair Display'
  const foot = (n: number, dark = false, x0 = 120) => [
    R(x0, 986, 1800 - x0, 2, dark ? 'rgba(255,255,255,0.25)' : LN),
    T('PROPOSAL  |  株式会社エクザンプル', x0, 1006, Math.min(900, 1800 - x0), 28, { weight: 400, fill: dark ? '#aab3c5' : GR, spacing: 60 }),
    T(String(n).padStart(2, '0'), 1600, 1000, 200, 34, { font: EF, weight: 700, fill: G, align: 'right' }),
  ]
  const head = (t: string, y = 90, fill = INK) => [
    T(t, 120, y, 1680, 64, { font: HF, weight: 800, fill }),
    R(120, y + 100, 80, 4, G),
  ]
  all.push(mk('ps-prop', '営業提案書 紺×金', ['営業', '提案書', '高級感', 'BtoB', '法人'], [
    pg('表紙', N, () => [
      ...PH(1100, 0, 820, 1080, 0, '#22375f'),
      T('PROPOSAL', 120, 170, 800, 32, { font: EF, weight: 700, fill: G, spacing: 400 }),
      R(120, 236, 80, 3, G),
      T('業務基盤の刷新と\n成長を支える\nご提案書', 120, 290, 900, 84, { font: HF, weight: 800, fill: '#ffffff', lh: 1.35 }),
      T('株式会社サンプル商事 御中', 120, 700, 900, 40, { weight: 400, fill: '#d7dcea' }),
      T('2026年10月  株式会社エクザンプル', 120, 960, 900, 32, { weight: 400, fill: G, spacing: 40 }),
    ]),
    pg('目次', IV, () => [
      T('CONTENTS', 120, 110, 600, 32, { font: EF, weight: 700, fill: G, spacing: 400 }),
      T('ご提案の流れ', 120, 170, 640, 64, { font: HF, weight: 800, fill: INK }),
      R(120, 270, 80, 4, G),
      T('本書は、貴社の営業・\n受発注業務の効率化に\n向けた取り組みを、\n課題から費用まで\n順にご説明します。', 120, 330, 600, 36, { weight: 400, fill: GR, lh: 1.8 }),
      ...[['現状の整理', 'いま見えている3つの課題'], ['ご提案の全体像', '目指す姿と進め方'], ['期待できる効果', '数字で見る改善の見込み'], ['導入スケジュールと費用', '3か月で立ち上げる計画'], ['次のステップ', 'ご決定からキックオフまで']]
        .flatMap(([a, b], i) => [
          T('0' + (i + 1), 860, 130 + i * 160, 120, 56, { font: EF, weight: 700, fill: G }),
          T(a, 1000, 128 + i * 160, 800, 48, { font: HF, weight: 800, fill: INK }),
          T(b, 1000, 196 + i * 160, 800, 32, { weight: 400, fill: GR }),
          R(860, 252 + i * 160, 940, 2, LN),
        ]),
      ...foot(2),
    ]),
    pg('現状の課題', '#ffffff', () => [
      ...head('現場の声から見えた、3つの課題'),
      ...[['データの分散', '見積と受注の情報が\n別々のファイルに\n散らばっている'], ['属人化した進行', '案件の状況が担当者\nだけに紐づき、引継ぎ\nに時間がかかる'], ['集計の手間', '月次の報告資料づくり\nに毎月3営業日を\n費やしている']]
        .flatMap(([a, b], i) => {
          const x = 120 + i * 580
          return [
            R(x, 290, 520, 620, IV),
            R(x, 290, 520, 6, G),
            T('0' + (i + 1), x + 44, 340, 200, 64, { font: EF, weight: 700, fill: G }),
            T(a, x + 44, 450, 440, 48, { font: HF, weight: 800, fill: INK }),
            T(b, x + 44, 540, 440, 36, { weight: 400, fill: GR, lh: 1.7 }),
          ]
        }),
      ...foot(3),
    ]),
    pg('提案の全体像', IV, () => [
      T('ひとつの基盤で、\n営業から請求まで\nつなぐ', 120, 200, 900, 72, { font: HF, weight: 800, fill: INK, lh: 1.4 }),
      R(120, 520, 80, 4, G),
      T('ご提案の骨子は次の3点です。\n各段階で効果を確認しながら\n進めます。', 120, 570, 800, 36, { weight: 400, fill: GR, lh: 1.8 }),
      R(1158, 270, 3, 440, G),
      ...[['情報の一元化', '案件・顧客データを集約'], ['業務フローの自動化', '見積から請求までを連携'], ['数字の見える化', 'ダッシュボードで即確認']].flatMap(([a, b], i) => [
        Ci(1160, 270 + i * 220, 48, N),
        T(String(i + 1), 1112, 242 + i * 220, 96, 44, { font: EF, weight: 700, fill: '#ffffff', align: 'center' }),
        T(a, 1260, 235 + i * 220, 540, 48, { font: HF, weight: 800, fill: INK }),
        T(b, 1260, 300 + i * 220, 540, 36, { weight: 400, fill: GR }),
      ]),
      ...foot(4),
    ]),
    pg('提案内容(写真+文)', '#ffffff', () => [
      ...PH(0, 0, 860, 1080, 0, '#e4e0d5'),
      T('SOLUTION 01', 980, 140, 700, 32, { font: EF, weight: 700, fill: G, spacing: 300 }),
      T('案件情報を\nひとつに集約', 980, 200, 820, 64, { font: HF, weight: 800, fill: INK, lh: 1.35 }),
      T('顧客・見積・受注の履歴を\n1つの画面で確認できます。\n担当が変わっても、\n経緯がすぐに分かります。', 980, 420, 820, 40, { weight: 400, fill: GR, lh: 1.7 }),
      ...['検索:顧客名・案件名から即表示', '権限:閲覧範囲を役割ごとに設定', '連携:既存の会計ソフトと接続'].flatMap((t, i) => [
        R(980, 758 + i * 70, 14, 14, G),
        T(t, 1016, 740 + i * 70, 780, 36, { weight: 500, fill: INK }),
      ]),
      ...foot(5, false, 980),
    ]),
    pg('期待効果', N, () => [
      ...head('導入後に見込める効果(試算)', 90, '#ffffff'),
      ...[['30%', '月次集計の工数削減', '現在の約12時間から\n約8時間への短縮を想定'], ['2日', '見積回答までの目安', '現在の平均5日から\n2日への短縮を想定'], ['100%', '案件状況の共有率', '全案件を同じ画面で\nいつでも確認できる']].flatMap(([n, a, b], i) => {
        const x = 120 + i * 580
        return [
          R(x, 300, 520, 3, G),
          T(n, x, 330, 520, 180, { font: EF, weight: 700, fill: G, lh: 1.1 }),
          T(a, x, 590, 520, 44, { font: HF, weight: 800, fill: '#ffffff' }),
          T(b, x, 670, 520, 36, { weight: 400, fill: '#c9d0df', lh: 1.6 }),
        ]
      }),
      T('※数値は導入前の状況をもとにした試算例です', 120, 900, 1200, 32, { weight: 400, fill: '#8d98b0' }),
      ...foot(6, true),
    ]),
    pg('導入スケジュール', '#ffffff', () => [
      ...head('3か月で立ち上げるスケジュール'),
      R(120, 519, 1680, 4, N),
      ...[['MONTH 1', '要件の確定', '現状の業務を整理し\n設定方針を決めます'], ['MONTH 2', '環境の構築', 'データ移行と\n連携の設定を行います'], ['MONTH 2-3', '試験運用', '一部の部署で\n先行して使います'], ['MONTH 3', '本番稼働', '全社展開と\n研修を実施します']].flatMap(([m, a, b], i) => {
        const x = 120 + i * 440
        return [
          T(m, x, 400, 400, 32, { font: EF, weight: 700, fill: G, spacing: 200 }),
          Ci(x + 20, 521, 20, i === 3 ? G : N),
          T(a, x, 580, 400, 44, { font: HF, weight: 800, fill: INK }),
          T(b, x, 650, 400, 36, { weight: 400, fill: GR, lh: 1.6 }),
        ]
      }),
      R(120, 850, 1680, 100, IV),
      T('各段階で状況をご報告し、必要に応じて進め方を見直します。', 160, 877, 1600, 40, { weight: 500, fill: INK }),
      ...foot(7),
    ]),
    pg('料金プラン(表)', IV, () => [
      ...head('料金プラン'),
      T('おすすめ', 960, 236, 400, 32, { weight: 700, fill: G, align: 'center', spacing: 100 }),
      put(makeTable({ rows: 4, cols: 4, header: N, border: LN, cellW: 400, cellH: 100, fontSize: 36, cells: [['', 'ライト', 'スタンダード', 'プレミアム'], ['ユーザー数', '〜10名', '〜50名', '無制限'], ['月額(税別)', '48,000円', '128,000円', '個別見積'], ['サポート', 'メール', 'メール+電話', '専任担当']] }), 160, 290),
      R(960, 290, 400, 400, NONE, 0, { stroke: G, strokeWidth: 6 }),
      T('初期費用は標準構成で200,000円(例)です。\n年間契約の場合、月額から10%割引します。', 160, 750, 1600, 36, { weight: 400, fill: GR, lh: 1.7 }),
      ...foot(8),
    ]),
    pg('導入事例', IV, () => [
      T('“', 120, 80, 300, 220, { font: EF, weight: 700, fill: G }),
      T('入力の手間が減り、\n営業が提案に使える時間が\n週に6時間ほど増えました。', 300, 400, 940, 56, { font: HF, weight: 800, fill: INK, lh: 1.6 }),
      T('製造業 営業部長 K様(例)', 300, 720, 940, 36, { weight: 500, fill: GR }),
      R(300, 800, 940, 2, LN),
      T('導入規模:従業員120名  /  導入期間:2か月', 300, 830, 940, 36, { weight: 400, fill: GR }),
      ...PH(1320, 200, 480, 640, 0, '#e0dccf'),
      ...foot(9),
    ]),
    pg('次のステップ', N, () => [
      T('次のステップ', 120, 110, 1200, 72, { font: HF, weight: 800, fill: '#ffffff' }),
      R(120, 220, 80, 4, G),
      ...[['ヒアリング', '今月中に1時間ほどお時間を'], ['正式なお見積', 'ヒアリングから5営業日'], ['キックオフ', 'ご発注から2週間以内']].flatMap(([a, b], i) => [
        T('0' + (i + 1), 120, 320 + i * 190, 140, 64, { font: EF, weight: 700, fill: G }),
        T(a, 280, 322 + i * 190, 700, 44, { font: HF, weight: 800, fill: '#ffffff' }),
        T(b, 280, 386 + i * 190, 700, 36, { weight: 400, fill: '#c9d0df' }),
      ]),
      R(1100, 300, 700, 560, 'rgba(255,255,255,0.06)', 0, { stroke: G, strokeWidth: 2 }),
      T('CONTACT', 1160, 350, 600, 32, { font: EF, weight: 700, fill: G, spacing: 400 }),
      T('ご提案担当  山田 太郎', 1160, 430, 600, 44, { font: HF, weight: 800, fill: '#ffffff' }),
      T('sales@example.com\n000-0000-0000\n平日 9:00〜18:00', 1160, 520, 600, 40, { weight: 400, fill: '#d7dcea', lh: 1.8 }),
      ...foot(10, true),
    ]),
  ]))
}
// ======== 2. 会社紹介(ミニマル白基調) ========
{
  const AC = '#2547ff', INK = '#111111', GR = '#6b7280', LN = '#e5e7eb', PALE = '#f5f5f4'
  const F = 'Zen Kaku Gothic New', M = 'Montserrat'
  const foot = (n: number, dark = false) => [
    T('Example Inc.', 120, 1000, 600, 28, { font: M, weight: 400, fill: dark ? '#9ca3af' : GR, spacing: 100 }),
    T(String(n).padStart(2, '0') + ' / 10', 1500, 1000, 300, 28, { font: M, weight: 400, fill: dark ? '#9ca3af' : GR, align: 'right', spacing: 100 }),
  ]
  const head = (en: string, t: string) => [
    T(en, 120, 90, 900, 32, { font: M, weight: 700, fill: AC, spacing: 300 }),
    T(t, 120, 142, 1680, 64, { font: F, weight: 700, fill: INK }),
  ]
  all.push(mk('ps-corp', '会社紹介 ミニマル', ['会社紹介', '企業', 'ミニマル', 'コーポレート', '白基調'], [
    pg('表紙', '#ffffff', () => [
      T('COMPANY PROFILE 2026', 120, 130, 900, 32, { font: M, weight: 700, fill: AC, spacing: 300 }),
      R(120, 296, 64, 8, AC),
      T('手間を減らして、\n人が人らしく\n働ける社会へ', 120, 350, 1000, 88, { font: F, weight: 900, fill: INK, lh: 1.35 }),
      T('エクザンプル株式会社', 120, 900, 900, 40, { font: F, weight: 500, fill: GR }),
      ...PH(1240, 120, 560, 840, 0, PALE),
    ]),
    pg('ご挨拶', '#ffffff', () => [
      ...PH(120, 160, 640, 760, 0, PALE),
      T('MESSAGE', 880, 160, 700, 32, { font: M, weight: 700, fill: AC, spacing: 300 }),
      T('小さな不便を、\nひとつずつ解く。', 880, 220, 920, 64, { font: F, weight: 700, fill: INK, lh: 1.35 }),
      T('創業以来、私たちは現場の\n「ちょっと面倒」に向き合って\nきました。大きな変革よりも、\n毎日の小さな改善が人を支え\nると信じています。', 880, 440, 920, 40, { font: F, weight: 400, fill: '#374151', lh: 1.8 }),
      T('代表取締役  山田 太郎', 880, 830, 920, 36, { font: F, weight: 700, fill: INK }),
      ...foot(2),
    ]),
    pg('ミッション', AC, () => [
      T('MISSION', 120, 130, 700, 32, { font: M, weight: 700, fill: 'rgba(255,255,255,0.7)', spacing: 300 }),
      T('働く人の時間を、\nもっと創造的に。', 120, 330, 1680, 120, { font: F, weight: 900, fill: '#ffffff', lh: 1.35 }),
      T('すべての仕事から「待つ・探す・転記する」を減らします。', 120, 760, 1680, 40, { font: F, weight: 400, fill: 'rgba(255,255,255,0.85)' }),
      ...foot(3, true),
    ]),
    pg('事業内容', '#ffffff', () => [
      ...head('BUSINESS', '3つの事業で、仕事の土台を支える'),
      ...[['クラウドサービス事業', 'ソフトウェアを自社で\n開発し、月額で\n提供しています。'], ['導入支援事業', '導入前の業務整理から\n定着までを担当者が\n伴走します。'], ['教育・研修事業', '使いこなすための\n研修と動画教材を\n用意しています。']].flatMap(([a, b], i) => {
        const x = 120 + i * 590
        return [
          R(x, 330, 500, 3, INK),
          T('0' + (i + 1), x, 370, 300, 56, { font: M, weight: 700, fill: AC }),
          T(a, x, 470, 520, 48, { font: F, weight: 700, fill: INK }),
          T(b, x, 550, 500, 36, { font: F, weight: 400, fill: '#374151', lh: 1.8 }),
        ]
      }),
      ...foot(4),
    ]),
    pg('数字で見る', PALE, () => [
      ...head('NUMBERS', '数字で見るエクザンプル'),
      ...[['2012', '創業(年)'], ['85', '社員数(名)'], ['1,200', '導入企業数(社)'], ['98', '継続率(%)']].flatMap(([n, l], i) => {
        const x = 120 + i * 430
        return [
          R(x, 360, 390, 3, INK),
          T(n, x, 400, 390, 110, { font: M, weight: 700, fill: i === 2 ? AC : INK, lh: 1.1 }),
          T(l, x, 560, 390, 36, { font: F, weight: 500, fill: GR }),
        ]
      }),
      T('2026年9月時点の数値(例)', 120, 880, 900, 32, { font: F, weight: 400, fill: GR }),
      ...foot(5),
    ]),
    pg('沿革', '#ffffff', () => [
      T('HISTORY', 120, 130, 600, 32, { font: M, weight: 700, fill: AC, spacing: 300 }),
      T('歩み', 120, 190, 600, 64, { font: F, weight: 700, fill: INK }),
      T('小さなチームから始まり、\n現在は全国のお客様の\n仕事を支えています。', 120, 330, 640, 36, { font: F, weight: 400, fill: GR, lh: 1.8 }),
      R(899, 150, 2, 740, LN),
      ...[['2012', '東京で創業。第1号のサービスを公開'], ['2015', '大阪オフィスを開設'], ['2018', '導入企業数が500社を突破'], ['2021', '教育・研修事業を開始'], ['2025', '導入企業数が1,200社を突破']].flatMap(([y, t], i) => [
        Ci(900, 175 + i * 160, 12, AC),
        T(y, 960, 140 + i * 160, 220, 48, { font: M, weight: 700, fill: AC }),
        T(t, 960, 205 + i * 160, 840, 40, { font: F, weight: 500, fill: INK }),
      ]),
      ...foot(6),
    ]),
    pg('強み', '#ffffff', () => [
      ...head('STRENGTH', '選ばれる4つの理由'),
      ...[['シンプルな操作', '説明書なしで使い始められる\n画面設計にこだわっています。'], ['日本の商習慣に対応', '請求書や押印など、国内の\n業務フローに合わせています。'], ['人が伴走する支援', '導入後も担当者が定期的に\n活用状況を確認します。'], ['安心のセキュリティ', '国内のデータセンターで\n運用し、権限管理も万全です。']].flatMap(([a, b], i) => {
        const x = 120 + (i % 2) * 880, y = 290 + Math.floor(i / 2) * 330
        return [
          R(x, y, 800, 3, INK),
          T('0' + (i + 1), x, y + 30, 160, 48, { font: M, weight: 700, fill: AC }),
          T(a, x + 150, y + 30, 640, 48, { font: F, weight: 700, fill: INK }),
          T(b, x + 150, y + 110, 650, 36, { font: F, weight: 400, fill: '#374151', lh: 1.7 }),
        ]
      }),
      ...foot(7),
    ]),
    pg('職場の紹介', PALE, () => [
      ...head('WORKPLACE', 'わたしたちの職場'),
      ...[['開放的なオフィス', '部署を越えて話しやすい\nワンフロアの執務室です。'], ['選べる働き方', '在宅勤務と出社を\n自分で組み合わせます。'], ['学びの時間', '勤務時間内の勉強会を\n毎週開催しています。']].flatMap(([a, b], i) => {
        const x = 120 + i * 590
        return [
          ...PH(x, 270, 500, 330, 0, '#e5e7eb'),
          T(a, x, 640, 500, 44, { font: F, weight: 700, fill: INK }),
          T(b, x, 710, 500, 36, { font: F, weight: 400, fill: '#374151', lh: 1.7 }),
        ]
      }),
      ...foot(8),
    ]),
    pg('会社概要', '#ffffff', () => [
      ...head('OVERVIEW', '会社概要'),
      ...[['社名', 'エクザンプル株式会社'], ['設立', '2012年4月'], ['代表者', '山田 太郎'], ['所在地', '東京都千代田区サンプル1-2-3'], ['従業員数', '85名(2026年9月)'], ['事業内容', 'クラウドサービスの開発・提供']].flatMap(([a, b], i) => [
        R(120, 270 + i * 110, 1680, 2, LN),
        T(a, 120, 302 + i * 110, 400, 36, { font: F, weight: 500, fill: GR }),
        T(b, 560, 298 + i * 110, 1240, 40, { font: F, weight: 500, fill: INK }),
      ]),
      ...foot(9),
    ]),
    pg('お問い合わせ', INK, () => [
      R(120, 250, 64, 8, AC),
      T('お気軽に\nお問い合わせください', 120, 310, 1500, 96, { font: F, weight: 900, fill: '#ffffff', lh: 1.35 }),
      T('hello@example.com\n000-0000-0000(平日 9:00〜18:00)', 120, 680, 1500, 44, { font: F, weight: 400, fill: '#d1d5db', lh: 1.8 }),
      ...foot(10, true),
    ]),
  ]))
}
// ======== 3. 事業計画・ピッチ資料(明るいスタートアップ・青×黄) ========
{
  const BL = '#2f5bff', YE = '#ffd400', INK = '#0b1437', PALE = '#eef2ff', GR = '#5b6486'
  const F = 'LINE Seed JP', P = 'Poppins'
  const foot = (n: number, c = GR, mark = BL) => [
    Ci(130, 1008, 10, mark),
    T('Kakeru', 156, 992, 400, 28, { font: P, weight: 700, fill: c }),
    T(String(n).padStart(2, '0'), 1600, 990, 200, 32, { font: P, weight: 700, fill: c, align: 'right' }),
  ]
  const head = (en: string, t: string, c = INK) => [
    T(en, 120, 90, 900, 32, { font: P, weight: 700, fill: BL, spacing: 200 }),
    T(t, 120, 140, 1680, 64, { font: F, weight: 700, fill: c }),
  ]
  all.push(mk('ps-pitch', '事業計画・ピッチ スタートアップ', ['ピッチ', '事業計画', 'スタートアップ', '資金調達', '投資家'], [
    pg('表紙', BL, () => [
      R(1240, 160, 560, 760, YE, 40),
      ...PH(1280, 200, 480, 680, 24, '#fff3a6'),
      T('SEED PITCH 2026', 120, 150, 900, 32, { font: P, weight: 700, fill: YE, spacing: 300 }),
      T('3分で終わる\n請求書業務を、\nすべての会社へ。', 120, 260, 1100, 96, { font: F, weight: 700, fill: '#ffffff', lh: 1.3 }),
      T('Kakeru Inc.   CEO 山田 太郎', 120, 840, 1000, 40, { font: F, weight: 400, fill: '#dbe4ff' }),
    ]),
    pg('課題', '#ffffff', () => [
      ...head('PROBLEM', '経理の「待ち時間」が、会社の成長を止めている'),
      T('73%', 120, 300, 800, 300, { font: P, weight: 900, fill: BL, lh: 1.05 }),
      R(120, 660, 120, 8, YE),
      T('経理担当者のうち、請求書の処理に\n月の4分の1以上を使っている人の割合', 120, 710, 900, 36, { font: F, weight: 400, fill: GR, lh: 1.7 }),
      ...['紙とメールが混在し、\n探すだけで時間がかかる', '手入力のミスが、\n支払い遅延につながる', '月末に作業が集中し、\n残業が増える'].flatMap((t, i) => [
        R(1100, 300 + i * 190, 700, 150, PALE, 24),
        T(String(i + 1), 1140, 345 + i * 190, 60, 56, { font: P, weight: 900, fill: BL }),
        T(t, 1230, 330 + i * 190, 540, 36, { font: F, weight: 700, fill: INK, lh: 1.5 }),
      ]),
      T('※自社アンケート(例)', 120, 900, 700, 28, { font: F, weight: 400, fill: GR }),
      ...foot(2),
    ]),
    pg('解決策', PALE, () => [
      ...head('SOLUTION', 'Kakeru は、請求書を撮るだけで処理します'),
      ...[['撮影する', 'スマホでパシャ。\n項目は自動で読み取り'], ['確認する', '金額と期日を\n1画面でチェック'], ['送信する', '承認から支払いまで\nワンクリックで完了']].flatMap(([a, b], i) => {
        const x = 120 + i * 600
        return [
          R(x, 300, 480, 560, '#ffffff', 32),
          Ci(x + 90, 400, 50, i === 2 ? YE : BL),
          T(String(i + 1), x + 40, 370, 100, 56, { font: P, weight: 900, fill: i === 2 ? INK : '#ffffff', align: 'center' }),
          T(a, x + 40, 500, 400, 56, { font: F, weight: 700, fill: INK }),
          T(b, x + 40, 600, 420, 36, { font: F, weight: 400, fill: GR, lh: 1.7 }),
          ...(i < 2 ? [S('arrowR', x + 505, 540, 70, BL)] : []),
        ]
      }),
      ...foot(3),
    ]),
    pg('プロダクト', '#ffffff', () => [
      ...PH(120, 120, 760, 840, 40, PALE),
      T('PRODUCT', 1000, 140, 700, 32, { font: P, weight: 700, fill: BL, spacing: 200 }),
      T('できること', 1000, 190, 800, 64, { font: F, weight: 700, fill: INK }),
      ...[['AI読み取り', '99%の精度で自動入力(例)'], ['承認ワークフロー', '社内の確認ルートを自由に設定'], ['会計ソフト連携', '主要サービスへ仕訳を自動で送信']].flatMap(([a, b], i) => [
        R(1000, 340 + i * 190, 100, 100, i === 0 ? BL : i === 1 ? YE : INK, 20),
        T(String(i + 1), 1000, 365 + i * 190, 100, 50, { font: P, weight: 900, fill: i === 1 ? INK : '#ffffff', align: 'center' }),
        T(a, 1140, 340 + i * 190, 660, 48, { font: F, weight: 700, fill: INK }),
        T(b, 1140, 406 + i * 190, 660, 36, { font: F, weight: 400, fill: GR }),
      ]),
      ...foot(4),
    ]),
    pg('市場規模', PALE, () => [
      ...head('MARKET', '国内だけでも、十分に大きな市場がある'),
      Ci(500, 620, 340, '#d9e1ff'),
      Ci(500, 740, 220, '#a9bcff'),
      Ci(500, 850, 110, BL),
      T('TAM  3.2兆円', 200, 320, 600, 36, { font: F, weight: 700, fill: INK, align: 'center' }),
      T('SAM  8,000億円', 200, 560, 600, 36, { font: F, weight: 700, fill: INK, align: 'center' }),
      T('SOM  120億円', 380, 810, 240, 32, { font: F, weight: 700, fill: '#ffffff', align: 'center' }),
      ...[['TAM', '国内の中小企業の経理業務に関わる市場全体'], ['SAM', 'そのうち請求書処理をデジタル化できる領域'], ['SOM', '5年以内に私たちが獲得を目指す範囲']].flatMap(([a, b], i) => [
        T(a, 1000, 340 + i * 190, 200, 56, { font: P, weight: 900, fill: BL }),
        T(b, 1000, 420 + i * 190, 800, 36, { font: F, weight: 400, fill: INK }),
      ]),
      T('※市場規模は例示の数値です', 1000, 910, 800, 28, { font: F, weight: 400, fill: GR }),
      ...foot(5),
    ]),
    pg('ビジネスモデル', '#ffffff', () => [
      ...head('BUSINESS MODEL', '使うほど、収益が積み上がる仕組み'),
      ...[['利用企業', '中小企業の経理チーム'], ['Kakeru', '請求・支払いを自動化'], ['取引先・金融機関', '請求書の送受信と決済']].flatMap(([a, b], i) => {
        const x = 120 + i * 600
        return [
          R(x, 290, 480, 220, i === 1 ? BL : PALE, 28),
          T(a, x + 30, 330, 420, 44, { font: F, weight: 700, fill: i === 1 ? '#ffffff' : INK, align: 'center' }),
          T(b, x + 30, 400, 420, 32, { font: F, weight: 400, fill: i === 1 ? '#dbe4ff' : GR, align: 'center' }),
          ...(i < 2 ? [S('arrowLR', x + 500, 370, 80, YE)] : []),
        ]
      }),
      ...[['4,900円', '月額利用料(1社あたり)'], ['0.5%', '決済手数料'], ['15%', '提携先への紹介料']].flatMap(([n, l], i) => [
        R(120 + i * 600, 620, 480, 6, i === 0 ? BL : YE),
        T(n, 120 + i * 600, 660, 480, 80, { font: P, weight: 900, fill: INK }),
        T(l, 120 + i * 600, 770, 480, 36, { font: F, weight: 400, fill: GR }),
      ]),
      ...foot(6),
    ]),
    pg('成長(グラフ)', '#ffffff', () => [
      ...head('TRACTION', '売上は4四半期で4倍に成長'),
      put(makeChart({ type: 'bar', labels: ['Q1', 'Q2', 'Q3', 'Q4'], values: [120, 210, 330, 480], colors: [BL, BL, BL, YE], w: 640, h: 400 }), 120, 300, 1.6),
      T('(単位:万円/月次売上の例)', 120, 940, 900, 28, { font: F, weight: 400, fill: GR }),
      R(1240, 300, 560, 600, PALE, 28),
      T('ARR', 1290, 340, 400, 32, { font: P, weight: 700, fill: BL, spacing: 200 }),
      T('4,800万円', 1290, 390, 480, 72, { font: F, weight: 700, fill: INK }),
      T('前年比', 1290, 560, 480, 32, { font: F, weight: 400, fill: GR }),
      T('+300%', 1290, 610, 480, 72, { font: P, weight: 900, fill: BL }),
      T('月次解約率', 1290, 740, 480, 32, { font: F, weight: 400, fill: GR }),
      T('1.2%', 1290, 790, 480, 72, { font: P, weight: 900, fill: INK }),
      ...foot(7),
    ]),
    pg('競合比較(表)', PALE, () => [
      ...head('COMPARISON', '他の方法と比べた、Kakeruの強み'),
      put(makeTable({ rows: 5, cols: 4, header: INK, border: '#d3daf0', cellW: 400, cellH: 88, fontSize: 34, cells: [['', 'Kakeru', 'A社(例)', '手作業'], ['入力の手間', '自動', '一部自動', 'すべて手入力'], ['月額', '4,900円〜', '9,800円〜', '0円'], ['導入期間', '即日', '1か月', '—'], ['電子帳簿保存', '対応', '対応', '要対応']] }), 160, 280),
      R(560, 280, 400, 440, NONE, 0, { stroke: BL, strokeWidth: 6 }),
      T('※競合の情報は一般公開の例を簡略化したものです', 160, 790, 1400, 28, { font: F, weight: 400, fill: GR }),
      ...foot(8),
    ]),
    pg('チーム', '#ffffff', () => [
      ...head('TEAM', '経理と開発、両方の現場を知るメンバー'),
      ...[['山田 太郎', 'CEO', '大手商社で10年、\n法人営業を担当'], ['佐藤 花子', 'CTO', '会計ソフトの開発\nに8年携わる'], ['鈴木 一郎', 'COO', '士業事務所の運営\nと経理の経験']].flatMap(([a, r, b], i) => {
        const x = 120 + i * 600
        return [
          ...PH(x, 290, 280, 280, 140, PALE),
          T(a, x, 610, 480, 48, { font: F, weight: 700, fill: INK }),
          T(r, x, 678, 480, 32, { font: P, weight: 700, fill: BL, spacing: 200 }),
          T(b, x, 740, 480, 36, { font: F, weight: 400, fill: GR, lh: 1.6 }),
        ]
      }),
      ...foot(9),
    ]),
    pg('資金調達(グラフ)', PALE, () => [
      ...head('FUNDING', '調達額と資金の使い道'),
      put(makeChart({ type: 'donut', labels: ['開発', '営業・採用', 'マーケ', '予備'], values: [50, 30, 15, 5], colors: [BL, YE, '#7d97ff', '#c6cfee'], w: 700, h: 400 }), 120, 310, 1.5),
      R(1260, 290, 540, 560, '#ffffff', 28),
      T('ASK', 1310, 330, 300, 32, { font: P, weight: 700, fill: BL, spacing: 200 }),
      T('1.5億円', 1310, 380, 460, 100, { font: F, weight: 700, fill: INK }),
      T('調達目標(シード)', 1310, 520, 460, 36, { font: F, weight: 400, fill: GR }),
      T('調達後18か月で\n月次売上3,000万円を\n目指します', 1310, 620, 460, 36, { font: F, weight: 700, fill: INK, lh: 1.6 }),
      ...foot(10),
    ]),
    pg('クロージング', YE, () => [
      T('THANK YOU', 120, 150, 900, 32, { font: P, weight: 700, fill: INK, spacing: 300 }),
      T('いっしょに、\n経理の“待ち時間”を\nなくしませんか。', 120, 260, 1500, 104, { font: F, weight: 700, fill: INK, lh: 1.3 }),
      R(120, 720, 120, 8, INK),
      T('founder@example.com   /   000-0000-0000', 120, 780, 1500, 40, { font: P, weight: 700, fill: INK }),
      ...foot(11, INK, INK),
    ]),
  ]))
}
// ======== 4. 採用説明会(和モダン) ========
{
  const WA = '#f5efe3', SU = '#2a2623', AI = '#1f3a5f', SHU = '#c43e2b', LN = '#d8cdb8', GR = '#7a7060'
  const MI = 'Shippori Mincho', GO = 'Zen Kaku Gothic New'
  const foot = (n: number, dark = false) => [
    T('RECRUIT 2027  エクザンプル株式会社', 120, 1004, 900, 28, { font: GO, weight: 400, fill: dark ? '#9fb0c8' : GR, spacing: 80 }),
    T(String(n).padStart(2, '0'), 1600, 994, 200, 34, { font: MI, weight: 800, fill: SHU, align: 'right' }),
  ]
  const head = (t: string, c = SU) => [
    R(120, 108, 10, 64, SHU),
    T(t, 160, 98, 1600, 64, { font: MI, weight: 800, fill: c }),
  ]
  /** 数字の見積もり幅(単位の位置決め用) */
  const nw = (s: string, size: number) => Array.from(s).reduce((a, c) => a + (c === '.' ? size * 0.3 : size * 0.66), 0)
  all.push(mk('ps-recruit', '採用説明会 和モダン', ['採用', '説明会', '新卒', '和モダン', '会社説明'], [
    pg('表紙', WA, () => [
      new VText({ text: 'ひとの手で、\n未来をつくる。', fontFamily: MI, fontSize: 96, fontWeight: 800, maxChars: 8, fill: SU, left: 1360, top: 190 }),
      R(140, 200, 80, 80, SHU),
      T('採', 140, 214, 80, 52, { font: MI, weight: 800, fill: '#ffffff', align: 'center' }),
      T('会社説明会資料', 140, 330, 900, 72, { font: MI, weight: 800, fill: SU }),
      T('2027年度  新卒採用', 140, 440, 900, 44, { font: GO, weight: 500, fill: GR }),
      R(140, 540, 120, 4, AI),
      T('エクザンプル株式会社', 140, 900, 900, 44, { font: MI, weight: 700, fill: AI }),
    ]),
    pg('私たちについて', WA, () => [
      R(0, 0, 640, 1080, AI),
      T('ABOUT US', 100, 120, 460, 32, { font: 'Montserrat', weight: 700, fill: '#9fb0c8', spacing: 300 }),
      T('私たちに\nついて', 100, 180, 480, 80, { font: MI, weight: 800, fill: '#ffffff', lh: 1.35 }),
      R(100, 420, 80, 4, SHU),
      T('クラウドサービスで、\n全国の中小企業の\n仕事を支えています。', 800, 130, 1000, 56, { font: MI, weight: 700, fill: SU, lh: 1.6 }),
      T('創業から14年、お客様は全国2,000社。\n堅実な経営を続けながら、新しい挑戦も\n社員の提案から生まれています。', 800, 420, 1000, 40, { font: GO, weight: 400, fill: '#4a4238', lh: 1.8 }),
      ...[['設立', '2012年4月'], ['社員数', '85名(平均年齢33歳)'], ['拠点', '東京・大阪・福岡']].flatMap(([a, b], i) => [
        R(800, 700 + i * 90, 1000, 2, LN),
        T(a, 800, 726 + i * 90, 260, 36, { font: GO, weight: 500, fill: GR }),
        T(b, 1080, 722 + i * 90, 720, 40, { font: GO, weight: 500, fill: SU }),
      ]),
      ...foot(2),
    ]),
    pg('数字で見る働き方', WA, () => [
      ...head('数字で見る、はたらき方'),
      ...[['12', '時間/月', '月平均の残業時間'], ['92', '%', '有給休暇の取得率'], ['68', '%', '男性の育児休業取得率'], ['9.4', '年', '平均勤続年数']].flatMap(([n, u, l], i) => {
        const x = 120 + i * 430
        return [
          R(x, 290, 390, 520, '#ffffff'),
          R(x, 290, 390, 8, i === 0 ? SHU : AI),
          T(n, x + 36, 370, 300, 110, { font: MI, weight: 800, fill: AI, lh: 1.1 }),
          T(u, x + 36 + nw(n, 110) + 8, 430, 200, 40, { font: GO, weight: 700, fill: SU }),
          T(l, x + 36, 560, 330, 36, { font: GO, weight: 500, fill: GR, lh: 1.5 }),
        ]
      }),
      T('2026年度実績(例)', 120, 870, 900, 32, { font: GO, weight: 400, fill: GR }),
      ...foot(3),
    ]),
    pg('求める人物像', WA, () => [
      ...head('私たちが大切にする3つの姿勢'),
      ...[['聴', '相手の話を、最後まで聴ける人', 'お客様の言葉の奥にある課題を\n丁寧に拾い上げられること'], ['挑', '前例のない仕事にも挑める人', '正解のない問いにも、まず\n一歩目を踏み出せること'], ['継', '小さな改善を続けられる人', '地道な工夫を積み重ねて、\n仕事の質を高められること']].flatMap(([k, a, b], i) => [
        R(120, 280 + i * 220, 160, 180, AI),
        T(k, 120, 310 + i * 220, 160, 100, { font: MI, weight: 800, fill: '#ffffff', align: 'center' }),
        T(a, 340, 276 + i * 220, 1460, 48, { font: MI, weight: 700, fill: SU }),
        T(b, 340, 346 + i * 220, 1460, 36, { font: GO, weight: 400, fill: '#4a4238', lh: 1.5 }),
      ]),
      ...foot(4),
    ]),
    pg('仕事内容', WA, () => [
      ...head('3つの職種'),
      ...[['営業職', '企業の課題を聞き取り、\n最適な使い方を\n提案します。', '採用予定 4名'], ['開発職', 'お客様の声をもとに、\n新しい機能を設計し\n形にします。', '採用予定 3名'], ['サポート職', '導入後の活用を支え、\n満足度の向上に\n取り組みます。', '採用予定 1名']].flatMap(([a, b, c], i) => {
        const x = 120 + i * 600
        return [
          R(x, 270, 480, 560, '#ffffff'),
          R(x, 270, 480, 110, i === 0 ? AI : i === 1 ? SU : SHU),
          T(a, x + 36, 298, 410, 52, { font: MI, weight: 800, fill: '#ffffff' }),
          T(b, x + 36, 430, 420, 36, { font: GO, weight: 400, fill: '#4a4238', lh: 1.8 }),
          R(x + 36, 730, 408, 2, LN),
          T(c, x + 36, 756, 410, 36, { font: GO, weight: 700, fill: SU }),
        ]
      }),
      ...foot(5),
    ]),
    pg('1日の流れ', WA, () => [
      ...head('営業職の1日'),
      R(332, 270, 3, 650, LN),
      ...[['9:30', '朝会で今日の予定を共有'], ['10:30', 'お客様のもとへ訪問'], ['12:30', 'チームでランチ'], ['14:00', '提案資料の作成'], ['16:30', '先輩とのふりかえり'], ['18:00', '退社(残業は月12時間ほど)']].flatMap(([t, a], i) => [
        Ci(334, 305 + i * 112, 11, SHU),
        T(t, 120, 280 + i * 112, 180, 44, { font: 'Montserrat', weight: 700, fill: AI, align: 'right' }),
        T(a, 380, 280 + i * 112, 760, 40, { font: GO, weight: 500, fill: SU }),
      ]),
      ...PH(1260, 270, 540, 650, 0, '#e6dec9'),
      ...foot(6),
    ]),
    pg('先輩の声', WA, () => [
      ...PH(120, 150, 480, 700, 0, '#e6dec9'),
      T('「', 720, 150, 200, 120, { font: MI, weight: 800, fill: SHU }),
      T('最初の半年は\n分からないことばかり。\nでも、聞けば誰かが\n必ず答えてくれました。', 720, 320, 1080, 56, { font: MI, weight: 700, fill: SU, lh: 1.6 }),
      R(720, 730, 80, 4, SHU),
      T('入社3年目  営業職  T.Sさん(例)', 720, 770, 1080, 36, { font: GO, weight: 500, fill: GR }),
      ...foot(7),
    ]),
    pg('募集要項', WA, () => [
      ...head('募集要項'),
      ...[['募集職種', '営業職 / 開発職 / サポート職'], ['初任給', '月給 260,000円(例)'], ['勤務地', '東京・大阪・福岡'], ['休日', '完全週休2日制(年間休日125日)'], ['福利厚生', '住宅手当・資格取得支援・書籍購入補助']].flatMap(([a, b], i) => [
        R(120, 270 + i * 130, 1680, 2, LN),
        T(a, 120, 310 + i * 130, 360, 40, { font: GO, weight: 500, fill: GR }),
        T(b, 540, 306 + i * 130, 1260, 44, { font: GO, weight: 500, fill: SU }),
      ]),
      R(120, 920, 1680, 2, LN),
      ...foot(8),
    ]),
    pg('選考フロー', WA, () => [
      ...head('選考の流れ'),
      R(168, 369, 1500, 3, LN),
      ...[['エントリー', 'マイページから\n登録します'], ['適性検査', 'オンラインで\n受験できます'], ['面接(2回)', '1回目は\n現場社員と'], ['内定', '最終面接の\n翌週にご連絡'], ['入社準備', '内定者向けの\n交流会があります']].flatMap(([a, b], i) => {
        const x = 120 + i * 340
        return [
          Ci(x + 48, 370, 48, i === 3 ? SHU : AI),
          T(String(i + 1), x, 342, 96, 52, { font: MI, weight: 800, fill: '#ffffff', align: 'center' }),
          T(a, x, 460, 320, 44, { font: MI, weight: 800, fill: SU }),
          T(b, x, 530, 320, 36, { font: GO, weight: 400, fill: '#4a4238', lh: 1.6 }),
        ]
      }),
      R(120, 800, 1680, 110, '#ffffff'),
      T('最短3週間で内定。面接はオンラインでも受けられます。', 160, 828, 1600, 40, { font: GO, weight: 500, fill: SU }),
      ...foot(9),
    ]),
    pg('エントリー', AI, () => [
      R(1500, 140, 120, 120, SHU),
      T('応', 1500, 164, 120, 72, { font: MI, weight: 800, fill: '#ffffff', align: 'center' }),
      T('お会いできる日を、\n楽しみにしています。', 120, 300, 1300, 88, { font: MI, weight: 800, fill: '#ffffff', lh: 1.45 }),
      R(120, 640, 120, 4, SHU),
      T('エントリー締切  2026年12月25日', 120, 690, 1400, 44, { font: GO, weight: 700, fill: '#ffffff' }),
      T('recruit@example.com   /   000-0000-0000', 120, 770, 1400, 40, { font: GO, weight: 400, fill: '#c9d4e4' }),
      ...foot(10, true),
    ]),
  ]))
}

// ======== 5. 社内研修・セミナー(ティール×オレンジ・親しみやすい) ========
{
  const TL = '#0f766e', OR = '#f59e0b', BG = '#f3faf7', INK = '#16302d', GR = '#5a6e6b', LN = '#cfe3dd', PALE = '#e1f2ec'
  const F = 'Zen Maru Gothic'
  const foot = (n: number, dark = false) => [
    T('新入社員研修  第2回  コミュニケーション基礎', 120, 1010, 1100, 26, { font: F, weight: 500, fill: dark ? '#a8d5cc' : GR }),
    T(String(n).padStart(2, '0'), 1620, 1000, 180, 38, { font: 'Montserrat', weight: 700, fill: dark ? OR : TL, align: 'right' }),
  ]
  const head = (k: string, t: string, dark = false) => [
    R(120, 92, 14, 14, OR, 7),
    T(k, 150, 80, 900, 28, { font: 'Montserrat', weight: 700, fill: dark ? OR : TL, spacing: 200 }),
    T(t, 120, 132, 1680, 62, { font: F, weight: 900, fill: dark ? '#ffffff' : INK }),
  ]
  all.push(mk('ps-train', '社内研修・セミナー ティール×オレンジ', ['研修', 'セミナー', '社内', '新人研修', 'ワークショップ'], [
    pg('表紙', TL, () => [
      Ci(1560, 300, 420, '#14877d'), Ci(1700, 860, 260, OR),
      T('TRAINING SEMINAR', 120, 200, 900, 30, { font: 'Montserrat', weight: 700, fill: OR, spacing: 400 }),
      T('伝わる報告・連絡・相談\nコミュニケーション\n基礎研修', 120, 290, 1200, 92, { font: F, weight: 900, fill: '#ffffff', lh: 1.3 }),
      R(120, 690, 120, 8, OR),
      T('新入社員研修  第2回  |  所要 90分', 120, 740, 1100, 36, { font: F, weight: 500, fill: '#d6efe9' }),
      T('人事部  研修担当  2026年10月', 120, 960, 1100, 30, { font: F, weight: 500, fill: '#a8d5cc' }),
    ]),
    pg('本日のゴール', BG, () => [
      ...head('TODAY\'S GOAL', '今日のゴール'),
      T('研修が終わったとき、次の3つができる状態を目指します。', 120, 230, 1680, 34, { font: F, weight: 500, fill: GR }),
      ...[['結論から伝える', '要点を30秒で話せるようになる'], ['タイミングを判断する', '報告・連絡・相談を使い分ける'], ['相手に合わせて話す', '上司・同僚・お客さまで伝え方を変える']].flatMap(([a, b], i) => {
        const x = 120 + i * 580
        return [
          R(x, 340, 520, 560, '#ffffff', 28, { stroke: LN, strokeWidth: 3 }),
          Ci(x + 100, 460, 56, TL),
          T(String(i + 1), x + 44, 420, 112, 70, { font: 'Montserrat', weight: 900, fill: '#ffffff', align: 'center', lh: 1.1 }),
          T(a, x + 44, 570, 440, 44, { font: F, weight: 900, fill: INK }),
          T(b, x + 44, 650, 440, 32, { font: F, weight: 500, fill: GR, lh: 1.7 }),
        ]
      }),
      ...foot(2),
    ]),
    pg('当日の流れ', '#ffffff', () => [
      ...head('SCHEDULE', '90分の進め方'),
      R(120, 470, 1680, 6, LN),
      ...[['0:00', '導入', '10分', 'ねらいの共有'], ['0:10', '講義', '25分', '基本の型を学ぶ'], ['0:35', 'ワーク', '30分', '3人1組で練習'], ['1:05', '発表', '15分', '各組から共有'], ['1:20', 'まとめ', '10分', '振り返りと質問']].flatMap(([t, a, m, d], i) => {
        const x = 120 + i * 340
        return [
          T(t, x, 380, 300, 36, { font: 'Montserrat', weight: 700, fill: TL }),
          Ci(x + 16, 473, 16, i === 2 ? OR : TL),
          T(a, x, 530, 300, 46, { font: F, weight: 900, fill: INK }),
          T(m, x, 600, 300, 32, { font: F, weight: 700, fill: OR }),
          T(d, x, 660, 300, 30, { font: F, weight: 500, fill: GR, lh: 1.5 }),
        ]
      }),
      R(120, 840, 1680, 110, PALE, 20),
      T('途中の質問は、いつでも手を挙げてどうぞ。チャットでも受け付けます。', 160, 875, 1600, 36, { font: F, weight: 700, fill: INK }),
      ...foot(3),
    ]),
    pg('基本の型(PREP)', BG, () => [
      ...head('BASIC', '話し方の基本は「PREP法」'),
      ...[['P', 'Point', '結論', 'まず結論を\n一言で伝える', TL], ['R', 'Reason', '理由', '理由を\n1つに絞る', '#14877d'], ['E', 'Example', '具体例', '数字や事実で\n裏づける', '#2aa396'], ['P', 'Point', '結論', 'もう一度\n結論でしめる', OR]].flatMap(([k, e, j, d, c], i) => {
        const x = 120 + i * 430
        return [
          R(x, 310, 390, 560, '#ffffff', 28, { stroke: LN, strokeWidth: 3 }),
          R(x, 310, 390, 190, c, 28),
          R(x, 400, 390, 100, c),
          T(k, x, 325, 390, 110, { font: 'Montserrat', weight: 900, fill: '#ffffff', align: 'center', lh: 1 }),
          T(e, x, 455, 390, 32, { font: 'Montserrat', weight: 700, fill: '#ffffff', align: 'center', spacing: 100 }),
          T(j, x, 550, 390, 48, { font: F, weight: 900, fill: INK, align: 'center' }),
          T(d, x + 30, 640, 330, 32, { font: F, weight: 500, fill: GR, align: 'center', lh: 1.7 }),
        ]
      }),
      T('例:「A社の見積は今日中に出せます。理由は、条件がすでに揃っているからです。…」', 120, 910, 1680, 32, { font: F, weight: 500, fill: GR }),
      ...foot(4),
    ]),
    pg('良い例・悪い例', '#ffffff', () => [
      ...head('COMPARE', '報告の仕方、どちらが伝わる?'),
      R(120, 260, 810, 620, '#fdf2f2', 28),
      R(990, 260, 810, 620, PALE, 28),
      T('NG', 160, 290, 200, 50, { font: 'Montserrat', weight: 900, fill: '#dc2626' }),
      T('経緯から話し始める', 160, 360, 730, 40, { font: F, weight: 900, fill: INK }),
      T('「昨日の打合せの後で、課長に聞いたら、先方がいろいろ言っていて……」', 160, 440, 730, 32, { font: F, weight: 500, fill: GR, lh: 1.8 }),
      T('結論が最後まで出ず、聞き手は何を判断すればよいか分かりません。', 160, 660, 730, 30, { font: F, weight: 500, fill: '#b91c1c', lh: 1.7 }),
      T('OK', 1030, 290, 200, 50, { font: 'Montserrat', weight: 900, fill: TL }),
      T('結論から話し始める', 1030, 360, 730, 40, { font: F, weight: 900, fill: INK }),
      T('「B社の納期を1週間延ばしたいとのご要望です。理由は先方の仕様変更です。」', 1030, 440, 730, 32, { font: F, weight: 500, fill: GR, lh: 1.8 }),
      T('最初の一言で要点が分かり、すぐに判断や指示ができます。', 1030, 660, 730, 30, { font: F, weight: 500, fill: TL, lh: 1.7 }),
      ...foot(5),
    ]),
    pg('事例(写真+文)', BG, () => [
      ...PH(960, 0, 960, 1080, 0, '#cfe3dd'),
      T('CASE STUDY', 120, 160, 700, 28, { font: 'Montserrat', weight: 700, fill: TL, spacing: 300 }),
      T('小さな相談が、\n大きなミスを\n防いだ話', 120, 220, 780, 64, { font: F, weight: 900, fill: INK, lh: 1.35 }),
      T('入社2年目のAさんは、納品前に「念のため」と先輩へ確認。数量の入力ミスが見つかり、出荷前に修正できました。', 120, 540, 760, 32, { font: F, weight: 500, fill: GR, lh: 1.8 }),
      R(120, 800, 760, 120, PALE, 20),
      T('ポイント:迷ったら、早めに相談', 150, 835, 700, 36, { font: F, weight: 900, fill: TL }),
      ...foot(6),
    ]),
    pg('グループワーク', '#ffffff', () => [
      ...head('WORK', 'グループワーク(30分)'),
      T('3人1組で、「報告の練習」をします。', 120, 230, 1680, 34, { font: F, weight: 500, fill: GR }),
      ...[['役割を決める', '報告する人・聞く人・\n観察する人を決めます'], ['お題を1つ選ぶ', '配布シートのお題から\n1つ選びます'], ['1分で報告', '結論から1分以内で\n報告します'], ['フィードバック', '良かった点と改善点を\n伝え合い、役割を交代']].flatMap(([a, b], i) => {
        const x = 120 + i * 430
        return [
          R(x, 340, 390, 480, BG, 24),
          T(String(i + 1), x + 36, 370, 120, 80, { font: 'Montserrat', weight: 900, fill: OR }),
          T(a, x + 36, 500, 330, 40, { font: F, weight: 900, fill: INK }),
          T(b, x + 36, 580, 330, 30, { font: F, weight: 500, fill: GR, lh: 1.7 }),
        ]
      }),
      R(120, 860, 1680, 100, TL, 20),
      T('制限時間 30分  /  発表は各組1分', 160, 890, 1600, 40, { font: F, weight: 900, fill: '#ffffff' }),
      ...foot(7),
    ]),
    pg('チェックリスト', BG, () => [
      ...head('CHECK', '報告の前の5つの確認'),
      ...['結論を一言で言えるか', '事実と意見を分けているか', '数字・日付は正確か', '相手の知りたいことに答えているか', '次にやることを示しているか'].flatMap((t, i) => [
        R(120, 270 + i * 130, 1680, 110, '#ffffff', 20, { stroke: LN, strokeWidth: 3 }),
        Ci(200, 325 + i * 130, 32, TL),
        S('check', 178, 303 + i * 130, 44, '#ffffff'),
        T(t, 280, 303 + i * 130, 1400, 40, { font: F, weight: 700, fill: INK }),
      ]),
      ...foot(8),
    ]),
    pg('理解度クイズ', TL, () => [
      ...head('QUIZ', '理解度チェック', true),
      T('Q.', 120, 280, 160, 110, { font: 'Montserrat', weight: 900, fill: OR }),
      T('上司が忙しそうなとき、\n急ぎでない連絡はどうする?', 300, 300, 1500, 60, { font: F, weight: 900, fill: '#ffffff', lh: 1.4 }),
      ...[['A', 'すぐに話しかける'], ['B', 'メモにまとめて、手が空いた時に伝える'], ['C', '何もしない']].flatMap(([k, t], i) => [
        R(120 + i * 580, 620, 520, 240, i === 1 ? '#ffffff' : '#14877d', 24),
        T(k, 160 + i * 580, 650, 120, 80, { font: 'Montserrat', weight: 900, fill: i === 1 ? TL : OR, lh: 1 }),
        T(t, 160 + i * 580, 750, 440, 32, { font: F, weight: 700, fill: i === 1 ? INK : '#ffffff', lh: 1.5 }),
      ]),
      ...foot(9, true),
    ]),
    pg('まとめ', BG, () => [
      ...head('SUMMARY', '今日のまとめ'),
      ...[['結論ファースト', 'PREP法で、最初に結論を伝える'], ['早めの相談', '迷ったら、小さいうちに声をかける'], ['相手に合わせる', '相手の立場で、必要な情報を選ぶ']].flatMap(([a, b], i) => [
        R(120, 290 + i * 210, 1680, 180, '#ffffff', 24, { stroke: LN, strokeWidth: 3 }),
        R(120, 290 + i * 210, 16, 180, i === 1 ? OR : TL),
        T('0' + (i + 1), 180, 335 + i * 210, 160, 80, { font: 'Montserrat', weight: 900, fill: i === 1 ? OR : TL }),
        T(a, 360, 322 + i * 210, 1360, 44, { font: F, weight: 900, fill: INK }),
        T(b, 360, 392 + i * 210, 1360, 32, { font: F, weight: 500, fill: GR }),
      ]),
      T('宿題:今週、1件だけ「結論から」報告してみましょう。', 120, 930, 1680, 36, { font: F, weight: 900, fill: TL }),
      ...foot(10),
    ]),
    pg('質問・連絡先', TL, () => [
      Ci(1600, 900, 380, '#14877d'),
      T('THANK YOU', 120, 220, 900, 30, { font: 'Montserrat', weight: 700, fill: OR, spacing: 400 }),
      T('ご質問は\nいつでもどうぞ', 120, 300, 1300, 100, { font: F, weight: 900, fill: '#ffffff', lh: 1.3 }),
      R(120, 640, 120, 8, OR),
      T('人事部 研修担当  内線 000\ntraining@example.com', 120, 700, 1300, 38, { font: F, weight: 500, fill: '#d6efe9', lh: 1.7 }),
      ...foot(11, true),
    ]),
  ]))
}
// ======== 6. 四半期の業績報告(ネイビー×シアン・グラフ/表) ========
{
  const NV = '#12233f', CY = '#06a3c7', OR = '#f97316', BG = '#f4f7fb', INK = '#16233a', GR = '#5f6b7f', LN = '#d5dde9', GN = '#16a34a', RD = '#dc2626'
  const foot = (n: number, dark = false) => [
    T('2026年度 第2四半期 業績報告', 120, 1010, 900, 26, { weight: 400, fill: dark ? '#8fa0bd' : GR }),
    T(String(n).padStart(2, '0'), 1620, 1000, 180, 38, { font: 'Montserrat', weight: 700, fill: dark ? CY : NV, align: 'right' }),
  ]
  const head = (k: string, t: string, dark = false) => [
    T(k, 120, 80, 900, 28, { font: 'Montserrat', weight: 700, fill: CY, spacing: 300 }),
    T(t, 120, 124, 1680, 62, { weight: 900, fill: dark ? '#ffffff' : INK }),
    R(120, 214, 80, 5, CY),
  ]
  all.push(mk('ps-quarter', '四半期の業績報告 ネイビー×シアン', ['業績報告', '四半期', '決算', 'グラフ', '表', '経営会議'], [
    pg('表紙', NV, () => [
      R(0, 0, 24, 1080, CY),
      T('QUARTERLY REPORT', 120, 200, 900, 30, { font: 'Montserrat', weight: 700, fill: CY, spacing: 400 }),
      T('2026年度\n第2四半期\n業績報告', 120, 290, 1100, 110, { weight: 900, fill: '#ffffff', lh: 1.25 }),
      R(120, 760, 120, 6, CY),
      T('対象期間:2026年7月〜9月', 120, 810, 1100, 36, { weight: 400, fill: '#c3cfe4' }),
      T('経営企画部  |  取締役会資料', 120, 960, 1100, 30, { weight: 400, fill: '#8fa0bd' }),
      ...PH(1320, 120, 480, 840, 0, '#1d3560'),
    ]),
    pg('サマリー(KPI)', BG, () => [
      ...head('HIGHLIGHTS', '今期のハイライト'),
      ...[['売上高', '4億8,200万円', '+12.4%', GN], ['営業利益', '5,600万円', '+8.1%', GN], ['新規顧客数', '86社', '+21社', GN], ['解約率', '1.8%', '+0.3pt', RD]].flatMap(([a, v, d, c], i) => {
        const x = 120 + (i % 2) * 850, y = 270 + Math.floor(i / 2) * 330
        return [
          R(x, y, 830, 290, '#ffffff', 24, { stroke: LN, strokeWidth: 3 }),
          R(x, y, 12, 290, CY),
          T(a, x + 60, y + 36, 700, 34, { weight: 700, fill: GR }),
          T(v, x + 60, y + 100, 740, 84, { font: 'Montserrat', weight: 700, fill: INK }),
          T('前年同期比  ' + d, x + 60, y + 220, 740, 32, { weight: 700, fill: c as string }),
        ]
      }),
      T('※数値はサンプルです', 120, 950, 900, 26, { weight: 400, fill: GR }),
      ...foot(2),
    ]),
    pg('売上推移(棒グラフ)', '#ffffff', () => [
      ...head('SALES', '売上高の推移'),
      put(makeChart({ type: 'bar', labels: ['Q3', 'Q4', 'Q1', 'Q2'], values: [3.9, 4.1, 4.3, 4.8], colors: [LN, LN, LN, CY], w: 640, h: 400 }), 120, 270, 1.6),
      R(1220, 270, 580, 640, BG, 24),
      T('読み取りのポイント', 1260, 310, 500, 36, { weight: 900, fill: INK }),
      T('・直近4期で最高の売上\n・新規契約が牽引\n・前期比で+0.5億円\n\n単位:億円', 1260, 380, 500, 32, { weight: 400, fill: GR, lh: 1.9 }),
      ...foot(3),
    ]),
    pg('部門別(ドーナツ)', BG, () => [
      ...head('SEGMENT', '部門別の売上構成'),
      put(makeChart({ type: 'donut', labels: ['法人営業', '店舗', 'EC', 'その他'], values: [46, 28, 20, 6], colors: [NV, CY, OR, LN], w: 640, h: 400 }), 120, 270, 1.5),
      ...[['法人営業', '46%', NV], ['店舗', '28%', CY], ['EC', '20%', OR], ['その他', '6%', LN]].flatMap(([a, v, c], i) => [
        R(1160, 300 + i * 150, 28, 28, c as string, 6),
        T(a, 1220, 292 + i * 150, 320, 40, { weight: 700, fill: INK }),
        T(v, 1560, 288 + i * 150, 240, 48, { font: 'Montserrat', weight: 700, fill: INK, align: 'right' }),
        R(1160, 360 + i * 150, 640, 2, LN),
      ]),
      ...foot(4),
    ]),
    pg('実績表', '#ffffff', () => [
      ...head('RESULTS', '計画に対する実績'),
      put(makeTable({ rows: 6, cols: 5, header: NV, border: LN, cellW: 336, cellH: 106, fontSize: 32, cells: [['項目', '計画', '実績', '達成率', '前年比'], ['売上高', '4.6億', '4.82億', '104.8%', '+12.4%'], ['粗利益', '2.3億', '2.41億', '104.8%', '+10.2%'], ['販管費', '1.8億', '1.85億', '102.8%', '+7.5%'], ['営業利益', '0.5億', '0.56億', '112.0%', '+8.1%'], ['新規顧客', '70社', '86社', '122.9%', '+21社']] }), 120, 270),
      T('※単位は億円。達成率は計画値に対する実績の割合', 120, 930, 1680, 26, { weight: 400, fill: GR }),
      ...foot(5),
    ]),
    pg('前年比(折れ線)', BG, () => [
      ...head('TREND', '月次売上の推移'),
      put(makeChart({ type: 'line', labels: ['4月', '5月', '6月', '7月', '8月', '9月'], values: [1.5, 1.4, 1.6, 1.5, 1.6, 1.7], colors: [CY], w: 640, h: 400 }), 120, 270, 1.6),
      R(1220, 270, 580, 640, '#ffffff', 24, { stroke: LN, strokeWidth: 3 }),
      T('月ごとの動き', 1260, 310, 500, 36, { weight: 900, fill: INK }),
      T('・8月は夏季休暇の影響が軽微\n・9月は期末の駆け込みで\n  今期最高を記録\n\n単位:億円', 1260, 380, 500, 32, { weight: 400, fill: GR, lh: 1.9 }),
      ...foot(6),
    ]),
    pg('コスト(横棒)', '#ffffff', () => [
      ...head('COST', '費用の内訳'),
      put(makeChart({ type: 'hbar', labels: ['人件費', '広告費', '物流費', '地代家賃', 'その他'], values: [8200, 4300, 2800, 1900, 1300], colors: [NV, NV, NV, NV, NV], w: 640, h: 400 }), 120, 270, 1.6),
      R(1220, 270, 580, 640, BG, 24),
      T('注目点', 1260, 310, 500, 36, { weight: 900, fill: INK }),
      T('・広告費が計画比で+8%\n・物流費は拠点統合で\n  前期から横ばい\n\n単位:万円', 1260, 380, 500, 32, { weight: 400, fill: GR, lh: 1.9 }),
      ...foot(7),
    ]),
    pg('増減の要因', BG, () => [
      ...head('FACTORS', '増減の主な要因'),
      R(120, 270, 810, 640, '#ffffff', 24, { stroke: GN, strokeWidth: 4 }),
      R(990, 270, 810, 640, '#ffffff', 24, { stroke: RD, strokeWidth: 4 }),
      T('増加の要因', 160, 310, 730, 44, { weight: 900, fill: GN }),
      T('・新プランの契約が好調\n・既存顧客のアップセル\n・ECのキャンペーン効果', 160, 400, 730, 36, { weight: 500, fill: INK, lh: 1.9 }),
      T('減少・課題の要因', 1030, 310, 730, 44, { weight: 900, fill: RD }),
      T('・店舗の来店数が前年を下回る\n・広告単価の上昇\n・一部商品の欠品による機会損失', 1030, 400, 730, 36, { weight: 500, fill: INK, lh: 1.9 }),
      ...foot(8),
    ]),
    pg('次期の施策', '#ffffff', () => [
      ...head('ACTION', '次期に向けた3つの施策'),
      ...[['新規開拓の強化', '法人営業を2名増員し、\n新規商談を月20件に拡大'], ['在庫の最適化', '需要予測を見直し、\n欠品率を1%未満に'], ['広告の効率化', '成果の低い媒体を整理し、\n獲得単価を10%下げる']].flatMap(([a, b], i) => {
        const x = 120 + i * 580
        return [
          R(x, 290, 520, 600, BG, 24),
          R(x, 290, 520, 8, i === 1 ? OR : CY),
          T('0' + (i + 1), x + 44, 340, 200, 80, { font: 'Montserrat', weight: 900, fill: i === 1 ? OR : CY }),
          T(a, x + 44, 460, 440, 44, { weight: 900, fill: INK }),
          T(b, x + 44, 550, 440, 32, { weight: 400, fill: GR, lh: 1.8 }),
        ]
      }),
      ...foot(9),
    ]),
    pg('次期目標', NV, () => [
      ...head('OUTLOOK', '第3四半期の目標', true),
      ...[['5.2億円', '売上高'], ['6,500万円', '営業利益'], ['100社', '新規顧客']].flatMap(([v, a], i) => {
        const x = 120 + i * 580
        return [
          R(x, 320, 520, 3, CY),
          T(v, x, 360, 520, 84, { weight: 900, fill: '#ffffff' }),
          T(a, x, 480, 520, 40, { weight: 700, fill: CY }),
        ]
      }),
      R(120, 680, 1680, 200, '#1d3560', 24),
      T('達成に向けて、毎月の経営会議で進捗を確認します。\n計画との差が出た場合は、翌月に打ち手を見直します。', 170, 720, 1580, 36, { weight: 400, fill: '#d7dfee', lh: 1.9 }),
      ...foot(10, true),
    ]),
  ]))
}
// ======== 7. プロジェクト報告(スレート×オレンジ・進捗/課題) ========
{
  const SL = '#273449', OR = '#ea6a1a', BG = '#f6f5f2', INK = '#1d2735', GR = '#667085', LN = '#dcdad3', GN = '#16a34a', YL = '#eab308'
  const foot = (n: number, dark = false) => [
    T('基幹システム刷新プロジェクト  進捗報告', 120, 1010, 1000, 26, { weight: 400, fill: dark ? '#9aa6bb' : GR }),
    T(String(n).padStart(2, '0'), 1620, 1000, 180, 38, { font: 'Montserrat', weight: 700, fill: dark ? OR : SL, align: 'right' }),
  ]
  const head = (k: string, t: string, dark = false) => [
    R(120, 92, 56, 8, OR),
    T(k, 196, 80, 900, 28, { font: 'Montserrat', weight: 700, fill: dark ? '#9aa6bb' : GR, spacing: 300 }),
    T(t, 120, 132, 1680, 62, { weight: 900, fill: dark ? '#ffffff' : INK }),
  ]
  const dot = (c: string, x: number, y: number, r = 16) => Ci(x, y, r, c)
  all.push(mk('ps-project', 'プロジェクト報告 スレート×オレンジ', ['プロジェクト', '進捗報告', '課題', 'スケジュール', '社内報告'], [
    pg('表紙', SL, () => [
      R(120, 200, 120, 10, OR),
      T('PROJECT REPORT', 120, 250, 900, 30, { font: 'Montserrat', weight: 700, fill: OR, spacing: 400 }),
      T('基幹システム刷新\nプロジェクト\n進捗報告', 120, 330, 1300, 100, { weight: 900, fill: '#ffffff', lh: 1.3 }),
      T('第5回  定例報告会  |  2026年10月', 120, 780, 1200, 36, { weight: 400, fill: '#c1c9d8' }),
      T('プロジェクトマネージャー  サンプル 太郎', 120, 960, 1200, 30, { weight: 400, fill: '#9aa6bb' }),
      ...PH(1380, 160, 420, 760, 0, '#33435c'),
    ]),
    pg('プロジェクト概要', BG, () => [
      ...head('OVERVIEW', 'プロジェクトの概要'),
      ...[['目的', '受発注・在庫・会計を\n一つの基盤に統合し、\n月次決算を5営業日短縮する'], ['期間', '2026年4月〜\n2027年3月\n(12か月)'], ['体制', 'PM 1名 / 業務 4名\n開発 6名 / 外部支援 3名\n(計14名)']].flatMap(([a, b], i) => {
        const x = 120 + i * 580
        return [
          R(x, 290, 520, 600, '#ffffff', 20, { stroke: LN, strokeWidth: 3 }),
          R(x, 290, 520, 90, SL),
          T(a, x, 313, 520, 44, { weight: 900, fill: '#ffffff', align: 'center' }),
          T(b, x + 40, 430, 440, 36, { weight: 500, fill: INK, lh: 1.9 }),
        ]
      }),
      ...foot(2),
    ]),
    pg('全体の進捗', '#ffffff', () => [
      ...head('PROGRESS', '全体の進捗は計画どおり'),
      T('68%', 120, 270, 600, 200, { font: 'Montserrat', weight: 900, fill: OR, lh: 1 }),
      T('全体の完了率(計画 65%)', 120, 500, 700, 36, { weight: 700, fill: INK }),
      R(120, 570, 700, 36, LN, 18),
      R(120, 570, 476, 36, OR, 18),
      T('ステータス', 120, 680, 700, 32, { weight: 700, fill: GR }),
      dot(GN, 150, 770, 22),
      T('順調', 195, 745, 400, 50, { weight: 900, fill: GN }),
      ...[['要件定義', 100, GN], ['基本設計', 100, GN], ['詳細設計・開発', 72, GN], ['結合テスト', 35, YL], ['移行準備', 20, YL]].flatMap(([a, p, c], i) => [
        T(a as string, 960, 290 + i * 120, 400, 34, { weight: 700, fill: INK }),
        T(p + '%', 1500, 290 + i * 120, 300, 34, { font: 'Montserrat', weight: 700, fill: INK, align: 'right' }),
        R(960, 346 + i * 120, 840, 22, LN, 11),
        R(960, 346 + i * 120, Math.round(840 * (p as number) / 100), 22, c as string, 11),
      ]),
      ...foot(3),
    ]),
    pg('スケジュール', BG, () => [
      ...head('SCHEDULE', '全体スケジュール'),
      ...['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'].map((m, i) => T(m, 420 + i * 115, 270, 115, 26, { weight: 700, fill: GR, align: 'center' })),
      ...[['要件定義', 0, 2, GN], ['基本設計', 2, 3, GN], ['開発', 4, 5, GN], ['結合テスト', 8, 3, YL], ['総合テスト', 10, 1, LN], ['移行・稼働', 11, 1, LN]].flatMap(([a, s, d, c], i) => [
        T(a as string, 120, 345 + i * 100, 280, 34, { weight: 700, fill: INK }),
        R(420, 395 + i * 100, 1380, 2, LN),
        R(420 + (s as number) * 115, 350 + i * 100, (d as number) * 115 - 8, 40, c as string, 20),
      ]),
      R(420 + 6.4 * 115, 310, 4, 640, OR),
      T('現在', 420 + 6.4 * 115 - 40, 940, 90, 26, { weight: 900, fill: OR, align: 'center' }),
      ...foot(4),
    ]),
    pg('成果物', '#ffffff', () => [
      ...head('DELIVERABLES', '今期の主な成果'),
      ...['要件定義書・基本設計書の承認が完了', '受発注・在庫モジュールの開発が完了', '旧システムのデータ移行ツールを試作', '利用部門向けの操作説明会を2回実施'].flatMap((t, i) => [
        R(120, 270 + i * 150, 1680, 120, BG, 20),
        Ci(200, 330 + i * 150, 32, GN),
        S('check', 178, 308 + i * 150, 44, '#ffffff'),
        T(t, 280, 307 + i * 150, 1450, 40, { weight: 700, fill: INK }),
      ]),
      ...foot(5),
    ]),
    pg('課題とリスク(表)', BG, () => [
      ...head('RISK', '課題とリスクの管理'),
      put(makeTable({ rows: 5, cols: 4, header: SL, border: LN, cellW: 420, cellH: 120, fontSize: 30, cells: [['項目', '影響度', '状況', '対応策'], ['移行データの品質', '高', '対応中', '重複データの洗い出し'], ['利用部門の人員不足', '中', '要相談', '応援要員を依頼'], ['外部連携の仕様変更', '中', '対応中', '先方と週次で調整'], ['テスト環境の遅れ', '低', '解消済', '環境を追加で確保']] }), 120, 270),
      ...foot(6),
    ]),
    pg('予算の消化', '#ffffff', () => [
      ...head('BUDGET', '予算の消化状況'),
      put(makeChart({ type: 'hbar', labels: ['開発費', '外部支援', 'ライセンス', '予備費'], values: [5800, 2100, 900, 0], colors: [SL, SL, SL, SL], w: 640, h: 400 }), 120, 270, 1.6),
      R(1220, 270, 580, 640, BG, 24),
      T('総予算  2.4億円', 1260, 310, 500, 36, { weight: 900, fill: INK }),
      T('執行済み  1.68億円\n(消化率 70%)\n\n残り4か月で見込む支出は\n計画の範囲内です。', 1260, 380, 500, 32, { weight: 400, fill: GR, lh: 1.8 }),
      T('単位:万円', 120, 930, 400, 26, { weight: 400, fill: GR }),
      ...foot(7),
    ]),
    pg('次のアクション', BG, () => [
      ...head('NEXT ACTION', '来月までにやること'),
      put(makeTable({ rows: 5, cols: 3, header: OR, border: LN, cellW: 560, cellH: 120, fontSize: 32, cells: [['やること', '担当', '期限'], ['結合テストの完了', '開発リーダー', '10月末'], ['移行リハーサル', '業務リーダー', '11月15日'], ['操作マニュアルの更新', '品質管理', '11月末'], ['稼働判定会議', 'PM', '12月10日']] }), 120, 270),
      ...foot(8),
    ]),
    pg('決定依頼', SL, () => [
      ...head('DECISION', 'ご判断をお願いしたい事項', true),
      R(120, 290, 1680, 420, '#33435c', 24),
      T('依頼事項', 170, 330, 600, 32, { weight: 700, fill: OR }),
      T('稼働開始日を、2027年4月1日から\n同年4月15日へ変更することの承認', 170, 390, 1580, 52, { weight: 900, fill: '#ffffff', lh: 1.5 }),
      T('理由:移行リハーサルの期間を2週間確保し、\n稼働後のトラブルを防ぐため。', 170, 560, 1580, 34, { weight: 400, fill: '#d0d7e4', lh: 1.8 }),
      T('費用への影響:なし(予備費の範囲内)', 120, 780, 1680, 38, { weight: 700, fill: '#ffffff' }),
      ...foot(9, true),
    ]),
    pg('結び', BG, () => [
      R(0, 0, 1920, 12, OR),
      T('NEXT REPORT', 120, 240, 900, 30, { font: 'Montserrat', weight: 700, fill: OR, spacing: 400 }),
      T('次回報告は\n11月第3週の予定です', 120, 310, 1500, 88, { weight: 900, fill: INK, lh: 1.35 }),
      R(120, 620, 120, 8, OR),
      T('ご質問・ご意見は、プロジェクト事務局まで。\npmo@example.com  /  内線 000', 120, 680, 1500, 36, { weight: 400, fill: GR, lh: 1.9 }),
      ...foot(10),
    ]),
  ]))
}
// ======== 8. 新商品・サービス紹介(コーラル×クリーム・ポップ) ========
{
  const CO = '#ff6b57', DK = '#2b1b2f', CR = '#fff6ec', YL = '#ffc93c', MT = '#2ec4b6', GR = '#76677a', LN = '#f0ddcb'
  const F = 'Zen Maru Gothic'
  const foot = (n: number, dark = false) => [
    T('NEW PRODUCT  |  株式会社エクザンプル', 120, 1010, 900, 26, { font: 'Montserrat', weight: 700, fill: dark ? '#ffd9d3' : GR, spacing: 80 }),
    T(String(n).padStart(2, '0'), 1620, 1000, 180, 38, { font: 'Montserrat', weight: 900, fill: dark ? '#ffffff' : CO, align: 'right' }),
  ]
  const head = (k: string, t: string) => [
    ...pillTag(k),
    T(t, 120, 150, 1680, 62, { font: F, weight: 900, fill: DK }),
  ]
  const pillTag = (k: string) => [
    R(120, 86, 40 + k.length * 22, 44, CO, 22),
    T(k, 120, 96, 40 + k.length * 22, 26, { font: 'Montserrat', weight: 700, fill: '#ffffff', align: 'center', lh: 1, spacing: 100 }),
  ]
  all.push(mk('ps-newitem', '新商品・サービス紹介 コーラル×クリーム', ['新商品', '新サービス', '商品紹介', 'ポップ', '発表'], [
    pg('表紙', CO, () => [
      Ci(1500, 460, 440, '#ff8676'), Ci(1700, 880, 200, YL), Ci(1250, 120, 90, DK),
      T('NEW RELEASE', 120, 200, 900, 30, { font: 'Montserrat', weight: 700, fill: '#ffffff', spacing: 400 }),
      T('朝が楽しくなる\nスマート\nコーヒーポット', 120, 290, 1200, 100, { font: F, weight: 900, fill: '#ffffff', lh: 1.25 }),
      ...(() => { const y = 740; return [R(120, y, 460, 80, DK, 40), T('2026年11月 新発売', 120, y + 20, 460, 36, { font: F, weight: 900, fill: '#ffffff', align: 'center', lh: 1 })] })(),
      T('株式会社エクザンプル  商品企画部', 120, 960, 1000, 30, { font: F, weight: 500, fill: '#ffe3de' }),
    ]),
    pg('開発の背景', CR, () => [
      ...head('BACKGROUND', 'こんなお悩みから生まれました'),
      ...[['忙しい朝に\n手間をかけたくない', '70%'], ['お店の味を\n自宅で楽しみたい', '64%'], ['片づけが\n面倒で続かない', '58%']].flatMap(([a, p], i) => {
        const x = 120 + i * 580
        return [
          R(x, 300, 520, 580, '#ffffff', 36, { stroke: LN, strokeWidth: 3 }),
          T(p, x, 350, 520, 130, { font: 'Montserrat', weight: 900, fill: i === 1 ? MT : CO, align: 'center', lh: 1 }),
          T('の人が感じている', x, 500, 520, 28, { font: F, weight: 500, fill: GR, align: 'center' }),
          T(a, x + 30, 600, 460, 44, { font: F, weight: 900, fill: DK, align: 'center', lh: 1.5 }),
        ]
      }),
      T('※自社調べ(サンプル)', 120, 920, 900, 26, { font: F, weight: 500, fill: GR }),
      ...foot(2),
    ]),
    pg('特徴3つ', '#ffffff', () => [
      ...head('FEATURES', '選ばれる3つの特徴'),
      ...[['ワンタッチ抽出', 'ボタンひとつで、\n約90秒でできあがり', CO], ['温度をキープ', '2時間、ちょうど良い\n温度のまま保温', MT], ['かんたんお手入れ', '丸洗いOK。\nパーツは3点だけ', YL]].flatMap(([a, b, c], i) => {
        const x = 120 + i * 580
        return [
          R(x, 300, 520, 600, CR, 36),
          Ci(x + 100, 420, 64, c as string),
          T(String(i + 1), x + 36, 372, 128, 90, { font: 'Montserrat', weight: 900, fill: i === 2 ? DK : '#ffffff', align: 'center', lh: 1.05 }),
          T(a, x + 44, 530, 440, 44, { font: F, weight: 900, fill: DK }),
          T(b, x + 44, 620, 440, 32, { font: F, weight: 500, fill: GR, lh: 1.8 }),
        ]
      }),
      ...foot(3),
    ]),
    pg('製品紹介(写真)', CR, () => [
      ...PH(120, 120, 880, 840, 40, '#f4e3d2'),
      T('PRODUCT', 1100, 150, 700, 28, { font: 'Montserrat', weight: 700, fill: CO, spacing: 300 }),
      T('スマート\nコーヒーポット', 1100, 205, 700, 64, { font: F, weight: 900, fill: DK, lh: 1.3 }),
      T('洗練された丸いフォルムで、\nキッチンに置くだけで\n絵になるデザイン。', 1100, 420, 700, 32, { font: F, weight: 500, fill: GR, lh: 1.9 }),
      ...[['サイズ', '幅 18 × 高さ 26cm'], ['容量', '600ml'], ['カラー', 'コーラル / クリーム / ミント']].flatMap(([a, b], i) => [
        R(1100, 690 + i * 90, 700, 2, LN),
        T(a, 1100, 710 + i * 90, 200, 30, { font: F, weight: 700, fill: CO }),
        T(b, 1300, 710 + i * 90, 500, 30, { font: F, weight: 500, fill: DK }),
      ]),
      ...foot(4),
    ]),
    pg('使い方', '#ffffff', () => [
      ...head('HOW TO', '使い方は、たったの3ステップ'),
      R(300, 520, 1320, 6, LN),
      ...[['水と豆をセット', '水を注ぎ、\n粉をポットに入れます'], ['ボタンを押す', 'お好みの濃さを\n選んでスタート'], ['できあがり', '約90秒で、\n香り立つ一杯に']].flatMap(([a, b], i) => {
        const x = 120 + i * 580
        return [
          Ci(x + 260, 523, 80, i === 2 ? CO : DK),
          T(String(i + 1), x + 180, 478, 160, 90, { font: 'Montserrat', weight: 900, fill: '#ffffff', align: 'center', lh: 1.05 }),
          T(a, x, 650, 520, 44, { font: F, weight: 900, fill: DK, align: 'center' }),
          T(b, x, 730, 520, 32, { font: F, weight: 500, fill: GR, align: 'center', lh: 1.8 }),
        ]
      }),
      ...foot(5),
    ]),
    pg('比較表', CR, () => [
      ...head('COMPARE', '従来品との違い'),
      put(makeTable({ rows: 5, cols: 3, header: DK, border: LN, cellW: 560, cellH: 110, fontSize: 34, cells: [['', '従来のポット', 'スマートポット(新)'], ['抽出時間', '約5分', '約90秒'], ['保温', '30分', '2時間'], ['お手入れ', 'パーツ7点', '丸洗い・3点'], ['価格(税込)', '9,800円', '12,800円']] }), 120, 290),
      R(680, 290, 560, 550, 'rgba(0,0,0,0)', 0, { stroke: CO, strokeWidth: 6 }),
      T('おすすめ', 680, 856, 560, 28, { font: F, weight: 900, fill: CO, align: 'center' }),
      ...foot(6),
    ]),
    pg('利用シーン', '#ffffff', () => [
      ...head('SCENE', 'こんな場面で活躍します'),
      ...[['忙しい朝', '出勤前に、\n1杯をすぐ用意'], ['在宅ワーク', '作業の合間に、\n温かい一杯を'], ['ホームパーティー', '人数分を\nまとめて抽出'], ['ギフト', '新生活の\n贈り物に']].flatMap(([a, b], i) => {
        const x = 120 + i * 430
        return [
          ...PH(x, 290, 390, 360, 32, ['#f6d9d3', '#d5efec', '#fdeab5', '#f4e3d2'][i]),
          T(a, x, 690, 390, 40, { font: F, weight: 900, fill: DK }),
          T(b, x, 760, 390, 30, { font: F, weight: 500, fill: GR, lh: 1.7 }),
        ]
      }),
      ...foot(7),
    ]),
    pg('料金プラン', CR, () => [
      ...head('PRICE', 'ラインアップと価格'),
      ...[['スタンダード', '12,800円', 'ポット本体 + 計量スプーン', '#ffffff', DK], ['ギフトセット', '15,800円', '本体 + カップ2個 + 豆100g', CO, '#ffffff'], ['お得な2台セット', '23,800円', '本体2台(色が選べます)', '#ffffff', DK]].flatMap(([a, p, d, bg, fg], i) => {
        const x = 120 + i * 580
        return [
          R(x, 300, 520, 580, bg as string, 36, { stroke: LN, strokeWidth: 3 }),
          T(a, x, 350, 520, 40, { font: F, weight: 900, fill: fg as string, align: 'center' }),
          T(p, x, 450, 520, 80, { font: F, weight: 900, fill: i === 1 ? '#ffffff' : CO, align: 'center' }),
          T('税込', x, 568, 520, 26, { font: F, weight: 500, fill: i === 1 ? '#ffe3de' : GR, align: 'center' }),
          T(d, x + 50, 660, 420, 30, { font: F, weight: 500, fill: i === 1 ? '#ffffff' : GR, align: 'center', lh: 1.8 }),
        ]
      }),
      ...foot(8),
    ]),
    pg('FAQ', '#ffffff', () => [
      ...head('Q&A', 'よくあるご質問'),
      ...[['お湯は何度まで使えますか?', '最大95℃まで対応しています。'], ['食洗機で洗えますか?', 'ポット本体は手洗い、パーツは食洗機に対応。'], ['保証期間はありますか?', 'ご購入から1年間の保証が付きます。']].flatMap(([q, a], i) => [
        R(120, 290 + i * 210, 1680, 180, CR, 28),
        Ci(210, 380 + i * 210, 44, CO),
        T('Q', 166, 345 + i * 210, 88, 70, { font: 'Montserrat', weight: 900, fill: '#ffffff', align: 'center', lh: 1.05 }),
        T(q, 300, 322 + i * 210, 1450, 40, { font: F, weight: 900, fill: DK }),
        T(a, 300, 392 + i * 210, 1450, 32, { font: F, weight: 500, fill: GR }),
      ]),
      ...foot(9),
    ]),
    pg('発売情報', CO, () => [
      Ci(1560, 760, 420, '#ff8676'), Ci(1780, 200, 120, YL),
      T('COMING SOON', 120, 200, 900, 30, { font: 'Montserrat', weight: 700, fill: '#ffffff', spacing: 400 }),
      T('2026年11月1日\n発売スタート', 120, 280, 1300, 100, { font: F, weight: 900, fill: '#ffffff', lh: 1.3 }),
      R(120, 600, 120, 8, DK),
      T('先行予約:10月15日から公式サイトで受付\n発売記念:先着500名に専用豆をプレゼント', 120, 660, 1300, 36, { font: F, weight: 700, fill: '#ffffff', lh: 1.9 }),
      T('example.com/newitem   /   info@example.com', 120, 880, 1300, 34, { font: 'Montserrat', weight: 700, fill: DK }),
      ...foot(10, true),
    ]),
  ]))
}
// ======== 9. 学校の授業・講義(黒板グリーン×チョーク) ========
{
  const BD = '#1f4a3b', CH = '#fdfcf5', YE = '#ffd84d', PK = '#ff9aa8', BL = '#8fd3ff', PA = '#fbf8ee', INK = '#25302b', GR = '#68736d', LN = '#ddd8c4'
  const F = 'Zen Maru Gothic', K = 'Klee One'
  const foot = (n: number, dark = false) => [
    T('理科  第3学年  単元「電気のはたらき」', 120, 1010, 1000, 26, { font: F, weight: 500, fill: dark ? '#a9c8bb' : GR }),
    T(String(n).padStart(2, '0'), 1620, 1000, 180, 38, { font: 'Montserrat', weight: 700, fill: dark ? YE : BD, align: 'right' }),
  ]
  const head = (k: string, t: string) => [
    R(120, 84, 150, 46, BD, 23),
    T(k, 120, 96, 150, 24, { font: F, weight: 900, fill: YE, align: 'center', lh: 1 }),
    T(t, 120, 150, 1680, 62, { font: F, weight: 900, fill: INK }),
  ]
  all.push(mk('ps-lesson', '学校の授業・講義 黒板グリーン', ['授業', '講義', '学校', '教育', '黒板', '先生'], [
    pg('表紙(単元)', BD, () => [
      R(60, 60, 1800, 960, 'rgba(0,0,0,0)', 0, { stroke: '#e7d3a8', strokeWidth: 14 }),
      T('理科  第3学年', 160, 180, 1000, 40, { font: F, weight: 700, fill: YE }),
      T('電気のはたらき', 160, 280, 1500, 140, { font: K, weight: 600, fill: CH }),
      R(160, 470, 520, 6, YE),
      T('豆電球はなぜ光るのか、\n電気の通り道を調べよう。', 160, 530, 1300, 52, { font: K, weight: 600, fill: '#d9e6df', lh: 1.6 }),
      T('第1時間目  /  担当:サンプル 先生', 160, 900, 1300, 32, { font: F, weight: 500, fill: '#a9c8bb' }),
      Ci(1620, 740, 120, YE), S('lightning', 1570, 680, 100, BD),
    ]),
    pg('今日のめあて', PA, () => [
      ...head('めあて', '今日のめあて'),
      R(120, 290, 1680, 300, BD, 28),
      T('電気が通る道すじ(回路)を\n理解し、説明できる', 190, 350, 1540, 64, { font: K, weight: 600, fill: CH, lh: 1.6 }),
      T('今日の流れ', 120, 650, 800, 40, { font: F, weight: 900, fill: INK }),
      ...['前回のふりかえり', '実験:豆電球を光らせる', '回路図のかき方', 'まとめ・ふりかえり'].map((t, i) => [
        Ci(160 + i * 440, 790, 40, [YE, PK, BL, YE][i]),
        T(String(i + 1), 120 + i * 440, 757, 80, 56, { font: 'Montserrat', weight: 900, fill: INK, align: 'center', lh: 1.05 }),
        T(t, 215 + i * 440, 755, 220, 28, { font: F, weight: 700, fill: INK, lh: 1.5 }),
      ]).flat(),
      ...foot(2),
    ]),
    pg('前回のふりかえり', '#ffffff', () => [
      ...head('復習', '前回のふりかえり'),
      ...[['電池には、+極と-極がある', 'じくの向きにつなぐと電気が流れる'], ['豆電球の中には、フィラメントがある', '電気が通ると熱くなって光る'], ['電気を通すもの・通さないもの', '金属は通し、ゴムやガラスは通さない']].flatMap(([a, b], i) => [
        R(120, 280 + i * 220, 1680, 190, PA, 24, { stroke: LN, strokeWidth: 3 }),
        T('✔', 170, 330 + i * 220, 80, 80, { font: F, weight: 900, fill: BD }),
        T(a, 280, 318 + i * 220, 1450, 44, { font: F, weight: 900, fill: INK }),
        T(b, 280, 392 + i * 220, 1450, 32, { font: F, weight: 500, fill: GR }),
      ]),
      ...foot(3),
    ]),
    pg('導入(問い)', BD, () => [
      T('QUESTION', 160, 150, 800, 30, { font: 'Montserrat', weight: 700, fill: YE, spacing: 400 }),
      T('電池と豆電球を\n1本の導線でつなぐと、\n電球は光るかな?', 160, 240, 1500, 88, { font: K, weight: 600, fill: CH, lh: 1.5 }),
      ...[['光る', YE], ['光らない', PK], ['わからない', BL]].flatMap(([t, c], i) => [
        R(160 + i * 560, 700, 500, 200, 'rgba(0,0,0,0)', 40, { stroke: c as string, strokeWidth: 6 }),
        T(t as string, 160 + i * 560, 770, 500, 56, { font: F, weight: 900, fill: c as string, align: 'center', lh: 1 }),
      ]),
      T('予想を選んで、理由をノートに書こう(3分)', 160, 950, 1500, 32, { font: F, weight: 500, fill: '#a9c8bb' }),
      ...foot(4, true),
    ]),
    pg('要点解説(図解)', PA, () => [
      ...head('学ぼう', '電気の通り道を「回路」という'),
      ...PH(120, 280, 860, 620, 28, '#e9e4cf'),
      T('回路とは', 1060, 290, 740, 40, { font: F, weight: 900, fill: BD }),
      T('電池の+極から出た電気が、\n豆電球を通って、\n-極にもどる一つの輪。', 1060, 360, 740, 34, { font: F, weight: 500, fill: INK, lh: 1.9 }),
      R(1060, 640, 740, 220, '#ffffff', 24, { stroke: BD, strokeWidth: 4 }),
      T('ポイント', 1100, 664, 660, 30, { font: F, weight: 900, fill: PK }),
      T('輪がとぎれると、\n電気は流れない。', 1100, 720, 660, 34, { font: F, weight: 900, fill: INK, lh: 1.6 }),
      ...foot(5),
    ]),
    pg('実験の手順', '#ffffff', () => [
      ...head('実験', '豆電球を光らせよう'),
      ...[['用意するもの', '電池 / 豆電球 /\nソケット / 導線2本'], ['つなぐ', '電池の両はしに\n導線をつなぐ'], ['たしかめる', '光るかどうか\n記録する'], ['かえてみる', 'つなぎ方を変えて\nもう一度']].flatMap(([a, b], i) => {
        const x = 120 + i * 430
        return [
          R(x, 290, 390, 520, PA, 28, { stroke: LN, strokeWidth: 3 }),
          Ci(x + 80, 370, 44, [YE, PK, BL, YE][i]),
          T(String(i + 1), x + 36, 335, 88, 70, { font: 'Montserrat', weight: 900, fill: INK, align: 'center', lh: 1.05 }),
          T(a, x + 36, 450, 330, 40, { font: F, weight: 900, fill: INK }),
          T(b, x + 36, 530, 330, 30, { font: F, weight: 500, fill: GR, lh: 1.8 }),
        ]
      }),
      T('注意:導線の両はしを、電池に直接つなぎ続けないこと(熱くなります)', 120, 860, 1680, 30, { font: F, weight: 700, fill: '#d64545' }),
      ...foot(6),
    ]),
    pg('結果の表', PA, () => [
      ...head('記録', '実験の結果を表にまとめよう'),
      put(makeTable({ rows: 5, cols: 3, header: BD, border: LN, cellW: 560, cellH: 110, fontSize: 34, cells: [['つなぎ方', '予想', '結果'], ['導線1本・片側だけ', '', ''], ['導線2本・輪になる', '', ''], ['ソケットなし', '', ''], ['ゴムひもでつなぐ', '', '']] }), 120, 280),
      T('予想と結果が同じだったか、ちがったかを下の行に書こう。', 120, 880, 1680, 32, { font: F, weight: 500, fill: GR }),
      ...foot(7),
    ]),
    pg('練習問題', '#ffffff', () => [
      ...head('問題', '練習問題'),
      R(120, 280, 1680, 270, BD, 28),
      T('問1', 170, 316, 160, 50, { font: F, weight: 900, fill: YE }),
      T('豆電球が光るのは、次のどれでしょう。\n理由もいっしょに書きましょう。', 170, 396, 1580, 40, { font: F, weight: 500, fill: CH, lh: 1.7 }),
      ...['ア  導線が輪になっている', 'イ  導線が電池の片側だけにつながっている', 'ウ  電球がソケットからはずれている'].flatMap((t, i) => [
        R(120, 600 + i * 120, 1680, 100, PA, 24, { stroke: LN, strokeWidth: 3 }),
        T(t, 170, 630 + i * 120, 1580, 38, { font: F, weight: 700, fill: INK }),
      ]),
      ...foot(8),
    ]),
    pg('グループ活動', PA, () => [
      ...head('話し合い', 'グループで話し合おう'),
      Ci(500, 600, 260, '#ffffff', { stroke: BD, strokeWidth: 6 }),
      T('お題', 240, 480, 520, 36, { font: F, weight: 900, fill: PK, align: 'center' }),
      T('回路がとぎれていても\n電気が流れる場面は\nあるかな?', 270, 540, 460, 36, { font: F, weight: 900, fill: INK, align: 'center', lh: 1.6 }),
      ...[['1', 'ひとり3分で考える'], ['2', '4人班で意見を出し合う'], ['3', '班の考えを1つにまとめる'], ['4', '黒板に書いて発表する']].flatMap(([n, t], i) => [
        Ci(1000, 360 + i * 150, 40, [YE, PK, BL, YE][i]),
        T(n, 960, 326 + i * 150, 80, 64, { font: 'Montserrat', weight: 900, fill: INK, align: 'center', lh: 1.05 }),
        T(t, 1080, 342 + i * 150, 720, 38, { font: F, weight: 700, fill: INK }),
      ]),
      ...foot(9),
    ]),
    pg('まとめ・宿題', BD, () => [
      R(60, 60, 1800, 960, 'rgba(0,0,0,0)', 0, { stroke: '#e7d3a8', strokeWidth: 14 }),
      T('まとめ', 160, 150, 600, 44, { font: F, weight: 900, fill: YE }),
      T('電気は、輪になった道すじ\n(回路)を通って流れる。', 160, 240, 1500, 72, { font: K, weight: 600, fill: CH, lh: 1.5 }),
      R(160, 480, 1600, 4, '#e7d3a8'),
      T('宿題', 160, 540, 600, 44, { font: F, weight: 900, fill: PK }),
      T('家の中で電気が使われているものを3つ探して、\nどんな回路になっているか予想を書いてこよう。\n(次回の授業で発表します)', 160, 620, 1500, 38, { font: F, weight: 500, fill: '#d9e6df', lh: 1.9 }),
      T('次回:「電気を通すもの・通さないもの」', 160, 900, 1500, 32, { font: F, weight: 700, fill: '#a9c8bb' }),
    ]),
  ]))
}
// ======== 10. ウェビナー・イベント登壇(ダーク×バイオレット) ========
{
  const DK = '#0d0b1f', PU = '#7c4dff', NE = '#3ee0cf', PK = '#ff5fa2', CD = '#1a1738', TX = '#ffffff', MU = '#a9a5cf', LN = '#2f2b5c'
  const foot = (n: number) => [
    T('#サンプルウェビナー  |  2026.11.12', 120, 1010, 900, 26, { font: 'Montserrat', weight: 700, fill: MU, spacing: 80 }),
    T(String(n).padStart(2, '0'), 1620, 1000, 180, 38, { font: 'Montserrat', weight: 900, fill: NE, align: 'right' }),
  ]
  const head = (k: string, t: string) => [
    T(k, 120, 80, 900, 28, { font: 'Montserrat', weight: 700, fill: NE, spacing: 300 }),
    T(t, 120, 124, 1680, 62, { weight: 900, fill: TX }),
    R(120, 214, 80, 5, PU),
  ]
  all.push(mk('ps-webinar', 'ウェビナー・イベント登壇 ダーク×バイオレット', ['ウェビナー', '登壇', 'イベント', 'セミナー', 'ダーク', 'オンライン'], [
    pg('表紙', DK, () => [
      Ci(1560, 280, 380, PU), Ci(1700, 860, 220, '#2a2470'), Ci(1300, 700, 90, NE),
      R(120, 170, 330, 56, 'rgba(0,0,0,0)', 28, { stroke: NE, strokeWidth: 3 }),
      T('LIVE WEBINAR', 120, 184, 330, 28, { font: 'Montserrat', weight: 700, fill: NE, align: 'center', spacing: 200, lh: 1 }),
      T('AIで変わる\nこれからの\n働き方', 120, 290, 1100, 120, { weight: 900, fill: TX, lh: 1.2 }),
      T('2026年11月12日(木)  19:00〜20:00  |  オンライン配信', 120, 810, 1300, 34, { weight: 500, fill: MU }),
      T('登壇:サンプル 花子 / 株式会社エクザンプル', 120, 960, 1300, 30, { weight: 500, fill: TX }),
    ]),
    pg('自己紹介', DK, () => [
      ...head('SPEAKER', '本日の登壇者'),
      ...PH(120, 290, 560, 640, 40, CD),
      T('サンプル 花子', 760, 300, 1000, 76, { weight: 900, fill: TX }),
      T('株式会社エクザンプル  DX推進室 室長', 760, 410, 1000, 34, { weight: 500, fill: NE }),
      T('製造・小売を中心に、50社以上の業務改善を支援。\n現場の声から始めるDXが得意です。', 760, 500, 1040, 34, { weight: 400, fill: MU, lh: 1.9 }),
      ...['著書『はじめてのDX』', 'SNS @sample_hanako'].map((t, i) => [
        R(760 + i * 520, 740, 480, 80, CD, 40, { stroke: LN, strokeWidth: 2 }),
        T(t, 760 + i * 520, 765, 480, 30, { weight: 700, fill: TX, align: 'center', lh: 1.1 }),
      ]).flat(),
      ...foot(2),
    ]),
    pg('アジェンダ', DK, () => [
      ...head('AGENDA', '今日お話しすること'),
      ...[['00', '働き方の現在地', '5分'], ['01', 'AIで変わる3つの業務', '20分'], ['02', '導入の進め方', '20分'], ['03', '質疑応答', '15分']].flatMap(([n, t, m], i) => [
        R(120, 280 + i * 165, 1680, 135, CD, 24, { stroke: LN, strokeWidth: 2 }),
        T(n, 170, 308 + i * 165, 140, 76, { font: 'Montserrat', weight: 900, fill: i === 1 ? NE : PU, lh: 1 }),
        T(t, 360, 318 + i * 165, 1000, 44, { weight: 900, fill: TX }),
        T(m, 1500, 322 + i * 165, 250, 40, { font: 'Montserrat', weight: 700, fill: MU, align: 'right' }),
      ]),
      ...foot(3),
    ]),
    pg('問いかけ', PU, () => [
      T('QUESTION', 120, 180, 800, 30, { font: 'Montserrat', weight: 700, fill: NE, spacing: 400 }),
      T('あなたの1日のうち、\n「考える時間」は\n何割ありますか?', 120, 270, 1600, 104, { weight: 900, fill: TX, lh: 1.3 }),
      T('チャットに数字を書いてください  例:3割', 120, 800, 1600, 38, { weight: 500, fill: '#e3d9ff' }),
      ...foot(4),
    ]),
    pg('ポイント1', DK, () => [
      ...head('POINT 01', '会議のメモは、AIに任せる'),
      T('01', 120, 280, 400, 240, { font: 'Montserrat', weight: 900, fill: LN, lh: 1 }),
      T('録音から議事録の下書きまで、約5分。\n人は「決めること」に集中できます。', 560, 320, 1240, 40, { weight: 400, fill: MU, lh: 1.9 }),
      ...[['週5時間', '議事録づくりの時間'], ['約1/6', '作成にかかる時間']].flatMap(([a, b], i) => [
        R(560 + i * 640, 560, 600, 300, CD, 28, { stroke: LN, strokeWidth: 2 }),
        T(a, 560 + i * 640, 610, 600, 80, { weight: 900, fill: i ? PK : NE, align: 'center' }),
        T(b, 560 + i * 640, 740, 600, 32, { weight: 500, fill: MU, align: 'center' }),
      ]),
      T('※数値はサンプルです', 120, 920, 900, 26, { weight: 400, fill: MU }),
      ...foot(5),
    ]),
    pg('ポイント2(グラフ)', DK, () => [
      ...head('POINT 02', '導入した企業の変化'),
      put(makeChart({ type: 'bar', labels: ['導入前', '1か月', '3か月', '6か月'], values: [100, 82, 65, 52], colors: ['#3a3670', '#5a45b8', PU, NE], w: 640, h: 400 }), 120, 270, 1.5),
      R(1160, 270, 640, 600, CD, 28, { stroke: LN, strokeWidth: 2 }),
      T('資料作成の工数', 1200, 310, 560, 36, { weight: 900, fill: TX }),
      T('導入前を100として、\n6か月後には約半分に。\n\nただし、最初の1か月は\n使い方に慣れる時間が必要です。', 1200, 380, 560, 30, { weight: 400, fill: MU, lh: 1.9 }),
      ...foot(6),
    ]),
    pg('事例', DK, () => [
      ...head('CASE', 'ある小売企業の取り組み'),
      ...PH(120, 280, 780, 600, 28, CD),
      ...[['背景', '店舗からの問い合わせ対応に追われていた'], ['施策', 'よくある質問をAIが一次回答'], ['結果', '本部の対応件数が4割減']].flatMap(([a, b], i) => [
        T(a, 980, 290 + i * 200, 220, 30, { weight: 700, fill: NE }),
        T(b, 980, 340 + i * 200, 820, 38, { weight: 700, fill: TX, lh: 1.5 }),
        R(980, 440 + i * 200, 820, 2, LN),
      ]),
      ...foot(7),
    ]),
    pg('導入の3ステップ', DK, () => [
      ...head('STEP', '導入の進め方'),
      ...[['小さく始める', '1つの業務・1つの部署で\nまず試す'], ['効果を測る', '時間・件数など\n数字で確かめる'], ['広げる', 'うまくいった型を\n他の部署へ展開']].flatMap(([a, b], i) => {
        const x = 120 + i * 580
        return [
          R(x, 290, 520, 560, CD, 28, { stroke: LN, strokeWidth: 2 }),
          R(x, 290, 520, 8, [PU, NE, PK][i]),
          T('0' + (i + 1), x + 44, 340, 200, 90, { font: 'Montserrat', weight: 900, fill: [PU, NE, PK][i] }),
          T(a, x + 44, 480, 440, 44, { weight: 900, fill: TX }),
          T(b, x + 44, 570, 440, 32, { weight: 400, fill: MU, lh: 1.8 }),
        ]
      }),
      ...foot(8),
    ]),
    pg('Q&A', PU, () => [
      T('Q&A', 120, 160, 1000, 200, { font: 'Montserrat', weight: 900, fill: TX, lh: 1 }),
      T('ご質問をお待ちしています', 120, 400, 1600, 64, { weight: 900, fill: TX }),
      R(120, 560, 120, 8, NE),
      T('Zoomの「Q&A」ボタン、または\nハッシュタグ #サンプルウェビナー でご投稿ください。', 120, 620, 1300, 36, { weight: 500, fill: '#e3d9ff', lh: 1.9 }),
      ...PH(1420, 600, 380, 380, 28, '#9a78ff'),
      T('QRコード', 1420, 770, 380, 30, { weight: 700, fill: TX, align: 'center' }),
      ...foot(9),
    ]),
    pg('ありがとうございました', DK, () => [
      Ci(300, 1000, 380, PU), Ci(1700, 140, 180, '#2a2470'),
      T('THANK YOU', 120, 180, 1000, 34, { font: 'Montserrat', weight: 700, fill: NE, spacing: 400 }),
      T('ご視聴\nありがとうございました', 120, 270, 1600, 104, { weight: 900, fill: TX, lh: 1.25 }),
      ...[['アーカイブ', '2日以内にメールでお送りします'], ['アンケート', '終了後の画面からご回答ください'], ['お問い合わせ', 'info@example.com']].flatMap(([a, b], i) => [
        T(a, 120, 640 + i * 90, 300, 30, { weight: 700, fill: NE }),
        T(b, 440, 640 + i * 90, 1300, 30, { weight: 500, fill: TX }),
      ]),
      ...foot(10),
    ]),
  ]))
}

export const SLIDES_SETS: Template[] = all
