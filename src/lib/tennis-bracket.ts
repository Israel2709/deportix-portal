import type {
  TennisMatchItem,
  TennisPlayerRef,
  TennisRoundItem,
} from './tennis-bff-types';

/** Base vertical unit (px) for one first-round match row. */
export const TENNIS_BRACKET_SLOT_UNIT_PX = 88;

export interface TennisBracketSlot {
  match: TennisMatchItem;
  /** 0-based index within the round after sorting by bracketPosition. */
  index: number;
  /** Top offset in px within the single linear draw. */
  offsetTopPx: number;
}

export interface TennisBracketColumn {
  round: TennisRoundItem | null;
  roundNumber: number;
  roundName: string;
  /** Column index starting at 0 (opening round). */
  columnIndex: number;
  slots: TennisBracketSlot[];
  /** Vertical band height for one match in this column. */
  slotUnitPx: number;
}

export interface TennisBracketModel {
  columns: TennisBracketColumn[];
  champion: TennisPlayerRef | null;
  finalMatch: TennisMatchItem | null;
  /** Shared height of the whole linear Main Draw. */
  totalHeightPx: number;
  /** True when some round does not halve vs the previous (data anomaly). */
  hasIrregularProgression: boolean;
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
 * Build one L→R single-elimination draw.
 *
 * Opening round size sets the tree height. Each later round places its matches
 * evenly in that same height (winners feed the next round: N → N/2 → … → 1).
 * Spacing is NOT `2^columnIndex` alone — that stretched later rounds when data
 * incorrectly kept the same match count as the previous round.
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

  const matchCounts = roundNumbers.map(
    (roundNumber) => matchesByRound.get(roundNumber)?.length ?? 0,
  );
  const openingMatchCount = Math.max(1, ...matchCounts, 0);
  const totalHeightPx = openingMatchCount * TENNIS_BRACKET_SLOT_UNIT_PX;

  let hasIrregularProgression = false;
  for (let i = 1; i < matchCounts.length; i++) {
    const prev = matchCounts[i - 1] ?? 0;
    const curr = matchCounts[i] ?? 0;
    if (prev > 0 && curr > 0 && curr !== Math.ceil(prev / 2) && curr >= prev) {
      hasIrregularProgression = true;
      break;
    }
  }

  const columns: TennisBracketColumn[] = roundNumbers.map((roundNumber, columnIndex) => {
    const round = roundsSorted.find((item) => item.roundNumber === roundNumber) ?? null;
    const roundMatches = matchesByRound.get(roundNumber) ?? [];
    const n = Math.max(roundMatches.length, 1);
    const slotUnitPx = totalHeightPx / n;
    const slots: TennisBracketSlot[] = roundMatches.map((match, index) => ({
      match,
      index,
      // Prefer bracketPosition when it fits the column size; else fall back to index.
      offsetTopPx: offsetForMatch(match.bracketPosition, index, n, slotUnitPx),
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

  return {
    columns,
    champion,
    finalMatch,
    totalHeightPx,
    hasIrregularProgression,
  };
}

function offsetForMatch(
  bracketPosition: number,
  index: number,
  columnSize: number,
  slotUnitPx: number,
): number {
  const pos = Number.isFinite(bracketPosition) && bracketPosition >= 1 ? bracketPosition : index + 1;
  // Only trust bracketPosition when it lands inside this column's expected range.
  const usePos = pos <= columnSize ? pos : index + 1;
  return (usePos - 1) * slotUnitPx;
}

function matchRoundFallbackName(matches: TennisMatchItem[], roundNumber: number): string {
  return matches[0]?.roundName?.trim() || `Ronda ${roundNumber}`;
}
