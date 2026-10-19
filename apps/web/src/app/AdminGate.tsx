import { Navigate, Outlet, useLocation } from 'react-router';
import { useAdmin } from '../lib/auth';
import { ErrorState, Skeleton } from '../components/ui';
import { copy } from '../copy';
export default function AdminGate() {
  const session = useAdmin(),
    location = useLocation();
  if (session.isPending)
    return (
      <div className="container page">
        <Skeleton />
      </div>
    );
  if (session.isError)
    return (
      <div className="container page">
        <ErrorState
          title={copy.errors.network}
          retry={() => void session.refetch()}
        />
      </div>
    );
  if (!session.data.authenticated)
    return (
      <Navigate
        replace
        to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
      />
    );
  return <Outlet />;
}
