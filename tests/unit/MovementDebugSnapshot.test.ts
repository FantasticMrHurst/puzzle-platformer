import { describe, expect, it } from 'vitest';

import {
  formatMovementDebugSnapshot,
  type MovementDebugSnapshot,
} from '../../src/debug/MovementDebugSnapshot';

const snapshot: MovementDebugSnapshot = {
  position: { x: 160, y: 884 },
  velocity: { x: 240, y: -325 },
  contacts: {
    grounded: false,
    touchingCeiling: false,
    wallDirection: 1,
  },
  intent: {
    moveX: 1,
    jumpPressed: true,
    jumpHeld: true,
    jumpReleased: false,
  },
  movementState: {
    mode: 'rising',
    coyoteTimeRemainingSeconds: 0.083,
    jumpBufferRemainingSeconds: 0,
  },
  timing: {
    fixedStepHz: 60,
    stepsThisFrame: 1,
    totalSimulationSteps: 42,
    totalRenderedFrames: 43,
    renderedFramesPerSecond: 59.94,
  },
  profileName: 'baseline-v1',
};

describe('formatMovementDebugSnapshot', () => {
  it('formats movement state without owning or changing that state', () => {
    const before = structuredClone(snapshot);
    const formatted = formatMovementDebugSnapshot(snapshot);

    expect(formatted).toContain('MOVEMENT DEBUG · baseline-v1');
    expect(formatted).toContain('velocity 240.0, -325.0');
    expect(formatted).toContain('ground:N ceiling:N wall:1');
    expect(formatted).toContain('pressed:Y held:Y released:N');
    expect(formatted).toContain('60 Hz · 1 step/frame · 59.9 fps');
    expect(snapshot).toEqual(before);
  });
});
