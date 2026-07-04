import { describe, expect, it } from 'vitest';
import {
  buildNflCountryBody,
  EMPTY_NFL_COUNTRY_FORM,
  validateNflCountryForm,
} from '@/lib/nfl-forms/country-form';
import {
  buildNflLeagueBody,
  EMPTY_NFL_LEAGUE_FORM,
  validateNflLeagueForm,
} from '@/lib/nfl-forms/league-form';
import {
  buildNflSeasonBody,
  EMPTY_NFL_SEASON_FORM,
  validateNflSeasonForm,
} from '@/lib/nfl-forms/season-form';
import {
  buildNflTeamBody,
  EMPTY_NFL_TEAM_FORM,
  validateNflTeamForm,
} from '@/lib/nfl-forms/team-form';
import {
  buildNflGameBody,
  EMPTY_NFL_GAME_FORM,
  validateNflGameForm,
} from '@/lib/nfl-forms/game-form';
import {
  buildNflStandingBody,
  EMPTY_NFL_STANDING_FORM,
  validateNflStandingForm,
} from '@/lib/nfl-forms/standing-form';

describe('NFL form builders', () => {
  it('builds country body from form values', () => {
    const body = buildNflCountryBody(EMPTY_NFL_COUNTRY_FORM);
    expect(body.name).toBe('USA');
    expect(body.code).toBe('US');
  });

  it('builds league body with nested seasons', () => {
    const body = buildNflLeagueBody(EMPTY_NFL_LEAGUE_FORM);
    expect(body.league.name).toBe('NFL');
    expect(body.seasons).toHaveLength(1);
    expect(body.seasons[0]?.coverage?.standings).toBe(true);
  });

  it('builds season body', () => {
    expect(buildNflSeasonBody(EMPTY_NFL_SEASON_FORM).year).toBeGreaterThan(2000);
  });

  it('builds team body with numeric id', () => {
    const body = buildNflTeamBody(EMPTY_NFL_TEAM_FORM);
    expect(body.id).toBe(25);
    expect(body.name).toBe('Miami Dolphins');
  });

  it('builds game body with scores', () => {
    const body = buildNflGameBody(EMPTY_NFL_GAME_FORM);
    expect(body.game.id).toBe(4550);
    expect(body.scores?.home?.total).toBe(38);
    expect(body.teams.away.name).toBe('Detroit Lions');
  });

  it('builds standing body', () => {
    const body = buildNflStandingBody(EMPTY_NFL_STANDING_FORM);
    expect(body.team.id).toBe(25);
    expect(body.won).toBe(3);
    expect(body.ncaa_conference?.won).toBeNull();
  });
});

describe('NFL form validation', () => {
  it('rejects country without name', () => {
    expect(validateNflCountryForm({ ...EMPTY_NFL_COUNTRY_FORM, name: '' }, 'create')).not.toBeNull();
  });

  it('rejects league without seasons', () => {
    expect(
      validateNflLeagueForm({ ...EMPTY_NFL_LEAGUE_FORM, seasons: [] }, 'create'),
    ).not.toBeNull();
  });

  it('rejects invalid season year', () => {
    expect(validateNflSeasonForm({ year: 'abc' })).not.toBeNull();
  });

  it('rejects team without name', () => {
    expect(
      validateNflTeamForm({ ...EMPTY_NFL_TEAM_FORM, name: '' }, 'create'),
    ).not.toBeNull();
  });

  it('rejects game query without params', () => {
    expect(
      validateNflGameForm(
        {
          ...EMPTY_NFL_GAME_FORM,
          queryLeague: '',
          querySeason: '',
          queryGameId: '',
        },
        'query',
      ),
    ).not.toBeNull();
  });

  it('accepts valid standing form', () => {
    expect(validateNflStandingForm(EMPTY_NFL_STANDING_FORM, 'create')).toBeNull();
  });
});
