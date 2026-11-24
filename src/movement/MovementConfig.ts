export interface MovementConfig {
  /** Maximum horizontal speed in pixels per second. */
  readonly maxRunSpeed: number;
  /** Horizontal speed gained per second while grounded. */
  readonly groundAcceleration: number;
  /** Horizontal speed lost per second without directional input on the ground. */
  readonly groundDeceleration: number;
  /** Horizontal speed gained per second while airborne. */
  readonly airAcceleration: number;
  /** Horizontal speed lost per second without directional input in the air. */
  readonly airDeceleration: number;
  /** Initial upward jump speed in pixels per second. */
  readonly jumpSpeed: number;
  /** Maximum downward speed in pixels per second. */
  readonly maxFallSpeed: number;
  /** Multiplier applied to upward velocity when jump is released early. */
  readonly jumpCutMultiplier: number;
  /** Grace period after leaving ground, in seconds. */
  readonly coyoteTimeSeconds: number;
  /** Time a jump press remains queued, in seconds. */
  readonly jumpBufferSeconds: number;
  /** Optional advanced wall traversal. Omit to preserve baseline behavior. */
  readonly wallMovement?: WallMovementConfig;
}

export interface WallMovementConfig {
  /** Maximum downward speed while touching a wall in pixels per second. */
  readonly slideMaxFallSpeed: number;
  /** Small inward speed that preserves airborne contact with a wall. */
  readonly clingSpeed: number;
  /** Horizontal speed applied away from the contacted wall. */
  readonly jumpHorizontalSpeed: number;
  /** Upward speed applied by a wall jump. */
  readonly jumpVerticalSpeed: number;
  /** Time after a wall jump before horizontal air steering resumes. */
  readonly jumpControlLockSeconds: number;
  /** Time after leaving a wall during which a wall jump remains valid. */
  readonly contactGraceSeconds: number;
}

export const DEFAULT_MOVEMENT_CONFIG: MovementConfig = {
  maxRunSpeed: 320,
  groundAcceleration: 2_400,
  groundDeceleration: 3_000,
  airAcceleration: 900,
  airDeceleration: 250,
  jumpSpeed: 810,
  maxFallSpeed: 1_200,
  jumpCutMultiplier: 0.45,
  coyoteTimeSeconds: 0.1,
  jumpBufferSeconds: 0.12,
};

export function validateMovementConfig(config: MovementConfig): void {
  requirePositive(config.maxRunSpeed, 'maxRunSpeed');
  requirePositive(config.groundAcceleration, 'groundAcceleration');
  requirePositive(config.groundDeceleration, 'groundDeceleration');
  requirePositive(config.airAcceleration, 'airAcceleration');
  requireNonNegative(config.airDeceleration, 'airDeceleration');
  requirePositive(config.jumpSpeed, 'jumpSpeed');
  requirePositive(config.maxFallSpeed, 'maxFallSpeed');
  requireNonNegative(config.coyoteTimeSeconds, 'coyoteTimeSeconds');
  requireNonNegative(config.jumpBufferSeconds, 'jumpBufferSeconds');

  if (config.wallMovement !== undefined) {
    requirePositiveWallValue(
      config.wallMovement.slideMaxFallSpeed,
      'slideMaxFallSpeed',
    );
    requirePositiveWallValue(config.wallMovement.clingSpeed, 'clingSpeed');
    requirePositiveWallValue(
      config.wallMovement.jumpHorizontalSpeed,
      'jumpHorizontalSpeed',
    );
    requirePositiveWallValue(
      config.wallMovement.jumpVerticalSpeed,
      'jumpVerticalSpeed',
    );
    requireNonNegativeWallValue(
      config.wallMovement.jumpControlLockSeconds,
      'jumpControlLockSeconds',
    );
    requireNonNegativeWallValue(
      config.wallMovement.contactGraceSeconds,
      'contactGraceSeconds',
    );
  }

  if (
    !Number.isFinite(config.jumpCutMultiplier) ||
    config.jumpCutMultiplier <= 0 ||
    config.jumpCutMultiplier >= 1
  ) {
    throw new RangeError(
      'jumpCutMultiplier must be greater than 0 and less than 1',
    );
  }
}

function requireNonNegativeWallValue(
  value: number,
  name: keyof WallMovementConfig,
): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(
      `${name} must be a finite number greater than or equal to 0`,
    );
  }
}

function requirePositiveWallValue(
  value: number,
  name: keyof WallMovementConfig,
): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite number greater than 0`);
  }
}

function requirePositive(value: number, name: keyof MovementConfig): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite number greater than 0`);
  }
}

function requireNonNegative(value: number, name: keyof MovementConfig): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(
      `${name} must be a finite number greater than or equal to 0`,
    );
  }
}
