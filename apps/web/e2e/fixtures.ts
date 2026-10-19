import { test as base, expect } from '@playwright/test';
let session:
  | {
      name: string;
      value: string;
      domain: string;
      path: string;
      expires: number;
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'Strict' | 'Lax' | 'None';
    }[]
  | undefined;
export const test = base.extend<{ isolatedRateKey: undefined; admin: boolean }>(
  {
    admin: [true, { option: true }],
    isolatedRateKey: [
      async ({ context, baseURL, admin }, use, info) => {
        let key = 0;
        for (const char of info.testId)
          key = (key * 31 + char.charCodeAt(0)) >>> 0;
        await context.setExtraHTTPHeaders({
          'CF-Connecting-IP': `192.0.${((key >>> 8) % 250) + 1}.${(key % 250) + 1}`,
        });
        if (admin) {
          if (!session) {
            const response = await context.request.post(
              `${baseURL}/api/auth/login`,
              {
                headers: { Origin: baseURL ?? '' },
                data: {
                  email: 'admin@safelens.test',
                  password: 'Local-only-test-password-2026',
                },
              },
            );
            expect(response.ok()).toBe(true);
            session = (await context.storageState()).cookies;
          }
          await context.addCookies(session);
        }
        await use(undefined);
      },
      { auto: true },
    ],
  },
);
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
