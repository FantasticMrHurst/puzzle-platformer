import Phaser from 'phaser';

import type { MovementDebugSnapshot } from '../../debug/MovementDebugSnapshot';
import { getCharacterDefinition } from '../../entities/CharacterCatalog';
import { CharacterRoster } from '../../entities/CharacterRoster';
import { PlayerCharacter } from '../../entities/PlayerCharacter';
import { KeyboardCharacterSelectionInput } from '../../input/KeyboardCharacterSelectionInput';
import { KeyboardInput } from '../../input/KeyboardInput';
import {
  NEUTRAL_PLAYER_INTENT,
  type PlayerIntent,
} from '../../input/PlayerIntent';
import testRoomSource from '../../levels/data/test-room.json';
import { loadLevelData } from '../../levels/LevelLoader';
import type {
  LevelData,
  StaticGeometryData,
  SurfaceKind,
} from '../../levels/LevelSchema';
import { MovementDebugOverlay } from '../../ui/MovementDebugOverlay';
import { FixedStepClock, GAMEPLAY_STEP_SECONDS } from '../FixedStepClock';
import { publishTestState } from '../TestProbe';

const SURFACE_COLORS: Readonly<Record<SurfaceKind, number>> = {
  ground: 0x334155,
  platform: 0x0f766e,
  wall: 0x7c3aed,
};
const GAMEPLAY_STEP_HZ = Math.round(1 / GAMEPLAY_STEP_SECONDS);

