'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  createFormula1DriverRanking,
  deleteFormula1DriverRanking,
  getFormula1DriverRankings,
  getFormula1Drivers,
  updateFormula1DriverRanking,
} from '@/lib/formula-1-api';
import type { Formula1DriverItem, Formula1DriverRankingItem } from '@/lib/formula-1-bff-types';
import {
  EMPTY_FORMULA_1_DRIVER_RANKING_FORM,
  buildFormula1DriverRankingBody,
  validateFormula1DriverRankingForm,
} from '@/lib/formula-1-forms/ranking-form';
import { truncateCanonicalId } from '@/lib/formula-1-forms/shared';
import {
  AmericanFootballFieldGrid,
  AmericanFootballFormShell,
  AmericanFootballSelectField,
  AmericanFootballTextField,
} from '@/components/views/american-football/AmericanFootballFormShell';
import { submitLabelForMode, useFormula1SectionState } from './useFormula1SectionState';

export function Formula1DriverRankingSection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const state = useFormula1SectionState(EMPTY_FORMULA_1_DRIVER_RANKING_FORM, { onDataChanged });
  const [rows, setRows] = useState<Formula1DriverRankingItem[]>([]);
  const [drivers, setDrivers] = useState<Formula1DriverItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const driverOptions = useMemo(
    () => drivers.map((item) => ({ value: item.id, label: item.name })),
    [drivers],
  );

  useEffect(() => {
    let cancelled = false;
    async function loadDrivers() {
      try {
        const envelope = await getFormula1Drivers();
        if (!cancelled) setDrivers(envelope.response);
      } catch {
        if (!cancelled) setDrivers([]);
      }
    }
    void loadDrivers();
    return () => {
      cancelled = true;
    };
  }, [state.listKey]);

  useEffect(() => {
    const season = state.values.querySeason.trim();
    if (!season) {
      setRows([]);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoadingList(true);
      try {
        const envelope = await getFormula1DriverRankings({ season });
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
  }, [state.listKey, state.values.querySeason]);

  async function handleSubmit() {
    const validation = validateFormula1DriverRankingForm(state.values, state.mode);
    if (validation) {
      state.toast.error('Validación', validation);
      return;
    }

    if (state.mode === 'query') {
      state.reloadList();
      state.toast.info('Consulta actualizada');
      return;
    }

    if (state.mode === 'delete' && !state.confirmDelete) {
      state.setConfirmDelete(`¿Eliminar el ranking ${truncateCanonicalId(state.values.rankingId)}?`);
      return;
    }

    state.setSubmitting(true);
    try {
      if (state.mode === 'create') {
        const res = await createFormula1DriverRanking(buildFormula1DriverRankingBody(state.values));
        state.handleSuccess('Ranking de piloto creado', res.results);
        state.setValues({
          ...EMPTY_FORMULA_1_DRIVER_RANKING_FORM,
          querySeason: state.values.season || state.values.querySeason,
          season: state.values.season,
        });
      } else if (state.mode === 'edit') {
        const res = await updateFormula1DriverRanking(
          state.values.rankingId,
          buildFormula1DriverRankingBody(state.values),
        );
        state.handleSuccess('Ranking de piloto actualizado', res.results);
      } else if (state.mode === 'delete') {
        await deleteFormula1DriverRanking(state.values.rankingId);
        state.handleSuccess('Ranking de piloto eliminado');
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
      title="Clasificación pilotos"
      description="Campeonato de pilotos. GET requiere season. Editar/eliminar necesita el UUID del documento (no viene en el response api-sports)."
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
        !state.values.querySeason.trim()
          ? 'Indica temporada para listar'
          : loadingList
            ? 'Cargando…'
            : `${rows.length} posición(es)`
      }
      listContent={
        !state.values.querySeason.trim() ? (
          <p className="text-sm text-slate-500">Indica temporada y pulsa Consultar.</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">Sin clasificación.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={`${row.season}-${row.position}-${row.driver.id}`}
                className="rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-200"
              >
                P{row.position} · {row.driver.name}
                {row.team?.name ? ` · ${row.team.name}` : ''} · {row.points ?? 0} pts
              </li>
            ))}
          </ul>
        )
      }
    >
      <AmericanFootballFieldGrid>
        <AmericanFootballTextField
          label="Temporada (consulta)"
          value={state.values.querySeason}
          onChange={(value) => state.updateField('querySeason', value)}
          placeholder="2024"
        />
      </AmericanFootballFieldGrid>

      {(state.mode === 'edit' || state.mode === 'delete') && (
        <AmericanFootballTextField
          label="ID del ranking (UUID documento)"
          value={state.values.rankingId}
          onChange={(value) => state.updateField('rankingId', value)}
          hint="Obligatorio para PATCH/DELETE — no se expone en el listado api-sports"
        />
      )}

      {state.mode !== 'delete' && state.mode !== 'query' && (
        <AmericanFootballFieldGrid>
          <AmericanFootballSelectField
            label="Piloto"
            value={state.values.driverId}
            onChange={(value) => state.updateField('driverId', value)}
            options={driverOptions}
            placeholder="Selecciona…"
          />
          <AmericanFootballTextField
            label="Temporada"
            value={state.values.season}
            onChange={(value) => state.updateField('season', value)}
            placeholder="2024"
          />
          <AmericanFootballTextField
            label="Posición"
            value={state.values.position}
            onChange={(value) => state.updateField('position', value)}
          />
          <AmericanFootballTextField
            label="Puntos"
            value={state.values.points}
            onChange={(value) => state.updateField('points', value)}
          />
          <AmericanFootballTextField
            label="Victorias"
            value={state.values.wins}
            onChange={(value) => state.updateField('wins', value)}
          />
          <AmericanFootballTextField
            label="Behind"
            value={state.values.behind}
            onChange={(value) => state.updateField('behind', value)}
          />
        </AmericanFootballFieldGrid>
      )}
    </AmericanFootballFormShell>
  );
}
