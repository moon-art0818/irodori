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
- Text: Japanese and Latin web fonts (searchable across all 1,950 Google Fonts families), outline, background color, letter/line spacing, lists, curved text, and **vertical writing** (own implementation with tate-chu-yoko and punctuation handling)
- **9 text effects**: none, shadow, lift, hollow, outlined, echo, glitch, neon, background highlight (built from fabric shadow/stroke; echo and glitch are approximations, and neon sets the fill to white)
- **16 blend modes**: normal, multiply, screen, overlay, darken, lighten, color-dodge, color-burn, hard-light, soft-light, difference, exclusion, hue, saturation, color, luminosity
- **Freehand drawing**: pen and a semi-transparent marker; each stroke can be undone separately
- **Photo grids / collages**: 21 layouts for 2 to 9 photos (including round ones) that place photo frames; adding an image while a frame is selected fits it into the frame
- Images: crop, adjustments, rounded corners, frames, replace-in-place
- Multiple pages, size presets (social, slides, print, web), and **magic resize** (rebuild a design at another size)
- **Multiple brand kits**: up to 10 named kits of colors, heading/body fonts and logos, switchable; stored in this browser's IndexedDB
- **Bring your own fonts**: ttf / otf / woff / woff2 (up to 30 MB per file), stored in this browser's IndexedDB. Checking the font's license is up to you
- Version history (up to 30 snapshots, in this browser)
- Entrance animations and a presentation view
- **Bulk replace** of colors and fonts: lists every color/font used across all pages and swaps them in one go
- **Design check**: automatic quality inspection (empty page, content outside the page, text that is too small, margins too tight, low text/background contrast, upscaled or low-resolution images for print, too many fonts). Some findings can be fixed automatically. It is a rough check estimated from the page JSON; a human still needs to look at the result

**Templates (all original to this project, 160 in total)**
- **100 single-page templates**: Instagram posts (19), Instagram portrait (6), stories (10), YouTube thumbnails (10), presentations (18), flyers/posters (10), business cards (6), X (5), web/blog (5), LINE (4), logos (4), postcards/invitations (3)
- **60 multi-page sets** (609 pages in total): 10 presentations, 10 social sets (8 Instagram carousels, 2 stories), 10 print sets (company profile, documents, menu, flyer, business card, postcards, certificate), 10 web/video sets (YouTube thumbnails, blog, X, LINE, logo, infographic, banner), plus 20 additional sets (resume, job posting, real estate, cafe social, salon, cram school, clinic, yearly calendar, wedding, e-commerce product images, podcast, neighborhood association, kids, gym, IR materials, release notes, recipe cards, ryokan, music festival, study notes)
- In the editor's left panel, for a multi-page template you can **pick a page and apply it to the current page**, or **add all pages**. Templates are also searchable by keyword (industry, purpose)

**Interface**
- Light and dark themes (defaults to the OS setting; your choice is saved in this browser)
- **Command palette on Cmd+K (Ctrl+K on Windows)** (cmdk): search templates, sizes, your designs and actions
- Toast notifications for operation results (sonner)
- **Mobile layout**: at 760 px wide or less the UI switches to a phone layout (bottom tool tabs, bottom sheets that slide up, two-finger pinch to zoom and pan, long-press for a menu). It can be added to the home screen and used as an app (PWA). Native iOS / Android app scaffolding (Capacitor; `ios/` and `android/`) is included; publishing steps are in [docs/mobile-app.md](docs/mobile-app.md). **Native builds are unchecked (UNVERIFIED)**
- Left navigation: Home / Templates / My designs / AI agent connection, plus "Create" shortcuts (Instagram, slides, HTML slides)
- PWA: in a production build a service worker caches the UI, scripts and assets, so the app **opens offline** after the first visit (anything that needs a server, such as cloud storage, photo search and AI integration, does not work offline)

