import { describe, expect, it } from 'vitest';

import { calculateExitProgress } from '../../src/environment/ExitProgress';
import type { ExitData } from '../../src/levels/LevelSchema';

const exit: ExitData = {
  id: 'exit',
  x: 100,
  y: 200,
  width: 80,
  height: 120,
};

describe('calculateExitProgress', () => {
  it('completes only when every participant is inside the exit', () => {
    const participants = [
      { id: 'brute', position: { x: 120, y: 240 } },
      { id: 'pilot', position: { x: 170, y: 300 } },
      { id: 'tinkerer', position: { x: 90, y: 240 } },
    ];

    expect(calculateExitProgress(exit, participants)).toEqual({
      arrivedIds: ['brute', 'pilot'],
      arrivedCount: 2,
      requiredCount: 3,
      complete: false,
    });

    expect(
      calculateExitProgress(exit, [
        ...participants.slice(0, 2),
        { id: 'tinkerer', position: { x: 150, y: 260 } },
      ]).complete,
    ).toBe(true);
  });

  it('treats exit boundaries as inside and an empty roster as incomplete', () => {
    expect(
      calculateExitProgress(exit, [
        { id: 'edge', position: { x: 180, y: 320 } },
      ]).complete,
    ).toBe(true);
    expect(calculateExitProgress(exit, []).complete).toBe(false);
  });
});
