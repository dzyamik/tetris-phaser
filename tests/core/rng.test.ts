import { describe, expect, it } from 'vitest';
import { createRng, nextPiece } from '@/core/rng';
import { PIECE_IDS, type PieceId } from '@/core/tetromino';

function sequence(seed: number, n: number): PieceId[] {
  let state = createRng(seed);
  const out: PieceId[] = [];
  for (let i = 0; i < n; i++) {
    const r = nextPiece(state);
    out.push(r.piece);
    state = r.next;
  }
  return out;
}

describe('rng determinism', () => {
  it('same seed → same sequence', () => {
    const a = sequence(12345, 20);
    const b = sequence(12345, 20);
    expect(a).toEqual(b);
  });

  it('different seeds → different sequences', () => {
    const a = sequence(1, 50);
    const b = sequence(2, 50);
    expect(a).not.toEqual(b);
  });
});

describe('rng piece validity', () => {
  it('every emitted piece is a valid NES tetromino', () => {
    const seq = sequence(42, 1000);
    for (const p of seq) {
      expect(PIECE_IDS).toContain(p);
    }
  });

  it('over 10000 pieces all IDs are produced', () => {
    const seq = sequence(7, 10_000);
    const seen = new Set(seq);
    expect(seen.size).toBe(7);
  });
});

describe('rng NES re-roll algorithm', () => {
  it('re-rolls when first roll matches the previous piece', () => {
    // This is the statistical property: consecutive repeats are rarer than 1/7.
    // Without re-roll, P(repeat) = 1/7 ≈ 0.143. With NES's re-roll, P(repeat) ≈
    // (1/8) * (1/7) ≈ 0.0179. So over 10,000 pieces we should see far fewer
    // than the naive ~1429 repeats — anything under 400 proves the re-roll is active.
    const seq = sequence(123, 10_000);
    let repeats = 0;
    for (let i = 1; i < seq.length; i++) {
      if (seq[i] === seq[i - 1]) repeats++;
    }
    expect(repeats).toBeLessThan(400);
  });

  it('distribution is roughly uniform across pieces', () => {
    const seq = sequence(99, 14_000);
    const counts: Record<PieceId, number> = { I: 0, O: 0, T: 0, S: 0, Z: 0, J: 0, L: 0 };
    for (const p of seq) counts[p]++;
    const expected = 14_000 / 7; // 2000
    for (const id of PIECE_IDS) {
      expect(counts[id]).toBeGreaterThan(expected * 0.8);
      expect(counts[id]).toBeLessThan(expected * 1.2);
    }
  });

  it('first piece is deterministic from the seed (no prev)', () => {
    const a = nextPiece(createRng(777));
    const b = nextPiece(createRng(777));
    expect(a.piece).toBe(b.piece);
    expect(a.next.prev).toBe(a.piece);
  });

  it('nextPiece carries the drawn piece forward as the new prev', () => {
    let state = createRng(500);
    for (let i = 0; i < 50; i++) {
      const r = nextPiece(state);
      expect(r.next.prev).toBe(r.piece);
      state = r.next;
    }
  });
});
