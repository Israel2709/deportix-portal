import { describe, expect, it, vi } from 'vitest';
import {
  applyTeamOverrides,
  applyTeamPatch,
  readTeamOverrides,
  saveTeamOverride,
  writeTeamOverrides,
} from '@/lib/team-edits';
import type { Team } from '@/lib/types';

const baseTeam: Team = {
  id: 't1',
  externalId: '458',
  sport: 'soccer',
  leagueId: 'lg1',
  name: 'Club América',
  code: 'AME',
  country: 'Mexico',
  logo: 'https://example.com/logo.png',
  altName: null,
  altLogo: null,
  city: null,
  conference: null,
  division: null,
  venue: { id: 1, name: 'Azteca', city: 'CDMX', capacity: 87000 },
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('team-edits', () => {
  it('applies alt name and venue patch', () => {
    const patched = applyTeamPatch(baseTeam, {
      altName: 'Las Águilas',
      venue: { name: 'Estadio Azteca' },
    });
    expect(patched.altName).toBe('Las Águilas');
    expect(patched.venue?.name).toBe('Estadio Azteca');
    expect(patched.venue?.capacity).toBe(87000);
  });

  it('persists overrides in localStorage', () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
      },
    });

    saveTeamOverride('t1', { altName: 'Alias' });
    expect(readTeamOverrides().t1).toEqual({ altName: 'Alias' });

    const merged = applyTeamOverrides([baseTeam], readTeamOverrides())[0];
    expect(merged.altName).toBe('Alias');

    writeTeamOverrides({});
    expect(readTeamOverrides()).toEqual({});
  });
});
