import Phaser from 'phaser';

import { gameConfig } from './game/config';
import { showLabMenu } from './ui/LabMenu';
import './style.css';

const params = new URLSearchParams(window.location.search);
const gameContainer = document.querySelector<HTMLElement>('#game')!;

if (params.has('level') || params.get('scoutArt') === '1') {
  document.body.classList.add('playing-lab');
  document.querySelector<HTMLElement>('#lab-nav')!.hidden = false;
  const game = new Phaser.Game(gameConfig);
  import.meta.hot?.dispose(() => game.destroy(true));
} else {
  gameContainer.removeAttribute('aria-label');
  showLabMenu(gameContainer);
}
