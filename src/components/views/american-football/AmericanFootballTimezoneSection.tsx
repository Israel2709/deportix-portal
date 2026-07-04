'use client';

import { useEffect, useState } from 'react';
import {
  createAmericanFootballTimezone,
  deleteAmericanFootballTimezone,
  getAmericanFootballTimezones,
  updateAmericanFootballTimezone,
} from '@/lib/american-football-api';
import {
  EMPTY_AMERICAN_FOOTBALL_TIMEZONE_FORM,
  buildAmericanFootballTimezonePatchBody,
  buildAmericanFootballTimezonePostBody,
  validateAmericanFootballTimezoneForm,
} from '@/lib/american-football-forms/timezone-form';
import { AmericanFootballFieldGrid, AmericanFootballFormShell, AmericanFootballTextField } from './AmericanFootballFormShell';
import { submitLabelForMode, useAmericanFootballSectionState } from './useAmericanFootballSectionState';

export function AmericanFootballTimezoneSection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const state = useAmericanFootballSectionState(EMPTY_AMERICAN_FOOTBALL_TIMEZONE_FORM, { onDataChanged });
  const [rows, setRows] = useState<string[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingList(true);
      try {
        const envelope = await getAmericanFootballTimezones();
        if (!cancelled) setRows(envelope.response);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [state.listKey]);

  async function handleSubmit() {
    if (state.mode === 'query') {
      state.reloadList();
      state.toast.info('Consulta actualizada');
      return;
    }

    const validation = validateAmericanFootballTimezoneForm(
      state.values,
      state.mode === 'edit' ? 'edit' : state.mode === 'delete' ? 'delete' : 'create',
    );
    if (validation) {
      state.toast.error('Validación', validation);
      return;
    }

    if (state.mode === 'delete' && !state.confirmDelete) {
      state.setConfirmDelete(`¿Eliminar la zona horaria "${state.values.timezone}"?`);
      return;
    }

    state.setSubmitting(true);
    try {
      if (state.mode === 'create') {
        const res = await createAmericanFootballTimezone(buildAmericanFootballTimezonePostBody(state.values));
        state.handleSuccess('Zona horaria agregada', res.results);
      } else if (state.mode === 'edit') {
        const res = await updateAmericanFootballTimezone(buildAmericanFootballTimezonePatchBody(state.values));
        state.handleSuccess('Zona horaria renombrada', res.results);
      } else if (state.mode === 'delete') {
        await deleteAmericanFootballTimezone(buildAmericanFootballTimezonePostBody(state.values));
        state.handleSuccess('Zona horaria eliminada');
        state.setConfirmDelete(null);
      }
    } catch (err) {
      state.handleError(err, 'No se pudo completar la operación.');
      state.setConfirmDelete(null);
    } finally {
      state.setSubmitting(false);
    }
  }

  return (
    <AmericanFootballFormShell
      step={step}
      title="Zonas horarias"
      description="Catálogo auxiliar IANA. Opcional para operaciones de partidos."
      mode={state.mode}
      onModeChange={(mode) => {
        state.setMode(mode);
        state.setConfirmDelete(null);
      }}
      onSubmit={() => void handleSubmit()}
      submitting={state.submitting}
      submitLabel={submitLabelForMode(state.mode)}
      confirmDelete={state.confirmDelete}
      onConfirmDelete={() => void handleSubmit()}
      onCancelDelete={() => state.setConfirmDelete(null)}
      listTitle={loadingList ? 'Cargando…' : `${rows.length} zona(s) horaria(s)`}
      listContent={
        rows.length === 0 ? (
          <p className="text-sm text-slate-500">Sin zonas horarias.</p>
        ) : (
          <ul className="max-h-40 space-y-1 overflow-y-auto text-sm text-slate-300">
            {rows.slice(0, 20).map((tz) => (
              <li key={tz}>{tz}</li>
            ))}
            {rows.length > 20 && (
              <li className="text-slate-500">… y {rows.length - 20} más</li>
            )}
          </ul>
        )
      }
    >
      <AmericanFootballFieldGrid>
        <AmericanFootballTextField
          label="Zona horaria"
          value={state.values.timezone}
          onChange={(v) => state.updateField('timezone', v)}
          placeholder="America/New_York"
        />
        {state.mode === 'edit' && (
          <AmericanFootballTextField
            label="Nueva zona horaria"
            value={state.values.newTimezone}
            onChange={(v) => state.updateField('newTimezone', v)}
          />
        )}
      </AmericanFootballFieldGrid>
    </AmericanFootballFormShell>
  );
}
