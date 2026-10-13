# irodori

[English](README.en.md) | 日本語

**自分の AI エージェント(Claude Code / Cursor / Claude Desktop など)とつなぐと、Canva Pro 相当の作業を「AI のサブスク料の範囲」で賄える、ブラウザで動くデザインツール。**

SNS 画像・チラシ・名刺・サムネイル・スライドなどを、ブラウザ上のエディタで作れます。デザインは JSON なので、AI エージェントが文章とレイアウトを直接書き、画面に即反映されます。ログイン不要・アカウント不要で使え、データは自分の端末(またはローカルのフォルダ)に残ります。

- デモ: https://irodori.unmei-bunkiten.workers.dev (ログイン・クラウド保存は止めた公開デモ)
- ライセンス: [MIT](LICENSE)

![スクリーンショット](docs/screenshot.png)

> 注: irodori は Canva とは無関係の独立したプロジェクトです。「Canva」は Canva Pty Ltd の商標で、比較の説明のために名前を挙げているだけです。

## できること

実装を読んで確認した範囲の機能です。

**エディタ**
- 図形・テキスト・画像・アイコン・グラフ・表・QR コードを配置。グループ化、複製、配置、左右/上下反転、透明度、影、取り消し/やり直し
- テキスト: 日本語フォント(Google Fonts)、縁取り・背景色・文字間隔/行間・箇条書き、曲げ文字、**縦書き**(縦中横・約物の回転を含む自作実装)
- **テキスト効果 9 種**: なし・影・浮き上がり・中抜き・袋文字・エコー・グリッチ・ネオン・背景ハイライト(fabric の影・縁取りの組み合わせで表現。エコー/グリッチは近似表現で、ネオンは塗りが白になる)
- **重ね方(描画モード)16 種**: 通常・乗算・スクリーン・オーバーレイ・比較(暗/明)・覆い焼き・焼き込み・ハードライト・ソフトライト・差の絶対値・除外・色相・彩度・カラー・輝度
- **手描き**: ペンと半透明のマーカー。描いた線は 1 本ずつ取り消せる
- **写真グリッド・コラージュ**: 2〜9 枚の配置 21 種(丸型を含む)から選ぶと写真フレームが並ぶ。画像を選択中に追加すると枠に収まる
- 画像: トリミング、調整、角丸、フレームへのはめ込み、差し替え
- 複数ページ、サイズプリセット(SNS・スライド・印刷・Web など)、**マジックリサイズ**(別サイズへ作り直し)
- **ブランドキット(複数)**: 色・見出し/本文フォント・ロゴを名前付きで最大 10 個まで登録し、切り替えて使う。この端末の IndexedDB に保存
- **自分のフォントの取り込み**: ttf / otf / woff / woff2(1 ファイル 30MB まで)。この端末の IndexedDB に保存。利用許諾は自分で確認すること
- バージョン履歴(この端末に最大 30 件)
- アニメーション(ページ内の登場アニメ)とプレゼン表示
- **色・フォントの一括置換**: 全ページで使っている色とフォントを一覧し、まとめて別のものに置き換える
- **デザインチェック**: 品質の自動点検(空ページ、ページ外へのはみ出し、小さすぎる文字、余白不足、文字と背景のコントラスト不足、画像の拡大によるぼやけ・印刷時の低解像度、フォント数の多さ)。一部の指摘は自動修正できる。ページ JSON から見積もる簡易判定で、見た目の最終確認は人が行う

**テンプレート(すべてこのプロジェクトのオリジナル、計 140 件)**
- **1 枚もの 100 件**: Instagram 投稿(19)・Instagram 縦(6)・ストーリー(10)・YouTube サムネイル(10)・プレゼン(18)・チラシ/ポスター(10)・名刺(6)・X(5)・Web/ブログ(5)・LINE(4)・ロゴ(4)・はがき/招待状(3)
- **複数ページのセット 40 件**(1 セット 10〜11 ページ、合計 406 ページ): プレゼン 10・SNS(Instagram カルーセル 8、ストーリー 2)10・印刷物 10(会社案内、ドキュメント、メニュー、チラシ、名刺、はがき、賞状など)・Web/動画 10(YouTube サムネイル、ブログ、X、LINE、ロゴ、インフォグラフィック、バナー)
- エディタの左パネルで、複数ページのテンプレは**ページを選んで今のページに適用**するか、**全ページを追加**できる。キーワード(業種・用途)でも検索できる

**画面**
- ライト/ダークテーマ(初期値は OS の設定。選んだ値はこの端末に保存)
- **⌘K(Windows は Ctrl+K)のコマンドパレット**(cmdk): テンプレート・サイズ・自分のデザイン・操作をまとめて検索
- 操作結果の通知表示(sonner)
- 左ナビ: ホーム / テンプレート / マイデザイン / AI エージェント連携、「作成」ショートカット(Instagram・スライド・HTML スライド)
- PWA: 本番ビルドでは Service Worker が画面・スクリプト・素材を端末に保存するので、一度開いた後は**オフラインでも開ける**(サーバーとの通信が要る機能 = クラウド保存・写真検索・AI 連携などはオフラインでは使えない)

