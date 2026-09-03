'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Ui';
import { DataSection } from '@/components/states/States';
import { AmericanFootballAccordion } from '@/components/views/american-football/AmericanFootballAccordion';
import {
  formatTennisTournamentLabel,
  TENNIS_TOURNAMENT_CATEGORY_LABELS,
  tennisTournamentCircuitLabel,
} from '@/lib/tennis-display';
import { TENNIS_ENTRY_TYPE_OPTIONS } from '@/lib/tennis-forms/entry-form';
import { truncateCanonicalId } from '@/lib/tennis-forms/shared';
import { tennisTabPath } from '@/lib/tennis-paths';
import {
  useTennisEntriesQuery,
  useTennisMatchesQuery,
  useTennisRoundsQuery,
  useTennisTournamentQuery,
} from '@/lib/query/tennis/hooks';
import { TennisBracket } from './TennisBracket';
import { TennisLoaderLink } from './TennisLoaderLink';

const STATUS_LABELS: Record<string, string> = {
  upcoming: 'Próximo',
  active: 'En curso',
  finished: 'Finalizado',
  cancelled: 'Cancelado',
  pending: 'Pendiente',
};

function entryTypeLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return TENNIS_ENTRY_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function TennisTournamentDetail({ tournamentId }: { tournamentId: string }) {
  const tournamentQuery = useTennisTournamentQuery(tournamentId);
  const roundsQuery = useTennisRoundsQuery({ tournament: tournamentId });
  const entriesQuery = useTennisEntriesQuery({ tournament: tournamentId });
  const matchesQuery = useTennisMatchesQuery({ tournament: tournamentId });

  const tournament = tournamentQuery.data;
  const loading =
    tournamentQuery.loading ||
    roundsQuery.loading ||
    entriesQuery.loading ||
    matchesQuery.loading;
  const error =
    tournamentQuery.error ?? roundsQuery.error ?? entriesQuery.error ?? matchesQuery.error;

  function reloadAll() {
    tournamentQuery.reload();
    roundsQuery.reload();
    entriesQuery.reload();
    matchesQuery.reload();
  }

  const rounds = [...roundsQuery.data].sort((a, b) => a.roundNumber - b.roundNumber);
  const entries = [...entriesQuery.data].sort((a, b) => {
    const seedA = a.seed ?? Number.POSITIVE_INFINITY;
    const seedB = b.seed ?? Number.POSITIVE_INFINITY;
    if (seedA !== seedB) return seedA - seedB;
    return a.player.displayName.localeCompare(b.player.displayName, 'es');
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href={tennisTabPath('contenido')} className="text-sm text-blue-400 hover:underline">
          ← Volver a Tenis
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-50">
          {tournament?.name ?? 'Detalle del torneo'}
        </h1>
        {tournament && (
          <p className="mt-1 text-sm text-slate-400">
            {formatTennisTournamentLabel(tournament, { publishedStyle: 'dot' })}
          </p>
        )}
      </div>

      <DataSection
        loading={loading}
        error={error}
        isEmpty={!loading && !error && !tournament}
        onRetry={reloadAll}
        emptyTitle="Torneo no encontrado"
        emptyHint="El ID no coincide con un torneo cargado en el BFF."
        emptyAction={<TennisLoaderLink />}
      >
        {tournament && (
          <div className="space-y-4">
            <Card className="space-y-4">
              <div className="flex flex-wrap items-start gap-4">
                {tournament.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tournament.imageUrl}
                    alt=""
                    className="h-20 w-20 rounded-md border border-slate-800 object-contain bg-slate-950"
                  />
                ) : null}
                <dl className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Circuito</dt>
                    <dd className="mt-1 text-sm text-slate-100">
                      {tennisTournamentCircuitLabel(tournament.gender)} ·{' '}
                      {TENNIS_TOURNAMENT_CATEGORY_LABELS[tournament.category] ?? tournament.category}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Sede</dt>
                    <dd className="mt-1 text-sm text-slate-100">
                      {[tournament.city, tournament.country.name ?? tournament.country.code]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Fechas</dt>
                    <dd className="mt-1 text-sm text-slate-100">
                      {tournament.startDate} — {tournament.endDate}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Año</dt>
                    <dd className="mt-1 text-sm text-slate-100">{tournament.year}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">Estado</dt>
                    <dd className="mt-1 text-sm text-slate-100">
                      {STATUS_LABELS[tournament.status] ?? tournament.status}
                      {tournament.published ? ' · publicado' : ' · borrador'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">ID</dt>
                    <dd className="mt-1 break-all font-mono text-xs text-slate-400" title={tournament.id}>
                      {tournament.id}
                    </dd>
                  </div>
                </dl>
              </div>
            </Card>

            <TennisBracket rounds={rounds} matches={matchesQuery.data} />

            <AmericanFootballAccordion title="Entradas / jugadores" count={entries.length} defaultOpen>
              {entries.length === 0 ? (
                <p className="text-sm text-slate-500">Sin entradas en el Main Draw.</p>
              ) : (
                <ul className="space-y-2">
                  {entries.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-200"
                    >
                      <div>
                        <p className="font-medium">
                          {entry.seed != null ? `#${entry.seed} ` : ''}
                          {entry.player.displayName}
                          <span className="font-normal text-slate-400">
                            {' '}
                            ({entry.player.fullName})
                          </span>
                        </p>
                        <p className="text-xs text-slate-500">
                          {entry.player.country.code}
                          {entry.ranking != null ? ` · ranking ${entry.ranking}` : ''}
                          {' · '}
                          {entryTypeLabel(entry.entryType)}
                          {entry.published ? '' : ' · borrador'}
                        </p>
                      </div>
                      <span className="font-mono text-[11px] text-slate-600" title={entry.id}>
                        {truncateCanonicalId(entry.id)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </AmericanFootballAccordion>
          </div>
        )}
      </DataSection>
    </div>
  );
}
