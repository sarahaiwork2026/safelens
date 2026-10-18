import { expect, test, fixtureMapStyle } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
test('every route has zero axe violations, browser errors or warnings in both schemes', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text());
  });
  await page.route('https://tiles.openfreemap.org/**', (route) =>
    route.fulfill({ json: fixtureMapStyle }),
  );
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
    for (const path of [
      '/',
      '/report',
      '/incidents',
      '/incidents/1',
      '/map',
      '/test-lab',
      '/about',
      '/does-not-exist',
    ]) {
      await page.goto(path);
      await expect(page.locator('h1')).toHaveCount(1);
      await page.waitForLoadState('networkidle');
      expect(
        (await new AxeBuilder({ page }).analyze()).violations,
        `${scheme} ${path}`,
      ).toEqual([]);
    }
  }
  expect(errors).toEqual([]);
});
test('keyboard-only report flow focuses the result and preserves reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/report');
  for (let i = 0; i < 20; i++) {
    if (await page.evaluate(() => document.activeElement?.id === 'description'))
      break;
    await page.keyboard.press('Tab');
  }
  await expect(page.getByLabel('What happened')).toBeFocused();
  await page.keyboard.insertText(
    'Suspicious activity in Garden East right now, strange people circling',
  );
  await page.keyboard.press('Control+Enter');
  await expect(
    page.getByRole('heading', { name: 'Report analyzed' }),
  ).toBeFocused();
  expect(
    await page.evaluate(
      () =>
        document.getAnimations().filter((a) => a.playState === 'running')
          .length,
    ),
  ).toBe(0);
});
test('offline mode keeps report text and disables submission', async ({
  page,
  context,
}) => {
  await page.goto('/report');
  await page
    .getByLabel('What happened')
    .fill('Suspicious activity in Clifton right now');
  await context.setOffline(true);
  await expect(
    page.getByRole('status').filter({ hasText: "You're offline" }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Analyze report' }),
  ).toBeDisabled();
  await expect(page.getByLabel('What happened')).toHaveValue(
    'Suspicious activity in Clifton right now',
  );
  await context.setOffline(false);
  await expect(
    page.getByRole('button', { name: 'Analyze report' }),
  ).toBeEnabled();
});
