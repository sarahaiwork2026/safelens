import { expect, test } from './fixtures';
for (const { text, area } of [
  { text: 'Someone broke into a house and stole jewellery', area: 'Saddar' },
  {
    text: 'Ek ladki ko kuch log pareshan kar rahe hain, madad chahiye',
    area: 'Lyari',
  },
])
  test(`stores a complete signed follow-up for ${area}`, async ({ page }) => {
    await page.goto('/report');
    await page.getByLabel('What happened').fill(text);
    await page.getByLabel('When', { exact: true }).fill('abhi');
    await page.getByRole('button', { name: 'Analyze report' }).click();
    await expect(page.locator('.follow-up')).toBeVisible();
    await page
      .locator('.follow-up')
      .getByRole('combobox', { name: 'Area' })
      .click();
    await page.getByPlaceholder('Search areas').fill(area);
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Report analyzed' }),
    ).toBeVisible();
    await expect(page.locator('.structured-result')).toContainText(area);
  });
