import type { PieceId } from './tetromino';
import { PIECE_IDS } from './tetromino';

export type RngState = {
  readonly seed: number;
  readonly prev: PieceId | null;
};

export function createRng(seed: number, prev: PieceId | null = null): RngState {
  return { seed: seed >>> 0, prev };
}

// Mulberry32 step: one call advances the state and returns a uniform [0, 1) float.
function mulberry32(seed: number): { value: number; seed: number } {
  const nextSeed = (seed + 0x6d2b79f5) >>> 0;
  let t = nextSeed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, seed: nextSeed };
}

function pickIndex(seed: number, exclusiveMax: number): { index: number; seed: number } {
  const { value, seed: nextSeed } = mulberry32(seed);
  return { index: Math.floor(value * exclusiveMax), seed: nextSeed };
}

// NES pseudo-random with one retry (docs-dev/GAME-DESIGN.md §6).
export function nextPiece(state: RngState): { piece: PieceId; next: RngState } {
  const prevIndex = state.prev === null ? -1 : PIECE_IDS.indexOf(state.prev);

  const first = pickIndex(state.seed, 8);
  let index = first.index;
  let seed = first.seed;

  if (index === 7 || index === prevIndex) {
    const second = pickIndex(seed, 7);
    index = second.index;
    seed = second.seed;
  }

  const piece = PIECE_IDS[index]!;
  return { piece, next: { seed, prev: piece } };
}
