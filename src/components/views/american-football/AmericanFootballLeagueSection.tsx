'use client';

import { useEffect, useState } from 'react';
import {
  createAmericanFootballLeague,
  deleteAmericanFootballLeague,
  getAmericanFootballLeagues,
  updateAmericanFootballLeague,
} from '@/lib/american-football-api';
import type { AmericanFootballLeagueItem } from '@/lib/american-football-bff-types';
import {
  EMPTY_AMERICAN_FOOTBALL_LEAGUE_FORM,
  buildAmericanFootballLeagueBody,
  leagueToFormValues,
  validateAmericanFootballLeagueForm,
} from '@/lib/american-football-forms/league-form';
import { ImageUrlInput } from '@/components/ui/ImageUrlInput';
import { getCatalogLeagueTypes } from '@/lib/catalog-api';
import type { CatalogLeagueType } from '@/lib/catalog-types';
import { truncateCanonicalId } from '@/lib/american-football-forms/shared';
import {
  AmericanFootballFieldGrid,
  AmericanFootballFormShell,
  AmericanFootballRowActions,
  AmericanFootballSelectField,
  AmericanFootballTextField,
} from './AmericanFootballFormShell';
import { submitLabelForMode, useAmericanFootballSectionState } from './useAmericanFootballSectionState';

