import Phaser from 'phaser';

import { CREW_ARCHETYPES } from './entities/CharacterCatalog';
import { gameConfig } from './game/config';
import { CREW_ABILITIES_LAB_ID } from './levels/crewAbilitiesLab';
import { VERDANT_RUINS_ID } from './levels/verdantRuins';
import { enableCharacterArt } from './rendering/CharacterArt';
import { showLabMenu } from './ui/LabMenu';
import './style.css';

const params = new URLSearchParams(window.location.search);
const gameContainer = document.querySelector<HTMLElement>('#game')!;

if (
  import.meta.env.DEV &&
  params.get('level') === CREW_ABILITIES_LAB_ID &&
  params.get('tune') === '1'
) {
  enableCharacterArt(params, CREW_ARCHETYPES);
  const url = new URL(window.location.href);
  url.search = params.toString();
  window.history.replaceState(window.history.state, '', url);
}

if (params.has('level') || params.get('pilotArt') === '1') {
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
