import type { Template, TemplatePage } from '../templates'
import type { FabricObject } from 'fabric'
import { T, R, Ci, S, PH, SH } from '../templates/kit'

// ============ 共通の部品(SNS テンプレセット用) ============
// 全角 = 1、半角英数 = 0.65 として 1 行の幅を数え、最大幅に収まるよう手前で改行を入れる
const cw = (c: string) => (/[\u0000-ÿ]/.test(c) ? 0.65 : 1)
const NOHEAD = '、。,.)」』)】!?!?:;・ー'
const wrapJa = (text: string, size: number, w: number) => {
  const max = w / size - 0.5
  return text.split('\n').map((para) => {
    let out = '', cur = 0
    for (const ch of para) {
      const a = cw(ch)
      if (cur + a > max + 0.01) {
        if (NOHEAD.includes(ch) && out.length) { // 行頭禁則: 直前の1文字を次の行へ送る
          const last = out[out.length - 1]
          out = out.slice(0, -1) + '\n' + last; cur = cw(last)
        } else { out += '\n'; cur = 0 }
      }
      out += ch; cur += a
    }
    return out
  }).join('\n')
}
const nl = (s: string) => s.split('\n').length
/** 行数 n・文字サイズ size・行間 lh のテキストの高さ(fabric の 1.13 係数込み) */
const th = (n: number, size: number, lh: number) => Math.round(n * size * 1.13 * lh)

interface Pal { bg: string; ink: string; main: string; acc: string; pale: string; mid: string; line: string; hf: string; hw: number; bf: string; on: string }

/** 見出し(改行は手で入れる) */
const hd = (P: Pal, text: string, x: number, y: number, w: number, size: number, o: Record<string, any> = {}) =>
  T(text, x, y, w, size, { font: P.hf, weight: P.hw, fill: P.ink, lh: 1.2, ...o })
/** 本文(自動で改行位置を入れる) */
const bd = (P: Pal, text: string, x: number, y: number, w: number, size = 32, o: Record<string, any> = {}) =>
  T(wrapJa(text, size, w), x, y, w, size, { font: P.bf, weight: 500, fill: P.ink, lh: 1.65, ...o })
/** 見出し左の小さな印つきラベル */
const kick = (P: Pal, text: string, x: number, y: number, color?: string): FabricObject[] => [
  R(x, y + 15, 36, 4, P.acc),
  T(text, x + 54, y, 800, 28, { font: P.bf, weight: 700, fill: color ?? P.main, spacing: 120 }),
]
/** 丸ボタン風のラベル(中央揃え) */
const pill = (text: string, x: number, y: number, w: number, size: number, fill: string, color: string, o: Record<string, any> = {}): FabricObject[] => {
  const h = Math.round(size * 1.9)
  return [R(x, y, w, h, fill, h / 2, o), T(text, x, y + Math.round((h - size * 1.13) / 2), w, size, { align: 'center', fill: color, lh: 1, weight: 700 })]
}
const pillH = (size: number) => Math.round(size * 1.9)

// ---------- Instagram カルーセル 1080×1350 ----------
const M = 80, CW = 920
interface CPage { label: string; bg: string; dark?: boolean; els: () => FabricObject[] }

/** 共通要素: 下部の進捗線・ページ番号(03 / 10)・スワイプ矢印(最終ページは出さない) */
const chrome = (P: Pal, n: number, total: number, dark: boolean): FabricObject[] => {
  const c = dark ? 'rgba(255,255,255,0.72)' : P.mid
  const out: FabricObject[] = [
    R(M, 1222, CW, 2, dark ? 'rgba(255,255,255,0.22)' : P.line),
    R(M, 1221, Math.round((CW * n) / total), 4, dark ? P.acc : P.main),
    T(`${String(n).padStart(2, '0')} / ${total}`, M, 1250, 260, 26, { font: 'Montserrat', weight: 700, fill: c, spacing: 100, lh: 1 }),
  ]
  if (n < total) out.push(
    T('SWIPE', 700, 1250, 190, 26, { font: 'Montserrat', weight: 700, fill: c, spacing: 200, align: 'right', lh: 1 }),
    S('arrowR', 912, 1244, 48, dark ? P.acc : P.main),
  )
  return out
}

const carousel = (id: string, name: string, tags: string[], P: Pal, pages: CPage[]): Template => {
  const total = pages.length
  const mk = (pg: CPage, i: number): TemplatePage => ({ bg: pg.bg, label: pg.label, build: () => [...pg.els(), ...chrome(P, i + 1, total, !!pg.dark)] })
  const [a, ...rest] = pages.map(mk)
  return { id, name, category: 'Instagram カルーセル', w: 1080, h: 1350, bg: a.bg, build: a.build, more: rest, tags }
}

/** 最終ページ(保存・フォローを促す) */
const outro = (P: Pal, title: string, body: string, handle: string): FabricObject[] => [
  ...kick(P, 'THANK YOU', M, 110, P.on),
  hd(P, title, M, 190, CW, 100, { fill: P.on, lh: 1.2 }),
  bd(P, body, M, 190 + th(nl(title), 100, 1.2) + 40, CW, 32, { fill: P.on, weight: 400 }),
  ...pill('保存して、あとで見返す', M, 800, CW, 38, P.acc, P.ink),
  ...pill('フォローして、続きを読む', M, 800 + pillH(38) + 28, CW, 38, 'rgba(255,255,255,0.12)', P.on, { stroke: 'rgba(255,255,255,0.5)', strokeWidth: 2 }),
  T(handle, M, 1100, CW, 36, { font: 'Montserrat', weight: 700, fill: P.acc, spacing: 80, lh: 1 }),
]

// ============ 1. ノウハウ解説(教育・学習 / ネイビー + イエロー) ============
const HA: Pal = { bg: '#f7f3ea', ink: '#17324d', main: '#17324d', acc: '#f2b705', pale: '#ffffff', mid: '#5b6b7b', line: '#ddd6c6', hf: 'Zen Maru Gothic', hw: 900, bf: 'Zen Maru Gothic', on: '#ffffff' }

const haSteps = [
  { when: '当日', min: '所要 3分', t: 'その日のうちに\n3行でメモする', b: '学んだ当日、寝る前に要点を3行だけ書き出します。きれいにまとめなくてOK。自分の言葉で書くことが、記憶の入り口になります。', tip: 'ノートを開かず、頭の中の記憶だけで書く' },
  { when: '翌日', min: '所要 5分', t: '翌日は声に出して\n思い出す', b: 'ノートを閉じて、昨日の内容を口に出して説明してみます。うまく話せなかった部分が、いま一番あやしい場所です。', tip: '通勤中や歩きながらでも効果あり' },
  { when: '3日後', min: '所要 10分', t: '3日後に\n問題を解いてみる', b: '読み返すのではなく、問題を解いて確認します。間違えた箇所に付箋を貼っておくと、次の復習がぐっと楽になります。', tip: '読むより「解く」。答え合わせは最後に' },
  { when: '1週間後', min: '所要 10分', t: '1週間後は\n人に教えてみる', b: '家族や同僚に、学んだことを説明してみましょう。相手の質問に答えられたら、その知識はもう自分のものです。', tip: '相手がいなければ、ぬいぐるみでもOK' },
  { when: '1か月後', min: '所要 15分', t: '1か月後に\n1枚へまとめ直す', b: '全体を1枚の図にまとめ直します。個々の知識がつながり、「使える知識」として長く残るようになります。', tip: '矢印でつなぐと、関係が見えてくる' },
]
const haStepPage = (i: number): CPage => {
  const s = haSteps[i]
  return { label: `STEP ${i + 1}`, bg: HA.bg, els: () => [
    R(120, 138, 840, 4, HA.line),
    ...haSteps.flatMap((k, j) => {
      const x = 120 + j * 210, cur = j === i
      return [Ci(x, 140, cur ? 28 : 14, cur ? HA.acc : (j < i ? HA.main : HA.line), cur ? { stroke: HA.main, strokeWidth: 4 } : {}),
        T(k.when, x - 90, 190, 180, 24, { align: 'center', font: HA.bf, weight: cur ? 900 : 500, fill: cur ? HA.ink : HA.mid, lh: 1 })]
    }),
    R(M, 290, 140, 140, HA.main, 28),
    T(String(i + 1), M, 308, 140, 110, { font: 'Montserrat', weight: 900, fill: HA.acc, align: 'center', lh: 1 }),
    T('STEP ' + (i + 1), 250, 310, 500, 40, { font: 'Montserrat', weight: 900, fill: HA.main, spacing: 200, lh: 1 }),
    T(s.min, 250, 368, 500, 32, { font: HA.bf, weight: 500, fill: HA.mid, lh: 1 }),
    hd(HA, s.t, M, 480, CW, 84),
    bd(HA, s.b, M, 740, CW, 32),
    R(M, 970, CW, 210, '#ffffff', 28, SH(0.06)),
    ...pill('コツ', 120, 1000, 130, 26, HA.acc, HA.ink),
    T(s.tip, 120, 1085, 840, 30, { font: HA.bf, weight: 700, fill: HA.ink, lh: 1.4 }),
  ] }
}
const HOWTO = carousel('sn-howto', '教育 ノウハウ解説 5ステップ', ['教育', '学習', 'ノウハウ', '解説', '保存版'], HA, [
  { label: '表紙', bg: HA.main, dark: true, els: () => [
    ...pill('保存版  学びのノウハウ', M, 110, 440, 28, HA.acc, HA.ink),
    hd(HA, '覚えたことが\n消えない\n復習5ステップ', M, 230, CW, 112, { fill: '#ffffff', lh: 1.15 }),
    R(M, 712, 120, 8, HA.acc),
    bd(HA, '資格・語学・仕事の勉強に使える、\n忘れにくい復習のしかた。', M, 752, CW, 30, { fill: '#cbd5e1', weight: 400 }),
    ...PH(M, 870, CW, 300, 28, '#274a6d'),
  ] },
  { label: '課題', bg: HA.bg, els: () => [
    ...kick(HA, 'お悩みチェック', M, 100),
    hd(HA, 'その勉強、\n忘れていませんか?', M, 170, CW, 84),
    ...['勉強した内容を、数日後には忘れている', 'ノートはきれいなのに、見返さない', '復習する時間が、なかなか取れない'].flatMap((t, i) => {
      const y = 470 + i * 220
      return [R(M, y, CW, 190, '#ffffff', 28, SH(0.06)), Ci(172, y + 95, 40, HA.acc), S('check', 144, y + 67, 56, HA.ink),
        T(t, 250, y + 95 - th(1, 32, 1.4) / 2, 730, 32, { font: HA.bf, weight: 700, fill: HA.ink, lh: 1.4 })]
    }),
  ] },
  { label: '忘却の数字', bg: HA.bg, els: () => [
    ...kick(HA, 'なぜ復習が必要?', M, 100),
    hd(HA, '忘れるのは、\nふつうのこと', M, 170, CW, 84),
    R(M, 470, CW, 440, HA.main, 36),
    T('24h', 130, 520, 520, 240, { font: 'Montserrat', weight: 900, fill: HA.acc, lh: 1 }),
    T('で、覚えた内容の\n半分以上を忘れる\nといわれています', 640, 560, 320, 34, { font: HA.bf, weight: 700, fill: '#ffffff', lh: 1.6 }),
    R(130, 830, 820, 2, 'rgba(255,255,255,0.25)'),
    T('※ 忘却曲線をもとにした一般的な目安です', 130, 855, 820, 24, { font: HA.bf, weight: 400, fill: '#cbd5e1', lh: 1 }),
    hd(HA, '大切なのは、\n忘れる前に思い出すこと。', M, 980, CW, 44, { lh: 1.5 }),
  ] },
  ...[0, 1, 2, 3, 4].map(haStepPage),
  { label: 'まとめ', bg: HA.bg, els: () => [
    ...kick(HA, 'まとめ', M, 100),
    hd(HA, '復習スケジュール\n早見表', M, 170, CW, 84),
    ...haSteps.flatMap((s, i) => {
      const y = 470 + i * 140
      return [R(M, y + 126, CW, 2, HA.line),
        T(s.when, M, y + 20, 230, 34, { font: HA.bf, weight: 900, fill: HA.main, lh: 1.2 }),
        T(s.t.replace('\n', ''), 330, y + 20, 670, 34, { font: HA.bf, weight: 700, fill: HA.ink, lh: 1.2 })]
    }),
  ] },
  { label: '保存を促す', bg: HA.main, dark: true, els: () => outro(HA, '役に立ったら\n保存して\n見返してね', '忘れる前に思い出す。\nその積み重ねが、力になります。', '@sample_study') },
])

