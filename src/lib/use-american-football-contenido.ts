'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getAmericanFootballGames,
  getAmericanFootballLeagues,
  getAmericanFootballSeasons,
  getAmericanFootballStandings,
  getAmericanFootballTeams,
  getAmericanFootballTimezones,
} from '@/lib/american-football-api';
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

export function useAmericanFootballContenido(refreshKey = 0): AmericanFootballContenidoData {
  const [listKey, setListKey] = useState(0);
  const [leagues, setLeagues] = useState<AmericanFootballLeagueItem[]>([]);
  const [seasons, setSeasons] = useState<ContenidoSeasonItem[]>([]);
  const [teams, setTeams] = useState<ContenidoTeamItem[]>([]);
  const [games, setGames] = useState<AmericanFootballGameItem[]>([]);
  const [standings, setStandings] = useState<ContenidoStandingItem[]>([]);
  const [timezones, setTimezones] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => setListKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [leaguesEnvelope, timezonesEnvelope] = await Promise.all([
          getAmericanFootballLeagues(),
          getAmericanFootballTimezones(),
        ]);
        if (cancelled) return;

        const loadedLeagues = leaguesEnvelope.response;
        const seasonItems: ContenidoSeasonItem[] = [];
        const teamItems: ContenidoTeamItem[] = [];
        const gameItems: AmericanFootballGameItem[] = [];
        const standingItems: ContenidoStandingItem[] = [];

        await Promise.all(
          loadedLeagues.map(async (leagueItem) => {
            const leagueId = leagueItem.league.id;
            const leagueName = leagueItem.league.name;

            try {
              const seasonsEnvelope = await getAmericanFootballSeasons(leagueId);
              for (const year of seasonsEnvelope.response) {
                seasonItems.push({ leagueId, leagueName, year });

                try {
                  const [teamsEnvelope, gamesEnvelope, standingsEnvelope] = await Promise.all([
                    getAmericanFootballTeams({ league: leagueId, season: year }),
                    getAmericanFootballGames({ league: leagueId, season: year }),
                    getAmericanFootballStandings({ league: leagueId, season: year }),
                  ]);

                  for (const team of teamsEnvelope.response) {
                    teamItems.push({ team, leagueId, leagueName, season: year });
                  }
                  gameItems.push(...gamesEnvelope.response);
                  for (const standing of standingsEnvelope.response) {
                    standingItems.push({ standing, leagueId, leagueName, season: year });
                  }
                } catch {
                  // Omitir temporada si falla una consulta dependiente.
                }
              }
            } catch {
              // Omitir liga si no hay temporadas.
            }
          }),
        );

        if (cancelled) return;

        setLeagues(loadedLeagues);
        setSeasons(
          seasonItems.sort(
            (left, right) => right.year - left.year || left.leagueName.localeCompare(right.leagueName),
          ),
        );
        setTeams(teamItems.sort((left, right) => left.team.name.localeCompare(right.team.name)));
        setGames(gameItems);
        setStandings(
          standingItems.sort(
            (left, right) => (left.standing.position ?? 999) - (right.standing.position ?? 999),
          ),
        );
        setTimezones(timezonesEnvelope.response);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el contenido');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [listKey, refreshKey]);

  return { leagues, seasons, teams, games, standings, timezones, loading, error, reload };
}
