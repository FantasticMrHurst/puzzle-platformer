import { beforeEach, describe, expect, it } from 'vitest';

import { NEUTRAL_PLAYER_INTENT } from '../../src/input/PlayerIntent';
import { MovementController } from '../../src/movement/MovementController';
import { DEFAULT_MOVEMENT_CONFIG } from '../../src/movement/MovementConfig';

const STEP_SECONDS = 1 / 60;
const GROUNDED = {
  grounded: true,
  touchingCeiling: false,
  wallDirection: 0 as const,
};
const AIRBORNE = { ...GROUNDED, grounded: false };

describe('MovementController', () => {
  let controller: MovementController;

  beforeEach(() => {
    controller = new MovementController(DEFAULT_MOVEMENT_CONFIG);
  });

  it('accelerates to but not beyond maximum run speed', () => {
    let velocity = { x: 0, y: 0 };
    const intent = { ...NEUTRAL_PLAYER_INTENT, moveX: 1 };

    for (let index = 0; index < 120; index += 1) {
      velocity = controller.update({
        deltaSeconds: STEP_SECONDS,
        intent,
        contacts: GROUNDED,
        velocity,
      }).velocity;
    }

    expect(velocity.x).toBe(DEFAULT_MOVEMENT_CONFIG.maxRunSpeed);
  });

  it('brakes and reverses direction without overshooting its target', () => {
    const stopped = controller.update({
      deltaSeconds: 0.1,
      intent: NEUTRAL_PLAYER_INTENT,
      contacts: GROUNDED,
      velocity: { x: 200, y: 0 },
    });
    const reversed = controller.update({
      deltaSeconds: 0.2,
      intent: { ...NEUTRAL_PLAYER_INTENT, moveX: -1 },
      contacts: GROUNDED,
      velocity: stopped.velocity,
    });

    expect(stopped.velocity.x).toBe(0);
    expect(reversed.velocity.x).toBe(-320);
  });

  it('applies less horizontal acceleration in the air', () => {
    const intent = { ...NEUTRAL_PLAYER_INTENT, moveX: 1 };
    const groundedResult = controller.update({
      deltaSeconds: 0.1,
      intent,
      contacts: GROUNDED,
      velocity: { x: 0, y: 0 },
    });
    controller.reset();
    const airborneResult = controller.update({
      deltaSeconds: 0.1,
      intent,
      contacts: AIRBORNE,
      velocity: { x: 0, y: 100 },
    });

    expect(groundedResult.velocity.x).toBe(240);
    expect(airborneResult.velocity.x).toBe(90);
  });

  it('allows a jump during the coyote window and rejects it at expiry', () => {
    controller.update({
      deltaSeconds: STEP_SECONDS,
      intent: NEUTRAL_PLAYER_INTENT,
      contacts: GROUNDED,
      velocity: { x: 0, y: 0 },
    });
    const coyoteJump = controller.update({
      deltaSeconds: 0.09,
      intent: { ...NEUTRAL_PLAYER_INTENT, jumpPressed: true, jumpHeld: true },
      contacts: AIRBORNE,
      velocity: { x: 0, y: 40 },
    });

    expect(coyoteJump.jumped).toBe(true);
    expect(coyoteJump.velocity.y).toBe(-DEFAULT_MOVEMENT_CONFIG.jumpSpeed);

    controller.reset();
    controller.update({
      deltaSeconds: STEP_SECONDS,
      intent: NEUTRAL_PLAYER_INTENT,
      contacts: GROUNDED,
      velocity: { x: 0, y: 0 },
    });
    controller.update({
      deltaSeconds: DEFAULT_MOVEMENT_CONFIG.coyoteTimeSeconds,
      intent: NEUTRAL_PLAYER_INTENT,
      contacts: AIRBORNE,
      velocity: { x: 0, y: 40 },
    });
    const expiredJump = controller.update({
      deltaSeconds: STEP_SECONDS,
      intent: { ...NEUTRAL_PLAYER_INTENT, jumpPressed: true, jumpHeld: true },
      contacts: AIRBORNE,
      velocity: { x: 0, y: 80 },
    });

    expect(expiredJump.jumped).toBe(false);
  });

  it('buffers a jump press shortly before landing', () => {
    const buffered = controller.update({
      deltaSeconds: STEP_SECONDS,
      intent: { ...NEUTRAL_PLAYER_INTENT, jumpPressed: true, jumpHeld: true },
      contacts: AIRBORNE,
      velocity: { x: 0, y: 300 },
    });
    const landing = controller.update({
      deltaSeconds: 0.05,
      intent: { ...NEUTRAL_PLAYER_INTENT, jumpHeld: true },
      contacts: GROUNDED,
      velocity: buffered.velocity,
    });

    expect(buffered.jumped).toBe(false);
    expect(landing.jumped).toBe(true);
    expect(landing.state.jumpBufferRemainingSeconds).toBe(0);
  });

  it('expires a buffered jump at the configured boundary', () => {
    const buffered = controller.update({
      deltaSeconds: STEP_SECONDS,
      intent: { ...NEUTRAL_PLAYER_INTENT, jumpPressed: true, jumpHeld: true },
      contacts: AIRBORNE,
      velocity: { x: 0, y: 300 },
    });
    const landingAtExpiry = controller.update({
      deltaSeconds: DEFAULT_MOVEMENT_CONFIG.jumpBufferSeconds,
      intent: { ...NEUTRAL_PLAYER_INTENT, jumpHeld: true },
      contacts: GROUNDED,
      velocity: buffered.velocity,
    });

    expect(landingAtExpiry.jumped).toBe(false);
    expect(landingAtExpiry.state.jumpBufferRemainingSeconds).toBe(0);
  });

  it('cuts upward velocity when jump is released early', () => {
    const result = controller.update({
      deltaSeconds: STEP_SECONDS,
      intent: { ...NEUTRAL_PLAYER_INTENT, jumpReleased: true },
      contacts: AIRBORNE,
      velocity: { x: 0, y: -600 },
    });

    expect(result.velocity.y).toBe(-270);
    expect(result.state.mode).toBe('rising');
  });

  it('preserves baseline falling behavior when wall movement is disabled', () => {
    const result = controller.update({
      deltaSeconds: STEP_SECONDS,
      intent: { ...NEUTRAL_PLAYER_INTENT, jumpPressed: true },
      contacts: { ...AIRBORNE, wallDirection: 1 },
      velocity: { x: 0, y: 500 },
    });

    expect(result.jumped).toBe(false);
    expect(result.velocity.y).toBe(500);
    expect(result.state.mode).toBe('falling');
  });

  it('clings during a wall slide and jumps away on any jump press', () => {
    const wallConfig = {
      ...DEFAULT_MOVEMENT_CONFIG,
      wallMovement: {
        slideMaxFallSpeed: 110,
        clingSpeed: 30,
        jumpHorizontalSpeed: 420,
        jumpVerticalSpeed: 850,
        jumpControlLockSeconds: 0.14,
        contactGraceSeconds: 0.18,
      },
    };
    const wallController = new MovementController(wallConfig);
    const contacts = { ...AIRBORNE, wallDirection: 1 as const };

    const sliding = wallController.update({
      deltaSeconds: STEP_SECONDS,
      intent: NEUTRAL_PLAYER_INTENT,
      contacts,
      velocity: { x: 0, y: 500 },
    });
    const continuedSlide = wallController.update({
      deltaSeconds: STEP_SECONDS,
      intent: NEUTRAL_PLAYER_INTENT,
      contacts: AIRBORNE,
      velocity: { x: 0, y: 500 },
    });
    const jumping = wallController.update({
      deltaSeconds: STEP_SECONDS,
      intent: {
        ...NEUTRAL_PLAYER_INTENT,
        // Input toward the contacted wall must not block the wall jump.
        moveX: 1,
        jumpPressed: true,
        jumpHeld: true,
      },
      contacts: AIRBORNE,
      velocity: continuedSlide.velocity,
    });

    expect(sliding.velocity.y).toBe(110);
    expect(sliding.velocity.x).toBe(30);
    expect(sliding.state.mode).toBe('wall-sliding');
    expect(continuedSlide.velocity).toEqual({ x: 30, y: 110 });
    expect(continuedSlide.state.mode).toBe('wall-sliding');
    expect(jumping.jumped).toBe(true);
    expect(jumping.velocity).toEqual({ x: -420, y: -850 });
    expect(jumping.state.jumpBufferRemainingSeconds).toBe(0);
    expect(jumping.state.wallJumpControlLockRemainingSeconds).toBe(0.14);

    let steering = wallController.update({
      deltaSeconds: STEP_SECONDS,
      intent: { ...NEUTRAL_PLAYER_INTENT, moveX: 1 },
      // The collision boundary may report the prior wall for one more step.
      contacts,
      velocity: jumping.velocity,
    });
    expect(steering.velocity.x).toBe(-420);

    for (let index = 0; index < 8; index += 1) {
      steering = wallController.update({
        deltaSeconds: STEP_SECONDS,
        intent: { ...NEUTRAL_PLAYER_INTENT, moveX: 1 },
        contacts: AIRBORNE,
        velocity: steering.velocity,
      });
    }

    expect(steering.state.wallJumpControlLockRemainingSeconds).toBe(0);
    expect(steering.velocity.x).toBeGreaterThan(-420);
  });
});
