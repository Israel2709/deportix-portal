import { describe, expect, it } from 'vitest';
import {
  formula1CircuitDetailPath,
  formula1CompetitionDetailPath,
  formula1DriverDetailPath,
  formula1RaceDetailPath,
  formula1SeasonBrowsePath,
  formula1TabPath,
  formula1TeamDetailPath,
  parseFormula1Tab,
} from '@/lib/formula-1-paths';

describe('parseFormula1Tab', () => {
  it('defaults to contenido', () => {
    expect(parseFormula1Tab(undefined)).toBe('contenido');
    expect(parseFormula1Tab('unknown')).toBe('contenido');
  });

  it('accepts coverage, browse and loader', () => {
    expect(parseFormula1Tab('coverage')).toBe('coverage');
    expect(parseFormula1Tab('browse')).toBe('browse');
    expect(parseFormula1Tab('loader')).toBe('loader');
  });
});

describe('formula1 paths', () => {
  it('builds tab paths', () => {
    expect(formula1TabPath('contenido')).toBe('/formula-1');
    expect(formula1TabPath('loader')).toBe('/formula-1?tab=loader');
  });

  it('builds detail paths', () => {
    expect(formula1CompetitionDetailPath('a')).toBe('/formula-1/competitions/a');
    expect(formula1CircuitDetailPath('b')).toBe('/formula-1/circuits/b');
    expect(formula1TeamDetailPath('c')).toBe('/formula-1/teams/c');
    expect(formula1DriverDetailPath('d')).toBe('/formula-1/drivers/d');
    expect(formula1RaceDetailPath('e')).toBe('/formula-1/races/e');
    expect(formula1SeasonBrowsePath(2024)).toBe('/formula-1/seasons/2024');
  });
});
