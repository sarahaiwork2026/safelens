import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { LockKeyhole } from 'lucide-react';
import { api } from '../../lib/api';
import { useAdmin, adminDestination } from '../../lib/auth';
import { queryClient } from '../../lib/query';
import { Button, Card, Field, ActionLink } from '../../components/ui';
import { copy } from '../../copy';
import { useHydrated } from '../../lib/useHydrated';
export default function LoginPage() {
  const hydrated = useHydrated();
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState('');
  const [params] = useSearchParams(),
    navigate = useNavigate(),
    session = useAdmin();
  const next = adminDestination(params.get('next'));
  const mutation = useMutation({
    mutationFn: () => api.login(email, password),
    onSuccess: (data) => {
      setPassword('');
      queryClient.setQueryData(['admin-session'], data);
      void navigate(next, { replace: true });
    },
  });
  if (session.data?.authenticated) return <Navigate to={next} replace />;
  return (
    <div className="container page auth-page">
      <Card>
        <LockKeyhole size={28} aria-hidden="true" />
        <h1 id="login-title">{copy.auth.title}</h1>
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <fieldset
            className="stack report-fields"
            disabled={!hydrated}
            aria-busy={!hydrated}
            aria-labelledby="login-title"
          >
            <Field id="admin-email" label={copy.auth.email}>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field id="admin-password" label={copy.auth.password}>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={256}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            {mutation.isError && (
              <p className="field-error" role="alert">
                {mutation.error.message}
              </p>
            )}
            <Button busy={mutation.isPending} type="submit">
              {copy.auth.signIn}
            </Button>
          </fieldset>
        </form>
        <p className="meta auth-note">{copy.auth.onlyAdmin}</p>
        <ActionLink to="/chat" variant="secondary">
          {copy.chat.title}
        </ActionLink>
      </Card>
    </div>
  );
}
