import {
  CHARACTER_ARCHETYPES,
  LEVEL_SCHEMA_VERSION,
  type CharacterArchetype,
  type CharacterSpawnData,
  type LevelData,
  type LevelWorldData,
  type PointData,
  type StaticGeometryData,
  type SurfaceKind,
} from './LevelSchema';

const SURFACE_KINDS = new Set<SurfaceKind>(['ground', 'platform', 'wall']);
const CHARACTER_ARCHETYPE_SET = new Set<CharacterArchetype>(
  CHARACTER_ARCHETYPES,
);
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

type UnknownRecord = Record<string, unknown>;

export class LevelValidationError extends Error {
  public constructor(source: string, path: string, problem: string) {
    super(`${source}: ${path} ${problem}`);
    this.name = 'LevelValidationError';
  }
}

export function loadLevelData(
  input: unknown,
  source = 'level data',
): LevelData {
  const root = requireRecord(input, source, '$');
  const schemaVersion = requireNumber(root, 'schemaVersion', source, '$');

  if (schemaVersion !== LEVEL_SCHEMA_VERSION) {
    fail(
      source,
      '$.schemaVersion',
      `must be ${LEVEL_SCHEMA_VERSION}; received ${schemaVersion}`,
    );
  }

  const id = requireNonEmptyString(root, 'id', source, '$');
  const name = requireNonEmptyString(root, 'name', source, '$');
  const world = parseWorld(root.world, source);
  const characters = parseCharacters(root.characters, source, world);
  const staticGeometry = parseStaticGeometry(
    root.staticGeometry,
    source,
    world,
  );

  return {
    schemaVersion: LEVEL_SCHEMA_VERSION,
    id,
    name,
    world,
    characters,
    staticGeometry,
  };
}

function parseCharacters(
  input: unknown,
  source: string,
  world: LevelWorldData,
): readonly CharacterSpawnData[] {
  if (!Array.isArray(input)) {
    fail(source, '$.characters', 'must be an array');
  }
  if (input.length < 1 || input.length > 3) {
    fail(source, '$.characters', 'must contain between 1 and 3 characters');
  }

  const seenIds = new Set<string>();

  return input.map((entry: unknown, index: number) => {
    const path = `$.characters[${index}]`;
    const character = requireRecord(entry, source, path);
    const id = requireNonEmptyString(character, 'id', source, path);

    if (seenIds.has(id)) {
      fail(source, `${path}.id`, `must be unique; received duplicate "${id}"`);
    }
    seenIds.add(id);

    const archetype = requireCharacterArchetype(character, source, path);
    const spawn = parsePoint(character.spawn, source, `${path}.spawn`);
    assertPointInsideWorld(spawn, world, source, `${path}.spawn`);

    return { id, archetype, spawn };
  });
}

function requireCharacterArchetype(
  record: UnknownRecord,
  source: string,
  path: string,
): CharacterArchetype {
  const archetype = requireNonEmptyString(record, 'archetype', source, path);

  if (!CHARACTER_ARCHETYPE_SET.has(archetype as CharacterArchetype)) {
    fail(
      source,
      `${path}.archetype`,
      `must be one of ${CHARACTER_ARCHETYPES.join(', ')}`,
    );
  }

  return archetype as CharacterArchetype;
}

function parseWorld(input: unknown, source: string): LevelWorldData {
  const world = requireRecord(input, source, '$.world');
  const width = requirePositiveNumber(world, 'width', source, '$.world');
  const height = requirePositiveNumber(world, 'height', source, '$.world');
  const backgroundColor = requireNonEmptyString(
    world,
    'backgroundColor',
    source,
    '$.world',
  );

  if (!HEX_COLOR_PATTERN.test(backgroundColor)) {
    fail(source, '$.world.backgroundColor', 'must be a six-digit hex color');
  }

  return { width, height, backgroundColor };
}

