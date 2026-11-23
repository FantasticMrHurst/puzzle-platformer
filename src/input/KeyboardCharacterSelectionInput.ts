import Phaser from 'phaser';

export interface CharacterSelectionIntent {
  readonly directSlot?: number;
  readonly cycleDirection: -1 | 0 | 1;
}

export class KeyboardCharacterSelectionInput {
  private readonly directKeys: readonly Phaser.Input.Keyboard.Key[];
  private readonly previousKey: Phaser.Input.Keyboard.Key;
  private readonly nextKey: Phaser.Input.Keyboard.Key;

  public constructor(keyboard: Phaser.Input.Keyboard.KeyboardPlugin) {
    this.directKeys = [
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
    ];
    this.previousKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.nextKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  public readIntent(): CharacterSelectionIntent {
    const directSlot = this.directKeys.findIndex((key) =>
      Phaser.Input.Keyboard.JustDown(key),
    );
    if (directSlot >= 0) {
      return { directSlot, cycleDirection: 0 };
    }

    const previous = Phaser.Input.Keyboard.JustDown(this.previousKey);
    const next = Phaser.Input.Keyboard.JustDown(this.nextKey);

    return {
      cycleDirection: previous === next ? 0 : previous ? -1 : 1,
    };
  }
}
