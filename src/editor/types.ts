export interface PageData {
  id: string
  /** fabric の canvas.toObject() の結果(画像は assetId 参照) */
  json: any
}
export interface DesignDoc {
  id: string
  name: string
  width: number
  height: number
  /** 印刷物は mm 指定。PDF のページサイズに使う */
  print?: { mmW: number; mmH: number }
  pages: PageData[]
  thumb?: string
  updatedAt: number
  createdAt: number
  /** HTML スライド(slide-studio 形式)のときだけ持つ。あれば pages は使わない */
  deck?: DeckData
  /** BGM(デザインに 1 本)。音源は素材庫の assetId。共同編集では共有されない */
  audio?: DesignAudio
  /** 共同編集の部屋。あればエディタを開いたときに自動で接続する */
  collab?: { room: string }
}

/** slide-studio の deck.json と同じ形 + メモ */
export interface DeckSlide { id: string; chapter?: string; layout: string; html: string; notes?: string }
export interface DeckMemo { id: string; slideId: string | null; text: string; author: string; at: string }
export interface DeckData { title: string; subtitle?: string; brand?: string; slides: DeckSlide[]; memos?: DeckMemo[] }

/** ページ単位のアニメーション設定。PageData.json.animation に保存する */
export interface PageAnimation {
  preset: string
  /** 登場にかかる秒数(省略時 1.2) */
  duration?: number
}

/** デザインの BGM */
export interface DesignAudio {
  assetId: string
  title: string
  /** 表示するクレジット(CC BY の曲は必須) */
  credit?: { author?: string; pageUrl?: string; source: string; license?: string }
  /** 音量 0〜1 */
  volume: number
  /** 曲のどこから流すか(秒) */
  start: number
  /** 冒頭のフェードイン・終わりのフェードアウト(秒) */
  fadeIn: number
  fadeOut: number
}
