import { expect, test, type Page } from '@playwright/test';

interface TestProbe {
  readonly scene: string;
  readonly debugOverlayVisible: boolean;
  readonly movement: {
    readonly position: { readonly x: number; readonly y: number };
    readonly timing: {
      readonly totalSimulationSteps: number;
      readonly totalRenderedFrames: number;
    };
  };
}

test('boots the movement room and toggles diagnostics', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('canvas')).toBeVisible();
  await expect
    .poll(() => readProbe(page))
    .toMatchObject({
      scene: 'test-room',
      debugOverlayVisible: false,
    });

  await page.keyboard.press('F3');
  await expect
    .poll(() => readProbe(page))
    .toMatchObject({
      debugOverlayVisible: true,
    });
});

test('responds to movement input', async ({ page }) => {
  await page.goto('/');
  const initial = await waitForProbe(page);

  await page.keyboard.down('KeyD');
  await page.waitForTimeout(500);
  await page.keyboard.up('KeyD');

  await expect
    .poll(async () => (await readProbe(page)).movement.position.x)
    .toBeGreaterThan(initial.movement.position.x + 80);
});

for (const renderRate of [30, 120]) {
  test(`advances fixed gameplay under ${renderRate} Hz render emulation`, async ({
    page,
  }) => {
    await emulateRenderRate(page, renderRate);
    await page.goto('/');
    const initial = await waitForProbe(page);
    const targetRenderedFrames = Math.round(renderRate / 2);

    await page.keyboard.down('KeyD');
    await expect
      .poll(
        async () =>
          (await readProbe(page)).movement.timing.totalRenderedFrames -
          initial.movement.timing.totalRenderedFrames,
      )
      .toBeGreaterThanOrEqual(targetRenderedFrames);
    await page.keyboard.up('KeyD');

    const final = await readProbe(page);
    const simulatedSteps =
      final.movement.timing.totalSimulationSteps -
      initial.movement.timing.totalSimulationSteps;
    const renderedFrames =
      final.movement.timing.totalRenderedFrames -
      initial.movement.timing.totalRenderedFrames;
    const expectedSimulationSteps = renderedFrames * (60 / renderRate);

    expect(
      Math.abs(simulatedSteps - expectedSimulationSteps),
    ).toBeLessThanOrEqual(1);
    expect(final.movement.position.x).toBeGreaterThan(
      initial.movement.position.x + 120,
    );
  });
}

async function waitForProbe(page: Page): Promise<TestProbe> {
  await expect
    .poll(() => readProbe(page))
    .toMatchObject({ scene: 'test-room' });
  return readProbe(page);
}

async function readProbe(page: Page): Promise<TestProbe> {
  return page.evaluate(() => {
    const probe = window.__PUZZLE_PLATFORMER_TEST__;
    if (probe === undefined) {
      throw new Error('Test probe is not available');
    }
    return probe;
  });
}

async function emulateRenderRate(
  page: Page,
  framesPerSecond: number,
): Promise<void> {
  await page.addInitScript((requestedFramesPerSecond) => {
    const frameDurationMs = 1_000 / requestedFramesPerSecond;
    const callbacks = new Map<number, ReturnType<typeof setTimeout>>();
    let nextRequestId = 1;
    let virtualTimeMs = performance.now();

    window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
      const requestId = nextRequestId;
      nextRequestId += 1;
      const timeout = setTimeout(() => {
        callbacks.delete(requestId);
        virtualTimeMs += frameDurationMs;
        callback(virtualTimeMs);
      }, frameDurationMs);
      callbacks.set(requestId, timeout);
      return requestId;
    };

    window.cancelAnimationFrame = (requestId: number): void => {
      const timeout = callbacks.get(requestId);
      if (timeout !== undefined) {
        clearTimeout(timeout);
        callbacks.delete(requestId);
      }
    };
  }, framesPerSecond);
}
