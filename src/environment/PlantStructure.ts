import Phaser from 'phaser';

import type { PlantStructureData } from '../levels/LevelSchema';

export class PlantStructure {
  public readonly physicsObject: Phaser.GameObjects.Rectangle;

  private readonly body: Phaser.Physics.Arcade.StaticBody;
  private readonly statusText: Phaser.GameObjects.Text;
  private grown = false;

  public constructor(
    scene: Phaser.Scene,
    public readonly data: PlantStructureData,
  ) {
    this.physicsObject = scene.add
      .rectangle(
        data.x + data.width / 2,
        data.y + data.height / 2,
        data.width,
        data.height,
        0x166534,
      )
      .setStrokeStyle(4, 0x86efac)
      .setDepth(3);
    scene.physics.add.existing(this.physicsObject, true);

    if (
      !(this.physicsObject.body instanceof Phaser.Physics.Arcade.StaticBody)
    ) {
      throw new TypeError('PlantStructure requires a static Arcade body');
    }
    this.body = this.physicsObject.body;
    this.statusText = scene.add
      .text(data.x + data.width / 2, data.y + data.height / 2, '', {
        color: '#f0fdf4',
        fontFamily: 'ui-monospace, monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: data.width - 12 },
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.setGrown(false);
  }

  public setGrown(grown: boolean): void {
    if (this.grown === grown && this.body.enable === grown) {
      return;
    }

    this.grown = grown;
    this.body.enable = grown;
    this.physicsObject.setAlpha(grown ? 1 : 0.16);
    this.physicsObject.setFillStyle(grown ? 0x16a34a : 0x365314);
    this.statusText.setText(grown ? 'LIVING\nPLATFORM' : 'DORMANT');
    this.statusText.setAlpha(grown ? 1 : 0.55);
  }

  public reset(): void {
    this.setGrown(false);
  }
}
