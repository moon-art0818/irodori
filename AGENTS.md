# irodori — AI エージェント向け説明書 / Guide for AI agents

**English summary.** irodori is a browser-based design tool (Canva-like). A local server (`agent/server.mjs`) serves the UI and watches a `designs/` folder; each `<id>.json` is one design (fabric 7 `toObject()` format per page). An agent can either (a) edit those JSON files directly, or (b) use the MCP server `agent/mcp.mjs` (stdio) which offers tools such as `create_design`, `add_text`, `add_shape`, `add_image`, `export_design`. Rendering/export, template listing and size presets are done by the browser tab that has irodori open (the server relays; no tab open = HTTP 503). The agent cannot generate images; it can place existing images, text and shapes, and apply templates.

---

## できること / できないこと

できること(確認済み: scripts/test-mcp.mjs で通し実行):
- デザインの作成、文字(横書き・縦書き)・図形・画像の追加、既存オブジェクトの部分更新・削除、背景色、ページ追加
- テンプレの一覧と適用、サイズのプリセット一覧
- PNG / JPEG / SVG / PDF への書き出し(ブラウザで irodori を開いている間のみ)

できないこと・注意:
- **画像の生成はできません**(AI 画像生成の機能は無い)。写真やイラストは、ローカルのファイルか https の画像 URL を `add_image` で置きます。
- 描画はブラウザが行います。書き出し・テンプレ適用・サイズ一覧は、`http://127.0.0.1:4600` をブラウザで開いたままにしてください。開いていないと 503 になります。
- 見た目の良し悪しは、書き出した画像を自分で見て確かめてください。JSON を書いただけでは配置のずれや文字のはみ出しは分かりません。
- 文字が収まるかは自動で調整されません。`width` と `fontSize` から行数を見積もってください(Textbox は幅で折り返し、高さは自動)。

## 準備

```bash
npm install
npm run build                                     # 画面(dist/)を作る(初回・src 更新後)
node agent/server.mjs --designs ./designs --port 4600
# ブラウザで http://127.0.0.1:4600 を開く
```

## 方式 A: JSON を直接編集する

`designs/<id>.json` がデザイン。id はファイル名(日本語可、`/` と `..` 不可)。画面はファイルの変更を即反映します。**途中で壊れた JSON を残さないよう、一時ファイルに書いてから rename してください。** 壊れていると一覧に「読み込めません」と出ます。

```json
{
  "name": "チラシ",
  "width": 1080,
  "height": 1080,
  "pages": [
    { "json": { "background": "#fff7ed", "objects": [ /* 下の例 */ ] } }
  ]
}
```

- `id` / `pages[].id` / `createdAt` は省略可(サーバーが補う)。`updatedAt` はファイルの更新時刻で、書かなくてよい。
- `print: { "mmW": 210, "mmH": 297 }` を付けると PDF が mm 指定になる(印刷物)。
- 座標・大きさは px、**原点は左上**、基準点は各オブジェクトの左上(`originX/Y` は left/top が既定)。`objects` は先頭が一番後ろ、末尾が一番手前。

### よく使うオブジェクト

```json
{ "type": "Textbox", "text": "冬の大感謝祭", "left": 80, "top": 100, "width": 920,
  "fontSize": 120, "fontWeight": 900, "fontFamily": "Zen Maru Gothic", "fill": "#ffffff", "textAlign": "center" }

{ "type": "Rect", "left": 0, "top": 0, "width": 1080, "height": 320, "fill": "#ea580c", "rx": 0, "ry": 0 }

{ "type": "Circle", "left": 440, "top": 760, "radius": 100, "fill": "#fdba74" }

{ "type": "Ellipse", "left": 50, "top": 400, "rx": 150, "ry": 75, "fill": "#cbd5e1" }

{ "type": "Line", "x1": 0, "y1": 0, "x2": 600, "y2": 0, "left": 120, "top": 820, "width": 600, "height": 0,
  "stroke": "#7c2d12", "strokeWidth": 6 }

{ "type": "Image", "assetId": "photo.png", "left": 50, "top": 50, "width": 1080, "height": 1080, "scaleX": 0.28, "scaleY": 0.28 }

{ "type": "VText", "text": "縦書きの文字\n二行目です", "fontFamily": "Noto Serif JP", "fontSize": 56,
  "fontWeight": 400, "maxChars": 8, "lineHeight": 1.6, "charSpacing": 0.05, "fill": "#7c2d12", "left": 800, "top": 420 }
```

