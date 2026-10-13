import type { Template, TemplatePage } from '../templates'
import { T, R, Ci, S, PH } from '../templates/kit'
import { makeChart, makeTable } from '../../editor/elements'
import { VText } from '../../editor/vtext'

// Web・SNS 向けテンプレートセット(YouTube サムネイル / ブログ / X / LINE / ロゴ / インフォグラフィック / バナー)

const P = (label: string, bg: TemplatePage['bg'], build: () => any[]): TemplatePage => ({ label, bg, build })
const mk = (id: string, name: string, category: string, w: number, h: number, tags: string[], pages: TemplatePage[]): Template => ({
  id, name, category, w, h, tags, bg: pages[0].bg, build: pages[0].build, more: pages.slice(1),
})
/** 縁取り付きの太字(サムネイル用) */
const TS = (text: string, x: number, y: number, w: number, size: number, o: Parameters<typeof T>[5] = {}, stroke = '#000000', sw = 10) =>
  T(text, x, y, w, size, o).set({ stroke, strokeWidth: sw, paintFirst: 'stroke', strokeLineJoin: 'round' } as any)
/** チャンネル名の小さなタグ(サムネイル左上の共通要素) */
const tag = (name: string, bg: string, fg: string, font = 'Noto Sans JP', x = 56, y = 44) => {
  const w = name.length * 26 + 44
  return [R(x, y, w, 48, bg, 24), T(name, x, y + 8, w, 26, { font, weight: 900, fill: fg, align: 'center' })]
}
const DELA = 'Dela Gothic One'

// ================= 1. YouTube サムネイル: ビジネス解説(ネイビー × イエロー) =================
const BZ = { navy: '#0a1530', mid: '#16264f', yel: '#ffd400', red: '#ff3b30', pale: '#f4f6fb' }
const bzTag = (bg = BZ.yel, fg = BZ.navy) => tag('サンプル経営ラボ', bg, fg)
const YT_BIZ: TemplatePage[] = [
  P('賃金が上がらない理由', BZ.navy, () => [
    ...PH(760, 0, 520, 720, 0, '#26335c'),
    ...bzTag(),
    T('給料が', 56, 130, 700, 136, { font: DELA, weight: 400, fill: '#ffffff' }),
    T('上がらない', 56, 300, 700, 136, { font: DELA, weight: 400, fill: '#ffffff' }),
    R(56, 480, 640, 96, BZ.yel, 12),
    T('たった3つの理由', 76, 498, 600, 60, { font: DELA, weight: 400, fill: BZ.navy }),
    T('知らないと一生損する', 56, 612, 680, 40, { fill: '#c7d0ea' }),
  ]),
  P('数字で見せる', BZ.yel, () => [
    ...bzTag(BZ.navy, BZ.yel),
    T('転職せずに', 56, 130, 900, 72, { fill: BZ.navy, weight: 900 }),
    T('+200万', 56, 210, 1100, 250, { font: DELA, weight: 400, fill: BZ.navy }),
    T('年収を上げた人の共通点', 56, 510, 1100, 76, { fill: BZ.navy, weight: 900 }),
    R(56, 618, 360, 62, BZ.red, 31),
    T('実例で解説', 56, 630, 360, 38, { fill: '#ffffff', align: 'center', weight: 900 }),
    S('burst', 990, 40, 220, BZ.red),
    T('実話', 990, 118, 220, 60, { font: DELA, weight: 400, fill: '#ffffff', align: 'center' }),
  ]),
  P('比較 VS', BZ.navy, () => [
    R(0, 0, 640, 600, BZ.mid), R(640, 0, 640, 600, BZ.yel), R(0, 600, 1280, 120, BZ.red),
    ...bzTag(),
    T('貯金', 60, 170, 520, 190, { font: DELA, weight: 400, fill: '#ffffff', align: 'center' }),
    T('安全だが増えない', 60, 410, 520, 44, { fill: '#c7d0ea', align: 'center' }),
    T('投資', 700, 170, 520, 190, { font: DELA, weight: 400, fill: BZ.navy, align: 'center' }),
    T('増えるが減る日もある', 700, 410, 520, 44, { fill: BZ.navy, align: 'center' }),
    Ci(640, 300, 74, BZ.red, { stroke: '#ffffff', strokeWidth: 8 }),
    T('VS', 566, 268, 148, 60, { font: 'Montserrat', weight: 900, fill: '#ffffff', align: 'center' }),
    T('あなたはどっち派?', 0, 628, 1280, 64, { font: DELA, weight: 400, fill: '#ffffff', align: 'center' }),
  ]),
  P('警告', '#12121c', () => [
    ...bzTag(),
    S('triangle', 70, 150, 300, BZ.yel),
    T('!', 70, 250, 300, 190, { font: DELA, weight: 400, fill: '#12121c', align: 'center' }),
    T('その副業', 420, 130, 800, 70, { fill: '#ffffff', weight: 900 }),
    T('9割が\n失敗します', 420, 220, 800, 130, { font: DELA, weight: 400, fill: BZ.yel, lh: 1.12 }),
    T('始める前に確認したい5つのこと', 420, 550, 800, 40, { fill: '#c7d0ea' }),
  ]),
  P('ランキング', BZ.navy, () => [
    ...bzTag(),
    T('取って\n得する資格', 56, 130, 540, 92, { font: DELA, weight: 400, fill: '#ffffff', lh: 1.18 }),
    T('ランキングTOP3', 56, 420, 540, 48, { fill: BZ.yel, weight: 900 }),
    ...[['宅建士', '人気の国家資格', BZ.yel], ['簿記2級', '経理で一生使える', '#ffffff'], ['ITパスポート', '文系にもおすすめ', '#ffffff']].flatMap((r, i) => [
      R(640, 90 + i * 188, 584, 160, r[2], 24),
      Ci(730, 170 + i * 188, 44, i === 0 ? BZ.navy : BZ.yel),
      T(String(i + 1), 686, 140 + i * 188, 88, 56, { font: DELA, weight: 400, fill: i === 0 ? BZ.yel : BZ.navy, align: 'center' }),
      T(r[0], 800, 118 + i * 188, 400, 56, { font: DELA, weight: 400, fill: BZ.navy }),
      T(r[1], 800, 186 + i * 188, 400, 30, { fill: '#475569' }),
    ]),
  ]),
  P('3ステップ図解', BZ.pale, () => [
    ...bzTag(BZ.navy, BZ.yel),
    T('インボイス制度', 56, 120, 1168, 100, { font: DELA, weight: 400, fill: BZ.navy }),
    T('3分でわかる図解', 56, 240, 900, 56, { fill: BZ.red, weight: 900 }),
    ...[['登録申請', 'STEP 1'], ['請求書に番号', 'STEP 2'], ['保存と提出', 'STEP 3']].flatMap((s, i) => [
      R(56 + i * 414, 350, 340, 260, BZ.navy, 24),
      T(s[1], 86 + i * 414, 384, 280, 36, { font: 'Montserrat', weight: 900, fill: BZ.yel }),
      T(s[0], 86 + i * 414, 470, 280, 48, { font: DELA, weight: 400, fill: '#ffffff' }),
      ...(i < 2 ? [S('arrowR', 408 + i * 414, 450, 54, BZ.red)] : []),
    ]),
  ]),
  P('体験談', BZ.yel, () => [
    ...bzTag(BZ.navy, BZ.yel),
    ...PH(56, 140, 360, 360, 180, '#e6c200'),
    Ci(390, 470, 66, BZ.red, { stroke: BZ.yel, strokeWidth: 8 }),
    T('実録', 330, 450, 120, 40, { font: DELA, weight: 400, fill: '#ffffff', align: 'center' }),
    T('副業ゼロから', 470, 120, 754, 64, { fill: BZ.navy, weight: 900 }),
    T('月5万円', 470, 200, 754, 170, { font: DELA, weight: 400, fill: BZ.navy }),
    T('を半年で作った方法', 470, 400, 754, 64, { fill: BZ.navy, weight: 900 }),
    T('会社員 / 30代 / 実例', 470, 600, 754, 36, { fill: BZ.navy }),
  ]),
  P('折れ線グラフ', BZ.navy, () => [
    ...bzTag(),
    T('賃金は\nこの10年\nどう動いた?', 56, 130, 560, 84, { font: DELA, weight: 400, fill: '#ffffff', lh: 1.2 }),
    T('実質賃金の推移(例)', 56, 500, 560, 40, { fill: BZ.yel }),
    R(620, 90, 604, 540, '#ffffff', 28),
    T('指数(2014年=100・例)', 650, 118, 540, 30, { fill: BZ.navy, weight: 700 }),
    makeChart({ type: 'line', labels: ['2014', '16', '18', '20', '22', '24'], values: [100, 102, 103, 101, 99, 104], colors: [BZ.red], w: 420, h: 290 }).set({ left: 662, top: 190, scaleX: 1.22, scaleY: 1.22 }),
  ]),
  P('3つの税金', BZ.mid, () => [
    ...bzTag(),
    T('知らないと損する', 56, 130, 900, 56, { fill: BZ.yel, weight: 900 }),
    T('3つの税金', 56, 200, 1000, 150, { font: DELA, weight: 400, fill: '#ffffff' }),
    ...[['所得税', '年末に精算'], ['住民税', '翌年に請求'], ['消費税', '買い物のたび']].flatMap((s, i) => [
      R(56 + i * 414, 430, 340, 190, '#ffffff', 24),
      T(s[0], 76 + i * 414, 462, 300, 60, { font: DELA, weight: 400, fill: BZ.navy }),
      T(s[1], 76 + i * 414, 548, 300, 32, { fill: '#475569' }),
    ]),
  ]),
  P('結論', BZ.navy, () => [
    ...bzTag(),
    S('check', 56, 160, 260, BZ.yel),
    T('結論', 380, 120, 700, 56, { fill: BZ.yel, weight: 900 }),
    T('毎月3万円を\n自動で積み立てる', 380, 200, 860, 100, { font: DELA, weight: 400, fill: '#ffffff', lh: 1.2 }),
    T('これだけでOK。続けるコツは次の動画で。', 380, 500, 844, 40, { fill: '#c7d0ea' }),
  ]),
]

