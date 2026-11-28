import type Phaser from 'phaser';

export type PowerShape = 'square' | 'circle' | 'triangle';

export interface PowerSignLayout {
  readonly x: number;
  readonly floorY: number;
  readonly color: number;
  readonly shape: PowerShape;
}

const PANEL_EDGE = 0x172232;
const SYMBOL_LIGHT = 0xf8fafc;

export function drawPowerShape(
  graphics: Phaser.GameObjects.Graphics,
  shape: PowerShape,
  x: number,
  y: number,
  radius: number,
  color: number,
): void {
  graphics.fillStyle(color);
  if (shape === 'square') {
    graphics.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  } else if (shape === 'circle') {
    graphics.fillCircle(x, y, radius);
  } else {
    graphics.fillTriangle(
      x,
      y - radius,
      x + radius,
      y + radius - 2,
      x - radius,
      y + radius - 2,
    );
  }
}

export function drawPowerSign(
  scene: Phaser.Scene,
  { x, floorY, color, shape }: PowerSignLayout,
): void {
  const sign = scene.add.graphics().setDepth(2);
  const y = floorY - 64;
  sign.fillStyle(PANEL_EDGE).fillRect(x - 5, y + 12, 10, floorY - y - 12);
  sign.fillStyle(0x768896).fillRect(x - 2, y + 18, 3, floorY - y - 22);
  sign.fillStyle(0x495566).fillRect(x - 12, floorY - 5, 24, 5);

  // Chamfered plates share a housing so the symbol and paint identify each line.
  for (const [size, paint] of [
    [26, PANEL_EDGE],
    [23, SYMBOL_LIGHT],
    [20, color],
  ] as const) {
    const corner = 8;
    sign.fillStyle(paint).fillPoints(
      [
        { x: x - size + corner, y: y - size },
        { x: x + size - corner, y: y - size },
        { x: x + size, y: y - size + corner },
        { x: x + size, y: y + size - corner },
        { x: x + size - corner, y: y + size },
        { x: x - size + corner, y: y + size },
        { x: x - size, y: y + size - corner },
        { x: x - size, y: y - size + corner },
      ],
      true,
    );
  }
  drawPowerShape(sign, shape, x, y, 12, SYMBOL_LIGHT);
}
