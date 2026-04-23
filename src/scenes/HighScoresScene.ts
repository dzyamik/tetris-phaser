import * as Phaser from 'phaser';
import { CANVAS_WIDTH } from '@/config/layout';
import { theme } from '@/config/theme';
import { storage } from '@/services/StorageService';

const BTN_FILL = 0x222222;
const BTN_STROKE = 0x555555;
const BTN_FILL_HOVER = 0x333333;

export default class HighScoresScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HighScoresScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(theme.background);

    const cx = CANVAS_WIDTH / 2;

    this.add
      .text(cx, 64, 'HIGH SCORES', {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '24px',
      })
      .setOrigin(0.5);

    this.renderScores();

    this.makeButton(cx, 560, 160, 40, 'BACK', () => this.goBack());

    const kb = this.input.keyboard;
    if (kb) {
      const onBack = (): void => this.goBack();
      kb.on('keydown-ESC', onBack);
      kb.on('keydown-BACKSPACE', onBack);
      kb.on('keydown-ENTER', onBack);
      kb.on('keydown-SPACE', onBack);
      this.events.once('shutdown', () => {
        kb.off('keydown-ESC', onBack);
        kb.off('keydown-BACKSPACE', onBack);
        kb.off('keydown-ENTER', onBack);
        kb.off('keydown-SPACE', onBack);
      });
    }
  }

  private renderScores(): void {
    const scores = storage.getHighScores();
    const x = 32;
    const startY = 130;
    const rowH = 32;

    if (scores.length === 0) {
      this.add
        .text(CANVAS_WIDTH / 2, 240, 'NO SCORES YET', {
          color: theme.textMuted,
          fontFamily: 'monospace',
          fontSize: '14px',
        })
        .setOrigin(0.5);
      return;
    }

    this.add.text(x, startY - 24, '#   NAME   SCORE        LV', {
      color: theme.textMuted,
      fontFamily: 'monospace',
      fontSize: '11px',
    });

    for (let i = 0; i < scores.length; i++) {
      const s = scores[i]!;
      const rank = String(i + 1).padStart(2, ' ');
      const name = s.name.padEnd(4, ' ');
      const score = String(s.score).padStart(7, ' ');
      const level = String(s.level).padStart(2, ' ');
      const line = `${rank}  ${name}  ${score}     ${level}`;
      this.add.text(x, startY + i * rowH, line, {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '14px',
      });
    }
  }

  private makeButton(cx: number, cy: number, width: number, height: number, label: string, onTap: () => void): void {
    const bg = this.add
      .rectangle(cx, cy, width, height, BTN_FILL)
      .setStrokeStyle(1, BTN_STROKE)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(cx, cy, label, {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '14px',
      })
      .setOrigin(0.5);
    bg.on('pointerdown', () => {
      bg.setFillStyle(BTN_FILL_HOVER);
      onTap();
    });
    bg.on('pointerup', () => bg.setFillStyle(BTN_FILL));
    bg.on('pointerupoutside', () => bg.setFillStyle(BTN_FILL));
    bg.on('pointerout', () => bg.setFillStyle(BTN_FILL));
    bg.on('pointerover', () => bg.setFillStyle(BTN_FILL_HOVER));
  }

  private goBack(): void {
    this.scene.resume('MenuScene');
    this.scene.stop();
  }
}
