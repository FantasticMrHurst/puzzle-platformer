import Phaser from 'phaser';

export class KeyboardAbilityInput {
  private readonly primaryKey: Phaser.Input.Keyboard.Key;
  private suppressedUntilRelease = false;

  public constructor(keyboard: Phaser.Input.Keyboard.KeyboardPlugin) {
    this.primaryKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
  }

  public readPrimaryHeld(additionalHeld = false): boolean {
    const held = this.primaryKey.isDown || additionalHeld;
    if (this.suppressedUntilRelease) {
      if (!held) {
        this.suppressedUntilRelease = false;
      }
      return false;
    }

    return held;
  }

  public readPrimaryPressed(additionalPressed = false): boolean {
    const pressed = Phaser.Input.Keyboard.JustDown(this.primaryKey);
    return !this.suppressedUntilRelease && (pressed || additionalPressed);
  }

  public suppressUntilReleased(additionalHeld = false): void {
    this.suppressedUntilRelease = this.primaryKey.isDown || additionalHeld;
  }
}
