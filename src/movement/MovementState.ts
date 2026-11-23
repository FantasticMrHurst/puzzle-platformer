export type MovementMode = 'grounded' | 'rising' | 'falling';

export interface MovementState {
  readonly coyoteTimeRemainingSeconds: number;
  readonly jumpBufferRemainingSeconds: number;
  readonly mode: MovementMode;
}

export function createInitialMovementState(): MovementState {
  return {
    coyoteTimeRemainingSeconds: 0,
    jumpBufferRemainingSeconds: 0,
    mode: 'falling',
  };
}
