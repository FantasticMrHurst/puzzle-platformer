import type Phaser from 'phaser';

import type { PlayerCharacter } from './PlayerCharacter';

const COMPANION_WIDTH = 16;
const COMPANION_HEIGHT = 24;
const FOLLOW_GAP = 12;
const JUMP_DELAY_SECONDS = 0.1;
const JUMP_DURATION_SECONDS = 0.6;
const JUMP_HEIGHT = 64;

/** Decorative prototype companion that follows the Tinkerer and delays its hop. */
export class TinkererCompanion {
  private readonly visualObject: Phaser.GameObjects.Rectangle;
  private pendingJumpDelaySeconds: number | null = null;
  private jumpElapsedSeconds: number | null = null;
  private lastJumpSignal = false;
  private leaderJumpSequence = false;
  private baseY: number;

  public constructor(
    scene: Phaser.Scene,
    private readonly tinkerer: PlayerCharacter,
  ) {
    this.baseY = this.getAlignedGroundY(tinkerer.visualObject.y);
    this.visualObject = scene.add
      .rectangle(
        tinkerer.visualObject.x,
        tinkerer.visualObject.y,
        COMPANION_WIDTH,
        COMPANION_HEIGHT,
        0xfacc15,
      )
      .setStrokeStyle(2, 0xfef3c7)
      .setDepth(6);
  }

  public prepareSimulationStep(deltaSeconds: number): void {
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
      }
    }
  }

  public completeSimulationStep(): void {
    if (this.leaderJumpSequence && this.tinkerer.getContacts().grounded) {
      this.leaderJumpSequence = false;
      this.baseY = this.getAlignedGroundY(
        this.tinkerer.getDebugState().position.y,
      );
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

    this.visualObject.setPosition(
      leader.x - facingDirection * horizontalOffset,
      this.baseY - jumpOffset,
    );
  }

  public reset(): void {
    this.pendingJumpDelaySeconds = null;
    this.jumpElapsedSeconds = null;
    this.lastJumpSignal = false;
    this.leaderJumpSequence = false;
    this.baseY = this.getAlignedGroundY(this.tinkerer.visualObject.y);
  }

  private getAlignedGroundY(leaderY: number): number {
    return (
      leaderY +
      (this.tinkerer.visualObject.height - COMPANION_HEIGHT) / 2
    );
  }

}
