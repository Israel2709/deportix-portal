'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  createAmericanFootballSeason,
  deleteAmericanFootballSeason,
  getAmericanFootballLeagues,
  getAmericanFootballSeasons,
} from '@/lib/american-football-api';
import type { AmericanFootballLeagueItem } from '@/lib/american-football-bff-types';
import {
  EMPTY_AMERICAN_FOOTBALL_SEASON_FORM,
  buildAmericanFootballSeasonBody,
  validateAmericanFootballSeasonForm,
} from '@/lib/american-football-forms/season-form';
import {
  AmericanFootballFieldGrid,
  AmericanFootballFormShell,
  AmericanFootballSelectField,
  AmericanFootballTextField,
} from './AmericanFootballFormShell';
import { submitLabelForMode, useAmericanFootballSectionState } from './useAmericanFootballSectionState';

const NO_LEAGUES_HINT = 'sin ligas cargadas, crea una liga para poder agregar temporadas';

export function AmericanFootballSeasonSection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const state = useAmericanFootballSectionState(EMPTY_AMERICAN_FOOTBALL_SEASON_FORM, { onDataChanged });
  const [leagues, setLeagues] = useState<AmericanFootballLeagueItem[]>([]);
  const [loadingLeagues, setLoadingLeagues] = useState(false);
  const [rows, setRows] = useState<number[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const leagueOptions = useMemo(
    () => leagues.map((item) => ({ value: item.league.id, label: item.league.name })),
    [leagues],
  );

  const selectedLeague = useMemo(
    () => leagues.find((item) => item.league.id === state.values.queryLeague),
    [leagues, state.values.queryLeague],
  );

  const selectedLeagueLabel = selectedLeague?.league.name ?? '—';

  useEffect(() => {
    let cancelled = false;
    async function loadLeagues() {
      setLoadingLeagues(true);
      try {
        const envelope = await getAmericanFootballLeagues();
        if (cancelled) return;
        const loaded = envelope.response;
        setLeagues(loaded);
        if (loaded.length > 0) {
          state.setValues((current) => {
            const stillValid = loaded.some((item) => item.league.id === current.queryLeague);
            if (stillValid) return current;
            const first = loaded[0];
            return first ? { ...current, queryLeague: first.league.id } : current;
          });
        } else {
          state.setValues((current) => ({ ...current, queryLeague: '' }));
        }
      } catch {
        if (!cancelled) {
          setLeagues([]);
          state.setValues((current) => ({ ...current, queryLeague: '' }));
        }
      } finally {
        if (!cancelled) setLoadingLeagues(false);
      }
    }
    void loadLeagues();
    return () => {
      cancelled = true;
    };
  }, [state.listKey, state.setValues]);

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

    if (state.mode === 'delete' && !state.confirmDelete) {
      state.setConfirmDelete(
        `¿Eliminar la temporada ${state.values.year} de la liga ${selectedLeagueLabel}?`,
      );
      return;
    }

    state.setSubmitting(true);
    try {
      const body = buildAmericanFootballSeasonBody(state.values);
      const leagueId = state.values.queryLeague.trim();
      if (state.mode === 'create') {
        const res = await createAmericanFootballSeason(leagueId, body);
        state.handleSuccess('Temporada registrada', res.results);
      } else if (state.mode === 'delete') {
        await deleteAmericanFootballSeason(leagueId, body);
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

  const noLeagues = !loadingLeagues && leagues.length === 0;

  return (
    <AmericanFootballFormShell
      step={step}
      title="Temporadas"
      description="Elige una liga existente y registra el año de la temporada."
      mode={state.mode}
      onModeChange={(mode) => {
        state.setMode(mode);
        state.setConfirmDelete(null);
      }}
      onSubmit={() => void handleSubmit()}
      submitting={state.submitting}
      submitLabel={state.mode === 'create' ? 'Crear temporada' : submitLabelForMode(state.mode)}
      submitAlign="right"
      confirmDelete={state.confirmDelete}
      onConfirmDelete={() => void handleSubmit()}
      onCancelDelete={() => state.setConfirmDelete(null)}
      listTitle={
        loadingList
          ? 'Cargando…'
          : `Temporadas (${selectedLeagueLabel}): ${rows.join(', ') || '—'}`
      }
      listContent={
        !state.values.queryLeague.trim() ? (
          <p className="text-sm text-slate-500">Selecciona una liga para ver sus temporadas.</p>
        ) : rows.length === 0 ? (
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
      <AmericanFootballFieldGrid>
        <AmericanFootballSelectField
          label="Liga"
          value={state.values.queryLeague}
          onChange={(v) => state.updateField('queryLeague', v)}
          options={leagueOptions}
          placeholder={loadingLeagues ? 'Cargando ligas…' : 'Selecciona una liga'}
          disabled={loadingLeagues || noLeagues}
          hint={noLeagues ? NO_LEAGUES_HINT : undefined}
        />
        {(state.mode === 'create' || state.mode === 'delete') && (
          <AmericanFootballTextField
            label="Año"
            value={state.values.year}
            onChange={(v) => state.updateField('year', v)}
            type="number"
          />
        )}
      </AmericanFootballFieldGrid>
      {state.mode === 'edit' && (
        <p className="text-sm text-slate-400">Las temporadas solo admiten crear o eliminar.</p>
      )}
    </AmericanFootballFormShell>
  );
}
