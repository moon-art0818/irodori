# 動画・音楽の設計

## 要素

- **動画オブジェクト** `Video`(`FabricImage` を継承し、要素に `HTMLVideoElement` を使う。`classRegistry` に登録)。
  - 保存する値: `assetId`(端末の素材庫に Blob として保存。上限 100MB)、`trimStart` / `trimEnd`(秒)、`loop`、`muted`、`volume`(0〜1)、`credit`。
  - 読み込み: Blob URL を `video.src` に入れ、`loadeddata` を待ってから `trimStart` に移動した状態を表示する(普段は止めておく)。
  - 再生中だけ `requestAnimationFrame` で再描画し続ける。ツールバーには再生・停止、ミュート、音量、トリミング(開始・終了)を出す。
- **BGM**: デザインに 1 本、`DesignDoc.audio?: { assetId, title, credit?, volume, start, fadeIn, fadeOut }`。左パネルの「音楽」から設定し、上部に小さなプレイヤーを出す。

## 書き出し

- PNG / JPG / PDF / SVG / PPTX: 動画は今のコマ(`trimStart` の位置)を画像として出す。
- MP4 / WebM: 実時間で録画する今の仕組み(`exportVideo`)に乗せる。各ページの頭で、そのページの動画を `trimStart` から再生する。ページの長さは「設定した秒数」と「動画の長さ」の長い方を選べるようにする。音声は `AudioContext` → `MediaStreamAudioDestinationNode` に、BGM と、ミュートしていない動画の音を混ぜ、映像のストリームにトラックとして足す。
- GIF: コマごとに `currentTime` を設定し、`seeked` を待ってから描く。
- プレゼン表示: BGM と動画を再生する。

## 素材の出典(すべて商用利用できるもの。CC BY はクレジット必須、CC BY-SA と NC は使わない)

| 種類 | 出典 | キー | 備考 |
|---|---|---|---|
| 音楽・効果音 | Openverse audio(`/v1/audio/?license_type=commercial`) | 不要 | Freesound などの配信元。`cdn.freesound.org` は CORS 可(確認済み)。BY-SA と NC は除く |
| 動画 | Wikimedia Commons(webm / ogv / mp4、CC0・PD のみ) | 不要 | `upload.wikimedia.org` |
| 動画 | Pexels Videos | サーバーに `PEXELS_API_KEY` | 既存の写真の中継を広げる(DEMO では無効) |
| 動画 | NASA | — | 動画ファイルに CORS ヘッダーが無く、ブラウザから取れない(確認済み)ので**使わない** |
| 自分の動画・音声 | アップロード | — | mp4 / webm / mov(ブラウザが再生できる物)/ mp3 / m4a / wav / ogg |

出典の素材は、`fetch` で Blob にして素材庫に保存してから使う(canvas が汚れて書き出せなくなるのを防ぐ)。CORS で取れない物は一覧から外す。

## 共同編集

動画・音声も素材として部屋にアップロードされる(1 件 15MB まで。超える物は「共同編集では共有できません」と知らせる)。
