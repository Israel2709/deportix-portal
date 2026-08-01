'use client';

import { useEffect, useState } from 'react';
import {
  createFormula1Competition,
  deleteFormula1Competition,
  getFormula1Competitions,
  updateFormula1Competition,
} from '@/lib/formula-1-api';
import type { Formula1CompetitionItem } from '@/lib/formula-1-bff-types';
import {
  EMPTY_FORMULA_1_COMPETITION_FORM,
  buildFormula1CompetitionBody,
  competitionToFormValues,
  validateFormula1CompetitionForm,
} from '@/lib/formula-1-forms/competition-form';
import { truncateCanonicalId } from '@/lib/formula-1-forms/shared';
import {
  AmericanFootballFieldGrid,
  AmericanFootballFormShell,
  AmericanFootballRowActions,
  AmericanFootballTextField,
} from '@/components/views/american-football/AmericanFootballFormShell';
import { submitLabelForMode, useFormula1SectionState } from './useFormula1SectionState';

export function Formula1CompetitionSection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const state = useFormula1SectionState(EMPTY_FORMULA_1_COMPETITION_FORM, { onDataChanged });
  const [rows, setRows] = useState<Formula1CompetitionItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingList(true);
      try {
        const envelope = await getFormula1Competitions();
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

    const validation = validateFormula1CompetitionForm(
      state.values,
      state.mode === 'edit' ? 'edit' : state.mode === 'delete' ? 'delete' : 'create',
    );
    if (validation) {
      state.toast.error('Validación', validation);
      return;
    }

    if (state.mode === 'delete' && !state.confirmDelete) {
      state.setConfirmDelete(`¿Eliminar la competición ${truncateCanonicalId(state.values.id)}?`);
      return;
    }

    state.setSubmitting(true);
    try {
      if (state.mode === 'create') {
        const res = await createFormula1Competition(buildFormula1CompetitionBody(state.values));
        const created = res.response[0];
        state.handleSuccess('Competición creada', res.results);
        if (created?.id) state.toast.info('ID asignado', created.id);
        state.setValues(EMPTY_FORMULA_1_COMPETITION_FORM);
      } else if (state.mode === 'edit') {
        const res = await updateFormula1Competition(
          state.values.id,
          buildFormula1CompetitionBody(state.values),
        );
        state.handleSuccess('Competición actualizada', res.results);
      } else if (state.mode === 'delete') {
        await deleteFormula1Competition(state.values.id);
        state.handleSuccess('Competición eliminada');
        state.setConfirmDelete(null);
        state.setValues(EMPTY_FORMULA_1_COMPETITION_FORM);
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
      title="Competiciones"
      description="Grand Prix / competiciones. El ID lo genera la API — cópialo para carreras."
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
      listTitle={loadingList ? 'Cargando…' : `${rows.length} competición(es)`}
      listContent={
        rows.length === 0 ? (
          <p className="text-sm text-slate-500">Sin competiciones.</p>
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
                    state.setValues(competitionToFormValues(row));
                  }}
                  onDelete={() => {
                    state.setMode('delete');
                    state.setValues(competitionToFormValues(row));
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
            placeholder="Monaco Grand Prix"
          />
        </AmericanFootballFieldGrid>
      )}
    </AmericanFootballFormShell>
  );
}
