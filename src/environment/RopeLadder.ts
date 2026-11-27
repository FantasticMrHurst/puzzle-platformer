import Phaser from 'phaser';

import type {
  PlayerCharacter,
  LadderMotion,
} from '../entities/PlayerCharacter';

interface RopeLayout {
  readonly x: number;
  readonly top: number;
  readonly bottom: number;
  readonly landingX: number;
}

const REACH_PX = 34;
export const DEFAULT_CLIMB_SPEED = 205;
const END_TOLERANCE_PX = 3;

export class RopeLadder {
  public climbSpeed = DEFAULT_CLIMB_SPEED;
  private readonly rope: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private readonly climbers = new Set<string>();

  public constructor(
    scene: Phaser.Scene,
    private readonly layout: RopeLayout,
  ) {
    const { x, top, bottom, landingX } = layout;
    this.rope = scene.add.graphics().setDepth(3);
    this.rope.lineStyle(3, 0xffce7c);
    this.rope.lineBetween(x - 12, top, x - 12, bottom);
    this.rope.lineBetween(x + 12, top, x + 12, bottom);
    for (let y = top + 12; y < bottom; y += 20) {
      this.rope.lineBetween(x - 12, y, x + 12, y);
    }
    this.rope.lineBetween(x, top, landingX, top);
    scene.add.circle(landingX, top - 7, 7, 0xffce7c).setDepth(4);
    this.label = scene.add
      .text(landingX + 8, top + 12, '', {
        color: '#fde68a',
        backgroundColor: '#080b16dd',
        fontSize: '13px',
        padding: { x: 4, y: 3 },
      })
      .setDepth(6);
    this.reset();
  }

  public tryDeploy(character: PlayerCharacter): boolean {
    if (
      this.rope.visible ||
      !character.hasAbility('deploy-rope') ||
      !character.getContacts().grounded
    ) {
      return false;
    }
    const actor = character.physicsObject.getBounds();
    if (
      Math.abs(actor.centerX - this.layout.landingX) > 64 ||
      Math.abs(actor.bottom - this.layout.top) > END_TOLERANCE_PX
    ) {
      return false;
    }
    this.rope.setVisible(true);
    this.label.setText('ROPE DEPLOYED · ↑ / ↓');
    return true;
  }

  public prepare(
    character: PlayerCharacter,
    axis: -1 | 0 | 1,
    moveX: number,
    deltaSeconds: number,
  ): LadderMotion | undefined {
    if (!this.rope.visible) {
      return undefined;
    }
    const { x, top, bottom, landingX } = this.layout;
    const actor = character.physicsObject.getBounds();
    if (!this.climbers.has(character.id)) {
      if (
        axis === 1 &&
        Math.abs(actor.bottom - top) <= END_TOLERANCE_PX &&
        Math.abs(actor.centerX - landingX) <= REACH_PX
      ) {
        this.climbers.add(character.id);
      } else if (
        axis === -1 &&
        Math.abs(actor.centerX - x) <= REACH_PX &&
        actor.bottom > top + END_TOLERANCE_PX &&
        actor.bottom <= bottom + END_TOLERANCE_PX
      ) {
        this.climbers.add(character.id);
      } else {
        return undefined;
      }
    }

    if (actor.bottom <= top + END_TOLERANCE_PX && axis === -1) {
      this.climbers.delete(character.id);
      character.placeFeetAt(landingX, top);
      return { x: landingX, velocityY: 0 };
    }
    if (
      (actor.bottom >= bottom - END_TOLERANCE_PX && axis === 1) ||
      (axis === 0 && moveX !== 0)
    ) {
      this.climbers.delete(character.id);
      return undefined;
    }

    return {
      x,
      velocityY: Phaser.Math.Clamp(
        axis * this.climbSpeed,
        (top - actor.bottom) / deltaSeconds,
        (bottom - actor.bottom) / deltaSeconds,
      ),
    };
  }

  public reset(): void {
    this.climbers.clear();
    this.rope.setVisible(false);
    this.label.setText('ROPE ANCHOR · PILOT F');
  }
}
