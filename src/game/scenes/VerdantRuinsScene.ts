import Phaser from 'phaser';

import { RedExplorer } from '../../entities/RedExplorer';
import { CarryCrate } from '../../environment/CarryCrate';
import { Gate } from '../../environment/Gate';
import { PressurePlate } from '../../environment/PressurePlate';
import { ToggleSwitch } from '../../environment/ToggleSwitch';
import { KeyboardAbilityInput } from '../../input/KeyboardAbilityInput';
import {
  NEUTRAL_PLAYER_INTENT,
  type PlayerIntent,
} from '../../input/PlayerIntent';
import { PlayerIntentMapper } from '../../input/PlayerIntentMapper';
import {
  FOREST_ROUTE,
  FOREST_TERRAIN,
  TILE_SIZE,
  VERDANT_RUINS_ID,
  VERDANT_RUINS_NAME,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../../levels/verdantRuins';
import {
  forestTexture,
  preloadForestArt,
  VerdantRuinsArt,
} from '../../rendering/VerdantRuinsArt';
import { FixedStepClock, GAMEPLAY_STEP_SECONDS } from '../FixedStepClock';

const SAFE_LANDING_SPEED = 475;
const BRIDGE_SURFACE_OFFSET = 2;
const BRIDGE_THICKNESS = 9;
const PLATFORM_TOP = FOREST_ROUTE.platform.y + BRIDGE_SURFACE_OFFSET;
const TUNNEL_FLOOR = FOREST_ROUTE.exit.y + FOREST_ROUTE.exit.height;
const SUPPLY_CHANNEL = 'ladder-access';
const EXIT_CHANNEL = 'exit-airlock';

type Bounds = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

export class VerdantRuinsScene extends Phaser.Scene {
  private readonly clock = new FixedStepClock();
  private readonly mapper = new PlayerIntentMapper();
  private readonly ladder = toRectangle(FOREST_ROUTE.ladder);
  private readonly spikes = toRectangle(FOREST_ROUTE.spikes);
  private readonly exit = toRectangle(FOREST_ROUTE.exit);
  private keys!: Record<
    'a' | 'd' | 'left' | 'right' | 'w' | 's' | 'up' | 'down' | 'space' | 'r',
    Phaser.Input.Keyboard.Key
  >;
  private ability!: KeyboardAbilityInput;
  private explorer!: RedExplorer;
  private crate!: CarryCrate;
  private supplyGate!: Gate;
  private exitGate!: Gate;
  private plate!: PressurePlate;
  private lever!: ToggleSwitch;
  private art!: VerdantRuinsArt;
  private status!: Phaser.GameObjects.Text;
  private solids: Phaser.GameObjects.Rectangle[] = [];
  private pending: PlayerIntent = NEUTRAL_PLAYER_INTENT;
  private interactPressed = false;
  private reachedPlatform = false;
  private finished = false;
  private retriedDescent = false;

  public constructor() {
    super(VERDANT_RUINS_ID);
  }

  public preload(): void {
    preloadForestArt(this);
  }

  public create(): void {
    const keyboard = this.input.keyboard;
    if (keyboard === null)
      throw new Error('The forest lab needs keyboard input');
    const codes = Phaser.Input.Keyboard.KeyCodes;
    this.keys = keyboard.addKeys({
      a: codes.A,
      d: codes.D,
      left: codes.LEFT,
      right: codes.RIGHT,
      w: codes.W,
      s: codes.S,
      up: codes.UP,
      down: codes.DOWN,
      space: codes.SPACE,
      r: codes.R,
    }) as typeof this.keys;
    this.ability = new KeyboardAbilityInput(keyboard);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.art = new VerdantRuinsArt(this);
    this.solids = FOREST_TERRAIN.map((region) => this.addSolid(region));

    const {
      playerStart,
      crateStart,
      supplyGate,
      exitGate,
      plate,
      lever,
      platform,
    } = FOREST_ROUTE;
    this.explorer = new RedExplorer(this, playerStart.x, playerStart.feetY);
    this.crate = new CarryCrate(
      this,
      forestTexture('push_crate'),
      crateStart,
      TILE_SIZE,
    );
    const gateArt = {
      off: forestTexture('gate_closed'),
      on: forestTexture('gate_open'),
    };
    this.supplyGate = new Gate(
      this,
      { ...supplyGate, id: 'supply-gate', channel: SUPPLY_CHANNEL },
      gateArt,
    );
    this.exitGate = new Gate(
      this,
      { ...exitGate, id: 'exit-gate', channel: EXIT_CHANNEL },
      gateArt,
    );
    this.plate = new PressurePlate(
      this,
      { ...plate, id: 'crate-plate', channel: SUPPLY_CHANNEL },
      {
        off: forestTexture('pressure_plate_up'),
        on: forestTexture('pressure_plate_down'),
      },
    );
    this.lever = new ToggleSwitch(
      this,
      {
        ...lever,
        id: 'exit-lever',
        channel: EXIT_CHANNEL,
        initiallyActive: false,
        interactionRange: TILE_SIZE,
      },
      { off: forestTexture('lever_off'), on: forestTexture('lever_on') },
    );
    const bridge = this.addSolid({
      ...platform,
      y: PLATFORM_TOP,
      height: BRIDGE_THICKNESS,
    });
    const collisionTargets = [
      ...this.solids,
      this.supplyGate.physicsObject,
      this.exitGate.physicsObject,
    ];
    this.physics.add.collider(this.explorer.physicsObject, collisionTargets);
    this.physics.add.collider(this.crate.physicsObject, collisionTargets);
    this.physics.add.collider(
      this.explorer.physicsObject,
      this.crate.physicsObject,
    );
    this.physics.add.collider(this.crate.physicsObject, bridge, undefined, () =>
      this.onBridgeSurface(this.crate.body),
    );
    this.physics.add.collider(
      this.explorer.physicsObject,
      bridge,
      undefined,
      () => !this.explorer.climbing && this.onBridgeSurface(this.explorer.body),
    );

    this.add
      .rectangle(
        this.exit.centerX,
        this.exit.centerY,
        this.exit.width,
        this.exit.height,
        0x85e3ac,
        0.12,
      )
      .setStrokeStyle(1, 0xa0e5bd)
      .setDepth(-1);
    this.add
      .text(this.exit.centerX, this.exit.y + 6, 'EXIT', {
        color: '#e8ffe7',
        fontSize: '10px',
      })
      .setOrigin(0.5, 0)
      .setDepth(5);
    this.createHud();

    const camera = this.cameras.main;
    camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    camera.startFollow(this.explorer.sprite, true, 0.13, 0.14, 0, 56);
    camera.setDeadzone(196, 92);
    camera.centerOn(playerStart.x, playerStart.feetY - 56);
    this.updateSignals();
    this.updateStatus();
  }

  public override update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.r)) this.reset();
    const next = this.mapper.map({
      moveLeft: this.keys.a.isDown || this.keys.left.isDown,
      moveRight: this.keys.d.isDown || this.keys.right.isDown,
      jump: this.keys.space.isDown,
    });
    this.pending = {
      ...next,
      jumpPressed: next.jumpPressed || this.pending.jumpPressed,
      jumpReleased: next.jumpReleased || this.pending.jumpReleased,
    };
    this.ability.readPrimaryHeld();
    this.interactPressed =
      this.ability.readPrimaryPressed() || this.interactPressed;
    const up = this.keys.w.isDown || this.keys.up.isDown;
    const down = this.keys.s.isDown || this.keys.down.isDown;
    this.clock.advance(this.game.loop.rawDelta / 1000, () =>
      this.step(Number(down) - Number(up)),
    );
    this.explorer.render(this.clock.getInterpolationAlpha(), this.crate.held);
    this.crate.render(this.explorer);
    this.art.update(this.cameras.main.scrollX);
    this.updateStatus();
  }

  private step(climbAxis: number): void {
    if (this.finished) return;
    if (this.interactPressed && !this.lever.tryToggle(this.explorer)) {
      this.crate.interact(this.explorer, (bounds) => this.canDropCrate(bounds));
    }
    this.interactPressed = false;
    const body = this.explorer.body;
    const previousFeet = body.bottom;
    this.explorer.prepare(
      GAMEPLAY_STEP_SECONDS,
      this.pending,
      this.crate.held ? 0 : climbAxis,
      this.ladder,
      PLATFORM_TOP,
    );
    const descentSpeed = body.velocity.y;
    this.pending = { ...this.pending, jumpPressed: false, jumpReleased: false };
    this.physics.world.singleStep();
    this.explorer.complete();
    this.updateSignals();

    if (
      body.center.x >= FOREST_ROUTE.platform.x &&
      body.center.x <= FOREST_ROUTE.platform.x + FOREST_ROUTE.platform.width &&
      body.bottom <= PLATFORM_TOP + 1 &&
      this.explorer.isGrounded()
    ) {
      this.reachedPlatform = true;
    }
    const hardLanding =
      body.center.x >= FOREST_ROUTE.descent.x &&
      body.center.x <=
        FOREST_ROUTE.descent.x + FOREST_ROUTE.descent.width + TILE_SIZE * 3 &&
      previousFeet < TUNNEL_FLOOR - 1 &&
      body.bottom >= TUNNEL_FLOOR - 1 &&
      descentSpeed > SAFE_LANDING_SPEED;
    if (
      hardLanding ||
      Phaser.Geom.Intersects.RectangleToRectangle(
        this.spikes,
        this.explorer.physicsObject.getBounds(),
      ) ||
      body.top > WORLD_HEIGHT
    ) {
      this.resetAfterFall();
    } else if (
      this.lever.isActive() &&
      this.exit.contains(body.center.x, body.center.y)
    ) {
      this.finished = true;
    }
    this.lever.update(this.explorer);
  }

  private updateSignals(): void {
    const weights = this.crate.held
      ? [this.explorer]
      : [this.explorer, this.crate];
    this.plate.update(weights);
    this.supplyGate.update(this.plate.isPressed(), weights);
    this.exitGate.update(this.lever.isActive(), weights);
  }

  private canDropCrate(bounds: Phaser.Geom.Rectangle): boolean {
    return (
      bounds.left >= 0 &&
      bounds.right <= WORLD_WIDTH &&
      ![
        ...this.solids,
        this.supplyGate.physicsObject,
        this.exitGate.physicsObject,
      ].some(
        (object) =>
          object.body instanceof Phaser.Physics.Arcade.StaticBody &&
          object.body.enable &&
          Phaser.Geom.Intersects.RectangleToRectangle(
            bounds,
            object.getBounds(),
          ),
      )
    );
  }

  private onBridgeSurface(body: Phaser.Physics.Arcade.Body): boolean {
    return (
      body.velocity.y >= 0 && body.prev.y + body.height <= PLATFORM_TOP + 1
    );
  }

  private addSolid(bounds: Bounds): Phaser.GameObjects.Rectangle {
    const object = this.add
      .rectangle(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height / 2,
        bounds.width,
        bounds.height,
      )
      .setVisible(false);
    this.physics.add.existing(object, true);
    return object;
  }

  private createHud(): void {
    this.add
      .text(14, 12, VERDANT_RUINS_NAME, {
        fontFamily: 'ui-monospace, monospace',
        fontSize: '16px',
        color: '#f3f6df',
        backgroundColor: '#14252a',
        padding: { x: 8, y: 5 },
      })
      .setScrollFactor(0)
      .setDepth(20);
    this.add
      .text(
        14,
        41,
        'A/D Move   SPACE Jump   W/S Climb   F Interact   R Reset',
        {
          fontFamily: 'ui-monospace, monospace',
          fontSize: '11px',
          color: '#d2ebd9',
          backgroundColor: '#14252a',
          padding: { x: 8, y: 4 },
        },
      )
      .setScrollFactor(0)
      .setDepth(20);
    this.status = this.add
      .text(VIEW_WIDTH / 2, VIEW_HEIGHT - 17, '', {
        fontFamily: 'ui-monospace, monospace',
        fontSize: '12px',
        color: '#edf5df',
        backgroundColor: '#14252a',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(20);
  }

  private updateStatus(): void {
    const { center } = this.explorer.body;
    let message = 'Something needs to hold the pressure plate.';
    if (this.finished) {
      message = 'EXIT OPEN · RUINS CLEARED';
    } else if (
      center.x >=
      FOREST_ROUTE.descent.x + FOREST_ROUTE.descent.width
    ) {
      message = 'Find the lever in the tunnel.';
    } else if (this.retriedDescent || this.reachedPlatform) {
      message = 'Jump to the far wall and hold toward it to slide.';
    } else if (
      center.x >
      FOREST_ROUTE.supplyGate.x + FOREST_ROUTE.supplyGate.width
    ) {
      message = 'Climb the ladder with W or ↑.';
    } else if (this.crate.held) {
      message = 'Press F again to set the crate down.';
    } else if (this.plate.isPressed()) {
      message = 'Leave the crate on the plate and head through the gate.';
    }
    this.status.setText(message);
  }

  private resetAfterFall(): void {
    if (!this.reachedPlatform) {
      this.reset();
      return;
    }
    this.explorer.reset(this.ladder.centerX, PLATFORM_TOP);
    this.cameras.main.centerOn(this.ladder.centerX, PLATFORM_TOP - 56);
    this.retriedDescent = true;
    this.pending = NEUTRAL_PLAYER_INTENT;
  }

  private reset(): void {
    const { x, feetY } = FOREST_ROUTE.playerStart;
    this.clock.reset();
    this.explorer.reset(x, feetY);
    this.crate.reset();
    this.plate.reset();
    this.lever.reset();
    this.updateSignals();
    this.pending = NEUTRAL_PLAYER_INTENT;
    this.ability.suppressUntilReleased();
    this.interactPressed = false;
    this.reachedPlatform = false;
    this.retriedDescent = false;
    this.finished = false;
    this.cameras.main.centerOn(x, feetY - 56);
  }
}

function toRectangle(bounds: Bounds): Phaser.Geom.Rectangle {
  return new Phaser.Geom.Rectangle(
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
  );
}
