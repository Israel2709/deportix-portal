'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  createFormula1Race,
  deleteFormula1Race,
  getFormula1Circuits,
  getFormula1Competitions,
  getFormula1Races,
  updateFormula1Race,
} from '@/lib/formula-1-api';
import type {
  Formula1CircuitItem,
  Formula1CompetitionItem,
  Formula1RaceItem,
} from '@/lib/formula-1-bff-types';
import {
  EMPTY_FORMULA_1_RACE_FORM,
  buildFormula1RaceBody,
  raceToFormValues,
  validateFormula1RaceForm,
} from '@/lib/formula-1-forms/race-form';
import { truncateCanonicalId } from '@/lib/formula-1-forms/shared';
import {
  AmericanFootballFieldGrid,
  AmericanFootballFormShell,
  AmericanFootballRowActions,
  AmericanFootballSelectField,
  AmericanFootballTextField,
} from '@/components/views/american-football/AmericanFootballFormShell';
import { submitLabelForMode, useFormula1SectionState } from './useFormula1SectionState';

const RACE_TYPES = [
  'Race',
  'Qualifying',
  'Sprint',
  'Sprint Qualifying',
  '1st Practice',
  '2nd Practice',
  '3rd Practice',
];

export function Formula1RaceSection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const state = useFormula1SectionState(EMPTY_FORMULA_1_RACE_FORM, { onDataChanged });
  const [rows, setRows] = useState<Formula1RaceItem[]>([]);
  const [competitions, setCompetitions] = useState<Formula1CompetitionItem[]>([]);
  const [circuits, setCircuits] = useState<Formula1CircuitItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const competitionOptions = useMemo(
    () => competitions.map((item) => ({ value: item.id, label: item.name })),
    [competitions],
  );
  const circuitOptions = useMemo(
    () => circuits.map((item) => ({ value: item.id, label: item.name })),
    [circuits],
  );
  const typeOptions = useMemo(
    () => RACE_TYPES.map((type) => ({ value: type, label: type })),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    async function loadCatalog() {
      try {
        const [compEnv, circuitEnv] = await Promise.all([
          getFormula1Competitions(),
          getFormula1Circuits(),
        ]);
        if (cancelled) return;
        setCompetitions(compEnv.response);
        setCircuits(circuitEnv.response);
      } catch {
        if (!cancelled) {
          setCompetitions([]);
          setCircuits([]);
        }
      }
    }
    void loadCatalog();
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
        const envelope = await getFormula1Races({ season });
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
    const validation = validateFormula1RaceForm(state.values, state.mode);
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
      state.setConfirmDelete(`¿Eliminar la carrera ${truncateCanonicalId(state.values.id)}?`);
      return;
    }

    state.setSubmitting(true);
    try {
      if (state.mode === 'create') {
        const res = await createFormula1Race(buildFormula1RaceBody(state.values));
        const created = res.response[0];
        state.handleSuccess('Carrera creada', res.results);
        if (created?.id) state.toast.info('ID asignado', created.id);
        if (state.values.season) {
          state.setValues({
            ...EMPTY_FORMULA_1_RACE_FORM,
            querySeason: state.values.season,
            season: state.values.season,
          });
        } else {
          state.setValues(EMPTY_FORMULA_1_RACE_FORM);
        }
      } else if (state.mode === 'edit') {
        const res = await updateFormula1Race(state.values.id, buildFormula1RaceBody(state.values));
        state.handleSuccess('Carrera actualizada', res.results);
      } else if (state.mode === 'delete') {
        await deleteFormula1Race(state.values.id);
        state.handleSuccess('Carrera eliminada');
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
      title="Carreras / sesiones"
      description="Calendario. Requiere season en consulta. competitionId y circuitId deben existir."
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
            : `${rows.length} sesión(es)`
      }
      listContent={
        !state.values.querySeason.trim() ? (
          <p className="text-sm text-slate-500">Usa el campo Temporada (consulta) y pulsa Consultar.</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">Sin sesiones para esta temporada.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 px-3 py-2 text-sm"
              >
                <span className="text-slate-200">
                  {row.competition.name} · {row.type} · {row.status}{' '}
                  <span className="font-mono text-xs text-slate-500" title={row.id}>
                    {truncateCanonicalId(row.id)}
                  </span>
                </span>
                <AmericanFootballRowActions
                  onEdit={() => {
                    state.setMode('edit');
                    state.setValues(raceToFormValues(row, state.values.querySeason));
                  }}
                  onDelete={() => {
                    state.setMode('delete');
                    state.setValues(raceToFormValues(row, state.values.querySeason));
                  }}
                />
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
          hint="Obligatoria para listar /formula-1/races"
        />
      </AmericanFootballFieldGrid>

      {(state.mode === 'edit' || state.mode === 'delete') && state.values.id && (
        <p className="text-xs font-mono text-slate-400">
          {state.mode === 'delete' ? 'Eliminar' : 'Editar'}: {state.values.id}
        </p>
      )}

      {state.mode !== 'delete' && state.mode !== 'query' && (
        <AmericanFootballFieldGrid>
          <AmericanFootballSelectField
            label="Competición"
            value={state.values.competitionId}
            onChange={(value) => state.updateField('competitionId', value)}
            options={competitionOptions}
            placeholder="Selecciona…"
            hint={competitions.length === 0 ? 'Crea una competición primero' : undefined}
          />
          <AmericanFootballSelectField
            label="Circuito"
            value={state.values.circuitId}
            onChange={(value) => state.updateField('circuitId', value)}
            options={circuitOptions}
            placeholder="Selecciona…"
            hint={circuits.length === 0 ? 'Crea un circuito primero' : undefined}
          />
          <AmericanFootballTextField
            label="Temporada"
            value={state.values.season}
            onChange={(value) => state.updateField('season', value)}
            placeholder="2024"
          />
          <AmericanFootballSelectField
            label="Tipo"
            value={state.values.type}
            onChange={(value) => state.updateField('type', value)}
            options={typeOptions}
          />
          <AmericanFootballTextField
            label="Fecha y hora (UTC)"
            type="datetime-local"
            value={state.values.date}
            onChange={(value) => state.updateField('date', value)}
          />
          <AmericanFootballTextField
            label="Estado"
            value={state.values.status}
            onChange={(value) => state.updateField('status', value)}
            placeholder="Scheduled"
          />
          <AmericanFootballTextField
            label="Timezone"
            value={state.values.timezone}
            onChange={(value) => state.updateField('timezone', value)}
            placeholder="utc"
          />
          <AmericanFootballTextField
            label="Distancia"
            value={state.values.distance}
            onChange={(value) => state.updateField('distance', value)}
            placeholder="260.286 km"
          />
          <AmericanFootballTextField
            label="Vueltas actuales"
            value={state.values.lapsCurrent}
            onChange={(value) => state.updateField('lapsCurrent', value)}
          />
          <AmericanFootballTextField
            label="Vueltas totales"
            value={state.values.lapsTotal}
            onChange={(value) => state.updateField('lapsTotal', value)}
          />
        </AmericanFootballFieldGrid>
      )}
    </AmericanFootballFormShell>
  );
}
