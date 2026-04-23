import * as Phaser from 'phaser';
import { CANVAS_WIDTH } from '@/config/layout';
import { theme } from '@/config/theme';
import { pwa } from '@/services/PWAService';
import { storage } from '@/services/StorageService';

const BTN_FILL = 0x222222;
const BTN_STROKE = 0x555555;
const BTN_FILL_HOVER = 0x333333;
const BTN_ACCENT_FILL = 0x2a5a2a;
const BTN_ACCENT_STROKE = 0x4aaa4a;
const BTN_ACCENT_HOVER = 0x3a7a3a;

export default class MenuScene extends Phaser.Scene {
  private level = 0;
  private levelText!: Phaser.GameObjects.Text;
  private installBtnBg?: Phaser.GameObjects.Rectangle;
  private installBtnText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(theme.background);

    this.level = storage.getSettings().startingLevel;

    const cx = CANVAS_WIDTH / 2;

    this.add
      .text(cx, 64, 'CLASSIC TETRIS', {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '26px',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 96, 'NES-STYLE', {
        color: theme.textMuted,
        fontFamily: 'monospace',
        fontSize: '12px',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 148, 'SELECT LEVEL', {
        color: theme.textMuted,
        fontFamily: 'monospace',
        fontSize: '13px',
      })
      .setOrigin(0.5);

    this.makeArrowButton(cx - 80, 208, '◀', () => this.changeLevel(-1));
    this.makeArrowButton(cx + 80, 208, '▶', () => this.changeLevel(1));

    this.levelText = this.add
      .text(cx, 208, String(this.level), {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '48px',
      })
      .setOrigin(0.5);

    this.makeAccentButton(cx, 298, 200, 44, 'START', () => this.startGame());
    this.makeSecondaryButton(cx, 354, 180, 36, 'SETTINGS', () =>
      this.scene.start('SettingsScene'),
    );
    this.makeSecondaryButton(cx, 398, 180, 36, 'HIGH SCORES', () =>
      this.scene.start('HighScoresScene'),
    );
    this.createInstallButton(cx);

    this.add
      .text(cx, 540, '← → MOVE · Z / X ROTATE · ↓ DROP', {
        color: theme.textMuted,
        fontFamily: 'monospace',
        fontSize: '10px',
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 560, 'P / ESC PAUSE', {
        color: theme.textMuted,
        fontFamily: 'monospace',
        fontSize: '10px',
      })
      .setOrigin(0.5);

    const kb = this.input.keyboard;
    if (kb) {
      const onLeft = (): void => this.changeLevel(-1);
      const onRight = (): void => this.changeLevel(1);
      const onStart = (): void => this.startGame();
      kb.on('keydown-LEFT', onLeft);
      kb.on('keydown-RIGHT', onRight);
      kb.on('keydown-ENTER', onStart);
      kb.on('keydown-SPACE', onStart);

      this.events.once('shutdown', () => {
        kb.off('keydown-LEFT', onLeft);
        kb.off('keydown-RIGHT', onRight);
        kb.off('keydown-ENTER', onStart);
        kb.off('keydown-SPACE', onStart);
      });
    }

    pwa.onAvailabilityChange(() => this.refreshInstallButton());
    this.refreshInstallButton();
  }

  private makeArrowButton(cx: number, cy: number, label: string, onTap: () => void): void {
    const bg = this.add
      .rectangle(cx, cy, 48, 48, BTN_FILL)
      .setStrokeStyle(1, BTN_STROKE)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(cx, cy, label, {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '24px',
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

  private makeAccentButton(
    cx: number,
    cy: number,
    width: number,
    height: number,
    label: string,
    onTap: () => void,
  ): void {
    const bg = this.add
      .rectangle(cx, cy, width, height, BTN_ACCENT_FILL)
      .setStrokeStyle(1, BTN_ACCENT_STROKE)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(cx, cy, label, {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '18px',
      })
      .setOrigin(0.5);
    bg.on('pointerdown', () => {
      bg.setFillStyle(BTN_ACCENT_HOVER);
      onTap();
    });
    bg.on('pointerup', () => bg.setFillStyle(BTN_ACCENT_FILL));
    bg.on('pointerupoutside', () => bg.setFillStyle(BTN_ACCENT_FILL));
    bg.on('pointerout', () => bg.setFillStyle(BTN_ACCENT_FILL));
    bg.on('pointerover', () => bg.setFillStyle(BTN_ACCENT_HOVER));
  }

  private makeSecondaryButton(
    cx: number,
    cy: number,
    width: number,
    height: number,
    label: string,
    onTap: () => void,
  ): void {
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

  private createInstallButton(cx: number): void {
    this.installBtnBg = this.add
      .rectangle(cx, 442, 180, 32, BTN_FILL)
      .setStrokeStyle(1, BTN_STROKE)
      .setInteractive({ useHandCursor: true })
      .setVisible(false);
    this.installBtnText = this.add
      .text(cx, 442, 'INSTALL', {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '13px',
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.installBtnBg.on('pointerdown', () => {
      void pwa.prompt().then(() => this.refreshInstallButton());
      this.installBtnBg?.setFillStyle(BTN_FILL_HOVER);
    });
    this.installBtnBg.on('pointerup', () => this.installBtnBg?.setFillStyle(BTN_FILL));
    this.installBtnBg.on('pointerupoutside', () => this.installBtnBg?.setFillStyle(BTN_FILL));
    this.installBtnBg.on('pointerout', () => this.installBtnBg?.setFillStyle(BTN_FILL));
    this.installBtnBg.on('pointerover', () => this.installBtnBg?.setFillStyle(BTN_FILL_HOVER));
  }

  private refreshInstallButton(): void {
    const available = pwa.canInstall();
    this.installBtnBg?.setVisible(available);
    this.installBtnText?.setVisible(available);
  }

  private changeLevel(delta: number): void {
    this.level = Math.max(0, Math.min(9, this.level + delta));
    this.levelText.setText(String(this.level));
    storage.updateSettings({ startingLevel: this.level });
  }

  private startGame(): void {
    this.scene.start('GameScene', {
      startLevel: this.level,
      seed: Date.now() >>> 0,
    });
  }
}
