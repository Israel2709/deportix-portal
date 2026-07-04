'use client';

import { useEffect, useState } from 'react';
import { createAmericanFootballSeason, deleteAmericanFootballSeason, getAmericanFootballSeasons } from '@/lib/american-football-api';
import {
  EMPTY_AMERICAN_FOOTBALL_SEASON_FORM,
  buildAmericanFootballSeasonBody,
  validateAmericanFootballSeasonForm,
} from '@/lib/american-football-forms/season-form';
import { AmericanFootballFormShell, AmericanFootballTextField } from './AmericanFootballFormShell';
import { submitLabelForMode, useAmericanFootballSectionState } from './useAmericanFootballSectionState';

export function AmericanFootballSeasonSection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const state = useAmericanFootballSectionState(EMPTY_AMERICAN_FOOTBALL_SEASON_FORM, { onDataChanged });
  const [rows, setRows] = useState<number[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    if (!state.values.queryLeague.trim()) {
      setRows([]);
      return;
    }

    let cancelled = false;
    async function load() {
      setLoadingList(true);
      try {
        const envelope = await getAmericanFootballSeasons(state.values.queryLeague);
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
  }, [state.listKey, state.values.queryLeague]);

  async function handleSubmit() {
    if (state.mode === 'query') {
      state.reloadList();
      state.toast.info('Consulta actualizada');
      return;
    }

    const validation = validateAmericanFootballSeasonForm(state.values);
    if (validation) {
      state.toast.error('Validación', validation);
      return;
    }

    const leagueLabel = state.values.queryLeague.trim();

    if (state.mode === 'delete' && !state.confirmDelete) {
      state.setConfirmDelete(
        `¿Eliminar la temporada ${state.values.year} de la liga ${leagueLabel}?`,
      );
      return;
    }

    state.setSubmitting(true);
    try {
      const body = buildAmericanFootballSeasonBody(state.values);
      if (state.mode === 'create') {
        const res = await createAmericanFootballSeason(leagueLabel, body);
        state.handleSuccess('Temporada registrada', res.results);
      } else if (state.mode === 'delete') {
        await deleteAmericanFootballSeason(leagueLabel, body);
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
    <AmericanFootballFormShell
      step={step}
      title="Temporadas"
      description="Registra o elimina temporadas para una liga concreta (ID externo api-sports, p. ej. 1 para NFL)."
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
      listTitle={
        loadingList
          ? 'Cargando…'
          : `Temporadas (liga ${state.values.queryLeague || '—'}): ${rows.join(', ') || '—'}`
      }
      listContent={
        rows.length === 0 ? (
          <p className="text-sm text-slate-500">Sin temporadas registradas para esta liga.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {rows.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => {
                  state.setMode('delete');
                  state.setValues({ ...state.values, year: String(year) });
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
      <AmericanFootballTextField
        label="ID liga (api-sports)"
        value={state.values.queryLeague}
        onChange={(v) => state.updateField('queryLeague', v)}
      />
      {(state.mode === 'create' || state.mode === 'delete') && (
        <AmericanFootballTextField
          label="Año"
          value={state.values.year}
          onChange={(v) => state.updateField('year', v)}
          type="number"
        />
      )}
      {state.mode === 'edit' && (
        <p className="text-sm text-slate-400">Las temporadas solo admiten crear o eliminar.</p>
      )}
    </AmericanFootballFormShell>
  );
}