// ============ 2. Before / After(美容サロン / ブラッシュ + ブラウン) ============
const HB: Pal = { bg: '#f8efe9', ink: '#3f2a24', main: '#3f2a24', acc: '#d99b7f', pale: '#ffffff', mid: '#8a6f64', line: '#e6d3c8', hf: 'Shippori Mincho', hw: 700, bf: 'Noto Sans JP', on: '#fff7f2' }

const BEFORE_AFTER = carousel('sn-beforeafter', '美容 Before・After 実例集', ['美容室', 'サロン', 'ビフォーアフター', '髪質改善', '実例'], HB, [
  { label: '表紙', bg: HB.bg, els: () => [
    ...kick(HB, 'HAIR  BEFORE / AFTER', M, 100),
    hd(HB, 'うねりも、\nパサつきも。', M, 170, CW, 112, { lh: 1.15 }),
    bd(HB, '髪質改善トリートメント 実例集', M, 170 + th(2, 112, 1.15) + 24, CW, 34, { weight: 700, fill: HB.mid }),
    ...PH(M, 700, CW, 470, 40, '#e8d5cc'),
  ] },
  { label: 'お悩み', bg: HB.bg, els: () => [
    ...kick(HB, 'BEFORE', M, 100),
    hd(HB, 'こんな髪の\nお悩みは?', M, 170, CW, 84),
    ...[['湿気で、髪が\n広がる', '01'], ['毛先が、\nパサつく', '02'], ['朝のスタイリング\nに時間がかかる', '03'], ['ツヤが出ず、\n暗く見える', '04']].flatMap(([t, n], i) => {
      const x = M + (i % 2) * 480, y = 470 + Math.floor(i / 2) * 360
      return [R(x, y, 440, 320, '#ffffff', 28, SH(0.06)),
        T(n, x + 36, y + 32, 200, 40, { font: 'Playfair Display', weight: 700, fill: HB.acc, lh: 1 }),
        T(t, x + 36, y + 110, 380, 40, { font: HB.bf, weight: 700, fill: HB.ink, lh: 1.5 })]
    }),
  ] },
  { label: 'Case 01', bg: HB.bg, els: () => [
    ...kick(HB, 'CASE 01', M, 100),
    hd(HB, '広がる髪が、\nまとまる髪に', M, 160, CW, 76),
    ...PH(M, 410, 445, 600, 24, '#e8d5cc'), ...PH(555, 410, 445, 600, 24, '#e8d5cc'),
    ...pill('BEFORE', 108, 438, 190, 24, HB.ink, '#ffffff'), ...pill('AFTER', 583, 438, 160, 24, HB.acc, HB.ink),
    T('Aさん 30代 / 髪質改善トリートメント', M, 1050, CW, 32, { font: HB.bf, weight: 700, fill: HB.ink, lh: 1.3 }),
    T('所要時間 約3時間', M, 1108, CW, 28, { font: HB.bf, weight: 500, fill: HB.mid, lh: 1.3 }),
  ] },
  { label: 'Case 02', bg: HB.bg, els: () => [
    ...kick(HB, 'CASE 02', M, 100),
    hd(HB, 'くせ毛の\nうねりを\nおさえる', M, 170, 440, 72),
    bd(HB, 'Bさん 40代\nカット + 髪質改善', M, 170 + th(3, 72, 1.2) + 40, 440, 28, { weight: 700 }),
    bd(HB, '梅雨どきでも、まとまりが続くようになりました。', M, 170 + th(3, 72, 1.2) + 40 + 110, 440, 26, { color: HB.mid, fill: HB.mid, weight: 400 }),
    ...PH(555, 130, 445, 450, 24, '#e8d5cc'), ...PH(555, 620, 445, 450, 24, '#e8d5cc'),
    ...pill('BEFORE', 583, 158, 160, 24, HB.ink, '#ffffff'), ...pill('AFTER', 583, 648, 140, 24, HB.acc, HB.ink),
  ] },
  { label: '数字', bg: HB.main, dark: true, els: () => [
    ...kick(HB, 'お客さまの声を数字で', M, 100, HB.on),
    hd(HB, '仕上がりに\n満足した方', M, 170, CW, 84, { fill: HB.on }),
    T('92%', M, 470, CW, 300, { font: 'Montserrat', weight: 900, fill: HB.acc, lh: 1 }),
    T('「まとまりが良くなった」と\n答えたお客さまの割合', M, 860, CW, 38, { font: HB.bf, weight: 700, fill: HB.on, lh: 1.5 }),
    T('※ 数値はサンプルです', M, 1040, CW, 26, { font: HB.bf, weight: 400, fill: '#d8c3b8', lh: 1 }),
  ] },
  { label: '施術の流れ', bg: HB.bg, els: () => [
    ...kick(HB, 'FLOW', M, 100),
    hd(HB, '施術の流れ', M, 170, CW, 84),
    R(106, 420, 4, 590, HB.line),
    ...[['カウンセリング(15分)', 'お悩みと理想の仕上がりを伺います'], ['髪質診断(10分)', 'ダメージの度合いを細かくチェック'], ['トリートメント(120分)', '髪の状態に合わせて薬剤を調整'], ['仕上げと説明(35分)', '乾かし方とおうちケアをご案内']].flatMap(([t, d], i) => {
      const y = 400 + i * 190
      return [Ci(108, y + 28, 24, i === 2 ? HB.acc : '#ffffff', { stroke: HB.acc, strokeWidth: 4 }),
        T(t, 170, y, 800, 38, { font: HB.bf, weight: 700, fill: HB.ink, lh: 1.2 }),
        T(d, 170, y + 62, 800, 28, { font: HB.bf, weight: 400, fill: HB.mid, lh: 1.3 })]
    }),
  ] },
  { label: 'メニューと料金', bg: HB.bg, els: () => [
    ...kick(HB, 'MENU', M, 100),
    hd(HB, 'メニューと料金', M, 170, CW, 84),
    ...[['髪質改善トリートメント', '髪の内部から補修してツヤ出し', '¥12,100〜'], ['カット + 髪質改善', '似合わせカットとのセット', '¥15,400〜'], ['ヘッドスパ(20分)', '頭皮をほぐして血行促進', '¥3,300'], ['ホームケア相談', 'おうちケアの選び方をご提案', '無料']].flatMap(([t, d, p], i) => {
      const y = 400 + i * 165
      return [R(M, y + 145, CW, 2, HB.line),
        T(t, M, y + 4, 600, 34, { font: HB.bf, weight: 700, fill: HB.ink, lh: 1.2 }),
        T(d, M, y + 62, 600, 26, { font: HB.bf, weight: 400, fill: HB.mid, lh: 1.3 }),
        T(p, 640, y + 14, 360, 44, { font: 'Montserrat', weight: 700, fill: HB.main, align: 'right', lh: 1.1 })]
    }),
    T('すべて税込・髪の長さにより変わります', M, 1100, CW, 26, { font: HB.bf, weight: 400, fill: HB.mid, lh: 1.2 }),
  ] },
  { label: 'おうちケア', bg: HB.bg, els: () => [
    ...kick(HB, 'HOME CARE', M, 100),
    hd(HB, 'おうちケア\n3つのコツ', M, 170, CW, 84),
    ...[['夜は\nしっかり\n乾かす', '濡れたまま寝ると、髪が傷みやすくなります。'], ['シャンプーは\n1日1回', '洗いすぎると、うるおいまで流れてしまいます。'], ['アイロンは\n低めの温度', '160℃前後が目安。やさしく整えます。']].flatMap(([t, d], i) => {
      const x = M + i * 320
      return [R(x, 500, 280, 4, HB.main),
        T('0' + (i + 1), x, 530, 280, 72, { font: 'Playfair Display', weight: 700, fill: HB.acc, lh: 1 }),
        T(t, x, 650, 280, 36, { font: HB.bf, weight: 700, fill: HB.ink, lh: 1.3 }),
        bd(HB, d, x, 650 + th(3, 36, 1.3) + 24, 280, 26, { weight: 400, fill: HB.mid, lh: 1.6 })]
    }),
    R(M, 1090, CW, 2, HB.line),
    T('どれも、今日から始められます。', M, 1120, CW, 34, { font: HB.bf, weight: 700, fill: HB.main, lh: 1.2 }),
  ] },
  { label: 'お客さまの声', bg: HB.bg, els: () => [
    T('“', M, 80, 200, 200, { font: 'Playfair Display', weight: 700, fill: HB.acc, lh: 1 }),
    hd(HB, '毎朝のアイロンが、\n半分の時間で\n終わるようになりました。', M, 340, CW, 52, { lh: 1.5 }),
    ...PH(M, 700, 120, 120, 60, '#e8d5cc'),
    T('Cさん(30代・会社員)', 230, 722, 760, 32, { font: HB.bf, weight: 700, fill: HB.ink, lh: 1.2 }),
    T('髪質改善トリートメント', 230, 772, 760, 26, { font: HB.bf, weight: 400, fill: HB.mid, lh: 1.2 }),
    R(M, 900, CW, 250, '#ffffff', 28, SH(0.06)),
    ...pill('STYLIST', 120, 930, 170, 24, HB.main, '#ffffff'),
    bd(HB, 'ご自宅でのお手入れも一緒にお伝えしています。気になることは、いつでも相談してください。', 120, 1010, 840, 28),
  ] },
  { label: '保存・予約', bg: HB.main, dark: true, els: () => outro(HB, 'あなたの髪も、\nきっと変わる', 'ご予約は、プロフィールのリンクか\nDMからお気軽にどうぞ。', '@sample_hair_salon') },
])

