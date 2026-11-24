import { describe, expect, it } from 'vitest';

import { getCharacterDefinition } from '../../src/entities/CharacterCatalog';

describe('CharacterCatalog', () => {
  it('keeps the Brute on the approved shared baseline', () => {
    const brute = getCharacterDefinition('brute');

    expect(brute.movementProfileName).toBe('baseline-v2');
    expect(brute.movementConfig.wallMovement).toBeUndefined();
  });

  it('gives the Scout a distinct wall-traversal profile', () => {
    const scout = getCharacterDefinition('scout');

    expect(scout.movementProfileName).toBe('scout-prototype-v2');
    expect(scout.movementConfig.jumpSpeed).toBeGreaterThan(
      getCharacterDefinition('brute').movementConfig.jumpSpeed,
    );
    expect(scout.movementConfig.wallMovement).toBeDefined();
  });

  it('gives the Pet a half-height body and distinct profile', () => {
    const pet = getCharacterDefinition('pet');
    const brute = getCharacterDefinition('brute');

    expect(pet.movementProfileName).toBe('pet-prototype-v2');
    expect(pet.height).toBe(brute.height / 2);
  });
});
