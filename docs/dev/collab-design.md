# リアルタイム共同編集の設計

## 方針

- 同期は **Yjs**(MIT)。サーバーは Cloudflare **Durable Object**(SQLite 版。無料プランで使える)を 1 部屋 = 1 オブジェクトで使う。
- 各参加者は自分の端末にデザインのコピーを持ち(今まで通り IndexedDB / クラウドに保存)、変更だけを部屋で交換する。部屋が消えても手元のコピーは残る。
- 同期の単位は **オブジェクト 1 個**(文字・図形・画像)。同じオブジェクトを同時に変えたら後の方が勝つ。
- 取り消し(⌘Z)は共同編集中は `Y.UndoManager` に切り替え、**自分の操作だけ**を取り消す。
- 部屋は推測できない ID(128 bit 以上の乱数)そのものが鍵。リンクを知っている人は誰でも編集できる。
- ローカル版(`npm run agent`)では使えない(ボタンを出さない)。Cloudflare 版と公開デモで使える。

## Y.Doc の形

```
meta:  Y.Map  { name: string, width: number, height: number, print?: string(JSON) }
pages: Y.Array<Y.Map>  各ページ:
  id:    string
  top:   string   … page.json から objects を除いたもの(背景・animation など)の JSON
  objs:  Y.Map<string, string>   … オブジェクト id → オブジェクトの JSON 文字列
  order: string   … オブジェクト id の並び(JSON 配列)。後勝ち
```

読み出し(Y → PageData.json): `order` の順に `objs` から取り出す。`objs` にあって `order` に無い id は末尾に id 順で足す。`order` にあって `objs` に無い id は飛ばす(同時追加で順序が片方消えても物は消えない)。

オブジェクトに `id` が無い場合は書き込む前に付ける(`uid()`)。グループの子は親の JSON に含める(子は個別に同期しない)。

## 端末側(src/collab/)

- `session.ts` … `CollabSession`。WebSocket(y-protocols の sync / awareness、メッセージ型 0 = sync, 1 = awareness)で部屋につなぐ。切断時は 1→2→4…最大 30 秒で再接続。状態: `connecting | online | offline`。
- `binding.ts` … DesignDoc と Y.Doc の相互反映。
  - **手元 → Y**: Editor の `persist()` の中で `binding.pushLocal(doc)` を呼ぶ。ページごとに `p.json` の参照が前回と同じなら飛ばす(WeakMap)。変わったページはオブジェクトごとに JSON 文字列を前回値と比べ、違う物だけ書く。ページの追加・削除・並べ替え、meta もここで比べる。1 回の `pushLocal` は `ydoc.transact(fn, LOCAL)` の 1 トランザクション。
  - **Y → 手元**: `pages.observeDeep` / `meta.observe` で origin が LOCAL 以外の変更を受けたら、変わったページの `PageData` を作り直し、`docRef` と画面(`setDoc`)を更新、サムネを作り直す。表示中のページなら `editor.applyRemote(json)` を呼ぶ。
  - 画像(`assetId` を持つオブジェクト): 書き込む前に部屋へ未アップロードなら `PUT /api/collab/:room/assets/:assetId` で送る(送信済み id は Y の `assets: Y.Map<id, true>` で共有)。受け取った側は `assets.ts` の `getAssetURL` が手元に無い id を返せないとき、登録された取得関数で部屋から取ってきて IndexedDB に保存する(`setRemoteAssetFetcher(fn | null)` を assets.ts に足す)。
- `presence` … awareness に `{ user: { name, color }, page: pageId, cursor: {x, y} | null, sel: string[] }`。カーソルは最大 10 回/秒に間引く。表示は Editor のキャンバスの上の絶対配置レイヤー(ページ座標 → 画面座標は `canvas.viewportTransform`)。同じページにいる人のカーソル(名前付き)と、選択中のオブジェクトの枠を色付きで描く。上部バーに参加者の丸アイコン。
- 名前は初回に聞いて localStorage(`irodori-collab-name`)に保存。色は名前から決める。

## editor/core.ts に足すもの

