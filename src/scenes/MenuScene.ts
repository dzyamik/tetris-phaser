import * as Phaser from 'phaser';
import { CANVAS_WIDTH } from '@/config/layout';
import { theme } from '@/config/theme';
import { pwa } from '@/services/PWAService';
import { storage } from '@/services/StorageService';
import { audio } from '@/services/AudioService';

const BTN_FILL = 0x222222;
const BTN_STROKE = 0x555555;
const BTN_FILL_HOVER = 0x333333;
const BTN_ACCENT_FILL = 0x2a5a2a;
const BTN_ACCENT_STROKE = 0x4aaa4a;
const BTN_ACCENT_HOVER = 0x3a7a3a;
const BTN_INFO_FILL = 0x2a3a5a;
const BTN_INFO_STROKE = 0x4a7aaa;
const BTN_INFO_HOVER = 0x3a5a8a;

export default class MenuScene extends Phaser.Scene {
  private level = 0;
  private levelText!: Phaser.GameObjects.Text;
  private installBtnBg?: Phaser.GameObjects.Rectangle;
  private installBtnText?: Phaser.GameObjects.Text;
  private iosHintText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(theme.background);

    this.level = storage.getSettings().startingLevel;

    const cx = CANVAS_WIDTH / 2;

    this.add
      .text(cx, 56, 'CLASSIC TETRIS', {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '24px',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 84, 'NES-STYLE', {
        color: theme.textMuted,
        fontFamily: 'monospace',
        fontSize: '11px',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 128, 'SELECT LEVEL', {
        color: theme.textMuted,
        fontFamily: 'monospace',
        fontSize: '12px',
      })
      .setOrigin(0.5);

    this.makeArrowButton(cx - 72, 184, '◀', () => this.changeLevel(-1));
    this.makeArrowButton(cx + 72, 184, '▶', () => this.changeLevel(1));

    this.levelText = this.add
      .text(cx, 184, String(this.level), {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '44px',
      })
      .setOrigin(0.5);

    const hasSave = storage.hasSavedGame();
    if (hasSave) {
      this.makeButton(
        cx,
        262,
        200,
        44,
        'CONTINUE',
        BTN_INFO_FILL,
        BTN_INFO_STROKE,
        BTN_INFO_HOVER,
        '18px',
        () => this.continueGame(),
      );
    }

    this.makeButton(
      cx,
      hasSave ? 316 : 282,
      200,
      44,
      hasSave ? 'NEW GAME' : 'START',
      BTN_ACCENT_FILL,
      BTN_ACCENT_STROKE,
      BTN_ACCENT_HOVER,
      '18px',
      () => this.startGame(),
    );

    this.makeButton(
      cx,
      374,
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
      418,
      180,
      36,
      'HIGH SCORES',
      BTN_FILL,
      BTN_STROKE,
      BTN_FILL_HOVER,
      '14px',
      () => this.openHighScores(),
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
      const onStart = (): void => (hasSave ? this.continueGame() : this.startGame());
      const onNewGame = (): void => this.startGame();
      kb.on('keydown-LEFT', onLeft);
      kb.on('keydown-RIGHT', onRight);
      kb.on('keydown-ENTER', onStart);
      kb.on('keydown-SPACE', onStart);
      kb.on('keydown-N', onNewGame);

      this.events.once('shutdown', () => {
        kb.off('keydown-LEFT', onLeft);
        kb.off('keydown-RIGHT', onRight);
        kb.off('keydown-ENTER', onStart);
        kb.off('keydown-SPACE', onStart);
        kb.off('keydown-N', onNewGame);
      });
    }

    const unsubscribe = pwa.onAvailabilityChange(() => this.refreshInstallButton());
    this.events.once('shutdown', unsubscribe);
    this.refreshInstallButton();

    audio.startMusic();
  }

  private makeArrowButton(cx: number, cy: number, label: string, onTap: () => void): void {
    const bg = this.add
      .rectangle(cx, cy, 44, 44, BTN_FILL)
      .setStrokeStyle(1, BTN_STROKE)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(cx, cy, label, {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '22px',
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

  private createInstallButton(cx: number): void {
    this.installBtnBg = this.add
      .rectangle(cx, 468, 180, 30, BTN_FILL)
      .setStrokeStyle(1, BTN_STROKE)
      .setInteractive({ useHandCursor: true })
      .setVisible(false);
    this.installBtnText = this.add
      .text(cx, 468, 'INSTALL', {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '13px',
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.iosHintText = this.add
      .text(cx, 468, 'ADD TO HOME SCREEN:\nSHARE → ADD TO HOME SCREEN', {
        color: theme.textMuted,
        fontFamily: 'monospace',
        fontSize: '10px',
        align: 'center',
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
    if (pwa.isInstalled()) {
      this.installBtnBg?.setVisible(false);
      this.installBtnText?.setVisible(false);
      this.iosHintText?.setVisible(false);
      return;
    }
    const canPrompt = pwa.canInstall();
    this.installBtnBg?.setVisible(canPrompt);
    this.installBtnText?.setVisible(canPrompt);
    this.iosHintText?.setVisible(!canPrompt && pwa.isIOS());
  }

  private changeLevel(delta: number): void {
    this.level = Math.max(0, Math.min(9, this.level + delta));
    this.levelText.setText(String(this.level));
    storage.updateSettings({ startingLevel: this.level });
  }

  private startGame(): void {
    storage.clearSavedGame();
    this.scene.start('GameScene', {
      startLevel: this.level,
      seed: Date.now() >>> 0,
    });
  }

  private continueGame(): void {
    this.scene.start('GameScene', { resume: true });
  }

  private openSettings(): void {
    this.scene.launch('SettingsScene', { from: 'menu' });
    this.scene.pause();
  }

  private openHighScores(): void {
    this.scene.launch('HighScoresScene', { from: 'menu' });
    this.scene.pause();
  }
}