// ================= 2. YouTube サムネイル: 料理(トマトレッド × バター × ブラウン) =================
const FD = { cream: '#fff3dc', red: '#e8462f', brown: '#3b2314', leaf: '#3f8f4e', but: '#ffc94a' }
const MOCHI = 'Mochiy Pop One'
const fdTag = (bg = FD.red, fg = '#ffffff') => tag('おうち厨房', bg, fg, 'Zen Maru Gothic')
const SUB = 'Zen Maru Gothic'
const YT_FOOD: TemplatePage[] = [
  P('鶏むね肉', FD.cream, () => [
    ...PH(540, 56, 684, 608, 48, '#e8d5b8'),
    ...fdTag(),
    T('パサパサ', 56, 130, 470, 100, { font: MOCHI, weight: 400, fill: FD.brown }),
    T('卒業!', 56, 245, 470, 130, { font: MOCHI, weight: 400, fill: FD.red }),
    R(56, 430, 420, 84, FD.leaf, 42),
    T('しっとり調理法', 56, 448, 420, 44, { font: SUB, weight: 900, fill: '#ffffff', align: 'center' }),
    T('材料は鶏むね肉だけ', 56, 556, 470, 34, { font: SUB, weight: 700, fill: FD.brown }),
  ]),
  P('10分で3品', FD.red, () => [
    ...fdTag(FD.cream, FD.red),
    T('10分', 56, 120, 700, 250, { font: MOCHI, weight: 400, fill: FD.cream }),
    T('で3品完成', 56, 400, 700, 110, { font: MOCHI, weight: 400, fill: FD.but }),
    T('忙しい日のごはん', 56, 580, 640, 40, { font: SUB, weight: 900, fill: FD.cream }),
    ...[['主菜', 70], ['副菜', 270], ['汁物', 470]].flatMap((r) => [
      ...PH(960, r[1] as number, 200, 200, 100, '#f2917f'),
      T(r[0] as string, 780, (r[1] as number) + 80, 150, 40, { font: SUB, weight: 900, fill: FD.cream, align: 'right' }),
    ]),
  ]),
  P('材料3つ', FD.but, () => [
    ...fdTag(FD.brown, FD.but),
    ...PH(700, 56, 524, 340, 40, '#f0b429'),
    T('材料は', 56, 120, 600, 80, { font: SUB, weight: 900, fill: FD.brown }),
    T('3つだけ', 56, 210, 620, 150, { font: MOCHI, weight: 400, fill: FD.red }),
    ...[['たまご', '2個'], ['バター', '10g'], ['しょうゆ', '小さじ1']].flatMap((s, i) => [
      R(56 + i * 414, 440, 340, 190, '#ffffff', 28),
      T(s[0], 80 + i * 414, 468, 292, 56, { font: MOCHI, weight: 400, fill: FD.brown }),
      T(s[1], 80 + i * 414, 552, 292, 44, { font: SUB, weight: 900, fill: FD.red }),
    ]),
  ]),
  P('レンジだけ', FD.brown, () => [
    ...PH(840, 56, 384, 384, 192, '#5a3a26'),
    ...fdTag(FD.but, FD.brown),
    T('火を使わない', 56, 130, 760, 64, { font: SUB, weight: 900, fill: FD.but }),
    T('レンジだけ', 56, 215, 770, 150, { font: MOCHI, weight: 400, fill: FD.cream }),
    T('洗い物も少なくて楽', 56, 560, 760, 48, { font: SUB, weight: 900, fill: FD.cream }),
    Ci(1030, 570, 100, FD.red),
    T('600W', 930, 530, 200, 54, { font: 'Montserrat', weight: 900, fill: '#ffffff', align: 'center' }),
    T('で3分', 930, 596, 200, 36, { font: SUB, weight: 900, fill: '#ffffff', align: 'center' }),
  ]),
  P('卵焼き', FD.cream, () => [
    ...PH(56, 56, 560, 608, 40, '#f0dcb4'),
    ...tag('おうち厨房', FD.red, '#ffffff', SUB, 660, 56),
    T('これだけ守れば', 660, 140, 564, 48, { font: SUB, weight: 900, fill: FD.red }),
    T('卵焼き', 660, 205, 564, 150, { font: MOCHI, weight: 400, fill: FD.brown }),
    T('失敗ゼロ', 660, 370, 564, 110, { font: MOCHI, weight: 400, fill: FD.red }),
    R(660, 540, 564, 92, FD.brown, 46),
    T('ふわふわの3コツ', 660, 560, 564, 44, { font: SUB, weight: 900, fill: FD.but, align: 'center' }),
  ]),
  P('食費1万円', FD.leaf, () => [
    ...fdTag(FD.but, FD.brown),
    T('1ヶ月の食費', 56, 120, 800, 60, { font: SUB, weight: 900, fill: FD.but }),
    T('1万円', 56, 190, 900, 280, { font: MOCHI, weight: 400, fill: '#ffffff' }),
    T('で乗り切る節約レシピ', 56, 540, 900, 56, { font: SUB, weight: 900, fill: '#ffffff' }),
    S('burst', 950, 60, 240, FD.but),
    T('1人分', 950, 148, 240, 56, { font: MOCHI, weight: 400, fill: FD.brown, align: 'center' }),
  ]),
  P('プロの味', FD.brown, () => [
    ...PH(700, 56, 524, 608, 48, '#5a3a26'),
    ...fdTag(FD.but, FD.brown),
    T('おうちで再現', 56, 130, 620, 56, { font: SUB, weight: 900, fill: FD.cream }),
    T('プロの味', 56, 200, 620, 150, { font: MOCHI, weight: 400, fill: FD.but }),
    T('の秘密は\nこの調味料', 56, 390, 620, 64, { font: MOCHI, weight: 400, fill: FD.cream, lh: 1.35 }),
  ]),
  P('市販と手作り', FD.cream, () => [
    ...fdTag(),
    ...PH(56, 112, 540, 350, 32, '#e8d5b8'),
    ...PH(684, 112, 540, 350, 32, '#e8d5b8'),
    R(76, 400, 170, 56, FD.brown, 28), T('市販', 76, 410, 170, 36, { font: SUB, weight: 900, fill: '#ffffff', align: 'center' }),
    R(704, 400, 200, 56, FD.red, 28), T('手作り', 704, 410, 200, 36, { font: SUB, weight: 900, fill: '#ffffff', align: 'center' }),
    Ci(640, 287, 52, FD.but, { stroke: FD.cream, strokeWidth: 8 }),
    T('VS', 590, 262, 100, 44, { font: 'Montserrat', weight: 900, fill: FD.brown, align: 'center' }),
    T('食べ比べ!', 56, 520, 1168, 120, { font: MOCHI, weight: 400, fill: FD.red, align: 'center' }),
  ]),
  P('作り置き', FD.but, () => [
    ...PH(760, 56, 464, 340, 36, '#f0b429'),
    ...fdTag(FD.brown, FD.but),
    T('日曜1時間で', 56, 125, 640, 60, { font: SUB, weight: 900, fill: FD.brown }),
    T('5日分', 56, 195, 680, 230, { font: MOCHI, weight: 400, fill: FD.red }),
    T('作り置き完了', 56, 520, 680, 80, { font: MOCHI, weight: 400, fill: FD.brown }),
    ...['月', '火', '水', '木', '金'].flatMap((d, i) => [
      Ci(800 + i * 90, 480, 40, i % 2 ? FD.brown : FD.red),
      T(d, 760 + i * 90, 462, 80, 40, { font: MOCHI, weight: 400, fill: '#ffffff', align: 'center' }),
    ]),
    T('平日の夜が自由に', 760, 556, 464, 36, { font: SUB, weight: 900, fill: FD.brown }),
  ]),
  P('NG例', FD.red, () => [
    ...PH(660, 56, 564, 608, 40, '#c63a25'),
    ...fdTag(FD.cream, FD.red),
    T('その焼き方', 56, 125, 560, 64, { font: SUB, weight: 900, fill: FD.but }),
    T('NG', 56, 190, 560, 300, { font: MOCHI, weight: 400, fill: FD.cream }),
    T('フライパンを\n冷たいまま使う', 56, 540, 560, 40, { font: SUB, weight: 900, fill: FD.cream, lh: 1.35 }),
  ]),
  P('まとめ', FD.cream, () => [
    ...fdTag(),
    S('check', 56, 150, 220, FD.leaf),
    T('今夜つくる', 330, 130, 800, 56, { font: SUB, weight: 900, fill: FD.red }),
    T('はじめての\nおうち定食', 330, 205, 890, 110, { font: MOCHI, weight: 400, fill: FD.brown, lh: 1.2 }),
    R(330, 480, 560, 90, FD.red, 45),
    T('レシピは概要欄へ', 330, 500, 560, 44, { font: SUB, weight: 900, fill: '#ffffff', align: 'center' }),
  ]),
]

