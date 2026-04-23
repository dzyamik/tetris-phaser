import type { PieceId } from '@/core/tetromino';

export const theme = {
  background: '#0a0a0a',
  grid: '#1a1a1a',
  text: '#ffffff',
  textMuted: '#8a8a8a',
  ghostAlpha: 0.25,
} as const;

export const pieceColors: Readonly<Record<PieceId, string>> = {
  I: '#00ffff',
  O: '#ffff00',
  T: '#aa00ff',
  S: '#00ff00',
  Z: '#ff0000',
  J: '#0000ff',
  L: '#ff7f00',
} as const;
