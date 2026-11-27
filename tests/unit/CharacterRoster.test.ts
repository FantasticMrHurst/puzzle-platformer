import { describe, expect, it } from 'vitest';

import { CharacterRoster } from '../../src/entities/CharacterRoster';

const members = [{ id: 'brute' }, { id: 'pilot' }, { id: 'tinkerer' }];

describe('CharacterRoster', () => {
  it('selects valid slots without changing state for invalid or active slots', () => {
    const roster = new CharacterRoster(members);

    expect(roster.getActive().id).toBe('brute');
    expect(roster.selectSlot(1)).toBe(true);
    expect(roster.getActive().id).toBe('pilot');
    expect(roster.selectSlot(1)).toBe(false);
    expect(roster.selectSlot(3)).toBe(false);
    expect(roster.getActive().id).toBe('pilot');
  });

  it('cycles in both directions and wraps around', () => {
    const roster = new CharacterRoster(members);

    expect(roster.cycle(-1)).toBe(true);
    expect(roster.getActive().id).toBe('tinkerer');
    expect(roster.cycle(1)).toBe(true);
    expect(roster.getActive().id).toBe('brute');
  });

  it('rejects invalid roster sizes and duplicate IDs', () => {
    expect(() => new CharacterRoster([])).toThrow(RangeError);
    expect(() => new CharacterRoster([...members, { id: 'ranger' }])).toThrow(
      RangeError,
    );
    expect(() => new CharacterRoster([{ id: 'same' }, { id: 'same' }])).toThrow(
      'Character roster member IDs must be unique',
    );
  });
});
