export const LEVEL_SCHEMA_VERSION = 1 as const;

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
  readonly spawn: PointData;
  readonly staticGeometry: readonly StaticGeometryData[];
}