// ================= 3. YouTube サムネイル: ゲーム実況(ブラック × ネオンピンク × シアン) =================
const GM = { bg: '#0d0b1a', pk: '#ff2e88', cy: '#00e5ff', yel: '#ffe600', pur: '#2a1f5c' }
const gmTag = () => tag('ナイトラン実況', GM.pk, '#ffffff', 'Noto Sans JP')
const stripes = () => [S('parallelogram', 700, -60, 700, GM.pur), S('parallelogram', 940, -60, 420, '#3a2a80')]
const YT_GAME: TemplatePage[] = [
  P('初見クリア', GM.bg, () => [
    ...stripes(), ...PH(780, 90, 440, 540, 0, '#3a2a80'),
    ...gmTag(),
    TS('初見で', 56, 130, 700, 90, { font: DELA, weight: 400, fill: '#ffffff' }, GM.bg, 12),
    TS('全ボス', 56, 235, 700, 190, { font: DELA, weight: 400, fill: GM.yel }, GM.bg, 14),
    TS('撃破', 56, 440, 700, 190, { font: DELA, weight: 400, fill: GM.cy }, GM.bg, 14),
  ]),
  P('縛りプレイ', GM.pk, () => [
    ...tag('ナイトラン実況', GM.bg, GM.yel),
    S('burst', 840, 70, 380, GM.yel),
    T('縛り', 860, 175, 340, 100, { font: DELA, weight: 400, fill: GM.bg, align: 'center' }),
    T('回復', 56, 120, 720, 230, { font: DELA, weight: 400, fill: '#ffffff' }),
    T('禁止', 56, 360, 720, 230, { font: DELA, weight: 400, fill: GM.bg }),
    T('ノーダメで最後まで行けるのか', 56, 620, 1000, 40, { weight: 900, fill: '#ffffff' }),
  ]),
  P('ガチャ100連', GM.bg, () => [
    S('star8', 700, 60, 520, GM.pur), S('star8', 790, 150, 340, '#3a2a80'),
    ...gmTag(),
    T('100連', 56, 120, 700, 230, { font: DELA, weight: 400, fill: GM.yel }),
    T('ガチャ', 56, 350, 700, 170, { font: DELA, weight: 400, fill: '#ffffff' }),
    R(56, 550, 560, 90, GM.cy, 12),
    T('神引きなるか', 56, 568, 560, 54, { font: DELA, weight: 400, fill: GM.bg, align: 'center' }),
    T('LUCKY', 770, 280, 400, 110, { font: 'Anton', weight: 400, fill: GM.pk, align: 'center' }),
  ]),
  P('対戦', '#150f2e', () => [
    R(0, 0, 640, 720, '#1c1445'), S('parallelogram', 520, 0, 720, GM.pk),
    ...gmTag(),
    ...PH(56, 150, 400, 400, 200, '#3a2a80'),
    ...PH(824, 150, 400, 400, 200, '#4a3a90'),
    Ci(640, 350, 90, GM.yel, { stroke: GM.bg, strokeWidth: 10 }),
    T('VS', 550, 308, 180, 90, { font: DELA, weight: 400, fill: GM.bg, align: 'center' }),
    T('友達に負けたら罰ゲーム', 56, 596, 1168, 64, { font: DELA, weight: 400, fill: '#ffffff', align: 'center' }),
  ]),
  P('ホラー', '#05050a', () => [
    ...PH(660, 0, 620, 720, 0, '#1a1a2a'),
    R(640, 0, 20, 720, '#d4001f'),
    ...tag('ナイトラン実況', '#d4001f', '#ffffff'),
    TS('絶叫', 56, 120, 580, 250, { font: DELA, weight: 400, fill: '#ff2a44' }, '#05050a', 14),
    TS('注意', 56, 390, 580, 150, { font: DELA, weight: 400, fill: '#ffffff' }, '#05050a', 12),
    T('音量を下げて見てください', 56, 580, 580, 38, { weight: 900, fill: '#ffe600' }),
  ]),
  P('記録更新', GM.bg, () => [
    S('parallelogram', -100, 440, 1500, GM.pur),
    ...gmTag(),
    T('世界記録', 56, 120, 1100, 180, { font: DELA, weight: 400, fill: GM.yel }),
    T('更新なるか', 56, 310, 1100, 120, { font: DELA, weight: 400, fill: '#ffffff' }),
    T('0:48.12', 56, 500, 760, 150, { font: 'Oswald', weight: 700, fill: GM.cy }),
    T('現在のベストタイム', 700, 590, 520, 40, { weight: 900, fill: '#ffffff', align: 'right' }),
  ]),
  P('武器検証', GM.bg, () => [
    ...PH(660, 70, 564, 380, 30, '#3a2a80'),
    ...gmTag(),
    T('最強武器', 56, 125, 600, 110, { font: DELA, weight: 400, fill: '#ffffff' }),
    T('全部', 56, 245, 600, 110, { font: DELA, weight: 400, fill: GM.cy }),
    T('検証した', 56, 365, 600, 110, { font: DELA, weight: 400, fill: GM.yel }),
    ...['S', 'A', 'B'].flatMap((r, i) => [
      R(660 + i * 192, 490, 180, 160, [GM.pk, GM.yel, GM.cy][i], 16),
      T(r, 660 + i * 192, 520, 180, 100, { font: DELA, weight: 400, fill: GM.bg, align: 'center' }),
    ]),
  ]),
  P('最終回', GM.pk, () => [
    ...tag('ナイトラン実況', GM.bg, GM.yel),
    T('#FINAL', 56, 120, 1000, 90, { font: 'Montserrat', weight: 900, fill: GM.bg }),
    T('最終回', 56, 215, 1000, 280, { font: DELA, weight: 400, fill: '#ffffff' }),
    T('100時間の冒険がついに終わる', 56, 560, 1000, 48, { weight: 900, fill: GM.bg }),
    S('lightning', 960, 120, 280, GM.yel),
  ]),
  P('初心者講座', GM.bg, () => [
    ...gmTag(),
    T('初心者', 56, 120, 900, 200, { font: DELA, weight: 400, fill: GM.cy }),
    T('これだけ', 56, 330, 900, 150, { font: DELA, weight: 400, fill: '#ffffff' }),
    ...[['1', '移動'], ['2', '回避'], ['3', '回復']].flatMap((s, i) => [
      R(56 + i * 260, 530, 240, 110, GM.pur, 14),
      T(s[0], 70 + i * 260, 548, 60, 70, { font: DELA, weight: 400, fill: GM.pk }),
      T(s[1], 130 + i * 260, 560, 110, 48, { font: DELA, weight: 400, fill: '#ffffff' }),
    ]),
    ...PH(900, 120, 324, 520, 24, '#3a2a80'),
  ]),
  P('配信告知', GM.pur, () => [
    ...tag('ナイトラン実況', GM.pk, '#ffffff'),
    S('parallelogram', 600, -40, 800, GM.bg),
    T('LIVE', 56, 120, 600, 170, { font: 'Anton', weight: 400, fill: GM.pk }),
    T('今夜21時', 56, 310, 700, 120, { font: DELA, weight: 400, fill: '#ffffff' }),
    T('視聴者参加型 / 雑談あり', 56, 460, 700, 44, { weight: 900, fill: GM.cy }),
    R(56, 560, 460, 84, GM.yel, 42),
    T('通知をオンにしてね', 56, 578, 460, 44, { weight: 900, fill: GM.bg, align: 'center' }),
    ...PH(780, 100, 400, 520, 30, '#3a2a80'),
  ]),
]

// ================= 4. ブログ・note アイキャッチ: ノート(ペーパー × インク × ティール) =================
const NT = { paper: '#f6f3ee', ink: '#1b2430', teal: '#0f766e', clay: '#c4552d', line: '#d9d2c5', mute: '#6b7280' }
const MINCHO = 'Shippori Mincho'
const ntLabel = (s: string, fill = NT.teal, x = 72) => T(s, x, 56, Math.min(700, 1200 - x - 72), 26, { font: 'Montserrat', weight: 700, fill, spacing: 300 })
const ntFoot = (fill = NT.mute, x = 72, w = 1056, align = 'right') => T('sample-blog.example.com', x, 548, w, 24, { font: 'Montserrat', weight: 400, fill, align })
const BLOG_NOTE: TemplatePage[] = [
  P('見出し左', NT.paper, () => [
    ntLabel('WORK STYLE'), R(72, 104, 60, 6, NT.clay),
    T('ひとりで働く人の、\n時間の使い方', 72, 170, 1056, 84, { font: MINCHO, weight: 800, fill: NT.ink, lh: 1.4 }),
    T('フリーランス3年目に気づいたこと', 72, 440, 1056, 32, { weight: 500, fill: NT.mute }),
    ntFoot(),
  ]),
  P('数字リスト', NT.paper, () => [
    ntLabel('HABIT'),
    T('7', 60, 70, 360, 440, { font: 'Playfair Display', weight: 900, fill: NT.clay }),
    T('在宅ワークが続く\n7つの習慣', 420, 180, 708, 66, { font: MINCHO, weight: 800, fill: NT.ink, lh: 1.45 }),
    R(420, 420, 60, 6, NT.teal),
    T('三日坊主だった私が半年続けられた方法', 420, 450, 708, 28, { weight: 500, fill: NT.mute }),
    ntFoot(),
  ]),
  P('中央・濃色', NT.ink, () => [
    R(48, 48, 1104, 534, '', 0, { stroke: '#f6f3ee', strokeWidth: 2 }),
    T('BOOKS', 0, 100, 1200, 26, { font: 'Montserrat', weight: 700, fill: '#e9b44c', align: 'center', spacing: 400 }),
    T('読書は、\n量より設計', 72, 180, 1056, 92, { font: MINCHO, weight: 800, fill: '#f6f3ee', align: 'center', lh: 1.4 }),
    T('読んだ本を仕事に活かす3つの型', 72, 440, 1056, 30, { weight: 500, fill: '#c9c2b4', align: 'center' }),
  ]),
  P('問いかけ+写真', NT.paper, () => [
    ...PH(780, 0, 420, 630, 0, '#d9d2c5'),
    ntLabel('MORNING'),
    R(72, 130, 8, 270, NT.clay),
    T('なぜ、朝の30分で\n人生が変わるのか', 108, 130, 640, 64, { font: MINCHO, weight: 800, fill: NT.ink, lh: 1.5 }),
    T('習慣化の科学を\nやさしく読み解く', 108, 340, 640, 32, { weight: 500, fill: NT.mute, lh: 1.6 }),
    ntFoot(NT.mute, 72, 640),
  ]),
  P('縦書き', NT.paper, () => [
    ntLabel('ESSAY'),
    new VText({ text: '静かな時間を\n取り戻す', fontFamily: MINCHO, fontSize: 68, fontWeight: 800, maxChars: 8, fill: NT.ink, left: 820, top: 70, charSpacing: 0.08 }),
    R(760, 70, 3, 420, NT.line),
    T('スマホを置いて\n過ごす夜のはなし', 72, 360, 600, 34, { weight: 500, fill: NT.mute, lh: 1.7 }),
    R(72, 304, 60, 6, NT.clay),
    ntFoot(NT.mute, 72, 600, 'left'),
  ]),
  P('チェックリスト', NT.paper, () => [
    ntLabel('GUIDE'),
    T('失敗しない\nPCの選び方', 72, 160, 540, 72, { font: MINCHO, weight: 800, fill: NT.ink, lh: 1.4 }),
    ...['CPU', 'メモリ', 'ストレージ'].flatMap((s, i) => [
      R(660, 120 + i * 130, 468, 2, NT.line),
      S('check', 660, 150 + i * 130, 44, NT.teal),
      T(s, 730, 144 + i * 130, 398, 44, { weight: 900, fill: NT.ink }),
    ]),
    R(660, 510, 468, 2, NT.line),
    T('購入前に見る3つの数字', 72, 440, 540, 30, { weight: 500, fill: NT.mute }),
  ]),
  P('ビフォーアフター', NT.paper, () => [
    R(600, 0, 600, 630, NT.ink),
    T('BEFORE', 72, 70, 456, 26, { font: 'Montserrat', weight: 700, fill: NT.mute, spacing: 300 }),
    T('AFTER', 672, 70, 456, 26, { font: 'Montserrat', weight: 700, fill: '#e9b44c', spacing: 300 }),
    T('机の上は\n書類の山', 72, 210, 456, 56, { font: MINCHO, weight: 800, fill: NT.ink, lh: 1.5 }),
    T('机の上は\n1冊とPCだけ', 672, 210, 456, 56, { font: MINCHO, weight: 800, fill: '#f6f3ee', lh: 1.5 }),
    R(72, 480, 456, 2, NT.line), T('デスク整理術', 72, 500, 456, 28, { weight: 700, fill: NT.mute }),
    S('arrowR', 560, 270, 80, NT.clay, {}),
  ]),
  P('引用', NT.teal, () => [
    T('“', 72, 20, 300, 300, { font: 'Playfair Display', weight: 700, fill: 'rgba(246,243,238,0.35)' }),
    T('急がば、\n休め。', 72, 190, 1056, 120, { font: MINCHO, weight: 800, fill: '#f6f3ee', lh: 1.3 }),
    R(72, 470, 60, 6, '#e9b44c'),
    T('疲れをためない働き方', 72, 500, 800, 30, { weight: 500, fill: '#d7ece8' }),
  ]),
  P('写真+文章', NT.paper, () => [
    ...PH(0, 0, 520, 630, 0, '#d9d2c5'),
    ntLabel('TRAVEL', NT.teal, 580),
    T('旅先で\n仕事をする\nということ', 580, 150, 548, 64, { font: MINCHO, weight: 800, fill: NT.ink, lh: 1.4 }),
    R(580, 450, 60, 6, NT.clay),
    T('ワーケーション1年の記録', 580, 480, 548, 28, { weight: 500, fill: NT.mute }),
  ]),
  P('まとめ帯', NT.paper, () => [
    ntLabel('LESS IS MORE'),
    T('やめて、うまくいった\n5つのこと', 72, 120, 1056, 72, { font: MINCHO, weight: 800, fill: NT.ink, lh: 1.4 }),
    R(0, 420, 1200, 210, NT.ink),
    ...['朝の通知', '長い会議', '完璧主義', '夜のSNS', '二度寝'].map((s, i, a) => {
      const ws = a.map((x) => x.length * 30 + 48)
      const x = 72 + ws.slice(0, i).reduce((p, c) => p + c + 20, 0)
      return [R(x, 490, ws[i], 70, '#f6f3ee', 35), T(s, x, 507, ws[i], 30, { weight: 900, fill: NT.ink, align: 'center' })]
    }).flat(),
  ]),
]