// ============ 3. ランキング TOP5(フィットネス / ブラック + ライム) ============
const HC: Pal = { bg: '#f2f2ee', ink: '#111111', main: '#111111', acc: '#c6f432', pale: '#ffffff', mid: '#6b6b66', line: '#d9d9d2', hf: 'Dela Gothic One', hw: 400, bf: 'Noto Sans JP', on: '#ffffff' }

const hcRank = [
  { r: 5, t: '踏み台昇降', b: '階段や雑誌の束を使って、上り下りを繰り返す運動。ひざへの負担が少なく、有酸素運動の入り口に向いています。', s: [['所要', '10分'], ['道具', '踏み台'], ['目安', '100回']] },
  { r: 4, t: 'プランク', b: 'うつ伏せで、ひじとつま先で体を支える体幹トレーニング。お腹に力を入れ、姿勢を崩さないのがポイントです。', s: [['所要', '1分'], ['道具', 'なし'], ['目安', '30秒×3']] },
  { r: 3, t: 'ヒップリフト', b: '仰向けでお尻を持ち上げる動き。お尻と太ももの裏が鍛えられ、腰への負担も小さめです。', s: [['所要', '5分'], ['道具', 'マット'], ['目安', '15回×2']] },
  { r: 2, t: '膝つき腕立て伏せ', b: 'ひざをついて行う腕立て伏せ。胸と腕を鍛えながら、フォームを覚えやすい入門種目です。', s: [['所要', '5分'], ['道具', 'なし'], ['目安', '10回×2']] },
  { r: 1, t: 'スクワット', b: '下半身の大きな筋肉をまとめて使う、トレーニングの王道。短い時間で、全身の代謝アップを狙えます。', s: [['所要', '5分'], ['道具', 'なし'], ['目安', '15回×3']] },
]
const hcRankPage = (i: number): CPage => {
  const d = hcRank[i], one = d.r === 1
  const fg = one ? HC.on : HC.ink
  return { label: `${d.r}位`, bg: one ? HC.main : HC.bg, dark: one, els: () => [
    ...PH(M, 100, CW, 470, 28, one ? '#2a2a2a' : '#dcdcd4'),
    R(M, 100, 210, 250, one ? HC.acc : HC.main, 28),
    T(String(d.r), M, 132, 130, 170, { font: HC.hf, weight: 400, fill: one ? HC.ink : HC.acc, align: 'center', lh: 1 }),
    T('位', M + 120, 250, 90, 56, { font: HC.hf, weight: 400, fill: one ? HC.ink : HC.on, lh: 1 }),
    hd(HC, d.t, M, 620, CW, 76, { fill: fg, lh: 1.15 }),
    bd(HC, d.b, M, 740, CW, 30, { fill: fg, weight: 400 }),
    ...d.s.flatMap(([k, v], j) => [
      R(M + j * 320, 1000, 280, 4, one ? HC.acc : HC.main),
      T(k, M + j * 320, 1024, 280, 26, { font: HC.bf, weight: 700, fill: one ? '#bdbdb5' : HC.mid, lh: 1 }),
      T(v, M + j * 320, 1066, 280, 40, { font: HC.bf, weight: 900, fill: fg, lh: 1.1 }),
    ]),
  ] }
}
const RANKING = carousel('sn-ranking', 'フィットネス ランキング TOP5', ['フィットネス', 'ランキング', 'TOP5', '自宅トレ', 'ジム'], HC, [
  { label: '表紙', bg: HC.main, dark: true, els: () => [
    ...kick(HC, 'HOME WORKOUT RANKING', M, 110, HC.on),
    hd(HC, '初心者が\n続けやすい\n自宅トレ', M, 190, CW, 108, { fill: HC.on, lh: 1.1 }),
    T('TOP5', M, 640, CW, 380, { font: 'Bebas Neue', weight: 400, fill: HC.acc, lh: 1 }),
    T('今日からできる種目だけを、ランキングで紹介。', M, 1100, CW, 30, { font: HC.bf, weight: 500, fill: '#d4d4cc', lh: 1.3 }),
  ] },
  { label: '選び方', bg: HC.bg, els: () => [
    ...kick(HC, 'HOW WE CHOSE', M, 100),
    hd(HC, '選んだ基準は\n3つだけ', M, 170, CW, 84),
    ...[['道具いらず', '特別な器具がなくても、今すぐ始められる'], ['5分で終わる', '忙しい日でも、すき間時間にできる'], ['ケガしにくい', 'ひざや腰への負担が小さい種目']].flatMap(([t, d], i) => {
      const y = 470 + i * 230
      return [R(M, y, CW, 200, HC.main, 28),
        T('0' + (i + 1), 120, y + 46, 140, 76, { font: HC.hf, weight: 400, fill: HC.acc, lh: 1 }),
        T(t, 290, y + 38, 680, 42, { font: HC.bf, weight: 900, fill: HC.on, lh: 1.2 }),
        T(d, 290, y + 106, 680, 28, { font: HC.bf, weight: 400, fill: '#d4d4cc', lh: 1.3 })]
    }),
  ] },
  ...[0, 1, 2, 3, 4].map(hcRankPage),
  { label: '早見表', bg: HC.bg, els: () => [
    ...kick(HC, 'SUMMARY', M, 100),
    hd(HC, 'TOP5 早見表', M, 170, CW, 84),
    R(M, 400, CW, 90, HC.main, 20),
    ...[['順位', 110], ['種目', 250], ['鍛える部位', 640], ['時間', 880]].map(([t, x]) => T(String(t), Number(x), 428, Math.min(220, 1000 - Number(x)), 26, { font: HC.bf, weight: 700, fill: HC.acc, lh: 1 })),
    ...[['1位', 'スクワット', '下半身', '5分'], ['2位', '膝つき腕立て伏せ', '胸・腕', '5分'], ['3位', 'ヒップリフト', 'お尻・腿裏', '5分'], ['4位', 'プランク', '体幹', '1分'], ['5位', '踏み台昇降', '全身', '10分']].flatMap((r, i) => {
      const y = 490 + i * 130
      return [R(M, y + 128, CW, 2, HC.line),
        T(r[0], 110, y + 40, 130, 40, { font: HC.hf, weight: 400, fill: HC.ink, lh: 1.1 }),
        T(r[1], 250, y + 42, 380, 34, { font: HC.bf, weight: 700, fill: HC.ink, lh: 1.2 }),
        T(r[2], 640, y + 42, 230, 30, { font: HC.bf, weight: 500, fill: HC.mid, lh: 1.2 }),
        T(r[3], 880, y + 40, 120, 34, { font: HC.bf, weight: 900, fill: HC.ink, lh: 1.2 })]
    }),
  ] },
  { label: '続けるコツ', bg: HC.bg, els: () => [
    R(M, 100, CW, 330, HC.main, 28),
    ...kick(HC, 'KEEP GOING', 120, 140, HC.acc),
    hd(HC, '続けるための\n3つのコツ', 120, 210, 840, 72, { fill: HC.on }),
    ...[['始める時間を決める', '歯みがきの前など、毎日同じタイミングに。'], ['最初は「1種目だけ」', 'できた日の記録を、カレンダーに付けましょう。'], ['週1日は、必ず休む', '体を回復させる日も、トレーニングのうちです。']].flatMap(([t, d], i) => {
      const y = 480 + i * 240
      return [Ci(130, y + 50, 40, HC.acc), S('check', 104, y + 24, 52, HC.ink),
        T(t, 210, y + 8, 790, 40, { font: HC.bf, weight: 900, fill: HC.ink, lh: 1.2 }),
        bd(HC, d, 210, y + 70, 790, 28, { fill: HC.mid, weight: 400 }), R(M, y + 190, CW, 2, HC.line)]
    }),
  ] },
  { label: '保存・フォロー', bg: HC.main, dark: true, els: () => outro(HC, '今日の1種目、\nはじめよう', '保存しておけば、迷わず始められます。\n毎週、新しいトレーニングを紹介中。', '@sample_fit_studio') },
])

// ============ 4. 新商品紹介(コスメ / ラベンダー + ゴールド) ============
const HD: Pal = { bg: '#f5f1fb', ink: '#2a2140', main: '#5a3fa0', acc: '#f2b84b', pale: '#ffffff', mid: '#7a7092', line: '#ddd5ee', hf: 'Zen Kaku Gothic New', hw: 900, bf: 'Noto Sans JP', on: '#ffffff' }

