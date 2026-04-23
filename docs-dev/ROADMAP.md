# ROADMAP

Phased plan. Each milestone has **Goals → Deliverables → Definition of Done (DoD)**.
Do them in order. Do not leapfrog. If you finish early, strengthen tests.

Legend: ☐ not started · ⧗ in progress · ☑ done

---

## M0 — Bootstrap ☑

**Goal:** An empty Phaser 4 scene renders and deploys to GitHub Pages.

### Deliverables
- `package.json` with Phaser 4, Vite, TypeScript, Vitest, ESLint, Prettier, `vite-plugin-pwa`.
- `vite.config.ts` with `base` set to the repo subpath and `build.outDir = 'docs'`.
- `tsconfig.json` strict, ES2022, bundler resolution.
- `eslint.config.js`, `.prettierrc`.
- `index.html` with a `<div id="game">` mount point.
- `src/main.ts` creating a `Phaser.Game` that shows a single empty scene filled with a background color.
- `public/manifest.webmanifest`, placeholder PWA icons (solid-color SVGs are fine).
- `README.md` setup steps verified end-to-end.
- `.gitignore`, `.nojekyll` file in `public/` (so GitHub Pages doesn't run Jekyll).

### DoD
- `npm run dev` opens the game in a browser.
- `npm run build` produces `docs/index.html` + assets.
- After `git push`, GitHub Pages serves the game at the repo URL.
- Lighthouse PWA check passes (installable, offline shell loads).
- Game loads from the installed PWA with no network.

---

## M1 — Headless core logic ☑

**Goal:** The entire game rules engine, with zero Phaser involvement, covered by tests.

### Deliverables under `src/core/`
- `tetromino.ts` — 7 pieces (I, O, T, S, Z, J, L) with rotation matrices per NES spec.
- `board.ts` — 10×20 visible playfield (+2 hidden rows for spawning), pure operations:
  `isValidPosition(board, piece, pos, rot) → boolean`,
  `lockPiece(board, piece, pos, rot) → board`,
  `clearLines(board) → { board, linesCleared }`.
- `rng.ts` — NES randomizer (see `GAME-DESIGN.md §6`). Seedable for testing.
- `scoring.ts` — BPS scoring: 40 / 100 / 300 / 1200 × (level+1), +1 per soft-drop cell.
- `gravity.ts` — NES speed table (frames per cell per level).
- `state.ts` — the canonical `GameState` type + a pure `reducer(state, action) → state`.
- `actions.ts` — action union: `MoveLeft`, `MoveRight`, `SoftDrop`, `RotateCW`, `RotateCCW`, `Tick`, `Lock`, `Reset`.

### Tests under `tests/core/`
- Every file above has at least one `.test.ts`.
- Coverage target: ≥90% statements for `src/core/**`.

### DoD
- `npm run test` passes.
- `src/core/**` contains zero `from 'phaser'` imports (grep-verified; enforce in CI lane or pre-commit hook).
- You can play a full game in a Node REPL by calling `reducer` repeatedly — no Phaser required.

---

## M2 — Minimal playable (keyboard, geometry primitives) ☑

**Goal:** A real game, ugly but correct. Desktop only is fine.

### Deliverables
- Scenes:
  - `BootScene` — sets scale + input defaults, transitions to Preload.
  - `PreloadScene` — placeholder (no assets yet; used later).
  - `GameScene` — owns the `GameState`, runs the reducer loop, hands state to the renderer.
  - `GameOverScene` — shows final score, prompts restart.
- `src/renderers/BoardRenderer.ts` — draws the playfield grid, locked blocks, active piece, and ghost piece using `Phaser.GameObjects.Graphics`. One color per piece type.
- `src/input/KeyboardInput.ts` — maps arrow keys + Z/X (rotate) + Enter (start) to core actions.
- HUD with score, lines, level drawn with `Phaser.GameObjects.Text`.
- DAS/ARR emulation matching NES handling (16f initial delay, 6f repeat).
- Level select on game start (0–9).
- Minimal in-scene pause (P / Esc / on-screen button). Full `PauseScene` with menu
  options is deferred to M4.

### DoD
- A player can start, play, lose, and restart a full NES-style game at any starting level.
- Scoring, line clears, and level progression match the spec.
- No sprites, no audio yet.

---

## M3 — Mobile & PWA polish ☐

**Goal:** Playable one-handed on a phone, installable, works offline.

### Deliverables
- `src/input/TouchInput.ts` — on-screen buttons laid out with Phaser containers: ◀ ▼ ▶ on the bottom, A/B (rotate) on the right, Pause top-right.
- Responsive layout via Phaser's `Scale.FIT` (portrait-first); HUD reflows for landscape.
- `src/services/PWAService.ts` — registers the service worker via `vite-plugin-pwa`, exposes an `onInstallPrompt` hook, shows an install CTA on the menu.
- `src/services/HapticsService.ts` — thin wrapper over `navigator.vibrate` with a feature check; settings toggle.
- Service-worker precache includes the built JS/CSS/HTML and the manifest icons.
- Manifest: name, short_name, icons (192/512 PNG + maskable), theme + background color, `display: standalone`, `orientation: portrait`.

### DoD
- Game installs on Android Chrome and iOS Safari (add-to-home-screen).
- Airplane mode: app opens and plays fully.
- Haptics fire on: line clear, lock, game over (and are togglable).
- Touch controls are usable with either thumb, don't overlap the playfield.

---

## M4 — Meta (menu, pause, high scores, settings) ☐

**Goal:** A complete meta layer.

### Deliverables
- `MenuScene` — title, Start, Level Select, Settings, Install (if available).
- `PauseScene` — overlay on top of `GameScene`; pauses the reducer loop.
- `src/services/StorageService.ts` — `localStorage` wrapper with a typed schema. Stores: top 10 high scores (name + score + level + lines + date), settings (sound on/off, haptics on/off, starting level, control layout: left/right-handed).
- Initials entry on new high score (3-letter, NES-style).
- Settings screen wired to services.

### DoD
- Settings persist across reloads and across PWA re-opens.
- High scores appear on Menu and Game Over.
- Pausing works mid-lock-delay without losing state.

---

## M5 — Audio ☐

**Goal:** Sound effects + optional music, respecting mobile autoplay rules.

### Deliverables
- `src/services/AudioService.ts` wrapping Phaser audio. Handles the first-touch unlock on iOS.
- SFX for: move, rotate, soft-drop tick, lock, line clear (distinct for tetris), level-up, game over.
- Looping music track (CC0/CC-BY or originals) with a mute toggle.
- Volume sliders in Settings.
- Preloaded in `PreloadScene`.

### DoD
- First audio plays on the first input (not on page load).
- Mute persists.
- No console errors on repeated scene restarts.

---

## M6 — Visual polish ☐

**Goal:** Replace geometry primitives with proper visuals. Add juice.

### Deliverables
- Block spritesheet (one sprite per piece type, with a light/dark inset for the NES look).
- Particle burst on line clear.
- Screen shake on tetris (4-line clear).
- Phaser 4 **filters** for background glow (use Phaser 4's unified filter system; see `node_modules/phaser/skills/filters-and-postfx/SKILL.md`).
- Tween-based slide/drop animations.
- Optional: CRT scanline overlay (toggleable).

### DoD
- Game feels responsive and alive. Frame budget stays under 16ms on a mid-range Android.
- All visuals remain toggleable ("reduced motion" setting respects `prefers-reduced-motion`).

---

## M7 — Optional / stretch ☐

Pick any, none are required:
- **Colorblind palette** and **high-contrast** mode.
- **Additional game modes:** Sprint (40 lines), Ultra (2 min), Zen (no game over).
- **Replay/rewind** (serialize actions, replay deterministically — the RNG is already seedable).
- **Theme packs** (gameboy, NES, neon).
- **Leaderboard** — only if you keep it offline (shared screen / QR code passing).
- **Accessibility:** screen-reader-friendly menu, key remapping.

---

## Working the roadmap with Claude Code

- Use `/milestone <n>` to get the DoD for milestone *n* printed into context.
- When a milestone's DoD is met, update the ☐ → ☑ in this file in the same commit that finishes it.
- If reality disagrees with the plan, **amend this file** — don't drift silently.
