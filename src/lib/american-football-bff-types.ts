/** Envelope genérico BFF American football (api-sports). */
export interface AmericanFootballEnvelope<T> {
  get: string;
  parameters: Record<string, string> | unknown[];
  errors: unknown[] | Record<string, string>;
  results: number;
  paging?: { current: number; total: number };
  response: T[];
}

/** @deprecated Use CatalogCountry from catalog-types — same global catalog for all sports. */
export type { CatalogCountry as AmericanFootballCountryItem } from './catalog-types';

export interface AmericanFootballLeagueSeasonCoverage {
  games?: {
    events?: boolean;
    statisitcs?: { teams?: boolean; players?: boolean };
  };
  statistics?: { season?: { players?: boolean } };
  players?: boolean;
  injuries?: boolean;
  standings?: boolean;
}

export interface AmericanFootballLeagueSeason {
  year: number;
  start?: string | null;
  end?: string | null;
  current: boolean;
  coverage?: AmericanFootballLeagueSeasonCoverage;
}

export interface AmericanFootballLeagueItem {
  league: {
    id: number | string;
    name: string;
    type?: string | null;
    logo?: string | null;
    altLogo?: string | null;
  };
  country: {
    name: string;
    code?: string | null;
    flag?: string | null;
  };
  seasons: AmericanFootballLeagueSeason[];
}

export interface AmericanFootballTeamItem {
  id: number | string;
  name: string;
  logo?: string | null;
  altLogo?: string | null;
}

export interface AmericanFootballGameScoreSide {
  quarter_1?: number | null;
  quarter_2?: number | null;
  quarter_3?: number | null;
  quarter_4?: number | null;
  overtime?: number | null;
  total?: number | null;
}

export interface AmericanFootballGameItem {
  game: {
    id: number | string;
    stage?: string | null;
    week?: string | null;
    date?: {
      timezone?: string | null;
      date?: string | null;
      time?: string | null;
      timestamp?: number | null;
    };
    venue?: { name?: string | null; city?: string | null };
    status?: { short?: string | null; long?: string | null; timer?: string | null };
  };
  league: {
    id: number | string;
    name: string;
    season?: number | string;
    logo?: string | null;
    country?: { name: string; code?: string | null; flag?: string | null };
  };
  teams: {
    home: { id: number | string; name: string; logo?: string | null };
    away: { id: number | string; name: string; logo?: string | null };
  };
  scores?: {
    home?: AmericanFootballGameScoreSide;
    away?: AmericanFootballGameScoreSide;
  };
}

export interface AmericanFootballStandingItem {
  league: {
    id: number | string;
    name: string;
    season?: number | string;
    logo?: string | null;
    country?: { name: string; code?: string | null; flag?: string | null };
  };
  conference?: string | null;
  division?: string | null;
  position?: number | null;
  team: { id: number | string; name: string; logo?: string | null };
  won?: number | null;
  lost?: number | null;
  ties?: number | null;
  points?: {
    for?: number | null;
    against?: number | null;
    difference?: number | null;
  };
  records?: {
    home?: string | null;
    road?: string | null;
    conference?: string | null;
    division?: string | null;
  };
  streak?: string | null;
  ncaa_conference?: {
    won?: number | null;
    lost?: number | null;
    points?: { for?: number | null; against?: number | null };
  };
}

export interface AmericanFootballTimezonePostBody {
  timezone: string;
}

export interface AmericanFootballTimezonePatchBody {
  timezone: string;
  newTimezone: string;
}

export interface AmericanFootballSeasonBody {
  year: number;
}