**Export and import**
- Export: PNG (optionally transparent), JPG, PDF (with print sizes), SVG, **PowerPoint (.pptx)**, **animated GIF**, and video (MP4 if the browser supports it, otherwise WebM)
  - MP4 / WebM include the audio of videos placed in the design and the background music (up to 60 seconds per page). Still-image exports such as PNG use the current frame of a video
  - In .pptx, text and basic shapes (rectangle, circle, ellipse) stay editable; images, vertical text and shapes with shadows or gradients are inserted as pictures. How it looks outside PowerPoint is unchecked (UNVERIFIED)
  - GIF plays each page for 2 seconds with its animations, up to 800 px on the long side
- **PDF import**: by default pages are imported with editable text, as a new design. Text becomes text boxes (vertical text becomes vertical text boxes), and shapes and images come in as a background image with the text removed. "Import as image" is also available. Pages with more than 3,000 text fragments (maps, drawings) and scanned PDFs become images. Typefaces are replaced with a similar Japanese/Latin font (not the original)

**Assets**
- About 131,000 icons and illustrations from 45 sets (MIT, Apache-2.0 and ISC only; licenses below)
- Fonts: all 1,950 Google Fonts families (68 with Japanese support), searchable from the font picker
- 870 patterns, gradients, blobs and decorations (made in-house)
- Photo search: Openverse and Wikimedia Commons (CC0 / public domain only), Picsum, and Unsplash / Pexels / Pixabay if you configure keys on the server version
- **Video and music**: place videos in a design (play, trim, mute, volume) and set one background track. Sources: videos from Wikimedia Commons (CC0 / public domain); music and sound effects from Openverse (CC0, public domain, CC BY; BY-SA, NC and ND are excluded and CC BY credits are shown); Pexels and Pixabay video only if a key is set on the server. Your own videos (mp4 / webm / mov) and audio (mp3 / m4a / wav / ogg) also work
- **Background removal** runs in the browser with an AI model (images are not uploaded; the model is downloaded on first use, about 98 MB with WebGPU or 192 MB with WASM)
- **It cannot generate images.** If you need one, create it with another image-generation service and import it

**HTML slides (imported from slide-studio)**
- Build slides from a script with an AI agent, then refine them in the browser. Presenter tools, notes and PDF export. Bundled under `public/slides/`

**AI agent integration (local server)**
- `npm run agent` starts a local server that treats the JSON files in `designs/` as designs. When an AI edits a file, the open browser tab updates immediately
- **One-click / copy registration** (the "AI agent connection" screen): deep links for Cursor and VS Code (Copilot); paste-ready commands for Claude Code, Codex CLI and Gemini CLI; JSON for Claude Desktop and for others (Windsurf, Cline, Zed, ...). 7 clients in total. The screen also shows whether an agent is connected
- **"Requests to the AI" board**: a person writes a request, the AI works on it, the AI runs a quality check (`check_design`), it waits for review, then the person **accepts** or sends it back for a **redo** (with instructions). Statuses: queued / AI working / awaiting review / done / redo / cancelled
- The design: a person only does three things, **(1) make the request, (2) confirm the facts** (prices, dates, names or anything the AI guessed), **(3) accept or redo**. Only a person can mark a request done; the AI never does
- The MCP server (`agent/mcp.mjs`) includes the tools `get_requests`, `update_request` and `check_design`; multi-page templates can be added in full
- For an example that hands everything over with Claude Code's `/loop`, the JSON format and MCP details, see the "division of work between people and AI" section of [AGENTS.md](AGENTS.md) (written in Japanese, with an English summary at the top). The AI side cannot generate images either

**Real-time collaborative editing (Cloudflare edition and the public demo; not available in the local `npm run agent` version)**
- "Start collaborating" in the Share menu creates an invite link. **Anyone with the link can edit**
- Synced per object. Other people's cursors, selection boxes and a participant list are shown, and Cmd+Z undoes only your own actions
- Images, videos and audio (up to 15 MB each) are shared in the room too. Limits: 20 people and 20 MB per room, up to 500 images etc. and 300 MB; a room is deleted automatically 30 days after its last activity. Each person also keeps a copy on their own device
- **Known limitation**: edits made while offline are overwritten by the room's content the next time you connect to it
- Built with Yjs + Durable Objects

