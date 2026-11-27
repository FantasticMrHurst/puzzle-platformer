import Phaser from 'phaser';

import { gameConfig } from './game/config';
import { VERDANT_RUINS_ID } from './levels/verdantRuins';
import { showLabMenu } from './ui/LabMenu';
import './style.css';

const params = new URLSearchParams(window.location.search);
const gameContainer = document.querySelector<HTMLElement>('#game')!;

if (params.has('level') || params.get('scoutArt') === '1') {
  document.body.classList.add('playing-lab');
  document.querySelector<HTMLElement>('#lab-nav')!.hidden = false;
  if (params.get('level') === VERDANT_RUINS_ID) {
    let dispose: (() => void) | undefined;
    let cancelled = false;
    void import('./game/runVerdantRuins').then(({ runVerdantRuins }) => {
      if (!cancelled) dispose = runVerdantRuins(gameContainer);
    });
    import.meta.hot?.dispose(() => {
      cancelled = true;
      dispose?.();
    });
  } else {
    const game = new Phaser.Game(gameConfig);
    import.meta.hot?.dispose(() => game.destroy(true));
  }
} else {
  gameContainer.removeAttribute('aria-label');
  showLabMenu(gameContainer);
}
