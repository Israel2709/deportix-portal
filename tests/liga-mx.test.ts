import { describe, expect, it } from 'vitest';
import { resolveLigaMxTournaments, tournamentFromRound } from '@/lib/liga-mx';

describe('liga-mx helpers', () => {
  it('parses tournament names from round labels', () => {
    expect(tournamentFromRound('Clausura - 16')).toBe('Clausura');
    expect(tournamentFromRound('Apertura - 1')).toBe('Apertura');
    expect(tournamentFromRound('Regular Season - 5')).toBeNull();
  });

  it('falls back to Apertura and Clausura when there is no match data', () => {
    expect(resolveLigaMxTournaments([])).toEqual(['Apertura', 'Clausura']);
  });

  it('derives tournaments from match rounds when available', () => {
    expect(
      resolveLigaMxTournaments([
        { round: 'Clausura - 16' },
        { round: 'Apertura - 3' },
      ] as never),
    ).toEqual(['Apertura', 'Clausura']);
  });
});
