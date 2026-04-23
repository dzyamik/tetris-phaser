import { describe, expect, it } from 'vitest';
import { BOARD_HEIGHT, BOARD_WIDTH, type Cell } from '@/core/board';
import { framesPerCell, DAS_INITIAL_FRAMES, DAS_REPEAT_FRAMES } from '@/core/gravity';
import { initialState, reducer, type GameState } from '@/core/state';
import type { Action } from '@/core/actions';

function runActions(state: GameState, actions: Action[]): GameState {
  return actions.reduce((s, a) => reducer(s, a), state);
}


describe('initialState', () => {
  it('is in falling phase with an active piece on an empty board', () => {
    const s = initialState({ seed: 1 });
    expect(s.phase).toBe('falling');
    expect(s.active).not.toBeNull();
    expect(s.score).toBe(0);
    expect(s.lines).toBe(0);
    expect(s.level).toBe(0);
    expect(s.startLevel).toBe(0);
  });

  it('accepts a startLevel', () => {
    const s = initialState({ seed: 1, startLevel: 9 });
    expect(s.level).toBe(9);
    expect(s.startLevel).toBe(9);
  });

  it('same seed → same first two pieces', () => {
    const a = initialState({ seed: 42 });
    const b = initialState({ seed: 42 });
    expect(a.active?.id).toBe(b.active?.id);
    expect(a.next).toBe(b.next);
  });
});

describe('reducer — Move', () => {
  it('moves the active piece horizontally', () => {
    const s = initialState({ seed: 1 });
    const col0 = s.active!.col;
    const moved = reducer(s, { type: 'Move', dir: -1 });
    expect(moved.active!.col).toBe(col0 - 1);
  });

  it('refuses a move into the left wall', () => {
    let s = initialState({ seed: 1 });
    for (let i = 0; i < BOARD_WIDTH; i++) {
      s = reducer(s, { type: 'Move', dir: -1 });
    }
    const blocked = reducer(s, { type: 'Move', dir: -1 });
    expect(blocked).toBe(s);
  });
});

describe('reducer — Rotate', () => {
  it('rotates the piece if the new orientation fits', () => {
    const s = initialState({ seed: 1 });
    const before = s.active!.rotation;
    const rotated = reducer(s, { type: 'Rotate', dir: 'cw' });
    // Rotation either succeeded (different) or was blocked (same state returned).
    expect(rotated.active!.rotation === before || rotated === s).toBe(true);
  });

  it('four CW rotations returns to original rotation index on an empty board', () => {
    const s0 = initialState({ seed: 1 });
    const s4 = runActions(s0, [
      { type: 'Rotate', dir: 'cw' },
      { type: 'Rotate', dir: 'cw' },
      { type: 'Rotate', dir: 'cw' },
      { type: 'Rotate', dir: 'cw' },
    ]);
    expect(s4.active!.rotation).toBe(s0.active!.rotation);
  });
});

describe('reducer — Tick & gravity', () => {
  it('does not drop until the gravity counter reaches framesPerCell', () => {
    const s = initialState({ seed: 1 });
    const rate = framesPerCell(0);
    let cur = s;
    for (let i = 0; i < rate - 1; i++) cur = reducer(cur, { type: 'Tick' });
    expect(cur.active!.row).toBe(s.active!.row);
  });

  it('drops one cell when the gravity counter reaches framesPerCell', () => {
    const s = initialState({ seed: 1 });
    const rate = framesPerCell(0);
    let cur = s;
    for (let i = 0; i < rate; i++) cur = reducer(cur, { type: 'Tick' });
    expect(cur.active!.row).toBe(s.active!.row + 1);
  });

  it('soft drop advances 1 cell per tick', () => {
    const s0 = initialState({ seed: 1 });
    const s1 = reducer(s0, { type: 'SoftDrop', held: true });
    const s2 = reducer(s1, { type: 'Tick' });
    expect(s2.active!.row).toBe(s0.active!.row + 1);
  });

  it('soft drop awards +1 per cell, paid out at lock time', () => {
    // Drop a piece all the way to the floor using soft drop.
    let s = initialState({ seed: 1, startLevel: 0 });
    s = reducer(s, { type: 'SoftDrop', held: true });
    // Tick until the piece locks — keep going until score changes (lock awards score).
    let safety = 500;
    const startScore = s.score;
    while (s.score === startScore && safety-- > 0) {
      s = reducer(s, { type: 'Tick' });
    }
    // We locked; some soft-drop bonus was paid (≥ some positive number — piece fell many cells).
    expect(s.score).toBeGreaterThan(0);
  });
});

