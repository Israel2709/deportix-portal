import { describe, expect, it } from 'vitest';
import {
  competitionsForCountry,
  countriesFromRaces,
  racesForBrowseSelection,
  seasonsForCompetitionInCountry,
} from '@/lib/formula-1-browse';
import type { Formula1RaceItem } from '@/lib/formula-1-bff-types';

const COMP_A = '11111111-1111-4111-8111-111111111111';
const COMP_B = '22222222-2222-4222-8222-222222222222';

function race(partial: Partial<Formula1RaceItem> & Pick<Formula1RaceItem, 'id'>): Formula1RaceItem {
  return {
    competition: { id: COMP_A, name: 'Monaco GP' },
    circuit: { id: 'c1', name: 'Monaco', country: 'Monaco' },
    season: 2024,
    type: 'Race',
    date: '2024-05-26T14:00:00.000Z',
    status: 'Completed',
    ...partial,
  };
}

const SAMPLE_RACES: Formula1RaceItem[] = [
  race({ id: 'r1' }),
  race({
    id: 'r2',
    type: 'Qualifying',
    date: '2024-05-25T14:00:00.000Z',
  }),
  race({
    id: 'r3',
    competition: { id: COMP_B, name: 'Italian GP' },
    circuit: { id: 'c2', name: 'Monza', country: 'Italy' },
    season: 2024,
    date: '2024-09-01T14:00:00.000Z',
  }),
  race({
    id: 'r4',
    competition: { id: COMP_A, name: 'Monaco GP' },
    circuit: { id: 'c1', name: 'Monaco', country: 'Monaco' },
    season: 2023,
    date: '2023-05-28T14:00:00.000Z',
  }),
];

describe('formula-1 browse helpers', () => {
  it('lists host countries from races', () => {
    expect(countriesFromRaces(SAMPLE_RACES)).toEqual(['Italy', 'Monaco']);
  });

  it('lists competitions for a country', () => {
    expect(competitionsForCountry(SAMPLE_RACES, 'Monaco')).toEqual([
      { id: COMP_A, name: 'Monaco GP' },
    ]);
    expect(competitionsForCountry(SAMPLE_RACES, 'Italy')).toEqual([
      { id: COMP_B, name: 'Italian GP' },
    ]);
  });

  it('lists seasons for a competition in a country', () => {
    expect(seasonsForCompetitionInCountry(SAMPLE_RACES, 'Monaco', COMP_A)).toEqual([2024, 2023]);
  });

  it('lists race sessions for country + competition + season', () => {
    const rows = racesForBrowseSelection(SAMPLE_RACES, 'Monaco', COMP_A, 2024);
    expect(rows.map((item) => item.id)).toEqual(['r2', 'r1']);
  });
});
