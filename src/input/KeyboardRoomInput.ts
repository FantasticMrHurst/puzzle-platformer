import Phaser from 'phaser';

export interface RoomIntent {
  readonly resetPressed: boolean;
}

export class KeyboardRoomInput {
  private readonly resetKey: Phaser.Input.Keyboard.Key;

  public constructor(keyboard: Phaser.Input.Keyboard.KeyboardPlugin) {
    this.resetKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
  }

  public readIntent(): RoomIntent {
    return {
      resetPressed: Phaser.Input.Keyboard.JustDown(this.resetKey),
    };
  }
}
