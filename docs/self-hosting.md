# Cloudflare に自分で置く(任意)

ログイン(パスキー / Google)・クラウド保存・共有リンクが必要な場合だけの手順です。**ブラウザだけで使う場合や AI エージェント連携(`npm run agent`)には不要**です。

構成: 静的ファイル(`dist/`)+ API 用の Worker(`worker/index.ts`、`/api/*` のみ)+ D1(ユーザー・デザイン・共有のメタデータ)+ R2(画像・サムネイル・写真検索のキャッシュ)。

## 準備

- Cloudflare アカウント(無料プランで始められるかどうかは、各サービスの現行の料金・制限を公式ドキュメントで確認してください)
- Node.js 22 以上(wrangler の `engines`)
- `npm i` 済みであること

```bash
npx wrangler login
npx wrangler whoami      # account_id を控える。複数アカウントにログインしている場合は特に確認
```

## 1. 設定ファイルを作る

```bash
cp wrangler.example.jsonc wrangler.jsonc
```

`wrangler.jsonc` の `<YOUR_ACCOUNT_ID>` を自分の account_id に置き換えます(`wrangler.jsonc` は自分用の設定です。公開リポジトリには含めない運用を推奨します)。

## 2. D1 と R2 を作る

```bash
npx wrangler d1 create irodori
npx wrangler r2 bucket create irodori
```

`d1 create` の出力に表示される `database_id` を、`wrangler.jsonc` の `<YOUR_D1_DATABASE_ID>` に貼ります。バケット名を変えた場合は `r2_buckets` の `bucket_name` も合わせます。

## 3. マイグレーション

```bash
npx wrangler d1 migrations apply irodori --remote
```

`worker/migrations/` の SQL(ユーザー・パスキー・セッション・デザイン・アセット・Google 連携など)が順に適用されます。ローカルの `wrangler dev` 用に試す場合は `--remote` を外します。

## 4. ビルドとデプロイ

```bash
npm run build
npx wrangler deploy
```

**`npm run build` を先に実行してください。** `wrangler deploy` は `dist/` をそのまま上げるだけなので、ビルドを挟まないと成功しても古い画面が公開されます。`npm run build` は推論エンジンの wasm を `dist/` から外します(Workers の静的ファイルの 1 ファイル 25MiB 上限を超えるため。wasm は実行時に jsDelivr から読み込まれます)。

デプロイ後に表示される `https://irodori.<あなたのサブドメイン>.workers.dev`(または自分のドメイン)を開きます。

## 5. 任意の設定(シークレット)

どれも未設定なら、その機能の入口が画面から隠れます。

```bash
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put UNSPLASH_ACCESS_KEY    # 写真検索に Unsplash を追加
npx wrangler secret put PEXELS_API_KEY         # 写真検索に Pexels を追加
npx wrangler secret put PIXABAY_API_KEY        # 写真・動画の検索に Pixabay を追加
```

### Google ログイン

1. Google Cloud コンソールで OAuth クライアント(ウェブアプリケーション)を作る
2. 「承認済みのリダイレクト URI」に `https://<あなたの公開オリジン>/api/auth/google/callback` を登録する(コードは `<origin>/api/auth/google/callback` を使います)
3. クライアント ID / シークレットを上のコマンドで登録する

### 写真・動画検索(Unsplash / Pexels / Pixabay)

各サービスでアプリを登録して API キーを取得します。キーはサーバー(Worker)だけが持ち、ブラウザには渡りません。検索結果は R2 に 1 時間キャッシュされます。各社のガイドライン(クレジット表示など)に従ってください。利用回数の上限は各社の現行の規約を確認してください。

**Pixabay**(写真・動画): [Pixabay API](https://pixabay.com/api/docs/) のキーを `PIXABAY_API_KEY` に登録します。検索結果は規約に従い R2 に 24 時間キャッシュし、画面に Pixabay の素材であることを表示します。Pixabay の画像・動画は CORS と Referer の制限があるため、取り込みは Worker の中継(`/api/media/pixabay`、`cdn.pixabay.com` の写真・動画だけ許可、100MB まで)を通して素材庫に保存します。公開デモ(`DEMO=1`)でも、キーを入れれば Pixabay の検索と取り込みだけは使えます(回数制限は IP ごと)。

## ローカルで動かす(Worker 込み)

プロジェクト直下の `.dev.vars`(`.gitignore` 済み)に、Google ログイン等のキーを `KEY=value` で書くと `wrangler dev` から読まれます。**このファイルは絶対にコミットしないでください。**

```bash
npm run build
npx wrangler d1 migrations apply irodori --local
npx wrangler dev
```

## 公開デモにする(`DEMO`)

`wrangler.jsonc` の `vars` に `"DEMO": "1"` を入れると、Worker は `/api/me` と `/api/providers` 以外の API を拒否します(`PIXABAY_API_KEY` を設定した場合のみ、Pixabay の検索・取り込みは例外)。ログイン・クラウド保存・共有・写真中継が止まり、編集はブラウザ内保存のみになります。不特定多数に見せるだけの用途向けです。通常運用は `"0"`。

## 注意点

- **パスキーは「ホスト名」に結び付きます**(コードは `rpID` にアクセスしたホスト名を使います)。公開後にドメインを変えると、登録済みのパスキーではログインできなくなります。(推測)Google ログインも併用しておくと、パスキーを失ったときの入口が増えます。
- `ratelimits`(認証の回数制限)は任意です。使えない環境では `wrangler.jsonc` からその項目を削除しても動きます(Worker 側は未設定を許容)。
- セッション Cookie は HttpOnly / SameSite=Lax で、localhost 以外では Secure を付けます。HTTPS で公開してください。
- 容量・サイズの上限: 1 デザイン 20MB、画像 1 枚 15MB(コード内の定数)。ユーザーごとの保存容量の上限は `src/api/contract.ts` の `DEFAULT_QUOTA_BYTES` です。
- 定期実行(`triggers.crons`)は使っていません。
- UNVERIFIED: このドキュメントの手順を、まっさらなアカウントで通しで実行したわけではありません(作者の環境では稼働中)。つまずいた箇所は Issue で教えてください。
