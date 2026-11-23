export interface RawPlayerInput {
  readonly moveLeft: boolean;
  readonly moveRight: boolean;
  readonly jump: boolean;
}

export interface PlayerIntent {
  /** Horizontal intent normalized to the inclusive range [-1, 1]. */
  readonly moveX: number;
  readonly jumpPressed: boolean;
  readonly jumpHeld: boolean;
  readonly jumpReleased: boolean;
}

export interface PlayerInputSource {
  readIntent(): PlayerIntent;
}

export const NEUTRAL_PLAYER_INTENT: PlayerIntent = {
  moveX: 0,
  jumpPressed: false,
  jumpHeld: false,
  jumpReleased: false,
};
