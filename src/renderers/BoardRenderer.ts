import type * as Phaser from 'phaser';
import {
  BOARD_WIDTH,
  HIDDEN_ROWS,
  VISIBLE_HEIGHT,
  isValidPosition,
} from '@/core/board';
import type { GameState } from '@/core/state';
import { pieceOffsets } from '@/core/tetromino';
import {
  BOARD_PIXEL_HEIGHT,
  BOARD_PIXEL_WIDTH,
  BOARD_X,
  BOARD_Y,
  CELL_SIZE,
} from '@/config/layout';
import { theme } from '@/config/theme';
import { textureKeyFor } from './BlockTextures';

function hex(value: string): number {
  return parseInt(value.replace('#', ''), 16);
}

export class BoardRenderer {
  private readonly scene: Phaser.Scene;
  private readonly grid: Phaser.GameObjects.Graphics;
  private readonly cells: Phaser.GameObjects.Image[][] = [];
  private readonly active: Phaser.GameObjects.Image[] = [];
  private readonly ghost: Phaser.GameObjects.Image[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.grid = this.drawGrid();
    this.buildCellPool();
    this.buildFourPool(this.active, 1);
    this.buildFourPool(this.ghost, theme.ghostAlpha);
  }

  private drawGrid(): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    g.fillStyle(hex(theme.grid), 1);
    g.fillRect(BOARD_X, BOARD_Y, BOARD_PIXEL_WIDTH, BOARD_PIXEL_HEIGHT);
    g.lineStyle(1, hex(theme.background), 1);
    for (let c = 1; c < BOARD_WIDTH; c++) {
      const x = BOARD_X + c * CELL_SIZE;
      g.lineBetween(x, BOARD_Y, x, BOARD_Y + BOARD_PIXEL_HEIGHT);
    }
    for (let r = 1; r < VISIBLE_HEIGHT; r++) {
      const y = BOARD_Y + r * CELL_SIZE;
      g.lineBetween(BOARD_X, y, BOARD_X + BOARD_PIXEL_WIDTH, y);
    }
    g.lineStyle(2, 0xffffff, 1);
    g.strokeRect(BOARD_X, BOARD_Y, BOARD_PIXEL_WIDTH, BOARD_PIXEL_HEIGHT);
    return g;
  }

  private buildCellPool(): void {
    for (let r = 0; r < VISIBLE_HEIGHT; r++) {
      const row: Phaser.GameObjects.Image[] = [];
      for (let c = 0; c < BOARD_WIDTH; c++) {
        const img = this.scene.add.image(
          BOARD_X + c * CELL_SIZE + CELL_SIZE / 2,
          BOARD_Y + r * CELL_SIZE + CELL_SIZE / 2,
          textureKeyFor('I'),
        );
        img.setVisible(false);
        row.push(img);
      }
      this.cells.push(row);
    }
  }

  private buildFourPool(pool: Phaser.GameObjects.Image[], alpha: number): void {
    for (let i = 0; i < 4; i++) {
      const img = this.scene.add.image(0, 0, textureKeyFor('I'));
      img.setAlpha(alpha);
      img.setVisible(false);
      pool.push(img);
    }
  }

  render(state: GameState): void {
    for (let r = 0; r < VISIBLE_HEIGHT; r++) {
      const boardRow = r + HIDDEN_ROWS;
      for (let c = 0; c < BOARD_WIDTH; c++) {
        const cell = state.board[boardRow]?.[c];
        const img = this.cells[r]![c]!;
        if (cell) {
          img.setTexture(textureKeyFor(cell));
          img.setVisible(true);
        } else {
          img.setVisible(false);
        }
      }
    }

    for (const img of this.active) img.setVisible(false);
    for (const img of this.ghost) img.setVisible(false);

    const active = state.active;
    if (!active) return;

    const offsets = pieceOffsets(active.id, active.rotation);
    const texture = textureKeyFor(active.id);

    let ghostRow = active.row;
    while (
      isValidPosition(state.board, active.id, active.rotation, active.col, ghostRow + 1)
    ) {
      ghostRow += 1;
    }

    if (ghostRow !== active.row) {
      for (let i = 0; i < 4; i++) {
        const [dc, dr] = offsets[i]!;
        const c = active.col + dc;
        const r = ghostRow + dr;
        if (r < HIDDEN_ROWS) continue;
        const img = this.ghost[i]!;
        img.setTexture(texture);
        img.setAlpha(theme.ghostAlpha);
        img.setPosition(
          BOARD_X + c * CELL_SIZE + CELL_SIZE / 2,
          BOARD_Y + (r - HIDDEN_ROWS) * CELL_SIZE + CELL_SIZE / 2,
        );
        img.setVisible(true);
      }
    }

    for (let i = 0; i < 4; i++) {
      const [dc, dr] = offsets[i]!;
      const c = active.col + dc;
      const r = active.row + dr;
      if (r < HIDDEN_ROWS) continue;
      const img = this.active[i]!;
      img.setTexture(texture);
      img.setAlpha(1);
      img.setScale(1);
      img.setPosition(
        BOARD_X + c * CELL_SIZE + CELL_SIZE / 2,
        BOARD_Y + (r - HIDDEN_ROWS) * CELL_SIZE + CELL_SIZE / 2,
      );
      img.setVisible(true);
    }
  }

  pulseActive(scene: Phaser.Scene): void {
    for (const img of this.active) {
      if (!img.visible) continue;
      scene.tweens.add({
        targets: img,
        scale: { from: 1, to: 1.18 },
        yoyo: true,
        duration: 90,
        ease: 'Sine.easeOut',
      });
    }
  }

  destroy(): void {
    this.grid.destroy();
    for (const row of this.cells) for (const img of row) img.destroy();
    for (const img of this.active) img.destroy();
    for (const img of this.ghost) img.destroy();
    this.cells.length = 0;
    this.active.length = 0;
    this.ghost.length = 0;
  }
}
