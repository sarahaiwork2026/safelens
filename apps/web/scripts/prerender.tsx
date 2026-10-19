import { StrictMode } from 'react';
import { readFile, writeFile } from 'node:fs/promises';
import { renderToPipeableStream } from 'react-dom/server';
import { PassThrough } from 'node:stream';
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
} from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { resolveRoutes } from '../src/router';
import { prepareShell } from '../src/app/AppShell';
import { ErrorBoundary } from '../src/app/ErrorBoundary';
await prepareShell();
const template = await readFile('dist/client/index.html', 'utf8');
for (const [path, file] of [
  ['/', 'landing.html'],
  ['/report', 'report.html'],
  ['/login', 'login.html'],
  ['/chat', 'chat.html'],
] as const) {
  const handler = createStaticHandler(await resolveRoutes(path)),
    context = await handler.query(new Request(`http://safelens.local${path}`));
  if (context instanceof Response)
    throw new Error(`Prerender unexpectedly returned ${context.status}`);
  const router = createStaticRouter(handler.dataRoutes, context),
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const markup = await new Promise<string>((resolve, reject) => {
    const destination = new PassThrough(),
      chunks: Buffer[] = [];
    destination.on('data', (chunk: Buffer) => chunks.push(chunk));
    destination.on('end', () =>
      resolve(Buffer.concat(chunks).toString('utf8')),
    );
    destination.on('error', reject);
    const { pipe } = renderToPipeableStream(
      <StrictMode>
        <ErrorBoundary>
          <QueryClientProvider client={client}>
            <StaticRouterProvider
              router={router}
              context={context}
              hydrate={false}
            />
          </QueryClientProvider>
        </ErrorBoundary>
      </StrictMode>,
      {
        onAllReady() {
          pipe(destination);
        },
        onError: reject,
      },
    );
  });
  if (/<script[\s>]/.test(markup)) {
    throw new Error(
      'Prerender generated an inline script that would violate CSP.',
    );
  }
  await writeFile(
    `dist/client/${file}`,
    template.replace(
      '<div id="root"></div>',
      `<div id="root" data-prerendered-route="${path}">${markup}</div>`,
    ),
  );
  client.clear();
  process.stdout.write(`Prerendered ${path} from the real React route\n`);
}
