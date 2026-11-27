import type Phaser from 'phaser';

import manifest from '../assets/verdant-ruins/manifest.json';
import {
  FOREST_ROUTE,
  FOREST_TERRAIN,
  TILE_SIZE,
  VIEW_HEIGHT,
  VIEW_WIDTH,
} from '../levels/verdantRuins';

const files = import.meta.glob<string>(
  '../assets/verdant-ruins/{terrain,structures,parallax,trees,vegetation,hazards,interactive}/*.png',
  { eager: true, import: 'default', query: '?url' },
);
const terrainIds = ['stone', 'grass_top', 'earth_fill', 'ceiling'];
const artIds = new Set([
  'bridge_left',
  'bridge_center',
  'bridge_right',
  'ladder_top',
  'ladder_middle',
  'ladder_bottom',
  'foreground_roots',
  'foreground_trunk',
  'foreground_branches',
  'foreground_canopy',
  'hanging_vine_1',
  'grass_tuft_1',
  'grass_tuft_2',
  'leaf_cluster_1',
  'leaf_cluster_3',
  'mushroom',
  'sun_bloom',
  'rock_cluster',
  'spikes_crystal',
  'push_crate',
  'pressure_plate_up',
  'pressure_plate_down',
  'gate_closed',
  'gate_open',
  'lever_off',
  'lever_on',
]);

export function forestTexture(id: string): string {
  return `verdant-${id}`;
}

export function preloadForestArt(scene: Phaser.Scene): void {
  for (const asset of manifest.assets) {
    if (
      asset.category !== 'parallax' &&
      !artIds.has(asset.id) &&
      !terrainIds.some((prefix) => asset.id.startsWith(`${prefix}_`))
    ) {
      continue;
    }
    const url = files[`../assets/verdant-ruins/${asset.file}`];
    if (url === undefined) {
      throw new Error(`Missing forest asset: ${asset.file}`);
    }
    scene.load.image(forestTexture(asset.id), url);
  }
}

export class VerdantRuinsArt {
  private readonly layers: {
    readonly sprite: Phaser.GameObjects.TileSprite;
    readonly factor: number;
  }[];

  public constructor(private readonly scene: Phaser.Scene) {
    this.layers = manifest.assets
      .filter((asset) => asset.category === 'parallax')
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((asset, index) => ({
        sprite: scene.add
          .tileSprite(
            0,
            VIEW_HEIGHT - asset.height * 2,
            VIEW_WIDTH,
            asset.height * 2,
            forestTexture(asset.id),
          )
          .setTileScale(2)
          .setOrigin(0)
          .setScrollFactor(0)
          .setDepth(-20 + index),
        factor: asset.scroll_factor ?? 0,
      }));
    this.drawTrees();
    const { x, y, width, height } = FOREST_ROUTE.tunnel;
    scene.add
      .rectangle(x + width / 2, y + height / 2, width, height, 0x102226, 0.72)
      .setDepth(-8);
    this.drawTerrain();
    this.drawStructures();
    this.drawVegetation();
  }

  public update(scrollX: number): void {
    for (const { sprite, factor } of this.layers) {
      sprite.tilePositionX = Math.round(scrollX * factor) / sprite.tileScaleX;
    }
  }

  private drawTerrain(): void {
    for (const { x, y, width, height, style } of FOREST_TERRAIN) {
      for (let row = 0; row < height / TILE_SIZE; row += 1) {
        for (let col = 0; col < width / TILE_SIZE; col += 1) {
          const family =
            style === 'ground'
              ? row === 0
                ? 'grass_top'
                : 'earth_fill'
              : style;
          const variant = ((Math.floor(x / TILE_SIZE) + col + row * 3) % 4) + 1;
          const key = `${family}_0${variant}`;
          this.tile(key, x + col * TILE_SIZE, y + row * TILE_SIZE);
        }
      }
    }
  }

  private drawStructures(): void {
    const { ladder, platform, spikes } = FOREST_ROUTE;
    const rows = ladder.height / TILE_SIZE;
    for (let row = 0; row < rows; row += 1) {
      const position =
        row === 0 ? 'top' : row === rows - 1 ? 'bottom' : 'middle';
      this.tile(`ladder_${position}`, ladder.x, ladder.y + row * TILE_SIZE, -1);
    }
    const columns = platform.width / TILE_SIZE;
    for (let col = 0; col < columns; col += 1) {
      const side =
        col === 0 ? 'left' : col === columns - 1 ? 'right' : 'center';
      this.tile(`bridge_${side}`, platform.x + col * TILE_SIZE, platform.y);
    }
    for (let x = spikes.x; x < spikes.x + spikes.width; x += TILE_SIZE) {
      this.tile('spikes_crystal', x, spikes.y);
    }
  }

  private drawTrees(): void {
    for (const [x, baseY, height] of [
      [208, 448, 4],
      [408, 448, 5],
      [736, 448, 4],
    ] as const) {
      this.asset('foreground_roots', x, baseY, -4);
      for (let segment = 1; segment < height; segment += 1) {
        this.asset('foreground_trunk', x, baseY - segment * 64, -5);
      }
      this.asset('foreground_branches', x, baseY - (height - 1) * 64, -5);
      this.asset('foreground_canopy', x, baseY - height * 64 + 32, -4);
    }
  }

  private drawVegetation(): void {
    for (const [id, x, y] of [
      ['grass_tuft_1', 64, 448],
      ['mushroom', 192, 448],
      ['leaf_cluster_3', 255, 448],
      ['leaf_cluster_1', 400, 448],
      ['sun_bloom', 552, 448],
      ['grass_tuft_2', 729, 448],
      ['hanging_vine_1', 850, 222],
      ['hanging_vine_1', 850, 286],
      ['rock_cluster', 1184, 704],
      ['mushroom', 1392, 704],
      ['sun_bloom', 1735, 704],
    ] as const) {
      this.asset(id, x, y, -2);
    }
  }

  private asset(id: string, x: number, y: number, depth: number): void {
    const asset = manifest.assets.find((entry) => entry.id === id)!;
    this.scene.add
      .image(x, y, forestTexture(id))
      .setOrigin(
        asset.anchor[0]! / asset.width,
        asset.anchor[1]! / asset.height,
      )
      .setDepth(depth);
  }

  private tile(id: string, x: number, y: number, depth = 0): void {
    this.scene.add.image(x, y, forestTexture(id)).setOrigin(0).setDepth(depth);
  }
}
