import type { PieceId, Rotation } from './tetromino';
import { pieceOffsets } from './tetromino';

export type Cell = PieceId | null;
export type Board = ReadonlyArray<ReadonlyArray<Cell>>;

export const BOARD_WIDTH = 10;
export const HIDDEN_ROWS = 2;
export const VISIBLE_HEIGHT = 20;
export const BOARD_HEIGHT = VISIBLE_HEIGHT + HIDDEN_ROWS;

export function emptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, (): Cell => null),
  );
}

export function isValidPosition(
  board: Board,
  piece: PieceId,
  rotation: Rotation,
  col: number,
  row: number,
): boolean {
  const offsets = pieceOffsets(piece, rotation);
  for (const [dc, dr] of offsets) {
    const c = col + dc;
    const r = row + dr;
    if (c < 0 || c >= BOARD_WIDTH) return false;
    if (r < 0 || r >= BOARD_HEIGHT) return false;
    const occupant = board[r]?.[c];
    if (occupant !== null && occupant !== undefined) return false;
  }
  return true;
}

export function lockPiece(
  board: Board,
  piece: PieceId,
  rotation: Rotation,
  col: number,
  row: number,
): Board {
  const offsets = pieceOffsets(piece, rotation);
  const next = board.map((r) => r.slice());
  for (const [dc, dr] of offsets) {
    const c = col + dc;
    const r = row + dr;
    if (r >= 0 && r < BOARD_HEIGHT && c >= 0 && c < BOARD_WIDTH) {
      next[r]![c] = piece;
    }
  }
  return next;
}

export type ClearResult = {
  readonly board: Board;
  readonly linesCleared: number;
  readonly clearedRows: ReadonlyArray<number>;
};

export function clearLines(board: Board): ClearResult {
  const clearedRows: number[] = [];
  const kept: Array<ReadonlyArray<Cell>> = [];
  for (let i = 0; i < board.length; i++) {
    const row = board[i]!;
    if (row.every((cell) => cell !== null)) {
      clearedRows.push(i);
    } else {
      kept.push(row);
    }
  }
  if (clearedRows.length === 0) {
    return { board, linesCleared: 0, clearedRows };
  }
  const emptyRow: ReadonlyArray<Cell> = Array.from({ length: BOARD_WIDTH }, () => null);
  const prepended: Array<ReadonlyArray<Cell>> = [];
  for (let i = 0; i < clearedRows.length; i++) prepended.push(emptyRow);
  return {
    board: [...prepended, ...kept],
    linesCleared: clearedRows.length,
    clearedRows,
  };
}
