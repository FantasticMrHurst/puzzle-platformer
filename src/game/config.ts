import Phaser from 'phaser';

import { BootScene } from './scenes/BootScene';
import { TestRoomScene } from './scenes/TestRoomScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#080b16',
  width: 1280,
  height: 720,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 1_400 },
      customUpdate: true,
      fixedStep: false,
      debug: false,
    },
  },
  scene: [BootScene, TestRoomScene],
};
