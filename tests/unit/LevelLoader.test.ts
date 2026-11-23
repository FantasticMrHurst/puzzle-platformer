import { describe, expect, it } from 'vitest';

import testRoomSource from '../../src/levels/data/test-room.json';
import {
  LevelValidationError,
  loadLevelData,
} from '../../src/levels/LevelLoader';

const validLevel = {
  schemaVersion: 2,
  id: 'unit-test-level',
  name: 'Unit Test Level',
  world: { width: 800, height: 600, backgroundColor: '#112233' },
  characters: [
    {
      id: 'test-character',
      archetype: 'scout',
      spawn: { x: 100, y: 100 },
    },
  ],
  staticGeometry: [
    {
      id: 'floor',
      x: 0,
      y: 500,
      width: 800,
      height: 100,
      surface: 'ground',
    },
  ],
};

describe('loadLevelData', () => {
  it('loads the authored movement test room', () => {
    const level = loadLevelData(testRoomSource, 'test-room.json');

    expect(level.id).toBe('movement-test-room');
    expect(level.characters).toHaveLength(3);
    expect(level.staticGeometry).toHaveLength(11);
  });

  it('reports the source and field path for missing data', () => {
    expect(() =>
      loadLevelData(
        {
          ...validLevel,
          characters: [
            {
              ...validLevel.characters[0],
              spawn: { x: 100 },
            },
          ],
        },
        'broken-room.json',
      ),
    ).toThrowError(
      new LevelValidationError(
        'broken-room.json',
        '$.characters[0].spawn.y',
        'must be a finite number',
      ),
    );
  });

  it('rejects duplicate geometry identifiers', () => {
    const floor = validLevel.staticGeometry[0];
    const duplicateGeometryLevel = {
      ...validLevel,
      staticGeometry: [floor, { ...floor }],
    };

    expect(() =>
      loadLevelData(duplicateGeometryLevel, 'duplicate.json'),
    ).toThrow('duplicate.json: $.staticGeometry[1].id must be unique');
  });

  it('rejects duplicate character identifiers', () => {
    const character = validLevel.characters[0];

    expect(() =>
      loadLevelData(
        { ...validLevel, characters: [character, { ...character }] },
        'duplicate-character.json',
      ),
    ).toThrow('duplicate-character.json: $.characters[1].id must be unique');
  });

  it('rejects unknown character archetypes', () => {
    const character = validLevel.characters[0];

    expect(() =>
      loadLevelData(
        {
          ...validLevel,
          characters: [{ ...character, archetype: 'wizard' }],
        },
        'unknown-character.json',
      ),
    ).toThrow(
      'unknown-character.json: $.characters[0].archetype must be one of brute, scout, tinkerer, ranger, pet, gardener',
    );
  });

  it('rejects geometry outside the world bounds', () => {
    const outsideWorldLevel = {
      ...validLevel,
      staticGeometry: [{ ...validLevel.staticGeometry[0], x: 750, width: 100 }],
    };

    expect(() => loadLevelData(outsideWorldLevel, 'outside.json')).toThrow(
      'outside.json: $.staticGeometry[0] must fit entirely inside $.world bounds',
    );
  });
});
