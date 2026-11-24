import Phaser from 'phaser';

export class KeyboardAbilityInput {
  private readonly primaryKey: Phaser.Input.Keyboard.Key;
  private suppressedUntilRelease = false;

  public constructor(keyboard: Phaser.Input.Keyboard.KeyboardPlugin) {
    this.primaryKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
  }

  public readPrimaryHeld(): boolean {
    if (this.suppressedUntilRelease) {
      if (!this.primaryKey.isDown) {
        this.suppressedUntilRelease = false;
      }
      return false;
    }

    return this.primaryKey.isDown;
  }

  public readPrimaryPressed(): boolean {
    if (this.suppressedUntilRelease) {
      return false;
    }

    return Phaser.Input.Keyboard.JustDown(this.primaryKey);
  }

  public suppressUntilReleased(): void {
    this.suppressedUntilRelease = this.primaryKey.isDown;
  }
}
