import Phaser from 'phaser';

import type {
  PlayerInputSource,
  PlayerIntent,
  RawPlayerInput,
} from './PlayerIntent';
import { PlayerIntentMapper } from './PlayerIntentMapper';

interface KeyboardBindings {
  readonly leftArrow: Phaser.Input.Keyboard.Key;
  readonly rightArrow: Phaser.Input.Keyboard.Key;
  readonly upArrow: Phaser.Input.Keyboard.Key;
  readonly downArrow: Phaser.Input.Keyboard.Key;
  readonly keyA: Phaser.Input.Keyboard.Key;
  readonly keyD: Phaser.Input.Keyboard.Key;
  readonly keyW: Phaser.Input.Keyboard.Key;
  readonly keyS: Phaser.Input.Keyboard.Key;
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
      downArrow: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      keyA: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      keyD: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      keyW: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      keyS: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      space: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    };
  }

  public readClimbAxis(additionalAxis: -1 | 0 | 1 = 0): -1 | 0 | 1 {
    const { upArrow, downArrow, keyW, keyS } = this.bindings;
    const up = upArrow.isDown || keyW.isDown;
    const down = downArrow.isDown || keyS.isDown;
    if (!up && !down) return additionalAxis;
    return up === down ? 0 : up ? -1 : 1;
  }

  public readIntent(additionalInput?: RawPlayerInput): PlayerIntent {
    const { bindings } = this;

    return this.mapper.map({
      moveLeft:
        bindings.leftArrow.isDown ||
        bindings.keyA.isDown ||
        additionalInput?.moveLeft === true,
      moveRight:
        bindings.rightArrow.isDown ||
        bindings.keyD.isDown ||
        additionalInput?.moveRight === true,
      jump:
        bindings.upArrow.isDown ||
        bindings.keyW.isDown ||
        bindings.space.isDown ||
        additionalInput?.jump === true,
    });
  }

  public reset(): void {
    this.mapper.reset();
  }
}
