# コントリビュート / Contributing

Issue・Pull Request 歓迎です。小さな修正は直接 PR で構いません。大きな変更は先に Issue で相談してください。
Issues and pull requests are welcome. For larger changes, please open an issue first.

## 開発の流れ

```bash
npm i
npm run dev      # 開発サーバー
npm run lint     # oxlint
npm run build    # 型検査 + ビルド(PR 前に通ることを確認)
```

- 変更範囲に合わせて動作確認し、PR に確認した内容を書いてください。
- 素材を足すときは**ライセンスを必ず確認**してください。テンプレートはオリジナルのみ、アイコンは MIT / ISC / Apache-2.0 / CC0 / OFL のセットのみ。出典不明の画像・フォントは受け付けられません。追加したら [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) も更新してください。
- `public/slides/` の `app.js` / `app.css` / `slides.css` / `index.html` は slide-studio からの自動取り込み物です(`npm run sync-slides`)。直接編集しないでください。
- AI エージェント向けの情報は [AGENTS.md](AGENTS.md) を参照してください。
- 貢献された内容は [MIT ライセンス](LICENSE)で公開されることに同意したものとみなします。
