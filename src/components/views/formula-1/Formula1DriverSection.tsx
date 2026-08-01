'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  createFormula1Driver,
  deleteFormula1Driver,
  getFormula1Drivers,
  getFormula1Teams,
  updateFormula1Driver,
} from '@/lib/formula-1-api';
import type { Formula1DriverItem, Formula1TeamItem } from '@/lib/formula-1-bff-types';
import {
  EMPTY_FORMULA_1_DRIVER_FORM,
  buildFormula1DriverBody,
  driverToFormValues,
  validateFormula1DriverForm,
} from '@/lib/formula-1-forms/driver-form';
import { truncateCanonicalId } from '@/lib/formula-1-forms/shared';
import {
  AmericanFootballFieldGrid,
  AmericanFootballFormShell,
  AmericanFootballRowActions,
  AmericanFootballSelectField,
  AmericanFootballTextField,
} from '@/components/views/american-football/AmericanFootballFormShell';
import { submitLabelForMode, useFormula1SectionState } from './useFormula1SectionState';

export function Formula1DriverSection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const state = useFormula1SectionState(EMPTY_FORMULA_1_DRIVER_FORM, { onDataChanged });
  const [rows, setRows] = useState<Formula1DriverItem[]>([]);
  const [teams, setTeams] = useState<Formula1TeamItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const teamOptions = useMemo(
    () => [
      { value: '', label: 'Sin equipo' },
      ...teams.map((team) => ({ value: team.id, label: team.name })),
    ],
    [teams],
  );

  useEffect(() => {
    let cancelled = false;
    async function loadTeams() {
      try {
        const envelope = await getFormula1Teams();
        if (!cancelled) setTeams(envelope.response);
      } catch {
        if (!cancelled) setTeams([]);
      }
    }
    void loadTeams();
    return () => {
      cancelled = true;
    };
  }, [state.listKey]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingList(true);
      try {
        const envelope = await getFormula1Drivers();
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

    const validation = validateFormula1DriverForm(
      state.values,
      state.mode === 'edit' ? 'edit' : state.mode === 'delete' ? 'delete' : 'create',
    );
    if (validation) {
      state.toast.error('Validación', validation);
      return;
    }

    if (state.mode === 'delete' && !state.confirmDelete) {
      state.setConfirmDelete(`¿Eliminar el piloto ${truncateCanonicalId(state.values.id)}?`);
      return;
    }

    state.setSubmitting(true);
    try {
      if (state.mode === 'create') {
        const res = await createFormula1Driver(buildFormula1DriverBody(state.values));
        const created = res.response[0];
        state.handleSuccess('Piloto creado', res.results);
        if (created?.id) state.toast.info('ID asignado', created.id);
        state.setValues(EMPTY_FORMULA_1_DRIVER_FORM);
      } else if (state.mode === 'edit') {
        const res = await updateFormula1Driver(state.values.id, buildFormula1DriverBody(state.values));
        state.handleSuccess('Piloto actualizado', res.results);
      } else if (state.mode === 'delete') {
        await deleteFormula1Driver(state.values.id);
        state.handleSuccess('Piloto eliminado');
        state.setConfirmDelete(null);
        state.setValues(EMPTY_FORMULA_1_DRIVER_FORM);
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
      title="Pilotos"
      description="Participantes. teamId opcional pero debe existir si se indica."
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
      listTitle={loadingList ? 'Cargando…' : `${rows.length} piloto(s)`}
      listContent={
        rows.length === 0 ? (
          <p className="text-sm text-slate-500">Sin pilotos.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 px-3 py-2 text-sm"
              >
                <span className="text-slate-200">
                  {row.name}
                  {row.number != null ? ` #${row.number}` : ''}
                  {row.team?.name ? ` · ${row.team.name}` : ''}{' '}
                  <span className="font-mono text-xs text-slate-500" title={row.id}>
                    {truncateCanonicalId(row.id)}
                  </span>
                </span>
                <AmericanFootballRowActions
                  onEdit={() => {
                    state.setMode('edit');
                    state.setValues(driverToFormValues(row));
                  }}
                  onDelete={() => {
                    state.setMode('delete');
                    state.setValues(driverToFormValues(row));
                  }}
                />
              </li>
            ))}
          </ul>
        )
      }
    >
      {(state.mode === 'edit' || state.mode === 'delete') && state.values.id && (
        <p className="text-xs font-mono text-slate-400">
          {state.mode === 'delete' ? 'Eliminar' : 'Editar'}: {state.values.id}
        </p>
      )}
      {state.mode !== 'delete' && state.mode !== 'query' && (
        <AmericanFootballFieldGrid>
          <AmericanFootballTextField
            label="Nombre"
            value={state.values.name}
            onChange={(value) => state.updateField('name', value)}
            placeholder="Max Verstappen"
          />
          <AmericanFootballTextField
            label="Número"
            value={state.values.number}
            onChange={(value) => state.updateField('number', value)}
            placeholder="1"
          />
          <AmericanFootballSelectField
            label="Equipo"
            value={state.values.teamId}
            onChange={(value) => state.updateField('teamId', value)}
            options={teamOptions}
            hint={teams.length === 0 ? 'Crea un equipo primero (paso 3)' : undefined}
          />
        </AmericanFootballFieldGrid>
      )}
    </AmericanFootballFormShell>
  );
}
