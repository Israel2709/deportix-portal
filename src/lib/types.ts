/** Response/DTO types mirroring the Deportix API public contract (`/v1`). */

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

export interface Meta {
  apiVersion: string;
  updatedAt: string;
  pagination?: Pagination;
}

export interface ApiCollection<T> {
  data: T[];
  meta: Meta;
}

export interface ApiResource<T> {
  data: T;
  meta: Meta;
}

export interface ApiErrorBody {
  error: { code: string; message: string; requestId: string; details?: unknown };
}

export interface Coverage {
  teams: boolean;
  matches: boolean;
  standings: boolean;
  statistics: boolean;
}

export interface Sport {
  id: string;
  slug: string | null;
  name: string | null;
  logo?: string | null;
}

export interface SportSummary extends Sport {
  leagueCount: number;
  coverage: Coverage;
}

export interface League {
  id: string;
  externalId: string | null;
  name: string | null;
  type: string | null;
  sport: string | null;
  country: string | null;
  logo: string | null;
  updatedAt: string | null;
}

export interface LeagueCoverage {
  id: string;
  externalId: string | null;
  name: string | null;
  sport: string | null;
  availableSeasons: number[];
  coverage: Coverage;
  updatedAt: string | null;
}

export interface Season {
  id: string;
  leagueId: string | null;
  year: number | null;
  startDate: string | null;
  endDate: string | null;
  current: boolean;
  externalId: string | null;
}

export interface Venue {
  id: number | null;
  name: string | null;
  city: string | null;
  capacity: number | null;
}

export interface Team {
  id: string;
  externalId: string | null;
  sport: string | null;
  leagueId: string | null;
  name: string | null;
  code: string | null;
  country: string | null;
  logo: string | null;
  altName: string | null;
  altLogo: string | null;
  city: string | null;
  conference: string | null;
  division: string | null;
  venue: Venue | null;
  updatedAt: string | null;
}

export interface MatchSide {
  teamId: string | null;
  name: string | null;
  logo: string | null;
  score: number | null;
}

export interface Match {
  id: string;
  externalId: string | null;
  sport: string | null;
  leagueId: string | null;
  seasonId: string | null;
  date: string | null;
  status: string | null;
  round: string | null;
  venue: string | null;
  home: MatchSide;
  away: MatchSide;
  updatedAt: string | null;
}

export interface Standing {
  teamId: string | null;
  teamName: string | null;
  points: number | null;
  played: number | null;
  wins: number | null;
  draws: number | null;
  losses: number | null;
  ties: number | null;
}

export interface DataStatus {
  sports: SportSummary[];
  leagues: LeagueCoverage[];
}

export interface Health {
  status: string;
  apiVersion: string;
  dataSourceConfigured: boolean;
  timestamp: string;
}
