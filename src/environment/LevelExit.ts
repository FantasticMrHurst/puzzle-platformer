import type Phaser from 'phaser';

import type { ExitData } from '../levels/LevelSchema';

const WAITING_COLOR = 0x38bdf8;
const COMPLETE_COLOR = 0x22c55e;

export class LevelExit {
  private readonly area: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;

  public constructor(
    scene: Phaser.Scene,
    data: ExitData,
    private readonly requiredCount: number,
  ) {
    this.area = scene.add
      .rectangle(
        data.x + data.width / 2,
        data.y + data.height / 2,
        data.width,
        data.height,
        WAITING_COLOR,
        0.16,
      )
      .setStrokeStyle(4, WAITING_COLOR, 0.9)
      .setDepth(2)
      .setData('levelEntityId', data.id);
    this.label = scene.add
      .text(data.x + data.width / 2, data.y + 12, '', {
        backgroundColor: '#080b16dd',
        color: '#e0f2fe',
        fontFamily: 'ui-monospace, monospace',
        fontSize: '16px',
        fontStyle: 'bold',
        padding: { x: 8, y: 5 },
      })
      .setOrigin(0.5, 0)
      .setDepth(3);
    this.reset();
  }

  public setProgress(arrivedCount: number, complete: boolean): void {
    const color = complete ? COMPLETE_COLOR : WAITING_COLOR;
    this.area.setFillStyle(color, complete ? 0.28 : 0.16);
    this.area.setStrokeStyle(4, color, 0.9);
    this.label
      .setColor(complete ? '#dcfce7' : '#e0f2fe')
      .setText(
        complete
          ? 'EXIT COMPLETE'
          : `EXIT · ${arrivedCount}/${this.requiredCount}`,
      );
  }

  public reset(): void {
    this.setProgress(0, false);
  }
}