- **画像**: ファイルを `designs/assets/<ファイル名>` に置き、`assetId` にそのファイル名を書く。`width`/`height` に元画像の大きさ、`scaleX/Y` に拡大率を書くと確実(表示幅 = 元の幅 × scale)。
- **縦書き `VText`**: 列は右から左へ。`\n` で次の列、`maxChars` 文字で折り返す。`left/top` は左上。半角数字 1〜2 桁は縦中横になる。
- **背景**: `pages[i].json.background` に色文字列。
- 上の `Ellipse`・`Line` は MCP の `add_shape` が書き出す形で、PNG 出力で描画されることを確認済み。その他の fabric プロパティ(`opacity`、`angle`、`shadow` など)は fabric 7 の `toObject()` 形式に従うはずですが、**UNVERIFIED**(個別には試していません)。

### 使えるフォント

`src/data/fonts.ts` にあるものだけが画面で正しく表示されます(すべて Google Fonts / OFL)。MCP の `list_fonts` でも取れます。代表例:

- ゴシック: `Noto Sans JP`(既定)、`M PLUS Rounded 1c`、`Zen Maru Gothic`、`Zen Kaku Gothic New`、`BIZ UDPGothic`、`LINE Seed JP`
- 明朝: `Noto Serif JP`(縦書きの既定)、`Shippori Mincho`、`BIZ UDPMincho`、`Zen Old Mincho`
- 見出し・装飾: `Dela Gothic One`(極太)、`Mochiy Pop One`、`RocknRoll One`、`Potta One`、`Yusei Magic`(手書き)
- 欧文: `Montserrat`、`Playfair Display`、`Bebas Neue`、`Poppins`、`Inter`、`Pacifico`

`fontWeight` は各フォントが持つ太さ(多くは 400 / 700 / 900。1 つしかないものは 400 のみ)を使ってください。

### テンプレ・サイズ・書き出し(ブラウザ経由)

サーバーの `POST /local/bridge` に JSON を送ります(ブラウザが開いている必要あり)。

```bash
curl -s localhost:4600/local/bridge -d '{"action":"sizes"}'
curl -s localhost:4600/local/bridge -d '{"action":"templates","query":"セール"}'
curl -s localhost:4600/local/bridge -d '{"action":"template","id":"flyer","templateId":"ig-sale","mode":"append"}'   # mode: replace | append
curl -s localhost:4600/local/bridge -d '{"action":"render","id":"flyer","format":"png","page":1,"scale":1}'          # → {"file": ".../designs/exports/..."}
```

`format` は png / jpeg / svg / pdf(pdf は全ページ)。`page` は 1 始まり、`scale` は 0.1〜3。書き出しは `designs/exports/` に保存されます。

## 方式 B: MCP サーバー(`agent/mcp.mjs`)

JSON を手で書かずに、道具として呼べます。環境変数:

| 変数 | 既定 | 意味 |
|---|---|---|
| `IRODORI_DESIGNS` | `./designs`(起動したフォルダ基準) | デザインのフォルダ。**server.mjs と同じ場所にすること** |
| `IRODORI_URL` | `http://127.0.0.1:4600` | server.mjs の URL(描画・テンプレ・サイズ用) |

ツール: `get_requests` / `update_request` / `check_design` / `list_designs` / `get_design` / `create_design` / `list_sizes` / `list_templates` / `apply_template` / `add_text`(`vertical: true` で縦書き)/ `add_shape`(rect・roundrect・circle・ellipse・line)/ `add_image`(パスか https URL。15MB まで・画像のみ)/ `update_object` / `delete_object` / `set_background` / `add_page` / `export_design` / `list_fonts`。ページ番号は 1 始まり、オブジェクト番号は 0 始まり(`get_design` で確認)。

先に server.mjs を起動してブラウザで開いてから、各エージェントに登録します。パスは自分の環境の絶対パスに置き換えてください(以下 `/path/to/irodori`)。

### Claude Code

```bash
claude mcp add --transport stdio --env IRODORI_DESIGNS=/path/to/irodori/designs irodori -- node /path/to/irodori/agent/mcp.mjs
```

