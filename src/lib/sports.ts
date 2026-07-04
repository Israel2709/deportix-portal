/** User-facing path for a sport page (slug preferred, id as fallback). */
export function sportPath(slugOrId: string): string {
  if (slugOrId === 'american-football') return '/american-football';
  return `/deportes/${encodeURIComponent(slugOrId)}`;
}
