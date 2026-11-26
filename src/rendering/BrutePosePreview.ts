import type Phaser from 'phaser';

import spriteSpecs from '../assets/sprites/brute/brute_sprite_specs.json';
import type {
  MovementContacts,
  MovementResult,
  MovementVelocity,
} from '../movement/MovementController';
import type { Position } from './interpolatePosition';

const ASSETS = import.meta.glob<string>(
  [
    '../assets/sprites/brute/brute_{idle,run,jump,push,pull,brace}_[0-9][0-9]*.png',
    '../assets/sprites/brute/brute_{brake,land}.png',
  ],
  { eager: true, import: 'default', query: '?url' },
);
const TEXTURES = Object.entries(ASSETS).map(
  ([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -4), url] as const,
);
const IDLE_SECONDS_PER_FRAME = 0.16;
const RUN_PIXELS_PER_FRAME = 22;
const GRIP_PIXELS_PER_FRAME = 12;
const BRACE_SECONDS_PER_FRAME = 0.045;
const [FOOT_X, FOOT_Y] = spriteSpecs.anchor as [number, number];
const [FRAME_WIDTH, FRAME_HEIGHT] = spriteSpecs.canvas as [number, number];
const BRACE_ART_HEIGHT = FOOT_Y - spriteSpecs.brace_surface_suggested_local_y;
const LAND_SECONDS = 0.1;
const LIFTOFF_SECONDS = 0.075;
const STOP_SPEED_PX_PER_SECOND = 12;

export interface BrutePoseAction {
  readonly braced: boolean;
  readonly gripDirection: -1 | 0 | 1;
  readonly moveX: number;
}

export class BrutePosePreview {
  private readonly sprite: Phaser.GameObjects.Image;
  private facingRight = true;
  private previousSpeed = 0;
  private airborneSeconds = 0;
  private liftoffSeconds = 0;
  private landingSeconds = 0;
  private sequence = '';
  private sequenceProgress = 0;

  public static preload(scene: Phaser.Scene): void {
    if (new URLSearchParams(window.location.search).get('bruteArt') !== '1') {
      return;
    }
    for (const [key, url] of TEXTURES) {
      scene.load.image(key, url);
    }
  }

  public static create(
    scene: Phaser.Scene,
    x: number,
    y: number,
    bodyHeight: number,
  ): BrutePosePreview | undefined {
    return scene.textures.exists('brute_idle_01') &&
      TEXTURES.every(([key]) => scene.textures.exists(key))
      ? new BrutePosePreview(scene, x, y, bodyHeight / BRACE_ART_HEIGHT)
      : undefined;
  }

  private constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly braceScale: number,
  ) {
    this.sprite = scene.add
      .image(x, y, 'brute_idle_01')
      .setOrigin(FOOT_X / FRAME_WIDTH, FOOT_Y / FRAME_HEIGHT);
  }

  public update(
    deltaSeconds: number,
    contacts: MovementContacts,
    velocity: MovementVelocity,
    result: MovementResult,
    { braced, gripDirection, moveX }: BrutePoseAction,
  ): void {
    const speed = Math.abs(velocity.x);
    const braking = speed < this.previousSpeed - 1;
    this.previousSpeed = speed;

    if (contacts.grounded || braced) {
      this.landingSeconds =
        this.airborneSeconds >= LAND_SECONDS
          ? LAND_SECONDS
          : Math.max(0, this.landingSeconds - deltaSeconds);
      this.airborneSeconds = 0;
      this.liftoffSeconds = 0;
    } else {
      this.airborneSeconds += deltaSeconds;
      this.landingSeconds = 0;
      this.liftoffSeconds = result.jumped
        ? LIFTOFF_SECONDS
        : Math.max(0, this.liftoffSeconds - deltaSeconds);
    }

    if (contacts.grounded && gripDirection !== 0 && !braced) {
      this.facingRight = gripDirection > 0;
    } else if (speed > STOP_SPEED_PX_PER_SECOND) {
      this.facingRight = velocity.x > 0;
    }

    if (braced) {
      this.play('brace', deltaSeconds / BRACE_SECONDS_PER_FRAME, 4, true);
    } else if (!contacts.grounded) {
      this.stopSequence(this.jumpPose(velocity.y));
    } else if (gripDirection !== 0) {
      const pulling =
        moveX === 0 ? this.sequence === 'pull' : moveX * gripDirection < 0;
      const progress =
        moveX === 0 ? 0 : (speed * deltaSeconds) / GRIP_PIXELS_PER_FRAME;
      this.play(pulling ? 'pull' : 'push', progress, 4);
    } else if (this.landingSeconds > 0) {
      this.stopSequence('land');
    } else if (speed <= STOP_SPEED_PX_PER_SECOND) {
      this.play('idle', deltaSeconds / IDLE_SECONDS_PER_FRAME, 8);
    } else if (braking) {
      this.stopSequence('brake');
    } else {
      this.play('run', (speed * deltaSeconds) / RUN_PIXELS_PER_FRAME, 8);
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
    this.previousSpeed = 0;
    this.airborneSeconds = 0;
    this.liftoffSeconds = 0;
    this.landingSeconds = 0;
    this.stopSequence('idle_01');
  }

  private jumpPose(verticalSpeed: number): string {
    if (this.liftoffSeconds > 0 && verticalSpeed < 0) {
      return 'jump_01_liftoff';
    }
    if (verticalSpeed < -100) {
      return 'jump_02_rise';
    }
    if (verticalSpeed <= 100) {
      return 'jump_03_apex';
    }
    return verticalSpeed < 390 ? 'jump_04_descend' : 'jump_05_fall';
  }

  private stopSequence(pose: string): void {
    this.sequence = '';
    this.setPose(pose);
  }

  private play(
    name: string,
    progress: number,
    length: number,
    holdLast = false,
  ): void {
    if (this.sequence !== name) {
      this.sequence = name;
      this.sequenceProgress = 0;
    }
    const frame = Math.floor(this.sequenceProgress) + 1;
    this.setPose(`${name}_${String(frame).padStart(2, '0')}`);
    const next = this.sequenceProgress + progress;
    this.sequenceProgress = holdLast
      ? Math.min(next, length - 1)
      : next % length;
  }

  private setPose(pose: string): void {
    const key = `brute_${pose}`;
    if (this.sprite.texture.key !== key) {
      this.sprite
        .setTexture(key)
        .setScale(1, pose.startsWith('brace_') ? this.braceScale : 1);
    }
    this.sprite.setFlipX(!this.facingRight);
  }
}
