/**
 * Query key factories. Keys are the single source of truth for cache identity and invalidation.
 *
 * Liga MX uses the public /v1 API. American Football uses the BFF under /american-football/*.
 */

export const queryKeys = {
  league: (leagueId: string) => ['league', leagueId] as const,
  seasons: (leagueId: string) => ['seasons', leagueId] as const,
  teams: (leagueId: string, seasonYear?: number | null) =>
    ['teams', leagueId, { season: seasonYear ?? null }] as const,
  matches: (leagueId: string, seasonYear: number) =>
    ['matches', leagueId, seasonYear] as const,
  standings: (leagueId: string, seasonYear: number) =>
    ['standings', leagueId, seasonYear] as const,
  team: (teamId: string) => ['team', teamId] as const,
  apiPath: (path: string) => ['api', path] as const,

  af: {
    leagues: (query: Record<string, unknown> = {}) => ['af', 'leagues', query] as const,
    seasons: (leagueId: string) => ['af', 'seasons', leagueId] as const,
    teams: (leagueId: string, season: number | string) =>
      ['af', 'teams', leagueId, season] as const,
    games: (leagueId: string, season: number | string) =>
      ['af', 'games', leagueId, season] as const,
    game: (gameId: string) => ['af', 'game', gameId] as const,
    standings: (leagueId: string, season: number | string) =>
      ['af', 'standings', leagueId, season] as const,
    timezones: () => ['af', 'timezones'] as const,
  },
};
