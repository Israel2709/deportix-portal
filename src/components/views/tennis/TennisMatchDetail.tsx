'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Ui';
import { DataSection } from '@/components/states/States';
import { formatTennisTournamentLabel } from '@/lib/tennis-display';
import { tennisCompetitorLabel, tennisMatchWinner } from '@/lib/tennis-bracket';
import { truncateCanonicalId } from '@/lib/tennis-forms/shared';
import {
  tennisRoundDetailPath,
  tennisTabPath,
  tennisTournamentDetailPath,
} from '@/lib/tennis-paths';
import {
  useTennisMatchQuery,
  useTennisRoundQuery,
  useTennisTournamentQuery,
} from '@/lib/query/tennis/hooks';
import { TennisLoaderLink } from './TennisLoaderLink';

const STATUS_LABELS: Record<string, string> = {
  pending_competitors: 'Pendiente de competidores',
  scheduled: 'Programado',
  live: 'En vivo',
  suspended: 'Suspendido',
  postponed: 'Aplazado',
  finished: 'Finalizado',
  retirement: 'Retiro',
  walkover: 'Walkover',
  disqualification: 'Descalificación',
  cancelled: 'Cancelado',
};

export function TennisMatchDetail({ matchId }: { matchId: string }) {
  const matchQuery = useTennisMatchQuery(matchId);
  const match = matchQuery.data;
  const tournamentQuery = useTennisTournamentQuery(match?.tournamentId ?? null);
  const roundQuery = useTennisRoundQuery(match?.roundId ?? null);

  const loading =
    matchQuery.loading || (match ? tournamentQuery.loading || roundQuery.loading : false);
  const error = matchQuery.error ?? tournamentQuery.error ?? roundQuery.error;
  const tournament = tournamentQuery.data;
  const round = roundQuery.data;
  const winner = match ? tennisMatchWinner(match) : null;

  function reloadAll() {
    matchQuery.reload();
    tournamentQuery.reload();
    roundQuery.reload();
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href={tennisTabPath('contenido')} className="text-blue-400 hover:underline">
            ← Tenis
          </Link>
          {match?.tournamentId && (
            <Link
              href={tennisTournamentDetailPath(match.tournamentId)}
              className="text-blue-400 hover:underline"
            >
              ← Torneo
            </Link>
          )}
          {match?.roundId && (
            <Link href={tennisRoundDetailPath(match.roundId)} className="text-blue-400 hover:underline">
              ← Ronda
            </Link>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-bold text-slate-50">
          {match
            ? `${tennisCompetitorLabel(match.competitor1, match.bracket.competitor1EntryType)} vs ${tennisCompetitorLabel(match.competitor2, match.bracket.competitor2EntryType)}`
            : 'Detalle del partido'}
        </h1>
        {tournament && (
          <p className="mt-1 text-sm text-slate-400">
            {formatTennisTournamentLabel(tournament, { publishedStyle: 'dot' })}
            {round ? ` · #${round.roundNumber} ${round.name}` : ''}
          </p>
        )}
      </div>

      <DataSection
        loading={loading}
        error={error}
        isEmpty={!loading && !error && !match}
        onRetry={reloadAll}
        emptyTitle="Partido no encontrado"
        emptyHint="El ID no coincide con un partido cargado en el BFF."
        emptyAction={<TennisLoaderLink />}
      >
        {match && (
          <Card>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Competidor 1</dt>
                <dd className="mt-1 text-sm text-slate-100">
                  {tennisCompetitorLabel(match.competitor1, match.bracket.competitor1EntryType)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Competidor 2</dt>
                <dd className="mt-1 text-sm text-slate-100">
                  {tennisCompetitorLabel(match.competitor2, match.bracket.competitor2EntryType)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Estado</dt>
                <dd className="mt-1 text-sm text-slate-100">
                  {STATUS_LABELS[match.status] ?? match.status}
                  {match.published ? ' · publicado' : ' · borrador'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Posición bracket</dt>
                <dd className="mt-1 text-sm text-slate-100">{match.bracketPosition}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Ronda</dt>
                <dd className="mt-1 text-sm text-slate-100">
                  {round ? (
                    <Link
                      href={tennisRoundDetailPath(match.roundId)}
                      className="text-blue-400 hover:underline"
                    >
                      #{round.roundNumber} {round.name}
                    </Link>
                  ) : (
                    match.roundName ?? `R${match.roundNumber}`
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Torneo</dt>
                <dd className="mt-1 text-sm text-slate-100">
                  {tournament ? (
                    <Link
                      href={tennisTournamentDetailPath(match.tournamentId)}
                      className="text-blue-400 hover:underline"
                    >
                      {tournament.name} {tournament.year}
                    </Link>
                  ) : (
                    truncateCanonicalId(match.tournamentId)
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Programación</dt>
                <dd className="mt-1 text-sm text-slate-100">
                  {match.scheduledAt ?? '—'}
                  {match.timezone ? ` · ${match.timezone}` : ''}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Cancha</dt>
                <dd className="mt-1 text-sm text-slate-100">{match.court ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Resultado</dt>
                <dd className="mt-1 text-sm text-slate-100">
                  {match.result?.finalScoreDisplay ?? '—'}
                  {winner ? ` · ganador ${winner.displayName}` : ''}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">ID</dt>
                <dd className="mt-1 break-all font-mono text-xs text-slate-400" title={match.id}>
                  {match.id}
                </dd>
              </div>
            </dl>
          </Card>
        )}
      </DataSection>
    </div>
  );
}
