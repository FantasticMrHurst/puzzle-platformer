import type { MovementDebugSnapshot } from '../debug/MovementDebugSnapshot';

interface PuzzlePlatformerTestState {
  readonly scene: string;
  readonly debugOverlayVisible: boolean;
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
