const PAGE_SIZE = 100;

export function leagueMatchesPagePath(
  leagueId: string,
  seasonYear: number,
  page: number,
  pageSize = PAGE_SIZE,
): string {
  const id = encodeURIComponent(leagueId);
  return `/v1/leagues/${id}/matches?season=${seasonYear}&page=${page}&pageSize=${pageSize}`;
}
