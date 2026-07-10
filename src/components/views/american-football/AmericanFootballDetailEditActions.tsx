'use client';

import { AMERICAN_FOOTBALL_BUTTON_PRIMARY, AMERICAN_FOOTBALL_BUTTON_SECONDARY } from '@/lib/american-football-forms/shared';

export function AmericanFootballDetailEditActions({
  editing,
  submitting,
  onEdit,
  onCancel,
  onSave,
}: {
  editing: boolean;
  submitting: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (editing) {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={submitting}
          className={AMERICAN_FOOTBALL_BUTTON_PRIMARY}
        >
          Guardar cambios
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className={AMERICAN_FOOTBALL_BUTTON_SECONDARY}
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button type="button" onClick={onEdit} className={AMERICAN_FOOTBALL_BUTTON_SECONDARY}>
      Editar
    </button>
  );
}
