import Phaser from 'phaser';

import type { PlayerCharacter } from '../entities/PlayerCharacter';
import type { StaticGeometryData } from '../levels/LevelSchema';

export const DEFAULT_BREAK_REACH_PX = 34;

export class BreakableBarrier {
  public breakReach = DEFAULT_BREAK_REACH_PX;
  public readonly physicsObject: Phaser.GameObjects.Rectangle;
  private readonly body: Phaser.Physics.Arcade.StaticBody;
  private readonly markings: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;

  public constructor(
    scene: Phaser.Scene,
    rect: Pick<StaticGeometryData, 'x' | 'y' | 'width' | 'height'>,
  ) {
    const { x, y, width, height } = rect;
    this.physicsObject = scene.add
      .rectangle(x + width / 2, y + height / 2, width, height, 0xb45309)
      .setStrokeStyle(2, 0xfde68a)
      .setDepth(3);
    scene.physics.add.existing(this.physicsObject, true);
    if (
      !(this.physicsObject.body instanceof Phaser.Physics.Arcade.StaticBody)
    ) {
      throw new TypeError('Breakable barrier requires a static Arcade body');
    }
    this.body = this.physicsObject.body;
    this.markings = scene.add.graphics().setDepth(4);
    this.markings.lineStyle(3, 0x451a03);
    this.markings.strokePoints([
      { x: x + width * 0.34, y },
      { x: x + width * 0.53, y: y + height * 0.38 },
      { x: x + width * 0.39, y: y + height * 0.68 },
      { x: x + width * 0.57, y: y + height },
    ]);
    this.label = scene.add
      .text(x + width / 2, y + height + 6, 'CRACKED FLOOR · BRUTE F', {
        color: '#fde68a',
        backgroundColor: '#080b16dd',
        fontSize: '13px',
        padding: { x: 4, y: 3 },
      })
      .setOrigin(0.5, 0)
      .setDepth(6);
  }

  public tryBreak(character: PlayerCharacter): boolean {
    if (
      this.isBroken() ||
      !character.hasAbility('break-barrier') ||
      !character.getContacts().grounded
    ) {
      return false;
    }

    const actor = character.physicsObject.getBounds();
    const barrier = this.physicsObject.getBounds();
    const gapX = Math.max(
      0,
      barrier.left - actor.right,
      actor.left - barrier.right,
    );
    const gapY = Math.max(
      0,
      barrier.top - actor.bottom,
      actor.top - barrier.bottom,
    );
    if (gapX > this.breakReach || gapY > this.breakReach) {
      return false;
    }

    this.setBroken(true);
    return true;
  }

  public isBroken(): boolean {
    return !this.body.enable;
  }

  public reset(): void {
    this.setBroken(false);
  }

  private setBroken(broken: boolean): void {
    this.body.enable = !broken;
    this.physicsObject.setVisible(!broken);
    this.markings.setVisible(!broken);
    this.label.setVisible(!broken);
  }
}
