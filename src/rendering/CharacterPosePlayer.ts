import type Phaser from 'phaser';

import type {
  MovementContacts,
  MovementResult,
  MovementVelocity,
} from '../movement/MovementController';
import { getCharacterArtFrames, type CharacterArt } from './CharacterArt';
import type { Position } from './interpolatePosition';
import type { PoseTuning } from './PoseTuning';

const LANDING_SECONDS = 0.1;
const IDLE_SPEED_PX_PER_SECOND = 12;
const APEX_SPEED_PX_PER_SECOND = 100;
const FALL_SPEED_PX_PER_SECOND = 390;

interface PoseAction {
  readonly braced: boolean;
  readonly gripDirection: -1 | 0 | 1;
  readonly moveX: number;
}

export class CharacterPosePlayer {
  private readonly sprite: Phaser.GameObjects.Image;
  private tuning: PoseTuning;
  private facingRight = true;
  private previousSpeed = 0;
  private airSeconds = 0;
  private liftoffSeconds = 0;
  private landingSeconds = 0;
  private wallSide = 0;
  private wallSeconds = 0;
  private clip?: readonly string[];
  private phase = 0;

  public static create(
    scene: Phaser.Scene,
    art: CharacterArt,
    x: number,
    y: number,
    bodyHeight: number,
  ): CharacterPosePlayer | undefined {
    if (!scene.textures.exists(art.textureKey)) return undefined;

    const texture = scene.textures.get(art.textureKey);
    const missing = getCharacterArtFrames(art).filter(
      (frame) => !texture.has(frame),
    );
    if (missing.length > 0) {
      if (import.meta.env.DEV) {
        throw new Error(
          `${art.textureKey} is missing frames: ${missing.join(', ')}`,
        );
      }
      return undefined;
    }
    return new CharacterPosePlayer(scene, art, x, y, bodyHeight);
  }

  private constructor(
    scene: Phaser.Scene,
    private readonly art: CharacterArt,
    x: number,
    y: number,
    private readonly bodyHeight: number,
  ) {
    this.tuning = art.tuning;
    this.sprite = scene.add
      .image(x, y, art.textureKey, art.idle[0])
      .setOrigin(...art.origin);
    this.applyScale();
  }

  public update(
    seconds: number,
    contacts: MovementContacts,
    velocity: MovementVelocity,
    movement: MovementResult,
    { braced, gripDirection, moveX }: PoseAction,
  ): void {
    const speed = Math.abs(velocity.x);
    const braking = speed < this.previousSpeed - 1;
    this.previousSpeed = speed;
    if (contacts.grounded && gripDirection !== 0 && !braced) {
      this.facingRight = gripDirection > 0;
    } else if (speed > IDLE_SPEED_PX_PER_SECOND) {
      this.facingRight = velocity.x > 0;
    }

    if (contacts.grounded || braced) {
      this.landingSeconds =
        this.airSeconds >= LANDING_SECONDS
          ? LANDING_SECONDS
          : Math.max(0, this.landingSeconds - seconds);
      this.airSeconds = 0;
      this.liftoffSeconds = 0;
    } else {
      this.airSeconds += seconds;
      this.landingSeconds = 0;
      this.liftoffSeconds = movement.jumped
        ? this.art.jump.liftoffSeconds
        : Math.max(0, this.liftoffSeconds - seconds);
    }

    const { wall, brace, grip } = this.art;
    if (wall !== undefined && !contacts.grounded) {
      const wallSide =
        contacts.wallDirection ||
        (movement.state.mode === 'wall-sliding'
          ? movement.state.lastWallDirection
          : 0);
      this.wallSeconds =
        wallSide !== 0 && wallSide === this.wallSide
          ? this.wallSeconds + seconds
          : 0;
      this.wallSide = wallSide;
      if (movement.state.wallJumpControlLockRemainingSeconds > 0) {
        const movingRight = movement.jumped
          ? movement.velocity.x > 0
          : this.facingRight;
        this.stop(
          wall.kick,
          wall.authoredWall === 1 ? movingRight : !movingRight,
        );
        this.liftoffSeconds = 0;
        return;
      }
      if (wallSide !== 0) {
        const slide = velocity.y > 0 && this.wallSeconds >= wall.clingSeconds;
        this.stop(
          slide ? wall.slide : wall.cling,
          wallSide !== wall.authoredWall,
        );
        this.liftoffSeconds = 0;
        return;
      }
    } else {
      this.wallSide = 0;
      this.wallSeconds = 0;
    }

    if (braced && brace !== undefined) {
      this.play(brace.frames, seconds / brace.secondsPerFrame, true);
    } else if (!contacts.grounded) {
      this.stop(this.getAirFrame(velocity.y));
    } else if (gripDirection !== 0 && grip !== undefined) {
      const pulling =
        moveX === 0 ? this.clip === grip.pull : moveX * gripDirection < 0;
      this.play(
        pulling ? grip.pull : grip.push,
        moveX === 0 ? 0 : (speed * seconds) / grip.pixelsPerFrame,
      );
    } else if (this.landingSeconds > 0) {
      this.stop(this.art.land);
    } else if (speed <= IDLE_SPEED_PX_PER_SECOND) {
      this.play(this.art.idle, (seconds * 1000) / this.tuning.idleFrameMs);
    } else if (braking) {
      this.stop(this.art.brake);
    } else {
      this.play(
        this.art.run,
        (speed * seconds * this.art.run.length) / this.tuning.runCyclePx,
      );
    }
  }