**書き出し・読み込み**
- 書き出し: PNG(透過可)・JPG・PDF(印刷サイズ指定あり)・SVG・**PowerPoint(.pptx)**・**アニメーション GIF**・動画(ブラウザが対応していれば MP4、無ければ WebM)
  - .pptx は、文字と基本図形(四角・円・楕円)は編集できる形で、画像・縦書き・影やグラデーション付きの図形などは画像として入る。PowerPoint 以外の見え方は未確認(UNVERIFIED)
  - GIF は各ページを 2 秒ずつ、設定したアニメーション付きで再生。長辺 800px まで
- **PDF 読み込み**: 各ページを画像として取り込み、新しいデザインにする。**取り込んだ PDF の文字は画像に焼かれており、編集できない**(上に文字や図形を重ねて使う)

**素材**
- アイコン・絵文字 約 2.9 万点(10 セット。ライセンスは下記)
- 写真検索(Openverse の CC0/PDM、Picsum。サーバー版でキーを設定すれば Unsplash / Pexels も)
- **背景除去**: ブラウザ内で AI モデルを動かす(サーバーに画像を送らない。初回にモデルをダウンロード、WebGPU で約 98MB / WASM で約 192MB)
- **画像の生成はできません**。必要なら別の画像生成サービスで作った画像を取り込んでください

**HTML スライド(slide-studio 取り込み)**
- 台本から Claude Code などでスライドを作り、ブラウザで直す。発表者ツール・メモ・PDF 付き。`public/slides/` に同梱

**AI エージェント連携(ローカル版)**
- `npm run agent` で起動するローカルサーバーが `designs/` フォルダの JSON をデザインとして扱う。AI がファイルを書き換えると開いている画面に即反映
- **ワンクリック/コピーで登録**(画面の「AI エージェント連携」): Cursor・VS Code(Copilot)はディープリンク、Claude Code・Codex CLI・Gemini CLI は貼り付け用コマンド、Claude Desktop とその他(Windsurf・Cline・Zed など)は設定用 JSON。計 7 種類。AI が接続しているかも画面に表示される
- **「AI への依頼」の受付表**: 人が依頼を書く → AI が作業 → AI が品質点検(`check_design`) → 確認待ち → 人が**採用**または**やり直し**(指示つき)。状態は 待機中 / AI が作業中 / 確認待ち / 完了 / やり直し / 取り消し
- 人が関わるのは **①依頼 ②事実の確認(価格・日付・社名など AI が推測した箇所) ③採用/やり直し** の 3 点だけ、という設計。完了にできるのは人だけで、AI は完了にしない
- MCP サーバー(`agent/mcp.mjs`)の道具に `get_requests` / `update_request` / `check_design` を含む。複数ページのテンプレは全ページ追加もできる
- Claude Code の `/loop` で任せきりにする例や、JSON の書き方、MCP の詳細は [AGENTS.md](AGENTS.md)(「人と AI の分担」)を参照。AI の側でも画像は生成できません

**Cloudflare 版(任意)**
- パスキー / Google ログイン、クラウド保存(D1 + R2)、共有リンク、写真検索の中継。自分の Cloudflare アカウントに置く([docs/self-hosting.md](docs/self-hosting.md))

## クイックスタート

Node.js は Vite 8 の要件に合わせて `^20.19` または `>=22.12`、Cloudflare 版のデプロイ(wrangler)には 22 以上が必要です(いずれも各パッケージの `engines` 記載による)。

### ① ブラウザだけで使う

```bash
npm i
npm run dev
```

表示された URL を開きます。デザインはこの端末のブラウザ(IndexedDB)に保存されます。

### ② AI エージェントとつなぐ

```bash
npm i
npm run agent        # ビルドしてから http://127.0.0.1:4600 で起動(ポートは --port または PORT で変更)
```

カレントディレクトリの `designs/` に JSON を置く/書き換えると画面に反映されます。画面の「AI エージェント連携」から、使っているクライアントへの登録をワンクリック/コピーでできます。JSON の書き方や MCP サーバー、「人と AI の分担」は **[AGENTS.md](AGENTS.md) を参照**してください。

### ③ Cloudflare に自分で置く(任意)

ログイン・クラウド保存・共有が必要な場合のみ。概要:

```bash
cp wrangler.example.jsonc wrangler.jsonc   # account_id / database_id を自分のものに
npx wrangler d1 create irodori
npx wrangler r2 bucket create irodori
npx wrangler d1 migrations apply irodori --remote
npm run build && npx wrangler deploy
# 任意:
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put UNSPLASH_ACCESS_KEY
npx wrangler secret put PEXELS_API_KEY
```

