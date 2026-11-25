import {
  CHARACTER_ARCHETYPES,
  LEVEL_SCHEMA_VERSION,
  type CharacterArchetype,
  type CharacterSpawnData,
  type ExitData,
  type GateData,
  type GrowthNodeData,
  type LevelData,
  type LevelWorldData,
  type MechanismConsoleData,
  type PointData,
  type PlantStructureData,
  type PoweredBridgeData,
  type PressurePlateData,
  type PushableBlockData,
  type RangedTargetData,
  type StaticGeometryData,
  type SurfaceKind,
  type ToggleSwitchData,
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

  if (schemaVersion !== 6 && schemaVersion !== LEVEL_SCHEMA_VERSION) {
    fail(
      source,
      '$.schemaVersion',
      `must be 6 or ${LEVEL_SCHEMA_VERSION}; received ${schemaVersion}`,
    );
  }

  const id = requireNonEmptyString(root, 'id', source, '$');
  const name = requireNonEmptyString(root, 'name', source, '$');
  const world = parseWorld(root.world, source);
  const characters = parseCharacters(root.characters, source, world);
  const exit = parseExit(root.exit, source, world);
  const staticGeometry = parseStaticGeometry(
    root.staticGeometry,
    source,
    world,
  );
  const pressurePlates = parsePressurePlates(
    root.pressurePlates,
    source,
    world,
  );
  const pushableBlocks = parsePushableBlocks(
    root.pushableBlocks,
    source,
    world,
  );
  const mechanismConsoles = parseMechanismConsoles(
    root.mechanismConsoles,
    source,
    world,
  );
  const poweredBridges = parsePoweredBridges(
    root.poweredBridges,
    source,
    world,
  );
  const rangedTargets = parseRangedTargets(root.rangedTargets, source, world);
  const growthNodes = parseGrowthNodes(root.growthNodes, source, world);
  const plantStructures = parsePlantStructures(
    root.plantStructures,
    source,
    world,
  );
  const toggleSwitches =
    schemaVersion === 6
      ? []
      : parseToggleSwitches(root.toggleSwitches, source, world);
  const gates =
    schemaVersion === 6 ? [] : parseGates(root.gates, source, world);

  const plateChannels = new Set(pressurePlates.map(({ channel }) => channel));
  pushableBlocks.forEach(({ channel }, index) => {
    if (!plateChannels.has(channel)) {
      fail(
        source,
        `$.pushableBlocks[${index}].channel`,
        `must reference a pressure-plate channel; received "${channel}"`,
      );
    }
  });
  const consoleChannels = new Set(
    mechanismConsoles.map(({ channel }) => channel),
  );
  const rangedTargetChannels = new Set(
    rangedTargets.map(({ channel }) => channel),
  );
  const switchChannels = new Set(toggleSwitches.map(({ channel }) => channel));
  gates.forEach(({ channel }, index) => {
    if (
      !plateChannels.has(channel) &&
      !switchChannels.has(channel) &&
      !consoleChannels.has(channel) &&
      !rangedTargetChannels.has(channel)
    ) {
      fail(
        source,
        `$.gates[${index}].channel`,
        `must reference a signal source; received "${channel}"`,
      );
    }
  });
  poweredBridges.forEach(({ channel }, index) => {
    if (!consoleChannels.has(channel) && !rangedTargetChannels.has(channel)) {
      fail(
        source,
        `$.poweredBridges[${index}].channel`,
        `must reference a mechanism-console or ranged-target channel; received "${channel}"`,
      );
    }
  });
  const growthChannels = new Set(growthNodes.map(({ channel }) => channel));
  plantStructures.forEach(({ channel }, index) => {
    if (!growthChannels.has(channel)) {
      fail(
        source,
        `$.plantStructures[${index}].channel`,
        `must reference a growth-node channel; received "${channel}"`,
      );
    }
  });

  return {
    schemaVersion,
    id,
    name,
    world,
    characters,
    exit,
    staticGeometry,
    pressurePlates,
    toggleSwitches,
    gates,
    pushableBlocks,
    mechanismConsoles,
    poweredBridges,
    rangedTargets,
    growthNodes,
    plantStructures,
  };
}

function parseGates(
  input: unknown,
  source: string,
  world: LevelWorldData,
): readonly GateData[] {
  if (!Array.isArray(input)) {
    fail(source, '$.gates', 'must be an array');
  }
  const seenIds = new Set<string>();
  return input.map((entry: unknown, index: number) => {
    const path = `$.gates[${index}]`;
    const gate = requireRecord(entry, source, path);
    return {
      id: requireUniqueId(gate, seenIds, source, path),
      ...parseBounds(gate, source, path, world),
      channel: requireNonEmptyString(gate, 'channel', source, path),
    };
  });
}

