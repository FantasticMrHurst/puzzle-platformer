import type Phaser from 'phaser';

import type { PlayerCharacter } from '../entities/PlayerCharacter';
import type { GrowthNodeData } from '../levels/LevelSchema';

export class GrowthNode {
  private readonly seedBed: Phaser.GameObjects.Ellipse;
  private readonly statusText: Phaser.GameObjects.Text;
  private grown: boolean;
  private ready = false;

  public constructor(
    scene: Phaser.Scene,
    public readonly data: GrowthNodeData,
  ) {
    this.grown = data.initiallyGrown;
    this.seedBed = scene.add
      .ellipse(
        data.x + data.width / 2,
        data.y + data.height / 2,
        data.width,
        data.height,
        0x713f12,
      )
      .setStrokeStyle(3, 0xa3e635)
      .setDepth(3);
    this.statusText = scene.add
      .text(data.x + data.width / 2, data.y - 8, '', {
        backgroundColor: '#080b16dd',
        color: '#ecfccb',
        fontFamily: 'ui-monospace, monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        padding: { x: 5, y: 3 },
      })
      .setOrigin(0.5, 1)
      .setDepth(6);
    this.updatePresentation();
  }

  public update(activeCharacter: PlayerCharacter): void {
    this.ready = this.canUse(activeCharacter);
    this.updatePresentation();
  }

  public tryToggle(activeCharacter: PlayerCharacter): boolean {
    if (!this.canUse(activeCharacter)) {
      return false;
    }

    this.grown = !this.grown;
    this.updatePresentation();
    return true;
  }

  public isGrown(): boolean {
    return this.grown;
  }

  public reset(): void {
    this.grown = this.data.initiallyGrown;
    this.ready = false;
    this.updatePresentation();
  }

  private canUse(character: PlayerCharacter): boolean {
    if (character.getArchetype() !== this.data.requiredArchetype) {
      return false;
    }

    const characterBounds = character.physicsObject.getBounds();
    const nodeBounds = this.seedBed.getBounds();
    const horizontalGap = Math.max(
      nodeBounds.left - characterBounds.right,
      characterBounds.left - nodeBounds.right,
      0,
    );
    const verticalGap = Math.max(
      nodeBounds.top - characterBounds.bottom,
      characterBounds.top - nodeBounds.bottom,
      0,
    );

    return Math.hypot(horizontalGap, verticalGap) <= this.data.interactionRange;
  }

  private updatePresentation(): void {
    this.seedBed.setFillStyle(this.grown ? 0x3f6212 : 0x713f12);
    this.seedBed.setStrokeStyle(3, this.ready ? 0xfde047 : 0xa3e635);
    this.statusText.setText(
      this.ready
        ? `PRESS F · ${this.grown ? 'WILT' : 'GROW'}`
        : this.grown
          ? 'GROWTH ACTIVE'
          : 'SEED BED',
    );
  }
}
