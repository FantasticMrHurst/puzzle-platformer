import type Phaser from 'phaser';

import type { Position } from './interpolatePosition';

export interface RopeLadderLayout {
  readonly x: number;
  readonly top: number;
  readonly bottom: number;
  readonly landingX: number;
}

export type RopeEnd = 'top' | 'bottom';

const ROLLOUT_SECONDS = 0.15;
export const ROPE_DEPLOY_SECONDS = 0.72;
const RUNG_SPACING_PX = 18;
const HALF_WIDTH = 12;
const OUTLINE = 0x211d2e;
const ROPE_SHADE = 0x9f693e;
const ROPE_LIGHT = 0xe9b767;
const ROPE_GLINT = 0xf6d89b;
const IRON = 0x435569;
const IRON_LIGHT = 0x7f9b9c;
const LEATHER = 0x983b32;

export function drawRopeBundle(
  pixels: Phaser.GameObjects.Graphics,
  { x, y }: Position,
  half: number,
  scale = 1,
): void {
  const rect = (color: number, dx: number, dy: number, w: number, h: number) =>
    pixels
      .fillStyle(color)
      .fillRect(
        Math.round(x + dx * scale),
        Math.round(y + dy * scale),
        Math.max(1, Math.round(w * scale)),
        Math.max(1, Math.round(h * scale)),
      );
  rect(OUTLINE, -half - 2, -7, half * 2 + 4, 14);
  rect(OUTLINE, -half, -9, half * 2, 18);
  rect(ROPE_SHADE, -half, -7, half * 2, 14);
  for (let wrap = -half + 1; wrap < half; wrap += 4) {
    rect(ROPE_LIGHT, wrap, -6, 2, 11);
    rect(ROPE_GLINT, wrap, -5, 2, 2);
  }
  rect(OUTLINE, -2, -8, 5, 16);
  rect(LEATHER, -1, -7, 3, 14);
  rect(ROPE_GLINT, -1, -2, 3, 2);
}

/** Pixel shapes stay legible at the crew's native sprite scale as the ladder bends. */
export class RopeLadderArt {
  private readonly pixels: Phaser.GameObjects.Graphics;

  public constructor(scene: Phaser.Scene) {
    this.pixels = scene.add.graphics().setDepth(3);
  }

  public clear(): void {
    this.pixels.clear();
  }

  public draw(
    layout: RopeLadderLayout,
    age: number,
    sway: number,
    origin: Position,
  ): void {
    const { x, top, bottom, landingX } = layout;
    this.clear();
    if (age < ROLLOUT_SECONDS) {
      const roll = age / ROLLOUT_SECONDS;
      const tipX = Math.round(origin.x + (x - origin.x) * roll);
      const tipY = Math.round(
        origin.y + (top + 5 - origin.y) * roll - 15 * Math.sin(Math.PI * roll),
      );
      this.tether(landingX, tipX, tipY, top);
      drawRopeBundle(this.pixels, { x: tipX, y: tipY }, 9);
    } else {
      const fall = Math.min(
        (age - ROLLOUT_SECONDS) / (ROPE_DEPLOY_SECONDS - ROLLOUT_SECONDS),
        1,
      );
      const length = bottom - top;
      const endY = Math.round(
        top + 5 + (length - 5) * fall * (0.55 + 0.45 * fall),
      );
      const centerAt = (y: number): number => {
        const along = (y - top) / length;
        const relax = Math.exp(-Math.max(0, age - ROPE_DEPLOY_SECONDS) * 3);
        const unfurl = 10 * relax * Math.sin(age * 14 - along * 5);
        const breeze = 1.5 * Math.sin(age * 2.2 - along * 3);
        return Math.round(x + along * (unfurl + breeze + sway));
      };

      this.tether(landingX, x, top + 3, top);
      this.drawRungs(top, top, endY, centerAt);
      if (fall < 0.95) {
        drawRopeBundle(
          this.pixels,
          { x: centerAt(endY), y: endY },
          Math.round(9 - 5 * fall),
        );
      } else {
        const end = centerAt(endY);
        this.knot(end - HALF_WIDTH, endY - 5);
        this.knot(end + HALF_WIDTH, endY - 5);
      }
    }
    this.anchor(landingX, top);
  }

