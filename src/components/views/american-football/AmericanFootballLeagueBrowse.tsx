'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { americanFootballTabPath } from '@/lib/american-football-paths';
import { pickDefaultSeason } from '@/lib/seasons';
import { SectionTitle } from '@/components/ui/Ui';
import { DataSection, EmptyState, ErrorState, LoadingState } from '@/components/states/States';
import { LeagueSeasonSidebar } from '@/components/layout/LeagueSeasonSidebar';
import { TeamMiniCard } from '@/components/teams/TeamMiniCard';
import { EditableMatchesTable } from '@/components/views/EditableMatchesTable';
import { type MatchEditPatch } from '@/lib/match-edits';
import { ApiClientError } from '@/lib/api';
import { AmericanFootballLoaderLink } from './AmericanFootballLoaderLink';
import {
  deleteAmericanFootballGameFromCache,
  patchAmericanFootballGameInCache,
  useAmericanFootballGamesQuery,
  useAmericanFootballLeagueQuery,
  useAmericanFootballSeasonsQuery,
  useAmericanFootballTeamsQuery,
} from '@/lib/query/american-football/hooks';

export function AmericanFootballLeagueBrowse({ leagueId }: { leagueId: string }) {
  const queryClient = useQueryClient();
  const leagueRes = useAmericanFootballLeagueQuery(leagueId);
  const seasonsRes = useAmericanFootballSeasonsQuery(leagueId);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);

  const seasons = seasonsRes.data;
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

  const teamsRes = useAmericanFootballTeamsQuery(leagueId, selectedYear);
  const gamesRes = useAmericanFootballGamesQuery(leagueId, selectedYear);

  const league = leagueRes.league;
  const sortedMatches = gamesRes.data;
  const loaderAction = <AmericanFootballLoaderLink>Cargar información</AmericanFootballLoaderLink>;

  async function handleSaveMatchEdits(
    edits: Record<string, MatchEditPatch>,
  ): Promise<string | null> {
    if (!league?.id || selectedYear === null) {
      return 'No se pudo guardar los cambios.';
    }

    try {
      for (const [matchId, patch] of Object.entries(edits)) {
        await patchAmericanFootballGameInCache(
          queryClient,
          leagueId,
          selectedYear,
          matchId,
          patch,
          gamesRes.games,
        );
      }
      return null;
    } catch (err) {
      if (err instanceof ApiClientError) return err.message;
      return err instanceof Error ? err.message : 'No se pudo guardar los cambios.';
    }
  }

  async function handleDeleteMatch(matchId: string): Promise<string | null> {
    if (!league?.id || selectedYear === null) {
      return 'No se pudo eliminar el partido.';
    }

    try {
      await deleteAmericanFootballGameFromCache(queryClient, leagueId, selectedYear, matchId);
      return null;
    } catch (err) {
      if (err instanceof ApiClientError) return err.message;
      return err instanceof Error ? err.message : 'No se pudo eliminar el partido.';
    }
  }

  if (leagueRes.loading) return <LoadingState label="Cargando liga…" />;
  if (leagueRes.error) return <ErrorState message={leagueRes.error} onRetry={leagueRes.reload} />;

  return (
    <div className="space-y-8">
      <nav className="text-sm">
        <Link href={americanFootballTabPath('browse')} className="text-blue-400 hover:text-blue-300">
          ← Ligas
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
            <>
              <section>
                <SectionTitle>Partidos · {selectedYear}</SectionTitle>
                <DataSection
                  loading={gamesRes.loading && sortedMatches.length === 0}
                  error={gamesRes.error}
                  isEmpty={sortedMatches.length === 0}
                  onRetry={gamesRes.reload}
                  emptyTitle="Aún no hay partidos cargados"
                  emptyHint={`No hay partidos para la temporada ${selectedYear}. Puedes registrarlos en la carga de datos.`}
                  emptyAction={loaderAction}
                >
                  <EditableMatchesTable
                    matches={sortedMatches}
                    teams={teamsRes.data}
                    resetKey={`${league?.id ?? leagueId}:${selectedSeason?.id ?? 'none'}`}
                    onSave={handleSaveMatchEdits}
                    onDelete={handleDeleteMatch}
                  />
                </DataSection>
              </section>

              <section>
                <SectionTitle>Equipos · {selectedYear}</SectionTitle>
                <DataSection
                  loading={teamsRes.loading && teamsRes.data.length === 0}
                  error={teamsRes.error}
                  isEmpty={teamsRes.data.length === 0}
                  onRetry={teamsRes.reload}
                  emptyTitle="Aún no hay equipos cargados"
                  emptyHint={`No hay equipos para la temporada ${selectedYear}. Puedes registrarlos en la carga de datos.`}
                  emptyAction={loaderAction}
                >
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {teamsRes.data.map((team) => (
                      <TeamMiniCard key={team.id} team={team} leagueId={leagueId} />
                    ))}
                  </div>
                </DataSection>
              </section>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
