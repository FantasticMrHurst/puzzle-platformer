import type Phaser from 'phaser';

import type { PlayerCharacter } from '../entities/PlayerCharacter';
import type { PressurePlateData } from '../levels/LevelSchema';

const FOOT_TOLERANCE_PX = 6;

export class PressurePlate {
  private readonly presentation: Phaser.GameObjects.Rectangle;
  private readonly sprite?: Phaser.GameObjects.Image;
  private readonly statusText: Phaser.GameObjects.Text;
  private pressed = false;

  public constructor(
    scene: Phaser.Scene,
    public readonly data: PressurePlateData,
    private readonly textures?: { readonly off: string; readonly on: string },
  ) {
    this.presentation = scene.add
      .rectangle(
        data.x + data.width / 2,
        data.y + data.height / 2,
        data.width,
        data.height,
        0xf59e0b,
      )
      .setStrokeStyle(2, 0xfef3c7)
      .setDepth(4);
    if (textures !== undefined) {
      this.presentation.setVisible(false);
      this.sprite = scene.add
        .image(data.x + data.width / 2, data.y + data.height / 2, textures.off)
        .setDepth(4);
    }
    this.statusText = scene.add
      .text(data.x + data.width / 2, data.y - 8, 'PRESSURE PLATE', {
        backgroundColor: '#080b16cc',
        color: '#fde68a',
        fontFamily: 'ui-monospace, monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(6);
  }

  public update(
    characters: readonly Pick<PlayerCharacter, 'physicsObject'>[],
  ): void {
    const plateBottom = this.data.y + this.data.height;
    const pressed = characters.some((character) => {
      const bounds = character.physicsObject.getBounds();
      const overlapsHorizontally =
        bounds.right > this.data.x &&
        bounds.left < this.data.x + this.data.width;
      const feetTouchPlate =
        Math.abs(bounds.bottom - plateBottom) <= FOOT_TOLERANCE_PX;
      return overlapsHorizontally && feetTouchPlate;
    });

    if (pressed === this.pressed) {
      return;
    }

    this.pressed = pressed;
    this.presentation.setFillStyle(pressed ? 0x22c55e : 0xf59e0b);
    if (this.textures !== undefined) {
      this.sprite?.setTexture(pressed ? this.textures.on : this.textures.off);
    }
    this.statusText
      .setText(pressed ? 'PLATE ACTIVE' : 'PRESSURE PLATE')
      .setColor(pressed ? '#dcfce7' : '#fde68a');
  }

  public isPressed(): boolean {
    return this.pressed;
  }

  public reset(): void {
    this.pressed = false;
    this.presentation.setFillStyle(0xf59e0b);
    if (this.textures !== undefined) {
      this.sprite?.setTexture(this.textures.off);
    }
    this.statusText.setText('PRESSURE PLATE').setColor('#fde68a');
  }
}
