import { test as base, expect } from '@playwright/test';
export const test = base.extend<{ isolatedRateKey: undefined }>({
  isolatedRateKey: [
    async ({ context }, use, info) => {
      let key = 0;
      for (const char of info.testId)
        key = (key * 31 + char.charCodeAt(0)) >>> 0;
      await context.setExtraHTTPHeaders({
        'CF-Connecting-IP': `192.0.${((key >>> 8) % 250) + 1}.${(key % 250) + 1}`,
      });
      await use(undefined);
    },
    { auto: true },
  ],
});
export { expect };
export const fixtureMapStyle = {
  version: 8,
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#F8F5F0' },
    },
  ],
};
