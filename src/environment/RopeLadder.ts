import Phaser from 'phaser';

import type {
  PlayerCharacter,
  LadderMotion,
} from '../entities/PlayerCharacter';
import type { LevelData } from '../levels/LevelSchema';
import type { Position } from '../rendering/interpolatePosition';
import {
  ROPE_DEPLOY_SECONDS,
  RopeLadderArt,
  type RopeEnd,
} from '../rendering/RopeLadderArt';
import { findRopeLedge, type RopeBounds, type RopeLedge } from './RopeLedge';

const REACH_PX = 34;
export const DEFAULT_CLIMB_SPEED = 205;
const END_TOLERANCE_PX = 3;
const SWAY_SPRING = 34;
const SWAY_DAMPING = 7;
const MAX_SWAY_PX = 6;
const LIFT_SECONDS = 0.11;
const RELEASE_SECONDS = 0.23;
const FOLLOW_THROUGH_SECONDS = 0.34;
const READY_SECONDS = RELEASE_SECONDS + ROPE_DEPLOY_SECONDS;
const REEL_SECONDS = 0.55;
const PACK_SECONDS = 0.2;

interface Retraction {
  readonly from: RopeEnd;
  readonly direction: -1 | 1;
  readonly satchel: Position;
  age: number;
}

interface Deployment {
  readonly ledge: RopeLedge;
  readonly pilot: PlayerCharacter;
  readonly origin: Position;
  age: number;
  retraction?: Retraction;
}

export class RopeLadder {
  public climbSpeed = DEFAULT_CLIMB_SPEED;
  private readonly art: RopeLadderArt;
  private readonly label: Phaser.GameObjects.Text;
  private readonly climbers = new Set<string>();
  private readonly terrainBounds: readonly RopeBounds[];
  private deployment: Deployment | null = null;
  private sway = 0;
  private swaySpeed = 0;

  public constructor(
    scene: Phaser.Scene,
    private readonly level: Pick<LevelData, 'staticGeometry' | 'world'>,
    private readonly crewSize: {
      readonly width: number;
      readonly height: number;
    },
    private readonly getObstacles: () => readonly RopeBounds[],
  ) {
    this.terrainBounds = level.staticGeometry.map(
      ({ x, y, width, height }) => ({
        left: x,
        right: x + width,
        top: y,
        bottom: y + height,
      }),
    );
    this.art = new RopeLadderArt(scene);
    this.label = scene.add
      .text(0, 0, '', {
        color: '#fde68a',
        backgroundColor: '#080b16dd',
        fontSize: '13px',
        padding: { x: 4, y: 3 },
      })
      .setOrigin(0.5, 1)
      .setDepth(6);
    this.reset();
  }

  public tryUse(character: PlayerCharacter): boolean {
    if (
      !character.hasAbility('deploy-rope') ||
      !character.getContacts().grounded
    ) {
      return false;
    }
    const actor = character.physicsObject.getBounds();
    if (this.deployment !== null) {
      const { ledge, pilot, age, retraction } = this.deployment;
      const from = this.endInReach(actor, ledge);
      if (
        character !== pilot ||
        age < READY_SECONDS ||
        retraction !== undefined ||
        this.climbers.size !== 0 ||
        from === undefined
      )
        return false;
      const direction =
        ledge.x === actor.centerX
          ? character.getFacingDirection()
          : ledge.x < actor.centerX
            ? -1
            : 1;
      this.deployment.retraction = {
        from,
        direction,
        age: 0,
        satchel: { x: actor.centerX - direction * 10, y: actor.bottom - 32 },
      };
      pilot.setRopeEquipment(false, 'throw', direction);
    } else {
      const ledge = this.findLedge(character);
      if (ledge === undefined) return false;
      this.deployment = {
        ledge,
        pilot: character,
        origin: { x: actor.centerX + ledge.direction * 28, y: ledge.top - 42 },
        age: 0,
      };
      character.setRopeEquipment(true, 'reach', ledge.direction);
    }
    return true;
  }

  public isCasting(character: PlayerCharacter): boolean {
    return (
      this.deployment?.pilot === character &&
      (this.deployment.age < FOLLOW_THROUGH_SECONDS ||
        this.deployment.retraction !== undefined)
    );
  }

