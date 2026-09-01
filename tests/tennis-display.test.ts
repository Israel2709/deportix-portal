import { describe, expect, it } from 'vitest';
import {
  formatTennisTournamentLabel,
  tennisTournamentCircuitLabel,
  tennisTournamentToSelectOption,
} from '@/lib/tennis-display';
import type { TennisTournamentItem } from '@/lib/tennis-bff-types';

const baseTournament: TennisTournamentItem = {
  id: 't-1',
  name: 'Australian Open',
  shortName: 'AO',
  category: 'grand_slam',
  gender: 'male',
  eventType: 'singles',
  country: { code: 'AU' },
  city: 'Melbourne',
  imageUrl: null,
  startDate: '2027-01-17',
  endDate: '2027-01-30',
  year: 2027,
  status: 'upcoming',
  published: false,
};

describe('tennisTournamentCircuitLabel', () => {
  it('maps male to ATP and female to WTA', () => {
    expect(tennisTournamentCircuitLabel('male')).toBe('ATP');
    expect(tennisTournamentCircuitLabel('female')).toBe('WTA');
  });
});

describe('formatTennisTournamentLabel', () => {
  it('includes circuit and category so ATP/WTA duplicates are distinguishable', () => {
    const atp = formatTennisTournamentLabel(baseTournament);
    const wta = formatTennisTournamentLabel({ ...baseTournament, gender: 'female' });
    expect(atp).toBe('Australian Open 2027 · ATP · Grand Slam (borrador)');
    expect(wta).toBe('Australian Open 2027 · WTA · Grand Slam (borrador)');
    expect(atp).not.toBe(wta);
  });

  it('supports dot-style publish suffix', () => {
    expect(
      formatTennisTournamentLabel({ ...baseTournament, published: true }, { publishedStyle: 'dot' }),
    ).toBe('Australian Open 2027 · ATP · Grand Slam · publicado');
  });
});

describe('tennisTournamentToSelectOption', () => {
  it('returns id and formatted label', () => {
    expect(tennisTournamentToSelectOption(baseTournament)).toEqual({
      value: 't-1',
      label: 'Australian Open 2027 · ATP · Grand Slam (borrador)',
    });
  });
});