const hdFeat = (n: string, title: string, body: string, big: string, note: string): CPage => ({ label: `特徴${n}`, bg: HD.bg, els: () => [
  ...kick(HD, 'FEATURE', M, 100),
  T(n, 700, 140, 300, 190, { font: 'Montserrat', weight: 900, fill: HD.line, align: 'right', lh: 1 }),
  hd(HD, title, M, 190, CW, 80),
  R(M, 500, CW, 330, HD.main, 36),
  T(big, 120, 540, 840, 170, { font: 'Montserrat', weight: 900, fill: HD.acc, lh: 1 }),
  T(note, 120, 740, 840, 32, { font: HD.bf, weight: 700, fill: HD.on, lh: 1.3 }),
  bd(HD, body, M, 880, CW, 32),
] })
const NEWITEM = carousel('sn-newitem', '新商品紹介 コスメ発売告知', ['新商品', 'コスメ', 'スキンケア', '発売', '告知'], HD, [
  { label: '表紙', bg: HD.main, dark: true, els: () => [
    ...pill('NEW  10.20 発売', M, 110, 380, 28, HD.acc, HD.ink),
    hd(HD, 'うるおいが\n一日続く\nオールインワン', M, 230, CW, 112, { fill: '#ffffff', lh: 1.15 }),
    bd(HD, '忙しい夜も、1本でケアが完了。', M, 740, CW, 32, { fill: '#e3dbf5', weight: 400 }),
    ...PH(M, 840, CW, 330, 36, '#7459b8'),
  ] },
  { label: 'きっかけ', bg: HD.bg, els: () => [
    ...kick(HD, 'STORY', M, 100),
    hd(HD, '忙しい夜でも、\nちゃんとケアしたい', M, 170, CW, 80),
    ...['化粧水、美容液、乳液……\n全部は続かない', '時間がなくても、\n肌はあきらめたくない', 'シンプルなのに\nしっかりうるおう1本が欲しい'].flatMap((t, i) => {
      const y = 470 + i * 230
      return [R(M + (i % 2) * 120, y, 800, 190, '#ffffff', 36, SH(0.06)), T(t, M + (i % 2) * 120 + 50, y + 42, 700, 34, { font: HD.bf, weight: 700, fill: HD.ink, lh: 1.6 })]
    }),
  ] },
  hdFeat('01', 'ぬるだけで、\n1ステップ完了', '化粧水・美容液・乳液・パックの4役をこれ1本に。洗顔後に、手のひらでなじませるだけです。', '4in1', '4つの役割をまとめました'),
  hdFeat('02', '24時間、\nうるおいが続く', '独自の保湿成分が肌の表面で膜をつくり、うるおいを逃がしません。乾燥しやすい季節も安心です。', '24h', 'うるおい持続テスト済み(自社調べ)'),
  { label: '特徴03', bg: HD.bg, els: () => [
    ...kick(HD, 'FEATURE', M, 100),
    T('03', 700, 140, 300, 190, { font: 'Montserrat', weight: 900, fill: HD.line, align: 'right', lh: 1 }),
    hd(HD, '肌にやさしい\n5つの無添加', M, 190, CW, 80),
    ...['香料', '着色料', 'パラベン', 'アルコール', '鉱物油'].flatMap((t, i) => {
      const y = 500 + i * 130
      return [R(M, y, CW, 106, '#ffffff', 28, SH(0.05)), Ci(150, y + 53, 30, HD.acc), S('check', 130, y + 33, 40, HD.ink),
        T(t + ' 無添加', 220, y + 30, 700, 38, { font: HD.bf, weight: 700, fill: HD.ink, lh: 1.2 })]
    }),
  ] },
  { label: '使い方', bg: HD.bg, els: () => [
    ...kick(HD, 'HOW TO USE', M, 100),
    hd(HD, '使い方は、\nたったの3ステップ', M, 170, CW, 80),
    ...[['洗顔のあとに', '水気をやさしく\nタオルで押さえる'], ['適量をとる', '手のひらに\nパール粒2つぶん'], ['顔全体になじませる', '内側から外側へ\nやさしく広げる']].flatMap(([t, d], i) => {
      const y = 470 + i * 235
      return [R(M, y, CW, 205, '#ffffff', 36, SH(0.06)), Ci(180, y + 102, 52, HD.main),
        T(String(i + 1), 130, y + 60, 100, 80, { font: 'Montserrat', weight: 900, fill: HD.acc, align: 'center', lh: 1 }),
        T(t, 270, y + 40, 700, 38, { font: HD.bf, weight: 900, fill: HD.ink, lh: 1.2 }),
        T(d, 270, y + 100, 700, 28, { font: HD.bf, weight: 400, fill: HD.mid, lh: 1.5 })]
    }),
  ] },
  { label: '成分', bg: HD.main, dark: true, els: () => [
    ...kick(HD, 'INGREDIENTS', M, 100, HD.on),
    hd(HD, 'こだわりの\n3つの成分', M, 170, CW, 80, { fill: HD.on }),
    ...[['ヒアルロン酸', '3種', 'うるおいを抱える'], ['セラミド', '2種', 'バリア機能をサポート'], ['ビタミンC誘導体', '1種', '明るい印象の肌へ']].flatMap(([t, n, d], i) => {
      const y = 470 + i * 250
      return [R(M, y, CW, 2, 'rgba(255,255,255,0.3)'), T(n, M, y + 40, 240, 100, { font: 'Noto Sans JP', weight: 900, fill: HD.acc, lh: 1 }),
        T(t, 350, y + 44, 650, 42, { font: HD.bf, weight: 900, fill: HD.on, lh: 1.2 }),
        T(d, 350, y + 112, 650, 28, { font: HD.bf, weight: 400, fill: '#d6cbef', lh: 1.4 })]
    }),
  ] },
  { label: 'レビュー', bg: HD.bg, els: () => [
    ...kick(HD, 'REVIEW', M, 100),
    hd(HD, 'モニターさんの声', M, 170, CW, 84),
    ...[['朝までしっとりが続いて、\nメイクのりも良くなりました。', '30代 会社員'], ['ベタつかないのに、\nしっかりうるおうのが好き。', '40代 主婦']].flatMap(([t, w], i) => {
      const y = 330 + i * 400
      return [R(M, y, CW, 360, '#ffffff', 36, SH(0.06)),
        ...[0, 1, 2, 3, 4].map((k) => S('star5', 120 + k * 56, y + 36, 44, HD.acc)),
        T(t, 120, y + 120, 840, 34, { font: HD.bf, weight: 700, fill: HD.ink, lh: 1.7 }),
        T(w + '(モニター)', 120, y + 290, 840, 26, { font: HD.bf, weight: 500, fill: HD.mid, lh: 1 })]
    }),
  ] },
  { label: '価格', bg: HD.bg, els: () => [
    ...kick(HD, 'LINE UP', M, 100),
    hd(HD, 'ラインアップと価格', M, 170, CW, 84),
    ...[['本品 50g', '¥3,300', '約1.5か月分'], ['ミニサイズ 15g', '¥1,100', 'お試しにぴったり']].flatMap(([t, p, d], i) => {
      const x = M + i * 470
      return [R(x, 400, 450, 650, i ? '#ffffff' : HD.main, 36, SH(0.06)),
        ...PH(x + 40, 440, 370, 300, 24, i ? '#e6def5' : '#7459b8'),
        T(t, x + 40, 790, 370, 34, { font: HD.bf, weight: 900, fill: i ? HD.ink : HD.on, lh: 1.2 }),
        T(p, x + 40, 855, 370, 66, { font: 'Montserrat', weight: 900, fill: i ? HD.main : HD.acc, lh: 1 }),
        T('税込 / ' + d, x + 40, 960, 370, 26, { font: HD.bf, weight: 400, fill: i ? HD.mid : '#d6cbef', lh: 1.3 })]
    }),
    T('発売記念で、初回限定ミニサイズ付き(なくなり次第終了)', M, 1110, CW, 26, { font: HD.bf, weight: 500, fill: HD.mid, lh: 1.3 }),
  ] },
  { label: '保存・フォロー', bg: HD.main, dark: true, els: () => outro(HD, 'まずは保存して\n発売日を待とう', '10月20日(月)10:00から、\n公式オンラインストアで発売です。', '@sample_beauty') },
])

// ============ 5. イベント告知(マルシェ / ティール + サンセット) ============
const HE: Pal = { bg: '#fff8ec', ink: '#1f3a3d', main: '#0f6b6f', acc: '#ff8a3d', pale: '#ffffff', mid: '#6b7f80', line: '#f0dfc3', hf: 'Dela Gothic One', hw: 400, bf: 'Zen Maru Gothic', on: '#ffffff' }

