'use client';

import { useAmericanFootballContenidoFromQueries } from '@/lib/query/american-football/hooks';

export type {
  AmericanFootballContenidoData,
  ContenidoSeasonItem,
  ContenidoStandingItem,
  ContenidoTeamItem,
} from '@/lib/use-american-football-contenido-types';

export function useAmericanFootballContenido(_refreshKey = 0) {
  const data = useAmericanFootballContenidoFromQueries();
  return {
    leagues: data.leagues,
    seasons: data.seasons,
    teams: data.teams,
    games: data.games,
    standings: data.standings,
    timezones: data.timezones,
    loading: data.loading,
    error: data.error,
    reload: data.reload,
  };
}
