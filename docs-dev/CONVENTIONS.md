# CONVENTIONS

Small set of rules. Enforced by ESLint/Prettier/tsc where possible, otherwise by habit.

---

## Language

- **TypeScript** everywhere. No `.js` in `src/` or `tests/`.
- `"strict": true` in `tsconfig.json`. Also enable `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- **No `any`.** Prefer `unknown` + narrowing. Escape hatch: `// @ts-expect-error <reason>` with a reason, reviewed case by case.
- **No default exports** in `src/core/**` or `src/services/**` — they make renames tougher and grep less reliable. Phaser scenes *may* use a default export since some tools expect it.

## Files & naming

| Kind             | Style         | Example                         |
|------------------|---------------|---------------------------------|
| Class / Scene    | PascalCase    | `GameScene`, `BoardRenderer`    |
| Type / interface | PascalCase    | `GameState`, `PieceId`          |
| Function / var   | camelCase     | `nextPiece`, `framesPerCell`    |
| Constant         | UPPER_SNAKE   | `DAS_INITIAL_FRAMES`            |
| File             | kebab-case for modules, PascalCase for scene/class files | `game-design.md`, `GameScene.ts` |
| Test file        | `<subject>.test.ts` colocated or mirrored under `tests/` | `scoring.test.ts`        |

Pick one and stay consistent within a folder.

## Imports

- Absolute imports via tsconfig paths: `@/core/scoring` instead of `../../core/scoring`.
- Group order: Node built-ins → third-party → `@/...` → relative → types.
- Type-only imports: `import type { GameState } from '@/core/state';` — cheaper for the bundler.

## TypeScript patterns we prefer

- **Discriminated unions for actions and state phases.**
  ```ts
  type Action =
    | { type: 'MoveLeft' }
    | { type: 'MoveRight' }
    | { type: 'Rotate'; dir: 'cw' | 'ccw' }
    | { type: 'SoftDrop'; held: boolean }
    | { type: 'Tick' };
  ```
- **`Readonly<T>` / `ReadonlyArray<T>`** in core state. Mutation is the enemy of replay.
- **Exhaustiveness checks** on switch statements:
  ```ts
  function reducer(state: GameState, a: Action): GameState {
    switch (a.type) {
      case 'MoveLeft':  return move(state, -1);
      case 'MoveRight': return move(state,  1);
      // ...
      default: {
        const _exhaustive: never = a;
        return _exhaustive;
      }
    }
  }
  ```

## Phaser patterns

- One scene per file, default-exported only from the scene file itself.
- Never call `scene.scene.start(X)` from inside the scene's `create` — do it from event handlers.
- Pool `GameObjects` that repeat (board cells, particles). Don't create-and-destroy per frame.
- Use `Phaser.AUTO` for the renderer type; Phaser picks WebGL with a Canvas fallback.
- **Don't issue raw `gl` calls.** In Phaser 4 you can break the render-node state. If you truly need it, use an `Extern` GameObject — see `node_modules/phaser/skills/v3-to-v4-migration/SKILL.md`.

## Error handling

- In `core/**`: prefer returning a `{ ok: true, value } | { ok: false, reason }` shape over throwing. Makes branching explicit.
- In scenes/services: throw for programmer errors (invalid state), return `null`/sentinel for expected-empty (e.g., no high scores yet).

## Comments

- Prefer code that needs no comment. When you do comment:
  - Explain *why*, not *what*.
  - Reference NES specifics by section in `GAME-DESIGN.md`: `// see GAME-DESIGN §5 (gravity)`.

## Commits

Conventional Commits. Types we use:
- `feat` — new user-visible feature
- `fix` — bug fix
- `chore` — tooling, deps, non-user-visible
- `refactor` — no behavior change
- `test` — tests only
- `docs` — doc updates
- `build` — build/deploy artifacts (use for `docs/` refreshes)

Scope is the module: `core`, `scene/game`, `input`, `services/audio`, `build`, etc.

## Forbidden

- `console.log` in committed code. Use a lightweight `logger` (even just a wrapper you can silence) if needed.
- `setTimeout` / `setInterval` for game logic — use Phaser's time or your reducer's tick.
- Global mutable state outside scenes. If you need a store, wire it through the reducer.
- New dependencies without discussion. Bundle size matters for offline-first.
