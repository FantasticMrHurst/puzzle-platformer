import Phaser from 'phaser';

import type { PlayerCharacter } from '../entities/PlayerCharacter';
import type { PushableBlockData } from '../levels/LevelSchema';

const CONTACT_TOLERANCE_PX = 16;

type GripSide = 'left' | 'right';

export class PushableBlock {
  public readonly physicsObject: Phaser.GameObjects.Rectangle;

  private readonly body: Phaser.Physics.Arcade.Body;
  private readonly statusText: Phaser.GameObjects.Text;
  private grippedCharacterId: string | null = null;
  private gripSide: GripSide | null = null;

  public constructor(
    scene: Phaser.Scene,
    public readonly data: PushableBlockData,
  ) {
    this.physicsObject = scene.add
      .rectangle(
        data.x + data.width / 2,
        data.y + data.height / 2,
        data.width,
        data.height,
        0x64748b,
      )
      .setStrokeStyle(3, 0xe2e8f0)
      .setDepth(4);
    scene.physics.add.existing(this.physicsObject);

    if (!(this.physicsObject.body instanceof Phaser.Physics.Arcade.Body)) {
      throw new TypeError('PushableBlock requires a dynamic Arcade body');
    }
    this.body = this.physicsObject.body;
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.body.pushable = false;
    this.body.setMaxVelocity(data.pushSpeed, 0);

    this.statusText = scene.add
      .text(data.x + data.width / 2, data.y + data.height / 2, 'LOCKED', {
        color: '#f8fafc',
        fontFamily: 'ui-monospace, monospace',
        fontSize: '12px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(6);
  }

  public prepareStep(
    signalActive: boolean,
    activeCharacter: PlayerCharacter,
    moveX: number,
    primaryAbilityHeld: boolean,
  ): void {
    const canGrip =
      signalActive &&
      activeCharacter.getArchetype() === this.data.requiredArchetype &&
      activeCharacter.getContacts().grounded &&
      primaryAbilityHeld;

    if (!canGrip) {
      this.releaseGrip();
    } else if (this.grippedCharacterId === null) {
      const gripSide = this.findGripSide(activeCharacter);
      if (gripSide !== null) {
        this.grippedCharacterId = activeCharacter.id;
        this.gripSide = gripSide;
      }
    } else if (
      this.grippedCharacterId !== activeCharacter.id ||
      !this.isStillAttached(activeCharacter)
    ) {
      this.releaseGrip();
    }

    let blockVelocityX = 0;
    if (this.grippedCharacterId === activeCharacter.id && moveX !== 0) {
      const characterVelocityX = activeCharacter.getDebugState().velocity.x;
      blockVelocityX = Phaser.Math.Clamp(
        characterVelocityX,
        -this.data.pushSpeed,
        this.data.pushSpeed,
      );

      if (
        (blockVelocityX < 0 && this.getLeft() <= this.data.x) ||
        (blockVelocityX > 0 && this.getLeft() >= this.data.maxPushX)
      ) {
        blockVelocityX = 0;
      }
    }

    this.body.setVelocityX(blockVelocityX);

    const gripped = this.grippedCharacterId !== null;
    this.physicsObject.setFillStyle(
      gripped ? 0xfacc15 : signalActive ? 0xf97316 : 0x64748b,
    );
    this.statusText.setText(
      gripped ? 'GRIPPED ↔' : signalActive ? 'HOLD F' : 'LOCKED',
    );
  }

  public canStartGrip(
    signalActive: boolean,
    character: PlayerCharacter,
  ): boolean {
    return (
      signalActive &&
      character.getArchetype() === this.data.requiredArchetype &&
      character.getContacts().grounded &&
      this.findGripSide(character) !== null
    );
  }

  public getGripDirection(characterId: string): -1 | 0 | 1 {
    if (this.grippedCharacterId !== characterId || this.gripSide === null) {
      return 0;
    }
    return this.gripSide === 'left' ? 1 : -1;
  }

  public completeStep(): void {
    if (this.getLeft() < this.data.x) {
      this.body.reset(
        this.data.x + this.data.width / 2,
        this.data.y + this.data.height / 2,
      );
      this.body.setVelocity(0, 0);
    }
    if (this.getLeft() > this.data.maxPushX) {
      this.body.reset(
        this.data.maxPushX + this.data.width / 2,
        this.data.y + this.data.height / 2,
      );
      this.body.setVelocity(0, 0);
    }
    this.statusText.setPosition(this.physicsObject.x, this.physicsObject.y);
  }

  public reset(): void {
    this.body.reset(
      this.data.x + this.data.width / 2,
      this.data.y + this.data.height / 2,
    );
    this.body.setVelocity(0, 0);
    this.physicsObject.setFillStyle(0x64748b);
    this.statusText.setPosition(this.physicsObject.x, this.physicsObject.y);
    this.statusText.setText('LOCKED');
    this.releaseGrip();
  }

  private getLeft(): number {
    return this.body.left;
  }

  private findGripSide(character: PlayerCharacter): GripSide | null {
    const characterBounds = character.physicsObject.getBounds();
    const blockBounds = this.physicsObject.getBounds();
    const overlapsVertically =
      characterBounds.bottom > blockBounds.top &&
      characterBounds.top < blockBounds.bottom;
    if (!overlapsVertically) {
      return null;
    }

    const reachesLeftSide =
      characterBounds.right >= blockBounds.left - CONTACT_TOLERANCE_PX &&
      characterBounds.right <= blockBounds.left + CONTACT_TOLERANCE_PX;
    if (reachesLeftSide) {
      return 'left';
    }

    const reachesRightSide =
      characterBounds.left >= blockBounds.right - CONTACT_TOLERANCE_PX &&
      characterBounds.left <= blockBounds.right + CONTACT_TOLERANCE_PX;
    return reachesRightSide ? 'right' : null;
  }

  private isStillAttached(character: PlayerCharacter): boolean {
    return this.findGripSide(character) === this.gripSide;
  }

  private releaseGrip(): void {
    this.grippedCharacterId = null;
    this.gripSide = null;
  }
}
