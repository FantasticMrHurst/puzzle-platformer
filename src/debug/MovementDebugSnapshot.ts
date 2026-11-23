import type { PlayerIntent } from '../input/PlayerIntent';
import type {
  MovementContacts,
  MovementVelocity,
} from '../movement/MovementController';
import type { MovementState } from '../movement/MovementState';

export interface DebugPosition {
  readonly x: number;
  readonly y: number;
}

export interface MovementTimingSnapshot {
  readonly fixedStepHz: number;
  readonly stepsThisFrame: number;
  readonly totalSimulationSteps: number;
  readonly totalRenderedFrames: number;
  readonly renderedFramesPerSecond: number;
}

export interface MovementDebugSnapshot {
  readonly position: DebugPosition;
  readonly velocity: MovementVelocity;
  readonly contacts: MovementContacts;
  readonly intent: PlayerIntent;
  readonly movementState: MovementState;
  readonly timing: MovementTimingSnapshot;
  readonly profileName: string;
}

export function formatMovementDebugSnapshot(
  snapshot: MovementDebugSnapshot,
): string {
  const { contacts, intent, movementState, position, timing, velocity } =
    snapshot;

  return [
    `MOVEMENT DEBUG · ${snapshot.profileName}`,
    `pos      ${formatPair(position.x, position.y)}`,
    `velocity ${formatPair(velocity.x, velocity.y)}`,
    `mode     ${movementState.mode}`,
    `contacts ground:${flag(contacts.grounded)} ceiling:${flag(contacts.touchingCeiling)} wall:${contacts.wallDirection}`,
    `intent   x:${intent.moveX.toFixed(2)} pressed:${flag(intent.jumpPressed)} held:${flag(intent.jumpHeld)} released:${flag(intent.jumpReleased)}`,
    `coyote   ${movementState.coyoteTimeRemainingSeconds.toFixed(3)} s`,
    `buffer   ${movementState.jumpBufferRemainingSeconds.toFixed(3)} s`,
    `timing   ${timing.fixedStepHz} Hz · ${timing.stepsThisFrame} step/frame · ${timing.renderedFramesPerSecond.toFixed(1)} fps`,
    `counts   ${timing.totalSimulationSteps} steps · ${timing.totalRenderedFrames} frames`,
  ].join('\n');
}

function formatPair(x: number, y: number): string {
  return `${x.toFixed(1)}, ${y.toFixed(1)}`;
}

function flag(value: boolean): string {
  return value ? 'Y' : 'N';
}
