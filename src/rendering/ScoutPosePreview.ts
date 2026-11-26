import type Phaser from 'phaser';

import scoutBrake from '../assets/sprites/scout/scout_brake.png';
import scoutIdle01 from '../assets/sprites/scout/scout_idle_01.png';
import scoutIdle02 from '../assets/sprites/scout/scout_idle_02.png';
import scoutIdle03 from '../assets/sprites/scout/scout_idle_03.png';
import scoutIdle04 from '../assets/sprites/scout/scout_idle_04.png';
import scoutIdle05 from '../assets/sprites/scout/scout_idle_05.png';
import scoutIdle06 from '../assets/sprites/scout/scout_idle_06.png';
import scoutIdle07 from '../assets/sprites/scout/scout_idle_07.png';
import scoutIdle08 from '../assets/sprites/scout/scout_idle_08.png';
import scoutJumpLiftoff from '../assets/sprites/scout/scout_jump_01_liftoff.png';
import scoutJumpRise from '../assets/sprites/scout/scout_jump_02_rise.png';
import scoutJumpApex from '../assets/sprites/scout/scout_jump_03_apex.png';
import scoutJumpDescend from '../assets/sprites/scout/scout_jump_04_descend.png';
import scoutJumpFall from '../assets/sprites/scout/scout_jump_05_fall.png';
import scoutLand from '../assets/sprites/scout/scout_land.png';
import scoutRun01 from '../assets/sprites/scout/scout_run_01.png';
import scoutRun02 from '../assets/sprites/scout/scout_run_02.png';
import scoutRun03 from '../assets/sprites/scout/scout_run_03.png';
import scoutRun04 from '../assets/sprites/scout/scout_run_04.png';
import scoutRun05 from '../assets/sprites/scout/scout_run_05.png';
import scoutRun06 from '../assets/sprites/scout/scout_run_06.png';
import scoutRun07 from '../assets/sprites/scout/scout_run_07.png';
import scoutRun08 from '../assets/sprites/scout/scout_run_08.png';
import scoutWallCling from '../assets/sprites/scout/scout_wall_cling.png';
import scoutWallKick from '../assets/sprites/scout/scout_wall_kick.png';
import scoutWallSlide from '../assets/sprites/scout/scout_wall_slide.png';
import type {
  MovementContacts,
  MovementResult,
  MovementVelocity,
} from '../movement/MovementController';
import type { Position } from './interpolatePosition';

const POSES = {
  brake: scoutBrake,
  idle01: scoutIdle01,
  idle02: scoutIdle02,
  idle03: scoutIdle03,
  idle04: scoutIdle04,
  idle05: scoutIdle05,
  idle06: scoutIdle06,
  idle07: scoutIdle07,
  idle08: scoutIdle08,
  jumpLiftoff: scoutJumpLiftoff,
  jumpRise: scoutJumpRise,
  jumpApex: scoutJumpApex,
  jumpDescend: scoutJumpDescend,
  jumpFall: scoutJumpFall,
  land: scoutLand,
  run01: scoutRun01,
  run02: scoutRun02,
  run03: scoutRun03,
  run04: scoutRun04,
  run05: scoutRun05,
  run06: scoutRun06,
  run07: scoutRun07,
  run08: scoutRun08,
  wallCling: scoutWallCling,
  wallKick: scoutWallKick,
  wallSlide: scoutWallSlide,
} as const;
type Pose = keyof typeof POSES;

const RUN_FRAMES = [
  'run01',
  'run02',
  'run03',
  'run04',
  'run05',
  'run06',
  'run07',
  'run08',
] as const satisfies readonly Pose[];

const IDLE_FRAMES = [
  'idle01',
  'idle02',
  'idle03',
  'idle04',
  'idle05',
  'idle06',
  'idle07',
  'idle08',
] as const satisfies readonly Pose[];

const IDLE_FRAME_SECONDS = 0.15;
const IDLE_CYCLE_SECONDS = IDLE_FRAME_SECONDS * IDLE_FRAMES.length;

const LAND_POSE_SECONDS = 0.1;
const LIFTOFF_POSE_SECONDS = 0.07;
const APEX_SPEED_PX_PER_SECOND = 100;
const FALL_SPEED_PX_PER_SECOND = 390;
const WALL_CLING_SECONDS = 0.12;
const RUN_FRAME_DISTANCE_PX = 20;
const RUN_CYCLE_DISTANCE_PX = RUN_FRAME_DISTANCE_PX * RUN_FRAMES.length;
const IDLE_SPEED_PX_PER_SECOND = 12;

function textureKey(pose: string): string {
  return `scout-preview-${pose}`;
}

export class ScoutPosePreview {
  private readonly sprite: Phaser.GameObjects.Image;
  private facingRight = true;
  private wallSide = 0;
  private wallSeconds = 0;
  private airborneSeconds = 0;
  private liftoffSeconds = 0;
  private landingSeconds = 0;
  private idleSeconds = 0;
  private runDistance = 0;
  private previousSpeed = 0;

  public static preload(scene: Phaser.Scene): void {
    const params = new URLSearchParams(window.location.search);
    if (params.get('scoutArt') !== '1') {
      return;
    }
    for (const [pose, url] of Object.entries(POSES)) {
      scene.load.image(textureKey(pose), url);
    }
  }