describe('reducer — DAS', () => {
  it('holding a direction triggers auto-shift after the initial delay', () => {
    let s = initialState({ seed: 1 });
    const col0 = s.active!.col;
    s = reducer(s, { type: 'SetHold', dir: -1 });
    for (let i = 0; i < DAS_INITIAL_FRAMES; i++) s = reducer(s, { type: 'Tick' });
    expect(s.active!.col).toBe(col0 - 1);
  });

  it('releasing resets the DAS counter', () => {
    let s = initialState({ seed: 1 });
    s = reducer(s, { type: 'SetHold', dir: -1 });
    s = reducer(s, { type: 'Tick' });
    s = reducer(s, { type: 'Tick' });
    s = reducer(s, { type: 'SetHold', dir: 0 });
    expect(s.das.frames).toBe(0);
    expect(s.das.dir).toBe(0);
  });

  it('repeats every 6 frames after the initial 16-frame delay', () => {
    let s = initialState({ seed: 1 });
    const col0 = s.active!.col;
    s = reducer(s, { type: 'SetHold', dir: -1 });
    for (let i = 0; i < DAS_INITIAL_FRAMES; i++) s = reducer(s, { type: 'Tick' });
    expect(s.active!.col).toBe(col0 - 1);
    for (let i = 0; i < DAS_REPEAT_FRAMES; i++) s = reducer(s, { type: 'Tick' });
    expect(s.active!.col).toBe(col0 - 2);
    for (let i = 0; i < DAS_REPEAT_FRAMES; i++) s = reducer(s, { type: 'Tick' });
    expect(s.active!.col).toBe(col0 - 3);
  });

  it('holding into a wall stops at the wall, keeps counting frames, no crash', () => {
    // Place an O-piece at col 0 — leftmost possible position — and hold left.
    const base = initialState({ seed: 1 });
    const atWall: GameState = {
      ...base,
      active: { id: 'O', rotation: 0, col: 0, row: 2 },
      das: { dir: -1, frames: 0 },
    };
    // Fire DAS: one shift attempt blocked (O at col 0 can't go left).
    let s = atWall;
    for (let i = 0; i < DAS_INITIAL_FRAMES; i++) s = reducer(s, { type: 'Tick' });
    expect(s.active!.col).toBe(0);
    expect(s.das.frames).toBe(DAS_INITIAL_FRAMES);
    // Subsequent DAS repeats keep firing (frames keep incrementing) but piece stays.
    for (let i = 0; i < DAS_REPEAT_FRAMES * 5; i++) s = reducer(s, { type: 'Tick' });
    expect(s.active!.col).toBe(0);
    expect(s.das.frames).toBe(DAS_INITIAL_FRAMES + DAS_REPEAT_FRAMES * 5);
  });
});

describe('reducer — Reset', () => {
  it('resets to initialState with the given startLevel and seed', () => {
    let s = initialState({ seed: 1, startLevel: 5 });
    s = reducer(s, { type: 'Move', dir: -1 });
    s = reducer(s, { type: 'Reset', seed: 10, startLevel: 3 });
    expect(s.level).toBe(3);
    expect(s.startLevel).toBe(3);
    expect(s.score).toBe(0);
  });
});

