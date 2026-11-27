import {
  CREW_ARCHETYPES,
  getCharacterDefinition,
} from '../entities/CharacterCatalog';
import { DEFAULT_BREAK_REACH_PX } from '../environment/BreakableBarrier';
import { DEFAULT_CLIMB_SPEED } from '../environment/RopeLadder';
import { DEFAULT_LIFT_SPEED } from '../environment/ServiceLift';
import { CREW_ABILITIES_LAB_ID } from '../levels/crewAbilitiesLab';
import type {
  MovementConfig,
  WallMovementConfig,
} from '../movement/MovementConfig';
import { CHARACTER_ART } from '../rendering/CharacterArt';
import type { PoseTuning } from '../rendering/PoseTuning';

export type CrewMember = (typeof CREW_ARCHETYPES)[number];

interface RoomTuning {
  readonly gravity: number;
  readonly climbSpeed: number;
  readonly breakReach: number;
  readonly liftSpeed: number;
}

export interface CrewTuning {
  readonly version: 1;
  readonly lab: typeof CREW_ABILITIES_LAB_ID;
  readonly movement: Readonly<Record<CrewMember, MovementConfig>>;
  readonly art: Readonly<Partial<Record<CrewMember, PoseTuning>>>;
  readonly room: RoomTuning;
}

type NumberKey<T> = {
  [K in keyof T]-?: T[K] extends number ? K : never;
}[keyof T] &
  string;

export interface NumberField<T> {
  readonly key: NumberKey<T>;
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
}

export const MOVEMENT_FIELDS: readonly NumberField<MovementConfig>[] = [
  { key: 'maxRunSpeed', label: 'Run speed (px/s)', min: 80, max: 560, step: 5 },
  {
    key: 'jumpSpeed',
    label: 'Jump launch (px/s)',
    min: 300,
    max: 1100,
    step: 5,
  },
  {
    key: 'maxFallSpeed',
    label: 'Fall speed cap (px/s)',
    min: 300,
    max: 1700,
    step: 25,
  },
  {
    key: 'groundAcceleration',
    label: 'Ground acceleration (px/s²)',
    min: 100,
    max: 5000,
    step: 50,
  },
  {
    key: 'groundDeceleration',
    label: 'Ground braking (px/s²)',
    min: 100,
    max: 6000,
    step: 50,
  },
  {
    key: 'airAcceleration',
    label: 'Air steering (px/s²)',
    min: 50,
    max: 3000,
    step: 50,
  },
  {
    key: 'airDeceleration',
    label: 'Air braking (px/s²)',
    min: 0,
    max: 3000,
    step: 50,
  },
  {
    key: 'jumpCutMultiplier',
    label: 'Jump release multiplier',
    min: 0.05,
    max: 0.95,
    step: 0.05,
  },
  {
    key: 'coyoteTimeSeconds',
    label: 'Coyote time (s)',
    min: 0,
    max: 0.35,
    step: 0.01,
  },
  {
    key: 'jumpBufferSeconds',
    label: 'Jump buffer (s)',
    min: 0,
    max: 0.35,
    step: 0.01,
  },
];

export const WALL_FIELDS: readonly NumberField<WallMovementConfig>[] = [
  {
    key: 'slideMaxFallSpeed',
    label: 'Wall slide cap (px/s)',
    min: 20,
    max: 400,
    step: 5,
  },
  {
    key: 'clingSpeed',
    label: 'Wall cling speed (px/s)',
    min: 5,
    max: 100,
    step: 5,
  },
  {
    key: 'jumpHorizontalSpeed',
    label: 'Wall jump outward (px/s)',
    min: 100,
    max: 750,
    step: 5,
  },
  {
    key: 'jumpVerticalSpeed',
    label: 'Wall jump upward (px/s)',
    min: 300,
    max: 1100,
    step: 5,
  },
  {
    key: 'jumpControlLockSeconds',
    label: 'Wall jump steer delay (s)',
    min: 0,
    max: 0.35,
    step: 0.01,
  },
  {
    key: 'contactGraceSeconds',
    label: 'Wall contact grace (s)',
    min: 0,
    max: 0.35,
    step: 0.01,
  },
];

