// 装飾素材: フレーム・吹き出し・リボン・バッジ・矢印・区切り線など 40 種 × 6 色 = 240 点
import { wrap, r, type GraphicItem } from './types'
import { ACCENTS } from './palettes'

type D = { w: number; h: number; body: (c: string) => string; label: string; sub: string }
const W = '#ffffff'
const st = (c: string, sw: number, extra = '') => `fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" ${extra}`
const poly = (pts: [number, number][]) => pts.map((p) => `${r(p[0])} ${r(p[1])}`).join(' ')
const starPts = (cx: number, cy: number, ro: number, ri: number, n: number, rot = -90) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const rad = i % 2 ? ri : ro, a = ((rot + (180 / n) * i) * Math.PI) / 180
    return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)] as [number, number]
  })
const heart = 'M50 90 C20 68 4 52 4 32 C4 16 16 6 30 6 C39 6 46 11 50 18 C54 11 61 6 70 6 C84 6 96 16 96 32 C96 52 80 68 50 90 Z'

const DESIGNS: Record<string, D> = {
  frameRound: { w: 100, h: 100, label: '角丸フレーム', sub: 'frame', body: (c) => `<rect x="4" y="4" width="92" height="92" rx="12" ${st(c, 4)}/>` },
  frameDouble: { w: 100, h: 100, label: '二重線フレーム', sub: 'frame', body: (c) => `<rect x="3" y="3" width="94" height="94" ${st(c, 3)}/><rect x="10" y="10" width="80" height="80" ${st(c, 1.5)}/>` },
  frameCorners: { w: 100, h: 100, label: 'コーナーフレーム', sub: 'frame', body: (c) => `<path d="M4 28V4H28M72 4H96V28M96 72V96H72M28 96H4V72" ${st(c, 5)}/>` },
  frameDashed: { w: 100, h: 100, label: '点線フレーム', sub: 'frame', body: (c) => `<rect x="4" y="4" width="92" height="92" rx="6" ${st(c, 3, 'stroke-dasharray="2 7"')}/>` },
  frameArch: { w: 100, h: 120, label: 'アーチフレーム', sub: 'frame', body: (c) => `<path d="M6 116V50A44 44 0 0 1 94 50V116Z" ${st(c, 4)}/>` },
  polaroid: { w: 100, h: 120, label: 'ポラロイド', sub: 'frame', body: (c) => `<rect x="2" y="2" width="96" height="116" rx="3" fill="${W}" stroke="#d1d5db" stroke-width="2"/><rect x="10" y="10" width="80" height="80" fill="${c}" fill-opacity="0.35"/>` },
  ticket: { w: 160, h: 90, label: 'チケット', sub: 'label', body: (c) => `<path d="M8 4H152A4 4 0 0 1 156 8V34A11 11 0 0 0 156 56V82A4 4 0 0 1 152 86H8A4 4 0 0 1 4 82V56A11 11 0 0 0 4 34V8A4 4 0 0 1 8 4Z" fill="${c}"/><path d="M110 10V80" ${st(W, 2, 'stroke-dasharray="3 5"')}/>` },
  tag: { w: 140, h: 80, label: 'タグ', sub: 'label', body: (c) => `<path d="M34 4H136V76H34L4 40Z" fill="${c}"/><circle cx="34" cy="40" r="7" fill="${W}"/>` },
  saleTag: { w: 100, h: 130, label: 'ぶら下げタグ', sub: 'label', body: (c) => `<path d="M30 4H70L94 30V124H6V30Z" fill="${c}"/><circle cx="50" cy="28" r="7" fill="${W}"/><path d="M50 21V4" ${st(c, 3)}/>` },
  ribbon: { w: 200, h: 80, label: 'リボン', sub: 'ribbon', body: (c) => `<path d="M0 20H44V70H0L16 45Z" fill="${c}" fill-opacity="0.6"/><path d="M200 20H156V70H200L184 45Z" fill="${c}" fill-opacity="0.6"/><path d="M30 5H170V55H30Z" fill="${c}"/><path d="M30 55L44 70V55Z M170 55L156 70V55Z" fill="${c}" fill-opacity="0.35"/>` },
  pennant: { w: 100, h: 60, label: 'フラッグ', sub: 'ribbon', body: (c) => `<path d="M0 0H100L84 30L100 60H0Z" fill="${c}"/>` },
  bookmark: { w: 50, h: 100, label: 'しおり', sub: 'ribbon', body: (c) => `<path d="M0 0H50V100L25 78L0 100Z" fill="${c}"/>` },
  cornerRibbon: { w: 100, h: 100, label: 'コーナーリボン', sub: 'ribbon', body: (c) => `<path d="M0 0H62L0 62Z" fill="${c}"/>` },
  washi: { w: 140, h: 44, label: 'マスキングテープ', sub: 'ribbon', body: (c) => `<path d="M6 0L0 5.5L6 11L0 16.5L6 22L0 27.5L6 33L0 38.5L6 44H134L140 38.5L134 33L140 27.5L134 22L140 16.5L134 11L140 5.5L134 0Z" fill="${c}" fill-opacity="0.65"/>` },
  bubbleRound: { w: 120, h: 100, label: '丸い吹き出し', sub: 'bubble', body: (c) => `<path d="M60 4C92 4 116 22 116 46C116 70 92 88 60 88C54 88 48 87 43 86L18 98L24 76C12 68 4 58 4 46C4 22 28 4 60 4Z" fill="${c}"/>` },
  bubbleRect: { w: 120, h: 100, label: '四角い吹き出し', sub: 'bubble', body: (c) => `<path d="M14 4H106A10 10 0 0 1 116 14V64A10 10 0 0 1 106 74H52L30 96V74H14A10 10 0 0 1 4 64V14A10 10 0 0 1 14 4Z" fill="${c}"/>` },
  bubbleOutline: { w: 120, h: 100, label: '線の吹き出し', sub: 'bubble', body: (c) => `<path d="M60 6C92 6 114 22 114 44C114 66 92 82 60 82C54 82 48 81 43 80L20 94L25 73C12 66 6 56 6 44C6 22 28 6 60 6Z" ${st(c, 4)}/>` },
  bubbleShout: { w: 120, h: 100, label: 'ギザギザ吹き出し', sub: 'bubble', body: (c) => `<polygon points="${poly(starPts(60, 50, 56, 36, 14, -90).map(([x, y]) => [x, y * 0.9 + 5] as [number, number]))}" fill="${c}"/>` },
  bubbleCloud: { w: 130, h: 100, label: 'もくもく吹き出し', sub: 'bubble', body: (c) => `<g fill="${c}"><circle cx="40" cy="42" r="26"/><circle cx="70" cy="30" r="26"/><circle cx="96" cy="46" r="24"/><circle cx="66" cy="56" r="26"/><circle cx="30" cy="80" r="7"/><circle cx="14" cy="92" r="4"/></g>` },
  scallop: { w: 100, h: 100, label: 'ギザ丸バッジ', sub: 'badge', body: (c) => `<g fill="${c}">${Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return `<circle cx="${r(50 + 38 * Math.cos(a))}" cy="${r(50 + 38 * Math.sin(a))}" r="12"/>` }).join('')}<circle cx="50" cy="50" r="38"/></g><circle cx="50" cy="50" r="30" ${st(W, 2)}/>` },
  sealStar: { w: 100, h: 100, label: 'スターバースト', sub: 'badge', body: (c) => `<polygon points="${poly(starPts(50, 50, 48, 38, 20))}" fill="${c}"/><circle cx="50" cy="50" r="30" ${st(W, 2)}/>` },
  sealRing: { w: 100, h: 100, label: '二重リングのスタンプ', sub: 'badge', body: (c) => `<circle cx="50" cy="50" r="46" ${st(c, 4)}/><circle cx="50" cy="50" r="38" ${st(c, 1.5)}/><polygon points="${poly(starPts(50, 50, 16, 7, 5))}" fill="${c}"/>` },
  stampRough: { w: 100, h: 100, label: 'かすれ丸スタンプ', sub: 'badge', body: (c) => `<circle cx="50" cy="50" r="44" ${st(c, 5, 'stroke-dasharray="40 6 18 5 60 7"')}/><circle cx="50" cy="50" r="34" ${st(c, 2, 'stroke-dasharray="3 4"')}/>` },
  sticker: { w: 100, h: 100, label: '丸ステッカー', sub: 'badge', body: (c) => `<circle cx="50" cy="50" r="46" fill="${W}" stroke="${c}" stroke-width="6"/><circle cx="50" cy="50" r="34" fill="${c}" fill-opacity="0.25"/>` },
  checkCircle: { w: 100, h: 100, label: 'チェックマーク', sub: 'badge', body: (c) => `<circle cx="50" cy="50" r="46" fill="${c}"/><path d="M28 52L44 67L73 34" ${st(W, 9)}/>` },
  heartOutline: { w: 100, h: 96, label: 'ハート(線)', sub: 'badge', body: (c) => `<path d="${heart}" ${st(c, 5)}/>` },
  stars5: { w: 200, h: 40, label: '星 5 つ', sub: 'badge', body: (c) => Array.from({ length: 5 }, (_, i) => `<polygon points="${poly(starPts(20 + i * 40, 21, 18, 8, 5))}" fill="${c}"/>`).join('') },
  arrowCurve: { w: 120, h: 80, label: 'カーブ矢印', sub: 'arrow', body: (c) => `<path d="M8 70C28 8 88 6 104 44" ${st(c, 5)}/><path d="M88 46L106 48L110 28" ${st(c, 5)}/>` },
  arrowLoop: { w: 130, h: 70, label: 'くるっと矢印', sub: 'arrow', body: (c) => `<path d="M6 54C40 54 52 12 32 12C12 14 40 58 112 36" ${st(c, 4.5)}/><path d="M96 24L114 35L98 50" ${st(c, 4.5)}/>` },
  arrowBlock: { w: 120, h: 70, label: '太い矢印', sub: 'arrow', body: (c) => `<path d="M0 22H74V2L118 35L74 68V48H0Z" fill="${c}"/>` },
  arrowBoth: { w: 140, h: 40, label: '両矢印', sub: 'arrow', body: (c) => `<path d="M12 20H128M30 6L10 20L30 34M110 6L130 20L110 34" ${st(c, 5)}/>` },
  arrowDown: { w: 60, h: 110, label: '下向き矢印', sub: 'arrow', body: (c) => `<path d="M30 6V100M8 78L30 102L52 78" ${st(c, 6)}/>` },
  underlineBrush: { w: 200, h: 26, label: 'ふで線', sub: 'line', body: (c) => `<path d="M4 15Q50 4 100 11T196 9L196 15Q140 23 100 18T4 21Z" fill="${c}"/>` },
  underlineWavy: { w: 200, h: 24, label: '波線', sub: 'line', body: (c) => `<path d="M4 12q8.3 -10 16.6 0t16.6 0t16.6 0t16.6 0t16.6 0t16.6 0t16.6 0t16.6 0t16.6 0t16.6 0t16.6 0t16.6 0" ${st(c, 4)}/>` },
  dividerDiamond: { w: 200, h: 24, label: 'ひし形の区切り', sub: 'line', body: (c) => `<path d="M4 12H84M116 12H196" ${st(c, 2)}/><polygon points="100 2 110 12 100 22 90 12" fill="${c}"/>` },
  dividerDots: { w: 200, h: 14, label: 'ドットの区切り', sub: 'line', body: (c) => Array.from({ length: 9 }, (_, i) => `<circle cx="${12 + i * 22}" cy="7" r="${i === 4 ? 6 : 3.5}" fill="${c}"/>`).join('') },
  squiggle: { w: 120, h: 50, label: 'うねうね線', sub: 'line', body: (c) => `<path d="M6 25q10 -24 20 0t20 0t20 0t20 0t20 0" ${st(c, 5)}/>` },
  bracketCurly: { w: 50, h: 100, label: '波かっこ', sub: 'line', body: (c) => `<path d="M38 4C22 4 26 20 26 34C26 44 20 50 8 50C20 50 26 56 26 66C26 80 22 96 38 96" ${st(c, 4.5)}/>` },
  flourish: { w: 100, h: 100, label: 'コーナー飾り', sub: 'line', body: (c) => `<path d="M6 94V40C6 20 20 6 40 6H94M6 70C6 46 22 30 46 30M30 6C30 26 26 30 6 30" ${st(c, 3.5)}/>` },
  highlight: { w: 120, h: 80, label: '手描きの丸囲み', sub: 'line', body: (c) => `<path d="M26 40C20 14 66 6 96 14C122 22 114 62 74 72C42 80 8 68 14 36" ${st(c, 4)}/>` },
  sparkle: { w: 100, h: 100, label: 'キラキラ', sub: 'deco', body: (c) => `<path d="M50 0Q54 46 100 50Q54 54 50 100Q46 54 0 50Q46 46 50 0Z" fill="${c}"/>` },
  sparkles3: { w: 130, h: 110, label: 'キラキラ 3 つ', sub: 'deco', body: (c) => `<path d="M42 0Q46 38 84 42Q46 46 42 84Q38 46 0 42Q38 38 42 0Z" fill="${c}"/><path d="M100 54Q102 72 120 74Q102 76 100 94Q98 76 80 74Q98 72 100 54Z" fill="${c}"/><path d="M104 4Q105 14 115 15Q105 16 104 26Q103 16 93 15Q103 14 104 4Z" fill="${c}"/>` },
  confetti: { w: 120, h: 120, label: '紙吹雪', sub: 'deco', body: (c) => `<g fill="${c}"><rect x="10" y="14" width="14" height="6" rx="1" transform="rotate(30 17 17)"/><rect x="70" y="8" width="14" height="6" rx="1" transform="rotate(-40 77 11)"/><rect x="92" y="52" width="14" height="6" rx="1" transform="rotate(70 99 55)"/><rect x="24" y="68" width="14" height="6" rx="1" transform="rotate(-20 31 71)"/><rect x="58" y="96" width="14" height="6" rx="1" transform="rotate(50 65 99)"/><circle cx="50" cy="30" r="5"/><circle cx="102" cy="100" r="5"/><circle cx="14" cy="104" r="4"/><circle cx="82" cy="78" r="4"/></g><g fill="${c}" fill-opacity="0.45"><circle cx="30" cy="48" r="4"/><circle cx="104" cy="22" r="4"/><rect x="46" y="62" width="12" height="5" rx="1" transform="rotate(-60 52 64)"/></g>` },
}

export function decorItems(): GraphicItem[] {
  const out: GraphicItem[] = []
  for (const [key, d] of Object.entries(DESIGNS)) {
    for (const a of ACCENTS) {
      out.push({
        id: `decor-${key}-${a.id}`, label: `${d.label}(${a.label})`, group: 'decor', sub: d.sub, bg: false,
        svg: () => wrap(d.w, d.h, d.body(a.c)),
      })
    }
  }
  return out
}

export const DECOR_SUBS: [string, string][] = [['frame', 'フレーム'], ['label', 'ラベル'], ['ribbon', 'リボン'], ['bubble', '吹き出し'], ['badge', 'バッジ'], ['arrow', '矢印'], ['line', '線・飾り'], ['deco', 'キラキラ']]
