# サードパーティの表記(Third-party notices)

irodori 本体は [MIT](LICENSE)(Copyright (c) 2026 いと)です。このファイルは、配布物に含まれる、または実行時に読み込む第三者の成果物とそのライセンスの一覧です。
情報は `node_modules` 内の `package.json` / `info.json`(2026-10-06 時点のインストール内容)と、`public/icons/index.json`、`src/editor/bgremove.ts` から読み取ったものです。各ライセンスの全文は各パッケージ・各上流リポジトリを参照してください。

## 1. 直接の依存ライブラリ(`dependencies`)

| パッケージ | バージョン | ライセンス | 作者(package.json の記載) |
| --- | --- | --- | --- |
| `cmdk` | 1.1.1 | MIT | Paco |
| `dompurify` | 3.4.16 | (MPL-2.0 OR Apache-2.0) | Dr.-Ing. Mario Heiderich, Cure53 |
| `fabric` | 7.4.0 | MIT | Juriy Zaytsev |
| `gifenc` | 1.0.3 | MIT | Matt DesLauriers |
| `@huggingface/transformers` | 4.3.0 | Apache-2.0 | Hugging Face |
| `jspdf` | 4.2.1 | MIT | - |
| `lucide-react` | 1.52.0 | ISC | Eric Fennis |
| `@modelcontextprotocol/sdk` | 1.32.1 | MIT | Anthropic, PBC |
| `pdfjs-dist` | 6.4.299 | Apache-2.0 | - |
| `pptxgenjs` | 4.0.1 | MIT | Brent Ely |
| `qrcode` | 1.5.4 | MIT | Ryan Day |
| `@radix-ui/react-tooltip` | 1.3.0 | MIT | - |
| `react` | 19.3.0 | MIT | - |
| `react-dom` | 19.3.0 | MIT | - |
| `@simplewebauthn/browser` | 14.0.0 | MIT | Matthew Miller |
| `@simplewebauthn/server` | 14.0.3 | MIT | Matthew Miller |
| `sonner` | 2.0.8 | MIT | Emil Kowalski |
| `zod` | 4.6.5 | MIT | Colin McDonnell |

- `dompurify` は `(MPL-2.0 OR Apache-2.0)` のデュアルライセンスです。
- `@huggingface/transformers` はブラウザ内の背景除去で使います。`cmdk`(コマンドパレット)・`sonner`(通知)・`@radix-ui/react-tooltip`(ツールチップ)は画面、`pptxgenjs` は PowerPoint 書き出し、`gifenc` は GIF 書き出し、`pdfjs-dist` は PDF 読み込みで使います。`@modelcontextprotocol/sdk` と `zod` は MCP サーバー(`agent/mcp.mjs`)で使っています(Node 側のみ。ブラウザ用の配布物には含まれません)。
- 開発用(`devDependencies`: Vite、TypeScript、wrangler、oxlint、型定義など)は配布物に含まれません。

## 2. アイコン・絵文字(`public/icons/`、約 29,384 点)

`scripts/build-icons.mjs` が Iconify JSON パッケージから生成します。許可リスト(MIT / ISC / Apache-2.0 / CC0-1.0 / OFL-1.1)外のライセンスだと生成が失敗します。下表は `public/icons/index.json` の記載です。

| セット ID | 作者 | ライセンス | 点数 | 取得元パッケージ | 上流 |
| --- | --- | --- | --- | --- | --- |
| fluent-emoji-flat | Microsoft Corporation | MIT | 2043 | `@iconify-json/fluent-emoji-flat`@1.2.6 | https://github.com/microsoft/fluentui-emoji |
| noto | Google Inc | Apache-2.0 | 1769 | `@iconify-json/noto`@1.2.9 | https://github.com/googlefonts/noto-emoji |
| fxemoji | Mozilla | Apache-2.0 | 1034 | `@iconify-json/fxemoji`@1.2.2 | https://github.com/mozilla/fxemoji |
| flat-color-icons | Icons8 | MIT | 329 | `@iconify-json/flat-color-icons`@1.2.3 | Icons8 Flat Color Icons |
| tabler | Paweł Kuna | MIT | 6268 | `@iconify-json/tabler`@1.2.41 | https://github.com/tabler/tabler-icons |
| lucide | Lucide Contributors | ISC | 1938 | `@iconify-json/lucide`@1.2.140 | https://github.com/lucide-icons/lucide |
| ph | Phosphor Icons | MIT | 3052 | `@iconify-json/ph`@1.2.2 | https://github.com/phosphor-icons/core |
| mdi | Pictogrammers | Apache-2.0 | 7638 | `@iconify-json/mdi`@1.2.3 | https://github.com/Templarian/MaterialDesign |
| ri | Remix Design | Apache-2.0 | 3229 | `@iconify-json/ri`@1.2.10 | https://github.com/Remix-Design/RemixIcon |
| bi | The Bootstrap Authors | MIT | 2084 | `@iconify-json/bi`@1.2.7 | https://github.com/twbs/icons |

