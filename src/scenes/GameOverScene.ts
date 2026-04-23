import * as Phaser from 'phaser';
import { CANVAS_WIDTH } from '@/config/layout';
import { theme } from '@/config/theme';

type GameOverData = {
  score?: number;
  level?: number;
  lines?: number;
  startLevel?: number;
};

const BTN_FILL = 0x222222;
const BTN_STROKE = 0x555555;
const BTN_FILL_HOVER = 0x333333;
const BTN_ACCENT_FILL = 0x2a5a2a;
const BTN_ACCENT_STROKE = 0x4aaa4a;
const BTN_ACCENT_HOVER = 0x3a7a3a;

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

    this.makeButton(
      cx,
      420,
      200,
      44,
      'PLAY AGAIN',
      BTN_ACCENT_FILL,
      BTN_ACCENT_STROKE,
      BTN_ACCENT_HOVER,
      '18px',
      () => this.playAgain(),
    );

    this.makeButton(
      cx,
      480,
      160,
      36,
      'MENU',
      BTN_FILL,
      BTN_STROKE,
      BTN_FILL_HOVER,
      '14px',
      () => this.toMenu(),
    );

    const kb = this.input.keyboard;
    if (!kb) return;

    const onPlay = (): void => this.playAgain();
    const onMenu = (): void => this.toMenu();

    kb.on('keydown-ENTER', onPlay);
    kb.on('keydown-SPACE', onPlay);
    kb.on('keydown-ESC', onMenu);

    this.events.once('shutdown', () => {
      kb.off('keydown-ENTER', onPlay);
      kb.off('keydown-SPACE', onPlay);
      kb.off('keydown-ESC', onMenu);
    });
  }

  private makeButton(
    cx: number,
    cy: number,
    width: number,
    height: number,
    label: string,
    fill: number,
    stroke: number,
    hover: number,
    fontSize: string,
    onTap: () => void,
  ): void {
    const bg = this.add
      .rectangle(cx, cy, width, height, fill)
      .setStrokeStyle(1, stroke)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(cx, cy, label, {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize,
      })
      .setOrigin(0.5);
    bg.on('pointerdown', () => {
      bg.setFillStyle(hover);
      onTap();
    });
    bg.on('pointerup', () => bg.setFillStyle(fill));
    bg.on('pointerupoutside', () => bg.setFillStyle(fill));
    bg.on('pointerout', () => bg.setFillStyle(fill));
    bg.on('pointerover', () => bg.setFillStyle(hover));
  }

  private playAgain(): void {
    this.scene.start('GameScene', {
      startLevel: this.startLevel,
      seed: Date.now() >>> 0,
    });
  }

  private toMenu(): void {
    this.scene.start('MenuScene');
  }
}
