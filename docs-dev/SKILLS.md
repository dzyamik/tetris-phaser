# SKILLS

Skills are folders of focused instructions Claude Code loads on demand. They compress domain knowledge (APIs, conventions, gotchas) into something an agent can consult without rereading the whole docs site.

This project uses three sources of skills.

---

## 1. Phaser 4's built-in skills (the big one)

Phaser 4 ships with **28 skill files** in `node_modules/phaser/skills/`. Once you `npm install phaser`, they're on disk — point Claude Code at them.

Key skills (partial list, names approximate to the actual folder names in the repo):

| Skill folder                  | Use when                                                      |
|-------------------------------|---------------------------------------------------------------|
| `game-setup-and-config/`      | Creating `Phaser.Game`, tuning `GameConfig`, scale options    |
| `scenes/`                     | Scene lifecycle, transitions, `launch` vs `start`             |
| `loading-assets/`             | Preloader patterns, asset keys, atlases                       |
| `game-objects/`               | Rectangles, Text, Containers, Sprites                         |
| `graphics/`                   | Drawing with `Graphics` — perfect for geometry-primitive Tetris |
| `input-keyboard-mouse-touch/` | Input handlers, key bindings, pointer events                  |
| `scale-and-responsive/`       | Fit / Resize / portrait / landscape                           |
| `audio/`                      | Phaser audio, mobile unlock, sprite audio                     |
| `tweens/`                     | Tweening for slide-drop, line-clear animation                 |
| `filters-and-postfx/`         | Phaser 4's new filter system (replaces v3 FX/pipelines)       |
| `cameras/`                    | Camera shake on tetris clears                                 |
| `v3-to-v4-migration/`         | Disambiguating old snippets and Stack Overflow answers        |
| `v4-new-features/`            | What's genuinely new in v4                                    |

**How to use them:** when a task involves a Phaser subsystem, read the corresponding `SKILL.md` before writing code. If you find yourself guessing at an API, you're doing it wrong — the skill file has the answer.

**Phaser 3 trap:** most of the internet is still Phaser 3. If code references `setTintFill`, `Pipeline`, `FX`, `Mesh`, or `Plane` — read `v3-to-v4-migration/SKILL.md` before pasting it in.

## 2. Plugin-provided skills (optional)

The `phaser4-gamedev` plugin adds its own skills covering init, scenes, game objects, physics, build, audio, animation, input, tilemap, and UI. See `PLUGINS.md` for install. These complement the Phaser 4 built-ins with opinionated workflow bundles — useful if you want slightly more prescriptive guidance.

## 3. Project-local skills (in `.claude/skills/`)

Tight, project-specific playbooks. Live in this repo; version-controlled.

### `tetris-nes-rules/`
Encodes the NES ruleset so Claude Code can't drift into SRS territory. Trigger: anything about gravity, rotation, scoring, randomizer, or level-up. Read this and `GAME-DESIGN.md` together.

### `pwa-gh-pages-deploy/`
Steps + gotchas for the manual GitHub Pages deploy. Trigger: "deploy", "build for production", manifest / service-worker questions, base-path confusion.

You can add more as patterns emerge. Good candidates:
- `phaser-geometry-rendering/` if the geometry-primitives work accumulates tricks worth remembering.
- `localstorage-schema/` when the storage schema gets non-trivial.

## Anatomy of a skill

```
.claude/skills/<skill-name>/
├── SKILL.md           ← frontmatter + prose instructions
└── references/        ← optional — supporting docs, tables, examples
```

`SKILL.md` frontmatter tells Claude Code when to load it:

```markdown
---
name: tetris-nes-rules
description: Rules, tables, and gotchas for the NES Tetris ruleset. Use when implementing or modifying gravity, rotation, line clears, scoring, randomizer, or level progression.
---

<instructions>
```

Keep each skill focused on one concern. If a skill file grows past ~500 lines, split it.

## When Claude Code should consult which

| Task                                         | Skills to read                                           |
|----------------------------------------------|----------------------------------------------------------|
| Implement `src/core/scoring.ts`              | `tetris-nes-rules` + `GAME-DESIGN.md §10-11`             |
| Wire keyboard input                          | Phaser `input-keyboard-mouse-touch/` + `CONVENTIONS.md`  |
| Build `BoardRenderer`                        | Phaser `graphics/` + `game-objects/`                     |
| Deploy to GitHub Pages                       | `pwa-gh-pages-deploy` + `DEPLOY.md`                      |
| Add particles for a tetris clear             | Phaser `game-objects/` (particles) + `tweens/`           |
| Debug why pieces stop moving on mobile       | Phaser `scale-and-responsive/` + `input-keyboard-mouse-touch/` |
| Migrate a Phaser-3 snippet found online      | Phaser `v3-to-v4-migration/`                             |