  public static create(
    scene: Phaser.Scene,
    x: number,
    y: number,
  ): ScoutPosePreview | undefined {
    const loaded = Object.keys(POSES).every((pose) =>
      scene.textures.exists(textureKey(pose)),
    );
    return loaded ? new ScoutPosePreview(scene, x, y) : undefined;
  }

  private constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.add
      .image(x, y, textureKey(IDLE_FRAMES[0]))
      .setOrigin(0.5, 96 / 112);
  }

  public update(
    deltaSeconds: number,
    contacts: MovementContacts,
    velocity: MovementVelocity,
    result: MovementResult,
  ): void {
    const speed = Math.abs(velocity.x);
    const braking = contacts.grounded && speed < this.previousSpeed - 1;
    this.previousSpeed = speed;
    if (speed > IDLE_SPEED_PX_PER_SECOND) {
      this.facingRight = velocity.x > 0;
    }

    if (contacts.grounded) {
      if (this.airborneSeconds >= LAND_POSE_SECONDS) {
        this.landingSeconds = LAND_POSE_SECONDS;
      } else {
        this.landingSeconds = Math.max(0, this.landingSeconds - deltaSeconds);
      }
      this.airborneSeconds = 0;
    } else {
      this.airborneSeconds += deltaSeconds;
      this.landingSeconds = 0;
    }

    const wallSide = contacts.grounded
      ? 0
      : contacts.wallDirection ||
        (result.state.mode === 'wall-sliding'
          ? result.state.lastWallDirection
          : 0);
    this.wallSeconds =
      wallSide !== 0 && wallSide === this.wallSide
        ? this.wallSeconds + deltaSeconds
        : 0;
    this.wallSide = wallSide;

    const wallKicking =
      !contacts.grounded &&
      result.state.wallJumpControlLockRemainingSeconds > 0;
    if (contacts.grounded || wallKicking || wallSide !== 0) {
      this.liftoffSeconds = 0;
    } else if (result.jumped) {
      this.liftoffSeconds = LIFTOFF_POSE_SECONDS;
    } else {
      this.liftoffSeconds = Math.max(0, this.liftoffSeconds - deltaSeconds);
    }

    if (!contacts.grounded || speed <= IDLE_SPEED_PX_PER_SECOND || braking) {
      this.runDistance = 0;
    } else {
      this.runDistance =
        (this.runDistance + speed * deltaSeconds) % RUN_CYCLE_DISTANCE_PX;
    }

    if (
      !contacts.grounded ||
      this.landingSeconds > 0 ||
      speed > IDLE_SPEED_PX_PER_SECOND
    ) {
      this.idleSeconds = 0;
    }

    if (wallKicking) {
      // The supplied kick is drawn away from a right-hand wall.
      this.setPose(
        'wallKick',
        result.jumped ? result.velocity.x > 0 : this.facingRight,
      );
    } else if (wallSide !== 0) {
      const sliding = velocity.y > 0 && this.wallSeconds >= WALL_CLING_SECONDS;
      this.setPose(sliding ? 'wallSlide' : 'wallCling', wallSide < 0);
    } else if (!contacts.grounded) {
      this.setPose(this.getJumpPose(velocity.y), !this.facingRight);
    } else if (this.landingSeconds > 0) {
      this.setPose('land', !this.facingRight);
    } else if (speed <= IDLE_SPEED_PX_PER_SECOND) {
      const frame = Math.floor(this.idleSeconds / IDLE_FRAME_SECONDS);
      this.setPose(IDLE_FRAMES[frame]!, !this.facingRight);
      this.idleSeconds = (this.idleSeconds + deltaSeconds) % IDLE_CYCLE_SECONDS;
    } else if (braking) {
      this.setPose('brake', !this.facingRight);
    } else {
      const step = Math.floor(this.runDistance / RUN_FRAME_DISTANCE_PX);
      this.setPose(RUN_FRAMES[step]!, !this.facingRight);
    }
  }

  public render(feet: Position): void {
    this.sprite.setPosition(feet.x, feet.y);
  }

  public setDepth(depth: number): void {
    this.sprite.setDepth(depth);
  }

  public reset(): void {
    this.facingRight = true;
    this.wallSide = 0;
    this.wallSeconds = 0;
    this.airborneSeconds = 0;
    this.liftoffSeconds = 0;
    this.landingSeconds = 0;
    this.idleSeconds = 0;
    this.runDistance = 0;
    this.previousSpeed = 0;
    this.setPose(IDLE_FRAMES[0], false);
  }

  private getJumpPose(verticalSpeed: number): Pose {
    if (this.liftoffSeconds > 0 && verticalSpeed < 0) {
      return 'jumpLiftoff';
    }
    if (verticalSpeed < -APEX_SPEED_PX_PER_SECOND) {
      return 'jumpRise';
    }
    if (verticalSpeed <= APEX_SPEED_PX_PER_SECOND) {
      return 'jumpApex';
    }
    return verticalSpeed < FALL_SPEED_PX_PER_SECOND
      ? 'jumpDescend'
      : 'jumpFall';
  }

  private setPose(pose: Pose, flipX: boolean): void {
    const texture = textureKey(pose);
    if (this.sprite.texture.key !== texture) {
      this.sprite.setTexture(texture);
    }
    this.sprite.setFlipX(flipX);
  }
}
