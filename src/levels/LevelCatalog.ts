import cooperationLab from './data/cooperation-lab.json';
import gardenerLab from './data/gardener-lab.json';
import gateLab from './data/gate-lab.json';
import mechanismLab from './data/mechanism-lab.json';
import movementTestRoom from './data/test-room.json';
import rangerLab from './data/ranger-lab.json';
import scoutBruteRangerLab from './data/scout-brute-ranger-lab.json';
import tinkererPlugLab from './data/tinkerer-plug-lab.json';
import traversalLab from './data/traversal-lab.json';

export interface LevelSource {
  readonly data: { readonly name: string };
  readonly source: string;
}

const DEFAULT_LEVEL_ID = 'movement-test-room';
const LEVEL_SOURCES: Readonly<Record<string, LevelSource>> = {
  'cooperation-lab': {
    data: cooperationLab,
    source: 'cooperation-lab.json',
  },
  'gardener-lab': {
    data: gardenerLab,
    source: 'gardener-lab.json',
  },
  'gate-lab': {
    data: gateLab,
    source: 'gate-lab.json',
  },
  'movement-test-room': {
    data: movementTestRoom,
    source: 'test-room.json',
  },
  'mechanism-lab': {
    data: mechanismLab,
    source: 'mechanism-lab.json',
  },
  'ranger-lab': {
    data: rangerLab,
    source: 'ranger-lab.json',
  },
  'scout-brute-ranger-lab': {
    data: scoutBruteRangerLab,
    source: 'scout-brute-ranger-lab.json',
  },
  'traversal-lab': {
    data: traversalLab,
    source: 'traversal-lab.json',
  },
  'tinkerer-plug-lab': {
    data: tinkererPlugLab,
    source: 'tinkerer-plug-lab.json',
  },
};

export function getLabEntries(): readonly { id: string; name: string }[] {
  return Object.entries(LEVEL_SOURCES).map(([id, { data }]) => ({
    id,
    name: data.name,
  }));
}

export function getLevelSource(levelId: string | null): LevelSource {
  const selectedId = levelId ?? DEFAULT_LEVEL_ID;
  const levelSource = LEVEL_SOURCES[selectedId];

  if (levelSource === undefined) {
    throw new Error(
      `Unknown level "${selectedId}". Available levels: ${Object.keys(LEVEL_SOURCES).join(', ')}`,
    );
  }

  return levelSource;
}
