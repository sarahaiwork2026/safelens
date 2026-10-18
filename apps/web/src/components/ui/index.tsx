import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router';
import { LoaderCircle, AlertCircle } from 'lucide-react';
import { copy } from '../../copy';
export const buttonClass = cva('button', {
  variants: {
    variant: {
      primary: 'button-primary',
      secondary: 'button-secondary',
      ghost: 'button-ghost',
      icon: 'button-icon',
    },
  },
  defaultVariants: { variant: 'primary' },
});
type Variant = 'primary' | 'secondary' | 'ghost' | 'icon';
export function Button({
  variant = 'primary',
  busy = false,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  busy?: boolean;
}) {
  return (
    <button
      {...props}
      className={clsx(buttonClass({ variant }), className)}
      disabled={props.disabled || busy}
      aria-busy={busy}
    >
      {busy && <LoaderCircle className="spinner" size={16} />} {children}
    </button>
  );
}
export function ActionLink({
  to,
  children,
  variant = 'primary',
  className,
}: {
  to: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <Link
      to={to}
      viewTransition
      className={clsx(buttonClass({ variant }), className)}
    >
      {children}
    </Link>
  );
}
export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={clsx('card', className)}>{children}</section>;
}
export function CreamPanel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={clsx('cream-panel', className)}>{children}</div>;
}
export function Frame({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="frame">
      <div className="frame-bar">
        <div className="frame-dots">
          <i />
          <i />
          <i />
        </div>
        <span>{title}</span>
      </div>
      <div className="frame-body">{children}</div>
    </div>
  );
}
export function Pill({
  children,
  className = '',
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string | undefined;
}) {
  return (
    <span className={clsx('pill', className)} title={title}>
      {children}
    </span>
  );
}
export function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <p className="field-error" id={`${id}-error`} role="status">
          <AlertCircle size={16} />
          {error}
        </p>
      )}
    </div>
  );
}
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <div className="actions">{children}</div>
    </div>
  );
}
export function ErrorState({
  title,
  retry,
}: {
  title: string;
  retry: () => void;
}) {
  return (
    <EmptyState title={title}>
      <Button onClick={retry}>{copy.actions.retry}</Button>
    </EmptyState>
  );
}
export function Skeleton() {
  return (
    <div className="skeleton" aria-busy="true">
      <div />
      <div />
      <div />
    </div>
  );
}
