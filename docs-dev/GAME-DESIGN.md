# GAME DESIGN — Classic NES Tetris

This is the **spec** the core engine implements. When behavior and this file disagree, fix the code, not the file (unless we consciously choose to deviate and update the doc).

---

## 1. Playfield

- **Visible area:** 10 columns × 20 rows.
- **Total buffer:** 22 rows (2 hidden at the top used for spawning).
- **Coordinates:** row 0 at the top, row 21 at the bottom. Column 0 on the left.
- **Spawn:** new piece appears so that its bounding-box top is in row 0 (hidden). First gravity tick moves it into row 1 / 2. If the spawn position overlaps occupied cells, the game ends ("top-out").

## 2. Pieces (tetrominoes)

Seven pieces, NES names + colors (any consistent palette is fine; we suggest the NES palette as a reference):

| ID | Name | Shape (spawn) | Suggested color (hex)    |
|----|------|---------------|--------------------------|
| I  | I    | ▆▆▆▆          | cyan `#00ffff`           |
| O  | O    | ▆▆ / ▆▆       | yellow `#ffff00`         |
| T  | T    | ▆▆▆ / ▯▆▯     | purple `#aa00ff`         |
| S  | S    | ▯▆▆ / ▆▆▯     | green `#00ff00`          |
| Z  | Z    | ▆▆▯ / ▯▆▆     | red `#ff0000`            |
| J  | J    | ▆▯▯ / ▆▆▆     | blue `#0000ff`           |
| L  | L    | ▯▯▆ / ▆▆▆     | orange `#ff7f00`         |

Color is a rendering concern; keep it in `src/config/theme.ts`, not in `core/`.

## 3. Rotation

**NES rotation system. No wall kicks.** If a rotation would cause an overlap or exit the playfield, the rotation simply fails — the piece stays in its current orientation.

- **A button → rotate clockwise** (CW)
- **B button → rotate counterclockwise** (CCW)

Both directions are supported even though NES purists can argue either way. Rotations are defined by per-piece rotation matrices (4 states: 0/R/2/L). Store them as explicit coordinate offsets rather than computing rotations at runtime — it's simpler and the tables are tiny.

Example for T piece (offsets of the 4 minos relative to piece origin).
Coordinates are `(col, row)` with `+row = down` (same convention as the board).
Rotation index advances on CW (A button): `0 → 1 → 2 → 3 → 0`. Visually the stem
cycles `DOWN → LEFT → UP → RIGHT`:

```
rotation 0 (spawn, stem DOWN):  (-1, 0) (0, 0) (1, 0) (0, 1)
rotation 1 (CW, stem LEFT):     (0, -1) (0, 0) (0, 1) (-1, 0)
rotation 2 (stem UP):           (-1, 0) (0, 0) (1, 0) (0, -1)
rotation 3 (CCW, stem RIGHT):   (0, -1) (0, 0) (0, 1) (1, 0)
```

Work these out for all 7 pieces and lock them in a table in `src/core/tetromino.ts`.
The implementation derives rotations 1–3 from rotation 0 by applying the CW transform
`(c, r) → (-r, c)` three times — this keeps the 28 offsets consistent by construction.

## 4. Movement

- **Left / Right:** move one column per tap. If hold is detected, DAS kicks in.
- **Down (soft drop):** see §7.
- **Up:** no-op in classic NES. Do not map it to "hard drop" — NES has no hard drop.
- **Start:** pause.

### DAS (Delayed Auto Shift) — NES values at 60 fps

- **Initial delay:** 16 frames (266 ms)
- **Auto-repeat rate:** 6 frames (100 ms, ~10 Hz)

DAS is implemented in the reducer:

```
on Tick:
  if (das.dir !== 0) {
    das.frames++
    if (das.frames === 16) emit Move(das.dir)
    else if (das.frames > 16 && (das.frames - 16) % 6 === 0) emit Move(das.dir)
  }
```

On direction change, reset `das.frames` to 0. On release, reset to 0 and `dir = 0`.

## 5. Gravity — NES speed table

Frames per cell, at 60 fps:

