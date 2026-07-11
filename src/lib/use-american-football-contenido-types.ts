import type {
  AmericanFootballGameItem,
  AmericanFootballLeagueItem,
  AmericanFootballStandingItem,
  AmericanFootballTeamItem,
} from '@/lib/american-football-bff-types';

export interface ContenidoSeasonItem {
  leagueId: string;
  leagueName: string;
  year: number;
}

export interface ContenidoTeamItem {
  team: AmericanFootballTeamItem;
  leagueId: string;
  leagueName: string;
  season: number;
}

export interface ContenidoStandingItem {
  standing: AmericanFootballStandingItem;
  leagueId: string;
  leagueName: string;
  season: number;
}

export interface AmericanFootballContenidoData {
  leagues: AmericanFootballLeagueItem[];
  seasons: ContenidoSeasonItem[];
  teams: ContenidoTeamItem[];
  games: AmericanFootballGameItem[];
  standings: ContenidoStandingItem[];
  timezones: string[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}