function parseToggleSwitches(
  input: unknown,
  source: string,
  world: LevelWorldData,
): readonly ToggleSwitchData[] {
  if (!Array.isArray(input)) {
    fail(source, '$.toggleSwitches', 'must be an array');
  }
  const seenIds = new Set<string>();
  return input.map((entry: unknown, index: number) => {
    const path = `$.toggleSwitches[${index}]`;
    const toggle = requireRecord(entry, source, path);
    return {
      id: requireUniqueId(toggle, seenIds, source, path),
      ...parseBounds(toggle, source, path, world),
      channel: requireNonEmptyString(toggle, 'channel', source, path),
      interactionRange: requirePositiveNumber(
        toggle,
        'interactionRange',
        source,
        path,
      ),
      initiallyActive: requireBoolean(toggle, 'initiallyActive', source, path),
    };
  });
}

function parseGrowthNodes(
  input: unknown,
  source: string,
  world: LevelWorldData,
): readonly GrowthNodeData[] {
  if (!Array.isArray(input)) {
    fail(source, '$.growthNodes', 'must be an array');
  }

  const seenIds = new Set<string>();
  return input.map((entry: unknown, index: number) => {
    const path = `$.growthNodes[${index}]`;
    const node = requireRecord(entry, source, path);
    const id = requireUniqueId(node, seenIds, source, path);
    const bounds = parseBounds(node, source, path, world);
    const channel = requireNonEmptyString(node, 'channel', source, path);
    const requiredArchetype = requireCharacterArchetype(
      node,
      source,
      path,
      'requiredArchetype',
    );
    const interactionRange = requirePositiveNumber(
      node,
      'interactionRange',
      source,
      path,
    );
    const initiallyGrown = requireBoolean(node, 'initiallyGrown', source, path);

    return {
      id,
      ...bounds,
      channel,
      requiredArchetype,
      interactionRange,
      initiallyGrown,
    };
  });
}

function parsePlantStructures(
  input: unknown,
  source: string,
  world: LevelWorldData,
): readonly PlantStructureData[] {
  if (!Array.isArray(input)) {
    fail(source, '$.plantStructures', 'must be an array');
  }

  const seenIds = new Set<string>();
  return input.map((entry: unknown, index: number) => {
    const path = `$.plantStructures[${index}]`;
    const structure = requireRecord(entry, source, path);
    const id = requireUniqueId(structure, seenIds, source, path);
    const bounds = parseBounds(structure, source, path, world);
    const channel = requireNonEmptyString(structure, 'channel', source, path);
    const purpose = optionalNonEmptyString(structure, 'purpose', source, path);

    return {
      id,
      ...bounds,
      channel,
      ...(purpose === undefined ? {} : { purpose }),
    };
  });
}

function parseRangedTargets(
  input: unknown,
  source: string,
  world: LevelWorldData,
): readonly RangedTargetData[] {
  if (!Array.isArray(input)) {
    fail(source, '$.rangedTargets', 'must be an array');
  }

  const seenIds = new Set<string>();
  return input.map((entry: unknown, index: number) => {
    const path = `$.rangedTargets[${index}]`;
    const target = requireRecord(entry, source, path);
    const id = requireUniqueId(target, seenIds, source, path);
    const bounds = parseBounds(target, source, path, world);
    const channel = requireNonEmptyString(target, 'channel', source, path);
    const initiallyActive = requireBoolean(
      target,
      'initiallyActive',
      source,
      path,
    );

    return { id, ...bounds, channel, initiallyActive };
  });
}

function parseMechanismConsoles(
  input: unknown,
  source: string,
  world: LevelWorldData,
): readonly MechanismConsoleData[] {
  if (!Array.isArray(input)) {
    fail(source, '$.mechanismConsoles', 'must be an array');
  }

  const seenIds = new Set<string>();
  return input.map((entry: unknown, index: number) => {
    const path = `$.mechanismConsoles[${index}]`;
    const consoleData = requireRecord(entry, source, path);
    const id = requireUniqueId(consoleData, seenIds, source, path);
    const bounds = parseBounds(consoleData, source, path, world);
    const channel = requireNonEmptyString(consoleData, 'channel', source, path);
    const requiredArchetype = requireCharacterArchetype(
      consoleData,
      source,
      path,
      'requiredArchetype',
    );
    const interactionRange = requirePositiveNumber(
      consoleData,
      'interactionRange',
      source,
      path,
    );
    const initiallyPowered = requireBoolean(
      consoleData,
      'initiallyPowered',
      source,
      path,
    );

    return {
      id,
      ...bounds,
      channel,
      requiredArchetype,
      interactionRange,
      initiallyPowered,
    };
  });
}

