'use client';

import { useEffect, useState } from 'react';
import {
  createFormula1Team,
  deleteFormula1Team,
  getFormula1Teams,
  updateFormula1Team,
} from '@/lib/formula-1-api';
import type { Formula1TeamItem } from '@/lib/formula-1-bff-types';
import {
  EMPTY_FORMULA_1_TEAM_FORM,
  buildFormula1TeamBody,
  teamToFormValues,
  validateFormula1TeamForm,
} from '@/lib/formula-1-forms/team-form';
import { truncateCanonicalId } from '@/lib/formula-1-forms/shared';
import { ImageUrlInput } from '@/components/ui/ImageUrlInput';
import {
  AmericanFootballFieldGrid,
  AmericanFootballFormShell,
  AmericanFootballRowActions,
  AmericanFootballTextField,
} from '@/components/views/american-football/AmericanFootballFormShell';
import { submitLabelForMode, useFormula1SectionState } from './useFormula1SectionState';

export function Formula1TeamSection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const state = useFormula1SectionState(EMPTY_FORMULA_1_TEAM_FORM, { onDataChanged });
  const [rows, setRows] = useState<Formula1TeamItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingList(true);
      try {
        const envelope = await getFormula1Teams();
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

    const validation = validateFormula1TeamForm(
      state.values,
      state.mode === 'edit' ? 'edit' : state.mode === 'delete' ? 'delete' : 'create',
    );
    if (validation) {
      state.toast.error('Validación', validation);
      return;
    }

    if (state.mode === 'delete' && !state.confirmDelete) {
      state.setConfirmDelete(`¿Eliminar el equipo ${truncateCanonicalId(state.values.id)}?`);
      return;
    }

    state.setSubmitting(true);
    try {
      if (state.mode === 'create') {
        const res = await createFormula1Team(buildFormula1TeamBody(state.values));
        const created = res.response[0];
        state.handleSuccess('Equipo creado', res.results);
        if (created?.id) state.toast.info('ID asignado', created.id);
        state.setValues(EMPTY_FORMULA_1_TEAM_FORM);
      } else if (state.mode === 'edit') {
        const res = await updateFormula1Team(state.values.id, buildFormula1TeamBody(state.values));
        state.handleSuccess('Equipo actualizado', res.results);
      } else if (state.mode === 'delete') {
        await deleteFormula1Team(state.values.id);
        state.handleSuccess('Equipo eliminado');
        state.setConfirmDelete(null);
        state.setValues(EMPTY_FORMULA_1_TEAM_FORM);
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
      title="Equipos (constructores)"
      description="Constructores F1. El ID lo genera la API — úsalo en pilotos y rankings."
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
      listTitle={loadingList ? 'Cargando…' : `${rows.length} equipo(s)`}
      listContent={
        rows.length === 0 ? (
          <p className="text-sm text-slate-500">Sin equipos.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 px-3 py-2 text-sm"
              >
                <span className="text-slate-200">
                  {row.name}{' '}
                  <span className="font-mono text-xs text-slate-500" title={row.id}>
                    {truncateCanonicalId(row.id)}
                  </span>
                </span>
                <AmericanFootballRowActions
                  onEdit={() => {
                    state.setMode('edit');
                    state.setValues(teamToFormValues(row));
                  }}
                  onDelete={() => {
                    state.setMode('delete');
                    state.setValues(teamToFormValues(row));
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
            placeholder="Red Bull Racing"
          />
          <ImageUrlInput
            label="Logo"
            value={state.values.logo}
            onChange={(value) => state.updateField('logo', value)}
          />
        </AmericanFootballFieldGrid>
      )}
    </AmericanFootballFormShell>
  );
}
