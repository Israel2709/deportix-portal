import { describe, expect, it } from 'vitest';
import { parseTennisTab, tennisTabPath } from '@/lib/tennis-paths';

describe('parseTennisTab', () => {
  it('defaults to contenido', () => {
    expect(parseTennisTab(undefined)).toBe('contenido');
    expect(parseTennisTab('unknown')).toBe('contenido');
  });

  it('accepts coverage and loader', () => {
    expect(parseTennisTab('coverage')).toBe('coverage');
    expect(parseTennisTab('loader')).toBe('loader');
  });
});

describe('tennis paths', () => {
  it('builds tab paths', () => {
    expect(tennisTabPath('contenido')).toBe('/tennis');
    expect(tennisTabPath('loader')).toBe('/tennis?tab=loader');
    expect(tennisTabPath('coverage')).toBe('/tennis?tab=coverage');
  });
});
