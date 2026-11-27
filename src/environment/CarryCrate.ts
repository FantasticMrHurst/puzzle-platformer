import Phaser from 'phaser';

import type { RedExplorer } from '../entities/RedExplorer';

export class CarryCrate {
  public readonly physicsObject: Phaser.GameObjects.Rectangle;
  public readonly body: Phaser.Physics.Arcade.Body;
  public held = false;
  private readonly sprite: Phaser.GameObjects.Image;

  public constructor(
    scene: Phaser.Scene,
    texture: string,
    private readonly start: { x: number; feetY: number },
    private readonly size: number,
  ) {
    const y = start.feetY - size / 2;
    this.physicsObject = scene.add
      .rectangle(start.x, y, size, size)
      .setVisible(false);
    scene.physics.add.existing(this.physicsObject);
    if (!(this.physicsObject.body instanceof Phaser.Physics.Arcade.Body)) {
      throw new TypeError('A carry crate needs a dynamic Arcade body');
    }
    this.body = this.physicsObject.body;
    this.body.pushable = false;
    this.sprite = scene.add.image(start.x, y, texture).setDepth(6);
  }

  public interact(
    explorer: RedExplorer,
    canPlace: (bounds: Phaser.Geom.Rectangle) => boolean,
  ): void {
    if (!explorer.isGrounded() || explorer.climbing) return;
    if (!this.held) {
      if (
        Math.abs(this.body.center.x - explorer.body.center.x) > 46 ||
        Math.abs(this.body.bottom - explorer.body.bottom) > 10
      ) {
        return;
      }
      this.held = true;
      this.body.setVelocity(0, 0);
      this.body.enable = false;
      return;
    }
    const x =
      explorer.body.center.x +
      explorer.facing * (explorer.body.halfWidth + this.size / 2 + 4);
    const y = explorer.body.bottom - this.size / 2 - 1;
    const bounds = new Phaser.Geom.Rectangle(
      x - this.size / 2,
      y - this.size / 2,
      this.size,
      this.size,
    );
    if (!canPlace(bounds)) return;
    this.held = false;
    this.body.enable = true;
    this.body.reset(x, y);
  }

  public render(explorer: RedExplorer): void {
    const x = this.held ? explorer.sprite.x : this.body.center.x;
    const y = this.held ? explorer.sprite.y - 46 : this.body.center.y;
    this.sprite.setPosition(Math.round(x), Math.round(y));
  }

  public reset(): void {
    this.held = false;
    this.body.enable = true;
    this.body.reset(this.start.x, this.start.feetY - this.size / 2);
  }
}