  public drawRetraction(
    { x, top, bottom, landingX }: RopeLadderLayout,
    from: RopeEnd,
    reelProgress: number,
    packProgress: number,
    sway: number,
    satchel: Position,
  ): void {
    this.clear();
    const collectingAtTop = from === 'top';
    const reel = reelProgress * (0.45 + 0.55 * reelProgress);
    const endY = collectingAtTop ? top + 8 : bottom - 8;
    if (reelProgress < 1) {
      const start = collectingAtTop ? bottom : top;
      const gatherY = Math.round(start + (endY - start) * reel);
      const centerAt = (y: number) =>
        Math.round(x + ((y - top) / (bottom - top)) * sway * (1 - reel));
      this.drawRungs(
        top,
        collectingAtTop ? top : gatherY,
        collectingAtTop ? gatherY : bottom,
        centerAt,
      );
      if (collectingAtTop) {
        this.tether(landingX, x, top + 3, top);
        this.anchor(landingX, top);
      }
      drawRopeBundle(
        this.pixels,
        { x: centerAt(gatherY), y: gatherY },
        8,
        0.45 + reel * 0.55,
      );
      return;
    }

    const bundle = {
      x: x + (satchel.x - x) * packProgress,
      y:
        endY +
        (satchel.y - endY) * packProgress -
        8 * Math.sin(Math.PI * packProgress),
    };
    drawRopeBundle(this.pixels, bundle, 8, 1 - packProgress * 0.15);
  }

  private drawRungs(
    top: number,
    start: number,
    end: number,
    centerAt: (y: number) => number,
  ): void {
    for (let y = start; y < end; y += 4) {
      const center = centerAt(y);
      const height = Math.min(4, end - y);
      this.rail(center - HALF_WIDTH, y, height, y - top);
      this.rail(center + HALF_WIDTH, y, height, y - top + 4);
    }
    for (let y = top + 12; y + 5 <= end; y += RUNG_SPACING_PX) {
      if (y - 2 >= start) this.rung(centerAt(y), y);
    }
  }

  private tether(fromX: number, toX: number, toY: number, top: number): void {
    const steps = Math.max(
      1,
      Math.ceil(Math.max(Math.abs(fromX - toX), Math.abs(top - 10 - toY)) / 2),
    );
    for (let step = 0; step <= steps; step++) {
      const t = step / steps;
      const x = Math.round(toX + (fromX - toX) * t);
      const y = Math.round(toY + (top - 10 - toY) * t);
      this.rect(OUTLINE, x - 1, y - 2, 4, 5);
      this.rect(step % 3 === 0 ? ROPE_GLINT : ROPE_LIGHT, x, y - 1, 2, 2);
    }
  }

  private rail(x: number, y: number, height: number, phase: number): void {
    this.rect(OUTLINE, x - 3, y, 6, height);
    this.rect(ROPE_SHADE, x - 2, y, 4, height);
    this.rect(phase % 8 === 0 ? ROPE_GLINT : ROPE_LIGHT, x - 2, y, 2, height);
  }

  private rung(x: number, y: number): void {
    this.rect(OUTLINE, x - 13, y - 2, 27, 7);
    this.rect(IRON, x - 11, y - 1, 23, 5);
    this.rect(IRON_LIGHT, x - 9, y - 1, 19, 2);
    this.rect(OUTLINE, x - 5, y + 2, 3, 1);
    this.rect(OUTLINE, x + 2, y + 2, 3, 1);
    this.knot(x - HALF_WIDTH, y - 2);
    this.knot(x + HALF_WIDTH, y - 2);
  }

  private knot(x: number, y: number): void {
    this.rect(OUTLINE, x - 4, y, 8, 7);
    this.rect(ROPE_SHADE, x - 3, y + 1, 6, 5);
    this.rect(ROPE_LIGHT, x - 2, y + 1, 4, 2);
  }

  private anchor(x: number, top: number): void {
    this.rect(OUTLINE, x - 10, top - 6, 20, 6);
    this.rect(OUTLINE, x - 6, top - 19, 12, 17);
    this.rect(IRON, x - 8, top - 5, 16, 3);
    this.rect(IRON, x - 5, top - 17, 10, 14);
    this.rect(IRON_LIGHT, x - 4, top - 16, 8, 4);
    this.rect(LEATHER, x - 5, top - 11, 10, 4);
    this.rect(ROPE_GLINT, x - 2, top - 10, 4, 2);
  }

  private rect(
    color: number,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    this.pixels.fillStyle(color).fillRect(x, y, w, h);
  }
}
