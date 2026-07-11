export type SortDirection = 'asc' | 'desc';

export type SortableValue = string | number | boolean | null | undefined;

export function compareSortableValues(a: SortableValue, b: SortableValue): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

export function sortRows<T>(
  rows: T[],
  sortValue: (row: T) => SortableValue,
  direction: SortDirection,
): T[] {
  const factor = direction === 'asc' ? 1 : -1;
  return [...rows].sort((left, right) => factor * compareSortableValues(sortValue(left), sortValue(right)));
}

export function nextSortDirection(
  activeKey: string | null,
  direction: SortDirection | null,
  columnKey: string,
): { key: string | null; direction: SortDirection | null } {
  if (activeKey !== columnKey) {
    return { key: columnKey, direction: 'asc' };
  }

  if (direction === 'asc') {
    return { key: columnKey, direction: 'desc' };
  }

  return { key: null, direction: null };
}
