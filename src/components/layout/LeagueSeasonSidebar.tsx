'use client';

import type { ReactNode } from 'react';
import type { Season } from '@/lib/types';
import { seasonLabel } from '@/lib/seasons';
import { EmptyState, ErrorState, LoadingState } from '@/components/states/States';

export function LeagueSeasonSidebar({
  seasons,
  loading,
  error,
  selectedSeasonId,
  onSelect,
  onRetry,
  emptyTitle = 'No hay temporadas registradas.',
  emptyHint,
  emptyAction,
}: {
  seasons: Season[];
  loading: boolean;
  error: string | null;
  selectedSeasonId: string | null;
  onSelect: (seasonId: string) => void;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyHint?: string;
  emptyAction?: ReactNode;
}) {
  return (
    <aside className="w-full shrink-0 lg:w-52">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Temporadas
      </h2>

      {loading && <LoadingState label="Cargando temporadas…" />}

      {!loading && error && <ErrorState message={error} onRetry={onRetry} />}

      {!loading && !error && seasons.length === 0 && (
        <EmptyState title={emptyTitle} hint={emptyHint} action={emptyAction} />
      )}

      {!loading && !error && seasons.length > 0 && (
        <nav aria-label="Temporadas">
          <ul className="space-y-1">
            {seasons.map((season) => {
              const active = season.id === selectedSeasonId;
              return (
                <li key={season.id}>
                  <button
                    type="button"
                    aria-current={active ? 'true' : undefined}
                    onClick={() => onSelect(season.id)}
                    className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                      active
                        ? 'border-blue-500/40 bg-blue-500/15 text-blue-100'
                        : 'border-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <span className="font-medium">{seasonLabel(season)}</span>
                    {season.current && (
                      <span className="mt-0.5 block text-xs text-emerald-300">Actual</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </aside>
  );
}
