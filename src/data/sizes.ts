export interface SizePreset { id: string; label: string; group: string; w: number; h: number; print?: { mmW: number; mmH: number } }

// 印刷物は 150dpi 相当のピクセル数(PDF は mm 指定で出力)
const mm = (v: number) => Math.round((v / 25.4) * 150)
const P = (id: string, label: string, mmW: number, mmH: number): SizePreset => ({ id, label, group: '印刷', w: mm(mmW), h: mm(mmH), print: { mmW, mmH } })

export const SIZES: SizePreset[] = [
  { id: 'ig-post', label: 'Instagram 投稿(正方形)', group: 'SNS', w: 1080, h: 1080 },
  { id: 'ig-portrait', label: 'Instagram 投稿(縦)', group: 'SNS', w: 1080, h: 1350 },
  { id: 'ig-story', label: 'ストーリー / リール', group: 'SNS', w: 1080, h: 1920 },
  { id: 'x-post', label: 'X(Twitter)投稿', group: 'SNS', w: 1600, h: 900 },
  { id: 'x-header', label: 'X ヘッダー', group: 'SNS', w: 1500, h: 500 },
  { id: 'fb-post', label: 'Facebook 投稿', group: 'SNS', w: 1200, h: 630 },
  { id: 'yt-thumb', label: 'YouTube サムネイル', group: 'SNS', w: 1280, h: 720 },
  { id: 'yt-banner', label: 'YouTube チャンネルアート', group: 'SNS', w: 2560, h: 1440 },
  { id: 'line-rich', label: 'LINE リッチメニュー(大)', group: 'SNS', w: 2500, h: 1686 },
  { id: 'line-card', label: 'LINE カードメッセージ', group: 'SNS', w: 1040, h: 1040 },
  { id: 'tiktok', label: 'TikTok 動画カバー', group: 'SNS', w: 1080, h: 1920 },
  { id: 'slide-169', label: 'プレゼン(16:9)', group: 'スライド', w: 1920, h: 1080 },
  { id: 'slide-43', label: 'プレゼン(4:3)', group: 'スライド', w: 1440, h: 1080 },
  P('a4-flyer', 'チラシ A4(縦)', 210, 297),
  P('a4-land', 'チラシ A4(横)', 297, 210),
  P('a3-poster', 'ポスター A3', 297, 420),
  P('b5', 'B5', 182, 257),
  P('card', '名刺(91×55mm)', 91, 55),
  P('postcard', 'はがき', 100, 148),
  { id: 'ogp', label: 'OGP / ブログアイキャッチ', group: 'Web', w: 1200, h: 630 },
  { id: 'hero', label: 'LP ヒーロー画像', group: 'Web', w: 1920, h: 1080 },
  { id: 'banner-rect', label: 'バナー(300×250)', group: 'Web', w: 300, h: 250 },
  { id: 'banner-lead', label: 'バナー(728×90)', group: 'Web', w: 728, h: 90 },
  { id: 'logo', label: 'ロゴ', group: 'Web', w: 500, h: 500 },
  { id: 'icon', label: 'アイコン・プロフィール画像', group: 'Web', w: 800, h: 800 },
]