// ================= 5. ブログ・note アイキャッチ: ポップ(ミント × ネイビー × コーラル) =================
const PB = { mint: '#e8f6f0', navy: '#1d2b4f', coral: '#ff6b57', sun: '#ffc933', white: '#ffffff' }
const pbChip = (s: string, x = 72, y = 56, bg = PB.coral, fg = '#ffffff') => {
  const w = s.length * 26 + 48
  return [R(x, y, w, 48, bg, 24), T(s, x, y + 8, w, 26, { font: SUB, weight: 900, fill: fg, align: 'center' })]
}
const BLOG_POP: TemplatePage[] = [
  P('入門', PB.mint, () => [
    R(48, 48, 1104, 534, PB.white, 40),
    S('blob1', 860, 300, 300, PB.sun),
    ...pbChip('HOW TO', 96, 84),
    T('初心者でも5分!', 96, 170, 900, 56, { font: SUB, weight: 900, fill: PB.coral }),
    T('スプレッドシート\n自動化入門', 96, 245, 900, 100, { font: MOCHI, weight: 400, fill: PB.navy, lh: 1.25 }),
  ]),
  P('比較', PB.sun, () => [
    ...pbChip('比較', 72, 56, PB.navy, PB.sun),
    T('無料 vs 有料', 72, 150, 1056, 120, { font: MOCHI, weight: 400, fill: PB.navy }),
    T('どっちを選ぶ?', 72, 290, 1056, 120, { font: MOCHI, weight: 400, fill: PB.navy }),
    R(72, 470, 300, 80, PB.navy, 40), T('無料プラン', 72, 490, 300, 40, { font: SUB, weight: 900, fill: PB.sun, align: 'center' }),
    R(396, 470, 300, 80, PB.white, 40), T('有料プラン', 396, 490, 300, 40, { font: SUB, weight: 900, fill: PB.navy, align: 'center' }),
  ]),
  P('ランキング', PB.navy, () => [
    ...pbChip('RANKING', 72, 56, PB.sun, PB.navy),
    T('おすすめ\nアプリ', 72, 150, 700, 130, { font: MOCHI, weight: 400, fill: PB.white, lh: 1.2 }),
    T('TOP5', 640, 120, 500, 190, { font: 'Montserrat', weight: 900, fill: PB.sun }),
    S('star5', 880, 330, 220, PB.coral),
    T('毎日使って選びました', 72, 520, 700, 32, { font: SUB, weight: 700, fill: '#b9c4e3' }),
  ]),
  P('3ステップ', PB.mint, () => [
    ...pbChip('STEP', 72, 56),
    T('たった3ステップで\nできるようになる', 72, 140, 1056, 78, { font: MOCHI, weight: 400, fill: PB.navy, lh: 1.3 }),
    ...['準備', '設定', '完成'].flatMap((s, i) => [
      Ci(150 + i * 340, 440, 66, i === 2 ? PB.coral : PB.navy),
      T(String(i + 1), 100 + i * 340, 410, 100, 60, { font: MOCHI, weight: 400, fill: PB.white, align: 'center' }),
      T(s, 250 + i * 340, 416, 140, 48, { font: SUB, weight: 900, fill: PB.navy }),
      ...(i < 2 ? [S('arrowR', 395 + i * 340, 414, 52, PB.sun)] : []),
    ]),
  ]),
  P('数字強調', PB.white, () => [
    ...pbChip('実績', 72, 56, PB.navy, PB.sun),
    T('作業時間が', 72, 150, 700, 64, { font: SUB, weight: 900, fill: PB.navy }),
    T('80%', 72, 220, 760, 250, { font: 'Montserrat', weight: 900, fill: PB.coral }),
    T('減った', 560, 340, 560, 130, { font: MOCHI, weight: 400, fill: PB.navy }),
    R(72, 520, 1056, 6, PB.sun),
  ]),
  P('失敗談', PB.coral, () => [
    ...pbChip('失敗談', 72, 56, PB.white, PB.coral),
    T('やってしまった', 72, 150, 1056, 72, { font: SUB, weight: 900, fill: PB.white }),
    T('3つのミス', 72, 235, 1056, 180, { font: MOCHI, weight: 400, fill: PB.white }),
    S('triangle', 900, 120, 220, PB.sun),
    T('!', 900, 205, 220, 110, { font: MOCHI, weight: 400, fill: PB.navy, align: 'center' }),
    T('同じ失敗をしないために', 72, 500, 800, 34, { font: SUB, weight: 700, fill: '#ffe3de' }),
  ]),
  P('問いかけ', PB.mint, () => [
    S('bubble', 560, 70, 520, PB.sun),
    T('本当に\n必要?', 610, 160, 420, 110, { font: MOCHI, weight: 400, fill: PB.navy, align: 'center', lh: 1.2 }),
    ...pbChip('見直し', 72, 56, PB.navy, PB.white),
    T('これ、買う前に\n考えたいこと', 72, 200, 500, 56, { font: MOCHI, weight: 400, fill: PB.navy, lh: 1.4 }),
    T('お金と時間の使い方を見直す', 72, 460, 560, 28, { font: SUB, weight: 700, fill: PB.coral }),
  ]),
  P('写真+文', PB.white, () => [
    ...PH(660, 48, 492, 534, 40, '#d6efe3'),
    ...pbChip('WORK', 72, 56, PB.sun, PB.navy),
    T('在宅ワーク\n環境を\n整えた話', 72, 150, 560, 82, { font: MOCHI, weight: 400, fill: PB.navy, lh: 1.25 }),
    R(72, 500, 120, 8, PB.coral),
  ]),
  P('お知らせ', PB.navy, () => [
    ...pbChip('お知らせ', 72, 56, PB.coral, '#ffffff'),
    T('ブログを\nリニューアル\nしました', 72, 150, 760, 90, { font: MOCHI, weight: 400, fill: PB.white, lh: 1.25 }),
    S('burst', 860, 280, 260, PB.sun),
    T('NEW', 860, 375, 260, 70, { font: 'Montserrat', weight: 900, fill: PB.navy, align: 'center' }),
  ]),
  P('チェックリスト', PB.mint, () => [
    ...pbChip('保存版', 72, 56),
    T('チェックリスト\n付き', 72, 140, 700, 84, { font: MOCHI, weight: 400, fill: PB.navy, lh: 1.25 }),
    ...['目的を決める', '期限を決める', '共有する人を決める'].flatMap((s, i) => [
      R(72, 360 + i * 70, 640, 58, PB.white, 29),
      S('check', 92, 370 + i * 70, 38, PB.coral),
      T(s, 148, 370 + i * 70, 540, 36, { font: SUB, weight: 900, fill: PB.navy }),
    ]),
    S('blob2', 800, 200, 330, PB.sun),
  ]),
]

