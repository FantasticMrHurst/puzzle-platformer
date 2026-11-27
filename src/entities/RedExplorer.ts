import Phaser from 'phaser';

import type { PlayerIntent } from '../input/PlayerIntent';
import { DEFAULT_MOVEMENT_CONFIG } from '../movement/MovementConfig';
import {
  MovementController,
  type MovementResult,
} from '../movement/MovementController';
import { ArcadeBodyAdapter } from '../physics/ArcadeBodyAdapter';
import {
  APEX_POSE,
  CARRY_IDLE_POSE,
  CARRY_POSES,
  CLIMB_POSES,
  EXPLORER_ART_SCALE,
  EXPLORER_FOOT_ORIGIN,
  FALL_POSE,
  IDLE_POSES,
  LAND_POSE,
  RISE_POSE,
  RUN_POSES,
  WALL_SLIDE_POSES,
} from '../rendering/RedExplorerArt';
import {
  interpolatePosition,
  type Position,
} from '../rendering/interpolatePosition';

const WIDTH = 24;
const HEIGHT = 40;
const CLIMB_SPEED = 155;
const LADDER_REACH = 18;
const IDLE_FRAME_SECONDS = 0.22;
const WALL_SLIDE_FRAME_SECONDS = 0.12;
const LAND_SECONDS = 0.09;
const RUN_PIXELS_PER_FRAME = 14;
const CARRY_PIXELS_PER_FRAME = 16;
const CLIMB_PIXELS_PER_FRAME = 10;
const APEX_SPEED = 75;

const MOVEMENT = {
  ...DEFAULT_MOVEMENT_CONFIG,
  maxRunSpeed: 255,
  jumpSpeed: 610,
  maxFallSpeed: 1000,
  groundAcceleration: 1800,
  wallMovement: {
    slideMaxFallSpeed: 105,
    clingSpeed: 28,
    jumpHorizontalSpeed: 260,
    jumpVerticalSpeed: 565,
    jumpControlLockSeconds: 0.11,
    contactGraceSeconds: 0.12,
  },
};

export class RedExplorer {
  public readonly physicsObject: Phaser.GameObjects.Rectangle;
  public readonly body: Phaser.Physics.Arcade.Body;
  public readonly sprite: Phaser.GameObjects.Image;
  public facing: -1 | 1 = 1;
  public climbing = false;
  private readonly adapter: ArcadeBodyAdapter;
  private readonly controller = new MovementController(MOVEMENT);
  private previousPosition: Position;
  private position: Position;
  private stride = 0;
  private idleSeconds = 0;
  private wallSlideSeconds = 0;
  private airborneSeconds = 0;
  private landingSeconds = 0;
  private climbTravel = 0;
  private result?: MovementResult;

  public constructor(scene: Phaser.Scene, x: number, feetY: number) {
    this.physicsObject = scene.add
      .rectangle(x, feetY - HEIGHT / 2, WIDTH, HEIGHT)
      .setVisible(false);
    scene.physics.add.existing(this.physicsObject);
    if (!(this.physicsObject.body instanceof Phaser.Physics.Arcade.Body)) {
      throw new TypeError('The explorer needs a dynamic Arcade body');
    }
    this.body = this.physicsObject.body;
    this.adapter = new ArcadeBodyAdapter(this.physicsObject);
    this.adapter.setMaximumVelocity(
      MOVEMENT.maxRunSpeed,
      MOVEMENT.maxFallSpeed,
    );
    this.previousPosition = this.position = this.adapter.readPosition();
    this.sprite = scene.add
      .image(x, feetY, IDLE_POSES[0])
      .setOrigin(EXPLORER_FOOT_ORIGIN.x, EXPLORER_FOOT_ORIGIN.y)
      .setScale(EXPLORER_ART_SCALE)
      .setDepth(5);
  }

  public prepare(
    deltaSeconds: number,
    intent: PlayerIntent,
    climbAxis: number,
    ladder: Phaser.Geom.Rectangle,
    platformTop: number,
  ): void {
    this.previousPosition = this.position;
    const ladderX = ladder.centerX;
    const feet = this.body.bottom;
    const atLadder =
      Math.abs(this.body.center.x - ladderX) <= LADDER_REACH &&
      feet >= platformTop - 2 &&
      feet <= ladder.bottom + 2;
    const canClimb =
      (climbAxis < 0 && feet > platformTop + 1) ||
      (climbAxis > 0 && feet < ladder.bottom - 1);

    if (!this.climbing && atLadder && canClimb) {
      this.climbing = true;
      this.body.reset(ladderX, this.body.center.y);
      this.body.setAllowGravity(false);
      this.controller.reset();
    }
    if (
      this.climbing &&
      (intent.jumpPressed ||
        (intent.moveX !== 0 && climbAxis === 0) ||
        (climbAxis !== 0 && !canClimb))
    ) {
      this.climbing = false;
      this.body.setAllowGravity(true);
    }
    if (this.climbing) {
      const velocityY = Phaser.Math.Clamp(
        climbAxis * CLIMB_SPEED,
        (platformTop - feet) / deltaSeconds,
        (ladder.bottom - feet) / deltaSeconds,
      );
      this.adapter.applyVelocity({ x: 0, y: velocityY });
      return;
    }

    if (intent.moveX !== 0) {
      this.facing = intent.moveX < 0 ? -1 : 1;
    }
    this.result = this.controller.update({
      contacts: this.adapter.readContacts(),
      velocity: this.adapter.readVelocity(),
      deltaSeconds,
      intent,
    });
    this.adapter.applyVelocity(this.result.velocity);
  }

