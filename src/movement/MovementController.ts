import type { PlayerIntent } from '../input/PlayerIntent';
import { validateMovementConfig, type MovementConfig } from './MovementConfig';
import {
  createInitialMovementState,
  type MovementMode,
  type MovementState,
} from './MovementState';

export interface MovementContacts {
  readonly grounded: boolean;
  readonly touchingCeiling: boolean;
  /** -1 for a wall on the left, 1 for a wall on the right, or 0 for neither. */
  readonly wallDirection: -1 | 0 | 1;
}

export interface MovementVelocity {
  readonly x: number;
  readonly y: number;
}

export interface MovementFrame {
  readonly deltaSeconds: number;
  readonly intent: PlayerIntent;
  readonly contacts: MovementContacts;
  readonly velocity: MovementVelocity;
}

export interface MovementResult {
  readonly velocity: MovementVelocity;
  readonly state: MovementState;
  /** True only on the simulation step that consumes a buffered jump. */
  readonly jumped: boolean;
}

export class MovementController {
  private state: MovementState = createInitialMovementState();

  public constructor(private config: MovementConfig) {
    validateMovementConfig(config);
  }

  public setConfig(config: MovementConfig): void {
    validateMovementConfig(config);
    this.config = config;
  }

  public update(frame: MovementFrame): MovementResult {
    validateFrame(frame);

    const { deltaSeconds, contacts, intent } = frame;
    const moveX = clamp(intent.moveX, -1, 1);
    const horizontalAcceleration = contacts.grounded
      ? this.config.groundAcceleration
      : this.config.airAcceleration;
    const horizontalDeceleration = contacts.grounded
      ? this.config.groundDeceleration
      : this.config.airDeceleration;
    const targetVelocityX = moveX * this.config.maxRunSpeed;
    let wallJumpControlLockRemainingSeconds = contacts.grounded
      ? 0
      : tickTimer(this.state.wallJumpControlLockRemainingSeconds, deltaSeconds);
    const wallJumpControlLocked = wallJumpControlLockRemainingSeconds > 0;
    let velocityX = wallJumpControlLocked
      ? frame.velocity.x
      : moveTowards(
          frame.velocity.x,
          targetVelocityX,
          (moveX === 0 ? horizontalDeceleration : horizontalAcceleration) *
            deltaSeconds,
        );

    let coyoteTimeRemainingSeconds = contacts.grounded
      ? this.config.coyoteTimeSeconds
      : tickTimer(this.state.coyoteTimeRemainingSeconds, deltaSeconds);
    let jumpBufferRemainingSeconds = intent.jumpPressed
      ? this.config.jumpBufferSeconds
      : tickTimer(this.state.jumpBufferRemainingSeconds, deltaSeconds);
    let wallContactGraceRemainingSeconds = 0;
    let lastWallDirection: -1 | 0 | 1 = 0;
    if (this.config.wallMovement !== undefined && !contacts.grounded) {
      if (contacts.wallDirection !== 0) {
        wallContactGraceRemainingSeconds =
          this.config.wallMovement.contactGraceSeconds;
        lastWallDirection = contacts.wallDirection;
      } else {
        wallContactGraceRemainingSeconds = tickTimer(
          this.state.wallContactGraceRemainingSeconds,
          deltaSeconds,
        );
        lastWallDirection =
          wallContactGraceRemainingSeconds > 0
            ? this.state.lastWallDirection
            : 0;
      }
    }
    let velocityY = frame.velocity.y;
    let jumped = false;

    const canUseGroundJump =
      contacts.grounded || coyoteTimeRemainingSeconds > 0;
    const wantsToJump = intent.jumpPressed || jumpBufferRemainingSeconds > 0;
    const effectiveWallDirection =
      contacts.wallDirection !== 0 ? contacts.wallDirection : lastWallDirection;
    const hasWallJumpContact =
      !wallJumpControlLocked &&
      (contacts.wallDirection !== 0 || wallContactGraceRemainingSeconds > 0);
    const canUseWallJump =
      this.config.wallMovement !== undefined &&
      !contacts.grounded &&
      hasWallJumpContact;
    if (wantsToJump && canUseGroundJump) {
      velocityY = -this.config.jumpSpeed;
      jumpBufferRemainingSeconds = 0;
      coyoteTimeRemainingSeconds = 0;
      jumped = true;
    } else if (wantsToJump && canUseWallJump) {
      velocityX =
        -effectiveWallDirection * this.config.wallMovement!.jumpHorizontalSpeed;
      velocityY = -this.config.wallMovement!.jumpVerticalSpeed;
      wallJumpControlLockRemainingSeconds =
        this.config.wallMovement!.jumpControlLockSeconds;
      jumpBufferRemainingSeconds = 0;
      coyoteTimeRemainingSeconds = 0;
      wallContactGraceRemainingSeconds = 0;
      lastWallDirection = 0;
      jumped = true;
    } else if (intent.jumpReleased && velocityY < 0) {
      velocityY *= this.config.jumpCutMultiplier;
    }

    const wallSliding =
      this.config.wallMovement !== undefined &&
      !contacts.grounded &&
      hasWallJumpContact &&
      velocityY > 0 &&
      !jumped;
    if (wallSliding) {
      velocityY = Math.min(
        velocityY,
        this.config.wallMovement!.slideMaxFallSpeed,
      );
    }

    const wallClinging =
      this.config.wallMovement !== undefined &&
      !contacts.grounded &&
      hasWallJumpContact &&
      effectiveWallDirection !== 0 &&
      !jumped;
    if (wallClinging) {
      const intentionallyLeavingWall =
        moveX !== 0 && Math.sign(moveX) === -effectiveWallDirection;
      if (!intentionallyLeavingWall) {
        velocityX =
          effectiveWallDirection * this.config.wallMovement!.clingSpeed;
      }
    }

    const mode = resolveMovementMode(
      contacts.grounded,
      velocityY,
      jumped,
      wallSliding,
    );
    this.state = {
      coyoteTimeRemainingSeconds,
      jumpBufferRemainingSeconds,
      wallJumpControlLockRemainingSeconds,
      wallContactGraceRemainingSeconds,
      lastWallDirection,
      mode,
    };

    return {
      velocity: { x: velocityX, y: velocityY },
      state: this.state,
      jumped,
    };
  }

