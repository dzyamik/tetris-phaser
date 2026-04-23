import * as Phaser from 'phaser';
import { CANVAS_WIDTH } from '@/config/layout';
import { theme } from '@/config/theme';
import { haptics } from '@/services/HapticsService';
import { pwa } from '@/services/PWAService';

const BTN_FILL = 0x222222;
const BTN_STROKE = 0x555555;
const BTN_FILL_HOVER = 0x333333;
const BTN_ACCENT_FILL = 0x2a5a2a;
const BTN_ACCENT_STROKE = 0x4aaa4a;
const BTN_ACCENT_HOVER = 0x3a7a3a;

export default class MenuScene extends Phaser.Scene {
  private level = 0;
  private levelText!: Phaser.GameObjects.Text;
  private hapticsToggle?: Phaser.GameObjects.Text;
  private installBtnBg?: Phaser.GameObjects.Rectangle;
  private installBtnText?: Phaser.GameObjects.Text;

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
        fontSize: '26px',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 104, 'NES-STYLE', {
        color: theme.textMuted,
        fontFamily: 'monospace',
        fontSize: '12px',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 168, 'SELECT LEVEL', {
        color: theme.textMuted,
        fontFamily: 'monospace',
        fontSize: '13px',
      })
      .setOrigin(0.5);

    this.makeArrowButton(cx - 80, 228, '◀', () => this.changeLevel(-1));
    this.makeArrowButton(cx + 80, 228, '▶', () => this.changeLevel(1));

    this.levelText = this.add
      .text(cx, 228, '0', {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '52px',
      })
      .setOrigin(0.5);

    this.makeAccentButton(cx, 320, 180, 44, 'START', () => this.startGame());

    this.createHapticsToggle(cx, 380);
    this.createInstallButton(cx, 430);

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
  ): { bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text } {
    const bg = this.add
      .rectangle(cx, cy, width, height, BTN_ACCENT_FILL)
      .setStrokeStyle(1, BTN_ACCENT_STROKE)
      .setInteractive({ useHandCursor: true });
    const text = this.add
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
    return { bg, text };
  }

  private createHapticsToggle(cx: number, cy: number): void {
    if (!haptics.isSupported()) return;
    this.hapticsToggle = this.add
      .text(cx, cy, this.hapticsLabel(), {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '13px',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.hapticsToggle.on('pointerdown', () => {
      haptics.toggle();
      this.hapticsToggle?.setText(this.hapticsLabel());
    });
  }

  private hapticsLabel(): string {
    return `HAPTICS: ${haptics.isEnabled() ? 'ON' : 'OFF'}`;
  }

  private createInstallButton(cx: number, cy: number): void {
    this.installBtnBg = this.add
      .rectangle(cx, cy, 180, 36, BTN_FILL)
      .setStrokeStyle(1, BTN_STROKE)
      .setInteractive({ useHandCursor: true })
      .setVisible(false);
    this.installBtnText = this.add
      .text(cx, cy, 'INSTALL', {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '14px',
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
  }

  private startGame(): void {
    this.scene.start('GameScene', {
      startLevel: this.level,
      seed: Date.now() >>> 0,
    });
  }
}