  public complete(deltaSeconds: number): void {
    this.position = this.adapter.readPosition();
    this.stride += Math.abs(this.position.x - this.previousPosition.x);
    this.wallSlideSeconds =
      this.getMode() === 'wall-sliding' && !this.isGrounded()
        ? this.wallSlideSeconds + deltaSeconds
        : 0;
    if (this.climbing) {
      this.climbTravel += Math.abs(this.position.y - this.previousPosition.y);
      this.airborneSeconds = 0;
      this.landingSeconds = 0;
    } else if (this.isGrounded()) {
      this.landingSeconds =
        this.airborneSeconds >= LAND_SECONDS
          ? LAND_SECONDS
          : Math.max(0, this.landingSeconds - deltaSeconds);
      this.airborneSeconds = 0;
    } else {
      this.airborneSeconds += deltaSeconds;
      this.landingSeconds = 0;
    }
    this.idleSeconds =
      this.isGrounded() && Math.abs(this.body.velocity.x) < 12
        ? this.idleSeconds + deltaSeconds
        : 0;
  }

  public render(alpha: number, carrying: boolean): void {
    const { x, y } = interpolatePosition(
      this.previousPosition,
      this.position,
      alpha,
    );
    const pose = this.getPose(carrying);
    this.sprite.setPosition(Math.round(x), Math.round(y + HEIGHT / 2));
    if (this.sprite.texture.key !== pose) this.sprite.setTexture(pose);
    // Mirror around the common foot anchor, not the middle of the source canvas.
    const wallDirection = this.result?.state.lastWallDirection ?? 0;
    const facing =
      this.wallSlideSeconds > 0 && !carrying && wallDirection !== 0
        ? -wallDirection
        : this.facing;
    this.sprite.setScale(EXPLORER_ART_SCALE * facing, EXPLORER_ART_SCALE);
  }

  public isGrounded(): boolean {
    return this.adapter.readContacts().grounded;
  }

  public getMode(): string {
    return this.climbing ? 'climbing' : (this.result?.state.mode ?? 'grounded');
  }

  public reset(x: number, feetY: number): void {
    this.climbing = false;
    this.facing = 1;
    this.stride = 0;
    this.idleSeconds = 0;
    this.wallSlideSeconds = 0;
    this.airborneSeconds = 0;
    this.landingSeconds = 0;
    this.climbTravel = 0;
    this.result = undefined;
    this.controller.reset();
    this.body.setAllowGravity(true);
    this.adapter.reset(x, feetY - HEIGHT / 2);
    this.previousPosition = this.position = this.adapter.readPosition();
  }

  private getPose(carrying: boolean): string {
    if (carrying) {
      return Math.abs(this.body.velocity.x) < 12
        ? CARRY_IDLE_POSE
        : cyclePose(CARRY_POSES, this.stride / CARRY_PIXELS_PER_FRAME);
    }
    if (this.climbing) {
      return cyclePose(CLIMB_POSES, this.climbTravel / CLIMB_PIXELS_PER_FRAME);
    }
    if (this.wallSlideSeconds > 0) {
      return cyclePose(
        WALL_SLIDE_POSES,
        this.wallSlideSeconds / WALL_SLIDE_FRAME_SECONDS,
      );
    }
    if (!this.isGrounded()) {
      const verticalSpeed = this.body.velocity.y;
      if (verticalSpeed < -APEX_SPEED) return RISE_POSE;
      return verticalSpeed > APEX_SPEED ? FALL_POSE : APEX_POSE;
    }
    if (this.landingSeconds > 0) return LAND_POSE;
    return Math.abs(this.body.velocity.x) < 12
      ? cyclePose(IDLE_POSES, this.idleSeconds / IDLE_FRAME_SECONDS)
      : cyclePose(RUN_POSES, this.stride / RUN_PIXELS_PER_FRAME);
  }
}

function cyclePose(poses: readonly string[], frames: number): string {
  return poses[Math.floor(frames) % poses.length]!;
}
