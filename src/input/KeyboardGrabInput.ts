import Phaser from 'phaser';

export class KeyboardGrabInput {
  private readonly grabKey: Phaser.Input.Keyboard.Key;
  private suppressedUntilRelease = false;

  public constructor(keyboard: Phaser.Input.Keyboard.KeyboardPlugin) {
    this.grabKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
  }

  public readPressed(): boolean {
    if (this.suppressedUntilRelease) {
      if (!this.grabKey.isDown) {
        this.suppressedUntilRelease = false;
      }
      return false;
    }

    return Phaser.Input.Keyboard.JustDown(this.grabKey);
  }

  public suppressUntilReleased(): void {
    this.suppressedUntilRelease = this.grabKey.isDown;
  }
}
