import { describe, expect, it } from 'vitest';

import { interpolatePosition } from '../../src/rendering/interpolatePosition';

describe('interpolatePosition', () => {
  it('returns a position between authoritative simulation states', () => {
    expect(
      interpolatePosition({ x: 10, y: 20 }, { x: 30, y: 60 }, 0.25),
    ).toEqual({ x: 15, y: 30 });
  });

  it('clamps alpha without modifying either authoritative position', () => {
    const previous = { x: 10, y: 20 };
    const current = { x: 30, y: 60 };

    expect(interpolatePosition(previous, current, -1)).toEqual(previous);
    expect(interpolatePosition(previous, current, 2)).toEqual(current);
    expect(previous).toEqual({ x: 10, y: 20 });
    expect(current).toEqual({ x: 30, y: 60 });
  });
});
