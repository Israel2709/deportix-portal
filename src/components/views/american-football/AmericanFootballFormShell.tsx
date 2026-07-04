'use client';

import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Ui';
import { AMERICAN_FOOTBALL_BUTTON_PRIMARY, AMERICAN_FOOTBALL_BUTTON_SECONDARY, AMERICAN_FOOTBALL_FORM_MODES, type AmericanFootballFormMode } from '@/lib/american-football-forms/shared';

export function AmericanFootballFormShell({
  step,
  title,
  description,
  mode,
  onModeChange,
  onSubmit,
  submitting,
  submitLabel,
  children,
  listTitle,
  listContent,
  confirmDelete,
  onConfirmDelete,
  onCancelDelete,
}: {
  step: number;
  title: string;
  description: string;
  mode: AmericanFootballFormMode;
  onModeChange: (mode: AmericanFootballFormMode) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitLabel: string;
  children: ReactNode;
  listTitle?: string;
  listContent?: ReactNode;
  confirmDelete?: string | null;
  onConfirmDelete?: () => void;
  onCancelDelete?: () => void;
}) {
  return (
    <Card className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-blue-400">Paso {step}</p>
        <h3 className="mt-1 text-lg font-semibold text-slate-100">{title}</h3>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {AMERICAN_FOOTBALL_FORM_MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onModeChange(item.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              mode === item.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-4"
      >
        {children}

        {confirmDelete ? (
          <div className="rounded-md border border-red-500/30 bg-red-950/30 p-4">
            <p className="text-sm text-red-200">{confirmDelete}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onConfirmDelete}
                disabled={submitting}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                Confirmar eliminación
              </button>
              <button
                type="button"
                onClick={onCancelDelete}
                disabled={submitting}
                className={AMERICAN_FOOTBALL_BUTTON_SECONDARY}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button type="submit" disabled={submitting} className={AMERICAN_FOOTBALL_BUTTON_PRIMARY}>
            {submitting ? 'Enviando…' : submitLabel}
          </button>
        )}
      </form>

      {listContent && (
        <div className="border-t border-slate-800 pt-4">
          {listTitle && <h4 className="mb-3 text-sm font-semibold text-slate-200">{listTitle}</h4>}
          {listContent}
        </div>
      )}
    </Card>
  );
}

export function AmericanFootballFieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

export function AmericanFootballTextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-200">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
      />
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function AmericanFootballCheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-200">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-slate-600 bg-slate-950"
      />
      {label}
    </label>
  );
}

export function AmericanFootballRowActions({
  onEdit,
  onDelete,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="text-xs text-blue-400 hover:underline"
        >
          Editar
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="text-xs text-red-400 hover:underline"
        >
          Eliminar
        </button>
      )}
    </div>
  );
}
