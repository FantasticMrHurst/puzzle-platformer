import { describe, expect, it } from 'vitest';

import testRoomSource from '../../src/levels/data/test-room.json';
import {
  LevelValidationError,
  loadLevelData,
} from '../../src/levels/LevelLoader';

const validLevel = {
  schemaVersion: 6,
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
  exit: { id: 'exit', x: 650, y: 350, width: 100, height: 150 },
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
  pressurePlates: [],
  pushableBlocks: [],
  mechanismConsoles: [],
  poweredBridges: [],
  rangedTargets: [],
  growthNodes: [],
  plantStructures: [],
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

  it('rejects an exit outside the world bounds', () => {
    const outsideWorldLevel = {
      ...validLevel,
      exit: { ...validLevel.exit, x: 750, width: 100 },
    };

    expect(() => loadLevelData(outsideWorldLevel, 'outside-exit.json')).toThrow(
      'outside-exit.json: $.exit must fit entirely inside $.world bounds',
    );
  });

  it('loads connected pressure plates and archetype-gated blocks', () => {
    const level = loadLevelData({
      ...validLevel,
      pressurePlates: [
        {
          id: 'plate',
          x: 200,
          y: 480,
          width: 80,
          height: 20,
          channel: 'gate-lock',
        },
      ],
      pushableBlocks: [
        {
          id: 'block',
          x: 300,
          y: 400,
          width: 80,
          height: 100,
          channel: 'gate-lock',
          requiredArchetype: 'brute',
          maxPushX: 500,
          pushSpeed: 120,
        },
      ],
    });

    expect(level.pressurePlates[0]?.channel).toBe('gate-lock');
    expect(level.pushableBlocks[0]?.requiredArchetype).toBe('brute');
  });

  it('rejects pushable blocks without a matching plate channel', () => {
    expect(() =>
      loadLevelData({
        ...validLevel,
        pushableBlocks: [
          {
            id: 'block',
            x: 300,
            y: 400,
            width: 80,
            height: 100,
            channel: 'missing',
            requiredArchetype: 'brute',
            maxPushX: 500,
            pushSpeed: 120,
          },
        ],
      }),
    ).toThrow(
      'level data: $.pushableBlocks[0].channel must reference a pressure-plate channel; received "missing"',
    );
  });

  it('loads connected Tinkerer consoles and powered bridges', () => {
    const level = loadLevelData({
      ...validLevel,
      mechanismConsoles: [
        {
          id: 'console',
          x: 200,
          y: 420,
          width: 48,
          height: 80,
          channel: 'bridge-power',
          requiredArchetype: 'tinkerer',
          interactionRange: 72,
          initiallyPowered: false,
        },
      ],
      poweredBridges: [
        {
          id: 'bridge',
          x: 300,
          y: 460,
          width: 240,
          height: 40,
          channel: 'bridge-power',
        },
      ],
    });

    expect(level.mechanismConsoles[0]?.requiredArchetype).toBe('tinkerer');
    expect(level.poweredBridges[0]?.channel).toBe('bridge-power');
  });

  it('rejects powered bridges without a matching console channel', () => {
    expect(() =>
      loadLevelData({
        ...validLevel,
        poweredBridges: [
          {
            id: 'bridge',
            x: 300,
            y: 460,
            width: 240,
            height: 40,
            channel: 'missing',
          },
        ],
      }),
    ).toThrow(
      'level data: $.poweredBridges[0].channel must reference a mechanism-console or ranged-target channel; received "missing"',
    );
  });

  it('allows a ranged target to power a connected bridge', () => {
    const level = loadLevelData({
      ...validLevel,
      rangedTargets: [
        {
          id: 'target',
          x: 600,
          y: 400,
          width: 40,
          height: 80,
          channel: 'target-hit',
          initiallyActive: false,
        },
      ],
      poweredBridges: [
        {
          id: 'bridge',
          x: 300,
          y: 460,
          width: 240,
          height: 40,
          channel: 'target-hit',
        },
      ],
    });

    expect(level.rangedTargets[0]?.initiallyActive).toBe(false);
    expect(level.poweredBridges[0]?.channel).toBe('target-hit');
  });

  it('loads a Gardener growth node and connected plant structure', () => {
    const level = loadLevelData({
      ...validLevel,
      growthNodes: [
        {
          id: 'seed-bed',
          x: 200,
          y: 460,
          width: 80,
          height: 40,
          channel: 'plant-growth',
          requiredArchetype: 'gardener',
          interactionRange: 72,
          initiallyGrown: false,
        },
      ],
      plantStructures: [
        {
          id: 'plant-step',
          x: 320,
          y: 380,
          width: 120,
          height: 120,
          channel: 'plant-growth',
        },
      ],
    });

    expect(level.growthNodes[0]?.requiredArchetype).toBe('gardener');
    expect(level.plantStructures[0]?.channel).toBe('plant-growth');
  });

  it('rejects plant structures without a matching growth node', () => {
    expect(() =>
      loadLevelData({
        ...validLevel,
        plantStructures: [
          {
            id: 'plant-step',
            x: 320,
            y: 380,
            width: 120,
            height: 120,
            channel: 'missing',
          },
        ],
      }),
    ).toThrow(
      'level data: $.plantStructures[0].channel must reference a growth-node channel; received "missing"',
    );
  });
});
