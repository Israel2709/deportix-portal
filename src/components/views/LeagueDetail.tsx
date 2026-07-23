'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  useLeagueMatchesQuery,
  useLeagueQuery,
  useLeagueSeasonsQuery,
  useLeagueStandingsQuery,
  useLeagueTeamsQuery,
} from '@/lib/query/hooks/league';
import type { Match, Standing, Team } from '@/lib/types';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SectionTitle } from '@/components/ui/Ui';
import { DataSection, ErrorState, LoadingState } from '@/components/states/States';
import { formatDateTime } from '@/lib/format';
import { isLocalMatch, removeLocalMatch, updateLocalMatch } from '@/lib/local-matches';
import { addMatchFormPath } from '@/lib/match-form';
import { type MatchEditPatch, applyMatchPatch } from '@/lib/match-edits';
import { ApiClientError } from '@/lib/api';
import { useTeamOverrides } from '@/lib/use-team-overrides';
import { EditableMatchesTable } from '@/components/views/EditableMatchesTable';
import { TeamMiniCard } from '@/components/teams/TeamMiniCard';
import { LeagueSeasonSidebar } from '@/components/layout/LeagueSeasonSidebar';
import { LigaMxSeasonSection } from '@/components/views/LigaMxSeasonSection';
import { LIGA_MX_LEAGUE_ID } from '@/lib/liga-mx';
import { consumeCreatedMatch } from '@/lib/pending-created-match';
import { pickDefaultSeason } from '@/lib/seasons';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import {
  useDeleteMatchMutation,
  usePatchMatchMutation,
} from '@/lib/query/liga-mx/mutations';

