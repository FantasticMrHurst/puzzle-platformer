import type { PushableBlockData } from './LevelSchema';
import type { PlugOutletOptions } from '../environment/TinkererPlugPuzzle';
import type { PowerSignLayout } from '../rendering/PowerMarkings';

export const CREW_ABILITIES_LAB_ID = 'crew-abilities-lab';

export const CREW_ABILITIES_LAYOUT = {
  camera: { lookAbovePx: 180, verticalDeadzonePx: 48 },
  barrier: { x: 800, y: 240, width: 84, height: 26 },
  counterweight: {
    id: 'lift-counterweight',
    x: 800,
    y: 185,
    width: 64,
    height: 55,
    requiredArchetype: 'brute',
    channel: 'floor-broken',
    maxPushX: 1118,
    pushSpeed: 300,
  } satisfies PushableBlockData,
  lift: { x: 1420, width: 240, stops: [600, 418, 240] as const, callX: 1388 },
  power: {
    plugId: 'lift-supply',
    gateChannel: 'service-access',
    outlets: {
      shape: 'triangle',
      decoys: [
        { position: { x: 2630, y: 955 }, shape: 'square' },
        { position: { x: 2830, y: 955 }, shape: 'circle' },
      ],
    } satisfies PlugOutletOptions,
    signs: [
      { x: 1910, floorY: 980, color: 0x15834d, shape: 'square' },
      { x: 2010, floorY: 980, color: 0x2368bc, shape: 'circle' },
      { x: 2110, floorY: 980, color: 0xc82e3a, shape: 'triangle' },
    ] satisfies readonly PowerSignLayout[],
  },
};
