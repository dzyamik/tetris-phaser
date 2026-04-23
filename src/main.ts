import * as Phaser from 'phaser';
import BootScene from '@/scenes/BootScene';
import PreloadScene from '@/scenes/PreloadScene';
import MenuScene from '@/scenes/MenuScene';
import GameScene from '@/scenes/GameScene';
import GameOverScene from '@/scenes/GameOverScene';
import PauseScene from '@/scenes/PauseScene';
import SettingsScene from '@/scenes/SettingsScene';
import HighScoresScene from '@/scenes/HighScoresScene';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@/config/layout';
import { theme } from '@/config/theme';
import { pwa } from '@/services/PWAService';
import { storage } from '@/services/StorageService';
import { haptics } from '@/services/HapticsService';

pwa.init();
haptics.setEnabled(storage.getSettings().haptics);

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
  input: {
    activePointers: 3,
  },
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    GameScene,
    PauseScene,
    GameOverScene,
    SettingsScene,
    HighScoresScene,
  ],
};

new Phaser.Game(config);
