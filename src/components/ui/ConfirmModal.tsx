'use client';

import { AMERICAN_FOOTBALL_BUTTON_PRIMARY, AMERICAN_FOOTBALL_BUTTON_SECONDARY } from '@/lib/american-football-forms/shared';

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  submitting = false,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <h2 id="confirm-modal-title" className="text-lg font-semibold text-slate-100">
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-300">{message}</p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className={AMERICAN_FOOTBALL_BUTTON_SECONDARY}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className={AMERICAN_FOOTBALL_BUTTON_PRIMARY}
          >
            {submitting ? 'Guardando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
