# CLAUDE.md — Project Rules for Claude Code

> **You are Claude Code working inside this repository.**
> Read this file first, every session. It is the source of truth for how this
> project is built, deployed, and tested. When in doubt, re-read it.

---

## 1. Project identity

- **Name:** Classic Tetris (working title)
- **Genre:** Falling-block puzzle, single-player
- **Target:** Browser game — desktop + mobile, installable as PWA, **fully offline, no backend**
- **License:** MIT (free to use, modify, redistribute)
- **Host:** GitHub Pages, served from the `docs/` folder on `main`
- **Ruleset:** Classic NES-style Tetris (no hold, no wall kicks, simple scoring).
  See `docs-dev/GAME-DESIGN.md` for the exact spec.

## 2. Stack (locked for v1)

| Concern       | Choice                                  |
|---------------|-----------------------------------------|
| Engine        | **Phaser 4** (`phaser@^4`)              |
| Language      | **TypeScript** (strict mode)            |
| Bundler       | **Vite**                                |
| Tests         | **Vitest**                              |
| Lint/Format   | ESLint + Prettier                       |
| PWA           | `vite-plugin-pwa` (Workbox)             |
| Haptics       | `navigator.vibrate` (progressive)       |
| Audio         | Phaser audio (Web Audio under the hood) |
| Deploy        | Manual — `npm run build` → `docs/` → commit → push |
| CI/CD         | **None.** Do not add GitHub Actions, Netlify, etc. |
| Backend       | **None.** Everything runs client-side. High scores live in `localStorage`. |

## 3. Non-negotiable rules (DOs and DON'Ts)

### DO

- **Read `docs-dev/ROADMAP.md` before picking up work.** Do the current milestone; do not leapfrog.
- **Keep `src/core/` engine-agnostic.** Pure TypeScript. No `import 'phaser'` under `src/core/`. This is what makes the game logic testable and replaceable.
- **Write unit tests for every pure function in `src/core/`** (scoring, gravity, RNG, board ops, tetromino rotations). These are the cheapest bugs to catch.
- **Use Phaser geometry primitives** (`Rectangle`, `Graphics`) for all visuals in Milestones 2–4. Real sprites come in Milestone 6.
- **Honor the NES ruleset** as documented. No hold. No SRS wall kicks. No T-spins. Original BPS scoring. See `docs-dev/GAME-DESIGN.md`.
- **Set the Vite `base` option** to match the GitHub Pages subpath (e.g. `/tetris-phaser/`) so assets resolve.
- **Build into `docs/`** (not `dist/`). This is what GitHub Pages serves.
- **Consult the Phaser 4 skills folder** (`node_modules/phaser/skills/`) when doing anything Phaser-specific. Phaser 4 shipped 28 skill files for AI agents — use them.
- **Consult this project's `.claude/skills/`** for Tetris-specific and deploy-specific guidance.
- **Run the verification chain** before claiming work is done: `npm run typecheck && npm run lint && npm run test && npm run build`.

### DON'T

- **Don't introduce a backend, auth, or network calls.** Offline-first is a hard constraint.
- **Don't add dependencies casually.** Each new dep inflates the PWA bundle and the offline cache. Justify every one.
- **Don't use Phaser 3 APIs.** If you see `setTintFill`, `Pipeline`, `FX`, or similar — that's Phaser 3. See `node_modules/phaser/skills/v3-to-v4-migration/SKILL.md`.
- **Don't touch `docs/` by hand.** It is a build artifact. The only way content lands there is `npm run build`.
- **Don't silently skip milestones.** If a milestone looks underspecified, say so and propose an addition to `ROADMAP.md` instead of improvising.
- **Don't reach for sprites, gradients, or FX during Milestones 2–4.** Visual juice is Milestone 6 work. Premature polish makes the core harder to debug.

## 4. Where things live

