import bruteAtlas from '../assets/sprites/brute/brute_atlas.json?url';
import bruteTexture from '../assets/sprites/brute/brute_atlas.png';
import bruteSpecs from '../assets/sprites/brute/brute_sprite_specs.json';
import pilotAtlas from '../assets/sprites/pilot/pilot_atlas.json?url';
import pilotTexture from '../assets/sprites/pilot/pilot_atlas.png';
import { getCharacterDefinition } from '../entities/CharacterCatalog';
import type { CharacterArchetype } from '../levels/LevelSchema';
import {
  DEFAULT_BRUTE_POSE_TUNING,
  DEFAULT_PILOT_POSE_TUNING,
  type PoseTuning,
} from './PoseTuning';

type Clip = readonly [string, ...string[]];

export interface CharacterArt {
  readonly textureKey: string;
  readonly textureUrl: string;
  readonly atlasUrl: string;
  readonly previewFlag: string;
  readonly origin: readonly [number, number];
  readonly tuning: PoseTuning;
  readonly idle: Clip;
  readonly run: Clip;
  readonly brake: string;
  readonly land: string;
  readonly jump: {
    readonly liftoff: string;
    readonly rise: string;
    readonly apex: string;
    readonly descend: string;
    readonly fall: string;
    readonly liftoffSeconds: number;
  };
  readonly wall?: {
    readonly cling: string;
    readonly slide: string;
    readonly kick: string;
    readonly clingSeconds: number;
    readonly authoredWall: -1 | 1;
  };
  readonly grip?: {
    readonly push: Clip;
    readonly pull: Clip;
    readonly pixelsPerFrame: number;
  };
  readonly brace?: {
    readonly frames: Clip;
    readonly secondsPerFrame: number;
    readonly supportHeight: number;
  };
}

function numberedFrames(first: string, count: number): Clip {
  return [
    `${first}_01`,
    ...Array.from(
      { length: count - 1 },
      (_, index) => `${first}_${String(index + 2).padStart(2, '0')}`,
    ),
  ];
}

function locomotion(id: string, liftoffSeconds: number) {
  return {
    origin: [48 / 96, 96 / 112] as const,
    idle: numberedFrames(`${id}_idle`, 8),
    run: numberedFrames(`${id}_run`, 8),
    brake: `${id}_brake`,
    land: `${id}_land`,
    jump: {
      liftoff: `${id}_jump_01_liftoff`,
      rise: `${id}_jump_02_rise`,
      apex: `${id}_jump_03_apex`,
      descend: `${id}_jump_04_descend`,
      fall: `${id}_jump_05_fall`,
      liftoffSeconds,
    },
  };
}

export const CHARACTER_ART = {
  pilot: {
    ...locomotion('pilot', 0.07),
    textureKey: 'pilot-atlas',
    textureUrl: pilotTexture,
    atlasUrl: pilotAtlas,
    previewFlag: 'pilotArt',
    tuning: DEFAULT_PILOT_POSE_TUNING,
    wall: {
      cling: 'pilot_wall_cling',
      slide: 'pilot_wall_slide',
      kick: 'pilot_wall_kick',
      clingSeconds: 0.12,
      authoredWall: 1,
    },
  },
  brute: {
    ...locomotion('brute', 0.075),
    textureKey: 'brute-atlas',
    textureUrl: bruteTexture,
    atlasUrl: bruteAtlas,
    previewFlag: 'bruteArt',
    tuning: DEFAULT_BRUTE_POSE_TUNING,
    grip: {
      push: numberedFrames('brute_push', 4),
      pull: numberedFrames('brute_pull', 4),
      pixelsPerFrame: 12,
    },
    brace: {
      frames: numberedFrames('brute_brace', 4),
      secondsPerFrame: 0.045,
      supportHeight:
        bruteSpecs.anchor[1]! - bruteSpecs.brace_surface_suggested_local_y,
    },
  },
} satisfies Record<string, CharacterArt>;

export type CharacterArtId = keyof typeof CHARACTER_ART;

export function enableCharacterArt(
  params: URLSearchParams,
  roster: readonly CharacterArchetype[],
): void {
  for (const archetype of roster) {
    const art = getCharacterDefinition(archetype).art;
    if (art !== undefined) params.set(CHARACTER_ART[art].previewFlag, '1');
  }
}

export function getCharacterArtFrames(art: CharacterArt): readonly string[] {
  const { jump, wall, grip, brace } = art;
  return [
    ...art.idle,
    ...art.run,
    art.brake,
    art.land,
    jump.liftoff,
    jump.rise,
    jump.apex,
    jump.descend,
    jump.fall,
    ...(wall ? [wall.cling, wall.slide, wall.kick] : []),
    ...(grip ? [...grip.push, ...grip.pull] : []),
    ...(brace?.frames ?? []),
  ];
}
