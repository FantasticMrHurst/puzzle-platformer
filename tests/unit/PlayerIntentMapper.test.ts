import { describe, expect, it } from 'vitest';

import { PlayerIntentMapper } from '../../src/input/PlayerIntentMapper';

describe('PlayerIntentMapper', () => {
  it('normalizes opposing horizontal input', () => {
    const mapper = new PlayerIntentMapper();

    expect(
      mapper.map({ moveLeft: true, moveRight: false, jump: false }).moveX,
    ).toBe(-1);
    expect(
      mapper.map({ moveLeft: false, moveRight: true, jump: false }).moveX,
    ).toBe(1);
    expect(
      mapper.map({ moveLeft: true, moveRight: true, jump: false }).moveX,
    ).toBe(0);
  });

  it('emits jump edges once while preserving held state', () => {
    const mapper = new PlayerIntentMapper();
    const neutral = { moveLeft: false, moveRight: false };

    expect(mapper.map({ ...neutral, jump: true })).toMatchObject({
      jumpPressed: true,
      jumpHeld: true,
      jumpReleased: false,
    });
    expect(mapper.map({ ...neutral, jump: true })).toMatchObject({
      jumpPressed: false,
      jumpHeld: true,
      jumpReleased: false,
    });
    expect(mapper.map({ ...neutral, jump: false })).toMatchObject({
      jumpPressed: false,
      jumpHeld: false,
      jumpReleased: true,
    });
  });
});
