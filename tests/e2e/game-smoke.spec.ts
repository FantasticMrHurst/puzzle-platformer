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

test('opens labs from the menu and toggles diagnostics', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Movement Test Room' }).click();

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

  await page.getByRole('link', { name: 'All play labs' }).click();
  await page.getByRole('link', { name: 'Character Traversal Lab' }).click();
  const traversalLab = await waitForProbe(page);
  expect(traversalLab.roster.map(({ id }) => id)).toEqual([
    'pilot-prototype',
    'pet-prototype',
    'brute-prototype',
  ]);
  expect(traversalLab.movement.profileName).toBe('pilot-prototype-v2');

  await page.keyboard.down('Digit2');
  await expect
    .poll(async () => (await readProbe(page)).movement.profileName)
    .toBe('pet-prototype-v2');
  await page.keyboard.up('Digit2');
});

test('responds to movement input', async ({ page }) => {
  await page.goto('/?level=movement-test-room');
  await waitForProbe(page);

  await page.keyboard.down('Digit2');
  await expect
    .poll(async () => (await readProbe(page)).activeCharacterId)
    .toBe('pilot-prototype');
  await page.keyboard.up('Digit2');

  const initial = await readProbe(page);
  const initialPilot = findRosterMember(initial, 'pilot-prototype');

  await page.keyboard.down('KeyD');
  await page.waitForTimeout(500);
  await page.keyboard.up('KeyD');

  await expect
    .poll(
      async () =>
        findRosterMember(await readProbe(page), 'pilot-prototype').position.x,
    )
    .toBeGreaterThan(initialPilot.position.x + 80);

  await page.keyboard.down('KeyR');
  await expect
    .poll(async () => (await readProbe(page)).activeCharacterId)
    .toBe('brute-prototype');
  await expect
    .poll(
      async () =>
        findRosterMember(await readProbe(page), 'pilot-prototype').position.x,
    )
    .toBeLessThanOrEqual(initialPilot.position.x + 1);
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