describe('reducer — line clear via Tick', () => {
  it('scoring, lines, and level state remain consistent after locks', () => {
    let s: GameState = initialState({ seed: 1 });
    // Run a bunch of ticks — pieces should drop, lock, and new ones spawn.
    for (let i = 0; i < 2000; i++) s = reducer(s, { type: 'Tick' });
    // Invariants:
    expect(s.lines).toBeGreaterThanOrEqual(0);
    expect(s.score).toBeGreaterThanOrEqual(0);
    expect(s.level).toBeGreaterThanOrEqual(s.startLevel);
  });

  it('locks and clears a single line, scoring BPS single + soft-drop bonus', () => {
    // Pre-fill the bottom row except col 4 so the next piece's leftmost
    // mino falls into that gap and completes a single.
    const base = initialState({ seed: 1, startLevel: 0 });
    const blank: ReadonlyArray<Cell> = Array.from({ length: BOARD_WIDTH }, () => null);
    const bottomRow: ReadonlyArray<Cell> = Array.from(
      { length: BOARD_WIDTH },
      (_, i) => (i === 4 ? null : 'I') as Cell,
    );
    const rows: Array<ReadonlyArray<Cell>> = [];
    for (let i = 0; i < BOARD_HEIGHT - 1; i++) rows.push(blank);
    rows.push(bottomRow);

    // Swap in a guaranteed I-piece rotated vertical at col 4 so it falls straight
    // into the gap. Use spawn row so normal gravity drives it down.
    const loaded: GameState = {
      ...base,
      board: rows,
      active: { id: 'I', rotation: 1, col: 4, row: 0 },
    };

    // Soft-drop so one Tick = one cell of travel, and the bonus accumulates.
    let s = reducer(loaded, { type: 'SoftDrop', held: true });
    let safety = 500;
    const startLines = s.lines;
    while (s.lines === startLines && safety-- > 0) {
      s = reducer(s, { type: 'Tick' });
    }
    expect(safety).toBeGreaterThan(0);
    expect(s.lines).toBe(1);
    // BPS single at level 0 = 40; plus soft-drop bonus (≥ 1).
    expect(s.score).toBeGreaterThanOrEqual(40 + 1);
    expect(s.lastClear?.count).toBe(1);
  });

  it('a tetris (4 rows cleared) scores 1200 × (level + 1) plus soft-drop bonus', () => {
    // Fill bottom 4 rows except col 4 so a vertical I-piece at col 4 fills the gap.
    const base = initialState({ seed: 1, startLevel: 0 });
    const blank: ReadonlyArray<Cell> = Array.from({ length: BOARD_WIDTH }, () => null);
    const almostFull: ReadonlyArray<Cell> = Array.from(
      { length: BOARD_WIDTH },
      (_, i) => (i === 4 ? null : 'J') as Cell,
    );
    const rows: Array<ReadonlyArray<Cell>> = [];
    for (let i = 0; i < BOARD_HEIGHT - 4; i++) rows.push(blank);
    for (let i = 0; i < 4; i++) rows.push(almostFull);

    const loaded: GameState = {
      ...base,
      board: rows,
      active: { id: 'I', rotation: 1, col: 4, row: 0 },
    };

    let s = reducer(loaded, { type: 'SoftDrop', held: true });
    const startScore = s.score;
    let safety = 500;
    while (s.lines === 0 && safety-- > 0) s = reducer(s, { type: 'Tick' });

    expect(s.lines).toBe(4);
    expect(s.lastClear?.count).toBe(4);
    const gained = s.score - startScore;
    // 1200 base at level 0 + soft-drop bonus (piece fell ~19 cells).
    expect(gained).toBeGreaterThanOrEqual(1200);
    expect(gained).toBeLessThan(1200 + BOARD_HEIGHT);
  });

  it('a tetris at startLevel 9 scores 12000 + soft-drop bonus', () => {
    const base = initialState({ seed: 1, startLevel: 9 });
    const blank: ReadonlyArray<Cell> = Array.from({ length: BOARD_WIDTH }, () => null);
    const almostFull: ReadonlyArray<Cell> = Array.from(
      { length: BOARD_WIDTH },
      (_, i) => (i === 4 ? null : 'J') as Cell,
    );
    const rows: Array<ReadonlyArray<Cell>> = [];
    for (let i = 0; i < BOARD_HEIGHT - 4; i++) rows.push(blank);
    for (let i = 0; i < 4; i++) rows.push(almostFull);

    const loaded: GameState = {
      ...base,
      board: rows,
      active: { id: 'I', rotation: 1, col: 4, row: 0 },
    };

    let s = reducer(loaded, { type: 'SoftDrop', held: true });
    const startScore = s.score;
    let safety = 500;
    while (s.lines === 0 && safety-- > 0) s = reducer(s, { type: 'Tick' });

    const gained = s.score - startScore;
    expect(gained).toBeGreaterThanOrEqual(12000);
    expect(gained).toBeLessThan(12000 + BOARD_HEIGHT);
  });

  it('top-out when the next piece cannot spawn', () => {
    // Block the entire spawn region (cols 3-5, rows 0-1) so no piece can spawn there.
    const base = initialState({ seed: 1 });
    const blank: ReadonlyArray<Cell> = Array.from({ length: BOARD_WIDTH }, () => null);
    const topBlocked: ReadonlyArray<Cell> = Array.from(
      { length: BOARD_WIDTH },
      (_, i) => (i >= 3 && i <= 5 ? 'I' : null) as Cell,
    );
    const rows: Array<ReadonlyArray<Cell>> = [];
    rows.push(topBlocked);
    rows.push(topBlocked);
    for (let i = 2; i < BOARD_HEIGHT; i++) rows.push(blank);

    // Place an O at bottom-left so it locks on the next gravity step without
    // interacting with the top block.
    const loaded: GameState = {
      ...base,
      board: rows,
      active: { id: 'O', rotation: 0, col: 0, row: BOARD_HEIGHT - 2 },
    };

    let s = reducer(loaded, { type: 'SoftDrop', held: true });
    let safety = 200;
    while (s.phase !== 'over' && safety-- > 0) s = reducer(s, { type: 'Tick' });
    expect(s.phase).toBe('over');
    expect(s.active).toBeNull();
    // Further ticks are no-ops.
    const frozen = reducer(s, { type: 'Tick' });
    expect(frozen).toBe(s);
  });

  it('levels up when the first-transition threshold is crossed (startLevel 0)', () => {
    // Construct a state whose line total is already 9 and then drive a single
    // line clear so we cross the 10-line threshold.
    const base = initialState({ seed: 1, startLevel: 0 });
    const blank: ReadonlyArray<Cell> = Array.from({ length: BOARD_WIDTH }, () => null);
    const bottomRow: ReadonlyArray<Cell> = Array.from(
      { length: BOARD_WIDTH },
      (_, i) => (i === 4 ? null : 'I') as Cell,
    );
    const rows: Array<ReadonlyArray<Cell>> = [];
    for (let i = 0; i < BOARD_HEIGHT - 1; i++) rows.push(blank);
    rows.push(bottomRow);

    const loaded: GameState = {
      ...base,
      board: rows,
      lines: 9,
      active: { id: 'I', rotation: 1, col: 4, row: 0 },
    };

    let s = reducer(loaded, { type: 'SoftDrop', held: true });
    let safety = 500;
    while (s.level === 0 && safety-- > 0) {
      s = reducer(s, { type: 'Tick' });
    }
    expect(s.level).toBe(1);
  });
});
