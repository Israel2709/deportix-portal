'use client';

import { useEffect, useState } from 'react';
import {
  createNflCountry,
  deleteNflCountry,
  getNflCountries,
  updateNflCountry,
} from '@/lib/nfl-api';
import type { NflCountryItem } from '@/lib/nfl-bff-types';
import {
  EMPTY_NFL_COUNTRY_FORM,
  buildNflCountryBody,
  countryToFormValues,
  validateNflCountryForm,
} from '@/lib/nfl-forms/country-form';
import {
  NflFieldGrid,
  NflFormShell,
  NflRowActions,
  NflTextField,
} from './NflFormShell';
import { ImageUrlInput } from '@/components/ui/ImageUrlInput';
import { submitLabelForMode, useNflSectionState } from './useNflSectionState';

export function NflCountrySection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const state = useNflSectionState(EMPTY_NFL_COUNTRY_FORM, { onDataChanged });
  const [rows, setRows] = useState<NflCountryItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingList(true);
      try {
        const envelope = await getNflCountries(
          state.mode === 'query' && state.values.filterName.trim()
            ? state.values.filterName.trim()
            : undefined,
        );
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
  }, [state.listKey, state.mode, state.values.filterName]);

  async function handleSubmit() {
    const validation = validateNflCountryForm(state.values, state.mode === 'query' ? 'create' : state.mode);
    if (validation && state.mode !== 'query') {
      state.toast.error('Validación', validation);
      return;
    }

    if (state.mode === 'query') {
      state.reloadList();
      state.toast.info('Consulta actualizada', `${rows.length} países`);
      return;
    }

    if (state.mode === 'delete') {
      if (!state.confirmDelete) {
        state.setConfirmDelete(`¿Eliminar el país "${state.values.name}"?`);
        return;
      }
    }

    state.setSubmitting(true);
    try {
      const body = buildNflCountryBody(state.values);
      if (state.mode === 'create') {
        const res = await createNflCountry(body);
        state.handleSuccess('País creado', res.results);
        state.setValues(EMPTY_NFL_COUNTRY_FORM);
      } else if (state.mode === 'edit') {
        const res = await updateNflCountry(body);
        state.handleSuccess('País actualizado', res.results);
      } else if (state.mode === 'delete') {
        await deleteNflCountry(body);
        state.handleSuccess('País eliminado');
        state.setConfirmDelete(null);
        state.setValues(EMPTY_NFL_COUNTRY_FORM);
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
      title="Países"
      description="Catálogo opcional con shape Football v3. POST antes de ligas si necesitas países personalizados."
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
      listTitle={loadingList ? 'Cargando…' : `${rows.length} registro(s)`}
      listContent={
        rows.length === 0 ? (
          <p className="text-sm text-slate-500">Sin resultados.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={row.name}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 px-3 py-2 text-sm"
              >
                <span className="text-slate-200">
                  {row.name} {row.code ? `(${row.code})` : ''}
                </span>
                <NflRowActions
                  onEdit={() => {
                    state.setMode('edit');
                    state.setValues(countryToFormValues(row));
                  }}
                  onDelete={() => {
                    state.setMode('delete');
                    state.setValues({ ...countryToFormValues(row), name: row.name });
                  }}
                />
              </li>
            ))}
          </ul>
        )
      }
    >
      {state.mode === 'query' && (
        <NflTextField
          label="Filtrar por nombre"
          value={state.values.filterName}
          onChange={(v) => state.updateField('filterName', v)}
          placeholder="USA"
        />
      )}
      {(state.mode === 'create' || state.mode === 'edit') && (
        <NflFieldGrid>
          <NflTextField label="Nombre" value={state.values.name} onChange={(v) => state.updateField('name', v)} />
          <NflTextField label="Código" value={state.values.code} onChange={(v) => state.updateField('code', v)} />
          <ImageUrlInput
            label="Bandera"
            value={state.values.flag}
            onChange={(v) => state.updateField('flag', v)}
            purpose="flag"
            entityId={state.values.name || 'country'}
            onUploadError={(msg) => state.toast.error('Error al subir', msg)}
          />
        </NflFieldGrid>
      )}
      {state.mode === 'delete' && (
        <NflTextField label="Nombre a eliminar" value={state.values.name} onChange={(v) => state.updateField('name', v)} />
      )}
    </NflFormShell>
  );
}
