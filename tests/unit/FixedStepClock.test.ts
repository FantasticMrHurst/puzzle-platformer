import { describe, expect, it } from 'vitest';

import {
  FixedStepClock,
  GAMEPLAY_STEP_SECONDS,
  MAX_CATCH_UP_STEPS,
} from '../../src/game/FixedStepClock';

describe('FixedStepClock', () => {
  it.each([30, 60, 120])(
    'produces 60 simulation steps across one second rendered at %i Hz',
    (renderRate) => {
      const clock = new FixedStepClock();
      let simulationSteps = 0;

      for (let frame = 0; frame < renderRate; frame += 1) {
        clock.advance(1 / renderRate, () => {
          simulationSteps += 1;
        });
      }

      expect(simulationSteps).toBe(60);
    },
  );

  it('caps catch-up work after a long stall', () => {
    const clock = new FixedStepClock();
    let simulationSteps = 0;

    const stepsThisFrame = clock.advance(1, () => {
      simulationSteps += 1;
    });

    expect(stepsThisFrame).toBe(MAX_CATCH_UP_STEPS);
    expect(simulationSteps * GAMEPLAY_STEP_SECONDS).toBeCloseTo(5 / 60);
  });

  it('exposes fractional progress for render interpolation', () => {
    const clock = new FixedStepClock();

    clock.advance(GAMEPLAY_STEP_SECONDS / 2, () => {
      throw new Error('A half step must not simulate');
    });

    expect(clock.getInterpolationAlpha()).toBeCloseTo(0.5);
  });
});
