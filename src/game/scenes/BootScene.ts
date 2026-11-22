import Phaser from 'phaser';

import { GAME_TITLE, PROTOTYPE_PHASE } from '../appMetadata';

export class BootScene extends Phaser.Scene {
  public constructor() {
    super('boot');
  }

  public create(): void {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    this.add.grid(
      centerX,
      centerY,
      width,
      height,
      64,
      64,
      0x080b16,
      1,
      0x18213b,
      0.45,
    );

    this.add
      .text(centerX, centerY - 36, GAME_TITLE, {
        color: '#eef4ff',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        fontSize: '48px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY + 34, 'Phaser is running', {
        color: '#6ee7b7',
        fontFamily: 'ui-monospace, monospace',
        fontSize: '22px',
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY + 78, PROTOTYPE_PHASE, {
        color: '#9caad0',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        fontSize: '18px',
      })
      .setOrigin(0.5);
  }
}
