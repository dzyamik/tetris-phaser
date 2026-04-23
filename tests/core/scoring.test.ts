import { describe, expect, it } from 'vitest';
import { lineScore, nextLevelAt, softDropScore } from '@/core/scoring';

describe('lineScore — BPS / NES Original', () => {
  it('single at level 0 scores 40', () => {
    expect(lineScore(1, 0)).toBe(40);
  });

  it('double at level 0 scores 100', () => {
    expect(lineScore(2, 0)).toBe(100);
  });

  it('triple at level 0 scores 300', () => {
    expect(lineScore(3, 0)).toBe(300);
  });

  it('tetris at level 0 scores 1200', () => {
    expect(lineScore(4, 0)).toBe(1200);
  });

  it('scales by (level + 1)', () => {
    expect(lineScore(4, 9)).toBe(12000);
    expect(lineScore(1, 5)).toBe(240);
  });
});

describe('softDropScore', () => {
  it('is +1 per cell dropped', () => {
    expect(softDropScore(7)).toBe(7);
    expect(softDropScore(0)).toBe(0);
  });

  it('never goes negative even on bad input', () => {
    expect(softDropScore(-5)).toBe(0);
  });
});

describe('nextLevelAt — first-transition formula', () => {
  it('start level 0 → first transition at 10 lines', () => {
    expect(nextLevelAt(0, 0)).toBe(10);
  });

  it('start level 5 → first transition at 60 lines (min branch)', () => {
    expect(nextLevelAt(5, 5)).toBe(60);
  });

  it('start level 9 → first transition at 100 lines (min branch)', () => {
    expect(nextLevelAt(9, 9)).toBe(100);
  });

  it('start level 15 → first transition at 100 lines (max branch)', () => {
    // min(160, max(100, 100)) = 100
    expect(nextLevelAt(15, 15)).toBe(100);
  });

  it('start level 19 → first transition at 140 lines', () => {
    // min(200, max(100, 140)) = 140
    expect(nextLevelAt(19, 19)).toBe(140);
  });
});

describe('nextLevelAt — subsequent transitions every 10 lines', () => {
  it('start 0, current 1 → 20 lines', () => {
    expect(nextLevelAt(0, 1)).toBe(20);
  });

  it('start 0, current 9 → 100 lines', () => {
    expect(nextLevelAt(0, 9)).toBe(100);
  });

  it('start 9, current 10 → 110 lines', () => {
    expect(nextLevelAt(9, 10)).toBe(110);
  });

  it('start 9, current 11 → 120 lines', () => {
    expect(nextLevelAt(9, 11)).toBe(120);
  });
});
