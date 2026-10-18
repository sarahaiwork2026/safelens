import type { Locator, Page } from '@playwright/test';
import { expect, test, fixtureMapStyle } from './fixtures';

async function tabTo(page: Page, target: Locator) {
  await target.waitFor({ state: 'visible' });
  const visited = new Set<string>();
  let backwards = false;
  for (let i = 0; i < 120; i++) {
    if (await target.evaluate((element) => element === document.activeElement))
      return;
    if (
      await page.evaluate(
        () => !!document.activeElement?.closest('[data-sonner-toast]'),
      )
    ) {
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-sonner-toast]')).toHaveCount(0);
    }
    const active = await page.evaluate(
      () => document.activeElement?.outerHTML ?? '',
    );
    if (visited.has(active)) backwards = true;
    visited.add(active);
    await page.keyboard.press(backwards ? 'Shift+Tab' : 'Tab');
  }
  throw new Error('The control could not be reached using Tab.');
}
async function activate(page: Page, target: Locator) {
  await tabTo(page, target);
  await page.keyboard.press('Enter');
}
async function enter(page: Page, target: Locator, text: string) {
  await tabTo(page, target);
  await page.keyboard.insertText(text);
}

test('completes reporting, escalation, responder, map, follow-up and Test Lab using only the keyboard', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.route('https://tiles.openfreemap.org/**', (route) =>
    route.fulfill({ json: fixtureMapStyle }),
  );
  await page.goto('/report');
  for (const text of [
    'Suspicious activity in Sea View right now, two people on a motorbike circling',
    'Sea View mein do bike wale log mashkook ghoom rahe hain abhi',
    'Armed robbery in Sea View right now, two people carrying a pistol',
  ]) {
    await enter(page, page.getByLabel('What happened'), text);
    await activate(
      page,
      page.getByRole('button', { name: 'Analyze report', exact: true }),
    );
    if (text.startsWith('Armed')) break;
    await expect(
      page.getByRole('heading', { name: 'Report analyzed' }),
    ).toBeVisible();
    await activate(
      page,
      page.getByRole('button', { name: 'New report', exact: true }),
    );
  }
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await activate(
    page,
    page
      .getByRole('alertdialog')
      .getByRole('link', { name: 'Open incident', exact: true }),
  );
  await expect(page.locator('.report-card')).toHaveCount(3);
  await activate(page, page.getByRole('combobox', { name: 'Status' }));
  await expect(
    page.getByRole('option', { name: 'Escalated', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('m');
  await expect(
    page.getByRole('option', { name: 'Monitoring', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Status set to Monitoring' }),
  ).toBeVisible();
  await activate(
    page,
    page.getByRole('link', { name: 'View on map', exact: true }).first(),
  );
  await expect(page.locator('.map-selection')).toContainText(
    'Robbery in Sea View',
  );
  await activate(
    page,
    page
      .locator('.map-selection')
      .getByRole('link', { name: 'Open incident', exact: true }),
  );
  await expect(page.locator('.report-card')).toHaveCount(3);
  await activate(
    page,
    page.getByRole('link', { name: 'Report', exact: true }).first(),
  );
  await enter(
    page,
    page.getByLabel('What happened'),
    'Someone broke into a house and stole jewellery right now',
  );
  await activate(
    page,
    page.getByRole('button', { name: 'Analyze report', exact: true }),
  );
  await activate(
    page,
    page.locator('.follow-up').getByRole('combobox', { name: 'Area' }),
  );
  await page.keyboard.insertText('Saddar');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await activate(
    page,
    page.getByRole('button', { name: 'Continue', exact: true }),
  );
  await expect(
    page.getByRole('heading', { name: 'Report analyzed' }),
  ).toBeVisible();
  await activate(
    page,
    page.getByRole('link', { name: 'Test Lab', exact: true }).first(),
  );
  await activate(
    page,
    page.getByRole('button', { name: 'Run 25 reports', exact: true }),
  );
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '25', {
    timeout: 30000,
  });
  await expect(page.locator('.lab-coverage .coverage-pass')).toHaveCount(7);
  await activate(
    page,
    page.getByRole('button', { name: 'Reset', exact: true }),
  );
  await activate(
    page,
    page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Reset', exact: true }),
  );
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '0');
});