| Level  | Frames/cell |
|--------|-------------|
| 0      | 48          |
| 1      | 43          |
| 2      | 38          |
| 3      | 33          |
| 4      | 28          |
| 5      | 23          |
| 6      | 18          |
| 7      | 13          |
| 8      | 8           |
| 9      | 6           |
| 10–12  | 5           |
| 13–15  | 4           |
| 16–18  | 3           |
| 19–28  | 2           |
| 29+    | 1           |

Put this in `src/core/gravity.ts` as:

```ts
export function framesPerCell(level: number): number { ... }
```

## 6. Randomizer — NES pseudo-random with one retry

NES Tetris is **not** a 7-bag. Its algorithm is:

1. Pick a random piece `r` from 0..7 (yes, 8 values).
2. If `r === 7` OR `r === previousPiece`, re-roll once: pick a fresh `r` from 0..6.
3. Return `r` (clamped to 0..6 in practice since the re-roll is uniform 0..6).

This produces noticeably more repeats than a 7-bag. It's what gives NES Tetris its characteristic "drought" moments.

Implement it in `src/core/rng.ts` with an **injectable PRNG** (e.g., Mulberry32) so tests can seed it:

```ts
export type RngState = { seed: number; prev: PieceId | -1 };
export function nextPiece(s: RngState): { piece: PieceId; next: RngState } { ... }
```

Seed-in, seed-out — no hidden globals.

## 7. Soft drop

- While Down is held: piece drops 1 cell per frame (effectively gravity override).
- Score bonus: **+1 point per cell** dropped by soft drop, awarded on lock.
- Soft drop never locks instantly — holding Down into an empty column just drops until you hit something.
- Release-and-repress semantics: NES awards the bonus only for the current press. A simple implementation: reset `softDropCells = 0` on release.

## 8. Locking

- No lock delay in NES. As soon as the piece can't move down and a Tick fires, it locks.
- On lock: update board, compute line clears, award score, maybe level up, spawn next.

## 9. Line clears

- Detect full rows after lock.
- 1 / 2 / 3 / 4 full rows = Single / Double / Triple / **Tetris**.
- Shift rows above the cleared ones downward.
- Empty rows appear at the top (filled with 0).

## 10. Scoring — BPS / Original

Points for line clears, where `n` = level at the time of the clear (0-indexed):

| Clear  | Points         |
|--------|----------------|
| Single | 40 × (n + 1)   |
| Double | 100 × (n + 1)  |
| Triple | 300 × (n + 1)  |
| Tetris | 1200 × (n + 1) |

Plus soft-drop bonus (see §7). No back-to-back bonus, no combo, no T-spin — this is classic NES.

## 11. Level progression

- **Level select:** player chooses 0–9 at game start.
- **First transition:** the first level-up after game start happens after
  `min(startLevel * 10 + 10, max(100, startLevel * 10 - 50))` lines.
  (e.g., start 0 → level up at 10 lines; start 9 → level up at 100 lines; start 15 → 100 lines).
- **Subsequent transitions:** every 10 lines.
- Cap gravity at the level 29+ speed (kill-screen behavior).

Implement this in `src/core/scoring.ts`:

```ts
export function nextLevelAt(startLevel: number, currentLevel: number): number {
  if (currentLevel === startLevel) {
    return Math.min(startLevel * 10 + 10, Math.max(100, startLevel * 10 - 50));
  }
  return currentLevel * 10 + 10; // cumulative lines threshold
}
```

## 12. Game over

- Top-out: spawning the next piece overlaps existing blocks.
- Display: final score, lines, level reached.
- Initials entry if the score makes the top 10.

## 13. Explicitly out of scope (v1)

These are intentionally excluded from v1 to honor the "classic NES" choice:

- Hold piece
- SRS / wall kicks / floor kicks
- T-spins / back-to-back / combos
- 7-bag randomizer
- Hard drop
- Lock delay / extended placement
- Ghost piece **is optional** — include a subtle preview since it's a quality-of-life feature players expect today. Put it behind a setting "Show ghost" (default on).

## 14. Parameters worth exposing in Settings (M4+)

- Starting level (0–9)
- Ghost piece (on/off)
- Sound (on/off), master volume
- Haptics (on/off, intensity)
- Control layout: left-handed swap (move buttons on right)
- Show next queue beyond next piece (on/off) — **off by default** (NES only shows one)

Anything beyond this is post-v1 discussion.
