import { apiDelete, apiPatch, apiPost } from './api';
import { matchEditPatchToApiBody, type MatchEditPatch } from './match-edits';
import type { ApiResource, Match } from './types';
import type { MatchCreateBody } from './match-form';

export function leagueMatchesPath(leagueId: string, seasonYear?: number | null): string {
  const base = `/v1/leagues/${encodeURIComponent(leagueId)}/matches`;
  return seasonYear != null ? `${base}?season=${seasonYear}` : base;
}

export function leagueMatchPath(leagueId: string, matchId: string): string {
  return `${leagueMatchesPath(leagueId)}/${encodeURIComponent(matchId)}`;
}

export async function createMatchApi(
  leagueId: string,
  body: MatchCreateBody,
  seasonYear?: number | null,
): Promise<Match> {
  const response = await apiPost<ApiResource<Match>>(leagueMatchesPath(leagueId, seasonYear), body);
  return response.data;
}

export async function patchMatch(
  leagueId: string,
  matchId: string,
  patch: MatchEditPatch,
): Promise<Match> {
  const response = await apiPatch<ApiResource<Match>>(
    leagueMatchPath(leagueId, matchId),
    matchEditPatchToApiBody(patch),
  );
  return response.data;
}

export async function deleteMatchApi(leagueId: string, matchId: string): Promise<void> {
  await apiDelete(leagueMatchPath(leagueId, matchId));
}
