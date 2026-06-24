import type { ReactNode } from 'react';

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-pulse rounded-lg border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-400"
    >
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-900/60 bg-red-950/30 p-6 text-sm text-red-200"
    >
      <p className="font-medium">Algo salió mal</p>
      <p className="mt-1 text-red-300/80">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-md border border-red-800 px-3 py-1.5 text-red-100 hover:bg-red-900/40"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/30 p-6 text-sm">
      <p className="font-medium text-slate-200">{title}</p>
      {hint && <p className="mt-1 text-slate-400">{hint}</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

/**
 * Wraps an async data section and renders the four canonical states:
 * loading, error (with retry), empty, or its children (populated).
 */
export function DataSection({
  loading,
  error,
  isEmpty,
  onRetry,
  loadingLabel,
  emptyTitle,
  emptyHint,
  children,
}: {
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  onRetry?: () => void;
  loadingLabel?: string;
  emptyTitle: string;
  emptyHint?: string;
  children: ReactNode;
}) {
  if (loading) return <LoadingState label={loadingLabel} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (isEmpty) return <EmptyState title={emptyTitle} hint={emptyHint} />;
  return <>{children}</>;
}
