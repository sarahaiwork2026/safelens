import { Suspense, lazy, useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import {
  FilePlus2,
  List,
  Map,
  FlaskConical,
  MessageCircle,
  LockKeyhole,
  LogOut,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { CONTACTS } from 'core';
import { copy } from '../copy';
import { ActionLink, Button } from '../components/ui';
import { useAdmin } from '../lib/auth';
import { api } from '../lib/api';
import { queryClient } from '../lib/query';
import { ThemeToggle } from '../components/ui/ThemeToggle';
const AlertHost = lazy(() => import('../components/alerts/AlertHost'));
let ReadyAlertHost: ComponentType | undefined;
export async function prepareShell() {
  ReadyAlertHost = (await import('../components/alerts/AlertHost')).default;
}

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label={copy.brand}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="10" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
        <circle cx="15" cy="6" r="3" fill="currentColor" />
      </svg>
      {copy.brand}
    </Link>
  );
}
export function AppShell() {
  const location = useLocation(),
    [offline, setOffline] = useState(
      typeof window !== 'undefined' && !navigator.onLine,
    );
  const session = useAdmin(location.pathname !== '/'),
    admin = Boolean(session.data?.authenticated);
  const logout = useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      queryClient.clear();
      window.location.assign('/login');
    },
  });
  useEffect(() => {
    const on = () => setOffline(!navigator.onLine);
    window.addEventListener('online', on);
    window.addEventListener('offline', on);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', on);
    };
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <a className="skip-link" href="#main-content">
        {copy.skip}
      </a>
      <header className="topbar">
        <div className="container topbar-inner">
          <Logo />
          <nav className="desktop-nav" aria-label={copy.brand}>
            {[
              ['/chat', copy.chat.title],
              ['/incidents', copy.nav.incidents],
              ...(admin
                ? [
                    ['/map', copy.nav.map],
                    ['/test-lab', copy.nav.lab],
                  ]
                : []),
              ['/about', copy.nav.about],
            ].map(([path, label]) => (
              <NavLink key={path} to={path ?? '/'} viewTransition>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <ThemeToggle />
            {admin &&
              location.pathname !== '/' &&
              (ReadyAlertHost ? (
                <ReadyAlertHost />
              ) : (
                <Suspense>
                  <AlertHost />
                </Suspense>
              ))}
            {admin ? (
              <Button
                variant="icon"
                aria-label={copy.auth.signOut}
                title={copy.auth.signOut}
                busy={logout.isPending}
                onClick={() => logout.mutate()}
              >
                <LogOut size={18} />
              </Button>
            ) : (
              <ActionLink to="/login" variant="secondary">
                {copy.auth.admin}
              </ActionLink>
            )}
            <ActionLink to="/report">{copy.nav.report}</ActionLink>
          </div>
        </div>
      </header>
      {logout.isError && (
        <p className="container field-error" role="alert">
          {logout.error.message}
        </p>
      )}
      {offline && (
        <div className="offline-banner" role="status">
          {copy.errors.offline}
        </div>
      )}
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer>
        <div className="container">
          <div className="footer-top">
            <Logo />
            <div className="footer-nav">
              <Link to="/about">{copy.nav.about}</Link>
              <Link to="/test-lab">{copy.nav.lab}</Link>
              <Link to="/chat">{copy.chat.title}</Link>
              <Link to="/login">{copy.auth.admin}</Link>
            </div>
            <div className="footer-contacts">
              {(['police', 'rescue', 'edhi', 'fire'] as const).map((id) => {
                const contact = CONTACTS.find((c) => c.id === id);
                return (
                  contact && (
                    <a key={id} href={`tel:${contact.number}`}>
                      {copy.contacts[id]} {contact.number}
                    </a>
                  )
                );
              })}
            </div>
          </div>
          <div className="footer-bottom">
            <p>{copy.disclaimer}</p>
            <p>
              {copy.unverified} {copy.academic}
            </p>
          </div>
        </div>
      </footer>
      <nav className="mobile-tabs" aria-label={copy.nav.incidents}>
        {[
          { to: '/report', text: copy.nav.report, Icon: FilePlus2 },
          { to: '/chat', text: copy.chat.title, Icon: MessageCircle },
          ...(admin
            ? [
                { to: '/incidents', text: copy.nav.incidents, Icon: List },
                { to: '/map', text: copy.nav.map, Icon: Map },
                { to: '/test-lab', text: copy.nav.lab, Icon: FlaskConical },
              ]
            : [{ to: '/login', text: copy.auth.admin, Icon: LockKeyhole }]),
        ].map(({ to, text, Icon }) => (
          <NavLink key={to} to={to}>
            <Icon size={20} />
            {text}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
