import { describe, expect, it } from 'vitest';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  clearLines,
  emptyBoard,
  isValidPosition,
  lockPiece,
  type Board,
  type Cell,
} from '@/core/board';
import type { PieceId } from '@/core/tetromino';

function row(...cells: Cell[]): ReadonlyArray<Cell> {
  return cells;
}

function fullRow(piece: PieceId = 'T'): ReadonlyArray<Cell> {
  return Array.from({ length: BOARD_WIDTH }, () => piece);
}

function mkBoard(rows: Array<ReadonlyArray<Cell>>): Board {
  const blankRow = row(...Array.from({ length: BOARD_WIDTH }, () => null as Cell));
  const padded: Array<ReadonlyArray<Cell>> = [];
  while (padded.length + rows.length < BOARD_HEIGHT) padded.push(blankRow);
  return [...padded, ...rows];
}

describe('emptyBoard', () => {
  it('is 22 rows × 10 cols, all null', () => {
    const b = emptyBoard();
    expect(b).toHaveLength(BOARD_HEIGHT);
    for (const r of b) {
      expect(r).toHaveLength(BOARD_WIDTH);
      for (const c of r) expect(c).toBeNull();
    }
  });
});

describe('isValidPosition', () => {
  const b = emptyBoard();

  it('accepts a piece entirely inside bounds', () => {
    expect(isValidPosition(b, 'T', 0, 4, 1)).toBe(true);
  });

  it('rejects when a mino exits the left wall', () => {
    expect(isValidPosition(b, 'T', 0, 0, 1)).toBe(false);
  });

  it('rejects when a mino exits the right wall', () => {
    expect(isValidPosition(b, 'T', 0, 9, 1)).toBe(false);
  });

  it('rejects when a mino exits the floor', () => {
    expect(isValidPosition(b, 'T', 0, 4, BOARD_HEIGHT - 1)).toBe(false);
  });

  it('rejects when overlapping an existing block', () => {
    const withBlock = emptyBoard().map((r) => r.slice()) as Cell[][];
    withBlock[1]![4] = 'I';
    expect(isValidPosition(withBlock, 'T', 0, 4, 1)).toBe(false);
  });

  it('accepts the spawn location on an empty board for all pieces', () => {
    expect(isValidPosition(b, 'I', 0, 4, 0)).toBe(true);
    expect(isValidPosition(b, 'O', 0, 4, 0)).toBe(true);
    expect(isValidPosition(b, 'T', 0, 4, 0)).toBe(true);
    expect(isValidPosition(b, 'S', 0, 4, 0)).toBe(true);
    expect(isValidPosition(b, 'Z', 0, 4, 0)).toBe(true);
    expect(isValidPosition(b, 'J', 0, 4, 0)).toBe(true);
    expect(isValidPosition(b, 'L', 0, 4, 0)).toBe(true);
  });
});

describe('lockPiece', () => {
  it('stamps the piece ID into the board cells', () => {
    const before = emptyBoard();
    const after = lockPiece(before, 'T', 0, 4, 1);
    // T rot 0 cells: (3,1)(4,1)(5,1)(4,2)
    expect(after[1]![3]).toBe('T');
    expect(after[1]![4]).toBe('T');
    expect(after[1]![5]).toBe('T');
    expect(after[2]![4]).toBe('T');
  });

  it('does not mutate the input board', () => {
    const before = emptyBoard();
    lockPiece(before, 'T', 0, 4, 1);
    for (const r of before) for (const c of r) expect(c).toBeNull();
  });
});

describe('clearLines', () => {
  it('returns linesCleared = 0 when no rows are full', () => {
    const b = emptyBoard();
    const result = clearLines(b);
    expect(result.linesCleared).toBe(0);
    expect(result.clearedRows).toEqual([]);
    expect(result.board).toBe(b);
  });

  it('clears a single full row and shifts above cells down', () => {
    const b = mkBoard([fullRow('T')]);
    const result = clearLines(b);
    expect(result.linesCleared).toBe(1);
    expect(result.clearedRows).toEqual([BOARD_HEIGHT - 1]);
    expect(result.board[BOARD_HEIGHT - 1]!.every((c) => c === null)).toBe(true);
  });

  it('clears a tetris (4 full rows)', () => {
    const b = mkBoard([fullRow(), fullRow(), fullRow(), fullRow()]);
    const result = clearLines(b);
    expect(result.linesCleared).toBe(4);
  });

  it('handles non-contiguous clears (row gap)', () => {
    const top = row(...Array.from({ length: BOARD_WIDTH }, (_, i) => (i === 0 ? null : 'T')));
    const b = mkBoard([fullRow('T'), top, fullRow('T')]);
    const result = clearLines(b);
    expect(result.linesCleared).toBe(2);
    // The single non-full row is retained.
    expect(result.board[BOARD_HEIGHT - 1]!.filter((c) => c !== null).length).toBe(BOARD_WIDTH - 1);
  });

  it('new rows appear at the top after a clear', () => {
    const b = mkBoard([fullRow('I'), fullRow('I')]);
    const result = clearLines(b);
    expect(result.board.slice(0, 2).every((r) => r.every((c) => c === null))).toBe(true);
  });
});
