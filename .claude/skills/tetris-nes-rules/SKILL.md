---
name: tetris-nes-rules
description: Rules, tables, and gotchas for the NES Tetris ruleset. Load when implementing or modifying gravity, rotation, line clears, scoring, the randomizer, DAS/ARR, or level progression in src/core/**.
---

# NES Tetris rules — condensed

Authoritative spec is `docs-dev/GAME-DESIGN.md`. This file is the high-density version to keep in context while writing `src/core/**`.

---

## Playfield

- **10 × 20** visible, **22 rows** total (2 hidden rows above for spawning).
- Row 0 top, row 21 bottom. Column 0 left.
- Spawn places the piece's bounding-box top at row 0. If that position overlaps an existing block → top-out (game over).

## Pieces

Seven IDs: `I, O, T, S, Z, J, L`. Store rotations as explicit offset tables (4 states each: `0/R/2/L`), not by runtime matrix math. Example for T:

```
rotation 0 (spawn):  (-1, 0) (0, 0) (1, 0) (0, 1)
rotation 1 (R):      (0, -1) (0, 0) (0, 1) (1, 0)
rotation 2 (2):      (-1, 0) (0, 0) (1, 0) (0, -1)
rotation 3 (L):      (0, -1) (0, 0) (0, 1) (-1, 0)
```

Work out all 7 pieces and lock them into `src/core/tetromino.ts`. Color is a **render** concern — keep it in `src/config/theme.ts`, not in `core/`.

## Rotation

- **No wall kicks, no floor kicks, no SRS.**
- A button = CW, B button = CCW.
- If a rotation would cause overlap or exit the playfield, it simply **fails** (piece stays put).

## DAS — Delayed Auto Shift (60 fps)

- Initial delay: **16 frames** (~266 ms)
- Auto-repeat: **6 frames** (~100 ms)

Implement in the reducer, not in the input layer:

```
on Tick when das.dir !== 0:
  das.frames++
  if das.frames === 16: emit Move(das.dir)
  elif das.frames > 16 and (das.frames - 16) % 6 === 0: emit Move(das.dir)
```

Reset `das.frames = 0` on direction change and on release.

## Gravity (frames per cell)

| Level | F/cell |  | Level | F/cell |
|-------|--------|--|-------|--------|
| 0     | 48     |  | 10–12 | 5      |
| 1     | 43     |  | 13–15 | 4      |
| 2     | 38     |  | 16–18 | 3      |
| 3     | 33     |  | 19–28 | 2      |
| 4     | 28     |  | 29+   | 1      |
| 5     | 23     |  |       |        |
| 6     | 18     |  |       |        |
| 7     | 13     |  |       |        |
| 8     | 8      |  |       |        |
| 9     | 6      |  |       |        |

## Randomizer (NES pseudo-random with one retry)

Not a 7-bag. Algorithm:

1. Pick `r ∈ [0, 7]` (inclusive — that's **8** values).
2. If `r === 7` OR `r === previousPiece`, re-roll once: pick a fresh `r ∈ [0, 6]`.
3. Return `r` (0..6).

This gives the characteristic NES drought feeling. Seed the underlying PRNG (Mulberry32 is fine) — **no `Math.random()` in `src/core/`**.

## Soft drop

- Down held → piece drops 1 cell per frame (gravity override).
- **+1 point per cell** dropped, awarded on lock.
- Release-and-repress semantics: reset `softDropCells = 0` on release.
- Soft drop does **not** instant-lock — holding into empty space just drops.

## Locking

- **No lock delay.** As soon as a downward Tick fails, the piece locks.
- On lock: update board, clear lines, award score, maybe level up, spawn next.

## Line clears

- 1 / 2 / 3 / 4 cleared rows = Single / Double / Triple / **Tetris**.
- Rows above the cleared ones shift down; empty rows appear at top.

## Scoring (BPS / "Original")

`n` is level at the time of clear (0-indexed):

| Clear  | Points         |
|--------|----------------|
| Single | 40 × (n + 1)   |
| Double | 100 × (n + 1)  |
| Triple | 300 × (n + 1)  |
| Tetris | 1200 × (n + 1) |

Plus soft-drop bonus. **No** combo, **no** back-to-back, **no** T-spin.

## Level progression

- Level select 0–9 at game start.
- **First transition** lines threshold:
  ```
  min(startLevel * 10 + 10,  max(100, startLevel * 10 - 50))
  ```
  (start 0 → 10 lines · start 9 → 100 lines · start 15 → 100 lines)
- Subsequent: every **10** lines.
- Gravity caps at the L29+ speed (kill screen).

## Explicitly out of scope (v1)

These are deliberately not in the ruleset:

- Hold piece
- SRS / wall kicks / floor kicks
- T-spins, back-to-back, combos
- 7-bag randomizer
- Hard drop
- Lock delay / extended placement

Ghost piece **is optional** (default on, togglable in settings) — it's a quality-of-life exception.

## Common mistakes to avoid

- Implementing "up arrow = hard drop" out of muscle memory — NES has no hard drop. Up is a no-op.
- Writing the randomizer as a 7-bag because it's what "modern Tetris" does. The NES drought is the feature.
- Computing rotations with matrix math at runtime instead of table lookups.
- Using `Math.random()` — breaks determinism, replays, and tests.
- Putting DAS in the input layer — it belongs in the reducer so it's testable and deterministic.
- Forgetting the special first-level-up formula and using a plain `(lines >= (level+1)*10)` rule.
