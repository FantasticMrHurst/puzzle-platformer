import { describe, expect, it } from 'vitest';

import {
  mapArcadeContacts,
  type DirectionalCollisionFlags,
} from '../../src/physics/ArcadeContactMapper';

const NONE: DirectionalCollisionFlags = {
  left: false,
  right: false,
  up: false,
  down: false,
};

describe('mapArcadeContacts', () => {
  it('combines blocked and touching flags into movement contacts', () => {
    expect(
      mapArcadeContacts(
        { ...NONE, down: true, left: true },
        { ...NONE, up: true },
      ),
    ).toEqual({
      grounded: true,
      touchingCeiling: true,
      wallDirection: -1,
    });
  });

  it('reports no wall direction when both sides are touching', () => {
    expect(
      mapArcadeContacts(NONE, { ...NONE, left: true, right: true })
        .wallDirection,
    ).toBe(0);
  });
});
