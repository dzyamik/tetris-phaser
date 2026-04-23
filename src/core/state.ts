import type { Action } from './actions';
import type { Board } from './board';
import {
  BOARD_HEIGHT,
  clearLines,
  emptyBoard,
  isValidPosition,
  lockPiece,
  VISIBLE_HEIGHT,
} from './board';
import {
  DAS_INITIAL_FRAMES,
  DAS_REPEAT_FRAMES,
  framesPerCell,
  SOFT_DROP_FRAMES_PER_CELL,
} from './gravity';
import { createRng, nextPiece, type RngState } from './rng';
import { lineScore, nextLevelAt, softDropScore, type LineCount } from './scoring';
import {
  type PieceId,
  type Rotation,
  rotate as rotateRotation,
  SPAWN_COL,
  SPAWN_ROW,
} from './tetromino';

export type Phase = 'falling' | 'over';

export type ActivePiece = {
  readonly id: PieceId;
  readonly rotation: Rotation;
  readonly col: number;
  readonly row: number;
};

export type Das = {
  readonly dir: -1 | 0 | 1;
  readonly frames: number;
};

export type ClearInfo = {
  readonly count: LineCount;
  readonly rows: ReadonlyArray<number>;
};

export type GameState = {
  readonly phase: Phase;
  readonly board: Board;
  readonly active: ActivePiece | null;
  readonly next: PieceId;
  readonly score: number;
  readonly lines: number;
  readonly level: number;
  readonly startLevel: number;
  readonly gravityCounter: number;
  readonly das: Das;
  readonly softDrop: boolean;
  readonly softDropCells: number;
  readonly rng: RngState;
  readonly lastClear: ClearInfo | null;
};

export type InitOptions = {
  readonly startLevel?: number;
  readonly seed?: number;
};

export function initialState(options: InitOptions = {}): GameState {
  const startLevel = options.startLevel ?? 0;
  const seed = options.seed ?? 1;

  const rng0 = createRng(seed);
  const first = nextPiece(rng0);
  const second = nextPiece(first.next);

  const board = emptyBoard();
  const active: ActivePiece = {
    id: first.piece,
    rotation: 0,
    col: SPAWN_COL,
    row: SPAWN_ROW,
  };

  const spawnValid = isValidPosition(board, active.id, active.rotation, active.col, active.row);

  return {
    phase: spawnValid ? 'falling' : 'over',
    board,
    active: spawnValid ? active : null,
    next: second.piece,
    score: 0,
    lines: 0,
    level: startLevel,
    startLevel,
    gravityCounter: 0,
    das: { dir: 0, frames: 0 },
    softDrop: false,
    softDropCells: 0,
    rng: second.next,
    lastClear: null,
  };
}

