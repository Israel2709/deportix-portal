'use client';

import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useLeagueQuery,
  useLeagueSeasonResourceQueries,
  useLeagueSeasonsQuery,
  useLeagueTeamsQuery,
} from '@/lib/query/hooks/league';
import { LIGA_MX_LEAGUE_ID, resolveLigaMxTournaments, tournamentFromRound } from '@/lib/liga-mx';
import { readLocalMatches } from '@/lib/local-matches';
import { readTeamOverrides } from '@/lib/team-edits';
import type { Match } from '@/lib/types';

export interface LigaMxContenidoSeasonItem {
  season: import('@/lib/types').Season;
  year: number;
}

export interface LigaMxContenidoTeamItem {
  team: import('@/lib/types').Team;
  hasOverride: boolean;
}

export interface LigaMxContenidoMatchItem {
  match: Match;
  seasonId: string;
  year: number;
  isLocal: boolean;
}

export interface LigaMxContenidoStandingItem {
  standing: import('@/lib/types').Standing;
  seasonId: string;
  year: number;
}

export interface LigaMxContenidoTournamentItem {
  name: string;
  year: number;
  seasonId: string;
  matchCount: number;
}

export interface LigaMxContenidoData {
  league: import('@/lib/types').League | null;
  seasons: LigaMxContenidoSeasonItem[];
  tournaments: LigaMxContenidoTournamentItem[];
  teams: LigaMxContenidoTeamItem[];
  matches: LigaMxContenidoMatchItem[];
  standings: LigaMxContenidoStandingItem[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useLigaMxContenido(_refreshKey = 0): LigaMxContenidoData {
  const queryClient = useQueryClient();
  const leagueRes = useLeagueQuery(LIGA_MX_LEAGUE_ID);
  const seasonsRes = useLeagueSeasonsQuery(LIGA_MX_LEAGUE_ID);
  const teamsRes = useLeagueTeamsQuery(LIGA_MX_LEAGUE_ID);

  const loadedSeasons = useMemo(
    () =>
      seasonsRes.data
        .filter((season) => season.year != null)
        .map((season) => ({ season, year: season.year!, id: season.id }))
        .sort((left, right) => right.year - left.year),
    [seasonsRes.data],
  );

  const { matchQueries, standingQueries } = useLeagueSeasonResourceQueries(
    LIGA_MX_LEAGUE_ID,
    loadedSeasons.map((entry) => ({ id: entry.id, year: entry.year })),
  );

  const overrides = readTeamOverrides();

  const teams = useMemo(
    () =>
      teamsRes.data
        .map((team) => ({ team, hasOverride: team.id in overrides }))
        .sort((left, right) => (left.team.name ?? '').localeCompare(right.team.name ?? '')),
    [teamsRes.data, overrides],
  );

  const matches = useMemo(() => {
    const items: LigaMxContenidoMatchItem[] = [];

    loadedSeasons.forEach((entry, index) => {
      const apiMatches = matchQueries[index]?.data ?? [];
      const localMatches = readLocalMatches(LIGA_MX_LEAGUE_ID, entry.id);
      const allMatches = [...apiMatches, ...localMatches];

      for (const match of allMatches) {
        items.push({
          match,
          seasonId: entry.id,
          year: entry.year,
          isLocal: match.id.startsWith('local_'),
        });
      }
    });

    return items;
  }, [loadedSeasons, matchQueries]);

  const standings = useMemo(() => {
    const items: LigaMxContenidoStandingItem[] = [];

    loadedSeasons.forEach((entry, index) => {
      for (const standing of standingQueries[index]?.data ?? []) {
        items.push({ standing, seasonId: entry.id, year: entry.year });
      }
    });

    return items;
  }, [loadedSeasons, standingQueries]);

  const tournaments = useMemo(() => {
    const items: LigaMxContenidoTournamentItem[] = [];

    loadedSeasons.forEach((entry, index) => {
      const apiMatches = matchQueries[index]?.data ?? [];
      const localMatches = readLocalMatches(LIGA_MX_LEAGUE_ID, entry.id);
      const allMatches = [...apiMatches, ...localMatches];
      const tournamentNames = resolveLigaMxTournaments(allMatches);

      for (const name of tournamentNames) {
        const matchCount = allMatches.filter(
          (match) => tournamentFromRound(match.round) === name,
        ).length;
        items.push({ name, year: entry.year, seasonId: entry.id, matchCount });
      }
    });

    return items;
  }, [loadedSeasons, matchQueries]);

  const seasons = useMemo(
    () => loadedSeasons.map(({ season, year }) => ({ season, year })),
    [loadedSeasons],
  );

  const resourceLoading =
    matchQueries.some((query) => query.isPending) ||
    standingQueries.some((query) => query.isPending);

  const resourceError =
    matchQueries.find((query) => query.error)?.error ??
    standingQueries.find((query) => query.error)?.error ??
    null;

  const loading = leagueRes.loading || seasonsRes.loading || teamsRes.loading || resourceLoading;
  const error =
    leagueRes.error ??
    seasonsRes.error ??
    teamsRes.error ??
    (resourceError instanceof Error ? resourceError.message : null);

  return {
    league: leagueRes.data,
    seasons,
    tournaments,
    teams,
    matches,
    standings,
    loading,
    error,
    reload: () => {
      leagueRes.reload();
      seasonsRes.reload();
      teamsRes.reload();
      for (const entry of loadedSeasons) {
        void queryClient.invalidateQueries({ queryKey: ['matches', LIGA_MX_LEAGUE_ID, entry.year] });
        void queryClient.invalidateQueries({
          queryKey: ['standings', LIGA_MX_LEAGUE_ID, entry.year],
        });
      }
    },
  };
}
