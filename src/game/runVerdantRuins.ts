import Phaser from 'phaser';

import { VIEW_HEIGHT, VIEW_WIDTH } from '../levels/verdantRuins';
import { gameConfig } from './config';
import { VerdantRuinsScene } from './scenes/VerdantRuinsScene';

export function runVerdantRuins(container: HTMLElement): () => void {
  container.classList.add('verdant-ruins-view');
  const game = new Phaser.Game({
    ...gameConfig,
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
    pixelArt: true,
    scale: { mode: Phaser.Scale.NONE },
    scene: [VerdantRuinsScene],
  });
  const sizeCanvas = () => {
    if (!game.canvas) return;
    const fit = Math.min(
      container.clientWidth / VIEW_WIDTH,
      container.clientHeight / VIEW_HEIGHT,
    );
    const scale = Math.max(1, Math.floor(fit));
    game.canvas.style.width = `${VIEW_WIDTH * scale}px`;
    game.canvas.style.height = `${VIEW_HEIGHT * scale}px`;
  };
  const observer = new ResizeObserver(sizeCanvas);
  observer.observe(container);
  game.events.once(Phaser.Core.Events.READY, sizeCanvas);
  return () => {
    observer.disconnect();
    game.destroy(true);
  };
}
