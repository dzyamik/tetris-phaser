import * as Phaser from 'phaser';
import BootScene from '@/scenes/BootScene';
import { theme } from '@/config/theme';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: theme.background,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 360,
    height: 640,
  },
  scene: [BootScene],
};

new Phaser.Game(config);
