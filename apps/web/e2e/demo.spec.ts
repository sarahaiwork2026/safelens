import { expect, test, fixtureMapStyle } from './fixtures';
test('completes the exact minimum SafeLens demonstration on a fresh local dataset', async ({
  page,
}) => {
  await page.route('https://tiles.openfreemap.org/**', (route) =>
    route.fulfill({ json: fixtureMapStyle }),
  );
  await page.goto('/report');
  for (const [text, time] of [
    [
      'Two men on a motorbike keep circling near Clifton Block 5, looking suspicious',
      '10 minutes ago',
    ],
    [
      'Clifton Block 5 pe do bike wale log mashkook ghoom rahe hain, abhi bhi wahin hain',
      '5 minutes ago',
    ],
  ]) {
    await page.getByLabel('What happened').fill(text ?? '');
    await page.getByLabel('When', { exact: true }).fill(time ?? '');
    await page.getByRole('button', { name: 'Analyze report' }).click();
    await expect(
      page.getByRole('heading', { name: 'Report analyzed' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'New report', exact: true }).click();
  }
  await page
    .getByLabel('What happened')
    .fill('کلفٹن میں دکان پر ڈکیتی ہوئی، دو لوگ پستول کے ساتھ تھے');
  await page.getByLabel('When', { exact: true }).fill('abhi');
  await page.getByRole('button', { name: 'Analyze report' }).click();
  await expect(page.getByRole('alertdialog')).toContainText(
    'Incident escalated',
  );
  await page
    .getByRole('alertdialog')
    .getByRole('link', { name: 'Open incident', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Robbery in Clifton' }),
  ).toBeVisible();
  await expect(page.locator('.report-card')).toHaveCount(3);
  await expect(page.locator('.evidence-panel')).toContainText('Supported');
  await page.getByRole('combobox', { name: 'Status' }).click();
  await page.getByRole('option', { name: 'Monitoring', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Status set to Monitoring' }),
  ).toBeVisible();
  await page
    .getByRole('link', { name: 'View on map', exact: true })
    .first()
    .click();
  await expect(page.locator('.map-marker.level-high')).toBeVisible();
  await expect(page.locator('.map-selection')).toContainText(
    'Robbery in Clifton',
  );
  await page.goto('/report');
  await page
    .getByLabel('What happened')
    .fill('Someone broke into a house and stole jewellery');
  await page.getByLabel('When', { exact: true }).fill('abhi');
  await page.getByRole('button', { name: 'Analyze report' }).click();
  await expect(page.locator('.follow-up')).toBeVisible();
  await page
    .locator('.follow-up')
    .getByRole('combobox', { name: 'Area' })
    .click();
  await page.getByPlaceholder('Search areas').fill('Saddar');
  await page.getByRole('option').first().click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Report analyzed' }),
  ).toBeVisible();
  await page.goto('/test-lab');
  await page
    .getByRole('button', { name: 'Run 25 reports', exact: true })
    .click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '25', {
    timeout: 30000,
  });
  await expect(page.locator('.lab-coverage .coverage-pass')).toHaveCount(7);
  await expect(
    page.locator('.stat-tile').filter({ hasText: 'Passed' }),
  ).toContainText('25/25');
  await expect(
    page.getByRole('button', { name: 'Run 25 reports', exact: true }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Reset', exact: true })
    .click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '0');
});
