import type Phaser from 'phaser';

import type { PlayerCharacter } from '../entities/PlayerCharacter';
import type { MechanismConsoleData } from '../levels/LevelSchema';

export class MechanismConsole {
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly statusText: Phaser.GameObjects.Text;
  private powered: boolean;
  private ready = false;

  public constructor(
    scene: Phaser.Scene,
    public readonly data: MechanismConsoleData,
  ) {
    this.powered = data.initiallyPowered;
    this.panel = scene.add
      .rectangle(
        data.x + data.width / 2,
        data.y + data.height / 2,
        data.width,
        data.height,
        0x1e3a8a,
      )
      .setStrokeStyle(3, 0x93c5fd)
      .setDepth(4);
    this.statusText = scene.add
      .text(data.x + data.width / 2, data.y - 8, '', {
        backgroundColor: '#080b16dd',
        color: '#dbeafe',
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

    this.powered = !this.powered;
    this.updatePresentation();
    return true;
  }

  public isPowered(): boolean {
    return this.powered;
  }

  public reset(): void {
    this.powered = this.data.initiallyPowered;
    this.ready = false;
    this.updatePresentation();
  }

  private canUse(character: PlayerCharacter): boolean {
    if (character.getArchetype() !== this.data.requiredArchetype) {
      return false;
    }

    const characterBounds = character.physicsObject.getBounds();
    const consoleBounds = this.panel.getBounds();
    const horizontalGap = Math.max(
      consoleBounds.left - characterBounds.right,
      characterBounds.left - consoleBounds.right,
      0,
    );
    const overlapsVertically =
      characterBounds.bottom > consoleBounds.top &&
      characterBounds.top < consoleBounds.bottom;

    return overlapsVertically && horizontalGap <= this.data.interactionRange;
  }

  private updatePresentation(): void {
    this.panel.setFillStyle(this.powered ? 0x16a34a : 0x1e3a8a);
    this.panel.setStrokeStyle(3, this.ready ? 0xfde047 : 0x93c5fd);
    this.statusText.setText(
      this.ready
        ? `PRESS F · ${this.powered ? 'RETRACT' : 'EXTEND'}`
        : this.powered
          ? 'POWERED'
          : 'TINKERER CONSOLE',
    );
  }
}
