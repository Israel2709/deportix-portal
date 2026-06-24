/** User-facing path for a sport page (slug preferred, id as fallback). */
export function sportPath(slugOrId: string): string {
  return `/deportes/${encodeURIComponent(slugOrId)}`;
}
