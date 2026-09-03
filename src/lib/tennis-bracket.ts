import type {
  TennisMatchItem,
  TennisPlayerRef,
  TennisRoundItem,
} from './tennis-bff-types';

/** Base vertical unit (px) for first-round match slots including gap. */
export const TENNIS_BRACKET_SLOT_UNIT_PX = 88;

export interface TennisBracketSlot {
  match: TennisMatchItem;
  /** 0-based index within the round after sorting by bracketPosition. */
  index: number;
  /** Top offset in px for geometric alignment with the next round. */
  offsetTopPx: number;
}

export interface TennisBracketColumn {
  round: TennisRoundItem | null;
  roundNumber: number;
  roundName: string;
  /** Column index starting at 0 (first round). */
  columnIndex: number;
  slots: TennisBracketSlot[];
  /** Height of one slot cell in this column (grows by powers of 2). */
  slotUnitPx: number;
}

export interface TennisBracketModel {
  columns: TennisBracketColumn[];
  champion: TennisPlayerRef | null;
  finalMatch: TennisMatchItem | null;
  totalHeightPx: number;
}

export function tennisCompetitorLabel(
  player: TennisPlayerRef | null | undefined,
  entryType?: string | null,
): string {
  if (entryType === 'bye' && !player) return 'BYE';
  if (!player) return 'TBD';
  return player.displayName || player.fullName || 'TBD';
}

export function tennisMatchWinner(match: TennisMatchItem): TennisPlayerRef | null {
  const winnerId = match.result?.winnerId;
  if (!winnerId) return null;
  if (match.competitor1?.id === winnerId) return match.competitor1;
  if (match.competitor2?.id === winnerId) return match.competitor2;
  return null;
}

/** Infer next-round bracket position for single-elim (1-based positions). */
export function inferNextBracketPosition(bracketPosition: number): number {
  return Math.ceil(bracketPosition / 2);
}

/**
 * Build L→R bracket columns from rounds + matches.
 * Layout uses geometric spacing so parents/children align without requiring winnerToMatchId.
 */
export function buildTennisBracketColumns(
  rounds: TennisRoundItem[],
  matches: TennisMatchItem[],
): TennisBracketModel {
  const roundsSorted = [...rounds].sort((a, b) => a.roundNumber - b.roundNumber);
  const matchesByRound = new Map<number, TennisMatchItem[]>();

  for (const match of matches) {
    const list = matchesByRound.get(match.roundNumber) ?? [];
    list.push(match);
    matchesByRound.set(match.roundNumber, list);
  }

  for (const list of matchesByRound.values()) {
    list.sort((a, b) => a.bracketPosition - b.bracketPosition);
  }

  const roundNumbers = [
    ...new Set([
      ...roundsSorted.map((round) => round.roundNumber),
      ...matchesByRound.keys(),
    ]),
  ].sort((a, b) => a - b);

  const columns: TennisBracketColumn[] = roundNumbers.map((roundNumber, columnIndex) => {
    const round = roundsSorted.find((item) => item.roundNumber === roundNumber) ?? null;
    const roundMatches = matchesByRound.get(roundNumber) ?? [];
    const slotUnitPx = TENNIS_BRACKET_SLOT_UNIT_PX * 2 ** columnIndex;
    const slots: TennisBracketSlot[] = roundMatches.map((match, index) => ({
      match,
      index,
      offsetTopPx: index * slotUnitPx,
    }));

    return {
      round,
      roundNumber,
      roundName: round?.name ?? matchRoundFallbackName(roundMatches, roundNumber),
      columnIndex,
      slots,
      slotUnitPx,
    };
  });

  const lastColumn = columns[columns.length - 1];
  const finalMatch =
    lastColumn?.slots.length === 1
      ? lastColumn.slots[0]!.match
      : lastColumn?.slots.find((slot) => !slot.match.bracket.winnerToMatchId)?.match ??
        lastColumn?.slots[0]?.match ??
        null;

  const champion = finalMatch ? tennisMatchWinner(finalMatch) : null;

  const totalHeightPx = columns.reduce((max, column) => {
    if (column.slots.length === 0) return max;
    const last = column.slots[column.slots.length - 1]!;
    return Math.max(max, last.offsetTopPx + column.slotUnitPx);
  }, TENNIS_BRACKET_SLOT_UNIT_PX);

  return { columns, champion, finalMatch, totalHeightPx };
}

function matchRoundFallbackName(matches: TennisMatchItem[], roundNumber: number): string {
  return matches[0]?.roundName?.trim() || `Ronda ${roundNumber}`;
}
