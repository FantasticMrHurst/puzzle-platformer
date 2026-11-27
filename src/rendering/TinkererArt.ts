import Phaser from 'phaser';

import atlasData from '../assets/sprites/tinkerer/tinkerer.json';
import atlasImage from '../assets/sprites/tinkerer/tinkerer.png';
import type {
  MovementContacts,
  MovementResult,
  MovementVelocity,
} from '../movement/MovementController';
import type { Position } from './interpolatePosition';

const TEXTURE_KEY = 'tinkerer-art';
const IDLE_SPEED = 12;
const RUN_PIXELS_PER_FRAME = 14;
const LAND_SECONDS = 0.13;
const APEX_SPEED = 100;
const IDLE_FRAME_SECONDS = 0.25;
const IDLE_FRAMES = ['idle', 'idle_back', 'idle', 'idle_forward'] as const;
const BLINK_START_SECONDS = 3;
const BLINK_END_SECONDS = 3.12;
const BLINK_CYCLE_SECONDS = 4;
const RUN_FRAMES = [
  'run_01',
  'run_02',
  'run_03',
  'run_04',
  'run_05',
  'run_06',
] as const;
const RUN_CYCLE_PIXELS = RUN_FRAMES.length * RUN_PIXELS_PER_FRAME;
const PICKUP_REACH_SECONDS = 0.14;
// Grip points in pixels relative to the fixed foot origin, authored facing right.
const PLUG_GRIPS = {
  carry_reach: { x: 19, y: -18 },
  carry_idle: { x: 17, y: -27 },
  carry_step_a: { x: 17, y: -27 },
  carry_step_b: { x: 16, y: -31 },
  carry_air: { x: 17, y: -34 },
  carry_land: { x: 17, y: -27 },
} as const satisfies Partial<Record<Pose, Position>>;
type Pose = keyof typeof atlasData.frames;

export class TinkererArt {
  private readonly sprite: Phaser.GameObjects.Image;
  private idleSeconds = 0;
  private runDistance = 0;
  private airborneSeconds = 0;
  private landingSeconds = 0;
  private movementPose: Pose = 'idle';
  private movementFlipped = false;
  private carrySide: -1 | 1 | null = null;
  private reachSeconds = 0;

  public static preload(scene: Phaser.Scene): void {
    scene.load.atlas(TEXTURE_KEY, atlasImage, atlasData);
  }

  public constructor(scene: Phaser.Scene, x: number, y: number) {
    scene.textures
      .get(TEXTURE_KEY)
      .setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.sprite = scene.add
      .image(x, y, TEXTURE_KEY, 'idle')
      .setOrigin(48 / 96, 96 / 112);
  }

  public update(
    deltaSeconds: number,
    contacts: MovementContacts,
    velocity: MovementVelocity,
    result: MovementResult,
    { moveX }: { readonly moveX: number },
  ): void {
    const speed = Math.abs(velocity.x);
    if (speed > IDLE_SPEED) {
      this.movementFlipped = velocity.x < 0;
    } else if (moveX !== 0) {
      this.movementFlipped = moveX < 0;
    }
    this.reachSeconds = Math.max(0, this.reachSeconds - deltaSeconds);

    if (result.jumped || !contacts.grounded) {
      this.airborneSeconds += deltaSeconds;
      this.landingSeconds = 0;
      this.runDistance = 0;
      this.idleSeconds = 0;
      this.setPose(this.jumpPose(velocity.y, result.jumped));
      return;
    }

    this.landingSeconds =
      this.airborneSeconds >= LAND_SECONDS
        ? LAND_SECONDS
        : Math.max(0, this.landingSeconds - deltaSeconds);
    this.airborneSeconds = 0;

    if (this.landingSeconds > 0) {
      this.setPose('land');
    } else if (speed > IDLE_SPEED) {
      const frame = Math.floor(this.runDistance / RUN_PIXELS_PER_FRAME);
      this.setPose(RUN_FRAMES[frame]!);
      this.runDistance =
        (this.runDistance + speed * deltaSeconds) % RUN_CYCLE_PIXELS;
      this.idleSeconds = 0;
    } else {
      this.setPose(this.idlePose());
      this.idleSeconds =
        (this.idleSeconds + deltaSeconds) % BLINK_CYCLE_SECONDS;
      this.runDistance = 0;
    }
  }

  public render(feet: Position): void {
    this.sprite.setPosition(feet.x, feet.y);
  }

  public setDepth(depth: number): void {
    this.sprite.setDepth(depth);
  }

  public setPlugCarry(side: -1 | 1 | null): void {
    if (side !== null && this.carrySide === null) {
      this.reachSeconds = PICKUP_REACH_SECONDS;
    }
    if (side !== null) {
      this.movementFlipped = side < 0;
    }
    this.carrySide = side;
    this.applyPose();
  }

  public getPlugGrip(): Position | undefined {
    if (this.carrySide === null) return undefined;
    const grip = PLUG_GRIPS[this.carryPose()];
    return { x: grip.x * this.carrySide, y: grip.y };
  }

  public reset(): void {
    this.idleSeconds = 0;
    this.runDistance = 0;
    this.airborneSeconds = 0;
    this.landingSeconds = 0;
    this.carrySide = null;
    this.reachSeconds = 0;
    this.movementFlipped = false;
    this.setPose('idle');
  }

  private jumpPose(verticalSpeed: number, jumped: boolean): Pose {
    if (jumped || verticalSpeed < -APEX_SPEED) return 'jump_rise';
    if (verticalSpeed <= APEX_SPEED) return 'jump_apex';
    return 'jump_fall';
  }

  private idlePose(): Pose {
    if (
      this.idleSeconds >= BLINK_START_SECONDS &&
      this.idleSeconds < BLINK_END_SECONDS
    ) {
      return 'blink';
    }
    const frame = Math.floor(this.idleSeconds / IDLE_FRAME_SECONDS);
    return IDLE_FRAMES[frame % IDLE_FRAMES.length]!;
  }

  private setPose(pose: Pose): void {
    this.movementPose = pose;
    this.applyPose();
  }

  private carryPose(): keyof typeof PLUG_GRIPS {
    if (this.movementPose.startsWith('jump_')) return 'carry_air';
    if (this.reachSeconds > 0) return 'carry_reach';
    if (this.movementPose === 'land') return 'carry_land';
    const step = RUN_FRAMES.findIndex((frame) => frame === this.movementPose);
    if (step < 0 || step % 3 === 2) return 'carry_idle';
    return step < 3 ? 'carry_step_a' : 'carry_step_b';
  }

  private applyPose(): void {
    const pose = this.carrySide === null ? this.movementPose : this.carryPose();
    if (this.sprite.frame.name !== pose) {
      this.sprite.setFrame(pose);
    }
    this.sprite.setFlipX(
      this.carrySide === null ? this.movementFlipped : this.carrySide < 0,
    );
  }
}
