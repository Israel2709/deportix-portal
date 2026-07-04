'use client';

import { useEffect, useState } from 'react';
import { createNflSeason, deleteNflSeason, getNflSeasons } from '@/lib/nfl-api';
import {
  EMPTY_NFL_SEASON_FORM,
  buildNflSeasonBody,
  validateNflSeasonForm,
} from '@/lib/nfl-forms/season-form';
import { NflFormShell, NflTextField } from './NflFormShell';
import { submitLabelForMode, useNflSectionState } from './useNflSectionState';

export function NflSeasonSection({ step }: { step: number }) {
  const state = useNflSectionState(EMPTY_NFL_SEASON_FORM);
  const [rows, setRows] = useState<number[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingList(true);
      try {
        const envelope = await getNflSeasons();
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

    const validation = validateNflSeasonForm(state.values);
    if (validation) {
      state.toast.error('Validación', validation);
      return;
    }

    if (state.mode === 'delete' && !state.confirmDelete) {
      state.setConfirmDelete(`¿Eliminar la temporada ${state.values.year} en todas las ligas NFL?`);
      return;
    }

    state.setSubmitting(true);
    try {
      const body = buildNflSeasonBody(state.values);
      if (state.mode === 'create') {
        const res = await createNflSeason(body);
        state.handleSuccess('Temporada registrada', res.results);
      } else if (state.mode === 'delete') {
        await deleteNflSeason(body);
        state.handleSuccess('Temporada eliminada');
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
    <NflFormShell
      step={step}
      title="Temporadas"
      description="Registra un año de temporada NFL. Se asocia a la primera liga NFL existente."
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
      listTitle={loadingList ? 'Cargando…' : `Temporadas: ${rows.join(', ') || '—'}`}
      listContent={
        rows.length === 0 ? (
          <p className="text-sm text-slate-500">Sin temporadas registradas.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {rows.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => {
                  state.setMode('delete');
                  state.setValues({ year: String(year) });
                }}
                className="rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-200 hover:border-red-500/50"
              >
                {year}
              </button>
            ))}
          </div>
        )
      }
    >
      {(state.mode === 'create' || state.mode === 'delete') && (
        <NflTextField
          label="Año"
          value={state.values.year}
          onChange={(v) => state.updateField('year', v)}
          type="number"
        />
      )}
      {state.mode === 'edit' && (
        <p className="text-sm text-slate-400">Las temporadas solo admiten crear o eliminar.</p>
      )}
    </NflFormShell>
  );
}
