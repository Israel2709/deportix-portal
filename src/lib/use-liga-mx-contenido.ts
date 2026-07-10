'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import {
  LIGA_MX_LEAGUE_ID,
  resolveLigaMxTournaments,
  tournamentFromRound,
} from '@/lib/liga-mx';
import { readLocalMatches } from '@/lib/local-matches';
import { applyTeamOverrides, readTeamOverrides } from '@/lib/team-edits';
import { leagueMatchesPagePath } from '@/lib/use-all-matches';
import type { ApiCollection, ApiResource, League, Match, Season, Standing, Team } from '@/lib/types';

export interface LigaMxContenidoSeasonItem {
  season: Season;
  year: number;
}

export interface LigaMxContenidoTeamItem {
  team: Team;
  hasOverride: boolean;
}

export interface LigaMxContenidoMatchItem {
  match: Match;
  seasonId: string;
  year: number;
  isLocal: boolean;
}

export interface LigaMxContenidoStandingItem {
  standing: Standing;
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
  league: League | null;
  seasons: LigaMxContenidoSeasonItem[];
  tournaments: LigaMxContenidoTournamentItem[];
  teams: LigaMxContenidoTeamItem[];
  matches: LigaMxContenidoMatchItem[];
  standings: LigaMxContenidoStandingItem[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

async function fetchAllSeasonMatches(leagueId: string, year: number): Promise<Match[]> {
  const matches: Match[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (matches.length < total) {
    const response = await apiGet<ApiCollection<Match>>(leagueMatchesPagePath(leagueId, year, page));
    matches.push(...response.data);
    total = response.meta.pagination?.total ?? matches.length;
    if (response.data.length === 0 || response.data.length < 100) break;
    page += 1;
  }

  return matches;
}

export function useLigaMxContenido(refreshKey = 0): LigaMxContenidoData {
  const [listKey, setListKey] = useState(0);
  const [league, setLeague] = useState<League | null>(null);
  const [seasons, setSeasons] = useState<LigaMxContenidoSeasonItem[]>([]);
  const [tournaments, setTournaments] = useState<LigaMxContenidoTournamentItem[]>([]);
  const [teams, setTeams] = useState<LigaMxContenidoTeamItem[]>([]);
  const [matches, setMatches] = useState<LigaMxContenidoMatchItem[]>([]);
  const [standings, setStandings] = useState<LigaMxContenidoStandingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => setListKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const leagueId = encodeURIComponent(LIGA_MX_LEAGUE_ID);
        const [leagueEnvelope, seasonsEnvelope, teamsEnvelope] = await Promise.all([
          apiGet<ApiResource<League>>(`/v1/leagues/${leagueId}`),
          apiGet<ApiCollection<Season>>(`/v1/leagues/${leagueId}/seasons`),
          apiGet<ApiCollection<Team>>(`/v1/leagues/${leagueId}/teams?pageSize=100`),
        ]);

        if (cancelled) return;

        const loadedLeague = leagueEnvelope.data;
        const loadedSeasons = seasonsEnvelope.data
          .filter((season) => season.year != null)
          .map((season) => ({ season, year: season.year! }))
          .sort((left, right) => right.year - left.year);

        const overrides = readTeamOverrides();
        const loadedTeams = applyTeamOverrides(teamsEnvelope.data, overrides).map((team) => ({
          team,
          hasOverride: team.id in overrides,
        }));

        const matchItems: LigaMxContenidoMatchItem[] = [];
        const standingItems: LigaMxContenidoStandingItem[] = [];
        const tournamentItems: LigaMxContenidoTournamentItem[] = [];

        for (const { season, year } of loadedSeasons) {
          const seasonId = season.id;
          const [apiMatches, standingsEnvelope] = await Promise.all([
            fetchAllSeasonMatches(LIGA_MX_LEAGUE_ID, year),
            apiGet<ApiCollection<Standing>>(`/v1/leagues/${leagueId}/standings?season=${year}`),
          ]);

          const localMatches = readLocalMatches(LIGA_MX_LEAGUE_ID, seasonId);
          const allMatches = [...apiMatches, ...localMatches];

          for (const match of allMatches) {
            matchItems.push({
              match,
              seasonId,
              year,
              isLocal: match.id.startsWith('local_'),
            });
          }

          for (const standing of standingsEnvelope.data) {
            standingItems.push({ standing, seasonId, year });
          }

          const tournamentNames = resolveLigaMxTournaments(allMatches);
          for (const name of tournamentNames) {
            const matchCount = allMatches.filter(
              (match) => tournamentFromRound(match.round) === name,
            ).length;
            tournamentItems.push({ name, year, seasonId, matchCount });
          }
        }

        if (cancelled) return;

        setLeague(loadedLeague);
        setSeasons(loadedSeasons);
        setTeams(loadedTeams.sort((left, right) => (left.team.name ?? '').localeCompare(right.team.name ?? '')));
        setMatches(matchItems);
        setStandings(standingItems);
        setTournaments(tournamentItems);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el contenido');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [listKey, refreshKey]);

  return { league, seasons, tournaments, teams, matches, standings, loading, error, reload };
}
