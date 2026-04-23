// NES gravity: frames-per-cell at level L, 60 fps.
// Index = level. Levels above the table clamp to the last entry (kill-screen speed).
const FRAMES_PER_CELL: ReadonlyArray<number> = [
  48, 43, 38, 33, 28, 23, 18, 13, 8, 6,
  5, 5, 5,
  4, 4, 4,
  3, 3, 3,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  1,
];

export function framesPerCell(level: number): number {
  if (level < 0) return FRAMES_PER_CELL[0]!;
  if (level >= FRAMES_PER_CELL.length) return FRAMES_PER_CELL[FRAMES_PER_CELL.length - 1]!;
  return FRAMES_PER_CELL[level]!;
}

export const DAS_INITIAL_FRAMES = 16;
export const DAS_REPEAT_FRAMES = 6;
export const SOFT_DROP_FRAMES_PER_CELL = 1;