Apache-2.0 のセット(Noto、Firefox Emoji、Material Design Icons、Remix Icon)は、Apache License 2.0 の条件(ライセンス表示・変更の明示)に従って再配布しています。アイコン画像そのものをアプリ上で利用者のデザインに使うことは各ライセンスで許されていますが、各セットのライセンス全文は上流を参照してください。

## 3. 背景除去モデル

- モデル: BiRefNet_lite(512px 版)、変換配布: `studioludens/birefnet-lite-512`(Hugging Face)。`src/editor/bgremove.ts` の `BG_MODEL_INFO` は license を `MIT` と記載しています。
- 同梱はしません。利用者がボタンを押したときに、ブラウザが Hugging Face からダウンロードして端末内で実行します(WebGPU で約 98MB、WASM で約 192MB)。画像は外部に送られません。
- 推論エンジン `onnxruntime-web`(MIT)の wasm ファイルは、配信物からは除外し、実行時に jsDelivr(`cdn.jsdelivr.net`)から読み込みます(`scripts/strip-wasm.mjs`)。
- UNVERIFIED: モデルの元の配布ページのライセンス表記は、このセッションでは再確認していません(コード内の記載に従っています)。

## 4. フォント

すべて Google Fonts(SIL Open Font License など)を、実行時に `fonts.googleapis.com` / `fonts.gstatic.com` から読み込みます。**フォントファイルは同梱していません**。対象は `src/data/fonts.ts` の一覧です。

## 5. 写真