**Cloudflare edition (optional)**
- Passkey / Google sign-in, cloud storage (D1 + R2), share links, real-time collaborative editing, photo-search proxy. Deploy to your own Cloudflare account: [docs/self-hosting.md](docs/self-hosting.md)

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

JSON files placed in or edited under `./designs/` show up in the browser. The "AI agent connection" screen registers the MCP server with your client in one click or one copy. For the JSON format, the MCP server and the division of work between people and AI, **see [AGENTS.md](AGENTS.md)**.

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
npx wrangler secret put PIXABAY_API_KEY
```

Details: **[docs/self-hosting.md](docs/self-hosting.md)**.

## Compared with Canva Pro

This is not a full replacement. Canva's features and pricing change, so treat this as a general comparison and check each vendor's official information.

| Category | What |
| --- | --- |
| **Covered by your AI subscription** | Generating copy and design drafts (the AI writes JSON), bulk text/color/size variations of an existing design, turning a script into slides, and the request-board flow of "ask, AI builds, quality check, person reviews". No extra service fee; it runs inside the AI agent plan you already have |
| **Free in the browser, no AI needed** | Background removal (in-browser AI model), magic resize, multiple brand kits, bringing your own fonts, 160 templates (including 60 multi-page sets), text effects, 16 blend modes, freehand drawing, photo collages, bulk color/font replacement, design check, transparent PNG, export to SVG / PDF / PowerPoint (.pptx) / GIF / video, PDF import (with editable text), placing videos and background music and exporting them, the phone layout, vertical text, version history, animation, QR codes, charts and tables, offline start (PWA) |
| **Not covered** | **Image generation** (Claude does not generate images; bring images from another generator), the volume of premium stock (larger than before, but still short of the scale of Canva's paid stock of photos, video and music), importing Canva files, and other Canva-specific features |

## Assets and licenses

- **Templates**: 100 single-page templates and 60 multi-page sets, all original to this project.
- **Icons / illustrations**: only sets under allowlisted licenses such as MIT and Apache-2.0 (`scripts/build-icons.mjs` rejects licenses outside its allowlist). See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
- **Photos**: Openverse and Wikimedia Commons (CC0 / public domain only), Picsum, and Unsplash / Pexels / Pixabay when keys are set (Pixabay Content License). Show credit for Unsplash / Pexels / Pixabay photos according to each provider's guidelines (the editor shows a "photo credit" chip).
- **Video and music**: videos from Wikimedia Commons (CC0 / public domain); music and sound effects from Openverse (CC0 / public domain / CC BY, with credit shown for CC BY). Check the rights to any material you import yourself.
- **Fonts**: loaded at runtime from Google Fonts (not bundled; OFL etc.).

## Development

```
agent/          Local server (reads/writes designs/ JSON, pushes changes to the browser, takes requests) and the MCP server (mcp.mjs)
docs/           Self-hosting guide, mobile app publishing steps (mobile-app.md), etc.
ios/ android/   Native app scaffolding (Capacitor)
public/icons/   Icon data (generated by npm run icons)
public/slides/  Imported HTML slide app (slide-studio)
scripts/        build-icons / sync-slide-studio / strip-wasm
src/            UI (Vite + React + TypeScript; rendering with fabric 7)
  api/          Storage switching (local/cloud) and API client
  components/   UI parts (Editor, Toolbar, LeftPanel, Download, Present, ...)
    mobile/     Phone layout (tool tabs, sheets, pinch gestures)
  collab/       Real-time collaborative editing (Yjs: sync, cursors, participants)
  data/         Templates (templates/ = single page, templateSets/ = multi-page), sizes, fonts, shapes, icon definitions
  features/     Text effects, blend modes, collage, brand kits, font import, pptx/GIF export, PDF import, video/BGM, bulk replace, design check
  editor/       Editor core (core, elements, resize, brand, animate, bgremove, vtext, repo, ...)
worker/         Optional Cloudflare Workers edition (auth, storage, sharing, photo proxy) + D1 migrations
  collab.ts     Collaboration room (Durable Objects)
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

[MIT](LICENSE) (c) 2026 いと. Third-party components: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
