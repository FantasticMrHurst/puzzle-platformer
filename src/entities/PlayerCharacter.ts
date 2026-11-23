import type Phaser from 'phaser';

import type { PlayerIntent } from '../input/PlayerIntent';
import {
  MovementController,
  type MovementContacts,
  type MovementResult,
} from '../movement/MovementController';
import type { MovementConfig } from '../movement/MovementConfig';
import { ArcadeBodyAdapter } from '../physics/ArcadeBodyAdapter';

const CHARACTER_WIDTH = 48;
const CHARACTER_HEIGHT = 72;

export class PlayerCharacter {
  public readonly gameObject: Phaser.GameObjects.Rectangle;

  private readonly bodyAdapter: ArcadeBodyAdapter;
  private readonly controller: MovementController;
  private lastResult: MovementResult;

  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    movementConfig: MovementConfig,
  ) {
    this.gameObject = scene.add
      .rectangle(x, y, CHARACTER_WIDTH, CHARACTER_HEIGHT, 0xf97316)
      .setStrokeStyle(3, 0xffedd5)
      .setDepth(5);
    scene.physics.add.existing(this.gameObject);

    this.bodyAdapter = new ArcadeBodyAdapter(this.gameObject);
    this.bodyAdapter.setMaximumVelocity(
      movementConfig.maxRunSpeed,
      movementConfig.maxFallSpeed,
    );
    this.controller = new MovementController(movementConfig);
    this.lastResult = {
      velocity: { x: 0, y: 0 },
      state: this.controller.getState(),
      jumped: false,
    };
  }

  public simulateStep(deltaSeconds: number, intent: PlayerIntent): void {
    this.lastResult = this.controller.update({
      deltaSeconds,
      intent,
      contacts: this.bodyAdapter.readContacts(),
      velocity: this.bodyAdapter.readVelocity(),
    });
    this.bodyAdapter.applyVelocity(this.lastResult.velocity);
  }

  public reset(x: number, y: number): void {
    this.controller.reset();
    this.bodyAdapter.reset(x, y);
    this.lastResult = {
      velocity: { x: 0, y: 0 },
      state: this.controller.getState(),
      jumped: false,
    };
  }

  public isBelow(y: number): boolean {
    return this.bodyAdapter.isBelow(y);
  }

  public getContacts(): MovementContacts {
    return this.bodyAdapter.readContacts();
  }

  public getLastResult(): MovementResult {
    return this.lastResult;
  }
}