詳しい手順は **[docs/self-hosting.md](docs/self-hosting.md)**。

## Canva Pro と比べて

「Canva Pro の代わりに全部できる」わけではありません。向き・不向きを正直に書きます(Canva 側の機能・料金は変わるため、比較は一般的な傾向であり、最新の内容は各社の公式情報で確認してください)。

| 区分 | 内容 |
| --- | --- |
| **AI のサブスクで賄えるもの** | 文章・コピー・デザイン案の生成(AI が JSON を書く)、既存デザインの文言差し替え・色違い・サイズ違いの量産、スライドの台本→構成、依頼の受付表を使った「頼む→AI が作る→点検→人が確認」の流れ。追加のサービス料は不要で、手持ちの AI エージェントの契約内で動く |
| **AI 無しでもブラウザ内で無料のもの** | 背景除去(ブラウザ内 AI モデル)、マジックリサイズ、複数のブランドキット、自分のフォントの取り込み、テンプレート 140 件(複数ページのセット 40 件を含む)、テキスト効果、重ね方 16 種、手描き、写真コラージュ、色・フォントの一括置換、デザインチェック、透過 PNG、SVG・PDF・PowerPoint(.pptx)・GIF・動画の書き出し、PDF の読み込み(画像として)、縦書き、バージョン履歴、アニメーション、QR コード、グラフ・表、オフライン起動(PWA) |
| **賄えないもの** | **画像生成**(Claude は画像を生成しません。必要なら別の画像生成サービスで作った画像を取り込む)、プレミアム素材の量(写真・動画・音楽・テンプレートは Canva に及ばない)、リアルタイム共同編集、モバイルアプリ、Canva 形式のファイルの読み込み、PDF 内の文字の編集(画像として入る)、他の Canva 固有機能 |

## 素材とライセンス

- **テンプレート**: 1 枚もの 100 件と複数ページのセット 40 件、すべてこのプロジェクトのオリジナルです。
- **アイコン・絵文字**: MIT / ISC / Apache-2.0 のセットのみ採用(`scripts/build-icons.mjs` が許可リスト外のライセンスを拒否します)。一覧は [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
- **写真**: Openverse(CC0 / パブリックドメインのみ)、Picsum、キーを設定した場合は Unsplash / Pexels。Unsplash / Pexels の写真は各社のガイドラインに従ってクレジットを表示してください(エディタ内に「写真のクレジット」表示があります)。
- **フォント**: Google Fonts から実行時に読み込みます(同梱しません。OFL 等)。

## 開発

```
agent/          ローカル版サーバー(designs/ の JSON の読み書き・画面への即反映・依頼の受付)と MCP サーバー(mcp.mjs)
docs/           自前運用の手順など
public/icons/   アイコンデータ(npm run icons で生成)
public/slides/  取り込んだ HTML スライド(slide-studio)
scripts/        build-icons / sync-slide-studio / strip-wasm
src/            画面(Vite + React + TypeScript、描画は fabric 7)
  api/          保存先の切替(ローカル/クラウド)と API クライアント
  components/   画面部品(Editor / Toolbar / LeftPanel / Download / Present ほか)
  data/         テンプレート(templates/ = 1 枚もの、templateSets/ = 複数ページ)・サイズ・フォント・図形・アイコン定義
  features/     テキスト効果・描画モード・コラージュ・ブランド・フォント取り込み・pptx/GIF 書き出し・PDF 取り込み・一括置換・デザインチェック
  editor/       エディタ本体(core, elements, resize, brand, animate, bgremove, vtext, repo ほか)
worker/         任意の Cloudflare Workers 版(認証・保存・共有・写真中継)と D1 マイグレーション
```

```bash
npm run dev          # 開発サーバー
npm run build        # 型検査 + ビルド。推論エンジンの wasm は配信物から除外し、実行時に jsDelivr から読む
npm run lint         # oxlint
npm run icons        # アイコンデータの再生成(@iconify-json/* から)
npm run sync-slides  # slide-studio の取り込み直し(下記)
```

**アイコンの再生成**: `scripts/build-icons.mjs` が `node_modules/@iconify-json/*` から `public/icons/` を作ります。採用セットの追加は `SETS` に足すだけですが、ライセンスが許可リスト(MIT / ISC / Apache-2.0 / CC0-1.0 / OFL-1.1)外だと失敗します。

**slide-studio の取り込み**: `public/slides/` は作者の別プロジェクト slide-studio のコピーです。`npm run sync-slides` は取り込み元を `SLIDE_STUDIO` 環境変数(既定 `~/Public/slide-studio`)から読むので、slide-studio を手元に置いていない場合は実行不要です(同梱済みのものがそのまま使えます)。`app.js` などは自動生成なので直接編集しないでください。

貢献の方法は [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

## ライセンス

[MIT](LICENSE) © 2026 いと。依存ライブラリ等は [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
