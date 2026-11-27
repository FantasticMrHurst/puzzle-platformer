import type Phaser from 'phaser';

export const IDLE_POSES = [
  '01_idle_02.6s',
  '01_idle_02.8s',
  '01_idle_03.2s',
  '01_idle_03.6s',
] as const;
export const RUN_POSES = [
  '02_run_04.2s',
  '02_run_04.4s',
  '02_run_04.6s',
  '02_run_04.8s',
  '02_run_05.0s',
  '02_run_05.2s',
] as const;
export const CLIMB_POSES = [
  '04_gestures_and_turn_10.4s',
  '04_gestures_and_turn_10.6s',
  '04_gestures_and_turn_10.8s',
  '04_gestures_and_turn_11.0s',
] as const;
export const CARRY_POSES = [
  '06_crate_carry_16.8s',
  '06_crate_carry_17.0s',
  '06_crate_carry_17.2s',
  '06_crate_carry_17.4s',
] as const;
export const CARRY_IDLE_POSE = '06_crate_carry_15.2s';
export const RISE_POSE = '03_jump_and_land_06.8s';
export const APEX_POSE = '03_jump_and_land_07.0s';
export const FALL_POSE = '03_jump_and_land_08.6s';
export const LAND_POSE = '03_jump_and_land_07.2s';
export const WALL_POSE = '04_gestures_and_turn_09.0s';

export const EXPLORER_ART_SCALE = 1 / 8;
export const EXPLORER_FOOT_ORIGIN = { x: 216 / 460, y: 491 / 494 };

const frames = import.meta.glob<string>('../assets/verdant-explorer/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
});

export function preloadExplorerArt(scene: Phaser.Scene): void {
  for (const [path, url] of Object.entries(frames)) {
    scene.load.image(path.slice(path.lastIndexOf('/') + 1, -4), url);
  }
}
