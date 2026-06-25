import { apiPatch } from './api';
import { matchEditPatchToApiBody, type MatchEditPatch } from './match-edits';
import type { ApiResource, Match } from './types';

export function leagueMatchPath(leagueId: string, matchId: string): string {
  return `/v1/leagues/${encodeURIComponent(leagueId)}/matches/${encodeURIComponent(matchId)}`;
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
