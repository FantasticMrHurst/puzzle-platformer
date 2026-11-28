import Phaser from 'phaser';

import type { PlayerCharacter } from '../entities/PlayerCharacter';
import type { StaticGeometryData } from '../levels/LevelSchema';

export const DEFAULT_BREAK_REACH_PX = 34;
type BarrierBounds = Pick<StaticGeometryData, 'x' | 'y' | 'width' | 'height'>;

interface ConcealedWall {
  readonly cover: BarrierBounds;
  readonly color: number;
}

export class BreakableBarrier {
  public breakReach = DEFAULT_BREAK_REACH_PX;
  public readonly physicsObject: Phaser.GameObjects.Rectangle;
  private readonly body: Phaser.Physics.Arcade.StaticBody;
  private readonly markings: Phaser.GameObjects.Graphics;
  private readonly label?: Phaser.GameObjects.Text;
  private readonly cover?: Phaser.GameObjects.Rectangle;

  public constructor(
    scene: Phaser.Scene,
    rect: BarrierBounds,
    concealed?: ConcealedWall,
  ) {
    const { x, y, width, height } = rect;
    this.physicsObject = scene.add
      .rectangle(
        x + width / 2,
        y + height / 2,
        width,
        height,
        concealed?.color ?? 0xb45309,
      )
      .setDepth(3);
    scene.physics.add.existing(this.physicsObject, true);
    if (
      !(this.physicsObject.body instanceof Phaser.Physics.Arcade.StaticBody)
    ) {
      throw new TypeError('Breakable barrier requires a static Arcade body');
    }
    this.body = this.physicsObject.body;
    this.markings = scene.add
      .graphics()
      .setDepth(concealed === undefined ? 4 : 9.1);
    if (concealed !== undefined) {
      const { cover, color } = concealed;
      this.cover = scene.add
        .rectangle(
          cover.x + cover.width / 2,
          cover.y + cover.height / 2,
          cover.width,
          cover.height,
          color,
        )
        .setDepth(9);
      this.drawConcealedCrack(rect);
      return;
    }
    this.physicsObject.setStrokeStyle(2, 0xfde68a);
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

  private drawConcealedCrack({ x, y, width, height }: BarrierBounds): void {
    const edge = x + width;
    const middle = y + height * 0.59;
    this.markings.lineStyle(2, 0xcbd5e1, 0.7);
    this.markings.lineBetween(edge, y, edge, y + height);
    const crack = (points: readonly (readonly [number, number])[]) =>
      this.markings.strokePoints(
        points.map(([dx, dy]) => ({ x: edge + dx, y: middle + dy })),
      );
    this.markings.lineStyle(2, 0x172334, 0.95);
    crack([
      [-10, -34],
      [-13, -22],
      [-8, -12],
      [-16, -2],
      [-11, 11],
      [-18, 25],
      [-14, 37],
    ]);
    this.markings.lineStyle(1.5, 0x1b2839, 0.9);
    crack([
      [-13, -22],
      [-23, -26],
      [-30, -37],
    ]);
    crack([
      [-16, -2],
      [-27, 2],
      [-37, -4],
      [-42, -12],
    ]);
    crack([
      [-27, 2],
      [-30, 12],
      [-39, 18],
    ]);
    crack([
      [-11, 11],
      [-4, 16],
      [-1, 23],
    ]);
    crack([
      [-18, 25],
      [-28, 30],
      [-31, 40],
    ]);
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
    this.label?.setVisible(!broken);
    this.cover?.setVisible(!broken);
  }
}
