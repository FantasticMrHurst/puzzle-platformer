import Phaser from 'phaser';

import type { PoweredBridgeData } from '../levels/LevelSchema';

export class PoweredBridge {
  public readonly physicsObject: Phaser.GameObjects.Rectangle;

  private readonly body: Phaser.Physics.Arcade.StaticBody;
  private readonly statusText: Phaser.GameObjects.Text;
  private extended = false;

  public constructor(
    scene: Phaser.Scene,
    public readonly data: PoweredBridgeData,
  ) {
    this.physicsObject = scene.add
      .rectangle(
        data.x + data.width / 2,
        data.y + data.height / 2,
        data.width,
        data.height,
        0x22c55e,
      )
      .setStrokeStyle(3, 0xbbf7d0)
      .setDepth(3);
    scene.physics.add.existing(this.physicsObject, true);

    if (
      !(this.physicsObject.body instanceof Phaser.Physics.Arcade.StaticBody)
    ) {
      throw new TypeError('PoweredBridge requires a static Arcade body');
    }
    this.body = this.physicsObject.body;
    this.statusText = scene.add
      .text(data.x + data.width / 2, data.y + data.height / 2, '', {
        color: '#f0fdf4',
        fontFamily: 'ui-monospace, monospace',
        fontSize: '12px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.setExtended(false);
  }

  public setExtended(extended: boolean): void {
    if (this.extended === extended && this.body.enable === extended) {
      return;
    }

    this.extended = extended;
    this.body.enable = extended;
    this.physicsObject.setAlpha(extended ? 1 : 0.18);
    this.physicsObject.setFillStyle(extended ? 0x22c55e : 0x334155);
    this.statusText.setText(extended ? 'BRIDGE ONLINE' : 'BRIDGE OFFLINE');
    this.statusText.setAlpha(extended ? 1 : 0.65);
  }

  public reset(): void {
    this.setExtended(false);
  }
}
