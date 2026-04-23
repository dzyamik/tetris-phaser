import * as Phaser from 'phaser';
import { CANVAS_WIDTH } from '@/config/layout';
import { theme } from '@/config/theme';

export default class MenuScene extends Phaser.Scene {
  private level = 0;
  private levelText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(theme.background);

    const cx = CANVAS_WIDTH / 2;

    this.add
      .text(cx, 72, 'CLASSIC TETRIS', {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '28px',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 112, 'NES-STYLE', {
        color: theme.textMuted,
        fontFamily: 'monospace',
        fontSize: '12px',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 220, 'SELECT LEVEL', {
        color: theme.textMuted,
        fontFamily: 'monospace',
        fontSize: '14px',
      })
      .setOrigin(0.5);

    this.add
      .text(cx - 72, 280, '<', {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '36px',
      })
      .setOrigin(0.5);

    this.add
      .text(cx + 72, 280, '>', {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '36px',
      })
      .setOrigin(0.5);

    this.levelText = this.add
      .text(cx, 280, '0', {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '56px',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 400, 'PRESS ENTER TO START', {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '14px',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 520, '← →  MOVE', {
        color: theme.textMuted,
        fontFamily: 'monospace',
        fontSize: '11px',
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 540, 'Z / X  ROTATE', {
        color: theme.textMuted,
        fontFamily: 'monospace',
        fontSize: '11px',
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 560, '↓  SOFT DROP', {
        color: theme.textMuted,
        fontFamily: 'monospace',
        fontSize: '11px',
      })
      .setOrigin(0.5);

    const kb = this.input.keyboard;
    if (!kb) return;

    const onLeft = (): void => this.changeLevel(-1);
    const onRight = (): void => this.changeLevel(1);
    const onEnter = (): void => this.startGame();

    kb.on('keydown-LEFT', onLeft);
    kb.on('keydown-RIGHT', onRight);
    kb.on('keydown-ENTER', onEnter);
    kb.on('keydown-SPACE', onEnter);

    this.events.once('shutdown', () => {
      kb.off('keydown-LEFT', onLeft);
      kb.off('keydown-RIGHT', onRight);
      kb.off('keydown-ENTER', onEnter);
      kb.off('keydown-SPACE', onEnter);
    });
  }

  private changeLevel(delta: number): void {
    this.level = Math.max(0, Math.min(9, this.level + delta));
    this.levelText.setText(String(this.level));
  }

  private startGame(): void {
    this.scene.start('GameScene', {
      startLevel: this.level,
      seed: Date.now() >>> 0,
    });
  }
}
