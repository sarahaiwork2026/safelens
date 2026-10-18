import { Link } from 'react-router';
import { copy } from '../copy';
import { Button, buttonClass } from '../components/ui';
export function RouteError() {
  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <a className="logo" href="/">
            {copy.brand}
          </a>
        </div>
      </header>
      <main className="container page empty-state">
        <h1>{copy.errors.generic}</h1>
        <div className="actions">
          <Button onClick={() => window.location.reload()}>
            {copy.actions.retry}
          </Button>
          <Link
            className={buttonClass({ variant: 'secondary' })}
            to="/incidents"
          >
            {copy.actions.back}
          </Link>
        </div>
      </main>
      <footer className="container">
        <p className="meta">{copy.disclaimer}</p>
      </footer>
    </>
  );
}
