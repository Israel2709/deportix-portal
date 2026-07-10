export type LigaMxTab = 'contenido' | 'calendario';

export function parseLigaMxTab(value: string | null | undefined): LigaMxTab {
  if (value === 'calendario') return 'calendario';
  return 'contenido';
}

export function ligaMxTabPath(tab: LigaMxTab): string {
  if (tab === 'contenido') return '/liga-mx';
  return `/liga-mx?tab=${tab}`;
}

export function truncateRecordId(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 12) return trimmed;
  return `${trimmed.slice(0, 8)}…`;
}

export function ligaMxTeamDetailPath(teamId: string): string {
  return `/liga-mx/equipos/${encodeURIComponent(teamId)}`;
}

export function ligaMxMatchDetailPath(
  matchId: string,
  context?: { seasonId?: string; year?: string | number },
): string {
  const base = `/liga-mx/partidos/${encodeURIComponent(matchId)}`;
  if (!context?.seasonId && context?.year == null) return base;
  const qs = new URLSearchParams();
  if (context.seasonId) qs.set('seasonId', context.seasonId);
  if (context.year != null) qs.set('year', String(context.year));
  return `${base}?${qs}`;
}

export function ligaMxSeasonDetailPath(seasonId: string): string {
  return `/liga-mx/temporadas/${encodeURIComponent(seasonId)}`;
}

export function ligaMxStandingDetailPath(
  teamId: string,
  context: { season: string | number },
): string {
  const qs = new URLSearchParams({ season: String(context.season) });
  return `/liga-mx/clasificacion/${encodeURIComponent(teamId)}?${qs}`;
}

export function ligaMxTournamentDetailPath(year: string | number, name: string): string {
  return `/liga-mx/torneos/${encodeURIComponent(String(year))}/${encodeURIComponent(name)}`;
}
