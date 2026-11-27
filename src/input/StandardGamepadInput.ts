import type { RawPlayerInput } from './PlayerIntent';

// Physical button positions in the browser's standard gamepad mapping.
const CROSS = 0;
const SQUARE = 2;
const L1 = 4;
const R1 = 5;
const OPTIONS = 9;
const DPAD_LEFT = 14;
const DPAD_RIGHT = 15;
const STICK_DEAD_ZONE = 0.28;

interface GamepadIntent {
  readonly movement: RawPlayerInput;
  readonly primaryHeld: boolean;
  readonly primaryPressed: boolean;
  readonly cycleDirection: -1 | 0 | 1;
  readonly resetPressed: boolean;
}

export class StandardGamepadInput {
  private previous = {
    primary: false,
    previousCharacter: false,
    nextCharacter: false,
    reset: false,
  };

  public sample(): GamepadIntent {
    const pad = this.readStandardGamepad();
    const pressed = (index: number) => pad?.buttons[index]?.pressed ?? false;
    const left = pressed(DPAD_LEFT);
    const right = pressed(DPAD_RIGHT);
    const axis = pad?.axes[0] ?? 0;
    const current = {
      primary: pressed(SQUARE),
      previousCharacter: pressed(L1),
      nextCharacter: pressed(R1),
      reset: pressed(OPTIONS),
    };
    const previous = this.previous;
    this.previous = current;

    const previousCharacter =
      current.previousCharacter && !previous.previousCharacter;
    const nextCharacter = current.nextCharacter && !previous.nextCharacter;
    return {
      movement: {
        moveLeft: left || (!right && axis < -STICK_DEAD_ZONE),
        moveRight: right || (!left && axis > STICK_DEAD_ZONE),
        jump: pressed(CROSS),
      },
      primaryHeld: current.primary,
      primaryPressed: current.primary && !previous.primary,
      cycleDirection:
        previousCharacter === nextCharacter ? 0 : previousCharacter ? -1 : 1,
      resetPressed: current.reset && !previous.reset,
    };
  }

  private readStandardGamepad(): Gamepad | undefined {
    // Embedded browsers can block the Gamepad API through Permissions Policy.
    try {
      return Array.from(navigator.getGamepads?.() ?? []).find(
        (pad): pad is Gamepad =>
          pad !== null && pad.connected && pad.mapping === 'standard',
      );
    } catch {
      return undefined;
    }
  }
}