// ================= 6. X(Twitter)投稿: 告知・Tips(ペーパー × インク × オレンジ) =================
const XT = { paper: '#fbfaf7', ink: '#14110f', or: '#ff5a1f', soft: '#f1ece3', mute: '#6b645c' }
const ZK = 'Zen Kaku Gothic New'
const xChip = (s: string, x = 96, y = 70, bg = XT.or, fg = '#ffffff') => {
  const w = s.length * 30 + 56
  return [R(x, y, w, 56, bg, 28), T(s, x, y + 9, w, 30, { font: 'Montserrat', weight: 900, fill: fg, align: 'center', spacing: 100 })]
}
const xFoot = (fill = XT.mute) => T('@sample_account', 96, 808, 600, 28, { font: 'Montserrat', weight: 700, fill })
const X_TIPS: TemplatePage[] = [
  P('新サービス告知', XT.paper, () => [
    R(1290, 0, 310, 900, XT.or), S('arrowR', 1330, 330, 230, '#ffffff'),
    ...xChip('NEW'),
    T('ノーコードで\n予約ページが作れる', 96, 190, 1140, 112, { font: ZK, weight: 900, fill: XT.ink, lh: 1.3 }),
    T('無料で、今日から始められます。', 96, 580, 1140, 48, { weight: 500, fill: XT.mute }),
    xFoot(),
  ]),
  P('Tips 3選', XT.paper, () => [
    ...xChip('TIPS'),
    T('知っておきたい\n時短Tips\n3選', 96, 190, 640, 100, { font: ZK, weight: 900, fill: XT.ink, lh: 1.3 }),
    ...['ショートカットを覚える', '定型文を登録する', '通知を1日2回にする'].flatMap((s, i) => [
      R(840, 160 + i * 195, 664, 2, XT.ink),
      T('0' + (i + 1), 840, 190 + i * 195, 140, 64, { font: 'Montserrat', weight: 900, fill: XT.or }),
      T(s, 990, 206 + i * 195, 514, 40, { weight: 900, fill: XT.ink }),
    ]),
    xFoot(),
  ]),
  P('数字報告', XT.ink, () => [
    ...xChip('THANKS'),
    T('10,000', 96, 190, 1080, 270, { font: 'Montserrat', weight: 900, fill: XT.or }),
    T('DL', 1180, 340, 330, 150, { font: 'Montserrat', weight: 900, fill: '#ffffff' }),
    T('リリースから3ヶ月で、1万ダウンロードを達成しました。', 96, 590, 1408, 48, { weight: 500, fill: '#e4ddd0' }),
    xFoot('#b6ac9c'),
  ]),
  P('登壇告知', XT.paper, () => [
    R(96, 150, 520, 560, XT.ink, 32),
    T('NOV', 96, 190, 520, 56, { font: 'Montserrat', weight: 700, fill: XT.or, align: 'center', spacing: 300 }),
    T('20', 96, 260, 520, 300, { font: 'Montserrat', weight: 900, fill: '#ffffff', align: 'center' }),
    T('THU 19:00', 96, 600, 520, 48, { font: 'Montserrat', weight: 700, fill: '#d8cfbf', align: 'center' }),
    ...xChip('SEMINAR', 720, 150),
    T('登壇します', 720, 260, 784, 130, { font: ZK, weight: 900, fill: XT.ink }),
    T('UX改善の最前線\n〜小さな変更で成果を出す〜', 720, 430, 784, 46, { weight: 700, fill: XT.ink, lh: 1.6 }),
    T('オンライン開催 / 参加無料', 720, 640, 784, 36, { weight: 500, fill: XT.mute }),
    xFoot(),
  ]),
  P('募集', XT.or, () => [
    ...xChip('JOIN', 96, 70, XT.ink, '#ffffff'),
    T('仲間を', 96, 180, 1000, 190, { font: ZK, weight: 900, fill: XT.ink }),
    T('募集中', 96, 380, 1000, 190, { font: ZK, weight: 900, fill: '#ffffff' }),
    ...['週1日〜OK', 'フルリモート', '未経験歓迎'].map((s, i) => [
      R(96 + i * 380, 650, 350, 84, XT.ink, 42), T(s, 96 + i * 380, 672, 350, 40, { weight: 900, fill: '#ffffff', align: 'center' }),
    ]).flat(),
    xFoot(XT.ink),
  ]),
  P('ひとこと', XT.ink, () => [
    T('“', 96, 20, 400, 360, { font: 'Playfair Display', weight: 700, fill: XT.or }),
    T('完璧より、\nまず公開。', 96, 270, 1300, 150, { font: 'Shippori Mincho', weight: 800, fill: '#f5f0e6', lh: 1.3 }),
    R(96, 700, 80, 6, XT.or),
    xFoot('#b6ac9c'),
  ]),
  P('ビフォーアフター', XT.paper, () => [
    T('資料づくりの時間', 96, 70, 1408, 56, { font: ZK, weight: 900, fill: XT.ink }),
    R(96, 190, 640, 560, XT.soft, 32), R(864, 190, 640, 560, XT.or, 32),
    T('BEFORE', 140, 230, 400, 36, { font: 'Montserrat', weight: 700, fill: XT.mute, spacing: 300 }),
    T('AFTER', 908, 230, 400, 36, { font: 'Montserrat', weight: 700, fill: '#ffffff', spacing: 300 }),
    T('3時間', 140, 360, 560, 200, { font: ZK, weight: 900, fill: XT.ink }),
    T('30分', 908, 360, 560, 200, { font: ZK, weight: 900, fill: '#ffffff' }),
    T('ゼロから作る', 140, 620, 560, 40, { weight: 700, fill: XT.mute }),
    T('テンプレから作る', 908, 620, 560, 40, { weight: 700, fill: '#ffffff' }),
    S('arrowR', 750, 410, 100, XT.ink),
    xFoot(),
  ]),
  P('チェックリスト', XT.paper, () => [
    ...xChip('CHECK'),
    T('提出前の\n5項目\nチェック', 96, 190, 600, 100, { font: ZK, weight: 900, fill: XT.ink, lh: 1.3 }),
    ...['誤字脱字を確認する', '数字の根拠を確認する', '宛名と日付を確認する', 'ファイル名を確認する', '共有範囲を確認する'].flatMap((s, i) => [
      R(800, 130 + i * 118, 704, 98, XT.soft, 20),
      S('check', 830, 150 + i * 118, 58, XT.or),
      T(s, 920, 160 + i * 118, 560, 40, { weight: 900, fill: XT.ink }),
    ]),
    xFoot(),
  ]),
  P('スレッド導入', XT.paper, () => [
    ...xChip('THREAD'),
    T('初心者がつまずく\n5つの落とし穴', 96, 190, 1408, 120, { font: ZK, weight: 900, fill: XT.ink, lh: 1.3 }),
    T('先に知っておくだけで、遠回りしなくて済みます。', 96, 520, 1408, 44, { weight: 500, fill: XT.mute }),
    R(0, 700, 1600, 200, XT.or),
    T('スレッドで1つずつ解説します', 96, 758, 1200, 56, { weight: 900, fill: '#ffffff' }),
    S('arrowD', 1380, 730, 130, '#ffffff'),
  ]),
  P('アンケート', XT.soft, () => [
    ...xChip('POLL'),
    T('あなたは', 96, 180, 1408, 56, { weight: 900, fill: XT.ink }),
    T('朝型?夜型?', 96, 250, 1408, 190, { font: ZK, weight: 900, fill: XT.ink }),
    R(96, 540, 660, 170, '#ffffff', 40, { stroke: XT.ink, strokeWidth: 4 }),
    R(844, 540, 660, 170, XT.ink, 40),
    T('A  朝型', 96, 590, 660, 70, { weight: 900, fill: XT.ink, align: 'center' }),
    T('B  夜型', 844, 590, 660, 70, { weight: 900, fill: '#ffffff', align: 'center' }),
    xFoot(),
  ]),
]

// ================= 7. LINE リッチメニュー: 業種別 10 パターン(2500×1686) =================
type RmStyle = { cell: string; fg: string; sub: string; ic: string; icfg: string; font?: string; r?: number }
type RmCell = [label: string, sub: string, icon: string]
const RM_LAYOUT: Record<string, number[][]> = {
  g6: [[0, 0, 833, 843], [833, 0, 834, 843], [1667, 0, 833, 843], [0, 843, 833, 843], [833, 843, 834, 843], [1667, 843, 833, 843]],
  g4: [[0, 0, 1250, 843], [1250, 0, 1250, 843], [0, 843, 1250, 843], [1250, 843, 1250, 843]],
  g3: [[0, 0, 2500, 843], [0, 843, 1250, 843], [1250, 843, 1250, 843]],
  g5: [[0, 0, 1250, 843], [1250, 0, 1250, 843], [0, 843, 833, 843], [833, 843, 834, 843], [1667, 843, 833, 843]],
  g2: [[0, 0, 1250, 1686], [1250, 0, 1250, 843], [1250, 843, 1250, 843]],
}
const rmPage = (label: string, bg: string, layout: string, st: RmStyle, cells: RmCell[]): TemplatePage =>
  P(label, bg, () => {
    const out: any[] = []
    RM_LAYOUT[layout].forEach(([x, y, w, h], i) => {
      const [t, s, ic] = cells[i]
      const cx = x + w / 2, cy = y + h / 2
      out.push(R(x + 10, y + 10, w - 20, h - 20, st.cell, st.r ?? 0))
      out.push(Ci(cx, cy - 130, 130, st.ic))
      out.push(S(ic, cx - 70, cy - 200, 140, st.icfg))
      out.push(T(t, x + 30, cy + 40, w - 60, 100, { font: st.font, weight: 900, fill: st.fg, align: 'center' }))
      out.push(T(s, x + 30, cy + 175, w - 60, 52, { weight: 500, fill: st.sub, align: 'center' }))
    })
    return out
  })
