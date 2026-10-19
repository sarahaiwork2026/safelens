import { expect, test, fixtureMapStyle } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
test.use({ admin: false });

test('requires login, restores the requested page and blocks data after logout', async ({
  page,
  context,
  baseURL,
}) => {
  expect((await context.request.get('/api/incidents')).status()).toBe(401);
  expect((await context.request.get('/api/test-runs/missing')).status()).toBe(
    401,
  );
  await page.goto('/incidents');
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.getByLabel('Email', { exact: true }).fill('admin@safelens.test');
  await page.getByLabel('Password', { exact: true }).fill('incorrect');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('incorrect');
  await page
    .getByLabel('Password', { exact: true })
    .fill('Local-only-test-password-2026');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(`${baseURL}/incidents`);
  expect((await context.request.get('/api/incidents')).status()).toBe(200);
  const cookies = await context.cookies();
  expect(cookies.find((c) => c.name === 'safelens_admin')?.httpOnly).toBe(true);
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect((await context.request.get('/api/incidents')).status()).toBe(401);
  await page.goto('/map');
  await expect(
    page.getByRole('heading', { name: 'Admin sign in' }),
  ).toBeVisible();
});

test('public chat supports languages, safe no-data answers, follow-ups and limits', async ({
  page,
}) => {
  await page.goto('/chat');
  await page.getByLabel('Your question').fill('Is Garden East safe?');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.locator('.chat-answer-text')).toContainText(
    'does not mean',
  );
  await page.getByLabel('Your question').fill('مجھے گیس کی بو آ رہی ہے');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.locator('.chat-answer-text').last()).toHaveAttribute(
    'lang',
    'ur',
  );
  await expect(page.locator('.chat-guidance').last()).toContainText('سوئچ');
  await page.getByLabel('Your question').fill('Mujhe gas ki boo aa rahi hai');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.locator('.chat-answer-text').last()).toHaveAttribute(
    'lang',
    'ur-Latn',
  );
  await page.getByLabel('Your question').fill('Clifton updates?');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Chat limit reached');
  await expect(page.getByLabel('Your question')).toHaveValue(
    'Clifton updates?',
  );
  await page.getByRole('button', { name: 'Clear chat' }).click();
  await expect(page.locator('.chat-turn')).toHaveCount(0);
});

test('login and chat work by keyboard at mobile widths in both themes', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.route('https://tiles.openfreemap.org/**', (route) =>
    route.fulfill({ json: fixtureMapStyle }),
  );
  for (const path of ['/login', '/chat'])
    for (const theme of ['light', 'dark']) {
      await page.goto(path);
      if ((await page.locator('html').getAttribute('data-theme')) !== theme) {
        await page
          .getByRole('button', { name: `Switch to ${theme} theme` })
          .focus();
        await page.keyboard.press('Enter');
      }
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  await page.getByLabel('Your question').focus();
  await page.keyboard.insertText('Gas leak in Korangi');
  await page.keyboard.press('Control+Enter');
  await expect(page.locator('.chat-answer')).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test.describe('official references', () => {
  test.use({ admin: true });
  test('attaches an admin-reviewed reference, cites it in public chat and opens the map', async ({
    page,
    context,
    baseURL,
  }) => {
    const response = await context.request.post('/api/reports', {
      headers: { Origin: baseURL ?? '' },
      data: { text: 'Gas leak smell in Korangi', time: 'abhi' },
    });
    expect(response.ok()).toBe(true);
    const { incident } = await response.json();
    await page.goto(`/incidents/${incident.ref}`);
    await page.getByText('Attach source', { exact: true }).first().click();
    await page.getByLabel('Source title').fill('Official contact directory');
    await page
      .getByLabel('Official page URL')
      .fill('https://karachipolice.gov.pk/?p=46');
    await page
      .getByLabel('What this source says')
      .fill(
        'Official emergency contact directory. This reference does not confirm the reported incident.',
      );
    await page
      .getByLabel('Publication date and time (Karachi)')
      .fill('2026-10-18T12:00');
    await page.getByLabel('I reviewed this official page').check();
    await page
      .getByRole('button', { name: 'Attach source', exact: true })
      .click();
    await expect(
      page.getByRole('link', { name: 'Official contact directory' }),
    ).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.goto('/chat');
    await page.getByLabel('Your question').fill('Any reports in Korangi?');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await expect(
      page.getByRole('link', { name: 'Official contact directory' }),
    ).toBeVisible();
    await expect(page.locator('.chat-incidents')).toContainText(
      'Community report, unverified',
    );
    await page.route('https://tiles.openfreemap.org/**', (route) =>
      route.fulfill({ json: fixtureMapStyle }),
    );
    await page
      .getByRole('button', { name: 'Show matching areas on map' })
      .click();
    await expect(page.locator('.chat-map .maplibregl-canvas')).toBeVisible();
    await expect(page.locator('.chat-map .map-marker').first()).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.goto(`/incidents/${incident.ref}`);
    await page.getByRole('button', { name: 'Remove source' }).click();
    await expect(
      page.getByRole('link', { name: 'Official contact directory' }),
    ).toHaveCount(0);
  });
});
