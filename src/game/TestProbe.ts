import type { MovementDebugSnapshot } from '../debug/MovementDebugSnapshot';

interface PuzzlePlatformerTestState {
  readonly scene: string;
  readonly debugOverlayVisible: boolean;
  readonly activeCharacterId: string;
  readonly roomComplete: boolean;
  readonly exit: {
    readonly arrivedCount: number;
    readonly requiredCount: number;
  };
  readonly roster: readonly {
    readonly id: string;
    readonly active: boolean;
    readonly position: { readonly x: number; readonly y: number };
  }[];
  readonly movement: MovementDebugSnapshot;
}

declare global {
  interface Window {
    __PUZZLE_PLATFORMER_TEST__?: PuzzlePlatformerTestState;
  }
}

const TEST_PROBE_ENABLED = import.meta.env.MODE === 'test';

export function publishTestState(state: PuzzlePlatformerTestState): void {
  if (TEST_PROBE_ENABLED) {
    window.__PUZZLE_PLATFORMER_TEST__ = state;
  }
}
