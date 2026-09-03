'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Ui';
import { DataSection } from '@/components/states/States';
import { AmericanFootballAccordion } from '@/components/views/american-football/AmericanFootballAccordion';
import { formatTennisTournamentLabel } from '@/lib/tennis-display';
import { formatTennisMatchLabel } from '@/lib/tennis-forms/match-form';
import { truncateCanonicalId } from '@/lib/tennis-forms/shared';
import { tennisMatchDetailPath, tennisTabPath, tennisTournamentDetailPath } from '@/lib/tennis-paths';
import {
  useTennisMatchesQuery,
  useTennisRoundQuery,
  useTennisTournamentQuery,
} from '@/lib/query/tennis/hooks';
import { TennisLoaderLink } from './TennisLoaderLink';

const STATUS_LABELS: Record<string, string> = {
  upcoming: 'Próximo',
  active: 'En curso',
  finished: 'Finalizado',
  cancelled: 'Cancelado',
  pending: 'Pendiente',
};

export function TennisRoundDetail({ roundId }: { roundId: string }) {
  const roundQuery = useTennisRoundQuery(roundId);
  const round = roundQuery.data;
  const tournamentQuery = useTennisTournamentQuery(round?.tournamentId ?? null);
  const matchesQuery = useTennisMatchesQuery(
    { tournament: round?.tournamentId, round: roundId },
    Boolean(round?.tournamentId),
  );

  const loading = roundQuery.loading || (round ? tournamentQuery.loading || matchesQuery.loading : false);
  const error = roundQuery.error ?? tournamentQuery.error ?? matchesQuery.error;
  const tournament = tournamentQuery.data;

  const matches = [...matchesQuery.data].sort((a, b) => a.bracketPosition - b.bracketPosition);

  function reloadAll() {
    roundQuery.reload();
    tournamentQuery.reload();
    matchesQuery.reload();
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href={tennisTabPath('contenido')} className="text-blue-400 hover:underline">
            ← Tenis
          </Link>
          {round?.tournamentId && (
            <Link
              href={tennisTournamentDetailPath(round.tournamentId)}
              className="text-blue-400 hover:underline"
            >
              ← Torneo
            </Link>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-bold text-slate-50">
          {round ? `#${round.roundNumber} ${round.name}` : 'Detalle de la ronda'}
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
        isEmpty={!loading && !error && !round}
        onRetry={reloadAll}
        emptyTitle="Ronda no encontrada"
        emptyHint="El ID no coincide con una ronda cargada en el BFF."
        emptyAction={<TennisLoaderLink />}
      >
        {round && (
          <div className="space-y-4">
            <Card>
              <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Número</dt>
                  <dd className="mt-1 text-sm text-slate-100">{round.roundNumber}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Nombre</dt>
                  <dd className="mt-1 text-sm text-slate-100">{round.name}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Estado</dt>
                  <dd className="mt-1 text-sm text-slate-100">
                    {STATUS_LABELS[round.status] ?? round.status}
                    {round.published ? ' · publicado' : ' · borrador'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Fechas</dt>
                  <dd className="mt-1 text-sm text-slate-100">
                    {round.startDate || round.endDate
                      ? `${round.startDate ?? '—'} — ${round.endDate ?? '—'}`
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Torneo</dt>
                  <dd className="mt-1 text-sm text-slate-100">
                    {tournament ? (
                      <Link
                        href={tennisTournamentDetailPath(round.tournamentId)}
                        className="text-blue-400 hover:underline"
                      >
                        {tournament.name} {tournament.year}
                      </Link>
                    ) : (
                      truncateCanonicalId(round.tournamentId)
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">ID</dt>
                  <dd className="mt-1 break-all font-mono text-xs text-slate-400" title={round.id}>
                    {round.id}
                  </dd>
                </div>
              </dl>
            </Card>

            <AmericanFootballAccordion title="Partidos de la ronda" count={matches.length} defaultOpen>
              {matches.length === 0 ? (
                <p className="text-sm text-slate-500">Sin partidos en esta ronda.</p>
              ) : (
                <ul className="space-y-2">
                  {matches.map((match) => (
                    <li key={match.id}>
                      <Link
                        href={tennisMatchDetailPath(match.id)}
                        className="block rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-200 transition hover:border-blue-500/40"
                      >
                        <p className="font-medium">{formatTennisMatchLabel(match)}</p>
                        <p className="text-xs text-slate-500">
                          {match.status}
                          {match.published ? '' : ' · borrador'}
                          {match.result?.finalScoreDisplay
                            ? ` · ${match.result.finalScoreDisplay}`
                            : ''}
                          {match.court ? ` · cancha ${match.court}` : ''}
                        </p>
                      </Link>
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
