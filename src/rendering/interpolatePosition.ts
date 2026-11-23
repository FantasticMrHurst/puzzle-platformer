export interface Position {
  readonly x: number;
  readonly y: number;
}

export function interpolatePosition(
  previous: Position,
  current: Position,
  alpha: number,
): Position {
  const clampedAlpha = Math.min(1, Math.max(0, alpha));

  return {
    x: previous.x + (current.x - previous.x) * clampedAlpha,
    y: previous.y + (current.y - previous.y) * clampedAlpha,
  };
}