const EVENT = carousel('sn-event', 'イベント告知 マルシェ開催', ['イベント', '告知', 'マルシェ', '開催', '地域'], HE, [
  { label: '表紙', bg: HE.main, dark: true, els: () => [
    Ci(900, 430, 300, '#138087'), Ci(180, 1000, 200, HE.acc),
    ...pill('入場無料  雨天決行', M, 110, 480, 28, HE.acc, HE.ink),
    T('SATURDAY MARKET', M, 230, CW, 34, { font: 'Montserrat', weight: 700, fill: '#bfe3e0', spacing: 300, lh: 1 }),
    hd(HE, 'みなと\nマルシェ', M, 300, CW, 150, { fill: '#ffffff', lh: 1.1 }),
    T('11.15', M, 760, CW, 180, { font: 'Bebas Neue', weight: 400, fill: HE.acc, lh: 1 }),
    T('SAT  10:00 - 17:00', M, 960, CW, 40, { font: 'Montserrat', weight: 700, fill: '#ffffff', spacing: 100, lh: 1 }),
    T('みなと公園 芝生広場', M, 1030, CW, 34, { font: HE.bf, weight: 700, fill: '#bfe3e0', lh: 1 }),
  ] },
  { label: '開催概要', bg: HE.bg, els: () => [
    ...kick(HE, 'INFO', M, 100),
    hd(HE, '開催概要', M, 170, CW, 84),
    ...[['日時', '2026年11月15日(土)\n10:00 〜 17:00'], ['場所', 'みなと公園 芝生広場\n(駐車場あり・無料)'], ['入場', '無料 / 雨天決行'], ['主催', 'みなとマルシェ実行委員会']].flatMap(([k, v], i) => {
      const y = 330 + i * 210
      return [R(M, y, CW, 180, '#ffffff', 28, SH(0.05)), R(M, y, 14, 180, HE.acc),
        T(k, 130, y + 62, 150, 40, { font: HE.bf, weight: 900, fill: HE.main, lh: 1.2 }),
        T(v, 300, y + 36, 640, 34, { font: HE.bf, weight: 700, fill: HE.ink, lh: 1.5 })]
    }),
  ] },
  ...[['見どころ 01', '地元の味が\n30店舗以上', '農家直送の野菜、焼きたてパン、\nクラフトビールまで勢ぞろい。', '30+', '店舗'], ['見どころ 02', 'ワークショップで\nものづくり', '陶芸、キャンドル、革小物づくり。\n親子で参加できる教室もあります。', '8', '種類の体験'], ['見どころ 03', 'ステージで\nライブ演奏', '地元のバンドやダンスチームが\n一日を通して盛り上げます。', '12', '組が出演']].map(([k, t, b, n, u], i): CPage => ({ label: k, bg: i === 1 ? HE.main : HE.bg, dark: i === 1, els: () => {
    const dk = i === 1, fg = dk ? HE.on : HE.ink
    return [
      ...kick(HE, k.toUpperCase().replace('見どころ', 'POINT'), M, 100, dk ? HE.on : undefined),
      hd(HE, t, M, 170, CW, 84, { fill: fg }),
      ...PH(M, 480, CW, 340, 36, dk ? '#138087' : '#f3e3c4'),
      T(n, M, 860, 380, 140, { font: 'Bebas Neue', weight: 400, fill: HE.acc, lh: 1 }),
      T(u, 440, 930, 540, 40, { font: HE.bf, weight: 900, fill: fg, lh: 1.2 }),
      bd(HE, b, M, 1040, CW, 28, { fill: fg, weight: 500 }),
    ]
  } })),
  { label: '出店者', bg: HE.bg, els: () => [
    ...kick(HE, 'SHOPS', M, 100),
    hd(HE, '注目の出店者', M, 170, CW, 84),
    ...[['パン工房 ひだまり', '天然酵母のパン'], ['農園 みどりや', '朝どれ野菜'], ['珈琲 港の豆', '自家焙煎コーヒー'], ['Atelier mimi', '手染めの雑貨']].flatMap(([t, d], i) => {
      const x = M + (i % 2) * 470, y = 330 + Math.floor(i / 2) * 440
      return [...PH(x, y, 450, 260, 28, ['#f3e3c4', '#d4ece9', '#f6d9c3', '#e5ddf0'][i]),
        T(t, x, y + 290, 450, 32, { font: HE.bf, weight: 900, fill: HE.ink, lh: 1.2 }),
        T(d, x, y + 340, 450, 26, { font: HE.bf, weight: 500, fill: HE.mid, lh: 1.2 })]
    }),
  ] },
  { label: 'タイムテーブル', bg: HE.bg, els: () => [
    ...kick(HE, 'TIMETABLE', M, 100),
    hd(HE, 'ステージの予定', M, 170, CW, 84),
    R(250, 340, 4, 760, HE.line),
    ...[['10:00', 'オープニング・開会あいさつ'], ['11:30', '地元ダンスチームのステージ'], ['13:00', 'ライブ演奏(ジャズバンド)'], ['15:00', '子ども向け・工作ショー'], ['16:30', '大抽選会・クロージング']].flatMap(([t, d], i) => {
      const y = 340 + i * 150
      return [T(t, M, y + 10, 140, 34, { font: 'Montserrat', weight: 700, fill: HE.main, lh: 1.2 }), Ci(252, y + 28, 16, i === 4 ? HE.acc : HE.main),
        T(d, 300, y + 4, 680, 32, { font: HE.bf, weight: 700, fill: HE.ink, lh: 1.5 })]
    }),
  ] },
  { label: 'アクセス', bg: HE.bg, els: () => [
    ...kick(HE, 'ACCESS', M, 100),
    hd(HE, 'アクセス', M, 170, CW, 84),
    ...PH(M, 330, CW, 400, 36, '#dfe9e4'),
    T('MAP', M, 500, CW, 50, { font: 'Montserrat', weight: 900, fill: '#b3c9c0', align: 'center', spacing: 400, lh: 1 }),
    ...[['電車', 'みなと駅から徒歩8分'], ['バス', '「みなと公園前」下車すぐ'], ['車', '臨時駐車場(約200台・無料)']].flatMap(([k, v], i) => [
      ...pill(k, M, 790 + i * 128, 150, 26, HE.main, '#ffffff'),
      T(v, 270, 800 + i * 128, 720, 34, { font: HE.bf, weight: 700, fill: HE.ink, lh: 1.2 }),
    ]),
  ] },
  { label: 'お願い', bg: HE.bg, els: () => [
    ...kick(HE, 'NOTICE', M, 100),
    hd(HE, '来場前にチェック', M, 170, CW, 84),
    ...[['持ち物', 'エコバッグ・小銭があると便利です'], ['天気', '雨天決行(荒天時は中止・公式SNSでお知らせ)'], ['ペット', 'リードをつけてご入場いただけます'], ['ごみ', '会場のごみは各自お持ち帰りにご協力を']].flatMap(([k, v], i) => {
      const y = 330 + i * 200
      return [R(M, y, CW, 170, '#ffffff', 28, SH(0.05)),
        T(k, 120, y + 56, 190, 36, { font: HE.bf, weight: 900, fill: HE.acc, lh: 1.2 }),
        bd(HE, v, 330, y + 40, 610, 28, { weight: 700 })]
    }),
  ] },
  { label: '保存・フォロー', bg: HE.main, dark: true, els: () => outro(HE, '11/15は\nみなとへ集合', '保存しておけば、当日すぐに\n場所と時間を確認できます。', '@minato_marche') },
])

// ============ 6. 求人・採用(カフェスタッフ募集 / フォレスト + クリーム) ============
const HF: Pal = { bg: '#f6f1e6', ink: '#1f2f26', main: '#2f5d46', acc: '#e8a33d', pale: '#ffffff', mid: '#66756b', line: '#ddd5bf', hf: 'Zen Maru Gothic', hw: 900, bf: 'Zen Maru Gothic', on: '#ffffff' }