function parsePoint(input: unknown, source: string, path: string): PointData {
  const point = requireRecord(input, source, path);

  return {
    x: requireFiniteNumber(point, 'x', source, path),
    y: requireFiniteNumber(point, 'y', source, path),
  };
}

function parseStaticGeometry(
  input: unknown,
  source: string,
  world: LevelWorldData,
): readonly StaticGeometryData[] {
  if (!Array.isArray(input)) {
    fail(source, '$.staticGeometry', 'must be an array');
  }

  const seenIds = new Set<string>();

  return input.map((entry: unknown, index: number) => {
    const path = `$.staticGeometry[${index}]`;
    const geometry = requireRecord(entry, source, path);
    const id = requireNonEmptyString(geometry, 'id', source, path);

    if (seenIds.has(id)) {
      fail(source, `${path}.id`, `must be unique; received duplicate "${id}"`);
    }
    seenIds.add(id);

    const x = requireFiniteNumber(geometry, 'x', source, path);
    const y = requireFiniteNumber(geometry, 'y', source, path);
    const width = requirePositiveNumber(geometry, 'width', source, path);
    const height = requirePositiveNumber(geometry, 'height', source, path);
    const surface = requireSurfaceKind(geometry, source, path);
    const purpose = optionalNonEmptyString(geometry, 'purpose', source, path);

    if (
      x < 0 ||
      y < 0 ||
      x + width > world.width ||
      y + height > world.height
    ) {
      fail(source, path, 'must fit entirely inside $.world bounds');
    }

    return {
      id,
      x,
      y,
      width,
      height,
      surface,
      ...(purpose === undefined ? {} : { purpose }),
    };
  });
}

function requireSurfaceKind(
  record: UnknownRecord,
  source: string,
  path: string,
): SurfaceKind {
  const surface = requireNonEmptyString(record, 'surface', source, path);

  if (!SURFACE_KINDS.has(surface as SurfaceKind)) {
    fail(
      source,
      `${path}.surface`,
      `must be one of ${Array.from(SURFACE_KINDS).join(', ')}`,
    );
  }

  return surface as SurfaceKind;
}

function assertPointInsideWorld(
  point: PointData,
  world: LevelWorldData,
  source: string,
  path: string,
): void {
  if (
    point.x < 0 ||
    point.y < 0 ||
    point.x > world.width ||
    point.y > world.height
  ) {
    fail(source, path, 'must be inside $.world bounds');
  }
}

function requireRecord(
  input: unknown,
  source: string,
  path: string,
): UnknownRecord {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    fail(source, path, 'must be an object');
  }

  return input as UnknownRecord;
}

function requireNumber(
  record: UnknownRecord,
  key: string,
  source: string,
  path: string,
): number {
  return requireFiniteNumber(record, key, source, path);
}

function requireFiniteNumber(
  record: UnknownRecord,
  key: string,
  source: string,
  path: string,
): number {
  const value = record[key];

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    fail(source, `${path}.${key}`, 'must be a finite number');
  }

  return value;
}

function requirePositiveNumber(
  record: UnknownRecord,
  key: string,
  source: string,
  path: string,
): number {
  const value = requireFiniteNumber(record, key, source, path);

  if (value <= 0) {
    fail(source, `${path}.${key}`, 'must be greater than zero');
  }

  return value;
}

function requireNonEmptyString(
  record: UnknownRecord,
  key: string,
  source: string,
  path: string,
): string {
  const value = record[key];

  if (typeof value !== 'string' || value.trim().length === 0) {
    fail(source, `${path}.${key}`, 'must be a non-empty string');
  }

  return value;
}

function optionalNonEmptyString(
  record: UnknownRecord,
  key: string,
  source: string,
  path: string,
): string | undefined {
  const value = record[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    fail(source, `${path}.${key}`, 'must be a non-empty string when provided');
  }

  return value;
}

function fail(source: string, path: string, problem: string): never {
  throw new LevelValidationError(source, path, problem);
}
