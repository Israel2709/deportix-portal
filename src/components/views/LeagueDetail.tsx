'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useApi } from '@/lib/use-api';
import { useAllMatches } from '@/lib/use-all-matches';
import type {
  ApiCollection,
  ApiResource,
  League,
  Match,
  Season,
  Standing,
  Team,
} from '@/lib/types';
import { DataTable, SectionTitle, type Column } from '@/components/ui/Ui';
import { DataSection, ErrorState, LoadingState } from '@/components/states/States';
import { formatDateTime } from '@/lib/format';
import { sortMatchesByDateAsc } from '@/lib/match-sort';
import { isLocalMatch, removeLocalMatch, updateLocalMatch } from '@/lib/local-matches';
import { addMatchFormPath } from '@/lib/match-form';
import { type MatchEditPatch } from '@/lib/match-edits';
import { deleteMatchApi, patchMatch } from '@/lib/match-api';
import { ApiClientError } from '@/lib/api';
import { useLocalMatches } from '@/lib/use-local-matches';
import { applyTeamOverrides } from '@/lib/team-edits';
import { useTeamOverrides } from '@/lib/use-team-overrides';
import { EditableMatchesTable } from '@/components/views/EditableMatchesTable';
import { TeamMiniCard } from '@/components/teams/TeamMiniCard';
import { LeagueSeasonSidebar } from '@/components/layout/LeagueSeasonSidebar';
import { LigaMxSeasonSection } from '@/components/views/LigaMxSeasonSection';
import { LIGA_MX_LEAGUE_ID } from '@/lib/liga-mx';
import { consumeCreatedMatch } from '@/lib/pending-created-match';
import { pickDefaultSeason } from '@/lib/seasons';

export function LeagueDetail({
  league: leagueId,
  title,
  intro,
}: {
  league: string;
  title?: string;
  intro?: string;
}) {
  const id = encodeURIComponent(leagueId);
  const isLigaMx = leagueId === LIGA_MX_LEAGUE_ID;
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

  const standingsPath =
    selectedYear !== null ? `/v1/leagues/${id}/standings?season=${selectedYear}` : null;
  const teamsRes = useApi<ApiCollection<Team>>(`/v1/leagues/${id}/teams?pageSize=100`);
  const standingsRes = useApi<ApiCollection<Standing>>(standingsPath);
  const matchesRes = useAllMatches(leagueId, selectedYear);

  useEffect(() => {
    const pending = consumeCreatedMatch();
    if (!pending) return;

    if (pending.seasonId) {
      setSelectedSeasonId(pending.seasonId);
    }
    matchesRes.appendMatches([pending.match]);
  }, [matchesRes.appendMatches]);

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

  const standingColumns: Column<Standing>[] = [
    { key: 'team', header: 'Equipo', render: (r) => r.teamName ?? r.teamId ?? '—' },
    { key: 'pj', header: 'PJ', render: (r) => r.played ?? '—', className: 'text-right' },
    { key: 'w', header: 'G', render: (r) => r.wins ?? '—', className: 'text-right' },
    {
      key: 'dt',
      header: 'E',
      render: (r) => r.draws ?? r.ties ?? '—',
      className: 'text-right',
    },
    { key: 'l', header: 'P', render: (r) => r.losses ?? '—', className: 'text-right' },
    {
      key: 'pts',
      header: 'Pts',
      render: (r) => r.points ?? '—',
      className: 'text-right font-semibold',
    },
  ];

  const sortedMatches = useMemo(
    () => sortMatchesByDateAsc([...matchesRes.data, ...localMatches]),
    [matchesRes.data, localMatches],
  );

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
      matchesRes.reload();
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

  const standingsSection = (
    <section>
      <SectionTitle>Clasificación</SectionTitle>
      <DataSection
        loading={standingsRes.loading}
        error={standingsRes.error}
        isEmpty={(standingsRes.data?.data.length ?? 0) === 0}
        onRetry={standingsRes.reload}
        emptyTitle="No hay clasificación disponible"
        emptyHint="La clasificación de la temporada seleccionada aún no se ha cargado."
      >
        <DataTable
          columns={standingColumns}
          rows={standingsRes.data?.data ?? []}
          rowKey={(r, i) => r.teamId ?? String(i)}
          caption="Clasificación de la liga"
        />
      </DataSection>
    </section>
  );

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-center gap-4">
        {(league?.altLogo ?? league?.logo) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={league.altLogo ?? league.logo ?? ''} alt="" className="h-14 w-14 rounded bg-white/5 object-contain p-1" />
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-50">{title ?? league?.name ?? leagueId}</h1>
          <p className="text-sm text-slate-400">
            {[league?.sport, league?.country, league?.type].filter(Boolean).join(' · ') || '—'}
          </p>
          {intro && <p className="mt-1 text-sm text-slate-400">{intro}</p>}
          <p className="mt-1 text-xs text-slate-500">
            Última actualización {formatDateTime(league?.updatedAt)}
          </p>
        </div>
      </section>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <LeagueSeasonSidebar
          seasons={seasons}
          loading={seasonsRes.loading}
          error={seasonsRes.error}
          selectedSeasonId={effectiveSelectedSeasonId}
          onSelect={setSelectedSeasonId}
          onRetry={seasonsRes.reload}
        />

        <div className="min-w-0 flex-1 space-y-8">
          {isLigaMx && selectedYear !== null ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)] lg:items-start">
              <LigaMxSeasonSection year={selectedYear} matches={sortedMatches} />
              {standingsSection}
            </div>
          ) : (
            standingsSection
          )}

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
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
            <DataSection
              loading={matchesRes.loading}
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
              />
            </DataSection>
          </section>

          <section>
            <SectionTitle>Equipos</SectionTitle>
            <DataSection
              loading={teamsRes.loading}
              error={teamsRes.error}
              isEmpty={teamsWithOverrides.length === 0}
              onRetry={teamsRes.reload}
              emptyTitle="No hay equipos disponibles"
              emptyHint="Las plantillas de equipos de esta liga aún no se han cargado."
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
        </div>
      </div>
    </div>
  );
}
