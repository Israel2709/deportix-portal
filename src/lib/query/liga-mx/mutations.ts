import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMatchApi, deleteMatchApi, patchMatch } from '@/lib/match-api';
import { patchTeamApi } from '@/lib/team-api';
import { queryKeys } from '@/lib/query/keys';
import { applyMatchPatch, type MatchEditPatch } from '@/lib/match-edits';
import type { TeamEditPatch } from '@/lib/team-edits';
import type { Match, Team } from '@/lib/types';
import type { MatchCreateBody } from '@/lib/match-form';

function updateMatchesCache(
  queryClient: ReturnType<typeof useQueryClient>,
  leagueId: string,
  seasonYear: number,
  updater: (matches: Match[]) => Match[],
) {
  queryClient.setQueryData<Match[]>(queryKeys.matches(leagueId, seasonYear), (current) =>
    updater(current ?? []),
  );
}

export function usePatchMatchMutation(leagueId: string, seasonYear: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matchId, patch }: { matchId: string; patch: MatchEditPatch }) =>
      patchMatch(leagueId, matchId, patch),
    onSuccess: (updatedMatch, { matchId, patch }) => {
      updateMatchesCache(queryClient, leagueId, seasonYear, (matches) =>
        matches.map((match) => {
          if (match.id !== matchId && match.id !== updatedMatch.id) return match;
          return applyMatchPatch(updatedMatch.id === match.id ? updatedMatch : match, patch);
        }),
      );
    },
  });
}

export function useDeleteMatchMutation(leagueId: string, seasonYear: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (matchId: string) => deleteMatchApi(leagueId, matchId),
    onSuccess: (_result, matchId) => {
      updateMatchesCache(queryClient, leagueId, seasonYear, (matches) =>
        matches.filter((match) => match.id !== matchId),
      );
    },
  });
}

export function useCreateMatchMutation(leagueId: string, seasonYear: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: MatchCreateBody) => createMatchApi(leagueId, body, seasonYear),
    onSuccess: (createdMatch) => {
      updateMatchesCache(queryClient, leagueId, seasonYear, (matches) => {
        if (matches.some((match) => match.id === createdMatch.id)) return matches;
        return [...matches, createdMatch];
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.matches(leagueId, seasonYear) });
    },
  });
}

export function usePatchTeamMutation(leagueId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, patch }: { teamId: string; patch: TeamEditPatch }) =>
      patchTeamApi(teamId, patch),
    onSuccess: (updatedTeam) => {
      queryClient.setQueriesData<Team[]>(
        { queryKey: ['teams', leagueId] },
        (current) => current?.map((team) => (team.id === updatedTeam.id ? updatedTeam : team)) ?? current,
      );
      queryClient.setQueryData<Team>(queryKeys.team(updatedTeam.id), updatedTeam);
    },
  });
}

export function invalidateLeagueMatches(
  queryClient: ReturnType<typeof useQueryClient>,
  leagueId: string,
  seasonYear: number,
) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.matches(leagueId, seasonYear) });
}

export function invalidateLeagueStandings(
  queryClient: ReturnType<typeof useQueryClient>,
  leagueId: string,
  seasonYear: number,
) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.standings(leagueId, seasonYear) });
}
