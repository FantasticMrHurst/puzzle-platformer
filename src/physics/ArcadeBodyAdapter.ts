import Phaser from 'phaser';

import type { DebugPosition } from '../debug/MovementDebugSnapshot';
import type {
  MovementContacts,
  MovementVelocity,
} from '../movement/MovementController';
import { mapArcadeContacts } from './ArcadeContactMapper';

export class ArcadeBodyAdapter {
  private readonly body: Phaser.Physics.Arcade.Body;

  public constructor(gameObject: Phaser.GameObjects.Rectangle) {
    if (!(gameObject.body instanceof Phaser.Physics.Arcade.Body)) {
      throw new TypeError('ArcadeBodyAdapter requires a dynamic Arcade body');
    }

    this.body = gameObject.body;
  }

  public readVelocity(): MovementVelocity {
    return { x: this.body.velocity.x, y: this.body.velocity.y };
  }

  public readPosition(): DebugPosition {
    return { x: this.body.center.x, y: this.body.center.y };
  }

  public readContacts(): MovementContacts {
    return mapArcadeContacts(this.body.blocked, this.body.touching);
  }

  public applyVelocity(velocity: MovementVelocity): void {
    this.body.setVelocity(velocity.x, velocity.y);
  }

  public setMaximumVelocity(horizontal: number, vertical: number): void {
    this.body.setMaxVelocity(horizontal, vertical);
  }

  public reset(x: number, y: number): void {
    this.body.reset(x, y);
    this.body.setAcceleration(0, 0);
  }

  public isBelow(y: number): boolean {
    return this.body.center.y > y;
  }
}
