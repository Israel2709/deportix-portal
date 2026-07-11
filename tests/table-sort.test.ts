import { describe, expect, it } from 'vitest';
import {
  compareSortableValues,
  nextSortDirection,
  sortRows,
} from '@/lib/table-sort';

describe('table-sort', () => {
  it('places null values after non-null values', () => {
    expect(compareSortableValues(null, 'a')).toBeGreaterThan(0);
    expect(compareSortableValues(3, null)).toBeLessThan(0);
  });

  it('compares numbers numerically', () => {
    expect(compareSortableValues(10, 2)).toBeGreaterThan(0);
  });

  it('compares strings with numeric awareness', () => {
    expect(compareSortableValues('10', '2')).toBeGreaterThan(0);
  });

  it('sorts rows ascending and descending', () => {
    const rows = [{ name: 'C' }, { name: 'A' }, { name: 'B' }];

    expect(sortRows(rows, (row) => row.name, 'asc').map((row) => row.name)).toEqual([
      'A',
      'B',
      'C',
    ]);
    expect(sortRows(rows, (row) => row.name, 'desc').map((row) => row.name)).toEqual([
      'C',
      'B',
      'A',
    ]);
  });

  it('cycles sort direction asc, desc, then reset', () => {
    expect(nextSortDirection(null, null, 'team')).toEqual({ key: 'team', direction: 'asc' });
    expect(nextSortDirection('team', 'asc', 'team')).toEqual({ key: 'team', direction: 'desc' });
    expect(nextSortDirection('team', 'desc', 'team')).toEqual({ key: null, direction: null });
    expect(nextSortDirection('team', 'desc', 'points')).toEqual({ key: 'points', direction: 'asc' });
  });
});
