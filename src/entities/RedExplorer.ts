import Phaser from 'phaser';

import type { PlayerIntent } from '../input/PlayerIntent';
import { DEFAULT_MOVEMENT_CONFIG } from '../movement/MovementConfig';
import {
  MovementController,
  type MovementResult,
} from '../movement/MovementController';
import { ArcadeBodyAdapter } from '../physics/ArcadeBodyAdapter';
import {
  createExplorerArt,
  type ExplorerPose,
} from '../rendering/RedExplorerArt';
import {
  interpolatePosition,
  type Position,
} from '../rendering/interpolatePosition';

const WIDTH = 24;
const HEIGHT = 40;
const CLIMB_SPEED = 155;
const LADDER_REACH = 18;

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
    createExplorerArt(scene);
    this.sprite = scene.add
      .image(x, feetY, 'red-explorer-idle')
      .setOrigin(0.5, 1)
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

  public complete(): void {
    this.position = this.adapter.readPosition();
    this.stride += Math.abs(this.position.x - this.previousPosition.x);
    if (this.climbing) {
      this.climbTravel += Math.abs(this.position.y - this.previousPosition.y);
    }
  }

  public render(alpha: number, carrying: boolean): void {
    const { x, y } = interpolatePosition(
      this.previousPosition,
      this.position,
      alpha,
    );
    const pose = this.getPose(carrying);
    this.sprite.setPosition(Math.round(x), Math.round(y + HEIGHT / 2));
    const key = `red-explorer-${pose}`;
    if (this.sprite.texture.key !== key) this.sprite.setTexture(key);
    this.sprite.setFlipX(this.facing < 0);
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
    this.climbTravel = 0;
    this.result = undefined;
    this.controller.reset();
    this.body.setAllowGravity(true);
    this.adapter.reset(x, feetY - HEIGHT / 2);
    this.previousPosition = this.position = this.adapter.readPosition();
  }

  private getPose(carrying: boolean): ExplorerPose {
    if (this.climbing) {
      return Math.floor(this.climbTravel / 8) % 2 === 0 ? 'climb-0' : 'climb-1';
    }
    if (carrying) {
      const frame =
        Math.abs(this.body.velocity.x) < 12
          ? 1
          : Math.floor(this.stride / 10) % 4;
      return (['carry-0', 'carry-1', 'carry-2', 'carry-3'] as const)[frame]!;
    }
    if (this.getMode() === 'wall-sliding') return 'wall';
    if (!this.isGrounded()) return this.body.velocity.y < 0 ? 'rise' : 'fall';
    if (Math.abs(this.body.velocity.x) < 12) return 'idle';
    return (['run-0', 'run-1', 'run-2', 'run-3'] as const)[
      Math.floor(this.stride / 10) % 4
    ]!;
  }
}
