import type * as Phaser from 'phaser';
import { CELL_SIZE } from '@/config/layout';
import { pieceColors } from '@/config/theme';
import { PIECE_IDS, type PieceId } from '@/core/tetromino';

function hexToInt(value: string): number {
  return parseInt(value.replace('#', ''), 16);
}

function clampByte(v: number): number {
  return Math.max(0, Math.min(255, v));
}

function shade(color: number, amount: number): number {
  const r = clampByte(((color >> 16) & 0xff) + 255 * amount);
  const g = clampByte(((color >> 8) & 0xff) + 255 * amount);
  const b = clampByte((color & 0xff) + 255 * amount);
  return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
}

export function textureKeyFor(id: PieceId): string {
  return `block_${id}`;
}

export function ensureBlockTextures(scene: Phaser.Scene): void {
  const size = CELL_SIZE;
  const border = 2;

  for (const id of PIECE_IDS) {
    const key = textureKeyFor(id);
    if (scene.textures.exists(key)) continue;

    const base = hexToInt(pieceColors[id]);
    const light = shade(base, 0.35);
    const dark = shade(base, -0.4);

    const g = scene.add.graphics();

    g.fillStyle(base, 1);
    g.fillRect(0, 0, size, size);

    g.fillStyle(light, 1);
    g.fillRect(0, 0, size, border);
    g.fillRect(0, 0, border, size);

    g.fillStyle(dark, 1);
    g.fillRect(0, size - border, size, border);
    g.fillRect(size - border, 0, border, size);

    g.fillStyle(light, 1);
    g.fillRect(border + 1, border + 1, 3, 3);

    g.generateTexture(key, size, size);
    g.destroy();
  }
}
