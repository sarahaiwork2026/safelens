import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { createApplicationRouter } from './router';
import { queryClient } from './lib/query';
import { ErrorBoundary } from './app/ErrorBoundary';
import { copy } from './copy';
import './styles/base.css';
const root = document.getElementById('root');
async function start() {
  if (!root) return;
  const router = await createApplicationRouter();
  const application = (
    <StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>
  );
  const path = location.pathname.replace(/\/$/, '') || '/';
  if (root.dataset.prerenderedRoute === path && !location.search)
    hydrateRoot(root, application);
  else createRoot(root).render(application);
}
void start().catch(() => {
  if (root)
    createRoot(root).render(
      <main className="container page empty-state">
        <h1>{copy.errors.generic}</h1>
        <button
          className="button button-primary"
          onClick={() => window.location.reload()}
        >
          {copy.actions.retry}
        </button>
        <p>{copy.disclaimer}</p>
      </main>,
    );
});
