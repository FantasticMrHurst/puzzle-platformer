import { describe, expect, it } from 'vitest';

import { GAME_TITLE, PROTOTYPE_PHASE } from '../../src/game/appMetadata';

describe('application metadata', () => {
  it('describes the current prototype without requiring a browser', () => {
    expect(GAME_TITLE).toBe('Puzzle Platformer');
    expect(PROTOTYPE_PHASE).toBe('Movement prototype foundation');
  });
});
