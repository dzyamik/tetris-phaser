import * as Phaser from 'phaser';
import { CANVAS_WIDTH } from '@/config/layout';
import { theme } from '@/config/theme';
import { storage } from '@/services/StorageService';
import { audio } from '@/services/AudioService';

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

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default class GameOverScene extends Phaser.Scene {
  private score = 0;
  private level = 0;
  private lines = 0;
  private startLevel = 0;

  private mode: 'initials' | 'final' = 'final';
  private initials: [number, number, number] = [0, 0, 0];
  private activeSlot = 0;

  private slotTexts: Phaser.GameObjects.Text[] = [];
  private slotIndicators: Phaser.GameObjects.Rectangle[] = [];
  private initialsElements: Phaser.GameObjects.GameObject[] = [];
  private finalElements: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: GameOverData): void {
    this.score = data.score ?? 0;
    this.level = data.level ?? 0;
    this.lines = data.lines ?? 0;
    this.startLevel = data.startLevel ?? 0;
    this.mode = 'final';
    this.initials = [0, 0, 0];
    this.activeSlot = 0;
    this.slotTexts = [];
    this.slotIndicators = [];
    this.initialsElements = [];
    this.finalElements = [];
  }

  create(): void {
    this.cameras.main.setBackgroundColor(theme.background);
    audio.stopMusic();

    const cx = CANVAS_WIDTH / 2;

    this.add
      .text(cx, 80, 'GAME OVER', {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '26px',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 134, 'SCORE', {
        color: theme.textMuted,
        fontFamily: 'monospace',
        fontSize: '11px',
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 160, String(this.score), {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '28px',
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 198, `LEVEL ${this.level}  ·  LINES ${this.lines}`, {
        color: theme.textMuted,
        fontFamily: 'monospace',
        fontSize: '12px',
      })
      .setOrigin(0.5);

    if (storage.qualifiesForHighScore(this.score)) {
      this.mode = 'initials';
      this.renderInitialsEntry();
    } else {
      this.mode = 'final';
      this.renderFinalView();
    }

    this.wireKeyboard();
  }

  private renderInitialsEntry(): void {
    const cx = CANVAS_WIDTH / 2;

    this.initialsElements.push(
      this.add
        .text(cx, 250, 'NEW HIGH SCORE', {
          color: theme.text,
          fontFamily: 'monospace',
          fontSize: '14px',
        })
        .setOrigin(0.5),
    );

    const slotY = 320;
    const slotSpacing = 54;
    const slotStartX = cx - slotSpacing;

    for (let i = 0; i < 3; i++) {
      const x = slotStartX + i * slotSpacing;
      const bg = this.add
        .rectangle(x, slotY, 44, 54, 0x181818)
        .setStrokeStyle(1, BTN_STROKE)
        .setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this.tapSlot(i));
      this.initialsElements.push(bg);

      const text = this.add
        .text(x, slotY, LETTERS[this.initials[i]!]!, {
          color: theme.text,
          fontFamily: 'monospace',
          fontSize: '32px',
        })
        .setOrigin(0.5);
      this.slotTexts.push(text);
      this.initialsElements.push(text);

      const indicator = this.add.rectangle(x, slotY + 36, 32, 2, 0xffffff).setVisible(false);
      this.slotIndicators.push(indicator);
      this.initialsElements.push(indicator);
    }
    this.refreshSlots();

    this.initialsElements.push(
      this.add
        .text(cx, 390, 'TAP A SLOT TO CYCLE · TYPE LETTERS', {
          color: theme.textMuted,
          fontFamily: 'monospace',
          fontSize: '10px',
        })
        .setOrigin(0.5),
    );
    this.initialsElements.push(
      this.add
        .text(cx, 406, '← → NAVIGATE · ENTER SUBMIT', {
          color: theme.textMuted,
          fontFamily: 'monospace',
          fontSize: '10px',
        })
        .setOrigin(0.5),
    );

    const submitBtn = this.makeAccentButton(cx, 470, 180, 42, 'SUBMIT', () =>
      this.submitInitials(),
    );
    this.initialsElements.push(submitBtn.bg, submitBtn.text);
  }

  private renderFinalView(): void {
    const cx = CANVAS_WIDTH / 2;
    const scores = storage.getHighScores();

    this.finalElements.push(
      this.add
        .text(cx, 250, 'TOP SCORES', {
          color: theme.textMuted,
          fontFamily: 'monospace',
          fontSize: '12px',
        })
        .setOrigin(0.5),
    );

    const listY = 278;
    const rowH = 22;
    const visible = scores.slice(0, 5);

    if (visible.length === 0) {
      this.finalElements.push(
        this.add
          .text(cx, listY + 20, 'NO SCORES YET', {
            color: theme.textMuted,
            fontFamily: 'monospace',
            fontSize: '12px',
          })
          .setOrigin(0.5),
      );
    } else {
      for (let i = 0; i < visible.length; i++) {
        const s = visible[i]!;
        const row = `${String(i + 1).padStart(2, ' ')}  ${s.name.padEnd(4, ' ')}  ${String(s.score).padStart(7, ' ')}`;
        this.finalElements.push(
          this.add
            .text(cx, listY + i * rowH, row, {
              color: theme.text,
              fontFamily: 'monospace',
              fontSize: '14px',
            })
            .setOrigin(0.5),
        );
      }
    }

    const playAgain = this.makeAccentButton(cx, 470, 200, 44, 'PLAY AGAIN', () =>
      this.playAgain(),
    );
    this.finalElements.push(playAgain.bg, playAgain.text);

    const menu = this.makeSecondaryButton(cx, 530, 160, 36, 'MENU', () => this.toMenu());
    this.finalElements.push(menu.bg, menu.text);
  }

  private wireKeyboard(): void {
    const kb = this.input.keyboard;
    if (!kb) return;

    const onAnyKey = (event: KeyboardEvent): void => {
      if (this.mode === 'initials') this.handleInitialsKey(event);
    };
    const onLeft = (): void => {
      if (this.mode === 'initials') this.moveSlot(-1);
    };
    const onRight = (): void => {
      if (this.mode === 'initials') this.moveSlot(1);
    };
    const onUp = (): void => {
      if (this.mode === 'initials') this.cycleSlot(this.activeSlot, 1);
    };
    const onDown = (): void => {
      if (this.mode === 'initials') this.cycleSlot(this.activeSlot, -1);
    };
    const onEnter = (): void => {
      if (this.mode === 'initials') this.submitInitials();
      else this.playAgain();
    };
    const onEsc = (): void => {
      if (this.mode === 'final') this.toMenu();
    };

    kb.on('keydown', onAnyKey);
    kb.on('keydown-LEFT', onLeft);
    kb.on('keydown-RIGHT', onRight);
    kb.on('keydown-UP', onUp);
    kb.on('keydown-DOWN', onDown);
    kb.on('keydown-ENTER', onEnter);
    kb.on('keydown-SPACE', onEnter);
    kb.on('keydown-ESC', onEsc);

    this.events.once('shutdown', () => {
      kb.off('keydown', onAnyKey);
      kb.off('keydown-LEFT', onLeft);
      kb.off('keydown-RIGHT', onRight);
      kb.off('keydown-UP', onUp);
      kb.off('keydown-DOWN', onDown);
      kb.off('keydown-ENTER', onEnter);
      kb.off('keydown-SPACE', onEnter);
      kb.off('keydown-ESC', onEsc);
    });
  }

  private handleInitialsKey(event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      event.preventDefault?.();
      this.moveSlot(-1);
      this.cycleSlot(this.activeSlot, 0);
      return;
    }
    if (event.key.length !== 1) return;
    const upper = event.key.toUpperCase();
    const idx = LETTERS.indexOf(upper);
    if (idx < 0) return;
    this.initials[this.activeSlot] = idx;
    this.refreshSlots();
    this.moveSlot(1);
  }

  private tapSlot(slot: number): void {
    if (this.activeSlot !== slot) {
      this.activeSlot = slot;
      this.refreshSlots();
      return;
    }
    this.cycleSlot(slot, 1);
  }

  private cycleSlot(slot: number, delta: number): void {
    const current = this.initials[slot]!;
    const next = (current + delta + LETTERS.length) % LETTERS.length;
    this.initials[slot] = next;
    this.refreshSlots();
  }

  private moveSlot(delta: number): void {
    this.activeSlot = Math.max(0, Math.min(2, this.activeSlot + delta));
    this.refreshSlots();
  }

  private refreshSlots(): void {
    for (let i = 0; i < 3; i++) {
      this.slotTexts[i]?.setText(LETTERS[this.initials[i]!]!);
      this.slotIndicators[i]?.setVisible(i === this.activeSlot);
    }
  }

  private submitInitials(): void {
    const name = this.initials.map((i) => LETTERS[i]!).join('');
    storage.addHighScore({
      name,
      score: this.score,
      level: this.level,
      lines: this.lines,
      date: new Date().toISOString(),
    });
    for (const el of this.initialsElements) el.destroy();
    this.initialsElements = [];
    this.slotTexts = [];
    this.slotIndicators = [];
    this.mode = 'final';
    this.renderFinalView();
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

  private makeSecondaryButton(
    cx: number,
    cy: number,
    width: number,
    height: number,
    label: string,
    onTap: () => void,
  ): { bg: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text } {
    const bg = this.add
      .rectangle(cx, cy, width, height, BTN_FILL)
      .setStrokeStyle(1, BTN_STROKE)
      .setInteractive({ useHandCursor: true });
    const text = this.add
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
    return { bg, text };
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
