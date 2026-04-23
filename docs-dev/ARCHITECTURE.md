# ARCHITECTURE

The single most important idea in this repo: **game rules live in pure TypeScript, engine concerns live in Phaser.** Everything else follows from that.

---

## 1. Layers

```
┌─────────────────────────────────────────────────────────────┐
│  Phaser 4 runtime                                           │
│                                                             │
│  ┌──────────────┐   ┌───────────────┐   ┌──────────────┐    │
│  │   Scenes     │◄──│   Renderers   │◄──│    Input     │    │
│  │ (orchestrate)│   │ (state → GOs) │   │ (events→     │    │
│  │              │   │               │   │   actions)   │    │
│  └──────┬───────┘   └───────▲───────┘   └──────┬───────┘    │
│         │                   │                  │            │
│         │ reads/dispatches  │ reads state      │ emits      │
│         ▼                   │                  ▼            │
│  ┌──────────────────────────┴──────────────────────────┐    │
│  │                                                     │    │
│  │   src/core/  ← pure TypeScript, no phaser import    │    │
│  │                                                     │    │
│  │   state.ts       reducer(state, action) → state     │    │
│  │   actions.ts     typed action union                 │    │
│  │   board.ts       playfield ops                      │    │
│  │   tetromino.ts   shapes + rotations                 │    │
│  │   rng.ts         seedable NES randomizer            │    │
│  │   scoring.ts     BPS scoring                        │    │
│  │   gravity.ts     NES speed table                    │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Services (side effects): AudioService, HapticsService,     │
│  StorageService, PWAService                                 │
└─────────────────────────────────────────────────────────────┘
```

## 2. Dependency rules

These are enforced by convention (and optionally by an ESLint rule on `no-restricted-imports`):

| From            | May import                                    | Must NOT import                    |
|-----------------|-----------------------------------------------|------------------------------------|
| `src/core/**`   | Other `core/**` modules, standard lib         | `phaser`, scenes, renderers, services |
| `src/renderers/**` | `phaser`, `core/**` (read-only types)     | Scenes, input, services            |
| `src/scenes/**` | `phaser`, `core/**`, `renderers/**`, `input/**`, `services/**` | Other scenes' internals |
| `src/input/**`  | `phaser`, `core/**` (action types only)       | Renderers, scenes                  |
| `src/services/**` | Standard web APIs, `core/**` (types only)   | `phaser`                           |

Rationale: **`core/**` can be tested in Node, ported to a web worker, or replaced by a different renderer entirely.** Once core leaks into Phaser, this property is gone.

## 3. The frame loop

In `GameScene.update(_, deltaMs)`:

```
1. drain input → Action[]
2. for each action:   state = reducer(state, action)
3. accumulate time; if gravity timer elapsed → reducer(state, { type: 'Tick' })
4. BoardRenderer.render(state)
5. HUDRenderer.render(state)
```

Reducer is synchronous. Scenes don't own state — they host it and hand it around. This keeps time-travel debugging, replay, and tests trivial.

## 4. State shape (sketch)

```ts
type GameState = {
  readonly phase: 'idle' | 'spawning' | 'falling' | 'locking' | 'clearing' | 'over';
  readonly board: ReadonlyArray<ReadonlyArray<PieceId | 0>>;  // 22 rows × 10 cols
  readonly active: {
    readonly id: PieceId;
    readonly rotation: 0 | 1 | 2 | 3;
    readonly row: number;
    readonly col: number;
  } | null;
  readonly next: PieceId;                       // NES shows only the next piece
  readonly score: number;
  readonly lines: number;
  readonly level: number;
  readonly startLevel: number;
  readonly gravityCounter: number;              // frames since last gravity step
  readonly das: { dir: -1 | 0 | 1; frames: number };
  readonly softDropCells: number;               // running count for scoring
  readonly rngState: RngState;                  // seedable
  readonly lastClear?: { count: 1|2|3|4; rows: number[] };  // for animation/audio
};
```

Immutable, serializable, replayable. If you ever want "watch a replay," serialize the action log + initial seed.

## 5. Scenes

| Scene         | Owns                                                | Transitions to        |
|---------------|-----------------------------------------------------|-----------------------|
| `BootScene`   | Scale manager config, input setup                   | `PreloadScene`        |
| `PreloadScene`| Asset loading (empty in M2, real in M5/M6)          | `MenuScene`           |
| `MenuScene`   | Title, level select, settings, install CTA          | `GameScene`           |
| `GameScene`   | `GameState`, reducer loop, input drain, HUD         | `PauseScene`, `GameOverScene` |
| `PauseScene`  | Overlay; freezes GameScene                          | `GameScene`, `MenuScene` |
| `GameOverScene` | Final score + initials entry                      | `MenuScene`           |

Phaser tip: `GameScene.scene.launch('PauseScene')` runs Pause on top while Game is paused via `scene.pause()`. On resume, `GameState` is untouched.

## 6. Renderers

One rule: **a renderer reads state, owns GameObjects, and never mutates state.**

`BoardRenderer` internals:

```
- grid: Phaser.GameObjects.Graphics (drawn once at init, redrawn on resize)
- cells: GameObjects.Rectangle[22][10]  ← pooled, recolored each frame
- active: GameObjects.Rectangle[4]      ← positioned each frame
- ghost: GameObjects.Rectangle[4]       ← lower alpha, at drop destination
```

At M6 these Rectangles become Sprites from a spritesheet. The interface doesn't change — the renderer does.

## 7. Input

`src/input/InputBus.ts` is a tiny pub/sub: inputs push `Action`s, `GameScene` drains the queue each tick. `KeyboardInput` and `TouchInput` both publish to it, so the game doesn't care which one fired.

DAS/ARR is implemented **inside the reducer**, not inside the input layer. The input layer only reports "left is held / released" — the reducer decides if that should emit a move this frame. This keeps input deterministic and testable.

## 8. Services

Services are side-effect wrappers. They are called from scenes, never from `core/**`.

- `AudioService` — preload, play, mute. Handles iOS unlock-on-first-touch.
- `HapticsService` — `navigator.vibrate` with feature detection and settings gate.
- `StorageService` — `localStorage` with a versioned schema (`tetris.v1.*` keys).
- `PWAService` — SW registration + `beforeinstallprompt` capture.

## 9. Offline / PWA

- `vite-plugin-pwa` generates the service worker. Strategy: **precache all built assets**, `NetworkOnly` for nothing (there is no network).
- `public/manifest.webmanifest` is the manifest.
- `public/.nojekyll` prevents GitHub Pages from running Jekyll and dropping `_*` files.
- `index.html` references the manifest and icons.

## 10. What this architecture buys you

- **Replaceable renderer.** Swap Phaser for PixiJS, or write a CLI renderer for tests.
- **Deterministic replays.** Seeded RNG + action log = exact reproduction.
- **Fast tests.** Vitest runs `src/core/**` in milliseconds, no headless browser.
- **Feature flags are cheap.** You can add a "modern SRS" ruleset later by introducing a `rules: Ruleset` param to the reducer and keeping the NES one as the default.

## 11. What this architecture costs

- A bit more indirection than a "just use Phaser" approach.
- You'll occasionally want to shortcut from a scene into state mutation; resist. Use an action.

That's the whole architecture. Re-read this file if you catch yourself fighting the structure.
