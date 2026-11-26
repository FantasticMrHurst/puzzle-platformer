import type Phaser from 'phaser';

import type { DebugPosition } from '../debug/MovementDebugSnapshot';
import type { PlayerIntent } from '../input/PlayerIntent';
import {
  MovementController,
  type MovementContacts,
  type MovementResult,
  type MovementVelocity,
} from '../movement/MovementController';
import type { MovementState } from '../movement/MovementState';
import { ArcadeBodyAdapter } from '../physics/ArcadeBodyAdapter';
import {
  interpolatePosition,
  type Position,
} from '../rendering/interpolatePosition';
import { ScoutPosePreview } from '../rendering/ScoutPosePreview';
import type { CharacterDefinition } from './CharacterCatalog';
import type { CharacterArchetype } from '../levels/LevelSchema';

export interface CharacterDebugState {
  readonly position: DebugPosition;
  readonly velocity: MovementVelocity;
  readonly contacts: MovementContacts;
  readonly movementState: MovementState;
}

export class PlayerCharacter {
  public readonly id: string;
  public readonly physicsObject: Phaser.GameObjects.Rectangle;
  public readonly visualObject: Phaser.GameObjects.Rectangle;

  private readonly bodyAdapter: ArcadeBodyAdapter;
  private readonly controller: MovementController;
  private readonly labelObject: Phaser.GameObjects.Text;
  private readonly scoutPreview?: ScoutPosePreview;
  private lastResult: MovementResult;
  private previousPosition: Position;
  private currentPosition: Position;
  private braced = false;
  private facingDirection: -1 | 1 = 1;

  public constructor(
    scene: Phaser.Scene,
    id: string,
    x: number,
    y: number,
    private readonly definition: CharacterDefinition,
  ) {
    this.id = id;
    this.physicsObject = scene.add
      .rectangle(x, y, definition.width, definition.height)
      .setVisible(false);
    scene.physics.add.existing(this.physicsObject);

    this.visualObject = scene.add
      .rectangle(
        x,
        y,
        definition.width,
        definition.height,
        definition.fillColor,
      )
      .setStrokeStyle(3, definition.strokeColor)
      .setDepth(5);
    if (definition.archetype === 'scout') {
      this.scoutPreview = ScoutPosePreview.create(
        scene,
        x,
        y + definition.height / 2,
      );
      if (this.scoutPreview !== undefined) {
        this.scoutPreview.setDepth(5);
        // Keep the interpolated camera target even when the art replaces its rectangle.
        this.visualObject.setVisible(false);
      }
    }
    this.labelObject = scene.add
      .text(x, y - definition.height / 2 - 8, definition.label, {
        backgroundColor: '#080b16cc',
        color: '#f8fafc',
        fontFamily: 'ui-monospace, monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(6);

    this.bodyAdapter = new ArcadeBodyAdapter(this.physicsObject);
    this.bodyAdapter.setMaximumVelocity(
      definition.movementConfig.maxRunSpeed,
      definition.movementConfig.maxFallSpeed,
    );
    this.controller = new MovementController(definition.movementConfig);
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
    if (intent.moveX !== 0) {
      this.facingDirection = intent.moveX < 0 ? -1 : 1;
    }
    if (this.braced) {
      this.bodyAdapter.applyVelocity({ x: 0, y: 0 });
      return;
    }
    this.lastResult = this.controller.update({
      deltaSeconds,
      intent,
      contacts: this.bodyAdapter.readContacts(),
      velocity: this.bodyAdapter.readVelocity(),
    });
    this.bodyAdapter.applyVelocity(this.lastResult.velocity);
  }

  public completeSimulationStep(deltaSeconds: number): void {
    this.currentPosition = this.bodyAdapter.readPosition();
    this.scoutPreview?.update(
      deltaSeconds,
      this.bodyAdapter.readContacts(),
      this.bodyAdapter.readVelocity(),
      this.lastResult,
    );
  }

  public render(interpolationAlpha: number): void {
    const position = interpolatePosition(
      this.previousPosition,
      this.currentPosition,
      interpolationAlpha,
    );
    this.visualObject.setPosition(position.x, position.y);
    this.scoutPreview?.render({
      x: position.x,
      y: position.y + this.definition.height / 2,
    });
    this.labelObject.setPosition(
      position.x,
      position.y - this.definition.height / 2 - 8,
    );
  }

  public setActive(active: boolean): void {
    this.labelObject.setText(
      `${active ? '▼ ' : ''}${this.definition.label}${
        this.braced ? ' · BRACED' : ''
      }`,
    );
    this.visualObject.setDepth(active ? 7 : 5);
    this.scoutPreview?.setDepth(active ? 7 : 5);
    this.labelObject.setDepth(8).setVisible(active);
    this.visualObject.setStrokeStyle(
      active ? 5 : 2,
      this.definition.strokeColor,
    );
  }

  public getMovementProfileName(): string {
    return this.definition.movementProfileName;
  }

  public getLabel(): string {
    return this.definition.label;
  }

  public getArchetype(): CharacterArchetype {
    return this.definition.archetype;
  }

  public getFacingDirection(): -1 | 1 {
    return this.facingDirection;
  }

  public didJumpThisStep(): boolean {
    return this.lastResult.jumped;
  }

  public isBraced(): boolean {
    return this.braced;
  }

  public toggleBraceStance(): boolean {
    if (this.definition.archetype !== 'brute') {
      return false;
    }
    if (!this.braced && !this.bodyAdapter.readContacts().grounded) {
      return false;
    }

    this.braced = !this.braced;
    this.bodyAdapter.setImmovable(this.braced);
    this.bodyAdapter.setAllowGravity(!this.braced);
    this.bodyAdapter.applyVelocity({ x: 0, y: 0 });
    this.controller.reset();
    this.visualObject.setFillStyle(
      this.braced ? 0xfacc15 : this.definition.fillColor,
    );
    this.setActive(true);
    return true;
  }

  public reset(x: number, y: number): void {
    this.scoutPreview?.reset();
    this.braced = false;
    this.bodyAdapter.setImmovable(false);
    this.bodyAdapter.setAllowGravity(true);
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
    this.labelObject.setPosition(
      this.currentPosition.x,
      this.currentPosition.y - this.definition.height / 2 - 8,
    );
    this.visualObject.setFillStyle(this.definition.fillColor);
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
