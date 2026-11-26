import Phaser from 'phaser';

import { BrutePosePreview } from '../../rendering/BrutePosePreview';
import { ScoutPosePreview } from '../../rendering/ScoutPosePreview';

export class BootScene extends Phaser.Scene {
  public constructor() {
    super('boot');
  }

  public preload(): void {
    ScoutPosePreview.preload(this);
    BrutePosePreview.preload(this);
  }

  public create(): void {
    this.scene.start('test-room');
  }
}
