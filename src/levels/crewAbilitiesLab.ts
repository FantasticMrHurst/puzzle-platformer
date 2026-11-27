import type { PushableBlockData } from './LevelSchema';

export const CREW_ABILITIES_LAB_ID = 'crew-abilities-lab';

export const CREW_ABILITIES_LAYOUT = {
  rope: { x: 474, top: 240, bottom: 600, landingX: 566 },
  barrier: { x: 800, y: 240, width: 84, height: 26 },
  counterweight: {
    id: 'lift-counterweight',
    x: 800,
    y: 185,
    width: 64,
    height: 55,
    requiredArchetype: 'brute',
    channel: 'floor-broken',
    maxPushX: 1130,
    pushSpeed: 300,
  } satisfies PushableBlockData,
  lift: { x: 1550, width: 270, stops: [600, 418, 240] as const, callX: 1508 },
};