const JOBS = carousel('sn-recruit', '求人・採用 スタッフ募集', ['求人', '採用', 'スタッフ募集', 'アルバイト', 'カフェ'], HF, [
  { label: '表紙', bg: HF.main, dark: true, els: () => [
    ...pill('WE ARE HIRING', M, 110, 360, 28, HF.acc, HF.ink),
    hd(HF, 'いっしょに\n働きませんか。', M, 230, CW, 112, { fill: '#ffffff', lh: 1.15 }),
    bd(HF, 'カフェ「ノエル」ホールスタッフ募集\n未経験からスタートできます', M, 530, CW, 32, { fill: '#d5e4da', weight: 500 }),
    ...PH(M, 700, CW, 470, 40, '#47765d'),
  ] },
  { label: 'お店について', bg: HF.bg, els: () => [
    ...kick(HF, 'ABOUT US', M, 100),
    hd(HF, '地域に愛されて\n12年のカフェです', M, 170, CW, 80),
    ...PH(M, 470, CW, 380, 36, '#e9e0c9'),
    ...[['12年', '地域で営業'], ['3店舗', '市内で展開'], ['25名', 'スタッフ数']].flatMap(([n, l], i) => [
      T(n, M + i * 310, 900, 290, 64, { font: HF.bf, weight: 900, fill: HF.main, lh: 1.1 }),
      T(l, M + i * 310, 990, 290, 28, { font: HF.bf, weight: 500, fill: HF.mid, lh: 1.2 }),
    ]),
    bd(HF, '季節の食材を使った料理と、ていねいな接客が自慢です。', M, 1060, CW, 28, { weight: 500 }),
  ] },
  { label: '仕事内容', bg: HF.bg, els: () => [
    ...kick(HF, 'JOB', M, 100),
    hd(HF, 'お願いしたい\nお仕事', M, 170, CW, 84),
    ...[['接客・ご案内', 'お客さまをお迎えし、席へご案内します'], ['ドリンクづくり', 'コーヒーやラテを先輩と一緒に学びます'], ['配膳・片づけ', 'お料理を運び、席を整えます'], ['レジ・お会計', 'キャッシュレスにも対応した操作です']].flatMap(([t, d], i) => {
      const y = 470 + i * 175
      return [R(M, y, CW, 150, '#ffffff', 28, SH(0.05)), Ci(160, y + 75, 40, HF.acc),
        T(String(i + 1), 120, y + 40, 80, 66, { font: 'Montserrat', weight: 900, fill: HF.ink, align: 'center', lh: 1.05 }),
        T(t, 235, y + 26, 720, 36, { font: HF.bf, weight: 900, fill: HF.ink, lh: 1.2 }),
        T(d, 235, y + 84, 720, 24, { font: HF.bf, weight: 500, fill: HF.mid, lh: 1.2 })]
    }),
  ] },
  { label: '1日の流れ', bg: HF.bg, els: () => [
    ...kick(HF, 'A DAY', M, 100),
    hd(HF, 'ある日の1日', M, 170, CW, 84),
    R(250, 340, 4, 800, HF.line),
    ...[['9:00', '出勤・朝のミーティング'], ['9:30', 'オープン準備・開店'], ['12:00', 'ランチタイム対応'], ['14:00', '休憩(まかない付き)'], ['15:00', 'カフェタイム・接客'], ['17:30', 'クローズ作業・退勤']].flatMap(([t, d], i) => {
      const y = 340 + i * 130
      return [T(t, M, y + 4, 150, 34, { font: 'Montserrat', weight: 700, fill: HF.main, lh: 1.2 }), Ci(252, y + 22, 16, i === 3 ? HF.acc : HF.main),
        T(d, 300, y, 690, 34, { font: HF.bf, weight: 700, fill: HF.ink, lh: 1.5 })]
    }),
  ] },
  { label: '数字で見る', bg: HF.main, dark: true, els: () => [
    ...kick(HF, 'IN NUMBERS', M, 100, HF.on),
    hd(HF, '数字で見る\n働きやすさ', M, 170, CW, 84, { fill: HF.on }),
    ...[['月8日', '休みの日数(目安)'], ['92%', '未経験からのスタート'], ['3年', '平均勤続年数']].flatMap(([n, l], i) => {
      const y = 480 + i * 240
      return [R(M, y, CW, 2, 'rgba(255,255,255,0.3)'),
        T(n, M, y + 36, 520, 110, { font: i === 0 ? HF.bf : 'Montserrat', weight: 900, fill: HF.acc, lh: 1 }),
        T(l, 600, y + 80, 400, 32, { font: HF.bf, weight: 700, fill: HF.on, lh: 1.3 })]
    }),
    T('※数値はサンプルです', M, 1180, CW, 22, { font: HF.bf, weight: 400, fill: '#a9c4b3', lh: 1 }),
  ] },
  { label: '先輩の声', bg: HF.bg, els: () => [
    ...kick(HF, 'VOICE', M, 100),
    hd(HF, '先輩スタッフの声', M, 170, CW, 84),
    ...[['未経験で入りました。先輩が\nていねいに教えてくれます。', 'Aさん 入社1年'], ['シフトの相談がしやすく、\n学業とも両立できています。', 'Bさん 大学3年']].flatMap(([t, w], i) => {
      const y = 330 + i * 420
      return [R(M, y, CW, 380, '#ffffff', 36, SH(0.06)), ...PH(120, y + 40, 100, 100, 50, '#e9e0c9'),
        T(w, 245, y + 70, 700, 30, { font: HF.bf, weight: 900, fill: HF.main, lh: 1.2 }),
        T(t, 120, y + 180, 840, 34, { font: HF.bf, weight: 700, fill: HF.ink, lh: 1.7 })]
    }),
  ] },
  { label: '待遇', bg: HF.bg, els: () => [
    ...kick(HF, 'BENEFITS', M, 100),
    hd(HF, '待遇・福利厚生', M, 170, CW, 84),
    ...['時給 1,200円〜(研修期間も同額)', '交通費 月1万円まで支給', 'まかない付き(勤務4時間以上)', '制服貸与・髪色自由', '昇給あり・社員登用制度あり'].flatMap((t, i) => {
      const y = 330 + i * 160
      return [R(M, y, CW, 130, '#ffffff', 28, SH(0.05)), Ci(150, y + 65, 30, HF.main), S('check', 130, y + 45, 40, '#ffffff'),
        T(t, 210, y + 40, 770, 32, { font: HF.bf, weight: 700, fill: HF.ink, lh: 1.3 })]
    }),
  ] },
  { label: '募集要項', bg: HF.bg, els: () => [
    ...kick(HF, 'REQUIREMENTS', M, 100),
    hd(HF, '募集要項', M, 170, CW, 84),
    ...[['職種', 'ホールスタッフ'], ['勤務地', '市内3店舗のいずれか'], ['時間', '9:00〜18:00 のうち4時間〜'], ['日数', '週2日〜(応相談)'], ['資格', '未経験歓迎・高校生不可']].flatMap(([k, v], i) => {
      const y = 330 + i * 160
      return [R(M, y + 138, CW, 2, HF.line),
        T(k, M, y + 40, 200, 32, { font: HF.bf, weight: 900, fill: HF.acc, lh: 1.2 }),
        T(v, 300, y + 40, 700, 32, { font: HF.bf, weight: 700, fill: HF.ink, lh: 1.3 })]
    }),
  ] },
  { label: '選考フロー', bg: HF.bg, els: () => [
    ...kick(HF, 'FLOW', M, 100),
    hd(HF, '応募から入社まで', M, 170, CW, 84),
    ...[['応募', 'DMまたはフォームから'], ['面談(30分)', 'お店で、お話ししましょう'], ['体験勤務', '雰囲気を確かめられます'], ['採用決定', '最短で1週間']].flatMap(([t, d], i) => {
      const y = 340 + i * 210
      return [R(M, y, CW, 170, i === 3 ? HF.main : '#ffffff', 28, SH(0.05)),
        T('STEP ' + (i + 1), 120, y + 36, 260, 26, { font: 'Montserrat', weight: 900, fill: HF.acc, spacing: 100, lh: 1 }),
        T(t, 120, y + 80, 840, 40, { font: HF.bf, weight: 900, fill: i === 3 ? HF.on : HF.ink, lh: 1.2 }),
        ...(i < 3 ? [S('arrowD', 930, y + 170 - 4, 36, HF.acc)] : [])]
        .concat([T(d, 500, y + 40, 460, 26, { font: HF.bf, weight: 500, fill: i === 3 ? '#d5e4da' : HF.mid, lh: 1.3, align: 'right' })])
    }),
  ] },
  { label: '応募・保存', bg: HF.main, dark: true, els: () => outro(HF, 'ご応募は\nDMで気軽に', 'まずは「話を聞きたい」だけでも大丈夫。\nお待ちしています。', '@cafe_noel_jobs') },
])

// ============ 7. 料理レシピ(トマト煮込み / トマトレッド + クリーム) ============
const HG: Pal = { bg: '#fff5e8', ink: '#3a2118', main: '#d8452f', acc: '#f4b73f', pale: '#ffffff', mid: '#8a6f62', line: '#f0dcc4', hf: 'Mochiy Pop One', hw: 400, bf: 'Zen Maru Gothic', on: '#ffffff' }

const stepPage = (i: number, t: string, d: string, tip: string, time: string): CPage => ({ label: `手順${i}`, bg: HG.bg, els: () => [
  ...kick(HG, 'HOW TO COOK', M, 100),
  Ci(M + 70, 290, 70, HG.main),
  T(String(i), M, 238, 140, 100, { font: 'Montserrat', weight: 900, fill: '#ffffff', align: 'center', lh: 1 }),
  T('STEP', 260, 240, 300, 28, { font: 'Montserrat', weight: 900, fill: HG.main, spacing: 300, lh: 1 }),
  T(time, 260, 290, 500, 32, { font: HG.bf, weight: 700, fill: HG.mid, lh: 1 }),
  hd(HG, t, M, 410, CW, 76),
  ...PH(M, 640, CW, 300, 36, '#f3dfc6'),
  bd(HG, d, M, 410 + th(nl(t), 76, 1.2) + 30, CW, 30, { weight: 500 }),
  R(M, 980, CW, 190, '#ffffff', 28, SH(0.06)),
  ...pill('コツ', 120, 1010, 130, 26, HG.acc, HG.ink),
  bd(HG, tip, 120, 1090, 840, 26, { weight: 700 }),
] })
const RECIPE = carousel('sn-recipe', '料理レシピ 鶏のトマト煮込み', ['料理', 'レシピ', '時短', 'トマト煮込み', '夕食'], HG, [
  { label: '表紙', bg: HG.main, dark: true, els: () => [
    ...pill('材料7つ  30分', M, 110, 360, 28, HG.acc, HG.ink),
    hd(HG, 'ほったらかしで\n絶品', M, 230, CW, 110, { fill: '#ffffff', lh: 1.15 }),
    hd(HG, '鶏のトマト煮込み', M, 530, CW, 76, { fill: HG.acc }),
    ...PH(M, 700, CW, 470, 40, '#ec7a65'),
  ] },
  { label: '材料', bg: HG.bg, els: () => [
    ...kick(HG, 'INGREDIENTS', M, 100),
    hd(HG, '材料(2人分)', M, 170, CW, 84),
    ...[['鶏もも肉', '1枚(約300g)'], ['玉ねぎ', '1/2個'], ['トマト缶(カット)', '1缶(400g)'], ['にんにく', '1かけ'], ['オリーブオイル', '大さじ1'], ['塩・こしょう', '各少々'], ['砂糖', '小さじ1']].flatMap(([a, b], i) => {
      const y = 330 + i * 122
      return [R(M, y + 106, CW, 2, HG.line), T(a, M, y + 28, 520, 34, { font: HG.bf, weight: 700, fill: HG.ink, lh: 1.2 }),
        T(b, 560, y + 28, 440, 34, { font: HG.bf, weight: 500, fill: HG.mid, align: 'right', lh: 1.2 })]
    }),
  ] },
  { label: '下ごしらえ', bg: HG.bg, els: () => [
    ...kick(HG, 'PREP', M, 100),
    hd(HG, '下ごしらえは\n3分だけ', M, 170, CW, 84),
    ...[['鶏肉を切る', '一口大に切り、塩・こしょうをふる'], ['玉ねぎを切る', '薄切りにする'], ['にんにくを刻む', 'みじん切りにする']].flatMap(([t, d], i) => {
      const y = 470 + i * 235
      return [R(M, y, CW, 205, '#ffffff', 36, SH(0.06)), Ci(180, y + 102, 52, HG.acc),
        T(String(i + 1), 130, y + 60, 100, 80, { font: 'Montserrat', weight: 900, fill: HG.ink, align: 'center', lh: 1 }),
        T(t, 270, y + 50, 700, 38, { font: HG.bf, weight: 900, fill: HG.ink, lh: 1.2 }),
        bd(HG, d, 270, y + 112, 690, 26, { weight: 500, fill: HG.mid })]
    }),
  ] },
  stepPage(1, '鶏肉を\nこんがり焼く', '鍋にオイルとにんにくを入れて火にかけ、香りが出たら鶏肉を皮目から焼きます。', '触らずに2〜3分焼くと、きれいな焼き色に', '約5分'),
  stepPage(2, '玉ねぎを\n加えて炒める', '玉ねぎを加え、しんなりするまで中火で炒めます。', '鶏肉から出た脂を使うと、コクが出ます', '約3分'),
  stepPage(3, 'トマト缶を\n入れて煮る', 'トマト缶と砂糖を加え、ふたをして弱火で15分ほど煮込みます。', '砂糖を少し入れると、酸味がまるくなります', '約15分'),
  stepPage(4, '味をととのえて\n完成', 'ふたを外して軽く煮詰め、塩・こしょうで味をととのえたら完成です。', 'とろみがつくまで、ひと煮立ちさせて', '約3分'),
  { label: 'おいしく作るコツ', bg: HG.main, dark: true, els: () => [
    ...kick(HG, 'POINT', M, 100, HG.on),
    hd(HG, 'おいしく作る\n3つのコツ', M, 170, CW, 84, { fill: HG.on }),
    ...[['皮目からじっくり', '焼き色がうまみになります'], ['砂糖をひとさじ', 'トマトの酸味をまるくします'], ['ふたをして弱火', '焦げつきを防ぎます']].flatMap(([t, d], i) => {
      const y = 470 + i * 240
      return [R(M, y, CW, 2, 'rgba(255,255,255,0.35)'), T('0' + (i + 1), M, y + 40, 180, 80, { font: 'Montserrat', weight: 900, fill: HG.acc, lh: 1 }),
        T(t, 280, y + 40, 700, 42, { font: HG.bf, weight: 900, fill: HG.on, lh: 1.2 }),
        T(d, 280, y + 110, 700, 28, { font: HG.bf, weight: 500, fill: '#ffd9cf', lh: 1.3 })]
    }),
  ] },
  { label: 'アレンジ', bg: HG.bg, els: () => [
    ...kick(HG, 'ARRANGE', M, 100),
    hd(HG, 'アレンジ3選', M, 170, CW, 84),
    ...[['チーズをのせて', 'とろけるチーズを\nのせてオーブンへ'], ['パスタにからめて', 'ゆでたパスタに\nソースをたっぷり'], ['ごはんにかけて', 'ライスにのせて\nワンプレートに']].flatMap(([t, d], i) => {
      const x = M + i * 320
      return [...PH(x, 330, 280, 330, 28, '#f3dfc6'),
        T(t, x, 700, 280, 32, { font: HG.bf, weight: 900, fill: HG.ink, lh: 1.3 }),
        T(d, x, 800, 280, 26, { font: HG.bf, weight: 500, fill: HG.mid, lh: 1.6 })]
    }),
    R(M, 1000, CW, 170, '#ffffff', 28, SH(0.06)),
    bd(HG, '残ったら冷蔵庫で2日保存OK。\n温め直すと、さらに味がなじみます。', 120, 1040, 840, 28, { weight: 700 }),
  ] },
  { label: '保存・フォロー', bg: HG.main, dark: true, els: () => outro(HG, '今夜の献立に\n保存してね', 'ほかのレシピも毎週投稿中。\n材料が少なくて簡単なものばかり。', '@sample_kitchen') },
])