export class TestRoomScene extends Phaser.Scene {
  private readonly fixedStepClock = new FixedStepClock();
  private staticGeometry!: Phaser.Physics.Arcade.StaticGroup;
  private roster!: CharacterRoster<PlayerCharacter>;
  private keyboardInput!: KeyboardInput;
  private selectionInput!: KeyboardCharacterSelectionInput;
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
    this.selectionInput = new KeyboardCharacterSelectionInput(
      this.input.keyboard,
    );
    this.debugToggleKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.F3,
    );
    this.staticGeometry = this.physics.add.staticGroup();

    this.configureWorld(this.level);
    this.createBackdrop(this.level);
    this.level.staticGeometry.forEach((geometry) =>
      this.createStaticGeometry(geometry),
    );
    this.createSpawnMarkers(this.level);
    this.createCharacters(this.level);
    this.createHud(this.level);
    this.debugOverlay = new MovementDebugOverlay(this);
  }

  public override update(): void {
    this.totalRenderedFrames += 1;

    if (Phaser.Input.Keyboard.JustDown(this.debugToggleKey)) {
      this.debugOverlay.toggle();
    }

    this.captureSelectionInput();
    this.captureMovementInput();

    this.stepsThisFrame = this.fixedStepClock.advance(
      this.game.loop.rawDelta / 1_000,
      () => {
        const activeCharacter = this.roster.getActive();
        this.roster.getMembers().forEach((character) => {
          character.prepareSimulationStep(
            GAMEPLAY_STEP_SECONDS,
            character === activeCharacter
              ? this.pendingIntent
              : NEUTRAL_PLAYER_INTENT,
          );
        });
        this.clearConsumedInputEdges();
        this.totalSimulationSteps += 1;

        this.physics.world.singleStep();
        this.roster
          .getMembers()
          .forEach((character) => character.completeSimulationStep());

        if (
          this.roster
            .getMembers()
            .some((character) =>
              character.isBelow(this.level.world.height + 64),
            )
        ) {
          this.resetRoster();
        }
      },
    );
    const interpolationAlpha = this.fixedStepClock.getInterpolationAlpha();
    this.roster
      .getMembers()
      .forEach((character) => character.render(interpolationAlpha));

    const snapshot = this.createDebugSnapshot();
    this.debugOverlay.update(snapshot);
    publishTestState({
      scene: this.scene.key,
      debugOverlayVisible: this.debugOverlay.isVisible(),
      activeCharacterId: this.roster.getActive().id,
      roster: this.roster.getMembers().map((character) => ({
        id: character.id,
        active: character === this.roster.getActive(),
        position: character.getDebugState().position,
      })),
      movement: snapshot,
    });
  }

  private configureWorld(level: LevelData): void {
    const { width, height } = level.world;

    this.cameras.main.setBackgroundColor(level.world.backgroundColor);
    this.cameras.main.setBounds(0, 0, width, height);
    const initialSpawn = level.characters[0]!.spawn;
    this.cameras.main.centerOn(initialSpawn.x, initialSpawn.y);
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

  private createSpawnMarkers(level: LevelData): void {
    level.characters.forEach(({ spawn }, index) => {
      this.add
        .circle(spawn.x, spawn.y, 18, 0xfbbf24)
        .setStrokeStyle(3, 0xfffbeb);
      this.add
        .text(spawn.x, spawn.y + 48, `SPAWN ${index + 1}`, {
          color: '#fde68a',
          fontFamily: 'ui-monospace, monospace',
          fontSize: '12px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
    });
  }

  private createCharacters(level: LevelData): void {
    const characters = level.characters.map(({ archetype, id, spawn }) => {
      const character = new PlayerCharacter(
        this,
        id,
        spawn.x,
        spawn.y,
        getCharacterDefinition(archetype),
      );
      this.physics.add.collider(character.physicsObject, this.staticGeometry);
      return character;
    });

    this.roster = new CharacterRoster(characters);
    this.applyActiveSelection();
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
      .text(
        24,
        78,
        'Move: A/D or ←/→  ·  Jump: W, ↑, or Space  ·  Switch: 1–3 or Q/E',
        {
          backgroundColor: '#080b16cc',
          color: '#cbd5e1',
          fontFamily: 'ui-monospace, monospace',
          fontSize: '15px',
          padding: { x: 10, y: 6 },
        },
      )
      .setScrollFactor(0)
      .setDepth(10);

    const rosterText = this.roster
      .getMembers()
      .map((character, index) => `${index + 1} ${character.getLabel()}`)
      .join('  ·  ');
    this.add
      .text(24, 112, `Roster: ${rosterText}`, {
        backgroundColor: '#080b16cc',
        color: '#cbd5e1',
        fontFamily: 'ui-monospace, monospace',
        fontSize: '14px',
        padding: { x: 10, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(10);
  }

  private captureSelectionInput(): void {
    const selection = this.selectionInput.readIntent();
    const changed =
      selection.directSlot === undefined
        ? selection.cycleDirection !== 0 &&
          this.roster.cycle(selection.cycleDirection)
        : this.roster.selectSlot(selection.directSlot);

    if (changed) {
      this.pendingIntent = { ...NEUTRAL_PLAYER_INTENT };
      this.lastSampledIntent = { ...NEUTRAL_PLAYER_INTENT };
      this.applyActiveSelection();
    }
  }

  private captureMovementInput(): void {
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

  private applyActiveSelection(): void {
    const active = this.roster.getActive();
    this.roster
      .getMembers()
      .forEach((character) => character.setActive(character === active));
    this.cameras.main.startFollow(active.visualObject, true, 0.12, 0.12);
  }

  private resetRoster(): void {
    this.roster.getMembers().forEach((character, index) => {
      const spawn = this.level.characters[index]!.spawn;
      character.reset(spawn.x, spawn.y);
    });
    this.roster.selectSlot(0);
    this.applyActiveSelection();
    const initialSpawn = this.level.characters[0]!.spawn;
    this.cameras.main.centerOn(initialSpawn.x, initialSpawn.y);
    this.pendingIntent = { ...NEUTRAL_PLAYER_INTENT };
    this.lastSampledIntent = { ...NEUTRAL_PLAYER_INTENT };
  }

  private createDebugSnapshot(): MovementDebugSnapshot {
    const activeCharacter = this.roster.getActive();
    return {
      ...activeCharacter.getDebugState(),
      intent: this.lastSampledIntent,
      timing: {
        fixedStepHz: GAMEPLAY_STEP_HZ,
        stepsThisFrame: this.stepsThisFrame,
        totalSimulationSteps: this.totalSimulationSteps,
        totalRenderedFrames: this.totalRenderedFrames,
        renderedFramesPerSecond: this.game.loop.actualFps,
      },
      profileName: activeCharacter.getMovementProfileName(),
    };
  }
}
