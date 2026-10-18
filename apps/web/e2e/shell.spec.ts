import { expect, test } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
for (const scheme of ['light', 'dark'] as const)
  for (const width of [320, 1440])
    test(`accessible shell ${scheme} ${width}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height: 900 });
      for (const path of [
        '/report',
        '/incidents',
        '/map',
        '/test-lab',
        '/about',
      ]) {
        await page.goto(path);
        await expect(page.locator('h1')).toHaveCount(1);
        await page.waitForTimeout(300);
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual(
          [],
        );
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
    });
