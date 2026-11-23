export const LEVEL_SCHEMA_VERSION = 2 as const;

export const CHARACTER_ARCHETYPES = [
  'brute',
  'scout',
  'tinkerer',
  'ranger',
  'pet',
  'gardener',
] as const;

export type CharacterArchetype = (typeof CHARACTER_ARCHETYPES)[number];

export type SurfaceKind = 'ground' | 'platform' | 'wall';

export interface LevelWorldData {
  readonly width: number;
  readonly height: number;
  readonly backgroundColor: string;
}

export interface PointData {
  readonly x: number;
  readonly y: number;
}

export interface CharacterSpawnData {
  readonly id: string;
  readonly archetype: CharacterArchetype;
  readonly spawn: PointData;
}

export interface StaticGeometryData {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly surface: SurfaceKind;
  readonly purpose?: string;
}

export interface LevelData {
  readonly schemaVersion: typeof LEVEL_SCHEMA_VERSION;
  readonly id: string;
  readonly name: string;
  readonly world: LevelWorldData;
  readonly characters: readonly CharacterSpawnData[];
  readonly staticGeometry: readonly StaticGeometryData[];
}
