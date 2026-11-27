import Phaser from 'phaser';

import type { PlayerCharacter } from '../entities/PlayerCharacter';
import type { GateData } from '../levels/LevelSchema';

type GateState = 'closed' | 'open' | 'waiting';

export class Gate {
  public readonly physicsObject: Phaser.GameObjects.Rectangle;

  private readonly body: Phaser.Physics.Arcade.StaticBody;
  private readonly sprite?: Phaser.GameObjects.Image;
  private readonly label: Phaser.GameObjects.Text;
  private state?: GateState;

  public constructor(
    scene: Phaser.Scene,
    public readonly data: GateData,
    private readonly textures?: { readonly off: string; readonly on: string },
  ) {
    const { x, y, width, height } = data;
    this.physicsObject = scene.add
      .rectangle(x + width / 2, y + height / 2, width, height)
      .setDepth(3);
    scene.physics.add.existing(this.physicsObject, true);
    if (
      !(this.physicsObject.body instanceof Phaser.Physics.Arcade.StaticBody)
    ) {
      throw new TypeError('Gate requires a static Arcade body');
    }
    this.body = this.physicsObject.body;
    if (textures !== undefined) {
      this.physicsObject.setVisible(false);
      this.sprite = scene.add
        .image(data.x + data.width / 2, data.y + data.height / 2, textures.off)
        .setDepth(4);
    }
    this.label = scene.add
      .text(x + width / 2, y + 18, '', {
        backgroundColor: '#080b16dd',
        color: '#eef4ff',
        fontSize: '13px',
        padding: { x: 5, y: 3 },
      })
      .setOrigin(0.5, 0)
      .setDepth(6);
    this.setState('closed');
  }

  public update(
    signalActive: boolean,
    characters: readonly Pick<PlayerCharacter, 'physicsObject'>[],
  ): void {
    if (signalActive) {
      this.setState('open');
      return;
    }
    const { x, y, width, height } = this.data;
    const occupied = characters.some((character) => {
      const bounds = character.physicsObject.getBounds();
      return (
        bounds.right > x &&
        bounds.left < x + width &&
        bounds.bottom > y &&
        bounds.top < y + height
      );
    });
    this.setState(occupied ? 'waiting' : 'closed');
  }

  private setState(state: GateState): void {
    if (state === this.state) {
      return;
    }
    this.state = state;
    const closed = state === 'closed';
    this.body.enable = closed;
    const color = closed ? 0x94a3b8 : state === 'waiting' ? 0xfacc15 : 0x22c55e;
    this.physicsObject.setFillStyle(color, closed ? 1 : 0.12);
    if (this.textures !== undefined) {
      this.sprite?.setTexture(closed ? this.textures.off : this.textures.on);
    }
    this.physicsObject.setStrokeStyle(2, color);
    this.label.setText(
      closed
        ? 'GATE CLOSED'
        : state === 'waiting'
          ? 'WAITING TO CLOSE'
          : 'GATE OPEN',
    );
  }
}
