'use client';

import { useEffect, useState } from 'react';
import {
  createCatalogCountry,
  deleteCatalogCountry,
  getCatalogCountries,
  updateCatalogCountry,
} from '@/lib/catalog-api';
import type { CatalogCountry } from '@/lib/catalog-types';
import {
  EMPTY_AMERICAN_FOOTBALL_COUNTRY_FORM,
  buildAmericanFootballCountryBody,
  countryToFormValues,
  validateAmericanFootballCountryForm,
} from '@/lib/american-football-forms/country-form';
import {
  AmericanFootballFieldGrid,
  AmericanFootballFormShell,
  AmericanFootballRowActions,
  AmericanFootballTextField,
} from './AmericanFootballFormShell';
import { ImageUrlInput } from '@/components/ui/ImageUrlInput';
import { submitLabelForMode, useAmericanFootballSectionState } from './useAmericanFootballSectionState';

export function AmericanFootballCountrySection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const state = useAmericanFootballSectionState(EMPTY_AMERICAN_FOOTBALL_COUNTRY_FORM, { onDataChanged });
  const [rows, setRows] = useState<CatalogCountry[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingList(true);
      try {
        const filter = state.mode === 'query' && state.values.filterName.trim()
          ? state.values.filterName.trim()
          : undefined;
        const countries = await getCatalogCountries(filter ? { name: filter } : undefined);
        if (!cancelled) setRows(countries);
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
    const validation = validateAmericanFootballCountryForm(state.values, state.mode === 'query' ? 'create' : state.mode);
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
      const body = buildAmericanFootballCountryBody(state.values);
      if (state.mode === 'create') {
        await createCatalogCountry(body);
        state.handleSuccess('País creado');
        state.setValues(EMPTY_AMERICAN_FOOTBALL_COUNTRY_FORM);
      } else if (state.mode === 'edit') {
        await updateCatalogCountry(state.values.originalName || body.name, body);
        state.handleSuccess('País actualizado');
      } else if (state.mode === 'delete') {
        await deleteCatalogCountry(body.name);
        state.handleSuccess('País eliminado');
        state.setConfirmDelete(null);
        state.setValues(EMPTY_AMERICAN_FOOTBALL_COUNTRY_FORM);
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
      title="Países"
      description="Catálogo global compartido por todos los deportes (Firestore countries). Los 169 países de soccer ya están cargados; aquí puedes consultarlos o añadir personalizados."
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
                <AmericanFootballRowActions
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
        <AmericanFootballTextField
          label="Filtrar por nombre"
          value={state.values.filterName}
          onChange={(v) => state.updateField('filterName', v)}
          placeholder="USA"
        />
      )}
      {(state.mode === 'create' || state.mode === 'edit') && (
        <AmericanFootballFieldGrid>
          <AmericanFootballTextField label="Nombre" value={state.values.name} onChange={(v) => state.updateField('name', v)} />
          <AmericanFootballTextField label="Código" value={state.values.code} onChange={(v) => state.updateField('code', v)} />
          <ImageUrlInput
            label="Bandera"
            value={state.values.flag}
            onChange={(v) => state.updateField('flag', v)}
            purpose="flag"
            entityId={state.values.name || 'country'}
            onUploadError={(msg) => state.toast.error('Error al subir', msg)}
          />
        </AmericanFootballFieldGrid>
      )}
      {state.mode === 'delete' && (
        <AmericanFootballTextField label="Nombre a eliminar" value={state.values.name} onChange={(v) => state.updateField('name', v)} />
      )}
    </AmericanFootballFormShell>
  );
}
