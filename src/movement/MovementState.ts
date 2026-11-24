export type MovementMode = 'grounded' | 'rising' | 'falling' | 'wall-sliding';

export interface MovementState {
  readonly coyoteTimeRemainingSeconds: number;
  readonly jumpBufferRemainingSeconds: number;
  readonly wallJumpControlLockRemainingSeconds: number;
  readonly wallContactGraceRemainingSeconds: number;
  readonly lastWallDirection: -1 | 0 | 1;
  readonly mode: MovementMode;
}

export function createInitialMovementState(): MovementState {
  return {
    coyoteTimeRemainingSeconds: 0,
    jumpBufferRemainingSeconds: 0,
    wallJumpControlLockRemainingSeconds: 0,
    wallContactGraceRemainingSeconds: 0,
    lastWallDirection: 0,
    mode: 'falling',
  };
}
