/** User-facing path for a sport page (slug preferred, id as fallback). */
export function sportPath(slugOrId: string): string {
  if (slugOrId === 'nfl') return '/nfl';
  return `/deportes/${encodeURIComponent(slugOrId)}`;
}
