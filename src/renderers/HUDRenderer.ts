import type * as Phaser from 'phaser';
import type { GameState } from '@/core/state';
import type { PieceId } from '@/core/tetromino';
import { pieceOffsets } from '@/core/tetromino';
import {
  NEXT_BOX_SIZE,
  NEXT_BOX_X,
  NEXT_BOX_Y,
  NEXT_CELL_SIZE,
  PANEL_WIDTH,
  PANEL_X,
} from '@/config/layout';
import { pieceColors, theme } from '@/config/theme';

function hex(value: string): number {
  return parseInt(value.replace('#', ''), 16);
}

const LABEL_STYLE = {
  color: theme.textMuted,
  fontFamily: 'monospace',
  fontSize: '12px',
} as const;

const VALUE_STYLE = {
  color: theme.text,
  fontFamily: 'monospace',
  fontSize: '16px',
} as const;

export class HUDRenderer {
  private readonly nextBoxGraphics: Phaser.GameObjects.Graphics;
  private readonly nextCells: Phaser.GameObjects.Rectangle[] = [];
  private readonly scoreValue: Phaser.GameObjects.Text;
  private readonly levelValue: Phaser.GameObjects.Text;
  private readonly linesValue: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const nextLabelY = NEXT_BOX_Y - 16;
    scene.add.text(NEXT_BOX_X + NEXT_BOX_SIZE / 2, nextLabelY, 'NEXT', LABEL_STYLE).setOrigin(0.5, 0);

    this.nextBoxGraphics = scene.add.graphics();
    this.nextBoxGraphics.fillStyle(hex(theme.grid), 1);
    this.nextBoxGraphics.fillRect(NEXT_BOX_X, NEXT_BOX_Y, NEXT_BOX_SIZE, NEXT_BOX_SIZE);
    this.nextBoxGraphics.lineStyle(1, 0x444444, 1);
    this.nextBoxGraphics.strokeRect(NEXT_BOX_X, NEXT_BOX_Y, NEXT_BOX_SIZE, NEXT_BOX_SIZE);

    for (let i = 0; i < 4; i++) {
      const rect = scene.add.rectangle(0, 0, NEXT_CELL_SIZE - 2, NEXT_CELL_SIZE - 2, 0xffffff);
      rect.setVisible(false);
      this.nextCells.push(rect);
    }

    const statsX = PANEL_X;
    let y = NEXT_BOX_Y + NEXT_BOX_SIZE + 16;

    scene.add.text(statsX, y, 'SCORE', LABEL_STYLE);
    y += 14;
    this.scoreValue = scene.add.text(statsX, y, '0', VALUE_STYLE);
    y += 28;

    scene.add.text(statsX, y, 'LEVEL', LABEL_STYLE);
    y += 14;
    this.levelValue = scene.add.text(statsX, y, '0', VALUE_STYLE);
    y += 28;

    scene.add.text(statsX, y, 'LINES', LABEL_STYLE);
    y += 14;
    this.linesValue = scene.add.text(statsX, y, '0', VALUE_STYLE);

    void PANEL_WIDTH;
  }

  render(state: GameState): void {
    this.scoreValue.setText(String(state.score));
    this.levelValue.setText(String(state.level));
    this.linesValue.setText(String(state.lines));
    this.drawNext(state.next);
  }

  private drawNext(id: PieceId): void {
    const offsets = pieceOffsets(id, 0);
    let minC = Infinity;
    let maxC = -Infinity;
    let minR = Infinity;
    let maxR = -Infinity;
    for (const [c, r] of offsets) {
      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
    }
    const widthCells = maxC - minC + 1;
    const heightCells = maxR - minR + 1;
    const centerX = NEXT_BOX_X + NEXT_BOX_SIZE / 2;
    const centerY = NEXT_BOX_Y + NEXT_BOX_SIZE / 2;
    const offsetX = centerX - (widthCells * NEXT_CELL_SIZE) / 2 - minC * NEXT_CELL_SIZE;
    const offsetY = centerY - (heightCells * NEXT_CELL_SIZE) / 2 - minR * NEXT_CELL_SIZE;

    const color = hex(pieceColors[id]);
    for (let i = 0; i < 4; i++) {
      const [dc, dr] = offsets[i]!;
      const rect = this.nextCells[i]!;
      rect.setFillStyle(color, 1);
      rect.setPosition(
        offsetX + dc * NEXT_CELL_SIZE + NEXT_CELL_SIZE / 2,
        offsetY + dr * NEXT_CELL_SIZE + NEXT_CELL_SIZE / 2,
      );
      rect.setVisible(true);
    }
  }

  destroy(): void {
    this.nextBoxGraphics.destroy();
    for (const rect of this.nextCells) rect.destroy();
    this.scoreValue.destroy();
    this.levelValue.destroy();
    this.linesValue.destroy();
  }
}
