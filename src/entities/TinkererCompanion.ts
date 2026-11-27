import Phaser from 'phaser';

import atlasData from '../assets/sprites/tinkerer-companion/companion.json';
import atlasImage from '../assets/sprites/tinkerer-companion/companion.png';
import type { PlayerCharacter } from './PlayerCharacter';

const TEXTURE_KEY = 'tinkerer-companion-art';
const COMPANION_WIDTH = 34;
const FOLLOW_GAP = 12;
const JUMP_DELAY_SECONDS = 0.1;
const JUMP_DURATION_SECONDS = 0.6;
const JUMP_HEIGHT = 64;
const LAND_POSE_SECONDS = 0.12;
const HOP_EXTEND_SECONDS = 0.1;
const IDLE_SWAY_SECONDS = 0.55;
const SCUTTLE_PIXELS_PER_POSE = 7;
const SCUTTLE_MIN_SPEED = 12;
type Pose = keyof typeof atlasData.frames;

/** Decorative companion that follows the Tinkerer and delays its hop. */
export class TinkererCompanion {
  private readonly visualObject: Phaser.GameObjects.Image;
  private pendingJumpDelaySeconds: number | null = null;
  private jumpElapsedSeconds: number | null = null;
  private lastJumpSignal = false;
  private leaderJumpSequence = false;
  private landingSeconds = 0;
  private idleSeconds = 0;
  private scuttleDistance = 0;
  private scuttling = false;
  private baseY: number;

  public static preload(scene: Phaser.Scene): void {
    scene.load.atlas(TEXTURE_KEY, atlasImage, atlasData);
  }

  public constructor(
    scene: Phaser.Scene,
    private readonly tinkerer: PlayerCharacter,
  ) {
    this.baseY = this.getAlignedGroundY(tinkerer.visualObject.y);
    scene.textures
      .get(TEXTURE_KEY)
      .setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.visualObject = scene.add
      .image(tinkerer.visualObject.x, this.baseY, TEXTURE_KEY, 'idle')
      .setOrigin(24 / 48, 46 / 56)
      .setDepth(6);
  }

  public prepareSimulationStep(deltaSeconds: number): void {
    this.landingSeconds = Math.max(0, this.landingSeconds - deltaSeconds);
    const jumped = this.tinkerer.didJumpThisStep();
    if (jumped && !this.lastJumpSignal) {
      this.pendingJumpDelaySeconds = JUMP_DELAY_SECONDS;
      this.leaderJumpSequence = true;
      this.baseY = this.getAlignedGroundY(this.tinkerer.visualObject.y);
    }
    this.lastJumpSignal = jumped;

    if (this.pendingJumpDelaySeconds !== null) {
      this.pendingJumpDelaySeconds -= deltaSeconds;
      if (this.pendingJumpDelaySeconds <= 0) {
        this.pendingJumpDelaySeconds = null;
        this.jumpElapsedSeconds = 0;
      }
    }

    if (this.jumpElapsedSeconds !== null) {
      this.jumpElapsedSeconds += deltaSeconds;
      if (this.jumpElapsedSeconds >= JUMP_DURATION_SECONDS) {
        this.jumpElapsedSeconds = null;
        this.landingSeconds = LAND_POSE_SECONDS;
      }
    }
  }

  public completeSimulationStep(deltaSeconds: number): void {
    const { position, velocity, contacts } = this.tinkerer.getDebugState();
    if (this.leaderJumpSequence && contacts.grounded) {
      this.leaderJumpSequence = false;
      this.baseY = this.getAlignedGroundY(position.y);
    }

    const speed = Math.abs(velocity.x);
    const feetDown =
      this.jumpElapsedSeconds === null && this.landingSeconds === 0;
    this.scuttling = feetDown && speed > SCUTTLE_MIN_SPEED;
    if (this.scuttling) {
      this.scuttleDistance =
        (this.scuttleDistance + speed * deltaSeconds) %
        (2 * SCUTTLE_PIXELS_PER_POSE);
      this.idleSeconds = 0;
    } else {
      this.scuttleDistance = 0;
      this.idleSeconds = feetDown
        ? (this.idleSeconds + deltaSeconds) % (2 * IDLE_SWAY_SECONDS)
        : 0;
    }
  }

  public render(): void {
    const leader = this.tinkerer.visualObject;
    const facingDirection = this.tinkerer.getFacingDirection();
    if (this.tinkerer.getContacts().grounded) {
      this.leaderJumpSequence = false;
    }
    if (!this.leaderJumpSequence) {
      this.baseY = this.getAlignedGroundY(leader.y);
    }
    const jumpProgress =
      this.jumpElapsedSeconds === null
        ? 0
        : Math.min(this.jumpElapsedSeconds / JUMP_DURATION_SECONDS, 1);
    const jumpOffset = Math.sin(Math.PI * jumpProgress) * JUMP_HEIGHT;
    const horizontalOffset =
      leader.width / 2 + FOLLOW_GAP + COMPANION_WIDTH / 2;

    const pose = this.getPose();
    if (this.visualObject.frame.name !== pose) {
      this.visualObject.setFrame(pose);
    }
    this.visualObject
      .setFlipX(facingDirection < 0)
      .setPosition(
        leader.x - facingDirection * horizontalOffset,
        this.baseY - jumpOffset,
      );
  }

  public reset(): void {
    this.pendingJumpDelaySeconds = null;
    this.jumpElapsedSeconds = null;
    this.lastJumpSignal = false;
    this.leaderJumpSequence = false;
    this.landingSeconds = 0;
    this.idleSeconds = 0;
    this.scuttleDistance = 0;
    this.scuttling = false;
    this.baseY = this.getAlignedGroundY(this.tinkerer.visualObject.y);
  }

  private getPose(): Pose {
    if (this.jumpElapsedSeconds !== null) {
      const extendingLegs =
        this.jumpElapsedSeconds < HOP_EXTEND_SECONDS ||
        this.jumpElapsedSeconds > JUMP_DURATION_SECONDS - HOP_EXTEND_SECONDS;
      return extendingLegs ? 'hop_push' : 'hop_tuck';
    }
    if (this.landingSeconds > 0) return 'land';
    if (this.scuttling) {
      // The neutral leg position doubles as the passing pose.
      return this.scuttleDistance < SCUTTLE_PIXELS_PER_POSE
        ? 'scuttle'
        : 'idle';
    }
    return this.idleSeconds < IDLE_SWAY_SECONDS ? 'idle' : 'idle_sway';
  }

  private getAlignedGroundY(leaderY: number): number {
    return leaderY + this.tinkerer.visualObject.height / 2;
  }
}
