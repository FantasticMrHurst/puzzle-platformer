import type Phaser from 'phaser';

import type { RangedTargetData } from '../levels/LevelSchema';

export class RangedTarget {
  private readonly target: Phaser.GameObjects.Rectangle;
  private readonly statusText: Phaser.GameObjects.Text;
  private active: boolean;

  public constructor(
    scene: Phaser.Scene,
    public readonly data: RangedTargetData,
  ) {
    this.active = data.initiallyActive;
    this.target = scene.add
      .rectangle(
        data.x + data.width / 2,
        data.y + data.height / 2,
        data.width,
        data.height,
        0x991b1b,
      )
      .setStrokeStyle(4, 0xfca5a5)
      .setDepth(4);
    this.statusText = scene.add
      .text(data.x + data.width / 2, data.y - 8, '', {
        backgroundColor: '#080b16dd',
        color: '#fee2e2',
        fontFamily: 'ui-monospace, monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        padding: { x: 5, y: 3 },
      })
      .setOrigin(0.5, 1)
      .setDepth(6);
    this.updatePresentation();
  }

  public tryHit(x: number, y: number): boolean {
    if (!this.target.getBounds().contains(x, y)) {
      return false;
    }

    this.active = !this.active;
    this.updatePresentation();
    return true;
  }

  public isActive(): boolean {
    return this.active;
  }

  public reset(): void {
    this.active = this.data.initiallyActive;
    this.updatePresentation();
  }

  private updatePresentation(): void {
    this.target.setFillStyle(this.active ? 0x16a34a : 0x991b1b);
    this.target.setStrokeStyle(4, this.active ? 0xbbf7d0 : 0xfca5a5);
    this.statusText.setText(this.active ? 'TARGET ACTIVE' : 'RANGED TARGET');
  }
}
