import { describe, expect, it } from 'vitest';
import { framesPerCell } from '@/core/gravity';

describe('framesPerCell — NES speed table', () => {
  it.each([
    [0, 48],
    [1, 43],
    [2, 38],
    [3, 33],
    [4, 28],
    [5, 23],
    [6, 18],
    [7, 13],
    [8, 8],
    [9, 6],
    [10, 5],
    [12, 5],
    [13, 4],
    [15, 4],
    [16, 3],
    [18, 3],
    [19, 2],
    [28, 2],
    [29, 1],
  ])('level %i → %i frames/cell', (level, frames) => {
    expect(framesPerCell(level)).toBe(frames);
  });

  it('clamps level 30+ to the kill-screen speed (1 frame/cell)', () => {
    expect(framesPerCell(30)).toBe(1);
    expect(framesPerCell(99)).toBe(1);
    expect(framesPerCell(1000)).toBe(1);
  });

  it('clamps negative levels to level 0', () => {
    expect(framesPerCell(-1)).toBe(48);
    expect(framesPerCell(-100)).toBe(48);
  });
});
