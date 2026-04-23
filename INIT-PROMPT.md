# INIT-PROMPT.md

Paste this into Claude Code after you've completed [`SETUP.md`](./SETUP.md) through step 8. It tells Claude Code to finish Milestone 0 (bootstrap) and Milestone 1 (headless core with tests) — the two milestones that benefit most from being done in one coherent pass before you start iterating.

---

## The prompt

> Read `CLAUDE.md` and `docs-dev/ROADMAP.md` first, then proceed.
>
> **Task:** Complete Milestone 0 (Bootstrap) and Milestone 1 (Headless core logic) per `docs-dev/ROADMAP.md`. Do not leapfrog into M2 — stop once M1's Definition of Done is met.
>
> **Context you must use:**
> - `CLAUDE.md` — the rules (pure `src/core/`, no CI, deploy manually to `docs/`, no Phaser in core).
> - `docs-dev/ARCHITECTURE.md` — module layout and dependency rules.
> - `docs-dev/GAME-DESIGN.md` — the NES ruleset. Treat this as the spec for `src/core/`.
> - `docs-dev/CONVENTIONS.md` — code style, naming, discriminated unions, ESLint/Prettier.
> - `docs-dev/TESTING.md` — what's in-scope for tests (core only).
> - `.claude/skills/tetris-nes-rules/SKILL.md` — NES specifics condensed.
> - `.claude/skills/pwa-gh-pages-deploy/SKILL.md` — manifest, base-path, `.nojekyll`.
> - `node_modules/phaser/skills/` — once `npm install` has run, browse these Phaser 4 skills as needed, especially `game-setup-and-config/`, `scenes/`, and `scale-and-responsive/`.
>
> **Concrete steps:**
>
> 1. **Sanity-check the scaffold.** Confirm `package.json`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `.prettierrc`, `index.html`, `public/.nojekyll`, and `public/manifest.webmanifest` exist at the repo root. If any are missing or look off, stop and ask me. Do not silently regenerate them — they carry base-path and repo-name decisions I made.
>
> 2. **Install and verify.** Run `npm install` if `node_modules/` is absent. Confirm Phaser 4 is installed (`node_modules/phaser/package.json` version `^4`) and the 28 skill folders are present under `node_modules/phaser/skills/`.
>
> 3. **Milestone 0 — Bootstrap:**
>    - Create `src/main.ts` that creates a `Phaser.Game` with a single `BootScene` showing a solid background color (pick something from `src/config/theme.ts` — create that config file too).
>    - Create placeholder PWA icons if not already in `public/icons/` (192×192 and 512×512 PNG or SVG; solid-color squares are fine).
>    - Verify `npm run dev` opens the game and `npm run build` produces `docs/` with `index.html`, hashed assets, `.nojekyll`, and a service-worker file.
>    - Do **not** commit `docs/` yet — I'll do that myself after verifying.
>
> 4. **Milestone 1 — Headless core:**
>    - Implement `src/core/` in full: `tetromino.ts`, `board.ts`, `rng.ts`, `scoring.ts`, `gravity.ts`, `state.ts`, `actions.ts`. Follow `GAME-DESIGN.md` for every constant and table.
>    - **No imports from `phaser`** anywhere under `src/core/`. Verify with `grep -rn "phaser" src/core/ || echo CLEAN`.
>    - Write Vitest specs under `tests/core/` mirroring each module. Aim for ≥90% statement coverage on `src/core/**`.
>    - The NES randomizer's re-roll algorithm and the level-up formula are easy to get subtly wrong — write tests specifically for those edge cases.
>
> 5. **Finish by running `/verify`.** It should print all green.
>
> 6. **Update `docs-dev/ROADMAP.md`:** mark M0 and M1 as ☑, in the same commit(s) that finish them.
>
> **Rules to honor while working:**
> - Conventional Commits, small focused commits (not one giant "M0+M1 done" commit).
> - If you hit a spec ambiguity in `GAME-DESIGN.md`, stop and ask rather than guess.
> - If something tempts you to add a dependency not already in `package.json`, stop and ask.
> - Don't start M2 (scenes + keyboard + renderer) even if you finish early. Strengthen tests instead.
>
> When you're done, report: files created/modified, test count and coverage, and anything you noticed that should be adjusted in the docs for future milestones.

---

## After the prompt finishes

1. `npm run dev` and click around (there won't be gameplay yet — M2 adds that).
2. `npm run test` to confirm the core suite passes locally too.
3. `npm run build && git add docs/ && git commit -m "build: initial docs/ from M0" && git push`.
4. Visit your Pages URL. Empty scene, no 404s.

Then start Milestone 2 with a short prompt like:

> Read `CLAUDE.md`. Proceed with Milestone 2 per `docs-dev/ROADMAP.md`. Use Phaser geometry primitives only. Stop at M2's DoD.

From there, each milestone is its own short conversation.
