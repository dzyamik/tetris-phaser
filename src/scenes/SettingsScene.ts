import * as Phaser from 'phaser';
import { CANVAS_WIDTH } from '@/config/layout';
import { theme } from '@/config/theme';
import { haptics } from '@/services/HapticsService';
import { storage } from '@/services/StorageService';
import type { ControlLayout } from '@/services/StorageService';
import { audio } from '@/services/AudioService';

const BTN_FILL = 0x222222;
const BTN_STROKE = 0x555555;
const BTN_FILL_HOVER = 0x333333;
const BTN_DISABLED_STROKE = 0x333333;

const VOLUME_STEP = 0.1;

export default class SettingsScene extends Phaser.Scene {
  private soundValue!: Phaser.GameObjects.Text;
  private volumeValue!: Phaser.GameObjects.Text;
  private hapticsValue!: Phaser.GameObjects.Text;
  private layoutValue!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(theme.background);

    const cx = CANVAS_WIDTH / 2;

    this.add
      .text(cx, 48, 'SETTINGS', {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '24px',
      })
      .setOrigin(0.5);

    this.createToggleRow(
      cx,
      110,
      'SOUND',
      this.soundLabel(),
      true,
      () => this.toggleSound(),
      (t) => {
        this.soundValue = t;
      },
    );

    this.createVolumeRow(cx, 184);

    this.createToggleRow(
      cx,
      260,
      'HAPTICS',
      this.hapticsLabel(),
      haptics.isSupported(),
      () => this.toggleHaptics(),
      (t) => {
        this.hapticsValue = t;
      },
    );

    this.createToggleRow(
      cx,
      336,
      'CONTROLS',
      this.layoutLabel(),
      true,
      () => this.toggleLayout(),
      (t) => {
        this.layoutValue = t;
      },
    );

    this.makeSecondaryButton(cx, 520, 160, 40, 'BACK', () => this.goBack());

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

  private createToggleRow(
    cx: number,
    cy: number,
    label: string,
    value: string,
    enabled: boolean,
    onTap: () => void,
    capture: (text: Phaser.GameObjects.Text) => void,
  ): void {
    const labelColor = enabled ? theme.textMuted : '#4a4a4a';
    this.add
      .text(cx, cy - 16, label, {
        color: labelColor,
        fontFamily: 'monospace',
        fontSize: '12px',
      })
      .setOrigin(0.5);

    const bg = this.add
      .rectangle(cx, cy + 14, 220, 36, BTN_FILL)
      .setStrokeStyle(1, enabled ? BTN_STROKE : BTN_DISABLED_STROKE);
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

  private createVolumeRow(cx: number, cy: number): void {
    const enabled = audio.isSupported();
    const labelColor = enabled ? theme.textMuted : '#4a4a4a';
    this.add
      .text(cx, cy - 16, 'VOLUME', {
        color: labelColor,
        fontFamily: 'monospace',
        fontSize: '12px',
      })
      .setOrigin(0.5);

    this.add
      .rectangle(cx, cy + 14, 220, 36, BTN_FILL)
      .setStrokeStyle(1, enabled ? BTN_STROKE : BTN_DISABLED_STROKE);

    this.volumeValue = this.add
      .text(cx, cy + 14, this.volumeLabel(), {
        color: enabled ? theme.text : '#6a6a6a',
        fontFamily: 'monospace',
        fontSize: '14px',
      })
      .setOrigin(0.5);

    if (!enabled) return;

    this.makeStepButton(cx - 86, cy + 14, '−', () => this.changeVolume(-VOLUME_STEP));
    this.makeStepButton(cx + 86, cy + 14, '+', () => this.changeVolume(VOLUME_STEP));
  }

  private makeStepButton(cx: number, cy: number, label: string, onTap: () => void): void {
    const bg = this.add
      .rectangle(cx, cy, 32, 32, BTN_FILL)
      .setStrokeStyle(1, BTN_STROKE)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(cx, cy, label, {
        color: theme.text,
        fontFamily: 'monospace',
        fontSize: '20px',
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

  private soundLabel(): string {
    if (!audio.isSupported()) return 'UNSUPPORTED';
    return audio.isEnabled() ? 'ON' : 'OFF';
  }

  private volumeLabel(): string {
    if (!audio.isSupported()) return '—';
    return `${Math.round(audio.getVolume() * 100)}%`;
  }

  private hapticsLabel(): string {
    if (!haptics.isSupported()) return 'UNSUPPORTED';
    return haptics.isEnabled() ? 'ON' : 'OFF';
  }

  private layoutLabel(): string {
    const layout = storage.getSettings().controlLayout;
    return layout === 'left-handed' ? 'LEFT-HANDED' : 'RIGHT-HANDED';
  }

  private toggleSound(): void {
    const enabled = audio.toggle();
    storage.updateSettings({ sound: enabled });
    this.soundValue.setText(this.soundLabel());
  }

  private changeVolume(delta: number): void {
    const next = Math.max(0, Math.min(1, audio.getVolume() + delta));
    audio.setVolume(next);
    storage.updateSettings({ volume: next });
    this.volumeValue.setText(this.volumeLabel());
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