```
/
├── CLAUDE.md                   ← this file (start here)
├── README.md                   ← human-facing
├── LICENSE                     ← MIT
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── public/                     ← static assets copied verbatim (manifest, icons, sfx)
├── src/
│   ├── main.ts                 ← entry; builds the Phaser.Game
│   ├── config/                 ← game config, theme, control bindings
│   ├── core/                   ← ⚠ pure TS, no Phaser imports
│   ├── scenes/                 ← Phaser scenes
│   ├── renderers/              ← bridges core state → Phaser objects
│   ├── input/                  ← keyboard + on-screen buttons
│   ├── services/               ← audio, haptics, storage, PWA
│   └── types/
├── tests/
│   └── core/                   ← Vitest specs mirroring src/core/
├── docs/                       ← BUILD OUTPUT (GitHub Pages serves this)
├── docs-dev/                   ← developer docs (NOT served)
│   ├── ROADMAP.md
│   ├── ARCHITECTURE.md
│   ├── GAME-DESIGN.md
│   ├── CONVENTIONS.md
│   ├── TESTING.md
│   ├── DEPLOY.md
│   ├── AGENTS.md
│   ├── SKILLS.md
│   ├── PLUGINS.md
│   └── MCP.md
└── .claude/
    ├── settings.json
    ├── agents/                 ← custom subagents for this repo
    ├── commands/               ← slash commands (/verify, /build, /deploy, /milestone)
    └── skills/                 ← project-local skills (NES rules, GH Pages deploy)
```

## 5. The architecture rule of thumb

**Data flows in one direction:**

```
input → core (pure reducers) → state → renderer → Phaser GameObjects
```

- `src/core/` owns game state and rules. It exposes pure functions like `step(state, action) → newState`.
- `src/renderers/` reads state and updates `Phaser.GameObjects` imperatively. It never mutates state.
- Scenes orchestrate: they wire input to core, and pass state to the renderer every frame.

If you feel the urge to reach into a scene from core, or call Phaser APIs from core — stop. That is the architectural smell this rule exists to catch.

## 6. How to run / build / verify

```bash
npm install
npm run dev        # Vite dev server
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run test       # vitest run
npm run build      # vite build → docs/
npm run preview    # serve docs/ locally
```

Slash commands (see `.claude/commands/`):
- `/verify` — typecheck + lint + test + build
- `/build` — build only
- `/deploy` — build + git-commit `docs/` with a conventional message
- `/milestone <n>` — prints the current milestone's DoD from `ROADMAP.md`

## 7. When to ask, when to act

- **Act:** refactors within a module, adding tests, fixing obvious bugs, implementing items already specified in `ROADMAP.md` or `GAME-DESIGN.md`.
- **Ask:** scope changes, new dependencies, anything that would touch the public URL / PWA manifest, anything that would violate the rules in §3.

## 8. Commit style

Conventional Commits. Examples:
```
feat(core): implement NES randomizer with single retry
fix(scene/game): stop piece locking mid-DAS
docs(roadmap): mark M2 as complete
chore(build): refresh docs/ output
```

## 9. Further reading (in this repo)

- `docs-dev/ROADMAP.md` — what to build and in what order
- `docs-dev/ARCHITECTURE.md` — module boundaries, data flow
- `docs-dev/GAME-DESIGN.md` — NES rules, tables, scoring, speeds
- `docs-dev/CONVENTIONS.md` — code style, naming
- `docs-dev/DEPLOY.md` — manual GitHub Pages workflow
- `docs-dev/TESTING.md` — what we test and what we don't
- `docs-dev/AGENTS.md` — which subagents to use when
- `docs-dev/SKILLS.md` — which skills to reach for
- `docs-dev/PLUGINS.md` — Claude Code plugins we recommend
- `docs-dev/MCP.md` — MCP servers (optional)

---

*If anything in this file becomes stale as the project evolves, update it in the same PR as the change. This file is the contract.*
