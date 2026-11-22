import { describe, expect, it } from 'vitest';

import testRoomSource from '../../src/levels/data/test-room.json';
import {
  LevelValidationError,
  loadLevelData,
} from '../../src/levels/LevelLoader';

const validLevel = {
  schemaVersion: 1,
  id: 'unit-test-level',
  name: 'Unit Test Level',
  world: { width: 800, height: 600, backgroundColor: '#112233' },
  spawn: { x: 100, y: 100 },
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
    expect(level.staticGeometry).toHaveLength(11);
  });

  it('reports the source and field path for missing data', () => {
    expect(() =>
      loadLevelData({ ...validLevel, spawn: { x: 100 } }, 'broken-room.json'),
    ).toThrowError(
      new LevelValidationError(
        'broken-room.json',
        '$.spawn.y',
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
