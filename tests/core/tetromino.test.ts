import { describe, expect, it } from 'vitest';
import {
  PIECE_IDS,
  pieceOffsets,
  rotate,
  type Offset,
  type PieceId,
  type Rotation,
} from '@/core/tetromino';

function asSet(offsets: ReadonlyArray<Offset>): Set<string> {
  return new Set(offsets.map(([c, r]) => `${c},${r}`));
}

describe('PIECE_IDS', () => {
  it('lists all 7 NES tetrominoes', () => {
    expect(PIECE_IDS).toEqual(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);
  });
});

describe('pieceOffsets', () => {
  it.each(PIECE_IDS)('piece %s has exactly 4 cells in every rotation', (id) => {
    for (const rot of [0, 1, 2, 3] as Rotation[]) {
      expect(pieceOffsets(id, rot)).toHaveLength(4);
    }
  });

  it.each(PIECE_IDS.filter((id) => id !== 'O'))(
    'piece %s rot 1 differs from rot 0',
    (id) => {
      expect(asSet(pieceOffsets(id, 1))).not.toEqual(asSet(pieceOffsets(id, 0)));
    },
  );

  const EXPECTED_ROT1: ReadonlyArray<readonly [PieceId, ReadonlyArray<Offset>]> = [
    ['I', [[0, -1], [0, 0], [0, 1], [0, 2]]],
    ['T', [[0, -1], [0, 0], [0, 1], [-1, 0]]],
    ['S', [[0, 0], [0, 1], [-1, -1], [-1, 0]]],
    ['Z', [[0, -1], [0, 0], [-1, 0], [-1, 1]]],
    ['J', [[0, -1], [-1, -1], [-1, 0], [-1, 1]]],
    ['L', [[0, 1], [-1, -1], [-1, 0], [-1, 1]]],
  ];

  it.each(EXPECTED_ROT1)('piece %s rot 1 matches CW transform of rot 0', (id, expected) => {
    expect(asSet(pieceOffsets(id, 1))).toEqual(asSet(expected));
  });

  it.each(PIECE_IDS.filter((id) => id !== 'O'))(
    'piece %s rot 2 is the 180° rotation of rot 0',
    (id) => {
      const r0 = asSet(pieceOffsets(id, 0));
      const r2 = pieceOffsets(id, 2);
      const doubled = new Set(r2.map(([c, r]) => `${-c},${-r}`));
      expect(doubled).toEqual(r0);
    },
  );

  it.each(PIECE_IDS)('piece %s cells in each rotation are unique', (id) => {
    for (const rot of [0, 1, 2, 3] as Rotation[]) {
      const offsets = pieceOffsets(id, rot);
      expect(asSet(offsets).size).toBe(offsets.length);
    }
  });

  it('T rotation 0 matches spec spawn shape (stem down)', () => {
    expect(asSet(pieceOffsets('T', 0))).toEqual(asSet([[-1, 0], [0, 0], [1, 0], [0, 1]]));
  });

  it('T rotation 1 (CW once from spawn) has stem pointing LEFT', () => {
    // NES: A button = CW, rot++. Stem DOWN → stem LEFT visually.
    expect(asSet(pieceOffsets('T', 1))).toEqual(asSet([[0, -1], [0, 0], [0, 1], [-1, 0]]));
  });

  it('T rotation 2 has stem pointing UP', () => {
    expect(asSet(pieceOffsets('T', 2))).toEqual(asSet([[-1, 0], [0, 0], [1, 0], [0, -1]]));
  });

  it('T rotation 3 has stem pointing RIGHT', () => {
    expect(asSet(pieceOffsets('T', 3))).toEqual(asSet([[0, -1], [0, 0], [0, 1], [1, 0]]));
  });

  it('O piece does not change shape across rotations', () => {
    const spawn = asSet(pieceOffsets('O', 0));
    for (const rot of [1, 2, 3] as Rotation[]) {
      expect(asSet(pieceOffsets('O', rot))).toEqual(spawn);
    }
  });
});

describe('rotate', () => {
  it('CW increments rotation modulo 4', () => {
    expect(rotate(0, 'cw')).toBe(1);
    expect(rotate(1, 'cw')).toBe(2);
    expect(rotate(2, 'cw')).toBe(3);
    expect(rotate(3, 'cw')).toBe(0);
  });

  it('CCW decrements rotation modulo 4', () => {
    expect(rotate(0, 'ccw')).toBe(3);
    expect(rotate(3, 'ccw')).toBe(2);
    expect(rotate(2, 'ccw')).toBe(1);
    expect(rotate(1, 'ccw')).toBe(0);
  });

  it.each(PIECE_IDS)('piece %s CW then CCW returns to original rotation', (_id: PieceId) => {
    for (const rot of [0, 1, 2, 3] as Rotation[]) {
      const out = rotate(rotate(rot, 'cw'), 'ccw');
      expect(out).toBe(rot);
    }
  });

  it.each(PIECE_IDS)('piece %s CCW then CW returns to original rotation', (_id: PieceId) => {
    for (const rot of [0, 1, 2, 3] as Rotation[]) {
      const out = rotate(rotate(rot, 'ccw'), 'cw');
      expect(out).toBe(rot);
    }
  });

  it.each(PIECE_IDS)('piece %s CW four times returns to original rotation', (_id: PieceId) => {
    for (const rot of [0, 1, 2, 3] as Rotation[]) {
      const out = rotate(rotate(rotate(rotate(rot, 'cw'), 'cw'), 'cw'), 'cw');
      expect(out).toBe(rot);
    }
  });
});
