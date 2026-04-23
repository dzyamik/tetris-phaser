import * as Phaser from 'phaser';
import { CANVAS_WIDTH } from '@/config/layout';
import { theme } from '@/config/theme';
import { haptics } from '@/services/HapticsService';
import { storage } from '@/services/StorageService';
import type { ControlLayout } from '@/services/StorageService';

const BTN_FILL = 0x222222;
const BTN_STROKE = 0x555555;
const BTN_FILL_HOVER = 0x333333;

export default class SettingsScene extends Phaser.Scene {
  private hapticsValue!: Phaser.GameObjects.Text;
  private layoutValue!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(theme.background);

    const cx = CANVAS_WIDTH / 2;

    this.add
      .text(cx, 72, 'SETTINGS', {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '26px',
      })
      .setOrigin(0.5);

    this.createRow(
      cx,
      180,
      'HAPTICS',
      this.hapticsLabel(),
      haptics.isSupported(),
      () => this.toggleHaptics(),
      (el) => {
        this.hapticsValue = el;
      },
    );

    this.createRow(
      cx,
      260,
      'CONTROLS',
      this.layoutLabel(),
      true,
      () => this.toggleLayout(),
      (el) => {
        this.layoutValue = el;
      },
    );

    this.makeButton(cx, 500, 160, 40, 'BACK', () => this.goBack());

    const kb = this.input.keyboard;
    if (kb) {
      const onBack = (): void => this.goBack();
      kb.on('keydown-ESC', onBack);
      kb.on('keydown-BACKSPACE', onBack);
      this.events.once('shutdown', () => {
        kb.off('keydown-ESC', onBack);
        kb.off('keydown-BACKSPACE', onBack);
      });
    }
  }

  private createRow(
    cx: number,
    cy: number,
    label: string,
    value: string,
    enabled: boolean,
    onTap: () => void,
    capture: (text: Phaser.GameObjects.Text) => void,
  ): void {
    const color = enabled ? theme.textMuted : '#4a4a4a';
    this.add
      .text(cx, cy - 16, label, {
        color,
        fontFamily: 'monospace',
        fontSize: '12px',
      })
      .setOrigin(0.5);

    const bg = this.add
      .rectangle(cx, cy + 14, 220, 36, BTN_FILL)
      .setStrokeStyle(1, BTN_STROKE);
    const valueText = this.add
      .text(cx, cy + 14, value, {
        color: enabled ? theme.text : '#6a6a6a',
        fontFamily: 'monospace',
        fontSize: '14px',
      })
      .setOrigin(0.5);
    capture(valueText);

    if (!enabled) return;

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => {
      bg.setFillStyle(BTN_FILL_HOVER);
      onTap();
    });
    bg.on('pointerup', () => bg.setFillStyle(BTN_FILL));
    bg.on('pointerupoutside', () => bg.setFillStyle(BTN_FILL));
    bg.on('pointerout', () => bg.setFillStyle(BTN_FILL));
    bg.on('pointerover', () => bg.setFillStyle(BTN_FILL_HOVER));
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

  private hapticsLabel(): string {
    if (!haptics.isSupported()) return 'UNSUPPORTED';
    return haptics.isEnabled() ? 'ON' : 'OFF';
  }

  private layoutLabel(): string {
    const layout = storage.getSettings().controlLayout;
    return layout === 'left-handed' ? 'LEFT-HANDED' : 'RIGHT-HANDED';
  }

  private toggleHaptics(): void {
    const enabled = haptics.toggle();
    storage.updateSettings({ haptics: enabled });
    this.hapticsValue.setText(this.hapticsLabel());
  }

  private toggleLayout(): void {
    const current = storage.getSettings().controlLayout;
    const next: ControlLayout = current === 'right-handed' ? 'left-handed' : 'right-handed';
    storage.updateSettings({ controlLayout: next });
    this.layoutValue.setText(this.layoutLabel());
  }

  private goBack(): void {
    this.scene.start('MenuScene');
  }
}
