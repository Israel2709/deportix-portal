import type { Match } from './types';

export function sortMatchesByDateAsc(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });
}
