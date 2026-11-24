import { expect, test, type Page } from '@playwright/test';

interface TestProbe {
  readonly scene: string;
  readonly debugOverlayVisible: boolean;
  readonly activeCharacterId: string;
  readonly roomComplete: boolean;
  readonly exit: {
    readonly arrivedCount: number;
    readonly requiredCount: number;
  };
  readonly roster: readonly {
    readonly id: string;
    readonly active: boolean;
    readonly position: { readonly x: number; readonly y: number };
  }[];
  readonly movement: {
    readonly position: { readonly x: number; readonly y: number };
    readonly profileName: string;
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

  await page.goto('/?level=traversal-lab');
  const traversalLab = await waitForProbe(page);
  expect(traversalLab.roster.map(({ id }) => id)).toEqual([
    'scout-prototype',
    'pet-prototype',
    'brute-prototype',
  ]);
  expect(traversalLab.movement.profileName).toBe('scout-prototype-v2');

  await page.keyboard.down('Digit2');
  await expect
    .poll(async () => (await readProbe(page)).movement.profileName)
    .toBe('pet-prototype-v2');
  await page.keyboard.up('Digit2');
});

test('responds to movement input', async ({ page }) => {
  await page.goto('/');
  await waitForProbe(page);

  await page.keyboard.down('Digit2');
  await expect
    .poll(async () => (await readProbe(page)).activeCharacterId)
    .toBe('scout-prototype');
  await page.keyboard.up('Digit2');

  const initial = await readProbe(page);
  const initialScout = findRosterMember(initial, 'scout-prototype');

  await page.keyboard.down('KeyD');
  await page.waitForTimeout(500);
  await page.keyboard.up('KeyD');

  await expect
    .poll(
      async () =>
        findRosterMember(await readProbe(page), 'scout-prototype').position.x,
    )
    .toBeGreaterThan(initialScout.position.x + 80);

  await page.keyboard.down('KeyR');
  await expect
    .poll(async () => (await readProbe(page)).activeCharacterId)
    .toBe('brute-prototype');
  await expect
    .poll(
      async () =>
        findRosterMember(await readProbe(page), 'scout-prototype').position.x,
    )
    .toBeLessThanOrEqual(initialScout.position.x + 1);
  await page.keyboard.up('KeyR');
});

function findRosterMember(
  probe: TestProbe,
  id: string,
): TestProbe['roster'][number] {
  const member = probe.roster.find((candidate) => candidate.id === id);
  if (member === undefined) {
    throw new Error(`Roster member "${id}" is not available`);
  }
  return member;
}

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
