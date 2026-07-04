import { describe, expect, it } from 'vitest';
import {
  buildAmericanFootballCountryBody,
  EMPTY_AMERICAN_FOOTBALL_COUNTRY_FORM,
  validateAmericanFootballCountryForm,
} from '@/lib/american-football-forms/country-form';
import {
  buildAmericanFootballLeagueBody,
  EMPTY_AMERICAN_FOOTBALL_LEAGUE_FORM,
  validateAmericanFootballLeagueForm,
} from '@/lib/american-football-forms/league-form';
import {
  buildAmericanFootballSeasonBody,
  EMPTY_AMERICAN_FOOTBALL_SEASON_FORM,
  validateAmericanFootballSeasonForm,
} from '@/lib/american-football-forms/season-form';
import {
  buildAmericanFootballTeamBody,
  EMPTY_AMERICAN_FOOTBALL_TEAM_FORM,
  validateAmericanFootballTeamForm,
} from '@/lib/american-football-forms/team-form';
import {
  buildAmericanFootballGameBody,
  EMPTY_AMERICAN_FOOTBALL_GAME_FORM,
  validateAmericanFootballGameForm,
} from '@/lib/american-football-forms/game-form';
import {
  buildAmericanFootballStandingBody,
  EMPTY_AMERICAN_FOOTBALL_STANDING_FORM,
  validateAmericanFootballStandingForm,
} from '@/lib/american-football-forms/standing-form';

describe('NFL form builders', () => {
  it('builds country body from form values', () => {
    const body = buildAmericanFootballCountryBody(EMPTY_AMERICAN_FOOTBALL_COUNTRY_FORM);
    expect(body.name).toBe('USA');
    expect(body.code).toBe('US');
  });

  it('builds league body with nested seasons', () => {
    const body = buildAmericanFootballLeagueBody(EMPTY_AMERICAN_FOOTBALL_LEAGUE_FORM);
    expect(body.league.name).toBe('NFL');
    expect(body.league.altLogo).toBeNull();
    expect(body.seasons).toHaveLength(1);
    expect(body.seasons[0]?.coverage?.standings).toBe(true);
  });

  it('builds season body', () => {
    expect(buildAmericanFootballSeasonBody(EMPTY_AMERICAN_FOOTBALL_SEASON_FORM).year).toBeGreaterThan(2000);
  });

  it('builds team body with numeric id', () => {
    const body = buildAmericanFootballTeamBody(EMPTY_AMERICAN_FOOTBALL_TEAM_FORM);
    expect(body.id).toBe(25);
    expect(body.name).toBe('Miami Dolphins');
    expect(body.altLogo).toBeNull();
  });

  it('builds game body with scores', () => {
    const body = buildAmericanFootballGameBody(EMPTY_AMERICAN_FOOTBALL_GAME_FORM);
    expect(body.game.id).toBe(4550);
    expect(body.scores?.home?.total).toBe(38);
    expect(body.teams.away.name).toBe('Detroit Lions');
  });

  it('builds standing body', () => {
    const body = buildAmericanFootballStandingBody(EMPTY_AMERICAN_FOOTBALL_STANDING_FORM);
    expect(body.team.id).toBe(25);
    expect(body.won).toBe(3);
    expect(body.ncaa_conference?.won).toBeNull();
  });
});

describe('NFL form validation', () => {
  it('rejects country without name', () => {
    expect(validateAmericanFootballCountryForm({ ...EMPTY_AMERICAN_FOOTBALL_COUNTRY_FORM, name: '' }, 'create')).not.toBeNull();
  });

  it('rejects league without seasons', () => {
    expect(
      validateAmericanFootballLeagueForm({ ...EMPTY_AMERICAN_FOOTBALL_LEAGUE_FORM, seasons: [] }, 'create'),
    ).not.toBeNull();
  });

  it('rejects invalid season year', () => {
    expect(validateAmericanFootballSeasonForm({ ...EMPTY_AMERICAN_FOOTBALL_SEASON_FORM, year: 'abc' })).not.toBeNull();
  });

  it('rejects team without name', () => {
    expect(
      validateAmericanFootballTeamForm({ ...EMPTY_AMERICAN_FOOTBALL_TEAM_FORM, name: '' }, 'create'),
    ).not.toBeNull();
  });

  it('rejects game query without params', () => {
    expect(
      validateAmericanFootballGameForm(
        {
          ...EMPTY_AMERICAN_FOOTBALL_GAME_FORM,
          queryLeague: '',
          querySeason: '',
          queryGameId: '',
        },
        'query',
      ),
    ).not.toBeNull();
  });

  it('accepts valid standing form', () => {
    expect(validateAmericanFootballStandingForm(EMPTY_AMERICAN_FOOTBALL_STANDING_FORM, 'create')).toBeNull();
  });
});
