'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useApi } from '@/lib/use-api';
import { useAllMatches } from '@/lib/use-all-matches';
import type { ApiCollection, ApiResource, League, Match, Season } from '@/lib/types';
import { nflTabPath } from '@/lib/nfl-paths';
import { pickDefaultSeason } from '@/lib/seasons';
import { sortMatchesByDateAsc } from '@/lib/match-sort';
import { formatDateTimeShort } from '@/lib/format';
import { DataTable, SectionTitle, type Column } from '@/components/ui/Ui';
import { DataSection, EmptyState, ErrorState, LoadingState } from '@/components/states/States';
import { LeagueSeasonSidebar } from '@/components/layout/LeagueSeasonSidebar';
import { NflLoaderLink } from './NflLoaderLink';

const matchColumns: Column<Match>[] = [
  {
    key: 'date',
    header: 'Fecha',
    render: (row) => formatDateTimeShort(row.date),
  },
  {
    key: 'round',
    header: 'Semana',
    render: (row) => row.round ?? '—',
  },
  {
    key: 'home',
    header: 'Local',
    render: (row) => row.home.name ?? '—',
  },
  {
    key: 'score',
    header: 'Marcador',
    render: (row) => {
      const home = row.home.score;
      const away = row.away.score;
      if (home == null && away == null) return '—';
      return `${home ?? '—'} – ${away ?? '—'}`;
    },
    className: 'text-center tabular-nums',
  },
  {
    key: 'away',
    header: 'Visitante',
    render: (row) => row.away.name ?? '—',
  },
  {
    key: 'status',
    header: 'Estado',
    render: (row) => row.status ?? '—',
  },
];

export function NflLeagueBrowse({ leagueId }: { leagueId: string }) {
  const id = encodeURIComponent(leagueId);
  const leagueRes = useApi<ApiResource<League>>(`/v1/leagues/${id}`);
  const seasonsRes = useApi<ApiCollection<Season>>(`/v1/leagues/${id}/seasons`);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);

  const seasons = seasonsRes.data?.data ?? [];
  const effectiveSelectedSeasonId = useMemo(() => {
    if (selectedSeasonId && seasons.some((season) => season.id === selectedSeasonId)) {
      return selectedSeasonId;
    }
    return pickDefaultSeason(seasons)?.id ?? null;
  }, [seasons, selectedSeasonId]);

  const selectedSeason = useMemo(
    () => seasons.find((season) => season.id === effectiveSelectedSeasonId) ?? null,
    [seasons, effectiveSelectedSeasonId],
  );
  const selectedYear = selectedSeason?.year ?? null;
  const matchesRes = useAllMatches(leagueId, selectedYear);
  const sortedMatches = useMemo(() => sortMatchesByDateAsc(matchesRes.data), [matchesRes.data]);

  const league = leagueRes.data?.data;
  const loaderAction = <NflLoaderLink>Cargar información</NflLoaderLink>;

  if (leagueRes.loading) return <LoadingState label="Cargando liga…" />;
  if (leagueRes.error) return <ErrorState message={leagueRes.error} onRetry={leagueRes.reload} />;

  return (
    <div className="space-y-8">
      <nav className="text-sm">
        <Link href={nflTabPath('browse')} className="text-blue-400 hover:text-blue-300">
          ← Ligas NFL
        </Link>
      </nav>

      <section className="flex flex-wrap items-center gap-4">
        {(league?.altLogo ?? league?.logo) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={league.altLogo ?? league.logo ?? ''}
            alt=""
            className="h-14 w-14 rounded bg-white/5 object-contain p-1"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-50">{league?.name ?? leagueId}</h1>
          <p className="text-sm text-slate-400">
            {[league?.sport, league?.country, league?.type].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
      </section>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="w-full shrink-0 lg:w-52">
          <LeagueSeasonSidebar
            seasons={seasons}
            loading={seasonsRes.loading}
            error={seasonsRes.error}
            selectedSeasonId={effectiveSelectedSeasonId}
            onSelect={setSelectedSeasonId}
            onRetry={seasonsRes.reload}
            emptyTitle="Sin temporadas cargadas"
            emptyHint="Registra temporadas para esta liga en la carga de datos."
            emptyAction={loaderAction}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          {selectedYear === null && seasons.length > 0 ? (
            <EmptyState
              title="Selecciona una temporada"
              hint="Elige un año en la barra lateral para ver los partidos."
            />
          ) : selectedYear !== null ? (
            <section>
              <SectionTitle>Partidos · {selectedYear}</SectionTitle>
              <DataSection
                loading={matchesRes.loading}
                error={matchesRes.error}
                isEmpty={sortedMatches.length === 0}
                onRetry={matchesRes.reload}
                emptyTitle="Aún no hay partidos cargados"
                emptyHint={`No hay partidos para la temporada ${selectedYear}. Puedes registrarlos en la carga de datos.`}
                emptyAction={loaderAction}
              >
                <DataTable
                  columns={matchColumns}
                  rows={sortedMatches}
                  rowKey={(row) => row.id}
                  caption={`Partidos NFL ${selectedYear}`}
                />
              </DataSection>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