export function reducer(state: GameState, action: Action): GameState {
  if (action.type === 'Reset') {
    return initialState({ startLevel: action.startLevel, seed: action.seed });
  }

  if (state.phase === 'over') return state;

  switch (action.type) {
    case 'Move':
      return applyMove(state, action.dir);
    case 'SetHold':
      return applySetHold(state, action.dir);
    case 'Rotate':
      return applyRotate(state, action.dir);
    case 'SoftDrop':
      return applySoftDrop(state, action.held);
    case 'Tick':
      return applyTick(state);
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

function applyMove(state: GameState, dir: -1 | 1): GameState {
  if (!state.active) return state;
  const newCol = state.active.col + dir;
  if (!isValidPosition(state.board, state.active.id, state.active.rotation, newCol, state.active.row)) {
    return state;
  }
  return { ...state, active: { ...state.active, col: newCol } };
}

function applySetHold(state: GameState, dir: -1 | 0 | 1): GameState {
  if (dir === state.das.dir) return state;
  return { ...state, das: { dir, frames: 0 } };
}

function applyRotate(state: GameState, dir: 'cw' | 'ccw'): GameState {
  if (!state.active) return state;
  const newRotation = rotateRotation(state.active.rotation, dir);
  if (!isValidPosition(state.board, state.active.id, newRotation, state.active.col, state.active.row)) {
    return state;
  }
  return { ...state, active: { ...state.active, rotation: newRotation } };
}

function applySoftDrop(state: GameState, held: boolean): GameState {
  if (held === state.softDrop) return state;
  return {
    ...state,
    softDrop: held,
    softDropCells: held ? state.softDropCells : 0,
  };
}

function applyTick(state: GameState): GameState {
  if (!state.active) return state;

  let next = state;
  next = advanceDas(next);
  next = advanceGravity(next);
  return next;
}

function advanceDas(state: GameState): GameState {
  if (state.das.dir === 0 || !state.active) return state;
  const frames = state.das.frames + 1;
  const shouldShift =
    frames === DAS_INITIAL_FRAMES ||
    (frames > DAS_INITIAL_FRAMES && (frames - DAS_INITIAL_FRAMES) % DAS_REPEAT_FRAMES === 0);

  let active = state.active;
  if (shouldShift) {
    const dir = state.das.dir;
    const newCol = active.col + dir;
    if (isValidPosition(state.board, active.id, active.rotation, newCol, active.row)) {
      active = { ...active, col: newCol };
    }
  }
  return { ...state, active, das: { dir: state.das.dir, frames } };
}

function advanceGravity(state: GameState): GameState {
  if (!state.active) return state;
  const rate = state.softDrop ? SOFT_DROP_FRAMES_PER_CELL : framesPerCell(state.level);
  const counter = state.gravityCounter + 1;
  if (counter < rate) {
    return { ...state, gravityCounter: counter };
  }

  const belowRow = state.active.row + 1;
  if (isValidPosition(state.board, state.active.id, state.active.rotation, state.active.col, belowRow)) {
    const softDropCells = state.softDrop ? state.softDropCells + 1 : state.softDropCells;
    return {
      ...state,
      gravityCounter: 0,
      active: { ...state.active, row: belowRow },
      softDropCells,
    };
  }

  return lockAndSpawn(state);
}

function lockAndSpawn(state: GameState): GameState {
  if (!state.active) return state;

  const locked = lockPiece(
    state.board,
    state.active.id,
    state.active.rotation,
    state.active.col,
    state.active.row,
  );
  const cleared = clearLines(locked);

  const softBonus = softDropScore(state.softDropCells);
  const lineBonus =
    cleared.linesCleared > 0 && cleared.linesCleared <= 4
      ? lineScore(cleared.linesCleared as LineCount, state.level)
      : 0;

  const totalLines = state.lines + cleared.linesCleared;
  let newLevel = state.level;
  while (totalLines >= nextLevelAt(state.startLevel, newLevel)) {
    newLevel += 1;
  }

  const spawn = nextPiece(state.rng);
  const newActive: ActivePiece = {
    id: state.next,
    rotation: 0,
    col: SPAWN_COL,
    row: SPAWN_ROW,
  };
  const topOut = !isValidPosition(cleared.board, newActive.id, newActive.rotation, newActive.col, newActive.row);

  const lastClear: ClearInfo | null =
    cleared.linesCleared > 0 && cleared.linesCleared <= 4
      ? { count: cleared.linesCleared as LineCount, rows: cleared.clearedRows }
      : null;

  return {
    phase: topOut ? 'over' : 'falling',
    board: cleared.board,
    active: topOut ? null : newActive,
    next: spawn.piece,
    score: state.score + softBonus + lineBonus,
    lines: totalLines,
    level: newLevel,
    startLevel: state.startLevel,
    gravityCounter: 0,
    das: state.das,
    softDrop: state.softDrop,
    softDropCells: 0,
    rng: spawn.next,
    lastClear,
  };
}

// Re-export the visible-height constant so renderers can use it without
// importing from board directly.
export { BOARD_HEIGHT, VISIBLE_HEIGHT };
