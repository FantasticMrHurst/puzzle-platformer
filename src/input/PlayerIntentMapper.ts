import type { PlayerIntent, RawPlayerInput } from './PlayerIntent';

/** Converts held device state into normalized intent with stable button edges. */
export class PlayerIntentMapper {
  private wasJumpHeld = false;

  public map(input: RawPlayerInput): PlayerIntent {
    const moveX = Number(input.moveRight) - Number(input.moveLeft);
    const jumpPressed = input.jump && !this.wasJumpHeld;
    const jumpReleased = !input.jump && this.wasJumpHeld;

    this.wasJumpHeld = input.jump;

    return {
      moveX,
      jumpPressed,
      jumpHeld: input.jump,
      jumpReleased,
    };
  }

  public reset(): void {
    this.wasJumpHeld = false;
  }
}
