'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  createFormula1RaceRanking,
  deleteFormula1RaceRanking,
  getFormula1Drivers,
  getFormula1RaceRankings,
  getFormula1Races,
  updateFormula1RaceRanking,
} from '@/lib/formula-1-api';
import type {
  Formula1DriverItem,
  Formula1RaceItem,
  Formula1RaceRankingItem,
} from '@/lib/formula-1-bff-types';
import {
  EMPTY_FORMULA_1_RACE_RANKING_FORM,
  buildFormula1RaceRankingBody,
  validateFormula1RaceRankingForm,
} from '@/lib/formula-1-forms/ranking-form';
import { truncateCanonicalId } from '@/lib/formula-1-forms/shared';
import {
  AmericanFootballFieldGrid,
  AmericanFootballFormShell,
  AmericanFootballSelectField,
  AmericanFootballTextField,
} from '@/components/views/american-football/AmericanFootballFormShell';
import { submitLabelForMode, useFormula1SectionState } from './useFormula1SectionState';

export function Formula1RaceRankingSection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const state = useFormula1SectionState(EMPTY_FORMULA_1_RACE_RANKING_FORM, { onDataChanged });
  const [rows, setRows] = useState<Formula1RaceRankingItem[]>([]);
  const [drivers, setDrivers] = useState<Formula1DriverItem[]>([]);
  const [races, setRaces] = useState<Formula1RaceItem[]>([]);
  const [seasonFilter, setSeasonFilter] = useState('');
  const [loadingList, setLoadingList] = useState(false);

  const driverOptions = useMemo(
    () => drivers.map((item) => ({ value: item.id, label: item.name })),
    [drivers],
  );
  const raceOptions = useMemo(
    () =>
      races.map((item) => ({
        value: item.id,
        label: `${item.competition.name} · ${item.type}`,
      })),
    [races],
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
    if (!seasonFilter.trim()) {
      setRaces([]);
      return;
    }
    let cancelled = false;
    async function loadRaces() {
      try {
        const envelope = await getFormula1Races({ season: seasonFilter });
        if (!cancelled) setRaces(envelope.response);
      } catch {
        if (!cancelled) setRaces([]);
      }
    }
    void loadRaces();
    return () => {
      cancelled = true;
    };
  }, [state.listKey, seasonFilter]);

  useEffect(() => {
    const raceId = state.values.queryRaceId.trim();
    if (!raceId) {
      setRows([]);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoadingList(true);
      try {
        const envelope = await getFormula1RaceRankings({ race: raceId });
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
  }, [state.listKey, state.values.queryRaceId]);

  async function handleSubmit() {
    const validation = validateFormula1RaceRankingForm(state.values, state.mode);
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
      state.setConfirmDelete(`¿Eliminar el resultado ${truncateCanonicalId(state.values.rankingId)}?`);
      return;
    }

    state.setSubmitting(true);
    try {
      if (state.mode === 'create') {
        const res = await createFormula1RaceRanking(buildFormula1RaceRankingBody(state.values));
        state.handleSuccess('Resultado de carrera creado', res.results);
        state.setValues({
          ...EMPTY_FORMULA_1_RACE_RANKING_FORM,
          queryRaceId: state.values.raceId || state.values.queryRaceId,
          raceId: state.values.raceId,
        });
      } else if (state.mode === 'edit') {
        const res = await updateFormula1RaceRanking(
          state.values.rankingId,
          buildFormula1RaceRankingBody(state.values),
        );
        state.handleSuccess('Resultado de carrera actualizado', res.results);
      } else if (state.mode === 'delete') {
        await deleteFormula1RaceRanking(state.values.rankingId);
        state.handleSuccess('Resultado de carrera eliminado');
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
      title="Resultados de carrera"
      description="Posiciones por sesión. GET requiere race (UUID). Editar/eliminar necesita UUID del documento."
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
        !state.values.queryRaceId.trim()
          ? 'Indica carrera para listar'
          : loadingList
            ? 'Cargando…'
            : `${rows.length} resultado(s)`
      }
      listContent={
        !state.values.queryRaceId.trim() ? (
          <p className="text-sm text-slate-500">Selecciona carrera (consulta) y pulsa Consultar.</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">Sin resultados.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={`${row.position}-${row.driver.id}`}
                className="rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-200"
              >
                P{row.position} · {row.driver.name}
                {row.time ? ` · ${row.time}` : ''}
                {row.gap ? ` · gap ${row.gap}` : ''}
              </li>
            ))}
          </ul>
        )
      }
    >
      <AmericanFootballFieldGrid>
        <AmericanFootballTextField
          label="Temporada (filtro carreras)"
          value={seasonFilter}
          onChange={setSeasonFilter}
          placeholder="2024"
          hint="Solo para poblar el selector de carreras"
        />
        <AmericanFootballSelectField
          label="Carrera (consulta)"
          value={state.values.queryRaceId}
          onChange={(value) => state.updateField('queryRaceId', value)}
          options={raceOptions}
          placeholder="Selecciona…"
          disabled={raceOptions.length === 0}
        />
      </AmericanFootballFieldGrid>

      {(state.mode === 'edit' || state.mode === 'delete') && (
        <AmericanFootballTextField
          label="ID del ranking (UUID documento)"
          value={state.values.rankingId}
          onChange={(value) => state.updateField('rankingId', value)}
        />
      )}

      {state.mode !== 'delete' && state.mode !== 'query' && (
        <AmericanFootballFieldGrid>
          <AmericanFootballSelectField
            label="Carrera"
            value={state.values.raceId}
            onChange={(value) => state.updateField('raceId', value)}
            options={raceOptions}
            placeholder="Selecciona…"
          />
          <AmericanFootballSelectField
            label="Piloto"
            value={state.values.driverId}
            onChange={(value) => state.updateField('driverId', value)}
            options={driverOptions}
            placeholder="Selecciona…"
          />
          <AmericanFootballTextField
            label="Posición"
            value={state.values.position}
            onChange={(value) => state.updateField('position', value)}
          />
          <AmericanFootballTextField
            label="Tiempo"
            value={state.values.time}
            onChange={(value) => state.updateField('time', value)}
            placeholder="1:33:455"
          />
          <AmericanFootballTextField
            label="Vueltas"
            value={state.values.laps}
            onChange={(value) => state.updateField('laps', value)}
          />
          <AmericanFootballTextField
            label="Grid"
            value={state.values.grid}
            onChange={(value) => state.updateField('grid', value)}
          />
          <AmericanFootballTextField
            label="Pits"
            value={state.values.pits}
            onChange={(value) => state.updateField('pits', value)}
          />
          <AmericanFootballTextField
            label="Gap"
            value={state.values.gap}
            onChange={(value) => state.updateField('gap', value)}
          />
        </AmericanFootballFieldGrid>
      )}
    </AmericanFootballFormShell>
  );
}
