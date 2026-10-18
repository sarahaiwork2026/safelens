import { Component } from 'react';
import type { ReactNode } from 'react';
import { copy } from '../copy';
import { Button } from '../components/ui';
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    if (this.state.failed)
      return (
        <main className="container page empty-state">
          <h1>{copy.errors.generic}</h1>
          <Button onClick={() => window.location.reload()}>
            {copy.actions.retry}
          </Button>
        </main>
      );
    return this.props.children;
  }
}
