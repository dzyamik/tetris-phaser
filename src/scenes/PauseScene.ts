import * as Phaser from 'phaser';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/config/layout';
import { theme } from '@/config/theme';

const BTN_FILL = 0x222222;
const BTN_STROKE = 0x555555;
const BTN_FILL_HOVER = 0x333333;
const BTN_ACCENT_FILL = 0x2a5a2a;
const BTN_ACCENT_STROKE = 0x4aaa4a;
const BTN_ACCENT_HOVER = 0x3a7a3a;

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene' });
  }

  create(): void {
    const cx = CANVAS_WIDTH / 2;

    const overlay = this.add
      .rectangle(cx, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT, 0x000000, 0.75)
      .setInteractive();
    overlay.on('pointerdown', () => this.resumeGame());

    this.add
      .text(cx, 220, 'PAUSED', {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '32px',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 260, 'TAP OR PRESS P TO RESUME', {
        color: theme.textMuted,
        fontFamily: 'monospace',
        fontSize: '11px',
      })
      .setOrigin(0.5);

    this.makeButton(
      cx,
      316,
      180,
      44,
      'RESUME',
      BTN_ACCENT_FILL,
      BTN_ACCENT_STROKE,
      BTN_ACCENT_HOVER,
      '18px',
      () => this.resumeGame(),
    );

    this.makeButton(
      cx,
      372,
      180,
      36,
      'SETTINGS',
      BTN_FILL,
      BTN_STROKE,
      BTN_FILL_HOVER,
      '14px',
      () => this.openSettings(),
    );

    this.makeButton(
      cx,
      420,
      180,
      36,
      'MENU',
      BTN_FILL,
      BTN_STROKE,
      BTN_FILL_HOVER,
      '14px',
      () => this.goToMenu(),
    );

    const kb = this.input.keyboard;
    if (!kb) return;

    const onResume = (): void => this.resumeGame();
    const onMenu = (): void => this.goToMenu();
    const onSettings = (): void => this.openSettings();

    kb.on('keydown-P', onResume);
    kb.on('keydown-ESC', onResume);
    kb.on('keydown-ENTER', onResume);
    kb.on('keydown-SPACE', onResume);
    kb.on('keydown-M', onMenu);
    kb.on('keydown-S', onSettings);

    this.events.once('shutdown', () => {
      kb.off('keydown-P', onResume);
      kb.off('keydown-ESC', onResume);
      kb.off('keydown-ENTER', onResume);
      kb.off('keydown-SPACE', onResume);
      kb.off('keydown-M', onMenu);
      kb.off('keydown-S', onSettings);
    });
  }

  private openSettings(): void {
    this.scene.launch('SettingsScene', { from: 'pause' });
    this.scene.pause();
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
    bg.on('pointerdown', (_p: unknown, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
      e.stopPropagation?.();
      bg.setFillStyle(hover);
      onTap();
    });
    bg.on('pointerup', () => bg.setFillStyle(fill));
    bg.on('pointerupoutside', () => bg.setFillStyle(fill));
    bg.on('pointerout', () => bg.setFillStyle(fill));
    bg.on('pointerover', () => bg.setFillStyle(hover));
  }

  private resumeGame(): void {
    this.scene.resume('GameScene');
    this.scene.stop();
  }

  private goToMenu(): void {
    this.scene.stop('GameScene');
    this.scene.start('MenuScene');
  }
}
