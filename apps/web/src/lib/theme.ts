import { useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';
let theme: Theme = 'light';
const listeners = new Set<() => void>();

function applyTheme(value: Theme) {
  theme = value;
  document.documentElement.dataset.theme = value;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', value === 'dark' ? '#0e0e10' : '#ffffff');
  for (const listener of listeners) listener();
}

export function initializeTheme() {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem('safelens-theme');
  } catch {
    // Light remains available when browser storage is restricted.
  }
  applyTheme(saved === 'dark' ? 'dark' : 'light');
  window.addEventListener('storage', (event) => {
    if (event.key === 'safelens-theme' || event.key === null)
      applyTheme(event.newValue === 'dark' ? 'dark' : 'light');
  });
}

export function toggleTheme() {
  applyTheme(theme === 'light' ? 'dark' : 'light');
  try {
    localStorage.setItem('safelens-theme', theme);
  } catch {
    // The selected theme still works for this visit without browser storage.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useTheme() {
  return useSyncExternalStore(
    subscribe,
    () => theme,
    () => 'light' as Theme,
  );
}
