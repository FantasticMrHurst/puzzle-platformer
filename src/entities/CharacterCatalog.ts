import type { CharacterArchetype } from '../levels/LevelSchema';
import {
  DEFAULT_MOVEMENT_CONFIG,
  type MovementConfig,
} from '../movement/MovementConfig';
import type { CharacterArtId } from '../rendering/CharacterArt';

export type CharacterAbility =
  | 'break-barrier'
  | 'deploy-rope'
  | 'route-power'
  | 'reconfigure-machine'
  | 'prototype-brace';

export const CREW_ARCHETYPES = ['pilot', 'brute', 'tinkerer'] as const;

export interface CharacterDefinition {
  readonly archetype: CharacterArchetype;
  readonly label: string;
  readonly width: number;
  readonly height: number;
  readonly fillColor: number;
  readonly strokeColor: number;
  readonly movementProfileName: string;
  readonly movementConfig: MovementConfig;
  readonly abilities: readonly CharacterAbility[];
  readonly art?: CharacterArtId;
}

const BASELINE_WIDTH = 48;
const BASELINE_HEIGHT = 72;

const CHARACTER_CATALOG: Readonly<
  Record<CharacterArchetype, CharacterDefinition>
> = {
  brute: {
    ...createBaselineDefinition('brute', 'BRUTE', 0xf97316, 0xffedd5),
    abilities: ['break-barrier', 'prototype-brace'],
    art: 'brute',
    movementProfileName: 'brute-prototype-v1',
    movementConfig: {
      ...DEFAULT_MOVEMENT_CONFIG,
      maxRunSpeed: 300,
      groundAcceleration: 1_800,
      groundDeceleration: 2_300,
      airAcceleration: 650,
      airDeceleration: 200,
      jumpSpeed: 680,
    },
  },
  pilot: {
    ...createBaselineDefinition('pilot', 'PILOT', 0x22c55e, 0xdcfce7),
    abilities: ['deploy-rope'],
    art: 'pilot',
    width: 44,
    height: 68,
    movementProfileName: 'pilot-prototype-v2',
    movementConfig: {
      ...DEFAULT_MOVEMENT_CONFIG,
      maxRunSpeed: 340,
      airAcceleration: 1_050,
      jumpSpeed: 860,
      wallMovement: {
        slideMaxFallSpeed: 110,
        clingSpeed: 30,
        jumpHorizontalSpeed: 420,
        jumpVerticalSpeed: 850,
        jumpControlLockSeconds: 0.14,
        contactGraceSeconds: 0.18,
      },
    },
  },
  tinkerer: {
    ...createBaselineDefinition('tinkerer', 'TINKERER', 0x3b82f6, 0xdbeafe),
    abilities: ['route-power', 'reconfigure-machine'],
    movementProfileName: 'tinkerer-heavy-v1',
    movementConfig: {
      ...DEFAULT_MOVEMENT_CONFIG,
      jumpSpeed: 640,
    },
  },
  ranger: createBaselineDefinition('ranger', 'RANGER', 0x84cc16, 0xecfccb),
  pet: {
    ...createBaselineDefinition('pet', 'PET', 0xa855f7, 0xf3e8ff),
    width: 48,
    height: 36,
    movementProfileName: 'pet-prototype-v2',
    movementConfig: {
      ...DEFAULT_MOVEMENT_CONFIG,
      maxRunSpeed: 350,
      groundAcceleration: 2_600,
      jumpSpeed: 650,
    },
  },
  gardener: createBaselineDefinition(
    'gardener',
    'GARDENER',
    0x14b8a6,
    0xccfbf1,
  ),
};

export function getCharacterDefinition(
  archetype: CharacterArchetype,
): CharacterDefinition {
  return CHARACTER_CATALOG[archetype];
}

function createBaselineDefinition(
  archetype: CharacterArchetype,
  label: string,
  fillColor: number,
  strokeColor: number,
): CharacterDefinition {
  return {
    archetype,
    label,
    width: BASELINE_WIDTH,
    height: BASELINE_HEIGHT,
    fillColor,
    strokeColor,
    movementProfileName: 'baseline-v2',
    movementConfig: DEFAULT_MOVEMENT_CONFIG,
    abilities: [],
  };
}
