import Phaser from 'phaser';

import { TinkererCompanion } from '../../entities/TinkererCompanion';
import { BrutePosePreview } from '../../rendering/BrutePosePreview';
import { ScoutPosePreview } from '../../rendering/ScoutPosePreview';
import { TinkererArt } from '../../rendering/TinkererArt';

export class BootScene extends Phaser.Scene {
  public constructor() {
    super('boot');
  }

  public preload(): void {
    ScoutPosePreview.preload(this);
    BrutePosePreview.preload(this);
    TinkererArt.preload(this);
    TinkererCompanion.preload(this);
  }

  public create(): void {
    this.scene.start('test-room');
  }
}
