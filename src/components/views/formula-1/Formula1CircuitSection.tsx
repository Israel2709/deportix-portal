'use client';

import { useEffect, useState } from 'react';
import {
  createFormula1Circuit,
  deleteFormula1Circuit,
  getFormula1Circuits,
  updateFormula1Circuit,
} from '@/lib/formula-1-api';
import type { Formula1CircuitItem } from '@/lib/formula-1-bff-types';
import {
  EMPTY_FORMULA_1_CIRCUIT_FORM,
  buildFormula1CircuitBody,
  circuitToFormValues,
  validateFormula1CircuitForm,
} from '@/lib/formula-1-forms/circuit-form';
import { truncateCanonicalId } from '@/lib/formula-1-forms/shared';
import { ImageUrlInput } from '@/components/ui/ImageUrlInput';
import {
  AmericanFootballFieldGrid,
  AmericanFootballFormShell,
  AmericanFootballRowActions,
  AmericanFootballTextField,
} from '@/components/views/american-football/AmericanFootballFormShell';
import { submitLabelForMode, useFormula1SectionState } from './useFormula1SectionState';

export function Formula1CircuitSection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const state = useFormula1SectionState(EMPTY_FORMULA_1_CIRCUIT_FORM, { onDataChanged });
  const [rows, setRows] = useState<Formula1CircuitItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingList(true);
      try {
        const envelope = await getFormula1Circuits();
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

    const validation = validateFormula1CircuitForm(
      state.values,
      state.mode === 'edit' ? 'edit' : state.mode === 'delete' ? 'delete' : 'create',
    );
    if (validation) {
      state.toast.error('Validación', validation);
      return;
    }

    if (state.mode === 'delete' && !state.confirmDelete) {
      state.setConfirmDelete(`¿Eliminar el circuito ${truncateCanonicalId(state.values.id)}?`);
      return;
    }

    state.setSubmitting(true);
    try {
      if (state.mode === 'create') {
        const res = await createFormula1Circuit(buildFormula1CircuitBody(state.values));
        const created = res.response[0];
        state.handleSuccess('Circuito creado', res.results);
        if (created?.id) state.toast.info('ID asignado', created.id);
        state.setValues(EMPTY_FORMULA_1_CIRCUIT_FORM);
      } else if (state.mode === 'edit') {
        const res = await updateFormula1Circuit(state.values.id, buildFormula1CircuitBody(state.values));
        state.handleSuccess('Circuito actualizado', res.results);
      } else if (state.mode === 'delete') {
        await deleteFormula1Circuit(state.values.id);
        state.handleSuccess('Circuito eliminado');
        state.setConfirmDelete(null);
        state.setValues(EMPTY_FORMULA_1_CIRCUIT_FORM);
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
      title="Circuitos"
      description="Sedes. El ID lo genera la API — cópialo para carreras."
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
      listTitle={loadingList ? 'Cargando…' : `${rows.length} circuito(s)`}
      listContent={
        rows.length === 0 ? (
          <p className="text-sm text-slate-500">Sin circuitos.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 px-3 py-2 text-sm"
              >
                <span className="text-slate-200">
                  {row.name}
                  {row.country ? ` · ${row.country}` : ''}{' '}
                  <span className="font-mono text-xs text-slate-500" title={row.id}>
                    {truncateCanonicalId(row.id)}
                  </span>
                </span>
                <AmericanFootballRowActions
                  onEdit={() => {
                    state.setMode('edit');
                    state.setValues(circuitToFormValues(row));
                  }}
                  onDelete={() => {
                    state.setMode('delete');
                    state.setValues(circuitToFormValues(row));
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
            placeholder="Circuit de Monaco"
          />
          <AmericanFootballTextField
            label="País"
            value={state.values.country}
            onChange={(value) => state.updateField('country', value)}
            placeholder="Monaco"
          />
          <ImageUrlInput
            label="Imagen"
            value={state.values.image}
            onChange={(value) => state.updateField('image', value)}
          />
        </AmericanFootballFieldGrid>
      )}
    </AmericanFootballFormShell>
  );
}
