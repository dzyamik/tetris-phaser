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
import { pieceColors, theme } from '@/config/theme';

function hex(value: string): number {
  return parseInt(value.replace('#', ''), 16);
}

const CELL_INSET = 2;

export class BoardRenderer {
  private readonly scene: Phaser.Scene;
  private readonly grid: Phaser.GameObjects.Graphics;
  private readonly cells: Phaser.GameObjects.Rectangle[][] = [];
  private readonly active: Phaser.GameObjects.Rectangle[] = [];
  private readonly ghost: Phaser.GameObjects.Rectangle[] = [];

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
      const row: Phaser.GameObjects.Rectangle[] = [];
      for (let c = 0; c < BOARD_WIDTH; c++) {
        const rect = this.scene.add.rectangle(
          BOARD_X + c * CELL_SIZE + CELL_SIZE / 2,
          BOARD_Y + r * CELL_SIZE + CELL_SIZE / 2,
          CELL_SIZE - CELL_INSET,
          CELL_SIZE - CELL_INSET,
          0xffffff,
        );
        rect.setVisible(false);
        row.push(rect);
      }
      this.cells.push(row);
    }
  }

  private buildFourPool(pool: Phaser.GameObjects.Rectangle[], alpha: number): void {
    for (let i = 0; i < 4; i++) {
      const rect = this.scene.add.rectangle(
        0,
        0,
        CELL_SIZE - CELL_INSET,
        CELL_SIZE - CELL_INSET,
        0xffffff,
      );
      rect.setAlpha(alpha);
      rect.setVisible(false);
      pool.push(rect);
    }
  }

  render(state: GameState): void {
    for (let r = 0; r < VISIBLE_HEIGHT; r++) {
      const boardRow = r + HIDDEN_ROWS;
      for (let c = 0; c < BOARD_WIDTH; c++) {
        const cell = state.board[boardRow]?.[c];
        const rect = this.cells[r]![c]!;
        if (cell) {
          rect.setVisible(true);
          rect.setFillStyle(hex(pieceColors[cell]), 1);
        } else {
          rect.setVisible(false);
        }
      }
    }

    for (const rect of this.active) rect.setVisible(false);
    for (const rect of this.ghost) rect.setVisible(false);

    const active = state.active;
    if (!active) return;

    const offsets = pieceOffsets(active.id, active.rotation);
    const color = hex(pieceColors[active.id]);

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
        const rect = this.ghost[i]!;
        rect.setFillStyle(color, 1);
        rect.setAlpha(theme.ghostAlpha);
        rect.setPosition(
          BOARD_X + c * CELL_SIZE + CELL_SIZE / 2,
          BOARD_Y + (r - HIDDEN_ROWS) * CELL_SIZE + CELL_SIZE / 2,
        );
        rect.setVisible(true);
      }
    }

    for (let i = 0; i < 4; i++) {
      const [dc, dr] = offsets[i]!;
      const c = active.col + dc;
      const r = active.row + dr;
      if (r < HIDDEN_ROWS) continue;
      const rect = this.active[i]!;
      rect.setFillStyle(color, 1);
      rect.setAlpha(1);
      rect.setPosition(
        BOARD_X + c * CELL_SIZE + CELL_SIZE / 2,
        BOARD_Y + (r - HIDDEN_ROWS) * CELL_SIZE + CELL_SIZE / 2,
      );
      rect.setVisible(true);
    }
  }

  destroy(): void {
    this.grid.destroy();
    for (const row of this.cells) for (const rect of row) rect.destroy();
    for (const rect of this.active) rect.destroy();
    for (const rect of this.ghost) rect.destroy();
    this.cells.length = 0;
    this.active.length = 0;
    this.ghost.length = 0;
  }
}