export function AmericanFootballLeagueSection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const state = useAmericanFootballSectionState(EMPTY_AMERICAN_FOOTBALL_LEAGUE_FORM, { onDataChanged });
  const [rows, setRows] = useState<AmericanFootballLeagueItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [leagueTypes, setLeagueTypes] = useState<CatalogLeagueType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [editSource, setEditSource] = useState<AmericanFootballLeagueItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadTypes() {
      setLoadingTypes(true);
      try {
        const types = await getCatalogLeagueTypes();
        if (cancelled) return;
        setLeagueTypes(types);
        if (types.length > 0) {
          const defaultType = types[0];
          if (defaultType) {
            state.setValues((current) => {
              const hasType = types.some((item) => item.code === current.leagueType);
              return hasType ? current : { ...current, leagueType: defaultType.code };
            });
          }
        }
      } catch {
        if (!cancelled) setLeagueTypes([]);
      } finally {
        if (!cancelled) setLoadingTypes(false);
      }
    }
    void loadTypes();
    return () => {
      cancelled = true;
    };
  }, [state.setValues]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingList(true);
      try {
        const envelope = await getAmericanFootballLeagues();
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

    const validation = validateAmericanFootballLeagueForm(
      state.values,
      state.mode === 'edit' ? 'edit' : state.mode === 'delete' ? 'delete' : 'create',
      { allowedLeagueTypes: leagueTypes.map((item) => item.code) },
    );
    if (validation) {
      state.toast.error('Validación', validation);
      return;
    }

    if (state.mode === 'delete' && !state.confirmDelete) {
      state.setConfirmDelete(`¿Eliminar la liga ${truncateCanonicalId(state.values.leagueId)}?`);
      return;
    }

    state.setSubmitting(true);
    try {
      if (state.mode === 'create') {
        const res = await createAmericanFootballLeague(buildAmericanFootballLeagueBody(state.values));
        const created = res.response[0];
        state.handleSuccess('Liga creada', res.results);
        if (created?.league.id) {
          state.toast.info('ID asignado', created.league.id);
        }
        state.setValues(EMPTY_AMERICAN_FOOTBALL_LEAGUE_FORM);
      } else if (state.mode === 'edit') {
        const res = await updateAmericanFootballLeague(
          state.values.leagueId,
          buildAmericanFootballLeagueBody(state.values, editSource?.seasons ?? []),
        );
        state.handleSuccess('Liga actualizada', res.results);
        setEditSource(null);
      } else if (state.mode === 'delete') {
        await deleteAmericanFootballLeague(state.values.leagueId);
        state.handleSuccess('Liga eliminada');
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
      title="Ligas"
      description="Crea o edita ligas. El ID lo genera la API — cópialo para los pasos siguientes."
      mode={state.mode}
      onModeChange={(mode) => {
        state.setMode(mode);
        state.setConfirmDelete(null);
        if (mode !== 'edit') setEditSource(null);
      }}
      onSubmit={() => void handleSubmit()}
      submitting={state.submitting}
      submitLabel={submitLabelForMode(state.mode)}
      confirmDelete={state.confirmDelete}
      onConfirmDelete={() => void handleSubmit()}
      onCancelDelete={() => state.setConfirmDelete(null)}
      listTitle={loadingList ? 'Cargando…' : `${rows.length} liga(s)`}
      listContent={
        rows.length === 0 ? (
          <p className="text-sm text-slate-500">Sin ligas.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={row.league.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 px-3 py-2 text-sm"
              >
                <span className="text-slate-200">
                  {row.league.name}{' '}
                  <span className="font-mono text-xs text-slate-500" title={row.league.id}>
                    {truncateCanonicalId(row.league.id)}
                  </span>
                  · {row.seasons.length} temp.
                </span>
                <AmericanFootballRowActions
                  onEdit={() => {
                    state.setMode('edit');
                    state.setValues(leagueToFormValues(row));
                    setEditSource(row);
                  }}
                  onDelete={() => {
                    state.setMode('delete');
                    state.setValues(leagueToFormValues(row));
                    setEditSource(null);
                  }}
                />
              </li>
            ))}
          </ul>
        )
      }
    >
      {(state.mode === 'edit' || state.mode === 'delete') && state.values.leagueId && (
        <p className="text-xs font-mono text-slate-400">
          {state.mode === 'delete' ? 'Eliminar' : 'Editar'}: {state.values.leagueId}
        </p>
      )}
      {state.mode !== 'delete' && state.mode !== 'query' && (
        <>
          <AmericanFootballFieldGrid>
            <AmericanFootballTextField label="Nombre" value={state.values.leagueName} onChange={(v) => state.updateField('leagueName', v)} />
            <AmericanFootballSelectField
              label="Tipo"
              value={state.values.leagueType}
              onChange={(v) => state.updateField('leagueType', v)}
              options={leagueTypes.map((item) => ({ value: item.code, label: `${item.label} (${item.code})` }))}
              placeholder={loadingTypes ? 'Cargando catálogo…' : 'Sin tipos disponibles'}
              disabled={loadingTypes}
              hint="Valores del catálogo global api-sports (Firestore league_types)."
            />
            <ImageUrlInput
              label="Logo de liga"
              value={state.values.leagueLogo}
              onChange={(v) => state.updateField('leagueLogo', v)}
              purpose="league_logo"
              entityId={state.values.leagueId || 'new-league'}
              onUploadError={(msg) => state.toast.error('Error al subir', msg)}
              className=""
              layout="stack"
            />
            <ImageUrlInput
              label="Logo alternativo (alt_logo)"
              value={state.values.leagueAltLogo ?? ''}
              onChange={(v) => state.updateField('leagueAltLogo', v)}
              purpose="alt_logo"
              entityId={state.values.leagueId || 'new-league'}
              onUploadError={(msg) => state.toast.error('Error al subir', msg)}
              className=""
              layout="stack"
            />
          </AmericanFootballFieldGrid>
          <p className="text-sm font-medium text-slate-200">País</p>
          <AmericanFootballFieldGrid>
            <AmericanFootballTextField label="Nombre" value={state.values.countryName} onChange={(v) => state.updateField('countryName', v)} />
            <AmericanFootballTextField label="Código" value={state.values.countryCode} onChange={(v) => state.updateField('countryCode', v)} />
            <ImageUrlInput
              label="Bandera del país"
              value={state.values.countryFlag}
              onChange={(v) => state.updateField('countryFlag', v)}
              purpose="flag"
              entityId={state.values.countryName}
              onUploadError={(msg) => state.toast.error('Error al subir', msg)}
              className=""
              layout="stack"
            />
          </AmericanFootballFieldGrid>
          {state.mode === 'create' && (
            <p className="text-xs text-slate-400">
              Después de crear la liga, ve al paso <strong className="text-slate-300">Temporadas</strong> para registrar años y
              cobertura.
            </p>
          )}
        </>
      )}
    </AmericanFootballFormShell>
  );
}