// ============ 8. 旅行ガイド(京都 1泊2日 / インディゴ + 朱) ============
const HH: Pal = { bg: '#f4f1ea', ink: '#1b2440', main: '#1f2c5c', acc: '#d9482b', pale: '#ffffff', mid: '#6a7088', line: '#dcd7c8', hf: 'Shippori Mincho', hw: 800, bf: 'Noto Sans JP', on: '#ffffff' }

const spot = (label: string, time: string, title: string, body: string, meta: [string, string][], ph: string): CPage => ({ label, bg: HH.bg, els: () => [
  ...kick(HH, 'DAY ' + label[0], M, 100),
  ...pill(time, 760, 92, 240, 26, HH.main, HH.on),
  hd(HH, title, M, 170, CW, 84),
  ...PH(M, 470, CW, 340, 36, ph),
  bd(HH, body, M, 850, CW, 30, { weight: 400 }),
  ...meta.flatMap(([k, v], j) => [
    R(M + j * 310, 1060, 280, 3, HH.acc),
    T(k, M + j * 310, 1080, 280, 24, { font: HH.bf, weight: 700, fill: HH.mid, lh: 1 }),
    T(v, M + j * 310, 1118, 280, 30, { font: HH.bf, weight: 900, fill: HH.ink, lh: 1.1 }),
  ]),
] })
const TRAVEL = carousel('sn-travel', '旅行ガイド 京都1泊2日', ['旅行', '京都', '1泊2日', 'モデルコース', '観光'], HH, [
  { label: '表紙', bg: HH.main, dark: true, els: () => [
    ...pill('保存版  モデルコース', M, 110, 440, 28, HH.acc, HH.on),
    T('KYOTO', M, 230, CW, 60, { font: 'Cormorant Garamond', weight: 700, fill: '#b9c1e0', spacing: 600, lh: 1 }),
    hd(HH, '京都\n1泊2日\n王道ルート', M, 320, CW, 130, { fill: '#ffffff', lh: 1.15 }),
    ...PH(M, 840, CW, 330, 36, '#3b4a85'),
  ] },
  { label: '全体プラン', bg: HH.bg, els: () => [
    ...kick(HH, 'PLAN', M, 100),
    hd(HH, '2日間の流れ', M, 170, CW, 84),
    ...[['DAY 1', '東山エリア', ['清水寺', '二寧坂・産寧坂', '祇園で夕食']], ['DAY 2', '嵐山エリア', ['竹林の小径', '渡月橋', '嵯峨野の湯豆腐']]].flatMap(([d, a, l], i) => {
      const y = 330 + i * 430
      return [R(M, y, CW, 390, '#ffffff', 36, SH(0.06)), R(M, y, 14, 390, i ? HH.acc : HH.main),
        T(d as string, 130, y + 36, 300, 30, { font: 'Montserrat', weight: 900, fill: HH.acc, spacing: 200, lh: 1 }),
        hd(HH, a as string, 130, y + 86, 800, 50),
        ...(l as string[]).map((s, k) => T('・' + s, 130, y + 190 + k * 56, 800, 30, { font: HH.bf, weight: 500, fill: HH.ink, lh: 1.2 }))]
    }),
  ] },
  spot('1日目 午前', '9:00', '清水寺で、\n京都の朝を始める', '朝いちばんに訪れると、人が少なく写真も撮りやすい時間帯。舞台から京都の街を一望できます。', [['拝観料', '500円'], ['所要', '約90分'], ['最寄り', '清水五条駅']], '#cfd4e6'),
  spot('1日目 午後', '13:00', '二寧坂・産寧坂を\n歩いて散策', '石畳の坂道に、町家のお店が並びます。おみやげ探しや甘味休憩にぴったり。', [['歩く距離', '約1km'], ['所要', '約2時間'], ['おすすめ', '抹茶スイーツ']], '#ead5cb'),
  spot('1日目 夜', '18:00', '祇園で味わう\n京の夕食', '花見小路の雰囲気を楽しみながら、おばんざいや京料理を。予約をしておくと安心です。', [['予算', '5,000円〜'], ['所要', '約2時間'], ['予約', '早めがおすすめ']], '#d9dcc9'),
  spot('2日目 午前', '9:00', '竹林の小径で\n静かな散歩', '見上げるほど高い竹のトンネルが続きます。朝の光が差し込む時間が特に美しいです。', [['入場料', '無料'], ['所要', '約45分'], ['最寄り', '嵯峨嵐山駅']], '#cddccb'),
  spot('2日目 午後', '12:00', '渡月橋と\n嵯峨野グルメ', '桂川にかかる渡月橋を散歩したあとは、名物の湯豆腐ランチ。川沿いのカフェも人気です。', [['ランチ', '2,500円〜'], ['所要', '約2時間'], ['おすすめ', '湯豆腐']], '#cfdfe6'),
  { label: '予算', bg: HH.main, dark: true, els: () => [
    ...kick(HH, 'BUDGET', M, 100, HH.on),
    hd(HH, '費用の目安\n(1人あたり)', M, 170, CW, 80, { fill: HH.on }),
    ...[['交通費(新幹線往復)', '28,000円'], ['宿泊(1泊)', '12,000円'], ['食事(4回)', '10,000円'], ['拝観料・おみやげ', '6,000円']].flatMap(([k, v], i) => {
      const y = 460 + i * 110
      return [R(M, y + 90, CW, 2, 'rgba(255,255,255,0.25)'), T(k, M, y + 24, 560, 30, { font: HH.bf, weight: 500, fill: '#d3d9ee', lh: 1.2 }),
        T(v, 600, y + 20, 400, 36, { font: HH.bf, weight: 900, fill: HH.on, align: 'right', lh: 1.1 })]
    }),
    T('合計', M, 960, 300, 36, { font: HH.bf, weight: 900, fill: '#d3d9ee', lh: 1 }),
    T('約 56,000円', 300, 930, 700, 80, { font: HH.bf, weight: 900, fill: HH.acc, align: 'right', lh: 1 }),
    T('※金額は目安です', M, 1100, CW, 22, { font: HH.bf, weight: 400, fill: '#a3abc9', lh: 1 }),
  ] },
  { label: '持ち物・注意', bg: HH.bg, els: () => [
    ...kick(HH, 'TIPS', M, 100),
    hd(HH, '旅の前に\n知っておきたいこと', M, 170, CW, 80),
    ...[['歩きやすい靴', '1日2万歩になることも'], ['現金も少し', '小さなお店は現金のみの場合あり'], ['早めの予約', '人気の食事処は事前に確認を'], ['朝の行動', '午前中は空いていて快適です']].flatMap(([t, d], i) => {
      const y = 470 + i * 175
      return [R(M, y, CW, 150, '#ffffff', 28, SH(0.05)), Ci(160, y + 75, 38, HH.acc), S('check', 140, y + 55, 40, '#ffffff'),
        T(t, 230, y + 28, 720, 34, { font: HH.bf, weight: 900, fill: HH.ink, lh: 1.2 }),
        T(d, 230, y + 86, 720, 24, { font: HH.bf, weight: 400, fill: HH.mid, lh: 1.2 })]
    }),
  ] },
  { label: '保存・フォロー', bg: HH.main, dark: true, els: () => outro(HH, '次の旅の\n計画に保存', '全国のモデルコースを\n毎週お届けしています。', '@sample_travel') },
])

