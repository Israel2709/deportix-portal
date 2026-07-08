export const AMERICAN_FOOTBALL_INPUT_CLASS =
  'mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100';

export const AMERICAN_FOOTBALL_SELECT_CLASS =
  'mt-1 rounded-md border border-slate-700 bg-slate-950 pl-3 py-2 text-sm text-slate-100';

export const AMERICAN_FOOTBALL_LABEL_CLASS = 'block text-sm font-medium text-slate-200';

export const AMERICAN_FOOTBALL_BUTTON_PRIMARY =
  'rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50';

/** Create / add actions (Crear, Agregar temporada, etc.). */
export const AMERICAN_FOOTBALL_BUTTON_POSITIVE =
  'rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50';

export const AMERICAN_FOOTBALL_BUTTON_DANGER =
  'rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50';

export const AMERICAN_FOOTBALL_BUTTON_SECONDARY =
  'rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50';

export function nullableString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function parseRequiredInt(value: string, label: string): number | 'invalid' {
  const trimmed = value.trim();
  if (!trimmed) return 'invalid';
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed)) return 'invalid';
  return parsed;
}

export function parseOptionalInt(value: string): number | null | 'invalid' {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed)) return 'invalid';
  return parsed;
}

export function parseOptionalNumber(value: string): number | null | 'invalid' {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (Number.isNaN(parsed)) return 'invalid';
  return parsed;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isCanonicalId(value: string): boolean {
  return UUID_RE.test(value.trim());
}

export function requireCanonicalId(value: string, label: string): string | 'invalid' {
  const trimmed = value.trim();
  if (!trimmed) return 'invalid';
  return isCanonicalId(trimmed) ? trimmed : 'invalid';
}

/** Short label for UUIDs in lists (first 8 chars). */
export function truncateCanonicalId(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 12) return trimmed;
  return `${trimmed.slice(0, 8)}…`;
}

export type AmericanFootballFormMode = 'create' | 'edit' | 'delete' | 'query';

export const AMERICAN_FOOTBALL_FORM_MODES: { id: AmericanFootballFormMode; label: string }[] = [
  { id: 'create', label: 'Crear' },
  { id: 'edit', label: 'Editar' },
  { id: 'delete', label: 'Eliminar' },
  { id: 'query', label: 'Consultar' },
];

export function americanFootballSubmitButtonClass(mode: AmericanFootballFormMode): string {
  switch (mode) {
    case 'create':
      return AMERICAN_FOOTBALL_BUTTON_POSITIVE;
    case 'delete':
      return AMERICAN_FOOTBALL_BUTTON_DANGER;
    case 'edit':
    case 'query':
      return AMERICAN_FOOTBALL_BUTTON_PRIMARY;
  }
}

export function americanFootballModeTabClass(mode: AmericanFootballFormMode, active: boolean): string {
  const base = 'rounded-md px-3 py-1.5 text-sm font-medium transition';
  if (!active) return `${base} bg-slate-800 text-slate-300 hover:bg-slate-700`;
  switch (mode) {
    case 'create':
      return `${base} bg-emerald-600 text-white`;
    case 'delete':
      return `${base} bg-red-600 text-white`;
    default:
      return `${base} bg-blue-600 text-white`;
  }
}
