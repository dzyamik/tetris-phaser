import * as Phaser from 'phaser';
import BootScene from '@/scenes/BootScene';
import PreloadScene from '@/scenes/PreloadScene';
import MenuScene from '@/scenes/MenuScene';
import GameScene from '@/scenes/GameScene';
import GameOverScene from '@/scenes/GameOverScene';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/config/layout';
import { theme } from '@/config/theme';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: theme.background,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.NO_CENTER,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  },
  scene: [BootScene, PreloadScene, MenuScene, GameScene, GameOverScene],
};

new Phaser.Game(config);
