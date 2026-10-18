import { expect, test } from './fixtures';
test('groups three languages, escalates, and opens the responder story', async ({
  page,
}) => {
  await page.goto('/report');
  for (const text of [
    'Two men on a motorbike keep circling near DHA, looking suspicious',
    'DHA pe do bike wale log mashkook ghoom rahe hain, abhi bhi wahin hain',
    'ڈیفنس میں دکان پر ڈکیتی ہوئی، دو لوگ پستول کے ساتھ تھے',
  ]) {
    await page.getByLabel('What happened').fill(text);
    await page.getByLabel('When', { exact: true }).fill('abhi');
    await page.getByRole('button', { name: 'Analyze report' }).click();
    if (text.startsWith('ڈیفنس')) break;
    await expect(
      page.getByRole('heading', { name: 'Report analyzed' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'New report', exact: true }).click();
  }
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await expect(page.getByRole('alertdialog')).toContainText(
    'Incident escalated',
  );
  await page
    .getByRole('alertdialog')
    .getByRole('link', { name: 'Open incident', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Robbery in DHA' }),
  ).toBeVisible();
  await expect(page.locator('.timeline')).toContainText('Escalated');
  await expect(page.locator('.evidence-panel')).toContainText('Supported');
  await expect(page.locator('.report-card')).toHaveCount(3);
});
