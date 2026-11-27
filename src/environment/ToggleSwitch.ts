import type Phaser from 'phaser';

import type { PlayerCharacter } from '../entities/PlayerCharacter';
import type { ToggleSwitchData } from '../levels/LevelSchema';

export class ToggleSwitch {
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly sprite?: Phaser.GameObjects.Image;
  private readonly label: Phaser.GameObjects.Text;
  private active: boolean;

  public constructor(
    scene: Phaser.Scene,
    public readonly data: ToggleSwitchData,
    private readonly textures?: { readonly off: string; readonly on: string },
  ) {
    this.active = data.initiallyActive;
    const x = data.x + data.width / 2;
    this.panel = scene.add
      .rectangle(x, data.y + data.height / 2, data.width, data.height)
      .setDepth(4);
    if (textures !== undefined) {
      this.panel.setVisible(false);
      this.sprite = scene.add
        .image(
          data.x + data.width / 2,
          data.y + data.height / 2,
          this.active ? textures.on : textures.off,
        )
        .setDepth(4);
    }
    this.label = scene.add
      .text(x, data.y - 8, '', {
        backgroundColor: '#080b16dd',
        color: '#eef4ff',
        fontSize: '13px',
        padding: { x: 5, y: 3 },
      })
      .setOrigin(0.5, 1)
      .setDepth(6);
    this.render(false);
  }

  public tryToggle(character: Pick<PlayerCharacter, 'physicsObject'>): boolean {
    if (!this.isInRange(character)) {
      return false;
    }
    this.active = !this.active;
    this.render(true);
    return true;
  }

  public update(character: Pick<PlayerCharacter, 'physicsObject'>): void {
    this.render(this.isInRange(character));
  }

  public isActive(): boolean {
    return this.active;
  }

  public reset(): void {
    this.active = this.data.initiallyActive;
    this.render(false);
  }

  private isInRange(
    character: Pick<PlayerCharacter, 'physicsObject'>,
  ): boolean {
    const bounds = character.physicsObject.getBounds();
    const { x, y, width, height, interactionRange } = this.data;
    const gapX = Math.max(x - bounds.right, bounds.left - (x + width), 0);
    return (
      bounds.bottom > y && bounds.top < y + height && gapX <= interactionRange
    );
  }

  private render(ready: boolean): void {
    this.panel.setFillStyle(this.active ? 0x15803d : 0x1e3a8a);
    if (this.textures !== undefined) {
      this.sprite?.setTexture(
        this.active ? this.textures.on : this.textures.off,
      );
    }
    this.panel.setStrokeStyle(3, ready ? 0xfde047 : 0x93c5fd);
    const status = this.active ? 'SWITCH ON' : 'SWITCH OFF';
    this.label.setText(ready ? `F · ${status}` : status);
  }
}
