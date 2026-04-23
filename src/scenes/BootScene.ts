import * as Phaser from 'phaser';
import { theme } from '@/config/theme';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(theme.background);
    this.scene.start('PreloadScene');
  }
}
