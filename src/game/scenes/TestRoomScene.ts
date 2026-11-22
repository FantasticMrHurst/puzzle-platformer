import Phaser from 'phaser';

import testRoomSource from '../../levels/data/test-room.json';
import { loadLevelData } from '../../levels/LevelLoader';
import type {
  LevelData,
  StaticGeometryData,
  SurfaceKind,
} from '../../levels/LevelSchema';

const SURFACE_COLORS: Readonly<Record<SurfaceKind, number>> = {
  ground: 0x334155,
  platform: 0x0f766e,
  wall: 0x7c3aed,
};

export class TestRoomScene extends Phaser.Scene {
  public constructor() {
    super('test-room');
  }

  public create(): void {
    const level = loadLevelData(testRoomSource, 'test-room.json');

    this.configureWorld(level);
    this.createBackdrop(level);
    level.staticGeometry.forEach((geometry) =>
      this.createStaticGeometry(geometry),
    );
    this.createSpawnMarker(level);
    this.createHud(level);
  }

  private configureWorld(level: LevelData): void {
    const { width, height } = level.world;

    this.cameras.main.setBackgroundColor(level.world.backgroundColor);
    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.centerOn(level.spawn.x, level.spawn.y);
    this.physics.world.setBounds(0, 0, width, height);
  }

  private createBackdrop(level: LevelData): void {
    const { width, height } = level.world;

    this.add.grid(
      width / 2,
      height / 2,
      width,
      height,
      64,
      64,
      0x0b1020,
      1,
      0x24304f,
      0.45,
    );
  }

  private createStaticGeometry(geometry: StaticGeometryData): void {
    const rectangle = this.add
      .rectangle(
        geometry.x + geometry.width / 2,
        geometry.y + geometry.height / 2,
        geometry.width,
        geometry.height,
        SURFACE_COLORS[geometry.surface],
      )
      .setStrokeStyle(2, 0xcbd5e1, 0.7);

    rectangle.setData('levelEntityId', geometry.id);
    this.physics.add.existing(rectangle, true);

    if (geometry.purpose !== undefined && geometry.width >= 160) {
      this.add
        .text(geometry.x + 12, geometry.y + 10, geometry.purpose, {
          color: '#dbeafe',
          fontFamily: 'ui-monospace, monospace',
          fontSize: '14px',
          wordWrap: { width: geometry.width - 24 },
        })
        .setDepth(1);
    }
  }

  private createSpawnMarker(level: LevelData): void {
    const { x, y } = level.spawn;

    this.add.circle(x, y, 18, 0xfbbf24).setStrokeStyle(3, 0xfffbeb);
    this.add
      .text(x, y - 34, 'SPAWN', {
        color: '#fde68a',
        fontFamily: 'ui-monospace, monospace',
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }

  private createHud(level: LevelData): void {
    this.add
      .text(24, 24, `${level.name} · schema v${level.schemaVersion}`, {
        backgroundColor: '#080b16cc',
        color: '#eef4ff',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        fontSize: '20px',
        padding: { x: 12, y: 8 },
      })
      .setScrollFactor(0)
      .setDepth(10);
  }
}
