/** Envelope BFF Formula 1 (mismo shape api-sports que American Football). */
export interface Formula1Envelope<T> {
  get: string;
  parameters: Record<string, string> | unknown[];
  errors: unknown[] | Record<string, string>;
  results: number;
  paging?: { current: number; total: number };
  response: T[];
}

export interface Formula1TeamRef {
  id: string;
  name: string;
  logo?: string | null;
}

export interface Formula1DriverRef {
  id: string;
  name: string;
  number?: number | null;
}

export interface Formula1CompetitionRef {
  id: string;
  name: string;
}

export interface Formula1CircuitRef {
  id: string;
  name: string;
  image?: string | null;
  country?: string | null;
}

export interface Formula1CompetitionCreate {
  name: string;
}

export interface Formula1CompetitionItem extends Formula1CompetitionCreate {
  id: string;
}

export interface Formula1CircuitCreate {
  name: string;
  image?: string | null;
  country?: string | null;
}

export interface Formula1CircuitItem extends Formula1CircuitCreate {
  id: string;
}

export interface Formula1TeamCreate {
  name: string;
  logo?: string | null;
}

export interface Formula1TeamItem extends Formula1TeamCreate {
  id: string;
}

export interface Formula1DriverCreate {
  name: string;
  number?: number | null;
  teamId?: string | null;
}

export interface Formula1DriverItem {
  id: string;
  name: string;
  number?: number | null;
  team?: Formula1TeamRef | null;
}

export interface Formula1RaceLaps {
  current?: number | null;
  total?: number | null;
}

export interface Formula1RaceCreate {
  competitionId: string;
  circuitId: string;
  season: number;
  type: string;
  date: string;
  status: string;
  timezone?: string | null;
  distance?: string | null;
  laps?: Formula1RaceLaps;
}

export interface Formula1RaceItem {
  id: string;
  competition: Formula1CompetitionRef;
  circuit: Formula1CircuitRef;
  season: number;
  type: string;
  laps?: Formula1RaceLaps;
  distance?: string | null;
  timezone?: string | null;
  date: string;
  status: string;
}

export interface Formula1DriverRankingCreate {
  driverId: string;
  season: number;
  position: number;
  points?: number | null;
  wins?: number | null;
  behind?: number | null;
}

export interface Formula1DriverRankingItem {
  position: number;
  points?: number | null;
  wins?: number | null;
  behind?: number | null;
  season: number;
  driver: Formula1DriverRef;
  team?: Formula1TeamRef | null;
}

export interface Formula1TeamRankingCreate {
  teamId: string;
  season: number;
  position: number;
  points?: number | null;
}

export interface Formula1TeamRankingItem {
  position: number;
  points?: number | null;
  season: number;
  team: Formula1TeamRef;
}

export interface Formula1RaceRankingCreate {
  raceId: string;
  driverId: string;
  position: number;
  time?: string | null;
  laps?: number | null;
  grid?: string | null;
  pits?: number | null;
  gap?: string | null;
}

export interface Formula1RaceRankingItem {
  position: number;
  time?: string | null;
  laps?: number | null;
  grid?: string | null;
  pits?: number | null;
  gap?: string | null;
  driver: Formula1DriverRef;
  team?: Formula1TeamRef | null;
}