export function LeagueDetail({
  league: leagueId,
  title,
  intro,
  fillHeight = false,
}: {
  league: string;
  title?: string;
  intro?: string;
  /** Constrain layout to the parent height and scroll the matches table body. */
  fillHeight?: boolean;
}) {
  const isLigaMx = leagueId === LIGA_MX_LEAGUE_ID;
  const leagueRes = useLeagueQuery(leagueId);
  const seasonsRes = useLeagueSeasonsQuery(leagueId);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const queryClient = useQueryClient();

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

  const teamsRes = useLeagueTeamsQuery(leagueId);
  const standingsRes = useLeagueStandingsQuery(leagueId, selectedYear);
  const matchesRes = useLeagueMatchesQuery(leagueId, selectedYear, selectedSeason?.id ?? null);
  const patchMatchMutation = usePatchMatchMutation(leagueId, selectedYear ?? 0);
  const deleteMatchMutation = useDeleteMatchMutation(leagueId, selectedYear ?? 0);

  useEffect(() => {
    const pending = consumeCreatedMatch();
    if (!pending || selectedYear === null) return;

    if (pending.seasonId) {
      setSelectedSeasonId(pending.seasonId);
    }

    queryClient.setQueryData<Match[]>(queryKeys.matches(leagueId, selectedYear), (current) => {
      const existing = current ?? [];
      if (existing.some((match) => match.id === pending.match.id)) return existing;
      return [...existing, pending.match];
    });
  }, [leagueId, queryClient, selectedYear]);

  const league = leagueRes.data;
  const { overrides: teamOverrides } = useTeamOverrides();
  const teamsWithOverrides = teamsRes.data;
  const sortedMatches = matchesRes.data;

  const standingColumns: Column<Standing>[] = [
    {
      key: 'team',
      header: 'Equipo',
      render: (r) => r.teamName ?? r.teamId ?? '—',
      sortValue: (r) => r.teamName ?? r.teamId,
    },
    {
      key: 'pj',
      header: 'PJ',
      render: (r) => r.played ?? '—',
      className: 'text-right',
      sortValue: (r) => r.played,
    },
    {
      key: 'w',
      header: 'G',
      render: (r) => r.wins ?? '—',
      className: 'text-right',
      sortValue: (r) => r.wins,
    },
    {
      key: 'dt',
      header: 'E',
      render: (r) => r.draws ?? r.ties ?? '—',
      className: 'text-right',
      sortValue: (r) => r.draws ?? r.ties,
    },
    {
      key: 'l',
      header: 'P',
      render: (r) => r.losses ?? '—',
      className: 'text-right',
      sortValue: (r) => r.losses,
    },
    {
      key: 'pts',
      header: 'Pts',
      render: (r) => r.points ?? '—',
      className: 'text-right font-semibold',
      sortValue: (r) => r.points,
    },
  ];

  async function handleSaveMatchEdits(
    edits: Record<string, MatchEditPatch>,
  ): Promise<string | null> {
    if (!league?.id || !selectedSeason?.id || selectedYear === null) {
      return 'No se pudo guardar los cambios.';
    }

    try {
      for (const [matchId, patch] of Object.entries(edits)) {
        const match = sortedMatches.find((entry) => entry.id === matchId);
        if (!match) continue;

        if (isLocalMatch(match)) {
          updateLocalMatch(league.id, selectedSeason.id, matchId, patch, teamsWithOverrides);
        } else {
          await patchMatchMutation.mutateAsync({ matchId, patch });
        }
      }

      // Ensure the table reflects edits immediately even if the API list is momentarily stale.
      queryClient.setQueryData<Match[]>(queryKeys.matches(leagueId, selectedYear), (current) =>
        (current ?? []).map((match) => {
          const patch = edits[match.id];
          return patch ? applyMatchPatch(match, patch, teamsWithOverrides) : match;
        }),
      );

      matchesRes.reload();
      await queryClient.refetchQueries({
        queryKey: queryKeys.matches(leagueId, selectedYear),
        type: 'active',
      });

      // Keep optimistic fields if the refetch still returns pre-update values.
      queryClient.setQueryData<Match[]>(queryKeys.matches(leagueId, selectedYear), (current) =>
        (current ?? []).map((match) => {
          const patch = edits[match.id];
          return patch ? applyMatchPatch(match, patch, teamsWithOverrides) : match;
        }),
      );

      return null;
    } catch (err) {
      if (err instanceof ApiClientError) return err.message;
      return 'No se pudo guardar los cambios.';
    }
  }

  async function handleDeleteMatch(matchId: string): Promise<string | null> {
    if (!league?.id || !selectedSeason?.id || selectedYear === null) {
      return 'No se pudo eliminar el partido.';
    }

    const match = sortedMatches.find((entry) => entry.id === matchId);
    if (!match) return 'No se encontró el partido.';

    try {
      if (isLocalMatch(match)) {
        removeLocalMatch(league.id, selectedSeason.id, matchId);
      } else {
        await deleteMatchMutation.mutateAsync(matchId);
      }

      queryClient.setQueryData<Match[]>(queryKeys.matches(leagueId, selectedYear), (current) =>
        (current ?? []).filter((entry) => entry.id !== matchId),
      );
      matchesRes.reload();
      await queryClient.refetchQueries({
        queryKey: queryKeys.matches(leagueId, selectedYear),
        type: 'active',
      });
      return null;
    } catch (err) {
      if (err instanceof ApiClientError) return err.message;
      return 'No se pudo eliminar el partido.';
    }
  }

  if (leagueRes.loading) return <LoadingState label="Cargando liga…" />;
  if (leagueRes.error) return <ErrorState message={leagueRes.error} onRetry={leagueRes.reload} />;

  const standingsSection = (
    <section>
      <SectionTitle>Clasificación</SectionTitle>
      <DataSection
        loading={standingsRes.loading && standingsRes.data.length === 0}
        error={standingsRes.error}
        isEmpty={standingsRes.data.length === 0}
        onRetry={standingsRes.reload}
        emptyTitle="No hay clasificación disponible"
        emptyHint="La clasificación de la temporada seleccionada aún no se ha cargado."
      >
        <DataTable
          columns={standingColumns}
          rows={standingsRes.data}
          rowKey={(r, i) => r.teamId ?? String(i)}
          caption="Clasificación de la liga"
          countLabels={{ singular: 'equipo', plural: 'equipos' }}
        />
      </DataSection>
    </section>
  );

  return (
    <div
      className={
        fillHeight ? 'flex min-h-0 flex-1 flex-col gap-4 overflow-hidden' : 'space-y-8'
      }
    >
      <section
        className={`flex flex-wrap items-center gap-4 ${fillHeight ? 'shrink-0' : ''}`}
      >
        {(league?.altLogo ?? league?.logo) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={league.altLogo ?? league.logo ?? ''} alt="" className="h-14 w-14 rounded bg-white/5 object-contain p-1" />
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-50">{title ?? league?.name ?? leagueId}</h1>
          <p className="text-sm text-slate-400">
            {[league?.sport, league?.country, league?.type].filter(Boolean).join(' · ') || '—'}
          </p>
          {intro && !fillHeight && <p className="mt-1 text-sm text-slate-400">{intro}</p>}
          <p className="mt-1 text-xs text-slate-500">
            Última actualización {formatDateTime(league?.updatedAt)}
          </p>
        </div>
      </section>

      <div
        className={
          fillHeight
            ? 'flex min-h-0 flex-1 flex-col gap-4 overflow-hidden lg:flex-row lg:items-stretch'
            : 'flex flex-col gap-8 lg:flex-row lg:items-start'
        }
      >
        <div className={fillHeight ? 'shrink-0 lg:max-h-full lg:overflow-y-auto' : undefined}>
          <LeagueSeasonSidebar
            seasons={seasons}
            loading={seasonsRes.loading}
            error={seasonsRes.error}
            selectedSeasonId={effectiveSelectedSeasonId}
            onSelect={setSelectedSeasonId}
            onRetry={seasonsRes.reload}
          />
        </div>

        <div
          className={
            fillHeight
              ? 'flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden'
              : 'min-w-0 flex-1 space-y-8'
          }
        >
          {isLigaMx && selectedYear !== null ? (
            <div
              className={`grid gap-6 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)] lg:items-start ${
                fillHeight ? 'max-h-56 shrink-0 overflow-y-auto' : ''
              }`}
            >
              <LigaMxSeasonSection year={selectedYear} matches={sortedMatches} />
              {standingsSection}
            </div>
          ) : (
            <div className={fillHeight ? 'max-h-56 shrink-0 overflow-y-auto' : undefined}>
              {standingsSection}
            </div>
          )}

          <section
            className={
              fillHeight ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : undefined
            }
          >
            <div
              className={`mb-3 flex flex-wrap items-center justify-between gap-3 ${
                fillHeight ? 'shrink-0' : ''
              }`}
            >
              <SectionTitle>Partidos</SectionTitle>
              {selectedYear !== null && (
                <Link
                  href={addMatchFormPath(leagueId, selectedYear)}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
                >
                  Agregar partido
                </Link>
              )}
            </div>
            <div className={fillHeight ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : undefined}>
              <DataSection
                loading={matchesRes.loading && sortedMatches.length === 0}
                error={matchesRes.error}
                isEmpty={sortedMatches.length === 0}
                onRetry={matchesRes.reload}
                emptyTitle="No hay partidos disponibles"
                emptyHint="Los partidos de la temporada seleccionada aún no se han cargado."
              >
                <EditableMatchesTable
                  matches={sortedMatches}
                  teams={teamsWithOverrides}
                  resetKey={`${league?.id ?? leagueId}:${selectedSeason?.id ?? 'none'}`}
                  onSave={handleSaveMatchEdits}
                  onDelete={handleDeleteMatch}
                  fillHeight={fillHeight}
                />
              </DataSection>
            </div>
          </section>

          {!fillHeight && (
            <section>
              <SectionTitle>Equipos</SectionTitle>
              <DataSection
                loading={teamsRes.loading && teamsWithOverrides.length === 0}
                error={teamsRes.error}
                isEmpty={teamsWithOverrides.length === 0}
                onRetry={teamsRes.reload}
                emptyTitle="No hay equipos disponibles"
                emptyHint="Las plantillas de equipos de esta liga aún no se han cargado."
              >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {teamsWithOverrides.map((team: Team) => (
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
          )}
        </div>
      </div>
    </div>
  );
}
