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

## M3 — Mobile & PWA polish ☑

**Goal:** Playable one-handed on a phone, installable, works offline.

### Deliverables
- `src/input/TouchInput.ts` — on-screen buttons laid out with Phaser containers: ◀ ▼ ▶ on the bottom, A/B (rotate) on the right, Pause top-right.
- Responsive layout via Phaser's `Scale.FIT` (portrait-first); manifest locked
  to `orientation: portrait` for v1. Landscape reflow of the HUD is deferred
  as a future polish item.
- `src/services/PWAService.ts` — captures `beforeinstallprompt`, exposes
  `onAvailabilityChange`, surfaces an install CTA on the menu when Chrome
  offers one. SW registration itself is handled by `vite-plugin-pwa`.
- `src/services/HapticsService.ts` — thin wrapper over `navigator.vibrate`
  with a feature check. Runtime toggle on the menu; persistence lands with
  `StorageService` in M4.
- Service-worker precache includes the built JS/CSS/HTML and the manifest icons.
- Manifest: name, short_name, icons (192/512 PNG + maskable), theme + background color, `display: standalone`, `orientation: portrait`.

### DoD
- Game installs on Android Chrome and iOS Safari (add-to-home-screen).
- Airplane mode: app opens and plays fully.
- Haptics fire on: line clear, lock, game over (and are togglable).
- Touch controls are usable with either thumb, don't overlap the playfield.

---

## M4 — Meta (menu, pause, high scores, settings) ☑

**Goal:** A complete meta layer.

### Deliverables
- `MenuScene` — title, Start, Level Select, Settings, High Scores, Install (if available).
- `PauseScene` — overlay launched on top of `GameScene`, which is paused via
  `scene.pause()`. Held input state is reset on pause and input re-enabled on
  resume.
- `src/services/StorageService.ts` — `localStorage` wrapper with a typed schema
  under `tetris.v1.*`. Stores top-10 high scores (name + score + level + lines + date)
  and settings (haptics on/off, starting level, control layout: right/left-handed).
  The sound toggle will be wired when M5 lands.
- Initials entry on new high score (3-letter, NES-style) — keyboard types
  A–Z with auto-advance; touch taps a slot to cycle forward; arrows navigate.
- `SettingsScene` — haptics toggle, control layout toggle.
- `HighScoresScene` — top-10 list with a "NO SCORES YET" empty state.

### DoD
- Settings persist across reloads and across PWA re-opens.
- High scores appear on Menu and Game Over.
- Pausing works mid-lock-delay without losing state.

---

## M5 — Audio ☑

**Goal:** Sound effects + optional music, respecting mobile autoplay rules.

### Deliverables
- `src/services/AudioService.ts` — lightweight WebAudio wrapper. Lazy
  `AudioContext` unlocked on first pointerdown/keydown (satisfies iOS
  autoplay rules). SFX are synthesized on-the-fly (oscillator + gain
  envelope), so no asset preloading is required. `init()` is called
  once from `main.ts`.
- SFX for: move, rotate, soft drop (on press), lock, single/double/triple
  line clear, tetris (4-line, distinct arpeggio), level-up, game over.
- Music: skipped for v1 — the ROADMAP entry is deferred and can land as
  an asset-based addition later.
- SOUND toggle + VOLUME stepper (− / +, 10% steps) in `SettingsScene`,
  both persisted via `StorageService`.
- No `PreloadScene` asset work needed because audio is synthesized;
  unlock listener is wired in `main.ts`.

### DoD
- First audio plays on the first input (not on page load).
- Mute persists.
- No console errors on repeated scene restarts.

---

## M6 — Visual polish ☑

**Goal:** Replace geometry primitives with proper visuals. Add juice.

### Deliverables
- Block textures: generated at boot via `Graphics.generateTexture` into
  `block_<id>` keys with NES-style light top/left + dark bottom/right
  insets — no asset files needed, matches the synthesized-SFX approach.
  `BoardRenderer` swapped from `Rectangle` to `Image` pools.
- Particle burst on line clear via Phaser 4 `ParticleEmitter`, retextured
  to the piece that caused the clear and exploded once per cleared row.
- Screen shake on tetris (4-line clear) via `camera.shake`; softer shake
  on double / triple; none on single.
- CRT scanline overlay — horizontal pixel rows at 25% alpha, toggle in
  Settings.
- Reduced-motion setting + `prefers-reduced-motion` respect: when either
  is on, particles + shake are disabled.
- Deferred: dedicated tween-based drop/slide animations and Phaser 4
  background-glow filter. The NES block insets plus particles + shake
  already give the "alive" feel; the filter work is a worthwhile
  follow-up pass and a natural fit for M7 stretch.

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
