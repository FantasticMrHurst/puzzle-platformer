import Phaser from 'phaser';

import type { AimIntent } from './AimIntent';

export class KeyboardAimInput {
  private readonly up: Phaser.Input.Keyboard.Key;
  private readonly down: Phaser.Input.Keyboard.Key;
  private readonly left: Phaser.Input.Keyboard.Key;
  private readonly right: Phaser.Input.Keyboard.Key;

  public constructor(keyboard: Phaser.Input.Keyboard.KeyboardPlugin) {
    this.up = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.down = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.left = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.right = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);
  }

  public readIntent(): AimIntent {
    const x = Number(this.right.isDown) - Number(this.left.isDown);
    const y = Number(this.down.isDown) - Number(this.up.isDown);
    const magnitude = Math.hypot(x, y);

    return magnitude === 0
      ? { x: 0, y: 0 }
      : { x: x / magnitude, y: y / magnitude };
  }
}
