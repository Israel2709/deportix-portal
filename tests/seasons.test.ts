import { describe, expect, it } from 'vitest';
import { pickDefaultSeason, seasonLabel } from '@/lib/seasons';

describe('season helpers', () => {
  it('labels a season by year when available', () => {
    expect(seasonLabel({ id: 'se1', year: 2026 } as never)).toBe('2026');
  });

  it('selects the current season by default', () => {
    const seasons = [
      { id: 'se25', year: 2025, current: true },
      { id: 'se24', year: 2024, current: false },
    ] as never;

    expect(pickDefaultSeason(seasons)?.id).toBe('se25');
  });

  it('falls back to the first season when none is current', () => {
    const seasons = [
      { id: 'se24', year: 2024, current: false },
      { id: 'se23', year: 2023, current: false },
    ] as never;

    expect(pickDefaultSeason(seasons)?.id).toBe('se24');
  });
});