const LINE_RM: TemplatePage[] = [
  rmPage('美容室', '#f6e9e4', 'g6', { cell: '#fffaf7', fg: '#5a3d33', sub: '#9a7b6f', ic: '#e8c3b8', icfg: '#ffffff', font: ZK }, [['ネット予約', '24時間受付', 'heart'], ['メニュー', '料金のご案内', 'diamond'], ['スタイル', 'ヘアカタログ', 'star5'], ['スタッフ', '担当のご紹介', 'badge'], ['クーポン', '初回15%OFF', 'ribbon'], ['アクセス', '駅から徒歩3分', 'drop']]),
  rmPage('カフェ', '#e9f0e4', 'g4', { cell: '#fbfdf8', fg: '#2f4a2e', sub: '#6d8a6a', ic: '#cfe2c6', icfg: '#3f6b3c', r: 40 }, [['メニュー', '本日のおすすめ', 'cloud'], ['席の予約', 'ご来店前にどうぞ', 'check'], ['テイクアウト', '事前注文で待たずに', 'arrowR'], ['アクセス・営業時間', '9:00〜18:00', 'drop']]),
  rmPage('クリニック', '#e6f3f3', 'g6', { cell: '#ffffff', fg: '#0b4f55', sub: '#5b8b90', ic: '#bfe3e3', icfg: '#0b7a82' }, [['診療予約', '順番待ちを短縮', 'check'], ['診療時間', '休診日のご案内', 'moon'], ['診療科目', '内科・小児科', 'cross'], ['初めての方へ', '受診の流れ', 'bubbleRound'], ['お知らせ', '休診・予防接種', 'lightning'], ['アクセス', '駐車場あり', 'drop']]),
  rmPage('整体院', '#f2efe8', 'g5', { cell: '#ffffff', fg: '#3a3a35', sub: '#8b8a80', ic: '#e0dccc', icfg: '#6e7a55', font: ZK }, [['予約する', '当日予約もOK', 'check'], ['施術メニュー', '肩こり・腰痛', 'heart'], ['料金', '初回体験 2,980円', 'diamond'], ['お客様の声', '改善事例', 'bubble'], ['アクセス', '地図を見る', 'drop']]),
  rmPage('不動産', '#e8edf5', 'g6', { cell: '#ffffff', fg: '#1d2f55', sub: '#6a7a9c', ic: '#d3dcee', icfg: '#2f4c8f' }, [['物件を探す', '賃貸・売買', 'pentagon'], ['新着物件', '毎週更新', 'burst'], ['内見の予約', 'LINEで簡単', 'check'], ['住まいの相談', 'チャットで気軽に', 'bubbleRound'], ['ローン試算', '月々の目安', 'diamond'], ['店舗案内', '営業時間・地図', 'drop']]),
  rmPage('学習塾', '#fff3dc', 'g4', { cell: '#ffffff', fg: '#5b3a00', sub: '#a37a2c', ic: '#ffe1a0', icfg: '#e08a00', r: 50, font: ZK }, [['体験授業', '無料で受けられます', 'star5'], ['コース案内', '小学生〜高校生', 'triangle'], ['合格実績', '今年度の結果', 'ribbon'], ['保護者の連絡', '欠席・振替', 'bubble']]),
  rmPage('フィットネス', '#14181c', 'g6', { cell: '#222a31', fg: '#e8ff5a', sub: '#9aa6b0', ic: '#e8ff5a', icfg: '#14181c', font: 'Montserrat' }, [['体験予約', '手ぶらでOK', 'lightning'], ['プラン料金', '月額・回数券', 'diamond'], ['スケジュール', 'レッスン表', 'check'], ['トレーナー', 'パーソナル', 'star5'], ['入会特典', '事務手数料0円', 'burst'], ['アクセス', '24時間営業', 'drop']]),
  rmPage('ネイルサロン', '#fbe8ef', 'g3', { cell: '#fff7fa', fg: '#7a2f4b', sub: '#b57a90', ic: '#f6c6d6', icfg: '#ffffff', r: 30, font: ZK }, [['ご予約はこちら', 'ネイル・まつげのご予約', 'heart'], ['デザインを見る', 'ギャラリー', 'star5'], ['料金・クーポン', '初回オフ無料', 'ribbon']]),
  rmPage('旅館・ホテル', '#2b2118', 'g5', { cell: '#3a2d22', fg: '#f3e3c3', sub: '#bda985', ic: '#c9a45c', icfg: '#2b2118', font: 'Shippori Mincho' }, [['宿泊予約', '公式サイト限定特典', 'moon'], ['お部屋・プラン', '全12室', 'diamond'], ['お食事', '地元の旬の味', 'drop'], ['温泉', '貸切風呂あり', 'cloud'], ['アクセス', '送迎のご案内', 'arrowR']]),
  rmPage('ネットショップ', '#fff0e6', 'g6', { cell: '#ffffff', fg: '#7a2a0e', sub: '#b5805f', ic: '#ffd0b4', icfg: '#e5531a' }, [['ショップ', '商品一覧', 'pentagon'], ['新商品', '今月の入荷', 'burst'], ['クーポン', '友だち限定', 'ribbon'], ['注文状況', '発送のご確認', 'check'], ['よくある質問', '配送・返品', 'bubbleRound'], ['お問い合わせ', 'チャットで対応', 'bubble']]),
]

// ================= 8. ロゴ 10 案(500×500) =================
const logoName = (s: string, y: number, c: string, size = 40, font = 'Montserrat', sp = 150) => T(s, 20, y, 460, size, { font, weight: 800, fill: c, align: 'center', spacing: sp })
const LOGOS: TemplatePage[] = [
  P('パン工房(丸型バッジ)', '#fbf3e6', () => [
    Ci(250, 250, 220, '#7a4a21'), Ci(250, 250, 200, '#fbf3e6'), Ci(250, 250, 186, '#7a4a21'),
    S('cloud', 170, 120, 160, '#fbf3e6'),
    T('ことり', 70, 290, 360, 72, { font: 'Shippori Mincho', weight: 800, fill: '#fbf3e6', align: 'center' }),
    T('BAKERY & CAFE', 70, 380, 360, 26, { font: 'Montserrat', weight: 700, fill: '#e8cfa6', align: 'center', spacing: 250 }),
  ]),
  P('ARC スタジオ(アーチ)', '#ffffff', () => [
    S('arch', 160, 70, 180, '#1e3a8a'), S('arch', 195, 105, 110, '#ffffff'), S('arch', 225, 140, 50, '#f59e0b'),
    logoName('ARC STUDIO', 300, '#1e3a8a', 48, 'Montserrat', 120),
    T('DESIGN  &  ARCHITECTURE', 20, 380, 460, 22, { font: 'Montserrat', weight: 600, fill: '#6b7280', align: 'center', spacing: 300 }),
  ]),
  P('コーヒー(星)', '#2a1c14', () => [
    S('star5', 175, 70, 150, '#e8b25a'),
    logoName('HOSHI', 250, '#f6e7cf', 96, 'Montserrat', 200),
    R(150, 370, 200, 3, '#e8b25a'),
    T('COFFEE ROASTERS', 20, 395, 460, 26, { font: 'Montserrat', weight: 600, fill: '#e8b25a', align: 'center', spacing: 350 }),
  ]),
  P('結(落款風)', '#f3ece0', () => [
    R(145, 55, 210, 210, '#b3261e', 14),
    T('結', 145, 56, 210, 160, { font: 'Shippori Mincho', weight: 800, fill: '#f3ece0', align: 'center' }),
    T('ゆい', 20, 300, 460, 64, { font: 'Shippori Mincho', weight: 800, fill: '#2b2b2b', align: 'center', spacing: 300 }),
    T('手しごと雑貨のお店', 20, 395, 460, 28, { weight: 500, fill: '#6b6258', align: 'center', spacing: 200 }),
  ]),
  P('TOKYO LAB(モノグラム)', '#0f172a', () => [
    R(150, 60, 200, 200, '#0f172a', 0, { stroke: '#38bdf8', strokeWidth: 8 }),
    T('TL', 150, 100, 200, 120, { font: 'Montserrat', weight: 900, fill: '#38bdf8', align: 'center' }),
    logoName('TOKYO LAB', 310, '#ffffff', 56, 'Montserrat', 200),
    T('RESEARCH & DEVELOPMENT', 20, 395, 460, 20, { font: 'Montserrat', weight: 600, fill: '#7dd3fc', align: 'center', spacing: 300 }),
  ]),
  P('Leaf & Co.(葉)', '#eef6ea', () => [
    S('blob2', 165, 50, 170, '#3f8f4f'), S('drop', 220, 100, 60, '#eef6ea'),
    T('Leaf & Co.', 20, 260, 460, 70, { font: 'Playfair Display', weight: 700, fill: '#235c2f', align: 'center' }),
    T('ORGANIC  GOODS', 20, 392, 460, 26, { font: 'Montserrat', weight: 700, fill: '#5f9a6b', align: 'center', spacing: 400 }),
  ]),
  P('整骨院(しずく)', '#ffffff', () => [
    Ci(250, 160, 100, '#e0f2fe'), S('drop', 205, 105, 90, '#0284c7'),
    T('みなと整骨院', 20, 290, 460, 64, { font: ZK, weight: 900, fill: '#075985', align: 'center' }),
    T('MINATO CHIROPRACTIC', 20, 375, 460, 22, { font: 'Montserrat', weight: 600, fill: '#0284c7', align: 'center', spacing: 250 }),
  ]),
  P('NOVA(ダーク)', '#0b0b12', () => [
    S('star8', 150, 50, 200, '#ff3d81'), Ci(250, 150, 36, '#0b0b12'),
    logoName('NOVA', 290, '#ffffff', 110, 'Montserrat', 300),
    T('MUSIC  /  EVENT', 20, 420, 460, 22, { font: 'Montserrat', weight: 600, fill: '#ff3d81', align: 'center', spacing: 400 }),
  ]),
  P('Pocket(吹き出し)', '#fff7d6', () => [
    S('bubbleRound', 135, 50, 230, '#111827'),
    T('Hi!', 135, 120, 230, 80, { font: 'Montserrat', weight: 900, fill: '#fff7d6', align: 'center' }),
    T('Pocket', 20, 300, 460, 100, { font: DELA, weight: 400, fill: '#111827', align: 'center' }),
    T('CHAT APP', 20, 420, 460, 24, { font: 'Montserrat', weight: 700, fill: '#b58900', align: 'center', spacing: 400 }),
  ]),
  P('Mirai Works(六角形)', '#ffffff', () => [
    S('hexagon', 150, 50, 200, '#6d28d9'), S('hexagon', 195, 95, 110, '#c4b5fd'), S('hexagon', 225, 125, 50, '#ffffff'),
    logoName('MIRAI WORKS', 290, '#4c1d95', 46, 'Montserrat', 100),
    T('株式会社ミライワークス', 20, 370, 460, 26, { weight: 600, fill: '#7c6aa8', align: 'center', spacing: 100 }),
  ]),
]