写真は同梱せず、実行時に各サービスから取得します。
- Openverse(CC0 / パブリックドメインのみに絞って検索)
- Picsum(<https://picsum.photos>。コード内のコメントでは Unsplash License の写真として扱っています)
- Unsplash / Pexels: 利用者が自分のサーバー(Cloudflare 版)に API キーを設定した場合のみ。各社の API 利用規約・ガイドラインに従い、クレジットを表示してください。

## 6. slide-studio

`public/slides/` は、同じ作者(いと)の別プロジェクト **slide-studio** の画面を取り込んだものです(`scripts/sync-slide-studio.mjs`)。slide-studio も本プロジェクトと同じく MIT ライセンスとして同梱します(Copyright (c) 2026 いと)。

## 7. その他の注意

- `sharp` と、その `@img/sharp-libvips-*`(LGPL-3.0-or-later)は `@huggingface/transformers` の依存として `node_modules` に入りますが、Node.js 専用のネイティブ実装です。ブラウザ向けのビルド成果物(`dist/`)には含まれていません(`dist/assets` を `libvips` で検索して該当なしを確認)。
- `jszip`(`pptxgenjs` の依存)は `(MIT OR GPL-3.0-or-later)` のデュアルライセンスで、本プロジェクトは MIT を選んで使います。`rgbcolor`(`jspdf` の依存)は MIT を選んで使います。
- 本プロジェクトの Canva との比較は説明目的です。「Canva」は Canva Pty Ltd の商標で、本プロジェクトは Canva と無関係です。

## 付録: 本番依存の推移的依存を含む一覧(379 件)

`package-lock.json` の `dev` でないパッケージを、`node_modules` の `package.json` の license フィールドで分類しました(複数バージョンがあるものは別々に数えています)。

### MIT(291 件)

@asamuzakjp/css-color@3.2.0, @babel/runtime@7.29.7, @csstools/css-calc@2.1.4, @csstools/css-color-parser@3.1.0, @csstools/css-parser-algorithms@3.0.5, @csstools/css-tokenizer@3.0.4, @emnapi/runtime@1.11.3, @floating-ui/core@1.8.0, @floating-ui/dom@1.8.0, @floating-ui/react-dom@2.1.9, @floating-ui/utils@0.2.12, @hexagon/base64@1.1.28, @hono/node-server@2.1.3, @huggingface/jinja@0.5.10, @img/colour@1.1.0, @levischuck/tiny-cbor@0.2.11, @modelcontextprotocol/sdk@1.32.1, @napi-rs/canvas-android-arm64@1.0.10, @napi-rs/canvas-darwin-arm64@1.0.10, @napi-rs/canvas-darwin-x64@1.0.10, @napi-rs/canvas-linux-arm-gnueabihf@1.0.10, @napi-rs/canvas-linux-arm64-gnu@1.0.10, @napi-rs/canvas-linux-arm64-musl@1.0.10, @napi-rs/canvas-linux-riscv64-gnu@1.0.10, @napi-rs/canvas-linux-x64-gnu@1.0.10, @napi-rs/canvas-linux-x64-musl@1.0.10, @napi-rs/canvas-win32-arm64-msvc@1.0.10, @napi-rs/canvas-win32-x64-msvc@1.0.10, @napi-rs/canvas@1.0.10, @peculiar/asn1-android@2.10.0, @peculiar/asn1-asym-key@2.10.0, @peculiar/asn1-cms@2.10.0, @peculiar/asn1-csr@2.10.0, @peculiar/asn1-ecc@2.10.0, @peculiar/asn1-pfx@2.10.0, @peculiar/asn1-pkcs8@2.10.0, @peculiar/asn1-pkcs9@2.10.0, @peculiar/asn1-rsa@2.10.0, @peculiar/asn1-schema@2.10.0, @peculiar/asn1-x509-attr@2.10.0, @peculiar/asn1-x509-post-quantum@2.10.0, @peculiar/asn1-x509@2.10.0, @peculiar/utils@2.0.3, @peculiar/x509@2.1.0, @radix-ui/primitive@1.1.7, @radix-ui/react-arrow@1.1.16, @radix-ui/react-compose-refs@1.1.5, @radix-ui/react-context@1.2.2, @radix-ui/react-dialog@1.2.0, @radix-ui/react-dismissable-layer@1.1.20, @radix-ui/react-focus-guards@1.1.6, @radix-ui/react-focus-scope@1.2.0, @radix-ui/react-id@1.1.4, @radix-ui/react-popper@1.3.8, @radix-ui/react-portal@1.1.18, @radix-ui/react-presence@1.1.11, @radix-ui/react-primitive@2.1.11, @radix-ui/react-slot@1.4.0, @radix-ui/react-tooltip@1.3.0, @radix-ui/react-use-callback-ref@1.1.4, @radix-ui/react-use-controllable-state@1.2.6, @radix-ui/react-use-effect-event@0.0.5, @radix-ui/react-use-layout-effect@1.1.4, @radix-ui/react-use-rect@1.1.4, @radix-ui/react-use-size@1.1.5, @radix-ui/react-visually-hidden@1.2.12, @radix-ui/rect@1.1.3, @simplewebauthn/browser@14.0.0, @simplewebauthn/server@14.0.3, @types/node@22.20.5, @types/node@24.19.1, @types/pako@2.0.4, @types/raf@3.4.3, @types/trusted-types@2.0.7, accepts@2.0.0, adm-zip@0.6.1, agent-base@7.1.4, ajv-formats@3.0.1, ajv@8.20.0, ansi-regex@5.0.1, ansi-styles@4.3.0, aria-hidden@1.2.6, base64-arraybuffer@1.0.2, base64-js@1.5.1, bl@4.1.0, body-parser@2.3.0, buffer@5.7.1, bytes@3.1.2, call-bind-apply-helpers@1.0.2, call-bound@1.0.4, camelcase@5.3.1, canvas@3.2.3, canvg@3.0.11, cmdk@1.1.1, color-convert@2.0.1, color-name@1.1.4, content-disposition@1.1.0, content-type@1.0.5, content-type@2.1.0, cookie-signature@1.2.2, cookie@0.7.2, core-js@3.50.0, core-util-is@1.0.3, cors@2.8.6, cross-spawn@7.0.6, css-line-break@2.1.0, cssstyle@4.6.0, data-urls@5.0.0, debug@4.4.3, decamelize@1.2.0, decimal.js@10.6.0, decompress-response@6.0.0, deep-extend@0.6.0, define-data-property@1.1.4, define-properties@1.2.1, depd@2.0.0, detect-node-es@1.1.0, dijkstrajs@1.0.3, dunder-proto@1.0.1, ee-first@1.1.1, emoji-regex@8.0.0, encodeurl@2.0.0, end-of-stream@1.4.5, es-define-property@1.0.1, es-errors@1.3.0, es-object-atoms@1.1.2, escape-html@1.0.3, escape-string-regexp@4.0.0, etag@1.8.1, eventsource-parser@3.1.1, eventsource@3.0.7, express-rate-limit@8.7.0, express@5.2.1, fabric@7.4.0, fast-deep-equal@3.1.3, fast-png@6.4.0, fflate@0.8.3, finalhandler@2.1.1, find-up@4.1.0, forwarded@0.2.0, fresh@2.0.0, fs-constants@1.0.0, function-bind@1.1.2, get-intrinsic@1.3.0, get-nonce@1.0.1, get-proto@1.0.1, gifenc@1.0.3, github-from-package@0.0.0, globalthis@1.0.4, gopd@1.2.0, has-property-descriptors@1.0.2, has-symbols@1.1.0, hasown@2.0.4, hono@4.13.13, html-encoding-sniffer@4.0.0, html2canvas@1.4.1, http-errors@2.0.1, http-proxy-agent@7.0.2, https-proxy-agent@7.0.6, iconv-lite@0.6.3, iconv-lite@0.7.3, image-size@1.2.1, immediate@3.0.6, iobuffer@5.4.0, ip-address@10.7.3, ipaddr.js@1.9.1, is-fullwidth-code-point@3.0.0, is-potential-custom-element-name@1.0.1, is-promise@4.0.0, isarray@1.0.0, jose@6.2.12, jsdom@26.1.0, json-schema-traverse@1.0.0, jspdf@4.2.1, lie@3.3.0, locate-path@5.0.0, matcher@4.0.0, math-intrinsics@1.1.0, media-typer@1.1.1, merge-descriptors@2.0.0, mime-db@1.54.0, mime-types@3.0.2, mimic-response@3.1.0, minimist@1.2.8, mkdirp-classic@0.5.3, ms@2.1.3, napi-build-utils@2.0.0, negotiator@1.1.0, node-abi@3.97.0, node-addon-api@7.1.1, nwsapi@2.2.28, object-assign@4.1.1, object-inspect@1.13.4, object-keys@1.1.1, on-finished@2.4.1, onnxruntime-common@1.30.0, onnxruntime-common@1.31.0-dev.20260911-2a43ec07e, onnxruntime-node@1.30.0, onnxruntime-web@1.31.0-dev.20260914-8d85527a0, p-limit@2.3.0, p-locate@4.1.0, p-try@2.2.0, parse5@7.3.0, parseurl@1.3.3, path-exists@4.0.0, path-key@3.1.1, path-to-regexp@8.4.2, performance-now@2.1.0, pkce-challenge@5.0.1, platform@1.3.6, pngjs@5.0.0, pptxgenjs@4.0.1, prebuild-install@7.1.3, process-nextick-args@2.0.1, proxy-addr@2.0.8, pump@3.0.4, punycode@2.3.1, pvtsutils@1.3.6, pvutils@1.2.0, qrcode@1.5.4, queue@6.0.2, raf@3.4.1, range-parser@1.3.0, raw-body@3.0.2, react-dom@19.3.0, react-remove-scroll-bar@2.3.8, react-remove-scroll@2.7.2, react-style-singleton@2.2.3, react@19.3.0, readable-stream@2.3.8, readable-stream@3.6.2, regenerator-runtime@0.13.11, require-directory@2.1.1, require-from-string@2.0.2, router@2.2.0, rrweb-cssom@0.8.0, safe-buffer@5.1.2, safe-buffer@5.2.1, safer-buffer@2.1.2, scheduler@0.28.0, send@1.2.1, serialize-error@8.1.0, serve-static@2.2.1, setimmediate@1.0.5, shebang-command@2.0.0, shebang-regex@3.0.0, side-channel-list@1.0.1, side-channel-map@1.0.1, side-channel-weakmap@1.0.2, side-channel@1.1.1, simple-concat@1.0.1, simple-get@4.0.1, sonner@2.0.8, stackblur-canvas@2.7.0, statuses@2.0.2, string-width@4.2.3, string_decoder@1.1.1, string_decoder@1.3.0, strip-ansi@6.0.1, strip-json-comments@2.0.1, svg-pathdata@6.0.3, symbol-tree@3.2.4, tar-fs@2.1.5, tar-stream@2.2.0, text-segmentation@1.0.3, tldts-core@6.1.86, tldts@6.1.86, toidentifier@1.0.1, tr46@5.1.1, tsyringe@4.10.0, type-is@2.1.0, undici-types@6.21.0, undici-types@7.24.6, unpipe@1.0.0, use-callback-ref@1.3.3, use-sidecar@1.1.3, util-deprecate@1.0.2, utrie@1.0.2, vary@1.1.2, w3c-xmlserializer@5.0.0, whatwg-encoding@3.1.1, whatwg-mimetype@4.0.0, whatwg-url@14.2.0, wrap-ansi@6.2.0, ws@8.22.0, xmlchars@2.2.0, yargs@15.4.1, zod@4.6.5

### Apache-2.0(22 件)

@huggingface/tokenizers@0.2.0, @huggingface/transformers@4.3.0, @img/sharp-darwin-arm64@0.35.5, @img/sharp-darwin-x64@0.35.5, @img/sharp-freebsd-wasm32@0.35.5, @img/sharp-linux-arm64@0.35.5, @img/sharp-linux-arm@0.35.5, @img/sharp-linux-ppc64@0.35.5, @img/sharp-linux-riscv64@0.35.5, @img/sharp-linux-s390x@0.35.5, @img/sharp-linux-x64@0.35.5, @img/sharp-linuxmusl-arm64@0.35.5, @img/sharp-linuxmusl-x64@0.35.5, @img/sharp-webcontainers-wasm32@0.35.5, detect-libc@2.1.2, flatbuffers@25.9.23, long@5.3.2, pdfjs-dist@6.4.299, reflect-metadata@0.2.2, sharp@0.35.5, tunnel-agent@0.6.0, xml-name-validator@5.0.0

### ISC(22 件)

chownr@1.1.4, cliui@6.0.0, get-caller-file@2.0.5, guid-typescript@1.0.9, https@1.0.0, inherits@2.0.4, ini@1.3.8, isexe@2.0.0, lru-cache@10.4.3, lucide-react@1.52.0, once@1.4.0, require-main-filename@2.0.0, saxes@6.0.0, semver@7.8.5, set-blocking@2.0.0, setprototypeof@1.2.0, which-module@2.0.1, which@2.0.2, wrappy@1.0.2, y18n@4.0.3, yargs-parser@18.1.3, zod-to-json-schema@3.25.2

### BSD-3-Clause(16 件)

@protobufjs/aspromise@1.1.2, @protobufjs/base64@1.1.2, @protobufjs/codegen@2.0.5, @protobufjs/eventemitter@1.1.1, @protobufjs/fetch@1.1.1, @protobufjs/float@1.0.2, @protobufjs/path@1.1.2, @protobufjs/pool@1.1.0, @protobufjs/utf8@1.1.2, asn1js@3.0.10, fast-uri@3.1.8, global-agent@4.1.3, ieee754@1.2.1, protobufjs@7.6.6, qs@6.16.0, tough-cookie@5.1.2

### LGPL-3.0-or-later(10 件)

@img/sharp-libvips-darwin-arm64@1.3.4, @img/sharp-libvips-darwin-x64@1.3.4, @img/sharp-libvips-linux-arm64@1.3.4, @img/sharp-libvips-linux-arm@1.3.4, @img/sharp-libvips-linux-ppc64@1.3.4, @img/sharp-libvips-linux-riscv64@1.3.4, @img/sharp-libvips-linux-s390x@1.3.4, @img/sharp-libvips-linux-x64@1.3.4, @img/sharp-libvips-linuxmusl-arm64@1.3.4, @img/sharp-libvips-linuxmusl-x64@1.3.4

### Apache-2.0 AND LGPL-3.0-or-later(3 件)

@img/sharp-win32-arm64@0.35.5, @img/sharp-win32-ia32@0.35.5, @img/sharp-win32-x64@0.35.5

### BSD-2-Clause(3 件)

entities@6.0.1, json-schema-typed@8.0.2, webidl-conversions@7.0.0

### (MIT AND Zlib)(2 件)

pako@1.0.11, pako@2.2.0

### 0BSD(2 件)

tslib@1.14.1, tslib@2.8.1

### (BSD-2-Clause OR MIT OR Apache-2.0)(1 件)

rc@1.2.8

### (MIT OR CC0-1.0)(1 件)

type-fest@0.20.2

### (MIT OR GPL-3.0-or-later)(1 件)

jszip@3.10.2

### (MIT OR WTFPL)(1 件)

expand-template@2.0.3

### (MPL-2.0 OR Apache-2.0)(1 件)

dompurify@3.4.16

### Apache-2.0 AND LGPL-3.0-or-later AND MIT(1 件)

@img/sharp-wasm32@0.35.5

### MIT OR SEE LICENSE IN FEEL-FREE.md(1 件)

rgbcolor@1.0.1

### MIT-0(1 件)

@csstools/color-helpers@5.1.0
