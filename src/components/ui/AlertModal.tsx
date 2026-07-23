'use client';

import { AMERICAN_FOOTBALL_BUTTON_PRIMARY } from '@/lib/american-football-forms/shared';

export function AlertModal({
  open,
  title,
  message,
  confirmLabel = 'Entendido',
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-modal-title"
        aria-describedby="alert-modal-message"
      >
        <h2 id="alert-modal-title" className="text-lg font-semibold text-slate-100">
          {title}
        </h2>
        <p id="alert-modal-message" className="mt-2 text-sm text-slate-300">
          {message}
        </p>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={onClose} className={AMERICAN_FOOTBALL_BUTTON_PRIMARY} autoFocus>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
