import type { ExitData, PointData } from '../levels/LevelSchema';

export interface ExitParticipant {
  readonly id: string;
  readonly position: PointData;
}

export interface ExitProgress {
  readonly arrivedIds: readonly string[];
  readonly arrivedCount: number;
  readonly requiredCount: number;
  readonly complete: boolean;
}

export function calculateExitProgress(
  exit: ExitData,
  participants: readonly ExitParticipant[],
): ExitProgress {
  const arrivedIds = participants
    .filter(({ position }) => containsPoint(exit, position))
    .map(({ id }) => id);

  return {
    arrivedIds,
    arrivedCount: arrivedIds.length,
    requiredCount: participants.length,
    complete:
      participants.length > 0 && arrivedIds.length === participants.length,
  };
}

function containsPoint(exit: ExitData, point: PointData): boolean {
  return (
    point.x >= exit.x &&
    point.x <= exit.x + exit.width &&
    point.y >= exit.y &&
    point.y <= exit.y + exit.height
  );
}
