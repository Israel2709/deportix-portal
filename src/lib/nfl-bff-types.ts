/** Envelope genérico BFF NFL (api-sports). */
export interface NflEnvelope<T> {
  get: string;
  parameters: Record<string, string> | unknown[];
  errors: unknown[] | Record<string, string>;
  results: number;
  paging?: { current: number; total: number };
  response: T[];
}

export interface NflCountryItem {
  name: string;
  code?: string | null;
  flag?: string | null;
}

export interface NflLeagueSeasonCoverage {
  games?: {
    events?: boolean;
    statisitcs?: { teams?: boolean; players?: boolean };
  };
  statistics?: { season?: { players?: boolean } };
  players?: boolean;
  injuries?: boolean;
  standings?: boolean;
}

export interface NflLeagueSeason {
  year: number;
  start?: string | null;
  end?: string | null;
  current: boolean;
  coverage?: NflLeagueSeasonCoverage;
}

export interface NflLeagueItem {
  league: {
    id: number | string;
    name: string;
    type?: string | null;
    logo?: string | null;
  };
  country: {
    name: string;
    code?: string | null;
    flag?: string | null;
  };
  seasons: NflLeagueSeason[];
}

export interface NflTeamItem {
  id: number | string;
  name: string;
  logo?: string | null;
}

export interface NflGameScoreSide {
  quarter_1?: number | null;
  quarter_2?: number | null;
  quarter_3?: number | null;
  quarter_4?: number | null;
  overtime?: number | null;
  total?: number | null;
}

export interface NflGameItem {
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
    home?: NflGameScoreSide;
    away?: NflGameScoreSide;
  };
}

export interface NflStandingItem {
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

export interface NflTimezonePostBody {
  timezone: string;
}

export interface NflTimezonePatchBody {
  timezone: string;
  newTimezone: string;
}

export interface NflSeasonBody {
  year: number;
}
