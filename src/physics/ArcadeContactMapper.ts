import type { MovementContacts } from '../movement/MovementController';

export interface DirectionalCollisionFlags {
  readonly left: boolean;
  readonly right: boolean;
  readonly up: boolean;
  readonly down: boolean;
}

export function mapArcadeContacts(
  blocked: DirectionalCollisionFlags,
  touching: DirectionalCollisionFlags,
): MovementContacts {
  const left = blocked.left || touching.left;
  const right = blocked.right || touching.right;

  return {
    grounded: blocked.down || touching.down,
    touchingCeiling: blocked.up || touching.up,
    wallDirection: left === right ? 0 : left ? -1 : 1,
  };
}
