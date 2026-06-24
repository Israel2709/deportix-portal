import type { Team } from './types';

export interface LeagueVenueOption {
  name: string;
  city: string | null;
}

/** Sedes únicas de la liga, derivadas del catálogo de equipos (no hay endpoint de venues). */
export function venuesFromTeams(teams: Team[]): LeagueVenueOption[] {
  const byName = new Map<string, LeagueVenueOption>();

  for (const team of teams) {
    const name = team.venue?.name?.trim();
    if (!name) continue;

    if (!byName.has(name)) {
      byName.set(name, { name, city: team.venue?.city ?? null });
    }
  }

  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export function venueNameForTeam(teams: Team[], teamId: string): string | null {
  const team = teams.find((entry) => entry.id === teamId);
  return team?.venue?.name?.trim() ?? null;
}

export function formatVenueOption(venue: LeagueVenueOption): string {
  return venue.city ? `${venue.name} (${venue.city})` : venue.name;
}
