import type { Team, Venue } from './types';

export interface VenueEditPatch {
  name?: string | null;
  city?: string | null;
  capacity?: number | null;
}

export interface TeamEditPatch {
  name?: string | null;
  code?: string | null;
  country?: string | null;
  logo?: string | null;
  altName?: string | null;
  altLogo?: string | null;
  city?: string | null;
  conference?: string | null;
  division?: string | null;
  venue?: VenueEditPatch | null;
}

const OVERRIDE_KEY = 'deportix.teamOverrides.v1';

export function readTeamOverrides(): Record<string, TeamEditPatch> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(OVERRIDE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, TeamEditPatch>)
      : {};
  } catch {
    return {};
  }
}

export function writeTeamOverrides(overrides: Record<string, TeamEditPatch>): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(OVERRIDE_KEY, JSON.stringify(overrides));
}

export function saveTeamOverride(teamId: string, patch: TeamEditPatch): void {
  const existing = readTeamOverrides();
  writeTeamOverrides({ ...existing, [teamId]: patch });
}

function mergeVenue(base: Venue | null, patch?: VenueEditPatch | null): Venue | null {
  if (patch === null) return null;
  if (!patch) return base;
  return {
    id: base?.id ?? null,
    name: patch.name !== undefined ? patch.name : (base?.name ?? null),
    city: patch.city !== undefined ? patch.city : (base?.city ?? null),
    capacity: patch.capacity !== undefined ? patch.capacity : (base?.capacity ?? null),
  };
}

export function applyTeamPatch(team: Team, patch?: TeamEditPatch): Team {
  if (!patch) return team;

  return {
    ...team,
    name: patch.name !== undefined ? patch.name : team.name,
    code: patch.code !== undefined ? patch.code : team.code,
    country: patch.country !== undefined ? patch.country : team.country,
    logo: patch.logo !== undefined ? patch.logo : team.logo,
    altName: patch.altName !== undefined ? patch.altName : team.altName,
    altLogo: patch.altLogo !== undefined ? patch.altLogo : team.altLogo,
    city: patch.city !== undefined ? patch.city : team.city,
    conference: patch.conference !== undefined ? patch.conference : team.conference,
    division: patch.division !== undefined ? patch.division : team.division,
    venue: mergeVenue(team.venue, patch.venue),
    updatedAt: new Date().toISOString(),
  };
}

export function applyTeamOverrides(teams: Team[], overrides: Record<string, TeamEditPatch>): Team[] {
  return teams.map((team) => applyTeamPatch(team, overrides[team.id]));
}

export function hasTeamOverride(overrides: Record<string, TeamEditPatch>, teamId: string): boolean {
  return teamId in overrides;
}
