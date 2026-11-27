import manifest from '../assets/verdant-ruins/manifest.json';

export const VERDANT_RUINS_ID = 'verdant-ruins';
export const VERDANT_RUINS_NAME = 'Forest of the Verdant Ruins';
export const TILE_SIZE = manifest.logical_tile_size;
export const VIEW_WIDTH = TILE_SIZE * 18;
export const VIEW_HEIGHT = TILE_SIZE * 11;
export const WORLD_WIDTH = TILE_SIZE * 56;
export const WORLD_HEIGHT = TILE_SIZE * 24;

export function grid(
  column: number,
  row: number,
  columns: number,
  rows: number,
) {
  return {
    x: column * TILE_SIZE,
    y: row * TILE_SIZE,
    width: columns * TILE_SIZE,
    height: rows * TILE_SIZE,
  };
}

export const FOREST_TERRAIN = [
  { ...grid(0, 0, 1, 14), style: 'stone' },
  { ...grid(0, 14, 27, 10), style: 'ground' },
  { ...grid(19, 0, 2, 11), style: 'stone' },
  { ...grid(26, 7, 1, 7), style: 'stone' },
  { ...grid(33, 0, 3, 19), style: 'stone' },
  { ...grid(36, 18, 20, 1), style: 'ceiling' },
  { ...grid(27, 22, 29, 2), style: 'stone' },
  { ...grid(55, 19, 1, 3), style: 'stone' },
] as const;

export const FOREST_ROUTE = {
  playerStart: { x: TILE_SIZE * 3.5, feetY: TILE_SIZE * 14 },
  crateStart: { x: TILE_SIZE * 10.5, feetY: TILE_SIZE * 14 },
  ladder: grid(24, 6, 1, 8),
  platform: grid(23, 6, 4, 1),
  spikes: { ...grid(27, 21, 4, 1), y: TILE_SIZE * 22 - 16, height: 16 },
  descent: grid(27, 6, 6, 16),
  plate: { ...grid(15, 14, 1, 1), y: TILE_SIZE * 14 - 16, height: 16 },
  supplyGate: grid(19, 11, 2, 3),
  tunnel: grid(33, 19, 23, 3),
  lever: grid(46, 21, 1, 1),
  exitGate: grid(50, 19, 2, 3),
  exit: grid(53, 19, 2, 3),
};
