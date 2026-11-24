import type Phaser from 'phaser';

import type { RangedTarget } from '../environment/RangedTarget';
import type { AimIntent } from '../input/AimIntent';

const SHOT_SPEED = 900;
const SHOT_LIFETIME_SECONDS = 2.5;

export class RangerShot {
  private readonly visual: Phaser.GameObjects.Rectangle;
  private remainingSeconds = SHOT_LIFETIME_SECONDS;

  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly aim: AimIntent,
  ) {
    this.visual = scene.add
      .rectangle(x, y, 24, 6, 0xfde047)
      .setRotation(Math.atan2(aim.y, aim.x))
      .setDepth(9);
  }

  public advance(
    deltaSeconds: number,
    targets: readonly RangedTarget[],
  ): boolean {
    this.visual.x += this.aim.x * SHOT_SPEED * deltaSeconds;
    this.visual.y += this.aim.y * SHOT_SPEED * deltaSeconds;
    this.remainingSeconds -= deltaSeconds;

    const hit = targets.some((target) =>
      target.tryHit(this.visual.x, this.visual.y),
    );
    if (hit || this.remainingSeconds <= 0) {
      this.visual.destroy();
      return false;
    }

    return true;
  }

  public destroy(): void {
    this.visual.destroy();
  }
}