  public render(feet: Position): void {
    this.sprite.setPosition(
      feet.x + this.tuning.offsetX,
      feet.y + this.tuning.offsetY,
    );
  }

  public setDepth(depth: number): void {
    this.sprite.setDepth(depth);
  }

  public setTuning(tuning: PoseTuning): void {
    this.tuning = tuning;
    this.applyScale();
  }

  public reset(): void {
    this.facingRight = true;
    this.previousSpeed = 0;
    this.airSeconds = 0;
    this.liftoffSeconds = 0;
    this.landingSeconds = 0;
    this.wallSide = 0;
    this.wallSeconds = 0;
    this.stop(this.art.idle[0]);
  }

  private getAirFrame(verticalSpeed: number): string {
    const { jump } = this.art;
    if (this.liftoffSeconds > 0 && verticalSpeed < 0) return jump.liftoff;
    if (verticalSpeed < -APEX_SPEED_PX_PER_SECOND) return jump.rise;
    if (verticalSpeed <= APEX_SPEED_PX_PER_SECOND) return jump.apex;
    return verticalSpeed < FALL_SPEED_PX_PER_SECOND ? jump.descend : jump.fall;
  }

  private stop(frame: string, flipX = !this.facingRight): void {
    this.clip = undefined;
    this.show(frame, flipX);
  }

  private play(
    frames: readonly [string, ...string[]],
    advance: number,
    holdLast = false,
  ): void {
    if (this.clip !== frames) {
      this.clip = frames;
      this.phase = 0;
    }
    this.show(frames[Math.floor(this.phase)]!, !this.facingRight);
    const next = this.phase + advance;
    this.phase = holdLast
      ? Math.min(next, frames.length - 1)
      : next % frames.length;
  }

  private show(frame: string, flipX: boolean): void {
    if (this.sprite.frame.name !== frame) {
      this.sprite.setFrame(frame, true, false).updateDisplayOrigin();
      this.applyScale();
    }
    this.sprite.setFlipX(flipX);
  }

  private applyScale(): void {
    const { scale } = this.tuning;
    const { brace } = this.art;
    const braceScale = brace?.frames.includes(this.sprite.frame.name)
      ? this.bodyHeight / brace.supportHeight
      : 1;
    this.sprite.setScale(scale, scale * braceScale);
  }
}
