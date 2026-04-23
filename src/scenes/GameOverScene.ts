import * as Phaser from 'phaser';
import { CANVAS_WIDTH } from '@/config/layout';
import { theme } from '@/config/theme';

type GameOverData = {
  score?: number;
  level?: number;
  lines?: number;
  startLevel?: number;
};

export default class GameOverScene extends Phaser.Scene {
  private score = 0;
  private level = 0;
  private lines = 0;
  private startLevel = 0;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: GameOverData): void {
    this.score = data.score ?? 0;
    this.level = data.level ?? 0;
    this.lines = data.lines ?? 0;
    this.startLevel = data.startLevel ?? 0;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(theme.background);

    const cx = CANVAS_WIDTH / 2;

    this.add
      .text(cx, 96, 'GAME OVER', {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '28px',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 200, 'SCORE', {
        color: theme.textMuted,
        fontFamily: 'monospace',
        fontSize: '12px',
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 228, String(this.score), {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '32px',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 300, `LEVEL ${this.level}`, {
        color: theme.textMuted,
        fontFamily: 'monospace',
        fontSize: '14px',
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 324, `LINES ${this.lines}`, {
        color: theme.textMuted,
        fontFamily: 'monospace',
        fontSize: '14px',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 460, 'ENTER  PLAY AGAIN', {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '13px',
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 490, 'ESC  MENU', {
        color: theme.textMuted,
        fontFamily: 'monospace',
        fontSize: '12px',
      })
      .setOrigin(0.5);

    const kb = this.input.keyboard;
    if (!kb) return;

    const playAgain = (): void => {
      this.scene.start('GameScene', {
        startLevel: this.startLevel,
        seed: Date.now() >>> 0,
      });
    };
    const toMenu = (): void => {
      this.scene.start('MenuScene');
    };

    kb.on('keydown-ENTER', playAgain);
    kb.on('keydown-SPACE', playAgain);
    kb.on('keydown-ESC', toMenu);

    this.events.once('shutdown', () => {
      kb.off('keydown-ENTER', playAgain);
      kb.off('keydown-SPACE', playAgain);
      kb.off('keydown-ESC', toMenu);
    });
  }
}
