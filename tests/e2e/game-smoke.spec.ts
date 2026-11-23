import { expect, test, type Page } from '@playwright/test';

interface TestProbe {
  readonly scene: string;
  readonly debugOverlayVisible: boolean;
  readonly movement: {
    readonly position: { readonly x: number; readonly y: number };
  };
}

test('boots the movement room and toggles diagnostics', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('canvas')).toBeVisible();
  const initial = await waitForProbe(page);
  expect(initial).toMatchObject({
    scene: 'test-room',
    debugOverlayVisible: false,
  });

  await page.keyboard.down('F3');
  await expect
    .poll(() => readProbe(page))
    .toMatchObject({
      debugOverlayVisible: true,
    });
  await page.keyboard.up('F3');
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

async function waitForProbe(page: Page): Promise<TestProbe> {
  await page.waitForFunction(
    () => window.__PUZZLE_PLATFORMER_TEST__?.scene === 'test-room',
  );
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
