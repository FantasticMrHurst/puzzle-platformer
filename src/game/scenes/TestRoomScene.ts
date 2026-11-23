import Phaser from 'phaser';

import type { MovementDebugSnapshot } from '../../debug/MovementDebugSnapshot';
import { PlayerCharacter } from '../../entities/PlayerCharacter';
import { KeyboardInput } from '../../input/KeyboardInput';
import type { PlayerIntent } from '../../input/PlayerIntent';
import testRoomSource from '../../levels/data/test-room.json';
import { loadLevelData } from '../../levels/LevelLoader';
import type {
  LevelData,
  StaticGeometryData,
  SurfaceKind,
} from '../../levels/LevelSchema';
import { DEFAULT_MOVEMENT_CONFIG } from '../../movement/MovementConfig';
import { MovementDebugOverlay } from '../../ui/MovementDebugOverlay';
import { FixedStepClock, GAMEPLAY_STEP_SECONDS } from '../FixedStepClock';
import { publishTestState } from '../TestProbe';

const SURFACE_COLORS: Readonly<Record<SurfaceKind, number>> = {
  ground: 0x334155,
  platform: 0x0f766e,
  wall: 0x7c3aed,
};
const MOVEMENT_PROFILE_NAME = 'baseline-v1';
const GAMEPLAY_STEP_HZ = Math.round(1 / GAMEPLAY_STEP_SECONDS);

export class TestRoomScene extends Phaser.Scene {
  private readonly fixedStepClock = new FixedStepClock();
  private staticGeometry!: Phaser.Physics.Arcade.StaticGroup;
  private character!: PlayerCharacter;
  private keyboardInput!: KeyboardInput;
  private level!: LevelData;
  private pendingIntent: PlayerIntent = {
    moveX: 0,
    jumpPressed: false,
    jumpHeld: false,
    jumpReleased: false,
  };
  private debugOverlay!: MovementDebugOverlay;
  private debugToggleKey!: Phaser.Input.Keyboard.Key;
  private lastSampledIntent: PlayerIntent = {
    moveX: 0,
    jumpPressed: false,
    jumpHeld: false,
    jumpReleased: false,
  };
  private stepsThisFrame = 0;
  private totalSimulationSteps = 0;
  private totalRenderedFrames = 0;

  public constructor() {
    super('test-room');
  }

  public create(): void {
    this.level = loadLevelData(testRoomSource, 'test-room.json');
    this.fixedStepClock.reset();

    if (this.input.keyboard === null) {
      throw new Error('Keyboard input is unavailable');
    }
    this.keyboardInput = new KeyboardInput(this.input.keyboard);
    this.debugToggleKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.F3,
    );
    this.staticGeometry = this.physics.add.staticGroup();

    this.configureWorld(this.level);
    this.createBackdrop(this.level);
    this.level.staticGeometry.forEach((geometry) =>
      this.createStaticGeometry(geometry),
    );
    this.createSpawnMarker(this.level);
    this.createCharacter(this.level);
    this.createHud(this.level);
    this.debugOverlay = new MovementDebugOverlay(this);
  }

  public override update(): void {
    this.totalRenderedFrames += 1;

    if (Phaser.Input.Keyboard.JustDown(this.debugToggleKey)) {
      this.debugOverlay.toggle();
    }

    this.captureInput();

    this.stepsThisFrame = this.fixedStepClock.advance(
      this.game.loop.rawDelta / 1_000,
      () => {
        this.character.prepareSimulationStep(
          GAMEPLAY_STEP_SECONDS,
          this.pendingIntent,
        );
        this.clearConsumedInputEdges();
        this.totalSimulationSteps += 1;

        this.physics.world.singleStep();
        this.character.completeSimulationStep();

        if (this.character.isBelow(this.level.world.height + 64)) {
          this.resetCharacter();
        }
      },
    );
    this.character.render(this.fixedStepClock.getInterpolationAlpha());

    const snapshot = this.createDebugSnapshot();
    this.debugOverlay.update(snapshot);
    publishTestState({
      scene: this.scene.key,
      debugOverlayVisible: this.debugOverlay.isVisible(),
      movement: snapshot,
    });
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
    this.staticGeometry.add(rectangle);

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

  private createCharacter(level: LevelData): void {
    this.character = new PlayerCharacter(
      this,
      level.spawn.x,
      level.spawn.y,
      DEFAULT_MOVEMENT_CONFIG,
    );
    this.physics.add.collider(
      this.character.physicsObject,
      this.staticGeometry,
    );

    this.cameras.main.startFollow(
      this.character.visualObject,
      true,
      0.12,
      0.12,
    );
    this.cameras.main.setDeadzone(360, 220);
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

    this.add
      .text(24, 78, 'Move: A/D or ←/→  ·  Jump: W, ↑, or Space', {
        backgroundColor: '#080b16cc',
        color: '#cbd5e1',
        fontFamily: 'ui-monospace, monospace',
        fontSize: '15px',
        padding: { x: 10, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(10);
  }

  private captureInput(): void {
    const intent = this.keyboardInput.readIntent();
    this.lastSampledIntent = intent;
    this.pendingIntent = {
      moveX: intent.moveX,
      jumpHeld: intent.jumpHeld,
      jumpPressed: this.pendingIntent.jumpPressed || intent.jumpPressed,
      jumpReleased: this.pendingIntent.jumpReleased || intent.jumpReleased,
    };
  }

  private clearConsumedInputEdges(): void {
    this.pendingIntent = {
      ...this.pendingIntent,
      jumpPressed: false,
      jumpReleased: false,
    };
  }

  private resetCharacter(): void {
    this.character.reset(this.level.spawn.x, this.level.spawn.y);
    this.cameras.main.centerOn(this.level.spawn.x, this.level.spawn.y);
    this.pendingIntent = {
      moveX: 0,
      jumpPressed: false,
      jumpHeld: false,
      jumpReleased: false,
    };
  }

  private createDebugSnapshot(): MovementDebugSnapshot {
    return {
      ...this.character.getDebugState(),
      intent: this.lastSampledIntent,
      timing: {
        fixedStepHz: GAMEPLAY_STEP_HZ,
        stepsThisFrame: this.stepsThisFrame,
        totalSimulationSteps: this.totalSimulationSteps,
        totalRenderedFrames: this.totalRenderedFrames,
        renderedFramesPerSecond: this.game.loop.actualFps,
      },
      profileName: MOVEMENT_PROFILE_NAME,
    };
  }
}
