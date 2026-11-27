import { describe, expect, it } from 'vitest';

import { getLevelSource } from '../../src/levels/LevelCatalog';
import { loadLevelData } from '../../src/levels/LevelLoader';

describe('getLevelSource', () => {
  it('defaults to the movement room and loads the traversal lab by ID', () => {
    expect(loadLevelData(getLevelSource(null).data).id).toBe(
      'movement-test-room',
    );
    const traversalSource = getLevelSource('traversal-lab');
    const traversalLab = loadLevelData(
      traversalSource.data,
      traversalSource.source,
    );

    expect(traversalLab.id).toBe('traversal-lab');
    expect(traversalLab.characters.map(({ archetype }) => archetype)).toEqual([
      'scout',
      'pet',
      'brute',
    ]);
    expect(traversalLab.pressurePlates).toHaveLength(1);
    expect(traversalLab.pushableBlocks).toHaveLength(1);

    const mechanismSource = getLevelSource('mechanism-lab');
    const mechanismLab = loadLevelData(
      mechanismSource.data,
      mechanismSource.source,
    );
    expect(mechanismLab.characters[0]?.archetype).toBe('tinkerer');
    expect(mechanismLab.mechanismConsoles).toHaveLength(1);
    expect(mechanismLab.poweredBridges).toHaveLength(1);

    const rangerSource = getLevelSource('ranger-lab');
    const rangerLab = loadLevelData(rangerSource.data, rangerSource.source);
    expect(rangerLab.characters[0]?.archetype).toBe('ranger');
    expect(rangerLab.rangedTargets).toHaveLength(1);

    const gardenerSource = getLevelSource('gardener-lab');
    const gardenerLab = loadLevelData(
      gardenerSource.data,
      gardenerSource.source,
    );
    expect(gardenerLab.characters[0]?.archetype).toBe('gardener');
    expect(gardenerLab.growthNodes).toHaveLength(1);

    const cooperationSource = getLevelSource('cooperation-lab');
    const cooperationLab = loadLevelData(
      cooperationSource.data,
      cooperationSource.source,
    );
    expect(cooperationLab.characters.map(({ archetype }) => archetype)).toEqual(
      ['ranger', 'gardener', 'tinkerer'],
    );

    const trioSource = getLevelSource('scout-brute-ranger-lab');
    const trioLab = loadLevelData(trioSource.data, trioSource.source);
    expect(trioLab.characters.map(({ archetype }) => archetype)).toEqual([
      'scout',
      'brute',
      'ranger',
    ]);

    const relaySource = getLevelSource('relay-station');
    const relay = loadLevelData(relaySource.data, relaySource.source);
    expect(relay.characters.map(({ archetype }) => archetype)).toEqual([
      'scout',
      'brute',
      'tinkerer',
    ]);
  });

  it('reports available IDs for an unknown level', () => {
    expect(() => getLevelSource('missing')).toThrow(
      'Unknown level "missing". Available levels: relay-station, cooperation-lab, gardener-lab, gate-lab, movement-test-room, mechanism-lab, ranger-lab, scout-brute-ranger-lab, traversal-lab, tinkerer-plug-lab',
    );
  });
});