function parsePoweredBridges(
  input: unknown,
  source: string,
  world: LevelWorldData,
): readonly PoweredBridgeData[] {
  if (!Array.isArray(input)) {
    fail(source, '$.poweredBridges', 'must be an array');
  }

  const seenIds = new Set<string>();
  return input.map((entry: unknown, index: number) => {
    const path = `$.poweredBridges[${index}]`;
    const bridge = requireRecord(entry, source, path);
    const id = requireUniqueId(bridge, seenIds, source, path);
    const bounds = parseBounds(bridge, source, path, world);
    const channel = requireNonEmptyString(bridge, 'channel', source, path);
    const purpose = optionalNonEmptyString(bridge, 'purpose', source, path);

    return {
      id,
      ...bounds,
      channel,
      ...(purpose === undefined ? {} : { purpose }),
    };
  });
}

function parsePressurePlates(
  input: unknown,
  source: string,
  world: LevelWorldData,
): readonly PressurePlateData[] {
  if (!Array.isArray(input)) {
    fail(source, '$.pressurePlates', 'must be an array');
  }

  const seenIds = new Set<string>();
  return input.map((entry: unknown, index: number) => {
    const path = `$.pressurePlates[${index}]`;
    const plate = requireRecord(entry, source, path);
    const id = requireUniqueId(plate, seenIds, source, path);
    const bounds = parseBounds(plate, source, path, world);
    const channel = requireNonEmptyString(plate, 'channel', source, path);

    return { id, ...bounds, channel };
  });
}

function parsePushableBlocks(
  input: unknown,
  source: string,
  world: LevelWorldData,
): readonly PushableBlockData[] {
  if (!Array.isArray(input)) {
    fail(source, '$.pushableBlocks', 'must be an array');
  }

  const seenIds = new Set<string>();
  return input.map((entry: unknown, index: number) => {
    const path = `$.pushableBlocks[${index}]`;
    const block = requireRecord(entry, source, path);
    const id = requireUniqueId(block, seenIds, source, path);
    const bounds = parseBounds(block, source, path, world);
    const channel = requireNonEmptyString(block, 'channel', source, path);
    const requiredArchetype = requireCharacterArchetype(
      block,
      source,
      path,
      'requiredArchetype',
    );
    const maxPushX = requireFiniteNumber(block, 'maxPushX', source, path);
    const pushSpeed = requirePositiveNumber(block, 'pushSpeed', source, path);
    const purpose = optionalNonEmptyString(block, 'purpose', source, path);

    if (maxPushX < bounds.x || maxPushX + bounds.width > world.width) {
      fail(
        source,
        `${path}.maxPushX`,
        'must move the block rightward while keeping it inside $.world bounds',
      );
    }

    return {
      id,
      ...bounds,
      channel,
      requiredArchetype,
      maxPushX,
      pushSpeed,
      ...(purpose === undefined ? {} : { purpose }),
    };
  });
}

function parseExit(
  input: unknown,
  source: string,
  world: LevelWorldData,
): ExitData {
  const path = '$.exit';
  const exit = requireRecord(input, source, path);
  const id = requireNonEmptyString(exit, 'id', source, path);
  const x = requireFiniteNumber(exit, 'x', source, path);
  const y = requireFiniteNumber(exit, 'y', source, path);
  const width = requirePositiveNumber(exit, 'width', source, path);
  const height = requirePositiveNumber(exit, 'height', source, path);

  if (x < 0 || y < 0 || x + width > world.width || y + height > world.height) {
    fail(source, path, 'must fit entirely inside $.world bounds');
  }

  return { id, x, y, width, height };
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
  field = 'archetype',
): CharacterArchetype {
  const archetype = requireNonEmptyString(record, field, source, path);

  if (!CHARACTER_ARCHETYPE_SET.has(archetype as CharacterArchetype)) {
    fail(
      source,
      `${path}.${field}`,
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

function requireUniqueId(
  record: UnknownRecord,
  seenIds: Set<string>,
  source: string,
  path: string,
): string {
  const id = requireNonEmptyString(record, 'id', source, path);
  if (seenIds.has(id)) {
    fail(source, `${path}.id`, `must be unique; received duplicate "${id}"`);
  }
  seenIds.add(id);
  return id;
}

function parseBounds(
  record: UnknownRecord,
  source: string,
  path: string,
  world: LevelWorldData,
): Pick<StaticGeometryData, 'x' | 'y' | 'width' | 'height'> {
  const x = requireFiniteNumber(record, 'x', source, path);
  const y = requireFiniteNumber(record, 'y', source, path);
  const width = requirePositiveNumber(record, 'width', source, path);
  const height = requirePositiveNumber(record, 'height', source, path);

  if (x < 0 || y < 0 || x + width > world.width || y + height > world.height) {
    fail(source, path, 'must fit entirely inside $.world bounds');
  }

  return { x, y, width, height };
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

function requireBoolean(
  record: UnknownRecord,
  key: string,
  source: string,
  path: string,
): boolean {
  const value = record[key];

  if (typeof value !== 'boolean') {
    fail(source, `${path}.${key}`, 'must be a boolean');
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
