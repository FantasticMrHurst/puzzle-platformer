export const LEVEL_SCHEMA_VERSION = 7 as const;

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

export interface ExitData {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
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

interface SignalBoundsData {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly channel: string;
}

export type PressurePlateData = SignalBoundsData;
export type GateData = SignalBoundsData;

export interface ToggleSwitchData extends SignalBoundsData {
  readonly interactionRange: number;
  readonly initiallyActive: boolean;
}

export interface PushableBlockData {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly channel: string;
  readonly requiredArchetype: CharacterArchetype;
  readonly maxPushX: number;
  readonly pushSpeed: number;
  readonly purpose?: string;
}

export interface MechanismConsoleData {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly channel: string;
  readonly requiredArchetype: CharacterArchetype;
  readonly interactionRange: number;
  readonly initiallyPowered: boolean;
}

export interface PoweredBridgeData {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly channel: string;
  readonly purpose?: string;
}

export interface RangedTargetData {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly channel: string;
  readonly initiallyActive: boolean;
}

export interface GrowthNodeData {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly channel: string;
  readonly requiredArchetype: CharacterArchetype;
  readonly interactionRange: number;
  readonly initiallyGrown: boolean;
}

export interface PlantStructureData {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly channel: string;
  readonly purpose?: string;
}

export interface LevelData {
  readonly schemaVersion: 6 | typeof LEVEL_SCHEMA_VERSION;
  readonly id: string;
  readonly name: string;
  readonly world: LevelWorldData;
  readonly characters: readonly CharacterSpawnData[];
  readonly exit: ExitData;
  readonly staticGeometry: readonly StaticGeometryData[];
  readonly pressurePlates: readonly PressurePlateData[];
  readonly toggleSwitches: readonly ToggleSwitchData[];
  readonly gates: readonly GateData[];
  readonly pushableBlocks: readonly PushableBlockData[];
  readonly mechanismConsoles: readonly MechanismConsoleData[];
  readonly poweredBridges: readonly PoweredBridgeData[];
  readonly rangedTargets: readonly RangedTargetData[];
  readonly growthNodes: readonly GrowthNodeData[];
  readonly plantStructures: readonly PlantStructureData[];
}
