import Phaser from 'phaser';

import type { MovementDebugSnapshot } from '../../debug/MovementDebugSnapshot';
import { calculateExitProgress } from '../../environment/ExitProgress';
import { Gate } from '../../environment/Gate';
import { GrowthNode } from '../../environment/GrowthNode';
import { LevelExit } from '../../environment/LevelExit';
import { MechanismConsole } from '../../environment/MechanismConsole';
import { PoweredBridge } from '../../environment/PoweredBridge';
import { PlantStructure } from '../../environment/PlantStructure';
import { TinkererPlugPuzzle } from '../../environment/TinkererPlugPuzzle';
import { PressurePlate } from '../../environment/PressurePlate';
import { PushableBlock } from '../../environment/PushableBlock';
import { ToggleSwitch } from '../../environment/ToggleSwitch';
import { getCharacterDefinition } from '../../entities/CharacterCatalog';
import { CharacterRoster } from '../../entities/CharacterRoster';
import { PlayerCharacter } from '../../entities/PlayerCharacter';
import { TinkererCompanion } from '../../entities/TinkererCompanion';
import { RangerShot } from '../../entities/RangerShot';
import { RangedTarget } from '../../environment/RangedTarget';
import { NEUTRAL_AIM_INTENT, type AimIntent } from '../../input/AimIntent';
import { KeyboardAimInput } from '../../input/KeyboardAimInput';
import { KeyboardAbilityInput } from '../../input/KeyboardAbilityInput';
import { KeyboardGrabInput } from '../../input/KeyboardGrabInput';
import { KeyboardCharacterSelectionInput } from '../../input/KeyboardCharacterSelectionInput';
import { KeyboardInput } from '../../input/KeyboardInput';
import { KeyboardRoomInput } from '../../input/KeyboardRoomInput';
import {
  NEUTRAL_PLAYER_INTENT,
  type PlayerIntent,
  type RawPlayerInput,
} from '../../input/PlayerIntent';
import { StandardGamepadInput } from '../../input/StandardGamepadInput';
import { getLevelSource } from '../../levels/LevelCatalog';
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
  private tinkererCompanions: TinkererCompanion[] = [];
  private keyboardInput!: KeyboardInput;
  private aimInput!: KeyboardAimInput;
  private abilityInput!: KeyboardAbilityInput;
  private grabInput!: KeyboardGrabInput;
  private selectionInput!: KeyboardCharacterSelectionInput;
  private roomInput!: KeyboardRoomInput;
  private gamepadInput?: StandardGamepadInput;
  private gamepadPrimaryHeld = false;
  private level!: LevelData;
  private exitPresentation!: LevelExit;
  private pressurePlates: PressurePlate[] = [];
  private toggleSwitches: ToggleSwitch[] = [];
  private gates: Gate[] = [];
  private pushableBlocks: PushableBlock[] = [];
  private mechanismConsoles: MechanismConsole[] = [];
  private poweredBridges: PoweredBridge[] = [];
  private rangedTargets: RangedTarget[] = [];
  private rangerShots: RangerShot[] = [];
  private growthNodes: GrowthNode[] = [];
  private plantStructures: PlantStructure[] = [];
  private tinkererPlugPuzzles: TinkererPlugPuzzle[] = [];
  private completionText!: Phaser.GameObjects.Text;
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
  private exitArrivedCount = 0;
  private roomComplete = false;
  private primaryAbilityHeld = false;
  private primaryAbilityPressed = false;
  private grabPressed = false;
  private aimIntent: AimIntent = NEUTRAL_AIM_INTENT;

  public constructor() {
    super('test-room');
  }

  public create(): void {
    const selectedLevel = getLevelSource(
      new URLSearchParams(window.location.search).get('level'),
    );
    this.level = loadLevelData(selectedLevel.data, selectedLevel.source);
    this.gamepadInput =
      this.level.id === 'relay-station'
        ? new StandardGamepadInput()
        : undefined;
    this.fixedStepClock.reset();

    if (this.input.keyboard === null) {
      throw new Error('Keyboard input is unavailable');
    }
    this.keyboardInput = new KeyboardInput(this.input.keyboard);
    this.aimInput = new KeyboardAimInput(this.input.keyboard);
    this.abilityInput = new KeyboardAbilityInput(this.input.keyboard);
    this.grabInput = new KeyboardGrabInput(this.input.keyboard);
    this.selectionInput = new KeyboardCharacterSelectionInput(
      this.input.keyboard,
    );
    this.roomInput = new KeyboardRoomInput(this.input.keyboard);
    this.debugToggleKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.F3,
    );
    this.staticGeometry = this.physics.add.staticGroup();

    this.configureWorld(this.level);
    this.createBackdrop(this.level);
    this.level.staticGeometry.forEach((geometry) =>
      this.createStaticGeometry(geometry),
    );
    this.pressurePlates = this.level.pressurePlates.map(
      (plate) => new PressurePlate(this, plate),
    );
    this.toggleSwitches = this.level.toggleSwitches.map(
      (toggle) => new ToggleSwitch(this, toggle),
    );
    this.gates = this.level.gates.map((gate) => new Gate(this, gate));
    this.pushableBlocks = this.level.pushableBlocks.map(
      (block) => new PushableBlock(this, block),
    );
    this.mechanismConsoles = this.level.mechanismConsoles.map(
      (consoleData) => new MechanismConsole(this, consoleData),
    );
    this.poweredBridges = this.level.poweredBridges.map(
      (bridge) => new PoweredBridge(this, bridge),
    );
    this.rangedTargets = this.level.rangedTargets.map(
      (target) => new RangedTarget(this, target),
    );
    this.growthNodes = this.level.growthNodes.map(
      (node) => new GrowthNode(this, node),
    );
    this.plantStructures = this.level.plantStructures.map(
      (structure) => new PlantStructure(this, structure),
    );
    this.tinkererPlugPuzzles = this.level.tinkererPlugs.map((plug) => {
      const groundY = this.level.staticGeometry
        .filter(
          (geometry) =>
            geometry.surface === 'ground' &&
            plug.plugStart.x >= geometry.x &&
            plug.plugStart.x <= geometry.x + geometry.width,
        )
        .map(({ y }) => y)
        .sort((a, b) => a - b)[0];
      return new TinkererPlugPuzzle(
        this,
        plug,
        groundY ?? this.level.world.height,
      );
    });
    this.exitPresentation = new LevelExit(
      this,
      this.level.exit,
      this.level.characters.length,
    );
    this.createSpawnMarkers(this.level);
    this.createCharacters(this.level);
    this.updateGates();
    this.createHud(this.level);
    this.debugOverlay = new MovementDebugOverlay(this);
  }

  public override update(): void {
    this.totalRenderedFrames += 1;
    const gamepad = this.gamepadInput?.sample();
    this.gamepadPrimaryHeld = gamepad?.primaryHeld ?? false;

    if (Phaser.Input.Keyboard.JustDown(this.debugToggleKey)) {
      this.debugOverlay.toggle();
    }
    const reset =
      this.roomInput.readIntent().resetPressed || gamepad?.resetPressed;
    if (reset) {
      this.resetRoomToCheckpoint();
    }

    this.captureSelectionInput(reset ? 0 : gamepad?.cycleDirection);
    this.captureMovementInput(gamepad?.movement);
    this.aimIntent = this.aimInput.readIntent();
    const wasPrimaryHeld = this.primaryAbilityHeld;
    this.primaryAbilityHeld = this.abilityInput.readPrimaryHeld(
      this.gamepadPrimaryHeld,
    );
    const primaryPressed = this.abilityInput.readPrimaryPressed(
      gamepad?.primaryPressed,
    );
    this.primaryAbilityPressed ||=
      primaryPressed && (!wasPrimaryHeld || !this.gamepadPrimaryHeld);
    this.grabPressed = this.grabPressed || this.grabInput.readPressed();

    this.stepsThisFrame = this.fixedStepClock.advance(
      this.game.loop.rawDelta / 1_000,
      () => {
        const activeCharacter = this.roster.getActive();
        this.applyPrimaryAbility(activeCharacter);
        this.toggleSwitches.forEach((toggle) => toggle.update(activeCharacter));
        this.roster.getMembers().forEach((character) => {
          character.prepareSimulationStep(
            GAMEPLAY_STEP_SECONDS,
            character === activeCharacter
              ? this.pendingIntent
              : NEUTRAL_PLAYER_INTENT,
          );
        });
        this.tinkererCompanions.forEach((companion) =>
          companion.prepareSimulationStep(GAMEPLAY_STEP_SECONDS),
        );
        const moveX = this.pendingIntent.moveX;
        let gripDirection: -1 | 0 | 1 = 0;
        for (const block of this.pushableBlocks) {
          block.prepareStep(
            this.isSignalActive(block.data.channel),
            activeCharacter,
            moveX,
            this.primaryAbilityHeld,
          );
          gripDirection ||= block.getGripDirection(activeCharacter.id);
        }
        this.mechanismConsoles.forEach((consoleObject) =>
          consoleObject.update(activeCharacter),
        );
        this.growthNodes.forEach((node) => node.update(activeCharacter));
        this.rangerShots = this.rangerShots.filter((shot) =>
          shot.advance(GAMEPLAY_STEP_SECONDS, this.rangedTargets),
        );
        this.poweredBridges.forEach((bridge) =>
          bridge.setExtended(this.isSignalActive(bridge.data.channel)),
        );
        this.plantStructures.forEach((structure) =>
          structure.setGrown(
            this.growthNodes.some(
              (node) =>
                node.data.channel === structure.data.channel && node.isGrown(),
            ),
          ),
        );
        this.totalSimulationSteps += 1;

        this.physics.world.singleStep();
        this.roster
          .getMembers()
          .forEach((character) =>
            character.completeSimulationStep(
              GAMEPLAY_STEP_SECONDS,
              character === activeCharacter ? gripDirection : 0,
              character === activeCharacter ? moveX : 0,
            ),
          );
        this.tinkererCompanions.forEach((companion) =>
          companion.completeSimulationStep(GAMEPLAY_STEP_SECONDS),
        );
        for (const puzzle of this.tinkererPlugPuzzles) {
          const consumed = puzzle.update(
            activeCharacter,
            this.grabPressed,
            GAMEPLAY_STEP_SECONDS,
          );
          if (consumed) this.grabPressed = false;
        }
        this.clearConsumedInputEdges();
        this.pushableBlocks.forEach((block) => block.completeStep());
        this.pressurePlates.forEach((plate) =>
          plate.update(this.roster.getMembers()),
        );
        this.updateGates();

        if (
          this.roster
            .getMembers()
            .some((character) =>
              character.isBelow(this.level.world.height + 64),
            )
        ) {
          this.resetRoomToCheckpoint();
        } else {
          this.updateExitProgress();
        }
      },
    );
    const interpolationAlpha = this.fixedStepClock.getInterpolationAlpha();
    this.roster
      .getMembers()
      .forEach((character) => character.render(interpolationAlpha));
    this.tinkererCompanions.forEach((companion) => companion.render());
    this.tinkererPlugPuzzles.forEach((puzzle) => puzzle.render());

    const snapshot = this.createDebugSnapshot();
    this.debugOverlay.update(snapshot);
    publishTestState({
      scene: this.scene.key,
      debugOverlayVisible: this.debugOverlay.isVisible(),
      activeCharacterId: this.roster.getActive().id,
      roomComplete: this.roomComplete,
      exit: {
        arrivedCount: this.exitArrivedCount,
        requiredCount: this.roster.getMembers().length,
      },
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
      this.gates.forEach((gate) =>
        this.physics.add.collider(character.physicsObject, gate.physicsObject),
      );
      this.pushableBlocks.forEach((block) =>
        this.physics.add.collider(character.physicsObject, block.physicsObject),
      );
      this.poweredBridges.forEach((bridge) =>
        this.physics.add.collider(
          character.physicsObject,
          bridge.physicsObject,
        ),
      );
      this.plantStructures.forEach((structure) =>
        this.physics.add.collider(
          character.physicsObject,
          structure.physicsObject,
        ),
      );
      return character;
    });

    this.roster = new CharacterRoster(characters);
    this.tinkererCompanions = characters
      .filter((character) => character.getArchetype() === 'tinkerer')
      .map((tinkerer) => new TinkererCompanion(this, tinkerer));
    const brute = characters.find(
      (character) => character.getArchetype() === 'brute',
    );
    if (brute !== undefined) {
      characters
        .filter((character) => character !== brute)
        .forEach((character) =>
          this.physics.add.collider(
            character.physicsObject,
            brute.physicsObject,
            undefined,
            () => this.canUseBruteAsPlatform(character, brute),
          ),
        );
    }
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
        `Move: A/D or ←/→  ·  Jump: W, ↑, or Space  ·  Ability: F${
          this.tinkererPlugPuzzles.length > 0 ? '  ·  Grab/place: C' : ''
        }${
          level.characters.some(({ archetype }) => archetype === 'ranger')
            ? '  ·  Aim: I/J/K/L'
            : ''
        }  ·  Switch: 1–3 or Q/E  ·  Reset: R`,
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

    this.completionText = this.add
      .text(
        this.scale.width / 2,
        196,
        'ROOM COMPLETE · ALL CHARACTERS ARRIVED',
        {
          backgroundColor: '#14532ddd',
          color: '#dcfce7',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          fontSize: '24px',
          fontStyle: 'bold',
          padding: { x: 18, y: 10 },
        },
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(20)
      .setVisible(false);

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

    if (this.gamepadInput !== undefined) {
      this.add
        .text(
          24,
          176,
          'Controller: D-pad/stick move · Cross jump · Square ability · L1/R1 switch · Options reset',
          {
            backgroundColor: '#080b16cc',
            color: '#cbd5e1',
            fontFamily: 'ui-monospace, monospace',
            fontSize: '13px',
            padding: { x: 10, y: 6 },
          },
        )
        .setScrollFactor(0)
        .setDepth(10);
    }

    const mixedLabHint =
      level.id === 'relay-station'
        ? 'Restore the service crossing and get the whole crew through the exit airlock.'
        : level.id === 'cooperation-lab'
          ? 'Ranger opens the first crossing · Gardener grows a step · Tinkerer powers the final crossing'
          : level.id === 'pilot-brute-ranger-lab'
            ? 'Pilot: unlock block · Brute: push, then brace on teal strip · Ranger: climb on Brute, hold L, tap F'
            : level.id === 'gate-lab'
              ? 'Hold the plate for a teammate · That teammate can toggle the far switch with F'
              : undefined;
    if (mixedLabHint !== undefined) {
      this.add
        .text(24, 148, mixedLabHint, {
          backgroundColor: '#080b16cc',
          color: '#cbd5e1',
          fontFamily: 'ui-monospace, monospace',
          fontSize: '13px',
          padding: { x: 10, y: 6 },
        })
        .setScrollFactor(0)
        .setDepth(10);
      return;
    }

    if (this.pressurePlates.length > 0) {
      this.add
        .text(
          24,
          148,
          'Sequence: Pilot holds plate  ·  Brute holds F to push/pull ↔ or taps F to brace  ·  Pet takes low tunnel',
          {
            backgroundColor: '#080b16cc',
            color: '#fde68a',
            fontFamily: 'ui-monospace, monospace',
            fontSize: '13px',
            padding: { x: 10, y: 6 },
          },
        )
        .setScrollFactor(0)
        .setDepth(10);
    }
    if (this.mechanismConsoles.length > 0) {
      this.add
        .text(
          24,
          148,
          'Sequence: Tinkerer approaches console and presses F  ·  Powered bridge carries the full roster',
          {
            backgroundColor: '#080b16cc',
            color: '#93c5fd',
            fontFamily: 'ui-monospace, monospace',
            fontSize: '13px',
            padding: { x: 10, y: 6 },
          },
        )
        .setScrollFactor(0)
        .setDepth(10);
    }
    if (this.rangedTargets.length > 0) {
      this.add
        .text(
          24,
          148,
          'Sequence: Ranger holds L and presses F  ·  Hit the remote target  ·  Cross with the full roster',
          {
            backgroundColor: '#080b16cc',
            color: '#fde047',
            fontFamily: 'ui-monospace, monospace',
            fontSize: '13px',
            padding: { x: 10, y: 6 },
          },
        )
        .setScrollFactor(0)
        .setDepth(10);
    }
    if (this.growthNodes.length > 0) {
      this.add
        .text(
          24,
          148,
          'Sequence: Gardener approaches seed bed and presses F  ·  Living platform creates a team route',
          {
            backgroundColor: '#080b16cc',
            color: '#bef264',
            fontFamily: 'ui-monospace, monospace',
            fontSize: '13px',
            padding: { x: 10, y: 6 },
          },
        )
        .setScrollFactor(0)
        .setDepth(10);
    }
    if (this.tinkererPlugPuzzles.length > 0) {
      this.add
        .text(
          24,
          148,
          'Sequence: Tinkerer presses C to grab · presses C again to place the red plug in the matching outlet',
          {
            backgroundColor: '#080b16cc',
            color: '#fca5a5',
            fontFamily: 'ui-monospace, monospace',
            fontSize: '13px',
            padding: { x: 10, y: 6 },
          },
        )
        .setScrollFactor(0)
        .setDepth(10);
    }
  }

  private captureSelectionInput(gamepadDirection: -1 | 0 | 1 = 0): void {
    const selection = this.selectionInput.readIntent();
    const direction = selection.cycleDirection || gamepadDirection;
    const changed =
      selection.directSlot === undefined
        ? direction !== 0 && this.roster.cycle(direction)
        : this.roster.selectSlot(selection.directSlot);

    if (changed) {
      this.pendingIntent = { ...NEUTRAL_PLAYER_INTENT };
      this.lastSampledIntent = { ...NEUTRAL_PLAYER_INTENT };
      this.primaryAbilityHeld = false;
      this.primaryAbilityPressed = false;
      this.abilityInput.suppressUntilReleased(this.gamepadPrimaryHeld);
      this.grabPressed = false;
      this.grabInput.suppressUntilReleased();
      this.applyActiveSelection();
    }
  }

  private captureMovementInput(additionalInput?: RawPlayerInput): void {
    const intent = this.keyboardInput.readIntent(additionalInput);
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
    this.primaryAbilityPressed = false;
    this.grabPressed = false;
  }

  private applyPrimaryAbility(activeCharacter: PlayerCharacter): void {
    if (!this.primaryAbilityPressed) {
      return;
    }

    if (
      this.toggleSwitches.some((toggle) => toggle.tryToggle(activeCharacter))
    ) {
      this.primaryAbilityHeld = false;
      this.abilityInput.suppressUntilReleased(this.gamepadPrimaryHeld);
      return;
    }

    if (activeCharacter.getArchetype() === 'tinkerer') {
      this.mechanismConsoles.some((consoleObject) =>
        consoleObject.tryToggle(activeCharacter),
      );
      return;
    }

    if (activeCharacter.getArchetype() === 'ranger') {
      if (this.aimIntent.x !== 0 || this.aimIntent.y !== 0) {
        const origin = activeCharacter.getDebugState().position;
        this.rangerShots.push(
          new RangerShot(
            this,
            origin.x + this.aimIntent.x * 32,
            origin.y + this.aimIntent.y * 32,
            this.aimIntent,
          ),
        );
      }
      return;
    }

    if (activeCharacter.getArchetype() === 'gardener') {
      this.growthNodes.some((node) => node.tryToggle(activeCharacter));
      return;
    }

    if (activeCharacter.getArchetype() !== 'brute') {
      return;
    }

    const canGripBlock =
      !activeCharacter.isBraced() &&
      this.pushableBlocks.some((block) =>
        block.canStartGrip(
          this.isSignalActive(block.data.channel),
          activeCharacter,
        ),
      );
    if (!canGripBlock) {
      activeCharacter.toggleBraceStance();
    }
  }

  private canUseBruteAsPlatform(
    character: PlayerCharacter,
    brute: PlayerCharacter,
  ): boolean {
    if (!brute.isBraced()) {
      return false;
    }

    const characterBody = character.physicsObject.body;
    const bruteBody = brute.physicsObject.body;
    if (
      !(characterBody instanceof Phaser.Physics.Arcade.Body) ||
      !(bruteBody instanceof Phaser.Physics.Arcade.Body)
    ) {
      return false;
    }

    const landingTolerance = Math.max(
      12,
      characterBody.velocity.y * GAMEPLAY_STEP_SECONDS + 2,
    );
    return (
      characterBody.velocity.y >= 0 &&
      characterBody.bottom <= bruteBody.top + landingTolerance
    );
  }

  private applyActiveSelection(): void {
    const active = this.roster.getActive();
    this.roster
      .getMembers()
      .forEach((character) => character.setActive(character === active));
    this.cameras.main.startFollow(active.visualObject, true, 0.12, 0.12);
  }

  private resetRoomToCheckpoint(): void {
    this.roster.getMembers().forEach((character, index) => {
      const spawn = this.level.characters[index]!.spawn;
      character.reset(spawn.x, spawn.y);
    });
    this.tinkererCompanions.forEach((companion) => companion.reset());
    this.roster.selectSlot(0);
    this.applyActiveSelection();
    const initialSpawn = this.level.characters[0]!.spawn;
    this.cameras.main.centerOn(initialSpawn.x, initialSpawn.y);
    this.pendingIntent = { ...NEUTRAL_PLAYER_INTENT };
    this.lastSampledIntent = { ...NEUTRAL_PLAYER_INTENT };
    this.primaryAbilityHeld = false;
    this.primaryAbilityPressed = false;
    this.abilityInput.suppressUntilReleased(this.gamepadPrimaryHeld);
    this.grabPressed = false;
    this.grabInput.suppressUntilReleased();
    this.exitArrivedCount = 0;
    this.roomComplete = false;
    this.exitPresentation.reset();
    this.pressurePlates.forEach((plate) => plate.reset());
    this.toggleSwitches.forEach((toggle) => toggle.reset());
    this.pushableBlocks.forEach((block) => block.reset());
    this.mechanismConsoles.forEach((consoleObject) => consoleObject.reset());
    this.poweredBridges.forEach((bridge) => bridge.reset());
    this.rangedTargets.forEach((target) => target.reset());
    this.growthNodes.forEach((node) => node.reset());
    this.plantStructures.forEach((structure) => structure.reset());
    this.tinkererPlugPuzzles.forEach((puzzle) => puzzle.reset());
    this.updateGates();
    this.rangerShots.forEach((shot) => shot.destroy());
    this.rangerShots = [];
    this.aimIntent = NEUTRAL_AIM_INTENT;
    this.completionText?.setVisible(false);
  }

  private isSignalActive(channel: string): boolean {
    return (
      this.pressurePlates.some(
        (plate) => plate.data.channel === channel && plate.isPressed(),
      ) ||
      this.toggleSwitches.some(
        (toggle) => toggle.data.channel === channel && toggle.isActive(),
      ) ||
      this.mechanismConsoles.some(
        (consoleObject) =>
          consoleObject.data.channel === channel && consoleObject.isPowered(),
      ) ||
      this.rangedTargets.some(
        (target) => target.data.channel === channel && target.isActive(),
      )
    );
  }

  private updateGates(): void {
    this.gates.forEach((gate) =>
      gate.update(
        this.isSignalActive(gate.data.channel),
        this.roster.getMembers(),
      ),
    );
  }

  private updateExitProgress(): void {
    if (this.roomComplete) {
      return;
    }

    const progress = calculateExitProgress(
      this.level.exit,
      this.roster.getMembers().map((character) => ({
        id: character.id,
        position: character.getDebugState().position,
      })),
    );
    this.exitArrivedCount = progress.arrivedCount;
    this.exitPresentation.setProgress(progress.arrivedCount, progress.complete);

    if (progress.complete) {
      this.roomComplete = true;
      this.completionText.setVisible(true);
    }
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
