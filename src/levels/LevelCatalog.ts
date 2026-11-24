import gardenerLab from './data/gardener-lab.json';
import mechanismLab from './data/mechanism-lab.json';
import movementTestRoom from './data/test-room.json';
import rangerLab from './data/ranger-lab.json';
import traversalLab from './data/traversal-lab.json';

export interface LevelSource {
  readonly data: unknown;
  readonly source: string;
}

const DEFAULT_LEVEL_ID = 'movement-test-room';
const LEVEL_SOURCES: Readonly<Record<string, LevelSource>> = {
  'gardener-lab': {
    data: gardenerLab,
    source: 'gardener-lab.json',
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
  'traversal-lab': {
    data: traversalLab,
    source: 'traversal-lab.json',
  },
};

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
