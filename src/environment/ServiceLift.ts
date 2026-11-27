import Phaser from 'phaser';

import type { PlayerCharacter } from '../entities/PlayerCharacter';

interface LiftLayout {
  readonly x: number;
  readonly width: number;
  readonly stops: readonly [base: number, service: number, exit: number];
  readonly callX: number;
}

const PLATFORM_DEPTH = 20;
export const DEFAULT_LIFT_SPEED = 115;
const STOP_NAMES = ['GROUND', 'SERVICE', 'EXIT'] as const;

export class ServiceLift {
  public travelSpeed = DEFAULT_LIFT_SPEED;
  public readonly physicsObject: Phaser.GameObjects.Rectangle;
  private readonly body: Phaser.Physics.Arcade.Body;
  private readonly status: Phaser.GameObjects.Text;
  private powered = false;
  private selection: 0 | 1 | 2 = 0;

  public constructor(
    scene: Phaser.Scene,
    private readonly layout: LiftLayout,
  ) {
    const { x, width, stops, callX } = layout;
    this.physicsObject = scene.add
      .rectangle(
        x + width / 2,
        stops[0] + PLATFORM_DEPTH / 2,
        width,
        PLATFORM_DEPTH,
        0x155e75,
      )
      .setStrokeStyle(2, 0x67e8f9)
      .setDepth(4);
    scene.physics.add.existing(this.physicsObject);
    if (!(this.physicsObject.body instanceof Phaser.Physics.Arcade.Body)) {
      throw new TypeError('Service lift requires a dynamic Arcade body');
    }
    this.body = this.physicsObject.body;
    this.body.setAllowGravity(false).setImmovable(true);
    this.body.pushable = false;
    this.body.checkCollision.down = false;
    this.body.checkCollision.left = false;
    this.body.checkCollision.right = false;
    const rail = scene.add.graphics().setDepth(1);
    rail.lineStyle(2, 0x155e75);
    rail.lineBetween(x + width / 2, stops[2], x + width / 2, stops[0]);
    for (const [i, stop] of stops.entries()) {
      scene.add.text(x + 14, stop + 6, STOP_NAMES[i]!, {
        color: '#a5f3fc',
        fontSize: '12px',
      });
    }
    scene.add
      .text(callX, stops[0] - 90, 'F · CALL LIFT', {
        color: '#a5f3fc',
        fontSize: '13px',
        backgroundColor: '#080b16dd',
        padding: { x: 4, y: 3 },
      })
      .setOrigin(0.5, 0.5)
      .setDepth(6);
    this.status = scene.add
      .text(this.physicsObject.x, stops[0] - 94, '', {
        color: '#cffafe',
        backgroundColor: '#080b16dd',
        fontSize: '13px',
        padding: { x: 4, y: 3 },
      })
      .setOrigin(0.5, 0.5)
      .setDepth(6);
    this.updateStatus();
  }

  public tryOperate(character: PlayerCharacter): boolean {
    if (!this.powered) {
      return false;
    }
    const feet = character.physicsObject.getBounds();
    const boarded =
      feet.centerX >= this.body.left &&
      feet.centerX <= this.body.right &&
      Math.abs(feet.bottom - this.body.top) <= 9;
    if (boarded && character.hasAbility('reconfigure-machine')) {
      this.selection = this.selection === 0 ? 1 : this.selection === 1 ? 2 : 0;
      return true;
    }
    if (
      feet.centerX < this.layout.x &&
      Math.abs(feet.centerX - this.layout.callX) <= 38 &&
      Math.abs(feet.bottom - this.layout.stops[0]) <= 5
    ) {
      this.selection = 0;
      return true;
    }
    return false;
  }

  public prepare(powered: boolean, deltaSeconds: number): void {
    this.powered = powered;
    const distance = this.layout.stops[this.selection] - this.body.top;
    this.body.setVelocityY(
      powered
        ? Phaser.Math.Clamp(
            distance / deltaSeconds,
            -this.travelSpeed,
            this.travelSpeed,
          )
        : 0,
    );
  }

  public complete(): void {
    this.updateStatus();
  }

  public reset(): void {
    this.powered = false;
    this.selection = 0;
    this.body.reset(
      this.layout.x + this.layout.width / 2,
      this.layout.stops[0] + PLATFORM_DEPTH / 2,
    );
    this.updateStatus();
  }

  private updateStatus(): void {
    const moving =
      Math.abs(this.layout.stops[this.selection] - this.body.top) > 1;
    this.status
      .setY(this.body.top - 94)
      .setText(
        this.powered
          ? `TINKERER F · ${moving ? 'TO' : 'AT'} ${STOP_NAMES[this.selection]}`
          : 'LIFT · NO POWER',
      );
  }
}
