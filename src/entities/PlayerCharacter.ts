import type Phaser from 'phaser';

import type { DebugPosition } from '../debug/MovementDebugSnapshot';
import type { PlayerIntent } from '../input/PlayerIntent';
import {
  MovementController,
  type MovementContacts,
  type MovementResult,
  type MovementVelocity,
} from '../movement/MovementController';
import type { MovementConfig } from '../movement/MovementConfig';
import type { MovementState } from '../movement/MovementState';
import { ArcadeBodyAdapter } from '../physics/ArcadeBodyAdapter';
import {
  interpolatePosition,
  type Position,
} from '../rendering/interpolatePosition';

const CHARACTER_WIDTH = 48;
const CHARACTER_HEIGHT = 72;

export interface CharacterDebugState {
  readonly position: DebugPosition;
  readonly velocity: MovementVelocity;
  readonly contacts: MovementContacts;
  readonly movementState: MovementState;
}

export class PlayerCharacter {
  public readonly physicsObject: Phaser.GameObjects.Rectangle;
  public readonly visualObject: Phaser.GameObjects.Rectangle;

  private readonly bodyAdapter: ArcadeBodyAdapter;
  private readonly controller: MovementController;
  private lastResult: MovementResult;
  private previousPosition: Position;
  private currentPosition: Position;

  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    movementConfig: MovementConfig,
  ) {
    this.physicsObject = scene.add
      .rectangle(x, y, CHARACTER_WIDTH, CHARACTER_HEIGHT)
      .setVisible(false);
    scene.physics.add.existing(this.physicsObject);

    this.visualObject = scene.add
      .rectangle(x, y, CHARACTER_WIDTH, CHARACTER_HEIGHT, 0xf97316)
      .setStrokeStyle(3, 0xffedd5)
      .setDepth(5);

    this.bodyAdapter = new ArcadeBodyAdapter(this.physicsObject);
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
    this.currentPosition = this.bodyAdapter.readPosition();
    this.previousPosition = { ...this.currentPosition };
  }

  public prepareSimulationStep(
    deltaSeconds: number,
    intent: PlayerIntent,
  ): void {
    this.previousPosition = { ...this.currentPosition };
    this.lastResult = this.controller.update({
      deltaSeconds,
      intent,
      contacts: this.bodyAdapter.readContacts(),
      velocity: this.bodyAdapter.readVelocity(),
    });
    this.bodyAdapter.applyVelocity(this.lastResult.velocity);
  }

  public completeSimulationStep(): void {
    this.currentPosition = this.bodyAdapter.readPosition();
  }

  public render(interpolationAlpha: number): void {
    const position = interpolatePosition(
      this.previousPosition,
      this.currentPosition,
      interpolationAlpha,
    );
    this.visualObject.setPosition(position.x, position.y);
  }

  public reset(x: number, y: number): void {
    this.controller.reset();
    this.bodyAdapter.reset(x, y);
    this.lastResult = {
      velocity: { x: 0, y: 0 },
      state: this.controller.getState(),
      jumped: false,
    };
    this.currentPosition = this.bodyAdapter.readPosition();
    this.previousPosition = { ...this.currentPosition };
    this.visualObject.setPosition(
      this.currentPosition.x,
      this.currentPosition.y,
    );
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

  public getDebugState(): CharacterDebugState {
    return {
      position: this.bodyAdapter.readPosition(),
      velocity: this.bodyAdapter.readVelocity(),
      contacts: this.bodyAdapter.readContacts(),
      movementState: this.lastResult.state,
    };
  }
}
