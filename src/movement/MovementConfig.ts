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
  /** Multiplier applied to upward velocity when jump is released early. */
  readonly jumpCutMultiplier: number;
  /** Grace period after leaving ground, in seconds. */
  readonly coyoteTimeSeconds: number;
  /** Time a jump press remains queued, in seconds. */
  readonly jumpBufferSeconds: number;
}

export const DEFAULT_MOVEMENT_CONFIG: MovementConfig = {
  maxRunSpeed: 320,
  groundAcceleration: 2_400,
  groundDeceleration: 3_000,
  airAcceleration: 900,
  airDeceleration: 250,
  jumpSpeed: 650,
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
  requireNonNegative(config.coyoteTimeSeconds, 'coyoteTimeSeconds');
  requireNonNegative(config.jumpBufferSeconds, 'jumpBufferSeconds');

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
