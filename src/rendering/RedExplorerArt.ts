import type Phaser from 'phaser';

export type ExplorerPose =
  | 'idle'
  | 'run-0'
  | 'run-1'
  | 'run-2'
  | 'run-3'
  | 'rise'
  | 'fall'
  | 'wall'
  | 'carry-0'
  | 'carry-1'
  | 'carry-2'
  | 'carry-3'
  | 'climb-0'
  | 'climb-1';

const POSES: readonly ExplorerPose[] = [
  'idle',
  'run-0',
  'run-1',
  'run-2',
  'run-3',
  'rise',
  'fall',
  'wall',
  'carry-0',
  'carry-1',
  'carry-2',
  'carry-3',
  'climb-0',
  'climb-1',
];
const WIDTH = 32;
const HEIGHT = 42;
const INK = '#2e2230';
const CRIMSON = '#b33946';
const RED = '#e45551';
const LIGHT = '#f47c64';
const SCARF = '#e7ab55';
const SKIN = '#ebbc8c';
const GLOVE = '#557c7d';
const TROUSER = '#555066';
const BOOT = '#6a443a';

export function createExplorerArt(scene: Phaser.Scene): void {
  for (const pose of POSES) {
    const texture = scene.textures.createCanvas(
      `red-explorer-${pose}`,
      WIDTH,
      HEIGHT,
    )!;
    const context = texture.context;
    const box = (
      color: string,
      x: number,
      y: number,
      width: number,
      height: number,
    ) => {
      context.fillStyle = color;
      context.fillRect(x, y, width, height);
    };

    const carrying = pose.startsWith('carry-');
    const running = pose.startsWith('run-') || carrying;
    const stride = pose.endsWith('-0') ? -4 : pose.endsWith('-2') ? 4 : 0;
    const climbing = pose.startsWith('climb-');
    const raised = pose === 'wall' || climbing || carrying;
    const airborne = pose === 'rise' || pose === 'fall' || pose === 'wall';
    const bob = pose === 'run-1' || pose === 'run-3' ? 1 : 0;
    const leftLeg = 10 + stride;
    const rightLeg = 17 - stride;
    const leftFoot = HEIGHT - (airborne || climbing ? 4 : 0);
    const rightFoot = HEIGHT - (pose === 'rise' || pose === 'climb-1' ? 7 : 0);

    box(INK, leftLeg - 1, 27, 8, leftFoot - 27);
    box(TROUSER, leftLeg, 28, 6, leftFoot - 31);
    box(BOOT, leftLeg, leftFoot - 4, 7, 3);
    box(INK, rightLeg - 1, 27, 8, rightFoot - 27);
    box(TROUSER, rightLeg, 28, 6, rightFoot - 31);
    box(BOOT, rightLeg, rightFoot - 4, 8, 3);

    box(INK, 7, 17 + bob, 18, 15);
    box(CRIMSON, 8, 18 + bob, 16, 13);
    box(RED, 10, 19 + bob, 12, 9);
    box(INK, 8, 26, 16, 3);
    box(SCARF, 17, 26, 3, 3);
    if (!carrying) {
      box(CRIMSON, running ? 2 : 4, 20 + bob, 6, 4);
      box(SCARF, running ? 3 : 5, 19 + bob, 8, 3);
    }
    box(INK, 8, 5 + bob, 18, 13);
    box(INK, 11, 2 + bob, 11, 6);
    box(CRIMSON, 9, 6 + bob, 16, 11);
    box(RED, 11, 4 + bob, 11, 7);
    box(LIGHT, 13, 4 + bob, 5, 2);
    box(SKIN, 17, 10 + bob, 8, 7);
    box(INK, 21, 11 + bob, 2, 2);
    box(SCARF, 10, 17 + bob, 14, 3);

    const reach = climbing && pose === 'climb-0' ? 9 : 13;
    const handY = raised ? reach : running ? 23 + (stride > 0 ? -3 : 2) : 23;
    box(INK, 22, Math.min(handY, 20), 7, Math.abs(handY - 20) + 7);
    box(RED, 23, Math.min(handY, 20) + 1, 4, Math.abs(handY - 20) + 4);
    box(GLOVE, 24, handY + 2, 4, 4);
    if (carrying || climbing) {
      box(INK, 3, 10 + (climbing ? 4 : 0), 6, 15);
      box(RED, 4, 13 + (climbing ? 4 : 0), 4, 10);
      box(GLOVE, 4, 11 + (climbing ? 4 : 0), 4, 4);
    }
    texture.refresh();
  }
}
