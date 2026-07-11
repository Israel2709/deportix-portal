import { describe, expect, it } from 'vitest';
import {
  buildMatchCreateBodyFromForm,
  buildMatchFromForm,
  validateMatchForm,
  EMPTY_MATCH_FORM,
  addMatchFormPath,
  formatMatchStatusOption,
  MATCH_STATUS_LABELS,
  resolveMatchVenue,
} from '@/lib/match-form';
import { readLocalMatches, removeLocalMatch, saveLocalMatch } from '@/lib/local-matches';
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
    venue: null,
    updatedAt: null,
  },
];

describe('match form', () => {
  it('validates required fields and distinct teams', () => {
    expect(validateMatchForm(EMPTY_MATCH_FORM)).toBe('La fecha es obligatoria.');

    expect(
      validateMatchForm({
        ...EMPTY_MATCH_FORM,
        date: '2026-07-01T20:00',
        homeTeamId: 't1',
        awayTeamId: 't1',
      }),
    ).toBe('Local y visitante deben ser equipos distintos.');
  });

  it('builds a match aligned with the public Match model', () => {
    const match = buildMatchFromForm(
      {
        ...EMPTY_MATCH_FORM,
        date: '2026-07-01T20:00',
        status: 'NS',
        round: 'Apertura - 1',
        venue: 'Azteca',
        homeTeamId: 't1',
        homeScore: '2',
        awayTeamId: 't2',
        awayScore: '1',
      },
      { sport: 'soccer', leagueId: 'lg_mx', seasonId: 'se25' },
      teams,
    );

    expect(match.id.startsWith('local_')).toBe(true);
    expect(match.externalId).toBe(match.id.slice('local_'.length));
    expect(match.leagueId).toBe('lg_mx');
    expect(match.seasonId).toBe('se25');
    expect(match.home.name).toBe('América');
    expect(match.away.name).toBe('Chivas');
    expect(match.round).toBe('Apertura - 1');
    expect(match.venue).toBe('Azteca');
    expect(match.home.score).toBe(2);
    expect(match.away.score).toBe(1);
  });

  it('builds the add-match route with season query', () => {
    expect(addMatchFormPath('262', 2025)).toBe('/leagues/262/partidos/nuevo?season=2025');
  });

  it('maps form values to the POST /matches body', () => {
    const body = buildMatchCreateBodyFromForm(
      {
        ...EMPTY_MATCH_FORM,
        date: '2026-07-01T20:00',
        status: 'NS',
        round: 'Apertura - 1',
        venue: 'Azteca',
        homeTeamId: 't1',
        homeScore: '2',
        awayTeamId: 't2',
        awayScore: '1',
      },
      teams,
      { seasonId: 'se25' },
    );

    expect(typeof body).toBe('object');
    expect(body).toMatchObject({
      seasonId: 'se25',
      status: 'NS',
      round: 'Apertura - 1',
      venue: 'Azteca',
      home: { teamId: 't1', score: 2 },
      away: { teamId: 't2', score: 1 },
    });
    if (typeof body === 'object' && body !== null && 'date' in body) {
      expect(String(body.date)).toMatch(/^2026-07-0[12]T/);
    }
  });

  it('formats status options with Spanish labels', () => {
    expect(formatMatchStatusOption('NS')).toBe('NS — No iniciado');
    expect(MATCH_STATUS_LABELS.FT).toBe('Finalizado');
  });

  it('falls back to the home team venue when the form field is empty', () => {
    const homeTeam = teams[0];
    expect(
      resolveMatchVenue(
        { ...EMPTY_MATCH_FORM, homeTeamId: 't1', awayTeamId: 't2' },
        homeTeam,
      ),
    ).toBe('Estadio Azteca');

    const match = buildMatchFromForm(
      {
        ...EMPTY_MATCH_FORM,
        date: '2026-07-01T20:00',
        homeTeamId: 't1',
        awayTeamId: 't2',
      },
      { sport: 'soccer', leagueId: 'lg_mx', seasonId: 'se25' },
      teams,
    );
    expect(match.venue).toBe('Estadio Azteca');
  });
});

describe('local matches storage', () => {
  it('persists matches per league and season', () => {
    localStorage.clear();
    const match = buildMatchFromForm(
      {
        ...EMPTY_MATCH_FORM,
        date: '2026-07-01T20:00',
        homeTeamId: 't1',
        awayTeamId: 't2',
      },
      { sport: 'soccer', leagueId: 'lg_mx', seasonId: 'se25' },
      teams,
    );

    saveLocalMatch('lg_mx', 'se25', match);
    expect(readLocalMatches('lg_mx', 'se25')).toHaveLength(1);
    expect(readLocalMatches('lg_mx', 'se26')).toHaveLength(0);
  });

  it('removes a local match from storage', () => {
    localStorage.clear();
    const match = buildMatchFromForm(
      {
        ...EMPTY_MATCH_FORM,
        date: '2026-07-01T20:00',
        homeTeamId: 't1',
        awayTeamId: 't2',
      },
      { sport: 'soccer', leagueId: 'lg_mx', seasonId: 'se25' },
      teams,
    );

    saveLocalMatch('lg_mx', 'se25', match);
    removeLocalMatch('lg_mx', 'se25', match.id);
    expect(readLocalMatches('lg_mx', 'se25')).toHaveLength(0);
  });
});
