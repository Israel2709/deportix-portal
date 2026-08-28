/** Envelope BFF Tennis (mismo shape api-sports que Formula 1 / American Football). */
export interface TennisEnvelope<T> {
  get: string;
  parameters: Record<string, string> | unknown[];
  errors: unknown[] | Record<string, string>;
  results: number;
  paging?: { current: number; total: number };
  response: T[];
}

export type TennisCategory = 'grand_slam' | 'atp_1000' | 'wta_1000';
export type TennisGender = 'male' | 'female';
export type TennisEventType = 'singles';
export type TennisTournamentStatus = 'upcoming' | 'active' | 'finished' | 'cancelled';
export type TennisRoundStatus = 'pending' | 'active' | 'finished';
export type TennisMatchStatus =
  | 'pending_competitors'
  | 'scheduled'
  | 'live'
  | 'suspended'
  | 'postponed'
  | 'finished'
  | 'retirement'
  | 'walkover'
  | 'disqualification'
  | 'cancelled';
export type TennisEntryType =
  | 'direct'
  | 'qualifier'
  | 'wildcard'
  | 'lucky_loser'
  | 'protected_ranking'
  | 'bye'
  | 'other';
export type TennisWinnerToPosition = 'competitor_1' | 'competitor_2';
export type TennisResultType = 'normal' | 'retirement' | 'walkover' | 'disqualification';
export type TennisPublishedFilter = 'true' | 'false' | 'all';

export interface TennisCountryRef {
  code: string;
  name?: string | null;
  flag?: string | null;
}

export interface TennisPlayerRef {
  id: string;
  fullName: string;
  displayName: string;
  photoUrl?: string | null;
  country: TennisCountryRef;
}

export interface TennisPlayerCreate {
  fullName: string;
  displayName: string;
  photoUrl?: string | null;
  countryCode: string;
  published?: boolean;
}

export interface TennisPlayerItem extends Omit<TennisPlayerCreate, 'countryCode' | 'published'> {
  id: string;
  country: TennisCountryRef;
  published: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface TennisTournamentCreate {
  name: string;
  shortName?: string | null;
  category: TennisCategory;
  gender: TennisGender;
  eventType?: TennisEventType;
  countryCode: string;
  city?: string | null;
  imageUrl?: string | null;
  startDate: string;
  endDate: string;
  year: number;
  status?: TennisTournamentStatus;
}

export interface TennisTournamentItem {
  id: string;
  name: string;
  shortName?: string | null;
  category: TennisCategory;
  gender: TennisGender;
  eventType: TennisEventType;
  country: TennisCountryRef;
  city?: string | null;
  imageUrl?: string | null;
  startDate: string;
  endDate: string;
  year: number;
  status: TennisTournamentStatus;
  published: boolean;
  publishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface TennisRoundCreate {
  tournamentId: string;
  roundNumber: number;
  name: string;
  status?: TennisRoundStatus;
  startDate?: string | null;
  endDate?: string | null;
}

export interface TennisRoundNestedCreate {
  roundNumber: number;
  name: string;
  status?: TennisRoundStatus;
  startDate?: string | null;
  endDate?: string | null;
}

export interface TennisRoundItem {
  id: string;
  tournamentId: string;
  roundNumber: number;
  name: string;
  status: TennisRoundStatus;
  startDate?: string | null;
  endDate?: string | null;
  published: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface TennisEntryCreate {
  tournamentId: string;
  playerId: string;
  seed?: number | null;
  ranking?: number | null;
  entryType?: TennisEntryType | null;
}

export interface TennisEntryNestedCreate {
  playerId: string;
  seed?: number | null;
  ranking?: number | null;
  entryType?: TennisEntryType | null;
}

export interface TennisEntryItem {
  id: string;
  tournamentId: string;
  player: TennisPlayerItem;
  seed?: number | null;
  ranking?: number | null;
  entryType?: TennisEntryType | null;
  published: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface TennisMatchBracket {
  competitor1SourceMatchId: string | null;
  competitor2SourceMatchId: string | null;
  winnerToMatchId: string | null;
  winnerToPosition: TennisWinnerToPosition | null;
  competitor1EntryType?: TennisEntryType | null;
  competitor2EntryType?: TennisEntryType | null;
}

export interface TennisSetScore {
  set: number;
  competitor1: number;
  competitor2: number;
}

export interface TennisMatchResult {
  winnerId?: string | null;
  loserId?: string | null;
  resultType?: TennisResultType | null;
  setsPlayer1?: number | null;
  setsPlayer2?: number | null;
  setScores?: TennisSetScore[] | null;
  finalScoreDisplay?: string | null;
}

export interface TennisMatchCreate {
  tournamentId: string;
  roundId: string;
  bracketPosition: number;
  competitor1Id?: string | null;
  competitor2Id?: string | null;
  scheduledAt?: string | null;
  timezone?: string | null;
  court?: string | null;
  status?: TennisMatchStatus;
  competitor1SourceMatchId?: string | null;
  competitor2SourceMatchId?: string | null;
  winnerToMatchId?: string | null;
  winnerToPosition?: TennisWinnerToPosition | null;
  competitor1EntryType?: TennisEntryType | null;
  competitor2EntryType?: TennisEntryType | null;
}

export type TennisMatchUpdate = TennisMatchNestedCreate;

export interface TennisMatchNestedCreate {
  roundId?: string;
  bracketPosition?: number;
  competitor1Id?: string | null;
  competitor2Id?: string | null;
  scheduledAt?: string | null;
  timezone?: string | null;
  court?: string | null;
  status?: TennisMatchStatus;
  competitor1SourceMatchId?: string | null;
  competitor2SourceMatchId?: string | null;
  winnerToMatchId?: string | null;
  winnerToPosition?: TennisWinnerToPosition | null;
  competitor1EntryType?: TennisEntryType | null;
  competitor2EntryType?: TennisEntryType | null;
}

export interface TennisMatchItem {
  id: string;
  tournamentId: string;
  roundId: string;
  roundNumber: number;
  roundName?: string | null;
  bracketPosition: number;
  competitor1: TennisPlayerRef | null;
  competitor2: TennisPlayerRef | null;
  scheduledAt?: string | null;
  timezone?: string | null;
  court?: string | null;
  status: TennisMatchStatus;
  startedAt?: string | null;
  endedAt?: string | null;
  competitorChanged: boolean;
  bracket: TennisMatchBracket;
  result?: TennisMatchResult | null;
  published: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface TennisMatchResultBody {
  winnerId: string;
  loserId?: string;
  resultType: TennisResultType;
  setsPlayer1?: number | null;
  setsPlayer2?: number | null;
  setScores?: TennisSetScore[] | null;
  finalScoreDisplay?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
}
