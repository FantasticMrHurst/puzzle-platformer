export const GAMEPLAY_STEP_SECONDS = 1 / 60;
export const MAX_CATCH_UP_STEPS = 5;

export class FixedStepClock {
  private accumulatorSeconds = 0;

  public constructor(
    private readonly stepSeconds = GAMEPLAY_STEP_SECONDS,
    private readonly maxCatchUpSteps = MAX_CATCH_UP_STEPS,
  ) {
    if (!Number.isFinite(stepSeconds) || stepSeconds <= 0) {
      throw new RangeError(
        'stepSeconds must be a finite number greater than 0',
      );
    }
    if (!Number.isInteger(maxCatchUpSteps) || maxCatchUpSteps <= 0) {
      throw new RangeError('maxCatchUpSteps must be a positive integer');
    }
  }

  public advance(deltaSeconds: number, simulateStep: () => void): number {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
      throw new RangeError(
        'deltaSeconds must be a finite number greater than or equal to 0',
      );
    }

    const maximumAccumulatedSeconds = this.stepSeconds * this.maxCatchUpSteps;
    this.accumulatorSeconds = Math.min(
      this.accumulatorSeconds + deltaSeconds,
      maximumAccumulatedSeconds,
    );

    let steps = 0;
    const floatingPointTolerance = this.stepSeconds * 1e-9;

    while (
      this.accumulatorSeconds + floatingPointTolerance >= this.stepSeconds &&
      steps < this.maxCatchUpSteps
    ) {
      simulateStep();
      this.accumulatorSeconds = Math.max(
        0,
        this.accumulatorSeconds - this.stepSeconds,
      );
      steps += 1;
    }

    return steps;
  }

  public reset(): void {
    this.accumulatorSeconds = 0;
  }
}
