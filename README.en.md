# irodori

English | [日本語](README.md)

**A browser-based design tool that, once connected to your own AI agent (Claude Code, Cursor, Claude Desktop, etc.), covers much of what you would do in Canva Pro within the AI subscription you already pay for.**

Make social posts, flyers, cards, thumbnails and slides in an in-browser editor. Designs are plain JSON, so an AI agent can write the copy and layout directly and see it appear on screen immediately. No sign-up or account is needed; your data stays on your machine (or in a local folder).

- Demo: https://irodori.unmei-bunkiten.workers.dev (public demo with login and cloud storage turned off)
- License: [MIT](LICENSE)

![Screenshot](docs/screenshot.png)

> Note: irodori is an independent project and is not affiliated with Canva. "Canva" is a trademark of Canva Pty Ltd and is named here only for comparison. The UI and templates are currently in Japanese.

## Features

Only what is implemented in the code is listed.

**Editor**
- Shapes, text, images, icons, charts, tables and QR codes; grouping, duplicate, alignment, flip, opacity, shadow, undo/redo
- Text: Japanese and Latin web fonts (Google Fonts), outline, background color, letter/line spacing, lists, curved text, and **vertical writing** (own implementation with tate-chu-yoko and punctuation handling)
- Images: crop, adjustments, rounded corners, frames, replace-in-place
- Multiple pages, size presets (social, slides, print, web), and **magic resize** (rebuild a design at another size)
- Brand kit (colors, fonts, logos; stored in this browser's IndexedDB)
- Version history (up to 30 snapshots, in this browser)
- Entrance animations and a presentation view
- Templates: all original to this project (Instagram, stories, YouTube, X, LINE, flyers, cards, web, slides, ...)

**Export**
- PNG (optionally transparent), JPG, PDF (with print sizes), SVG, and video (MP4 if the browser supports it, otherwise WebM)

**Assets**
- About 29,000 icons/emoji from 10 sets (licenses below)
- Photo search: Openverse (CC0 / public domain only), Picsum, and Unsplash / Pexels if you configure keys on the server version
- **Background removal** runs in the browser with an AI model (images are not uploaded; the model is downloaded on first use, about 98 MB with WebGPU or 192 MB with WASM)

**HTML slides (imported from slide-studio)**
- Build slides from a script with an AI agent, then refine them in the browser. Presenter tools, notes and PDF export. Bundled under `public/slides/`

**AI agent integration (local server)**
- `npm run agent` starts a local server that treats the JSON files in `designs/` as designs. When an AI edits a file, the open browser tab updates immediately. See [AGENTS.md](AGENTS.md).

**Cloudflare edition (optional)**
- Passkey / Google sign-in, cloud storage (D1 + R2), share links, photo-search proxy. Deploy to your own Cloudflare account: [docs/self-hosting.md](docs/self-hosting.md)

## Quick start

Node.js `^20.19` or `>=22.12` (Vite 8's `engines`); deploying the Cloudflare edition with wrangler needs Node 22+ (wrangler's `engines`).

### 1. Browser only

```bash
npm i
npm run dev
```

Open the printed URL. Designs are saved in your browser (IndexedDB).

### 2. Connect an AI agent

```bash
npm i
npm run agent        # builds, then serves http://127.0.0.1:4600 (change with --port or PORT)
```

JSON files placed in or edited under `./designs/` show up in the browser. For agent setup (JSON format, MCP server, etc.) **see [AGENTS.md](AGENTS.md)**.

### 3. Self-host on Cloudflare (optional)

Only needed if you want login, cloud storage and sharing.

```bash
cp wrangler.example.jsonc wrangler.jsonc   # fill in your account_id / database_id
npx wrangler d1 create irodori
npx wrangler r2 bucket create irodori
npx wrangler d1 migrations apply irodori --remote
npm run build && npx wrangler deploy
# optional secrets:
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put UNSPLASH_ACCESS_KEY
npx wrangler secret put PEXELS_API_KEY
```

Details: **[docs/self-hosting.md](docs/self-hosting.md)**.

## Compared with Canva Pro

This is not a full replacement. Canva's features and pricing change, so treat this as a general comparison and check each vendor's official information.

| Category | What |
| --- | --- |
| **Covered by your AI subscription** | Generating copy and design drafts (the AI writes JSON), bulk text/color/size variations of an existing design, turning a script into slides. No extra service fee; it runs inside the AI agent plan you already have |
| **Free in the browser, no AI needed** | Background removal (in-browser AI model), magic resize, brand kit, transparent PNG, SVG/PDF export, video export, vertical text, version history, animation, QR codes, charts and tables |
| **Not covered** | **Image generation** (Claude does not generate images; bring images from another generator), the volume of premium stock (photos, video, music, templates are far smaller than Canva's), real-time collaborative editing, a mobile app, importing Canva files, and other Canva-specific features |

## Assets and licenses

- **Templates**: all original to this project.
- **Icons / emoji**: only MIT, ISC and Apache-2.0 sets (`scripts/build-icons.mjs` rejects licenses outside its allowlist). See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
- **Photos**: Openverse (CC0 / public domain only), Picsum, and Unsplash / Pexels when keys are set. Show credit for Unsplash / Pexels photos according to each provider's guidelines (the editor shows a "photo credit" chip).
- **Fonts**: loaded at runtime from Google Fonts (not bundled; OFL etc.).

## Development

```
agent/          Local server (reads/writes designs/ JSON, pushes changes to the browser)
docs/           Self-hosting guide etc.
public/icons/   Icon data (generated by npm run icons)
public/slides/  Imported HTML slide app (slide-studio)
scripts/        build-icons / sync-slide-studio / strip-wasm
src/            UI (Vite + React + TypeScript; rendering with fabric 7)
  api/          Storage switching (local/cloud) and API client
  components/   UI parts (Editor, Toolbar, LeftPanel, Download, Present, ...)
  data/         Templates, sizes, fonts, shapes, icon definitions
  editor/       Editor core (core, elements, resize, brand, animate, bgremove, vtext, repo, ...)
worker/         Optional Cloudflare Workers edition (auth, storage, sharing, photo proxy) + D1 migrations
```

```bash
npm run dev          # dev server
npm run build        # type-check + build; the inference-engine wasm is removed from the output and loaded from jsDelivr at runtime
npm run lint         # oxlint
npm run icons        # regenerate icon data from @iconify-json/*
npm run sync-slides  # re-import slide-studio (see below)
```

**Regenerating icons**: `scripts/build-icons.mjs` builds `public/icons/` from `node_modules/@iconify-json/*`. Add a set to `SETS`; it fails if the license is outside the allowlist (MIT / ISC / Apache-2.0 / CC0-1.0 / OFL-1.1).

**slide-studio import**: `public/slides/` is a copy of the author's separate slide-studio project. `npm run sync-slides` reads the source from the `SLIDE_STUDIO` env var (default `~/Public/slide-studio`), so you do not need it unless you have that repo; the bundled copy works as is. Do not edit the generated files by hand.

See [CONTRIBUTING.md](CONTRIBUTING.md) to contribute.

## License

[MIT](LICENSE) (c) 2026 ryoya. Third-party components: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
