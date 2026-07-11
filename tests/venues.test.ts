import { describe, expect, it } from 'vitest';
import {
  formatVenueOption,
  venueNameForTeam,
  venuesFromTeams,
} from '@/lib/venues';
import type { Team } from '@/lib/types';

const teams: Team[] = [
  {
    id: 't1',
    externalId: '1',
    sport: 'soccer',
    leagueId: 'lg_mx',
    name: 'América',
    code: null,
    country: 'Mexico',
    logo: null,
    altName: null,
    altLogo: null,
    city: null,
    conference: null,
    division: null,
    venue: { id: 1, name: 'Estadio Azteca', city: 'D.F.', capacity: 106187 },
    updatedAt: null,
  },
  {
    id: 't2',
    externalId: '2',
    sport: 'soccer',
    leagueId: 'lg_mx',
    name: 'Chivas',
    code: null,
    country: 'Mexico',
    logo: null,
    altName: null,
    altLogo: null,
    city: null,
    conference: null,
    division: null,
    venue: { id: 2, name: 'Estadio Jalisco', city: 'Guadalajara', capacity: 56713 },
    updatedAt: null,
  },
  {
    id: 't3',
    externalId: '3',
    sport: 'soccer',
    leagueId: 'lg_mx',
    name: 'Sin sede',
    code: null,
    country: 'Mexico',
    logo: null,
    altName: null,
    altLogo: null,
    city: null,
    conference: null,
    division: null,
    venue: null,
    updatedAt: null,
  },
];

describe('venues from teams', () => {
  it('builds a deduplicated sorted venue list', () => {
    expect(venuesFromTeams(teams)).toEqual([
      { name: 'Estadio Azteca', city: 'D.F.' },
      { name: 'Estadio Jalisco', city: 'Guadalajara' },
    ]);
  });

  it('formats venue labels with city', () => {
    expect(formatVenueOption({ name: 'Estadio Azteca', city: 'D.F.' })).toBe(
      'Estadio Azteca (D.F.)',
    );
  });

  it('resolves a team home venue by id', () => {
    expect(venueNameForTeam(teams, 't1')).toBe('Estadio Azteca');
    expect(venueNameForTeam(teams, 't3')).toBeNull();
  });
});
