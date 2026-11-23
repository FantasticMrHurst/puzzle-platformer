import Phaser from 'phaser';

import type { PlayerInputSource, PlayerIntent } from './PlayerIntent';
import { PlayerIntentMapper } from './PlayerIntentMapper';

interface KeyboardBindings {
  readonly leftArrow: Phaser.Input.Keyboard.Key;
  readonly rightArrow: Phaser.Input.Keyboard.Key;
  readonly upArrow: Phaser.Input.Keyboard.Key;
  readonly keyA: Phaser.Input.Keyboard.Key;
  readonly keyD: Phaser.Input.Keyboard.Key;
  readonly keyW: Phaser.Input.Keyboard.Key;
  readonly space: Phaser.Input.Keyboard.Key;
}

export class KeyboardInput implements PlayerInputSource {
  private readonly bindings: KeyboardBindings;
  private readonly mapper = new PlayerIntentMapper();

  public constructor(keyboard: Phaser.Input.Keyboard.KeyboardPlugin) {
    this.bindings = {
      leftArrow: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      rightArrow: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      upArrow: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      keyA: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      keyD: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      keyW: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      space: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    };
  }

  public readIntent(): PlayerIntent {
    const { bindings } = this;

    return this.mapper.map({
      moveLeft: bindings.leftArrow.isDown || bindings.keyA.isDown,
      moveRight: bindings.rightArrow.isDown || bindings.keyD.isDown,
      jump:
        bindings.upArrow.isDown ||
        bindings.keyW.isDown ||
        bindings.space.isDown,
    });
  }

  public reset(): void {
    this.mapper.reset();
  }
}
