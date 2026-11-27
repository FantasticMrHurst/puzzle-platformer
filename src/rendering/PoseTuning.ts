export interface PoseTuning {
  readonly idleFrameMs: number;
  readonly runCyclePx: number;
  readonly scale: number;
  readonly offsetX: number;
  readonly offsetY: number;
}

export const DEFAULT_PILOT_POSE_TUNING: PoseTuning = {
  idleFrameMs: 150,
  runCyclePx: 160,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

export const DEFAULT_BRUTE_POSE_TUNING: PoseTuning = {
  ...DEFAULT_PILOT_POSE_TUNING,
  idleFrameMs: 160,
  runCyclePx: 176,
};
