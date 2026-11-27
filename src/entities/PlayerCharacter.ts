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
import type { MovementConfig } from '../movement/MovementConfig';
import { ArcadeBodyAdapter } from '../physics/ArcadeBodyAdapter';
import { CHARACTER_ART } from '../rendering/CharacterArt';
import type { RopeCastPose } from '../rendering/CharacterArt';
import { CharacterPosePlayer } from '../rendering/CharacterPosePlayer';
import {
  interpolatePosition,
  type Position,
} from '../rendering/interpolatePosition';
import type { PoseTuning } from '../rendering/PoseTuning';
import type { CharacterAbility, CharacterDefinition } from './CharacterCatalog';
import type { CharacterArchetype } from '../levels/LevelSchema';

export interface CharacterDebugState {
  readonly position: DebugPosition;
  readonly velocity: MovementVelocity;
  readonly contacts: MovementContacts;
  readonly movementState: MovementState;
}

export interface LadderMotion {
  readonly x: number;
  readonly velocityY: number;
}

export class PlayerCharacter {
  public readonly id: string;
  public readonly physicsObject: Phaser.GameObjects.Rectangle;
  public readonly visualObject: Phaser.GameObjects.Rectangle;

  private readonly bodyAdapter: ArcadeBodyAdapter;
  private readonly controller: MovementController;
  private readonly labelObject: Phaser.GameObjects.Text;
  private readonly posePreview?: CharacterPosePlayer;
  private lastResult: MovementResult;
  private previousPosition: Position;
  private currentPosition: Position;
  private braced = false;
  private climbing = false;
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
    const feetY = y + definition.height / 2;
    if (definition.art !== undefined) {
      this.posePreview = CharacterPosePlayer.create(
        scene,
        CHARACTER_ART[definition.art],
        x,
        feetY,
        definition.height,
      );
    }
    if (this.posePreview !== undefined) {
      this.posePreview.setDepth(5);
      // Keep the interpolated camera target even when the art replaces its rectangle.
      this.visualObject.setVisible(false);
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
    climb?: LadderMotion,
    castingRope = false,
  ): void {
    this.previousPosition = { ...this.currentPosition };
    if (intent.moveX !== 0) {
      this.facingDirection = intent.moveX < 0 ? -1 : 1;
    }
    if (this.braced) {
      this.bodyAdapter.applyVelocity({ x: 0, y: 0 });
      return;
    }
    if (climb !== undefined) {
      if (!this.climbing) {
        this.bodyAdapter.setAllowGravity(false);
        this.controller.reset();
        this.climbing = true;
      }
      if (this.currentPosition.x !== climb.x) {
        this.bodyAdapter.reset(climb.x, this.currentPosition.y);
      }
      this.lastResult = {
        velocity: { x: 0, y: climb.velocityY },
        state: this.controller.getState(),
        jumped: false,
      };
      this.bodyAdapter.applyVelocity(this.lastResult.velocity);
      return;
    }
    if (this.climbing) {
      this.climbing = false;
      this.bodyAdapter.setAllowGravity(true);
    }
    if (castingRope) {
      this.controller.reset();
      this.lastResult = {
        velocity: { x: 0, y: this.bodyAdapter.readVelocity().y },
        state: this.controller.getState(),
        jumped: false,
      };
      this.bodyAdapter.applyVelocity(this.lastResult.velocity);
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

  public completeSimulationStep(
    deltaSeconds: number,
    gripDirection: -1 | 0 | 1,
    moveX: number,
  ): void {
    this.currentPosition = this.bodyAdapter.readPosition();
    this.posePreview?.update(
      deltaSeconds,
      this.bodyAdapter.readContacts(),
      this.bodyAdapter.readVelocity(),
      this.lastResult,
      { braced: this.braced, gripDirection, moveX },
    );
  }

  public render(interpolationAlpha: number): void {
    const position = interpolatePosition(
      this.previousPosition,
      this.currentPosition,
      interpolationAlpha,
    );
    this.visualObject.setPosition(position.x, position.y);
    this.posePreview?.render({
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
    this.posePreview?.setDepth(active ? 7 : 5);
    this.labelObject.setDepth(8).setVisible(active);
    this.visualObject.setStrokeStyle(
      active ? 5 : 2,
      this.definition.strokeColor,
    );
  }

  public getMovementProfileName(): string {
    return this.definition.movementProfileName;
  }

  public setMovementConfig(config: MovementConfig): void {
    this.controller.setConfig(config);
    this.bodyAdapter.setMaximumVelocity(
      config.maxRunSpeed,
      config.maxFallSpeed,
    );
  }

  public setPoseTuning(tuning: PoseTuning): void {
    this.posePreview?.setTuning(tuning);
  }

  public getLabel(): string {
    return this.definition.label;
  }

  public getArchetype(): CharacterArchetype {
    return this.definition.archetype;
  }

  public hasAbility(ability: CharacterAbility): boolean {
    return this.definition.abilities.includes(ability);
  }

  public getFacingDirection(): -1 | 1 {
    return this.facingDirection;
  }

  public setRopeEquipment(
    carrying: boolean,
    pose?: RopeCastPose,
    direction?: -1 | 1,
  ): void {
    this.posePreview?.setRopeEquipment(carrying, pose, direction);
  }

  public didJumpThisStep(): boolean {
    return this.lastResult.jumped;
  }

  public isBraced(): boolean {
    return this.braced;
  }

  public toggleBraceStance(): boolean {
    if (!this.hasAbility('prototype-brace')) {
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
    this.posePreview?.reset();
    this.facingDirection = 1;
    this.braced = false;
    this.climbing = false;
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

  public placeFeetAt(x: number, y: number): void {
    this.bodyAdapter.reset(x, y - this.definition.height / 2);
    this.currentPosition = this.bodyAdapter.readPosition();
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
