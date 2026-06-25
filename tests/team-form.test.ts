import { describe, expect, it } from 'vitest';
import {
  formValuesToPatch,
  teamFormFieldsForSport,
  teamToFormValues,
  validateTeamForm,
} from '@/lib/team-form';
import type { Team } from '@/lib/types';

const soccerTeam: Team = {
  id: 't1',
  externalId: null,
  sport: 'soccer',
  leagueId: 'lg1',
  name: 'Club América',
  code: 'AME',
  country: 'Mexico',
  logo: 'logo.png',
  altName: null,
  altLogo: null,
  city: null,
  conference: null,
  division: null,
  venue: { id: 1, name: 'Azteca', city: 'CDMX', capacity: 87000 },
  updatedAt: null,
};

describe('team-form', () => {
  it('includes soccer-specific fields', () => {
    expect(teamFormFieldsForSport('soccer')).toContain('venueName');
    expect(teamFormFieldsForSport('soccer')).toContain('altName');
  });

  it('includes nfl-specific fields', () => {
    const fields = teamFormFieldsForSport('nfl');
    expect(fields).toContain('conference');
    expect(fields).not.toContain('venueName');
  });

  it('validates required nfl fields', () => {
    const values = teamToFormValues({ ...soccerTeam, sport: 'nfl' });
    expect(validateTeamForm(values, 'nfl')).toMatch(/ciudad/i);
  });

  it('builds patch with alt fields', () => {
    const values = teamToFormValues(soccerTeam);
    values.altName = 'Las Águilas';
    values.altLogo = 'alt.png';

    expect(formValuesToPatch(values, 'soccer')).toMatchObject({
      altName: 'Las Águilas',
      altLogo: 'alt.png',
      venue: { name: 'Azteca', city: 'CDMX', capacity: 87000 },
    });
  });
});