  public prepare(
    character: PlayerCharacter,
    axis: -1 | 0 | 1,
    moveX: number,
    deltaSeconds: number,
  ): LadderMotion | undefined {
    if (
      this.deployment === null ||
      this.deployment.age < READY_SECONDS ||
      this.deployment.retraction !== undefined
    ) {
      return undefined;
    }
    const { x, top, bottom, landingX, hasLanding } = this.deployment.ledge;
    const actor = character.physicsObject.getBounds();
    if (!this.climbers.has(character.id)) {
      if (
        axis === 1 &&
        Math.abs(actor.bottom - top) <= END_TOLERANCE_PX &&
        Math.abs(actor.centerX - landingX) <= REACH_PX
      ) {
        this.climbers.add(character.id);
        this.swaySpeed += 38;
      } else if (
        axis === -1 &&
        Math.abs(actor.centerX - x) <= REACH_PX &&
        actor.bottom > top + END_TOLERANCE_PX &&
        actor.bottom <= bottom + END_TOLERANCE_PX
      ) {
        this.climbers.add(character.id);
        this.swaySpeed += actor.centerX >= x ? 38 : -38;
      } else {
        return undefined;
      }
    }

    if (actor.bottom <= top + END_TOLERANCE_PX && axis === -1) {
      this.climbers.delete(character.id);
      this.swaySpeed += 26;
      character.placeFeetAt(landingX, top);
      return { x: landingX, velocityY: 0 };
    }
    if (
      (hasLanding && actor.bottom >= bottom - END_TOLERANCE_PX && axis === 1) ||
      (axis === 0 && moveX !== 0)
    ) {
      this.climbers.delete(character.id);
      this.swaySpeed += moveX * 38;
      return undefined;
    }

    // Feed alternating rung loads into the visible rope only.
    if (axis !== 0) {
      this.swaySpeed += Math.sin(actor.bottom / 5) * 110 * deltaSeconds;
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

  public advance(deltaSeconds: number): void {
    if (this.deployment === null) return;
    const { retraction, pilot } = this.deployment;
    if (retraction !== undefined) {
      const lastAge = retraction.age;
      retraction.age += deltaSeconds;
      if (retraction.age >= REEL_SECONDS + PACK_SECONDS) {
        this.reset();
        return;
      }
      if (lastAge < REEL_SECONDS && retraction.age >= REEL_SECONDS) {
        pilot.setRopeEquipment(false, 'reach', retraction.direction);
      }
    }
    const lastAge = this.deployment.age;
    this.deployment.age += deltaSeconds;
    const { ledge, age } = this.deployment;
    if (lastAge < FOLLOW_THROUGH_SECONDS) {
      const pose =
        age < LIFT_SECONDS
          ? 'reach'
          : age < RELEASE_SECONDS
            ? 'lift'
            : age < FOLLOW_THROUGH_SECONDS
              ? 'throw'
              : undefined;
      pilot.setRopeEquipment(age < RELEASE_SECONDS, pose, ledge.direction);
    }
    this.swaySpeed -=
      (SWAY_SPRING * this.sway + SWAY_DAMPING * this.swaySpeed) * deltaSeconds;
    this.sway = Phaser.Math.Clamp(
      this.sway + this.swaySpeed * deltaSeconds,
      -MAX_SWAY_PX,
      MAX_SWAY_PX,
    );
  }

  public render(active: PlayerCharacter): void {
    if (this.deployment === null) {
      const ledge =
        active.hasAbility('deploy-rope') && active.getContacts().grounded
          ? this.findLedge(active)
          : undefined;
      this.label.setVisible(ledge !== undefined);
      if (ledge !== undefined) {
        this.showLabel(ledge, 'F · THROW ROPE');
      }
      return;
    }

    const { ledge, age, origin, pilot, retraction } = this.deployment;
    if (retraction !== undefined) {
      this.art.drawRetraction(
        ledge,
        retraction.from,
        Math.min(1, retraction.age / REEL_SECONDS),
        Math.max(0, (retraction.age - REEL_SECONDS) / PACK_SECONDS),
        this.sway,
        retraction.satchel,
      );
      this.showLabel(ledge, 'RETRACTING ROPE', retraction.from);
      return;
    }
    if (age >= RELEASE_SECONDS)
      this.art.draw(ledge, age - RELEASE_SECONDS, this.sway, origin);
    const retractEnd =
      active === pilot &&
      active.getContacts().grounded &&
      this.climbers.size === 0
        ? this.endInReach(active.physicsObject.getBounds(), ledge)
        : undefined;
    this.showLabel(
      ledge,
      age < READY_SECONDS
        ? 'UNROLLING ROPE'
        : retractEnd !== undefined
          ? '↑ / ↓ · F TO RETRACT'
          : '↑ / ↓ · CLIMB',
      retractEnd,
    );
  }

  public reset(): void {
    this.deployment?.pilot.setRopeEquipment(true);
    this.deployment = null;
    this.climbers.clear();
    this.sway = 0;
    this.swaySpeed = 0;
    this.art.clear();
    this.label.setVisible(false);
  }

  private showLabel(
    { direction, x, top, bottom }: RopeLedge,
    text: string,
    from: RopeEnd = 'top',
  ): void {
    this.label
      .setVisible(true)
      .setOrigin(direction < 0 ? 1 : 0, 0.5)
      .setPosition(x + direction * 20, from === 'top' ? top + 18 : bottom - 50)
      .setText(text);
  }

  private findLedge(pilot: PlayerCharacter): RopeLedge | undefined {
    return findRopeLedge(
      pilot.physicsObject.getBounds(),
      pilot.getFacingDirection(),
      this.level.staticGeometry,
      [...this.terrainBounds, ...this.getObstacles()],
      this.level.world,
      this.crewSize,
    );
  }

  private endInReach(
    actor: Phaser.Geom.Rectangle,
    { x, top, bottom, landingX, hasLanding }: RopeLedge,
  ): RopeEnd | undefined {
    if (
      Math.abs(actor.bottom - top) <= END_TOLERANCE_PX &&
      Math.abs(actor.centerX - landingX) <= REACH_PX
    )
      return 'top';
    if (
      hasLanding &&
      Math.abs(actor.bottom - bottom) <= END_TOLERANCE_PX &&
      Math.abs(actor.centerX - x) <= REACH_PX
    )
      return 'bottom';
    return undefined;
  }
}
