import * as Phaser from 'phaser';
import { theme } from '@/config/theme';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(theme.background);

    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 16, 'CLASSIC TETRIS', {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '28px',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 20, 'M0 — scaffold', {
        color: theme.textMuted,
        fontFamily: 'monospace',
        fontSize: '14px',
      })
      .setOrigin(0.5);
  }
}
