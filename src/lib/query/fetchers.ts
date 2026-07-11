import { apiGet } from '@/lib/api';
import { leagueMatchesPagePath } from '@/lib/use-all-matches-path';
import type { ApiCollection, ApiResource, League, Match, Season, Standing, Team } from '@/lib/types';

const PAGE_SIZE = 100;

export async function fetchLeague(leagueId: string): Promise<League> {
  const response = await apiGet<ApiResource<League>>(`/v1/leagues/${encodeURIComponent(leagueId)}`);
  return response.data;
}

export async function fetchLeagueSeasons(leagueId: string): Promise<Season[]> {
  const response = await apiGet<ApiCollection<Season>>(
    `/v1/leagues/${encodeURIComponent(leagueId)}/seasons`,
  );
  return response.data;
}

export async function fetchLeagueTeams(leagueId: string, seasonYear?: number | null): Promise<Team[]> {
  const id = encodeURIComponent(leagueId);
  const path =
    seasonYear != null
      ? `/v1/leagues/${id}/teams?pageSize=${PAGE_SIZE}&season=${seasonYear}`
      : `/v1/leagues/${id}/teams?pageSize=${PAGE_SIZE}`;
  const response = await apiGet<ApiCollection<Team>>(path);
  return response.data;
}

export async function fetchLeagueMatches(leagueId: string, seasonYear: number): Promise<Match[]> {
  const matches: Match[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (matches.length < total) {
    const response = await apiGet<ApiCollection<Match>>(
      leagueMatchesPagePath(leagueId, seasonYear, page, PAGE_SIZE),
    );
    matches.push(...response.data);
    total = response.meta.pagination?.total ?? matches.length;

    if (response.data.length === 0 || response.data.length < PAGE_SIZE) break;
    page += 1;
  }

  return matches;
}

export async function fetchLeagueStandings(
  leagueId: string,
  seasonYear: number,
): Promise<Standing[]> {
  const response = await apiGet<ApiCollection<Standing>>(
    `/v1/leagues/${encodeURIComponent(leagueId)}/standings?season=${seasonYear}`,
  );
  return response.data;
}

export async function fetchTeam(teamId: string): Promise<Team> {
  const response = await apiGet<ApiResource<Team>>(`/v1/teams/${encodeURIComponent(teamId)}`);
  return response.data;
}

export async function fetchApiPath<T>(path: string): Promise<T> {
  return apiGet<T>(path);
}
