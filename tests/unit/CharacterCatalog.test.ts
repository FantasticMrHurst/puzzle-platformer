import { describe, expect, it } from 'vitest';

import { getCharacterDefinition } from '../../src/entities/CharacterCatalog';

describe('CharacterCatalog', () => {
  it('gives the Brute a heavier, lower-jumping movement profile', () => {
    const brute = getCharacterDefinition('brute');

    expect(brute.movementProfileName).toBe('brute-prototype-v1');
    expect(brute.movementConfig.maxRunSpeed).toBeLessThan(320);
    expect(brute.movementConfig.groundAcceleration).toBeLessThan(2_400);
    expect(brute.movementConfig.jumpSpeed).toBeLessThan(860);
    expect(brute.movementConfig.wallMovement).toBeUndefined();
  });

  it('gives the Pilot a distinct wall-traversal profile', () => {
    const pilot = getCharacterDefinition('pilot');

    expect(pilot.movementProfileName).toBe('pilot-prototype-v2');
    expect(pilot.movementConfig.jumpSpeed).toBeGreaterThan(
      getCharacterDefinition('brute').movementConfig.jumpSpeed,
    );
    expect(pilot.movementConfig.wallMovement).toBeDefined();
  });

  it('gives the Pet a half-height body and distinct profile', () => {
    const pet = getCharacterDefinition('pet');
    const brute = getCharacterDefinition('brute');

    expect(pet.movementProfileName).toBe('pet-prototype-v2');
    expect(pet.height).toBe(brute.height / 2);
  });
});
