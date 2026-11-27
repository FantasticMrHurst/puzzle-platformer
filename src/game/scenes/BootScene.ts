import Phaser from 'phaser';

import { TinkererCompanion } from '../../entities/TinkererCompanion';
import { CHARACTER_ART } from '../../rendering/CharacterArt';
import { TinkererArt } from '../../rendering/TinkererArt';

export class BootScene extends Phaser.Scene {
  public constructor() {
    super('boot');
  }

  public preload(): void {
    const params = new URLSearchParams(window.location.search);
    for (const art of Object.values(CHARACTER_ART)) {
      if (params.get(art.previewFlag) === '1') {
        this.load.atlas(art.textureKey, art.textureUrl, art.atlasUrl);
      }
    }
    TinkererArt.preload(this);
    TinkererCompanion.preload(this);
  }

  public create(): void {
    this.scene.start('test-room');
  }
}
