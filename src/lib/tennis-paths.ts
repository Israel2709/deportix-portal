export type TennisTab = 'contenido' | 'coverage' | 'loader';

export function parseTennisTab(value: string | null | undefined): TennisTab {
  if (value === 'coverage' || value === 'loader') return value;
  return 'contenido';
}

export function tennisTabPath(tab: TennisTab): string {
  if (tab === 'contenido') return '/tennis';
  return `/tennis?tab=${tab}`;
}