  public getState(): MovementState {
    return { ...this.state };
  }

  public reset(): void {
    this.state = createInitialMovementState();
  }
}

function resolveMovementMode(
  grounded: boolean,
  velocityY: number,
  jumped: boolean,
  wallSliding: boolean,
): MovementMode {
  if (grounded && !jumped) {
    return 'grounded';
  }

  if (wallSliding) {
    return 'wall-sliding';
  }

  return velocityY < 0 ? 'rising' : 'falling';
}

function tickTimer(remainingSeconds: number, deltaSeconds: number): number {
  return Math.max(0, remainingSeconds - deltaSeconds);
}

function moveTowards(
  current: number,
  target: number,
  maxDelta: number,
): number {
  if (Math.abs(target - current) <= maxDelta) {
    return target;
  }

  return current + Math.sign(target - current) * maxDelta;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function validateFrame(frame: MovementFrame): void {
  if (!Number.isFinite(frame.deltaSeconds) || frame.deltaSeconds <= 0) {
    throw new RangeError('deltaSeconds must be a finite number greater than 0');
  }

  if (!Number.isFinite(frame.intent.moveX)) {
    throw new RangeError('intent.moveX must be finite');
  }

  if (
    !Number.isFinite(frame.velocity.x) ||
    !Number.isFinite(frame.velocity.y)
  ) {
    throw new RangeError('velocity components must be finite');
  }
}
