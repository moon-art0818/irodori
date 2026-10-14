# スマホアプリ化(PWA と ネイティブアプリ)

irodori は 2 通りの方法でスマホのアプリとして使えます。

| 方法 | 手間 | 配布 |
|---|---|---|
| A. PWA(ホーム画面に追加) | 追加作業なし | URL を開いて追加するだけ。ストア審査なし |
| B. ネイティブアプリ(Capacitor) | Xcode / Android Studio が必要 | App Store / Google Play に出せる |

## A. PWA としてインストール

幅 760px 以下の画面では、スマホ用の編集画面(下部のツールタブ・せり上がるシート・ピンチ操作)になります。

- **Android(Chrome)**: ホーム画面の下に「アプリとして使えます」と出るので「追加」を押す。出ない場合はブラウザのメニューの「ホーム画面に追加」。
- **iPhone / iPad(Safari)**: 共有ボタン →「ホーム画面に追加」。案内は一度閉じると二度と出ません。
- アプリ名・アイコンは `public/manifest.webmanifest` と `public/app-icons/` が元です。アイコンを作り直すには `node scripts/build-app-icons.mjs`(`sharp` を使います。`node_modules` に入っている必要があります)。

## B. ネイティブアプリ(Capacitor)

`@capacitor/core` `@capacitor/cli` `@capacitor/ios` `@capacitor/android` を導入済みで、設定は `capacitor.config.ts`(appId `dev.irodori.app`、webDir `dist`)、プロジェクトは `ios/` と `android/` にあります(`npx cap add ios` / `android` 済み)。画面の中身は `dist/` をそのまま包みます。

### 1. 開発環境を用意する(自分の Mac で)

- **iOS**: Mac App Store から Xcode を入れ、一度起動して追加コンポーネントを入れる。CocoaPods は不要(Swift Package Manager 構成)だが、Xcode のコマンドラインツールは必要。
- **Android**: Android Studio を入れ、SDK(Android SDK Platform とビルドツール)を入れる。JDK は Android Studio 同梱のものでよい。
- 公式の手順: https://capacitorjs.com/docs/getting-started/environment-setup

### 2. 画面を作ってネイティブに反映する

```bash
npm run build          # dist/ を作る
npx cap sync           # dist/ を ios/ android/ にコピーし、プラグインを同期する
npx cap open ios       # Xcode が開く
npx cap open android   # Android Studio が開く
```

画面(src/)を直したら、毎回 `npm run build && npx cap sync` をしてから実機・エミュレーターで実行します。

### 3. 注意(このアプリ固有)

- ネイティブアプリの中では、ページは `capacitor://localhost`(iOS)/ `https://localhost`(Android)で動きます。**クラウド保存・ログイン・共同編集などサーバーと話す機能は、接続先のサーバー URL と CORS 設定が必要**で、現状の設定では未対応です(UNVERIFIED。実機で確認していません)。まずは「この端末に保存」(IndexedDB)で動く範囲が対象です。
- Service Worker はネイティブ側では不要です。
- 書き出し(ダウンロード)はブラウザの `<a download>` を使っています。ネイティブの WebView では保存・共有の挙動が違う可能性があり、実機で確認が必要です(UNVERIFIED)。必要なら Capacitor の Filesystem / Share プラグインへ切り替えます。
- アイコン・スプラッシュ画像は初期状態(Capacitor 既定)のままです。差し替えには `@capacitor/assets` などを使います。

### 4. 署名してストアに出す

ストアへの公開には開発者アカウントの登録が必要です。料金・条件は変わるので、必ず公式ページで確認してください。

- **App Store**: Apple Developer Program への登録が必要。Xcode で Signing & Capabilities のチームを選び、Product → Archive → Distribute App で App Store Connect にアップロードし、審査に出す。
  https://developer.apple.com/programs/
- **Google Play**: Google Play Console の登録が必要。Android Studio で Build → Generate Signed Bundle / APK から署名付き AAB を作り、Play Console にアップロードする。アップロード鍵の管理に注意(紛失すると更新できなくなる場合があります)。
  https://play.google.com/console/about/

審査には、アプリの説明・スクリーンショット・プライバシーポリシーの URL などが必要です(各ストアの最新の要件を確認してください)。

## スマホの操作(PWA・ネイティブ共通)

- 1 本指: 選択・移動・ハンドルで拡大縮小・回転
- 2 本指: ピンチで画面の拡大縮小、そのままドラッグで画面の移動
- 選択中の文字をもう一度タップ / ダブルタップ: 文字の編集
- 長押し: コンテキストメニュー(コピー・複製・削除・重なり順など)
- 範囲選択(ドラッグで複数選択)はスマホ幅では無効(指の移動と紛らわしいため)