オプションはサーバー名の前、`--` の後ろが実行コマンド(公式ドキュメントの形式。Claude Code のバージョンによって `--env` の位置で失敗する報告があるため、`--transport` など別のオプションを前に置く)。

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json`(Windows は `%APPDATA%\Claude\claude_desktop_config.json`)に追記して、Claude Desktop を完全に終了して再起動:

```json
{
  "mcpServers": {
    "irodori": {
      "command": "node",
      "args": ["/path/to/irodori/agent/mcp.mjs"],
      "env": { "IRODORI_DESIGNS": "/path/to/irodori/designs" }
    }
  }
}
```

(`command` / `args` / `mcpServers` の形は公式ドキュメントで確認。`env` キーの記述例も公式のトラブルシュートにある。)

### Cursor

プロジェクトの `.cursor/mcp.json` か、全体用の `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "irodori": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/irodori/agent/mcp.mjs"],
      "env": { "IRODORI_DESIGNS": "/path/to/irodori/designs" }
    }
  }
}
```

### 確認状況

- 上の 3 つの設定形式は公式ドキュメントの記述を読んで写したもので、**実際に各アプリへ登録して動かしてはいません(UNVERIFIED)**。
- `agent/mcp.mjs` 自体は、MCP SDK のクライアント(`scripts/test-mcp.mjs`、`npm run test:mcp`)で通し確認済み。
- Windows のパス・`node` の PATH(特に非対話シェルで nvm の node が見つからない場合は `command` に node の絶対パスを書く)は環境ごとに確認してください。

## 人と AI の分担(人の手間を最小にする進め方)

irodori には「AI への依頼」の受付表があります(画面の「AI エージェント連携」や、エディタ上部の「AI に依頼」)。人がやるのは **①依頼を一言書く ②事実の確認 ③採用/やり直し** だけで、それ以外は AI が担います。

AI は次の順で進めてください(MCP の道具名):

1. `get_requests` で未処理の依頼(待機中・やり直し)を取る。
2. 1件ずつ `update_request(id, "working")` にしてから作業する。
3. 新規なら `list_sizes` / `list_templates` で近いものを選び、`create_design` か `apply_template`(複数ページのテンプレは `mode: "append-all"` で全ページ)。既存の修正なら `get_design` で現状を把握してから `update_object` などで必要な所だけ変える。
4. **`check_design` を実行し、指摘をすべて直す**(はみ出し・ページ外・コントラスト・小さすぎる文字・余白・解像度・フォント数)。直したらもう一度実行して 0 件にする。
5. `export_design` で確認用の画像を書き出し、自分で見て崩れがないか確かめる。
6. `update_request(id, "review", note, designId)`。note には「何をしたか」と「**人に確認してほしい事実**(価格・日付・社名・連絡先など、AI が推測した箇所)」を必ず書く。
7. 人が「やり直し」にした依頼は、`get_requests` に指示付きで戻ってくる。同じ手順で直す。

決まり:
- **人の確認なしに完了(done)にしない。** 完了にできるのは人だけです。ローカルサーバーも、画面(人)以外からの「完了」「やり直し」への変更は 403 で拒否します。`requests.json` を直接書き換えて回避しないでください。
- 事実(価格・日時・固有名詞)を推測で埋めたら、必ず note で人に確認を求める。
- 画像の生成はできません。写真が必要なら、人が用意した素材(designs/assets/)を使うか、写真フレームを置いて note で依頼する。

任せきりにする例(Claude Code):

```
/loop 5m irodori の依頼を処理して。get_requests → working → 作業 → check_design を 0 件に → export_design → review(note に確認してほしい事実)。依頼が無ければ待つ。
```

## 作業のコツ

1. `get_design` か JSON を読んで現状を把握 → 変更 → 書き出した画像を見て確認、の順で進める。
2. 文字は背景とのコントラストを確保し、幅(`width`)を指定してはみ出しを防ぐ。日本語の見出しは 1 文字 ≒ `fontSize` px 幅で見積もる。
3. SNS 用途は `list_sizes` のプリセットを使うとサイズ間違いがない。
4. 既存デザインを直すときは、他の部分を消さないよう `update_object` で必要な項目だけ変える。
