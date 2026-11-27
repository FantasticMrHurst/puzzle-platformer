import type { LevelWorldData, StaticGeometryData } from '../levels/LevelSchema';
import type { RopeLadderLayout } from '../rendering/RopeLadderArt';

const EDGE_REACH_PX = 64;
const TOP_TOLERANCE_PX = 3;
const MIN_DROP_PX = 40;
const MAX_LENGTH_PX = 480;

export interface RopeBounds {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

export interface RopeLedge extends RopeLadderLayout {
  readonly direction: -1 | 1;
  readonly hasLanding: boolean;
}

export function findRopeLedge(
  actor: RopeBounds,
  facing: -1 | 1,
  terrain: readonly StaticGeometryData[],
  blockers: readonly RopeBounds[],
  world: Pick<LevelWorldData, 'width' | 'height'>,
  crew: { readonly width: number; readonly height: number },
): RopeLedge | undefined {
  const center = (actor.left + actor.right) / 2;
  const halfWidth = crew.width / 2;
  const candidates: { ledge: RopeLedge; score: number }[] = [];
  for (const surface of terrain) {
    const top = surface.y;
    if (
      Math.abs(actor.bottom - top) > TOP_TOLERANCE_PX ||
      actor.right <= surface.x ||
      actor.left >= surface.x + surface.width
    )
      continue;

    for (const direction of [-1, 1] as const) {
      const edge = direction < 0 ? surface.x : surface.x + surface.width;
      const distance = Math.abs(edge - center);
      const x = edge + direction * (halfWidth + 2);
      if (
        distance > EDGE_REACH_PX ||
        x - halfWidth < 0 ||
        x + halfWidth > world.width
      )
        continue;

      const landingX =
        edge - direction * Math.min(halfWidth + 2, surface.width / 2);
      // Require space for the crew to step off the ladder at the top.
      if (
        blockers.some(
          (bounds) =>
            bounds.top < top &&
            bounds.bottom > top - crew.height &&
            bounds.left < landingX + halfWidth &&
            bounds.right > landingX - halfWidth,
        )
      )
        continue;

      const shaftLeft = Math.min(edge, x - halfWidth);
      const shaftRight = Math.max(edge, x + halfWidth);
      let floor = Infinity;
      for (const bounds of blockers) {
        if (bounds.left >= shaftRight || bounds.right <= shaftLeft) continue;
        if (bounds.bottom <= top - crew.height) continue;
        // A continuous floor, a wall, or an overhead obstacle closes the mouth.
        if (bounds.top <= top) {
          floor = top;
          break;
        }
        floor = Math.min(floor, bounds.top);
      }
      const bottom = Math.min(floor, top + MAX_LENGTH_PX, world.height);
      if (bottom - top < MIN_DROP_PX) continue;

      candidates.push({
        ledge: {
          x,
          top,
          bottom,
          landingX,
          direction,
          hasLanding: floor === bottom,
        },
        score: distance + (direction === facing ? 0 : EDGE_REACH_PX),
      });
    }
  }
  return candidates.sort((a, b) => a.score - b.score)[0]?.ledge;
}
