import type Phaser from 'phaser';

import {
  formatMovementDebugSnapshot,
  type MovementDebugSnapshot,
} from '../debug/MovementDebugSnapshot';

export class MovementDebugOverlay {
  private readonly text: Phaser.GameObjects.Text;

  public constructor(scene: Phaser.Scene) {
    this.text = scene.add
      .text(scene.scale.width - 20, 20, '', {
        align: 'left',
        backgroundColor: '#020617e8',
        color: '#bae6fd',
        fontFamily: 'ui-monospace, monospace',
        fontSize: '14px',
        lineSpacing: 3,
        padding: { x: 12, y: 10 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(20)
      .setVisible(false);
  }

  public update(snapshot: MovementDebugSnapshot): void {
    if (this.text.visible) {
      this.text.setText(formatMovementDebugSnapshot(snapshot));
    }
  }

  public toggle(): void {
    this.text.setVisible(!this.text.visible);
  }

  public isVisible(): boolean {
    return this.text.visible;
  }
}