- `applyRemote(json)`: 表示中のページにオブジェクト単位で反映する(enqueue の中で)。
  - id ごとに比べ、変わった物は `util.enlivenObjects` で作り直して同じ位置に差し替え、消えた物は削除、増えた物は追加、最後に順番を揃える。背景など `top` の変化は canvas に直接設定。
  - **自分が文字を編集中のオブジェクトや、ドラッグ中のオブジェクトは差し替えない**(保留して、操作が終わったら最新の Y の状態で反映し直す)。選択中の他のオブジェクトは選択を保つ。
  - 反映中は `restoring = true`(commit・changeListeners を出さない = 送り返さない)。履歴は積まない。
  - 画像は `resolveAssets` を通す。フォントは `ensureFonts`。
- `setUndoHandler(h: { undo(): void; redo(): void; canUndo(): boolean; canRedo(): boolean } | null)`: あれば `undo/redo/canUndo/canRedo` がそちらを使う。
- 共同編集中は文字入力中の変化も届けたい: `text:changed` で 300ms 間引きして changeListeners を呼ぶオプション(`liveText = true`)。

## サーバー(worker/collab.ts)

- `POST /api/collab` → 部屋を作る。本文: なし。返り値 `{ room }`(base64url 22 文字以上)。IP ごとの回数制限(新しい RateLimit バインディング `COLLAB_LIMIT`。無ければ素通し)。DO に `init` を送って「作成済み」を記録。
- `GET /api/collab/:room/ws`(Upgrade: websocket)→ DO へ。作成されていない部屋は 404。
- `PUT /api/collab/:room/assets/:assetId` / `GET 同`: R2 の `collab/<room>/<assetId>` に保存・配信。1 件 15MB まで、1 部屋 300MB / 500 件まで。Content-Type は image/* と(後で使う)video/mp4, video/webm, audio/mpeg, audio/ogg, audio/wav のみ。配信時は `X-Content-Type-Options: nosniff`、`Cache-Control: private, max-age=31536000, immutable`。
- Durable Object `CollabRoom`:
  - WebSocket Hibernation API(`ctx.acceptWebSocket`, `webSocketMessage`, `webSocketClose`)。同時接続 20 まで。1 メッセージ 2MB まで。
  - Y.Doc はメモリに持ち、起きたときに storage から復元。sync step1/step2/update を y-protocols で処理し、update は他の接続へ中継。awareness メッセージはそのまま他の接続へ中継(サーバーは状態を持たない。切断時は、その接続が最後に送った awareness の clientID を「消えた」として通知)。
  - 保存: 変更があったら alarm を 2 秒後に設定し、alarm で `Y.encodeStateAsUpdate` を 1MB ごとに分けて storage に書く(SQLite 版 DO の値の上限 2MB 対策)。文書が 20MB を超える更新は拒否して、その接続にエラーを送る。
  - 期限: 最後の活動から 30 日で部屋を消す(alarm で確認し `storage.deleteAll()` と R2 の `collab/<room>/` を削除)。
- DEMO=1 でも使える(デモの唯一のサーバー保存)。上限と期限で濫用を抑える。

## 画面

- 共有ボタンのメニューに「共同編集を始める」: 部屋を作り、今のデザインを Y に流し込み、`doc.collab = { room }` を保存してリンク `<origin>/#/c/<room>` をコピー。
- `#/c/<room>` を開いた人: 部屋につないで同期を待ち、Y からデザインを組み立てて手元に `id = 'c-' + room` で保存し、エディタを開く。
- `doc.collab` のあるデザインを開いたら自動で接続。上部に状態(接続中・オフライン)と参加者。メニューに「共同編集をやめる(このデザインを切り離す)」。

## 確認

- `wrangler dev --local`(launch.json の irodori-full, :8790)で 2 つのタブを開き、片方で図形を動かす・文字を打つ・画像を置く・ページを足す → もう片方に数秒以内に反映。カーソルと選択枠が見える。⌘Z は自分の操作だけ戻る。片方を再読込しても内容が残る。サーバーを止めて再開 → 再接続して追いつく。