// ================= 9. インフォグラフィック(グラフ入り / 1080×1920) =================
const IG = { ink: '#16213a', blue: '#2f6bff', sky: '#dce8ff', ora: '#ff8a3d', mint: '#18b894', pale: '#f4f7ff', mute: '#66708a' }
const igChart = (spec: Parameters<typeof makeChart>[0], x: number, y: number, s = 1) => makeChart(spec).set({ left: x, top: y, scaleX: s, scaleY: s })
const igHead = (no: string, t: string, sub: string, bg = IG.blue, fg = '#ffffff') => [
  R(0, 0, 1080, 400, bg),
  T('INFOGRAPHIC  ' + no, 70, 70, 700, 28, { font: 'Montserrat', weight: 700, fill: fg, spacing: 250 }),
  T(t, 70, 112, 940, 72, { font: ZK, weight: 900, fill: fg, lh: 1.25 }),
  T(sub, 70, 338, 940, 32, { weight: 500, fill: fg }),
]
const igFoot = (c = IG.mute) => T('出典:サンプルデータ(架空の数値です)', 70, 1840, 940, 26, { weight: 400, fill: c })
const IG_PAGES: TemplatePage[] = [
  P('棒グラフ: 在宅勤務', IG.pale, () => [
    ...igHead('01', '在宅勤務の\n実施率は?', '従業員規模別・2026年'),
    igChart({ type: 'bar', labels: ['〜50人', '〜300人', '〜1000人', '1000人〜'], values: [18, 31, 42, 56], colors: [IG.blue], w: 900, h: 640 }, 90, 460),
    R(70, 1210, 940, 230, '#ffffff', 24),
    T('56%', 110, 1245, 330, 140, { font: 'Montserrat', weight: 900, fill: IG.blue }),
    T('1000人以上の企業では\n半数超が週1日以上\n在宅勤務を実施', 470, 1250, 500, 36, { weight: 700, fill: IG.ink, lh: 1.6 }),
    T('POINT', 70, 1500, 300, 28, { font: 'Montserrat', weight: 700, fill: IG.ora, spacing: 300 }),
    T('規模が大きいほど制度が整っており、\n小規模では「必要性が低い」との回答が多い。', 70, 1545, 940, 34, { weight: 500, fill: IG.ink, lh: 1.7 }),
    igFoot(),
  ]),
  P('横棒: 睡眠時間', IG.ink, () => [
    ...igHead('02', '世界の睡眠\n時間ランキング', '平日の平均睡眠時間(時間)', IG.ora, IG.ink),
    igChart({ type: 'hbar', labels: ['A国', 'B国', 'C国', 'D国', 'E国', '日本'], values: [8.6, 8.3, 8.1, 7.9, 7.5, 6.9], colors: ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', IG.ora], w: 900, h: 760 }, 90, 460),
    T('日本は調査国の中で\n最も短い6.9時間', 70, 1380, 940, 56, { font: ZK, weight: 900, fill: '#ffffff', lh: 1.4 }),
    T('最長との差は1.7時間。1週間で約12時間の違いになります。', 70, 1560, 940, 32, { weight: 500, fill: '#c3cbe0', lh: 1.7 }),
    igFoot('#8d98b8'),
  ]),
  P('ドーナツ: 家計', '#ffffff', () => [
    ...igHead('03', '一人暮らしの\n支出の内訳', '月の生活費 15万円の場合', IG.mint, '#ffffff'),
    igChart({ type: 'donut', labels: ['住居', '食費', '光熱', '通信', '交際', '他'], values: [45, 25, 6, 5, 9, 10], colors: [IG.blue, IG.ora, IG.mint, '#a78bfa', '#f472b6', '#cbd5e1'], w: 800, h: 640 }, 140, 440, 1.0),
    ...[['住居費', '6.8万円'], ['食費', '3.8万円'], ['その他', '4.4万円']].flatMap(([a, b], i) => [
      R(70 + i * 320, 1190, 300, 170, IG.pale, 20),
      T(a, 70 + i * 320, 1215, 300, 30, { weight: 700, fill: IG.mute, align: 'center' }),
      T(b, 70 + i * 320, 1270, 300, 48, { font: ZK, weight: 900, fill: IG.ink, align: 'center' }),
    ]),
    T('住居費は手取りの3割以内が目安。\n固定費から見直すと続けやすくなります。', 70, 1430, 940, 36, { weight: 500, fill: IG.ink, lh: 1.7 }),
    igFoot(),
  ]),
  P('折れ線: 気温', IG.pale, () => [
    ...igHead('04', '東京の月別\n平均気温', '2025年の観測値(℃)', IG.ink, '#ffffff'),
    igChart({ type: 'line', labels: ['1', '3', '5', '7', '9', '11'], values: [6, 11, 20, 28, 25, 14], colors: [IG.ora], w: 900, h: 620 }, 90, 460, 1.0),
    R(70, 1150, 450, 220, '#ffffff', 24), R(560, 1150, 450, 220, '#ffffff', 24),
    T('MAX', 100, 1180, 390, 26, { font: 'Montserrat', weight: 700, fill: IG.ora, spacing: 300 }),
    T('28℃(7月)', 100, 1235, 390, 56, { font: ZK, weight: 900, fill: IG.ink }),
    T('MIN', 590, 1180, 390, 26, { font: 'Montserrat', weight: 700, fill: IG.blue, spacing: 300 }),
    T('6℃(1月)', 590, 1235, 390, 56, { font: ZK, weight: 900, fill: IG.ink }),
    T('寒暖差は22℃。服装は3か月ごとに入れ替えると\n無駄がありません。', 70, 1440, 940, 34, { weight: 500, fill: IG.ink, lh: 1.7 }),
    igFoot(),
  ]),
  P('円グラフ: アンケート', '#ffffff', () => [
    ...igHead('05', '朝食を\n毎日食べる?', 'n=1,000 の回答結果', IG.ora, IG.ink),
    igChart({ type: 'pie', labels: ['毎日', '週3-5', '週1-2', 'ほぼ食べない'], values: [52, 21, 11, 16], colors: [IG.blue, IG.mint, IG.ora, '#cbd5e1'], w: 800, h: 640 }, 140, 440, 1.0),
    R(70, 1190, 940, 300, IG.pale, 24),
    T('約7割が「週3日以上」', 110, 1225, 860, 52, { font: ZK, weight: 900, fill: IG.ink }),
    T('一方で若い世代ほど「ほぼ食べない」が多く、\n20代では4人に1人が該当します。', 110, 1310, 860, 34, { weight: 500, fill: IG.mute, lh: 1.7 }),
    igFoot(),
  ]),
  P('手順フロー', IG.pale, () => [
    ...igHead('06', '確定申告\n4ステップ', '提出までの流れ', IG.blue, '#ffffff'),
    ...[['書類を集める', '源泉徴収票・領収書', 'check'], ['金額を計算する', '会計ソフトで自動集計', 'diamond'], ['申告書を作る', '画面の案内に沿って入力', 'pentagon'], ['提出・納税', '電子申告なら自宅から', 'arrowR']].flatMap(([a, b, ic], i) => [
      R(70, 440 + i * 310, 940, 260, '#ffffff', 28),
      Ci(190, 570 + i * 310, 70, i === 3 ? IG.ora : IG.blue),
      T(String(i + 1), 120, 535 + i * 310, 140, 70, { font: 'Montserrat', weight: 900, fill: '#ffffff', align: 'center' }),
      T(a, 300, 500 + i * 310, 680, 52, { font: ZK, weight: 900, fill: IG.ink }),
      T(b, 300, 580 + i * 310, 680, 32, { weight: 500, fill: IG.mute }),
      S(ic, 880, 540 + i * 310, 90, IG.sky),
      ...(i < 3 ? [S('arrowD', 168, 680 + i * 310, 46, IG.sky)] : []),
    ]),
    igFoot(),
  ]),
  P('比較表', '#ffffff', () => [
    ...igHead('07', '3つのプラン\n比べてみた', 'ご利用目的で選びましょう', IG.mint, '#ffffff'),
    makeTable({ rows: 5, cols: 3, header: IG.ink, border: '#d6dcea', cellW: 300, cellH: 130, fontSize: 32, cells: [['', 'ライト', 'プロ'], ['月額', '980円', '2,980円'], ['容量', '10GB', '1TB'], ['共有', '3人', '無制限'], ['サポート', 'メール', '電話可']] }).set({ left: 90, top: 460, scaleX: 1.0, scaleY: 1.0 }),
    R(70, 1210, 940, 330, IG.pale, 24),
    T('おすすめの選び方', 110, 1245, 860, 40, { font: ZK, weight: 900, fill: IG.ink }),
    T('個人で写真や書類を保管 → ライト\nチームで共同編集する → プロ', 110, 1325, 860, 36, { weight: 500, fill: IG.ink, lh: 1.8 }),
    igFoot(),
  ]),
  P('月別売上', IG.ink, () => [
    ...igHead('08', '2026年上期の\n売上推移', '月次売上(百万円)', IG.blue, '#ffffff'),
    igChart({ type: 'bar', labels: ['1月', '2月', '3月', '4月', '5月', '6月'], values: [42, 38, 55, 61, 58, 74], colors: [IG.ora], w: 900, h: 620 }, 90, 460),
    ...[['+76%', '1月→6月'], ['74', '6月の売上(百万円)'], ['3位→1位', '主力商品の順位']].flatMap(([a, b], i) => [
      R(70 + i * 320, 1170, 300, 230, '#243256', 24),
      T(a, 70 + i * 320, 1205, 300, 64, { font: 'Montserrat', weight: 900, fill: '#ffffff', align: 'center' }),
      T(b, 80 + i * 320, 1305, 280, 26, { weight: 500, fill: '#aab6d6', align: 'center' }),
    ]),
    igFoot('#8d98b8'),
  ]),
  P('世代別: 横棒', '#ffffff', () => [
    ...igHead('09', '世代別\nSNS利用率', '1日1回以上利用する人の割合(%)', IG.ora, IG.ink),
    igChart({ type: 'hbar', labels: ['10代', '20代', '30代', '40代', '50代', '60代'], values: [88, 92, 81, 70, 54, 38], colors: [IG.blue, IG.blue, IG.blue, IG.blue, IG.blue, IG.blue], w: 900, h: 760 }, 90, 460),
    T('20代が最多の92%。\n60代でも約4割が毎日利用。', 70, 1380, 940, 48, { font: ZK, weight: 900, fill: IG.ink, lh: 1.5 }),
    T('世代の差は縮まりつつあり、発信先の選び方が\n成果を左右します。', 70, 1560, 940, 32, { weight: 500, fill: IG.mute, lh: 1.7 }),
    igFoot(),
  ]),
  P('1日の時間配分', IG.pale, () => [
    ...igHead('10', '1日24時間の\n使い方', '会社員の平日の平均', IG.ink, '#ffffff'),
    igChart({ type: 'donut', labels: ['睡眠', '仕事', '通勤', '食事', '余暇', '家事'], values: [6.5, 9, 1.5, 2, 3, 2], colors: [IG.blue, IG.ora, IG.mint, '#a78bfa', '#f472b6', '#cbd5e1'], w: 800, h: 640 }, 140, 440),
    R(70, 1190, 940, 300, '#ffffff', 24),
    T('自由に使えるのは\n1日わずか3時間', 110, 1225, 860, 56, { font: ZK, weight: 900, fill: IG.ink, lh: 1.4 }),
    T('余暇の3時間をどう使うかで、\n1年後の差が生まれます。', 110, 1380, 860, 34, { weight: 500, fill: IG.mute, lh: 1.6 }),
    igFoot(),
  ]),
]

// ================= 10. Web バナー 10 パターン(1200×628) =================
const BN = { bk: '#111827', red: '#e11d48', yel: '#fde047', blue: '#2563eb', wh: '#ffffff', pale: '#f3f4f6' }
const BANNERS: TemplatePage[] = [
  P('セール', BN.red, () => [
    S('burst', 760, 40, 400, BN.yel),
    T('SUMMER SALE', 70, 70, 600, 34, { font: 'Montserrat', weight: 800, fill: '#ffffff', spacing: 300 }),
    T('最大', 70, 170, 200, 70, { font: ZK, weight: 900, fill: '#ffffff' }),
    T('50%', 70, 230, 620, 220, { font: 'Montserrat', weight: 900, fill: BN.yel }),
    T('OFF', 880, 240, 200, 90, { font: 'Montserrat', weight: 900, fill: BN.red, align: 'center' }),
    R(70, 500, 520, 80, '#ffffff', 40), T('今すぐチェック', 70, 518, 520, 44, { weight: 900, fill: BN.red, align: 'center' }),
  ]),
  P('新商品', BN.pale, () => [
    ...PH(640, 0, 560, 628, 0, '#d9dce3'),
    R(70, 80, 150, 50, BN.bk, 25), T('NEW', 70, 90, 150, 30, { font: 'Montserrat', weight: 900, fill: '#ffffff', align: 'center', spacing: 200 }),
    T('毎日使いたくなる\n新しい定番', 70, 170, 540, 62, { font: ZK, weight: 900, fill: BN.bk, lh: 1.35 }),
    T('春の新作が登場しました。', 70, 360, 540, 32, { weight: 500, fill: '#4b5563' }),
    R(70, 460, 340, 80, BN.bk, 8), T('詳しく見る', 70, 478, 340, 44, { weight: 900, fill: '#ffffff', align: 'center' }),
  ]),
  P('キャンペーン', BN.blue, () => [
    Ci(1000, 130, 220, '#3b7bff'), Ci(1090, 560, 160, '#1d4fd0'),
    T('友だち紹介', 70, 80, 800, 50, { weight: 900, fill: BN.yel }),
    T('キャンペーン', 70, 150, 900, 130, { font: DELA, weight: 400, fill: '#ffffff' }),
    T('紹介した方も、された方も\n1,000ポイントプレゼント', 70, 340, 800, 46, { weight: 700, fill: '#ffffff', lh: 1.5 }),
    T('期間:4月1日〜4月30日', 70, 530, 700, 32, { weight: 500, fill: '#cfe0ff' }),
  ]),
  P('採用', BN.bk, () => [
    T('WE ARE HIRING', 70, 70, 700, 36, { font: 'Montserrat', weight: 800, fill: BN.yel, spacing: 400 }),
    T('一緒に、\n次をつくろう。', 70, 150, 700, 100, { font: ZK, weight: 900, fill: '#ffffff', lh: 1.3 }),
    T('エンジニア / デザイナー / 営業 募集中', 70, 440, 760, 34, { weight: 500, fill: '#d1d5db' }),
    R(70, 510, 340, 70, BN.yel, 35), T('募集要項を見る', 70, 526, 340, 38, { weight: 900, fill: BN.bk, align: 'center' }),
    ...PH(800, 0, 400, 628, 0, '#2a3446'),
  ]),
  P('セミナー', '#ffffff', () => [
    R(0, 0, 1200, 120, BN.blue), T('オンラインセミナー  参加無料', 70, 34, 1000, 50, { weight: 900, fill: '#ffffff' }),
    T('売上を伸ばす\nSNS活用術', 70, 170, 760, 100, { font: ZK, weight: 900, fill: BN.bk, lh: 1.3 }),
    T('6/18(水) 14:00〜15:00', 70, 440, 700, 46, { font: ZK, weight: 900, fill: BN.blue }),
    R(70, 520, 320, 70, BN.red, 8), T('今すぐ申し込む', 70, 536, 320, 38, { weight: 900, fill: '#ffffff', align: 'center' }),
    Ci(980, 380, 170, BN.pale), S('star5', 900, 300, 160, BN.yel),
  ]),
  P('アプリDL', '#e0f2fe', () => [
    R(780, 70, 300, 560, BN.bk, 44), R(800, 100, 260, 480, '#ffffff', 24),
    T('毎日の家計を\nかんたん管理', 70, 90, 660, 70, { font: ZK, weight: 900, fill: '#0c4a6e', lh: 1.35 }),
    T('無料ダウンロード', 70, 340, 600, 38, { weight: 700, fill: '#0369a1' }),
    R(70, 420, 280, 80, BN.bk, 14), T('App Store', 70, 442, 280, 36, { font: 'Montserrat', weight: 800, fill: '#ffffff', align: 'center' }),
    R(380, 420, 280, 80, BN.bk, 14), T('Google Play', 380, 442, 280, 36, { font: 'Montserrat', weight: 800, fill: '#ffffff', align: 'center' }),
  ]),
  P('クーポン', BN.yel, () => [
    R(60, 60, 1080, 508, '#ffffff', 28, { stroke: BN.bk, strokeWidth: 6 }),
    Ci(60, 314, 40, BN.yel), Ci(1140, 314, 40, BN.yel),
    T('COUPON', 120, 100, 600, 40, { font: 'Montserrat', weight: 800, fill: BN.red, spacing: 400 }),
    T('初回ご利用で', 120, 170, 700, 48, { weight: 900, fill: BN.bk }),
    T('1,000円OFF', 120, 240, 800, 120, { font: DELA, weight: 400, fill: BN.red }),
    T('ご注文時にコード「WELCOME」を入力', 120, 460, 800, 30, { weight: 500, fill: '#4b5563' }),
    S('lightning', 900, 150, 200, BN.yel, { stroke: BN.bk, strokeWidth: 3 }),
  ]),
  P('イベント', '#fef3c7', () => [
    T('MARKET', 70, 50, 600, 50, { font: 'Montserrat', weight: 900, fill: '#b45309', spacing: 500 }),
    T('春のマルシェ', 70, 120, 800, 120, { font: DELA, weight: 400, fill: BN.bk }),
    T('地元の食とクラフト 40店舗が集合', 70, 300, 800, 40, { weight: 700, fill: '#78350f' }),
    R(70, 400, 600, 160, '#ffffff', 20),
    T('4/12(土)・13(日)\n10:00〜17:00 入場無料', 100, 425, 560, 40, { weight: 900, fill: BN.bk, lh: 1.6 }),
    Ci(960, 250, 190, '#fcd34d'), S('heart', 860, 150, 200, BN.red),
  ]),
  P('無料体験', '#ecfdf5', () => [
    T('まずは', 70, 90, 400, 50, { weight: 900, fill: '#047857' }),
    T('無料体験', 70, 150, 700, 150, { font: DELA, weight: 400, fill: '#064e3b' }),
    T('7日間、すべての機能をお試しいただけます。\nクレジットカード不要。', 70, 340, 760, 38, { weight: 500, fill: '#065f46', lh: 1.7 }),
    R(70, 510, 420, 90, '#059669', 45), T('無料ではじめる', 70, 532, 420, 46, { weight: 900, fill: '#ffffff', align: 'center' }),
    S('check', 880, 150, 240, '#059669'),
  ]),
  P('メルマガ', BN.pale, () => [
    R(70, 70, 1060, 488, '#ffffff', 24),
    S('bubble', 110, 130, 220, BN.blue),
    T('メールマガジン', 400, 130, 680, 40, { weight: 700, fill: BN.blue }),
    T('お得な情報を\n毎週お届け', 400, 190, 680, 76, { font: ZK, weight: 900, fill: BN.bk, lh: 1.3 }),
    T('登録特典:限定クーポンをプレゼント', 400, 380, 680, 32, { weight: 500, fill: '#4b5563' }),
    R(400, 450, 340, 70, BN.blue, 35), T('無料で登録', 400, 466, 340, 38, { weight: 900, fill: '#ffffff', align: 'center' }),
  ]),
]

export const WEB_SETS: Template[] = [
  mk('wb-yt-biz', 'YouTube サムネイル ビジネス解説(ネイビー×イエロー)', 'YouTube サムネイル', 1280, 720, ['YouTube', 'サムネイル', 'ビジネス', '解説', '経済', '副業'], YT_BIZ),
  mk('wb-yt-food', 'YouTube サムネイル 料理(トマトレッド)', 'YouTube サムネイル', 1280, 720, ['YouTube', 'サムネイル', '料理', 'レシピ', '食べ物', 'グルメ'], YT_FOOD),
  mk('wb-yt-game', 'YouTube サムネイル ゲーム実況(ネオン)', 'YouTube サムネイル', 1280, 720, ['YouTube', 'サムネイル', 'ゲーム', '実況', 'ネオン', 'eスポーツ'], YT_GAME),
  mk('wb-blog-note', 'ブログ・note アイキャッチ ノート(ペーパー×ティール)', 'Web・ブログ', 1200, 630, ['ブログ', 'note', 'アイキャッチ', 'ミニマル', '読み物'], BLOG_NOTE),
  mk('wb-blog-pop', 'ブログ・note アイキャッチ ポップ(ミント×コーラル)', 'Web・ブログ', 1200, 630, ['ブログ', 'note', 'アイキャッチ', 'ポップ', 'カラフル'], BLOG_POP),
  mk('wb-x-tips', 'X 投稿画像 告知・Tips(ペーパー×オレンジ)', 'X(Twitter)', 1600, 900, ['X', 'Twitter', '投稿', '告知', 'Tips', 'SNS'], X_TIPS),
  mk('wb-line-menu', 'LINE リッチメニュー 業種別10種', 'LINE', 2500, 1686, ['LINE', 'リッチメニュー', '美容室', '飲食店', 'クリニック', '店舗'], LINE_RM),
  mk('wb-logo', 'ロゴ 10案', 'ロゴ', 500, 500, ['ロゴ', 'ブランド', 'マーク', 'ワードマーク', '店舗'], LOGOS),
  mk('wb-infographic', 'インフォグラフィック(グラフ入り)', 'インフォグラフィック', 1080, 1920, ['インフォグラフィック', 'グラフ', 'データ', '図解', '統計'], IG_PAGES),
  mk('wb-banner', 'Web バナー 10パターン', 'Web バナー', 1200, 628, ['バナー', '広告', 'セール', 'キャンペーン', '採用', 'セミナー'], BANNERS),
]
