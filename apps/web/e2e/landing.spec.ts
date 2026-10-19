import { expect, test } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
test('loads the generated product story without API or map requests and links to working pages', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto('/');
  await expect(
    page.getByRole('heading', {
      name: 'Scattered reports, one clear incident story',
    }),
  ).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(requests.filter((r) => r.includes('/api/'))).toEqual([]);
  expect(
    requests.filter((r) =>
      /MapCanvas|maplibre|test-lab\/TestLabPage|report\/ReportPage/.test(r),
    ),
  ).toEqual([]);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page
    .getByRole('link', { name: 'Report an incident', exact: true })
    .first()
    .click();
  await expect(
    page.getByRole('heading', { name: 'Report an incident' }),
  ).toBeVisible();
  await page.goto('/');
  await page
    .getByRole('link', { name: 'Run the Test Lab', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Run 25 reports', exact: true }),
  ).toBeVisible();
});
test('landing screenshots and accessibility match responsive light and dark layouts', async ({
  page,
}, testInfo) => {
  for (const scheme of ['light', 'dark'] as const)
    for (const width of [390, 1440]) {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height: 1000 });
      await page.goto('/');
      if ((await page.locator('html').getAttribute('data-theme')) !== scheme)
        await page
          .getByRole('button', { name: `Switch to ${scheme} theme` })
          .click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: testInfo.outputPath(`landing-${scheme}-${width}.png`),
        fullPage: true,
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
});

test('entry pages render useful HTML before JavaScript and keep the form inert until hydration', async ({
  browser,
  baseURL,
}) => {
  if (!baseURL) throw new Error('Playwright requires a configured base URL.');
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
  });
  const page = await context.newPage();
  for (const [path, heading] of [
    ['/', 'Scattered reports, one clear incident story'],
    ['/report', 'Report an incident'],
    ['/login', 'Admin sign in'],
    ['/chat', 'Ask SafeLens'],
  ] as const) {
    await page.goto(path ?? '/');
    await expect(
      page.getByRole('heading', { name: heading, exact: true }),
    ).toBeVisible();
    if (path === '/report')
      await expect(page.getByLabel('What happened')).toBeDisabled();
    if (path === '/login') {
      await expect(page.getByLabel('Email', { exact: true })).toBeDisabled();
      await expect(page.getByLabel('Password', { exact: true })).toBeDisabled();
    }
    if (path === '/chat')
      await expect(page.getByLabel('Your question')).toBeDisabled();
  }
  await context.close();
});
