import { describe, expect, it } from 'vitest';
import {
  buildTennisBracketColumns,
  inferNextBracketPosition,
  tennisCompetitorLabel,
  tennisMatchWinner,
  TENNIS_BRACKET_SLOT_UNIT_PX,
} from '@/lib/tennis-bracket';
import type { TennisMatchItem, TennisRoundItem } from '@/lib/tennis-bff-types';

function round(partial: Partial<TennisRoundItem> & Pick<TennisRoundItem, 'id' | 'roundNumber' | 'name'>): TennisRoundItem {
  return {
    tournamentId: 't-1',
    status: 'pending',
    published: false,
    ...partial,
  };
}

function match(
  partial: Partial<TennisMatchItem> &
    Pick<TennisMatchItem, 'id' | 'roundNumber' | 'bracketPosition'>,
): TennisMatchItem {
  return {
    tournamentId: 't-1',
    roundId: `r-${partial.roundNumber}`,
    competitor1: null,
    competitor2: null,
    status: 'scheduled',
    competitorChanged: false,
    bracket: {
      competitor1SourceMatchId: null,
      competitor2SourceMatchId: null,
      winnerToMatchId: null,
      winnerToPosition: null,
    },
    published: false,
    ...partial,
  };
}

describe('inferNextBracketPosition', () => {
  it('maps pairs into the next round', () => {
    expect(inferNextBracketPosition(1)).toBe(1);
    expect(inferNextBracketPosition(2)).toBe(1);
    expect(inferNextBracketPosition(3)).toBe(2);
    expect(inferNextBracketPosition(4)).toBe(2);
  });
});

describe('tennisCompetitorLabel', () => {
  it('uses TBD, BYE and displayName', () => {
    expect(tennisCompetitorLabel(null)).toBe('TBD');
    expect(tennisCompetitorLabel(null, 'bye')).toBe('BYE');
    expect(
      tennisCompetitorLabel({ id: 'p1', fullName: 'Carlos Alcaraz', displayName: 'Alcaraz', country: { code: 'ES' } }),
    ).toBe('Alcaraz');
  });
});

describe('buildTennisBracketColumns', () => {
  const rounds = [
    round({ id: 'r1', roundNumber: 1, name: 'Cuartos' }),
    round({ id: 'r2', roundNumber: 2, name: 'Semis' }),
    round({ id: 'r3', roundNumber: 3, name: 'Final' }),
  ];

  const matches = [
    match({
      id: 'm1',
      roundNumber: 1,
      bracketPosition: 1,
      competitor1: { id: 'a', fullName: 'A', displayName: 'A', country: { code: 'ES' } },
      competitor2: { id: 'b', fullName: 'B', displayName: 'B', country: { code: 'US' } },
    }),
    match({ id: 'm2', roundNumber: 1, bracketPosition: 2 }),
    match({ id: 'm3', roundNumber: 1, bracketPosition: 3 }),
    match({ id: 'm4', roundNumber: 1, bracketPosition: 4 }),
    match({ id: 'm5', roundNumber: 2, bracketPosition: 1 }),
    match({ id: 'm6', roundNumber: 2, bracketPosition: 2 }),
    match({
      id: 'm7',
      roundNumber: 3,
      bracketPosition: 1,
      competitor1: { id: 'a', fullName: 'A', displayName: 'A', country: { code: 'ES' } },
      result: { winnerId: 'a', finalScoreDisplay: '2-0' },
    }),
  ];

  it('builds columns ordered by round with geometric spacing', () => {
    const model = buildTennisBracketColumns(rounds, matches);
    expect(model.columns).toHaveLength(3);
    expect(model.columns[0]!.slots).toHaveLength(4);
    expect(model.columns[1]!.slots).toHaveLength(2);
    expect(model.columns[2]!.slots).toHaveLength(1);
    expect(model.columns[0]!.slotUnitPx).toBe(TENNIS_BRACKET_SLOT_UNIT_PX);
    expect(model.columns[1]!.slotUnitPx).toBe(TENNIS_BRACKET_SLOT_UNIT_PX * 2);
    expect(model.columns[2]!.slotUnitPx).toBe(TENNIS_BRACKET_SLOT_UNIT_PX * 4);
    expect(model.columns[0]!.slots[1]!.offsetTopPx).toBe(TENNIS_BRACKET_SLOT_UNIT_PX);
    expect(model.columns[1]!.slots[1]!.offsetTopPx).toBe(TENNIS_BRACKET_SLOT_UNIT_PX * 2);
  });

  it('resolves champion from the final match result', () => {
    const model = buildTennisBracketColumns(rounds, matches);
    expect(model.finalMatch?.id).toBe('m7');
    expect(tennisMatchWinner(model.finalMatch!)?.displayName).toBe('A');
    expect(model.champion?.displayName).toBe('A');
  });

  it('still builds columns when rounds are missing but matches exist', () => {
    const model = buildTennisBracketColumns([], matches);
    expect(model.columns.map((column) => column.roundNumber)).toEqual([1, 2, 3]);
    expect(model.columns[0]!.roundName).toBe('Ronda 1');
  });
});
