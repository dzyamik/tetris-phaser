export type LineCount = 1 | 2 | 3 | 4;

const LINE_BASE: Readonly<Record<LineCount, number>> = {
  1: 40,
  2: 100,
  3: 300,
  4: 1200,
};

export function lineScore(lines: LineCount, level: number): number {
  return LINE_BASE[lines] * (level + 1);
}

export function softDropScore(cells: number): number {
  return Math.max(0, cells);
}

// Cumulative lines threshold at which the NEXT level-up fires.
// See docs-dev/GAME-DESIGN.md §11.
export function nextLevelAt(startLevel: number, currentLevel: number): number {
  if (currentLevel === startLevel) {
    return Math.min(startLevel * 10 + 10, Math.max(100, startLevel * 10 - 50));
  }
  return currentLevel * 10 + 10;
}
