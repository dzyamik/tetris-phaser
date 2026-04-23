# Classic Tetris

A classic NES-style Tetris you can play in your browser, install as a PWA, and play fully offline. No backend, no accounts, no ads.

Built with **Phaser 4** and **TypeScript**, deployed manually to **GitHub Pages**.

---

## Features (v1)

- Classic NES ruleset: simple scoring, no wall kicks, no hold, NES randomizer.
- Keyboard on desktop, on-screen buttons on mobile.
- Fully offline after first load (PWA + service-worker precache).
- Haptic feedback on supported devices.
- Synthesized SFX (WebAudio) — no audio assets needed.
- NES-style block insets, particle bursts on line clears, screen shake on tetris.
- Reduced-motion + scanline toggles in Settings.
- Local high-score board (top 10, stored in `localStorage`).

## Quick start (for developers)

```bash
npm install
npm run dev        # start dev server
npm run build      # build to docs/ for GitHub Pages
npm run preview    # preview the built output locally
npm run test       # run unit tests
npm run typecheck
npm run lint
```

See [`docs-dev/`](./docs-dev/) for the full architecture, roadmap, game design, and deploy docs.

## Controls

### Desktop
- **← →** move
- **↓** soft drop
- **Z** rotate counter-clockwise (B button)
- **X** rotate clockwise (A button)
- **P** / **Esc** pause / resume

### Mobile
- Bottom-left D-pad: ◀ move left · ▼ soft drop · ▶ move right
- Bottom-right: **B** rotate CCW · **A** rotate CW
- Top-right: **PAUSE** button
- Left/right-handed swap in **Settings** (mirrors the two groups).

## Deploying

This project has **no CI/CD** by design. Deploys are deliberate:

```bash
npm run build
git add docs/
git commit -m "build: refresh docs/"
git push
```

GitHub Pages serves `docs/` on `main`. See [`docs-dev/DEPLOY.md`](./docs-dev/DEPLOY.md).

## Project layout

```
src/
├── main.ts          entry
├── core/            pure TypeScript game logic (no Phaser)
├── scenes/          Phaser scenes
├── renderers/       state → Phaser GameObjects
├── input/           keyboard + touch
├── services/        audio, haptics, storage, PWA
└── config/          theme, controls
docs/                ← build output, served by GitHub Pages
docs-dev/            ← project documentation
.claude/             ← Claude Code config (agents, commands, skills)
```

## License

MIT — see [`LICENSE`](./LICENSE). Free to use, modify, redistribute.

## Credits

- [Phaser 4](https://phaser.io/) — the engine.
- [Vite](https://vitejs.dev/), [Vitest](https://vitest.dev/), [vite-plugin-pwa](https://vite-pwa-org.netlify.app/).
- NES Tetris ruleset — credit to BPS and Nintendo for the original design; this is an independent implementation.
