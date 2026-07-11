'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useApi } from '@/lib/use-api';
import { useAllMatches } from '@/lib/use-all-matches';
import type { ApiCollection, ApiResource, League, Match, Season, Team } from '@/lib/types';
import { americanFootballTabPath } from '@/lib/american-football-paths';
import { pickDefaultSeason } from '@/lib/seasons';
import { sortMatchesByDateAsc } from '@/lib/match-sort';
import { SectionTitle } from '@/components/ui/Ui';
import { DataSection, EmptyState, ErrorState, LoadingState } from '@/components/states/States';
import { LeagueSeasonSidebar } from '@/components/layout/LeagueSeasonSidebar';
import { TeamMiniCard } from '@/components/teams/TeamMiniCard';
import { EditableMatchesTable } from '@/components/views/EditableMatchesTable';
import { type MatchEditPatch } from '@/lib/match-edits';
import { deleteMatchApi, patchMatch } from '@/lib/match-api';
import { ApiClientError } from '@/lib/api';
import { isLocalMatch, removeLocalMatch, updateLocalMatch } from '@/lib/local-matches';
import { useLocalMatches } from '@/lib/use-local-matches';
import { applyTeamOverrides } from '@/lib/team-edits';
import { useTeamOverrides } from '@/lib/use-team-overrides';
import { AmericanFootballLoaderLink } from './AmericanFootballLoaderLink';

export function AmericanFootballLeagueBrowse({ leagueId }: { leagueId: string }) {
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
  const teamsPath =
    selectedYear !== null
      ? `/v1/leagues/${id}/teams?pageSize=100&season=${selectedYear}`
      : null;
  const teamsRes = useApi<ApiCollection<Team>>(teamsPath);
  const matchesRes = useAllMatches(leagueId, selectedYear);

  const league = leagueRes.data?.data;
  const { matches: localMatches, reload: reloadLocalMatches } = useLocalMatches(
    league?.id ?? null,
    selectedSeason?.id ?? null,
  );
  const { overrides: teamOverrides } = useTeamOverrides();

  const teamsWithOverrides = useMemo(
    () => applyTeamOverrides(teamsRes.data?.data ?? [], teamOverrides),
    [teamsRes.data, teamOverrides],
  );

  const sortedMatches = useMemo(
    () => sortMatchesByDateAsc([...matchesRes.data, ...localMatches]),
    [matchesRes.data, localMatches],
  );
  const loaderAction = <AmericanFootballLoaderLink>Cargar información</AmericanFootballLoaderLink>;

  useEffect(() => {
    function refreshOnVisible() {
      if (document.visibilityState !== 'visible') return;
      teamsRes.reload();
      matchesRes.reload();
    }

    document.addEventListener('visibilitychange', refreshOnVisible);
    return () => document.removeEventListener('visibilitychange', refreshOnVisible);
  }, [teamsRes.reload, matchesRes.reload]);

  async function handleSaveMatchEdits(
    edits: Record<string, MatchEditPatch>,
  ): Promise<string | null> {
    if (!league?.id || !selectedSeason?.id) {
      return 'No se pudo guardar los cambios.';
    }

    try {
      const updatedMatches: Match[] = [];

      for (const [matchId, patch] of Object.entries(edits)) {
        const match = sortedMatches.find((entry) => entry.id === matchId);
        if (!match) continue;

        if (isLocalMatch(match)) {
          updateLocalMatch(league.id, selectedSeason.id, matchId, patch, teamsWithOverrides);
        } else {
          updatedMatches.push(await patchMatch(leagueId, matchId, patch));
        }
      }

      reloadLocalMatches();
      matchesRes.applyUpdates(updatedMatches);
      return null;
    } catch (err) {
      if (err instanceof ApiClientError) return err.message;
      return 'No se pudo guardar los cambios.';
    }
  }

  async function handleDeleteMatch(matchId: string): Promise<string | null> {
    if (!league?.id || !selectedSeason?.id) {
      return 'No se pudo eliminar el partido.';
    }

    const match = sortedMatches.find((entry) => entry.id === matchId);
    if (!match) return 'No se encontró el partido.';

    try {
      if (isLocalMatch(match)) {
        removeLocalMatch(league.id, selectedSeason.id, matchId);
        reloadLocalMatches();
      } else {
        await deleteMatchApi(leagueId, matchId);
        matchesRes.removeMatches([matchId]);
      }
      return null;
    } catch (err) {
      if (err instanceof ApiClientError) return err.message;
      return 'No se pudo eliminar el partido.';
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
                  loading={matchesRes.loading && sortedMatches.length === 0}
                  error={matchesRes.error}
                  isEmpty={sortedMatches.length === 0}
                  onRetry={matchesRes.reload}
                  emptyTitle="Aún no hay partidos cargados"
                  emptyHint={`No hay partidos para la temporada ${selectedYear}. Puedes registrarlos en la carga de datos.`}
                  emptyAction={loaderAction}
                >
                  <EditableMatchesTable
                    matches={sortedMatches}
                    teams={teamsWithOverrides}
                    resetKey={`${league?.id ?? leagueId}:${selectedSeason?.id ?? 'none'}`}
                    onSave={handleSaveMatchEdits}
                    onDelete={handleDeleteMatch}
                  />
                </DataSection>
              </section>

              <section>
                <SectionTitle>Equipos · {selectedYear}</SectionTitle>
                <DataSection
                  loading={teamsRes.loading}
                  error={teamsRes.error}
                  isEmpty={teamsWithOverrides.length === 0}
                  onRetry={teamsRes.reload}
                  emptyTitle="Aún no hay equipos cargados"
                  emptyHint={`No hay equipos para la temporada ${selectedYear}. Puedes registrarlos en la carga de datos.`}
                  emptyAction={loaderAction}
                >
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {teamsWithOverrides.map((team) => (
                      <TeamMiniCard
                        key={team.id}
                        team={team}
                        leagueId={leagueId}
                        hasOverride={team.id in teamOverrides}
                      />
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
