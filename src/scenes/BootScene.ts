import * as Phaser from 'phaser';
import { theme } from '@/config/theme';
import { ensureBlockTextures } from '@/renderers/BlockTextures';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(theme.background);
    ensureBlockTextures(this);
    this.scene.start('PreloadScene');
  }
}
