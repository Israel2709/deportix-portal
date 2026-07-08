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

const LEAGUE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const TEAM_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const TEAM_AWAY_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

describe('NFL form builders', () => {
  it('builds country body from form values', () => {
    const body = buildAmericanFootballCountryBody(EMPTY_AMERICAN_FOOTBALL_COUNTRY_FORM);
    expect(body.name).toBe('USA');
    expect(body.code).toBe('US');
  });

  it('builds league body without id on create', () => {
    const body = buildAmericanFootballLeagueBody({
      ...EMPTY_AMERICAN_FOOTBALL_LEAGUE_FORM,
      leagueName: 'NFL',
    });
    expect(body.league.name).toBe('NFL');
    expect('id' in body.league).toBe(false);
    expect(body.seasons).toEqual([]);
  });

  it('builds season body', () => {
    expect(buildAmericanFootballSeasonBody(EMPTY_AMERICAN_FOOTBALL_SEASON_FORM).year).toBeGreaterThan(2000);
  });

  it('builds team body without id', () => {
    const body = buildAmericanFootballTeamBody({
      ...EMPTY_AMERICAN_FOOTBALL_TEAM_FORM,
      name: 'Miami Dolphins',
    });
    expect(body).toEqual({
      name: 'Miami Dolphins',
      logo: null,
      altLogo: null,
    });
    expect('id' in body).toBe(false);
  });

  it('builds game body without game id and with canonical refs', () => {
    const body = buildAmericanFootballGameBody({
      ...EMPTY_AMERICAN_FOOTBALL_GAME_FORM,
      queryLeague: LEAGUE_ID,
      leagueName: 'NFL',
      leagueSeason: '2022',
      homeId: TEAM_ID,
      homeName: 'Miami Dolphins',
      awayId: TEAM_AWAY_ID,
      awayName: 'Detroit Lions',
      homeTotal: '38',
      awayTotal: '26',
    });
    expect('id' in body.game).toBe(false);
    expect(body.league.id).toBe(LEAGUE_ID);
    expect(body.teams.home.id).toBe(TEAM_ID);
    expect(body.scores?.home?.total).toBe(38);
  });

  it('builds standing body with canonical refs', () => {
    const body = buildAmericanFootballStandingBody({
      ...EMPTY_AMERICAN_FOOTBALL_STANDING_FORM,
      queryLeague: LEAGUE_ID,
      leagueName: 'NFL',
      leagueSeason: '2022',
      teamId: TEAM_ID,
      teamName: 'Miami Dolphins',
      won: '3',
      lost: '1',
    });
    expect(body.league.id).toBe(LEAGUE_ID);
    expect(body.team.id).toBe(TEAM_ID);
    expect(body.won).toBe(3);
  });
});

describe('NFL form validation', () => {
  it('rejects country without name', () => {
    expect(validateAmericanFootballCountryForm({ ...EMPTY_AMERICAN_FOOTBALL_COUNTRY_FORM, name: '' }, 'create')).not.toBeNull();
  });

  it('accepts league form without id', () => {
    expect(
      validateAmericanFootballLeagueForm(
        { ...EMPTY_AMERICAN_FOOTBALL_LEAGUE_FORM, leagueName: 'NFL' },
        'create',
      ),
    ).toBeNull();
  });

  it('rejects invalid season year', () => {
    expect(validateAmericanFootballSeasonForm({ ...EMPTY_AMERICAN_FOOTBALL_SEASON_FORM, year: 'abc' })).not.toBeNull();
  });

  it('rejects team without name', () => {
    expect(
      validateAmericanFootballTeamForm({ ...EMPTY_AMERICAN_FOOTBALL_TEAM_FORM, name: '' }, 'create'),
    ).not.toBeNull();
  });

  it('rejects game create without canonical team refs', () => {
    expect(
      validateAmericanFootballGameForm(
        {
          ...EMPTY_AMERICAN_FOOTBALL_GAME_FORM,
          queryLeague: LEAGUE_ID,
          homeName: 'Home',
          awayName: 'Away',
        },
        'create',
      ),
    ).not.toBeNull();
  });

  it('accepts valid game create with team UUIDs', () => {
    expect(
      validateAmericanFootballGameForm(
        {
          ...EMPTY_AMERICAN_FOOTBALL_GAME_FORM,
          queryLeague: LEAGUE_ID,
          homeId: TEAM_ID,
          homeName: 'Home',
          awayId: TEAM_AWAY_ID,
          awayName: 'Away',
        },
        'create',
      ),
    ).toBeNull();
  });

  it('accepts valid standing form with UUIDs', () => {
    expect(
      validateAmericanFootballStandingForm(
        {
          ...EMPTY_AMERICAN_FOOTBALL_STANDING_FORM,
          queryLeague: LEAGUE_ID,
          teamId: TEAM_ID,
          teamName: 'Dolphins',
        },
        'create',
      ),
    ).toBeNull();
  });
});
