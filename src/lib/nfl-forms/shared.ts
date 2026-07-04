export const NFL_INPUT_CLASS =
  'mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100';

export const NFL_LABEL_CLASS = 'block text-sm font-medium text-slate-200';

export const NFL_BUTTON_PRIMARY =
  'rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50';

export const NFL_BUTTON_SECONDARY =
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

export type NflFormMode = 'create' | 'edit' | 'delete' | 'query';

export const NFL_FORM_MODES: { id: NflFormMode; label: string }[] = [
  { id: 'create', label: 'Crear' },
  { id: 'edit', label: 'Editar' },
  { id: 'delete', label: 'Eliminar' },
  { id: 'query', label: 'Consultar' },
];
