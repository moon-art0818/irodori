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
