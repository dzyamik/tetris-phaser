# TESTING

**Scope:** We test `src/core/**` heavily. We do not unit-test Phaser scenes — too much mock, too little signal. Playtest for scene behavior; test core for rules.

---

## Tools

- **Vitest** — fast, Vite-native, TS-aware.
- **No Playwright / no headless browser** in v1. Keep the test surface small.

## Directory

Tests mirror `src/`:

```
src/core/scoring.ts
src/core/rng.ts
tests/core/scoring.test.ts
tests/core/rng.test.ts
```

You can also colocate (`scoring.ts` next to `scoring.test.ts`) — pick one and stay consistent.

## What to test

### Must test

- **Every pure function in `src/core/`.**
- **The reducer** for every action under representative states (empty board, near top-out, piece blocked, full row).
- **Gravity speed table** — assert each level returns the expected frames/cell.
- **NES randomizer** — with a fixed seed, the sequence is deterministic and bounded (no piece ID outside 0..6).
- **Scoring edges** — level-up threshold (first transition formula), soft-drop bonus awarded only on lock, tetris multiplier.
- **Line clears** — 1, 2, 3, 4 lines at once; non-contiguous clears; top rows backfilled with empty.

### Should test

- **Rotation invariants** — a piece rotated 4 times lands in its original orientation.
- **Collision & wall blocks** — rotations that fail (no wall kicks) leave the piece untouched.

### Shouldn't test

- Phaser scene lifecycle (fragile, low value).
- Rendering output.
- Keyboard event wiring (trust Phaser + manual QA).

## Pattern: property-based for the randomizer

Not required, but cheap win. With a fixed seed, generate 10,000 pieces and assert:

- All IDs are in `0..6`.
- No ID appears more than N in a row (N depends on the NES algorithm's worst case).
- Distribution is roughly uniform over a large sample.

## Determinism

- Pass a seed into every core function that needs randomness. **Never** call `Math.random()` in `src/core/**`.
- The reducer takes the full `GameState` — no hidden inputs.
- Consequence: given `(state, actions[])`, the resulting state is identical across runs. This makes replays and regression tests trivial.

## Running tests

```bash
npm run test           # single run
npm run test:watch     # watch mode
npm run test -- --coverage
```

## CI lane

Not set up (no CI/CD). Tests are expected to be run locally (and by Claude Code via `/verify`) before committing.
