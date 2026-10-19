import { expect, test, fixtureMapStyle } from './fixtures';
import AxeBuilder from '@axe-core/playwright';

test('starts light on dark devices and remembers an explicit keyboard theme choice', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
  );
  const button = page.getByRole('button', { name: 'Switch to dark theme' });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.goto('/incidents');
  await expect(
    page.getByRole('button', { name: 'Switch to light theme' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Switch to light theme' }).focus();
  await page.keyboard.press('Space');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('uses the chosen theme for the map instead of the device scheme', async ({
  page,
}) => {
  const styles: string[] = [];
  await page.route('https://tiles.openfreemap.org/**', (route) => {
    styles.push(route.request().url());
    return route.fulfill({ json: fixtureMapStyle });
  });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/map');
  await expect
    .poll(() => styles.some((url) => url.endsWith('/positron')))
    .toBe(true);
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect
    .poll(() => styles.some((url) => url.endsWith('/dark')))
    .toBe(true);
});