export const ART_FIELDS: readonly NumberField<PoseTuning>[] = [
  { key: 'scale', label: 'Sprite scale', min: 0.5, max: 2, step: 0.05 },
  {
    key: 'offsetX',
    label: 'Horizontal offset (px)',
    min: -32,
    max: 32,
    step: 1,
  },
  { key: 'offsetY', label: 'Vertical offset (px)', min: -32, max: 32, step: 1 },
  {
    key: 'idleFrameMs',
    label: 'Idle hold per frame (ms)',
    min: 40,
    max: 500,
    step: 5,
  },
  {
    key: 'runCyclePx',
    label: 'Distance per run cycle (px)',
    min: 40,
    max: 320,
    step: 4,
  },
];

export const ROOM_FIELDS: readonly NumberField<RoomTuning>[] = [
  { key: 'gravity', label: 'Gravity (px/s²)', min: 600, max: 2200, step: 25 },
  {
    key: 'climbSpeed',
    label: 'Rope climb speed (px/s)',
    min: 50,
    max: 400,
    step: 5,
  },
  {
    key: 'breakReach',
    label: 'Brute break reach (px)',
    min: 5,
    max: 80,
    step: 1,
  },
  {
    key: 'liftSpeed',
    label: 'Lift travel speed (px/s)',
    min: 40,
    max: 220,
    step: 5,
  },
];

export function getDefaultCrewTuning(gravity: number): CrewTuning {
  const art: Partial<Record<CrewMember, PoseTuning>> = {};
  for (const member of CREW_ARCHETYPES) {
    const id = getCharacterDefinition(member).art;
    if (id !== undefined) art[member] = CHARACTER_ART[id].tuning;
  }
  return {
    version: 1,
    lab: CREW_ABILITIES_LAB_ID,
    movement: {
      pilot: getCharacterDefinition('pilot').movementConfig,
      brute: getCharacterDefinition('brute').movementConfig,
      tinkerer: getCharacterDefinition('tinkerer').movementConfig,
    },
    art,
    room: {
      gravity,
      climbSpeed: DEFAULT_CLIMB_SPEED,
      breakReach: DEFAULT_BREAK_REACH_PX,
      liftSpeed: DEFAULT_LIFT_SPEED,
    },
  };
}

function getRecord(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected a tuning settings object.');
  }
  return value as Record<string, unknown>;
}

function readFields<T extends object>(
  input: unknown,
  fields: readonly NumberField<T>[],
  fallback: T,
): T {
  const values = getRecord(input);
  const result = { ...fallback };
  for (const { key, min, max, label } of fields) {
    const value = values[key];
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value < min ||
      value > max
    ) {
      throw new Error(`${label} must be between ${min} and ${max}.`);
    }
    Object.assign(result, { [key]: value });
  }
  return result;
}

export function readCrewTuning(json: string, defaults: CrewTuning): CrewTuning {
  const root = getRecord(JSON.parse(json));
  if (root.version !== defaults.version || root.lab !== defaults.lab) {
    throw new Error('Choose a version 1 Crew Abilities Lab preset.');
  }
  const movementValues = getRecord(root.movement);
  const artValues = getRecord(root.art);
  const movement = { ...defaults.movement };
  const art = { ...defaults.art };
  for (const member of CREW_ARCHETYPES) {
    const baseline = defaults.movement[member];
    const values = getRecord(movementValues[member]);
    movement[member] = readFields(values, MOVEMENT_FIELDS, baseline);
    if (baseline.wallMovement !== undefined) {
      movement[member] = {
        ...movement[member],
        wallMovement: readFields(
          values.wallMovement,
          WALL_FIELDS,
          baseline.wallMovement,
        ),
      };
    }
    const tuning = defaults.art[member];
    if (tuning !== undefined && artValues[member] !== undefined) {
      art[member] = readFields(artValues[member], ART_FIELDS, tuning);
    }
  }
  return {
    version: defaults.version,
    lab: defaults.lab,
    movement,
    art,
    room: readFields(root.room, ROOM_FIELDS, defaults.room),
  };
}
