import { createBrowserRouter, matchRoutes } from 'react-router';
import type { RouteObject } from 'react-router';
import { RouteError } from './app/RouteError';
import { AppShell, prepareShell } from './app/AppShell';
import { ActionLink, Skeleton } from './components/ui';
import { copy } from './copy';
import AdminGate from './app/AdminGate';
export const routes: RouteObject[] = [
  {
    Component: AppShell,
    HydrateFallback: () => (
      <main className="container page">
        <Skeleton />
      </main>
    ),
    errorElement: <RouteError />,
    children: [
      {
        path: '/',
        lazy: async () => ({
          Component: (await import('./features/landing/LandingPage')).default,
        }),
      },
      {
        path: '/report',
        lazy: async () => ({
          Component: (await import('./features/report/ReportPage')).default,
        }),
      },
      {
        Component: AdminGate,
        children: [
          {
            path: '/incidents',
            lazy: async () => ({
              Component: (await import('./features/incidents/IncidentsPage'))
                .default,
            }),
          },
          {
            path: '/incidents/:ref',
            lazy: async () => ({
              Component: (await import('./features/incident/IncidentPage'))
                .default,
            }),
          },
          {
            path: '/map',
            lazy: async () => ({
              Component: (await import('./features/map/MapPage')).default,
            }),
          },
          {
            path: '/test-lab',
            lazy: async () => ({
              Component: (await import('./features/test-lab/TestLabPage'))
                .default,
            }),
          },
        ],
      },
      {
        path: '/login',
        lazy: async () => ({
          Component: (await import('./features/auth/LoginPage')).default,
        }),
      },
      {
        path: '/chat',
        lazy: async () => ({
          Component: (await import('./features/chat/ChatPage')).default,
        }),
      },
      {
        path: '/about',
        lazy: async () => ({
          Component: (await import('./features/about/AboutPage')).default,
        }),
      },
      {
        path: '*',
        element: (
          <div className="container page empty-state">
            <h1>{copy.headings.notFound}</h1>
            <ActionLink to="/incidents">{copy.actions.go}</ActionLink>
          </div>
        ),
      },
    ],
  },
];

export async function resolveRoutes(pathname: string) {
  function clone(route: RouteObject): RouteObject {
    if (route.index) return { ...route };
    return {
      ...route,
      ...(route.children ? { children: route.children.map(clone) } : {}),
    };
  }
  const definitions = routes.map(clone);
  const matches = matchRoutes(definitions, pathname);
  await Promise.all(
    (matches ?? []).map(async (match) => {
      const route = match.route;
      if (typeof route.lazy === 'function') {
        Object.assign(route, await route.lazy());
        delete route.lazy;
      }
    }),
  );
  return definitions;
}

export async function createApplicationRouter() {
  const [definitions] = await Promise.all([
    resolveRoutes(window.location.pathname),
    /^\/(incidents|map|test-lab)/.test(window.location.pathname)
      ? prepareShell()
      : Promise.resolve(),
  ]);
  return createBrowserRouter(definitions, {
    hydrationData: { loaderData: {}, actionData: null, errors: null },
  });
}