// ---------- ストーリー 1080×1920 ----------
// 上下250pxはアプリの表示で隠れやすいので、文字は y=250〜1670 に収める
const storyKit = (id: string, name: string, tags: string[], bgs: string[], frames: (() => FabricObject[])[], dark: (i: number) => boolean, P: Pal): Template => {
  const total = frames.length
  const bar = (n: number): FabricObject[] => {
    const sw = Math.round((CW - 9 * 10) / 10), d = dark(n)
    return Array.from({ length: total }, (_, k) => R(M + k * (sw + 10), 262, sw, 8, k <= n ? (d ? P.acc : P.main) : (d ? 'rgba(255,255,255,0.28)' : P.line), 4))
  }
  const pages: TemplatePage[] = frames.map((f, i) => ({ bg: bgs[i], label: i === 0 ? '1枚目' : `${i + 1}枚目`, build: () => [...f(), ...bar(i)] }))
  const [a, ...rest] = pages
  return { id, name, category: 'ストーリー', w: 1080, h: 1920, bg: a.bg, build: a.build, more: rest, tags }
}

// ============ 9. お店の1日(ベーカリー / クリーム + キャラメル) ============
const SB: Pal = { bg: '#fbf1e0', ink: '#4a2c17', main: '#c8742b', acc: '#f2c14e', pale: '#ffffff', mid: '#8d6a4c', line: '#ecd9bb', hf: 'Zen Maru Gothic', hw: 900, bf: 'Zen Maru Gothic', on: '#fff8ec' }

const sbTimes: [string, string, string, string, string][] = [
  ['04:30', 'まだ暗い朝、\n仕込みスタート', '生地をこねて、発酵させる時間。\nパンの味はここで決まります。', '#e9d3ac', '仕込み'],
  ['06:00', '窯から出てくる、\n焼きたての香り', '香ばしい匂いが、\n店じゅうに広がる時間です。', '#efc99a', '焼成'],
  ['08:00', 'いよいよ、\nお店オープン', '朝いちばんのお客さまを\n笑顔でお迎えします。', '#f0d5a8', 'OPEN'],
  ['10:00', '人気No.1は\n塩バターパン', '毎日完売する看板商品。\nお早めにどうぞ。', '#e8c28c', '人気'],
  ['12:00', 'ランチタイムは\nサンドイッチ', '具だくさんの総菜パンが\n並びます。', '#ecd0a0', 'LUNCH'],
  ['15:00', 'おやつの時間に\n新作の試作', '季節のフルーツを使った\n新しいパンを研究中。', '#f1d9b0', '新作'],
  ['17:00', '夕方の\nお買い得タイム', '閉店前は、一部のパンが\n20%オフになります。', '#e6bb83', 'SALE'],
  ['18:30', '本日も、\nありがとうございました', '片づけをして、\nあしたの準備に入ります。', '#7b4a28', 'CLOSE'],
]
const sbFrame = (i: number): (() => FabricObject[]) => () => {
  const [time, t, c, ph, tag] = sbTimes[i], d = i === 7
  const fg = d ? SB.on : SB.ink
  return [
    T(tag, M, 296, CW, 26, { font: 'Montserrat', weight: 900, fill: d ? SB.acc : SB.main, spacing: 400, lh: 1 }),
    T(time, M, 340, CW, 250, { font: 'Bebas Neue', weight: 400, fill: d ? SB.acc : SB.main, lh: 1 }),
    hd(SB, t, M, 650, CW, 76, { fill: fg }),
    ...PH(M, 940, CW, 440, 40, ph),
    bd(SB, c, M, 1430, CW, 32, { fill: fg, weight: 500 }),
  ]
}
const BAKERY = storyKit('sn-st-shopday', 'お店の1日 ベーカリー', ['ストーリー', 'お店', '1日', 'ベーカリー', 'パン屋', '密着'], ['#fbf1e0', ...[0, 1, 2, 3, 4, 5, 6].map(() => '#fbf1e0'), '#4a2c17', '#c8742b'], [
  () => [
    ...pill('パン工房 ひだまり', M, 330, 520, 32, SB.main, '#ffffff'),
    hd(SB, 'パン屋の\n1日に\n密着', M, 480, CW, 170, { lh: 1.1 }),
    R(M, 1170, 140, 8, SB.main),
    bd(SB, '朝4時半から夜まで、\nお店の1日をのぞいてみましょう。', M, 1220, CW, 34, { weight: 500 }),
    T('タップして次へ  ▶', M, 1500, CW, 30, { font: SB.bf, weight: 900, fill: SB.mid, lh: 1 }),
  ],
  ...[0, 1, 2, 3, 4, 5, 6, 7].map(sbFrame),
  () => [
    T('SEE YOU', M, 330, CW, 40, { font: 'Montserrat', weight: 900, fill: SB.on, spacing: 500, lh: 1 }),
    hd(SB, 'また明日も\n焼いて待ってます', M, 420, CW, 92, { fill: '#ffffff' }),
    R(M, 790, 140, 8, SB.on),
    ...pill('新作の情報は、投稿で', M, 900, CW, 38, SB.acc, SB.ink),
    ...pill('フォローして見逃さない', M, 900 + pillH(38) + 28, CW, 38, 'rgba(255,255,255,0.18)', '#ffffff', { stroke: 'rgba(255,255,255,0.7)', strokeWidth: 2 }),
    T('@pan_hidamari', M, 1250, CW, 40, { font: 'Montserrat', weight: 700, fill: '#ffffff', lh: 1, spacing: 80 }),
  ],
], (i) => i >= 8, SB)

// ============ 10. Q&Aコーナー(雑貨店主に聞く / ディープパープル + オレンジ) ============
const SQ: Pal = { bg: '#2d1b4e', ink: '#2d1b4e', main: '#ff7a59', acc: '#ffc857', pale: '#ffffff', mid: '#8c7aa8', line: '#e3d9f2', hf: 'Zen Maru Gothic', hw: 900, bf: 'Zen Maru Gothic', on: '#ffffff' }

const sqQA: [string, string][] = [
  ['お店を始めた\nきっかけは?', '旅先で出会った手仕事の雑貨に感動して、「自分もこの良さを伝えたい」と思ったのが始まりです。5年前に小さな店を開きました。'],
  ['1日のお仕事は\nどんな感じ?', '午前は商品の検品と発送、午後は接客と撮影。夜はSNSの投稿とお客さまへのお返事をしています。'],
  ['いま一番の\nおすすめは?', '手染めのリネンのポーチです。軽くて丈夫で、使うほどに味が出ます。ギフトにも人気です。'],
  ['お休みの日は\n何してる?', '作り手さんの工房を訪ねたり、のんびりカフェで読書をしています。新しい出会いが仕入れのヒントです。'],
]
const sqFrames: (() => FabricObject[])[] = [
  () => [
    ...pill('質問に答えます', M, 330, 420, 34, SQ.acc, SQ.ink),
    hd(SQ, '雑貨屋の\n店主に\n聞いてみた', M, 470, CW, 160, { fill: '#ffffff', lh: 1.1 }),
    R(M, 1140, CW, 220, '#ffffff', 36),
    T('みなさんからいただいた質問から、4つにお答えします。', 130, 1190, 820, 34, { font: SQ.bf, weight: 700, fill: SQ.ink, lh: 1.7 }),
    T('タップして次へ  ▶', M, 1500, CW, 30, { font: SQ.bf, weight: 900, fill: SQ.acc, lh: 1 }),
  ],
  ...sqQA.flatMap(([q, a], i): (() => FabricObject[])[] => [
    () => [
      T('Q' + (i + 1), M, 330, CW, 300, { font: 'Bebas Neue', weight: 400, fill: SQ.main, lh: 1 }),
      R(M, 700, CW, 520, '#ffffff', 48, SH(0.2)),
      T('QUESTION', 130, 750, 500, 28, { font: 'Montserrat', weight: 900, fill: SQ.main, spacing: 300, lh: 1 }),
      hd(SQ, q, 130, 830, 820, 80, { fill: SQ.ink, lh: 1.3 }),
      T('次のページで答えます', M, 1400, 700, 32, { font: SQ.bf, weight: 700, fill: '#d9ccef', lh: 1 }),
      S('arrowR', 790, 1390, 56, SQ.acc),
    ],
    () => [
      T('A' + (i + 1), M, 330, CW, 300, { font: 'Bebas Neue', weight: 400, fill: SQ.acc, lh: 1 }),
      R(M, 700, CW, 800, '#ffffff', 48, SH(0.2)),
      R(M, 700, 14, 800, SQ.acc),
      ...PH(130, 750, 120, 120, 60, '#e3d9f2'),
      T('店主の答え', 280, 790, 600, 36, { font: SQ.bf, weight: 900, fill: SQ.ink, lh: 1 }),
      bd(SQ, a, 130, 930, 820, 36, { fill: SQ.ink, weight: 500 }),
    ],
  ]),
  () => [
    T('THANK YOU', M, 330, CW, 40, { font: 'Montserrat', weight: 900, fill: SQ.acc, spacing: 500, lh: 1 }),
    hd(SQ, 'もっと聞きたい\nことは?', M, 420, CW, 100, { fill: '#ffffff' }),
    R(M, 800, 140, 8, SQ.main),
    bd(SQ, '質問ボックスにどんどん\n送ってくださいね。次回も回答します。', M, 860, CW, 36, { fill: '#e3d9f2', weight: 500 }),
    ...pill('質問を送る', M, 1120, CW, 40, SQ.acc, SQ.ink),
    T('@zakka_sample_shop', M, 1330, CW, 40, { font: 'Montserrat', weight: 700, fill: '#ffffff', lh: 1, spacing: 80 }),
  ],
]
const QANDA = storyKit('sn-st-qanda', 'Q&Aコーナー 質問に答える', ['ストーリー', 'Q&A', '質問', 'よくある質問', 'インタビュー'], sqFrames.map((_, i) => (i > 0 && i < 9 && i % 2 === 0 ? '#fff1e6' : '#2d1b4e')), sqFrames, (i) => !(i > 0 && i < 9 && i % 2 === 0), SQ)

export const SNS_SETS: Template[] = [HOWTO, BEFORE_AFTER, RANKING, NEWITEM, EVENT, JOBS, RECIPE, TRAVEL, BAKERY, QANDA]
