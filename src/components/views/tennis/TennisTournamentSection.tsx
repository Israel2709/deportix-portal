'use client';

import { useEffect, useState } from 'react';
import {
  createTennisTournament,
  deleteTennisTournament,
  getTennisTournaments,
  updateTennisTournament,
} from '@/lib/tennis-api';
import type { TennisTournamentItem } from '@/lib/tennis-bff-types';
import {
  EMPTY_TENNIS_TOURNAMENT_FORM,
  TENNIS_CATEGORY_OPTIONS,
  TENNIS_GENDER_OPTIONS,
  TENNIS_TOURNAMENT_STATUS_OPTIONS,
  buildTennisTournamentBody,
  tournamentToFormValues,
  validateTennisTournamentForm,
} from '@/lib/tennis-forms/tournament-form';
import { truncateCanonicalId } from '@/lib/tennis-forms/shared';
import { formatTennisTournamentLabel } from '@/lib/tennis-display';
import {
  AmericanFootballFieldGrid,
  AmericanFootballFormShell,
  AmericanFootballRowActions,
  AmericanFootballSelectField,
  AmericanFootballTextField,
} from '@/components/views/american-football/AmericanFootballFormShell';
import { TennisImageField } from './TennisImageField';
import { submitLabelForMode, useTennisSectionState } from './useTennisSectionState';

export function TennisTournamentSection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const state = useTennisSectionState(EMPTY_TENNIS_TOURNAMENT_FORM, { onDataChanged });
  const [rows, setRows] = useState<TennisTournamentItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingList(true);
      try {
        const envelope = await getTennisTournaments();
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

    const validation = validateTennisTournamentForm(
      state.values,
      state.mode === 'edit' ? 'edit' : state.mode === 'delete' ? 'delete' : 'create',
    );
    if (validation) {
      state.toast.error('Validación', validation);
      return;
    }

    if (state.mode === 'delete' && !state.confirmDelete) {
      state.setConfirmDelete(`¿Eliminar el torneo ${truncateCanonicalId(state.values.id)}?`);
      return;
    }

    state.setSubmitting(true);
    try {
      if (state.mode === 'create') {
        const res = await createTennisTournament(buildTennisTournamentBody(state.values));
        const created = res.response[0];
        state.handleSuccess('Torneo creado (borrador)', res.results);
        if (created?.id) state.toast.info('ID asignado', created.id);
        state.setValues(EMPTY_TENNIS_TOURNAMENT_FORM);
      } else if (state.mode === 'edit') {
        const res = await updateTennisTournament(
          state.values.id,
          buildTennisTournamentBody(state.values),
        );
        state.handleSuccess('Torneo actualizado', res.results);
      } else if (state.mode === 'delete') {
        await deleteTennisTournament(state.values.id);
        state.handleSuccess('Torneo eliminado');
        state.setConfirmDelete(null);
        state.setValues(EMPTY_TENNIS_TOURNAMENT_FORM);
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
      title="Torneos"
      description="Edición del torneo (Singles). Grand Slam, ATP 1000 o WTA 1000. Se crea como borrador hasta publicar."
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
      listTitle={loadingList ? 'Cargando…' : `${rows.length} torneo(s)`}
      listContent={
        rows.length === 0 ? (
          <p className="text-sm text-slate-500">Sin torneos.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 px-3 py-2 text-sm"
              >
                <span className="text-slate-200">
                  {formatTennisTournamentLabel(row, { publishedStyle: 'none' })}
                  {row.published ? ' · publicado' : ' · borrador'}{' '}
                  <span className="font-mono text-xs text-slate-500" title={row.id}>
                    {truncateCanonicalId(row.id)}
                  </span>
                </span>
                <AmericanFootballRowActions
                  onEdit={() => {
                    state.setMode('edit');
                    state.setValues(tournamentToFormValues(row));
                  }}
                  onDelete={() => {
                    state.setMode('delete');
                    state.setValues(tournamentToFormValues(row));
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
            placeholder="US Open"
          />
          <AmericanFootballTextField
            label="Nombre corto"
            value={state.values.shortName}
            onChange={(value) => state.updateField('shortName', value)}
            placeholder="USO"
          />
          <AmericanFootballSelectField
            label="Categoría"
            value={state.values.category}
            onChange={(value) => state.updateField('category', value)}
            options={TENNIS_CATEGORY_OPTIONS}
          />
          <AmericanFootballSelectField
            label="Género"
            value={state.values.gender}
            onChange={(value) => state.updateField('gender', value)}
            options={TENNIS_GENDER_OPTIONS}
          />
          <AmericanFootballTextField
            label="Código país (ISO)"
            value={state.values.countryCode}
            onChange={(value) => state.updateField('countryCode', value)}
            placeholder="US"
          />
          <AmericanFootballTextField
            label="Ciudad"
            value={state.values.city}
            onChange={(value) => state.updateField('city', value)}
            placeholder="New York"
          />
          <AmericanFootballTextField
            label="Fecha inicio"
            value={state.values.startDate}
            onChange={(value) => state.updateField('startDate', value)}
            placeholder="2026-08-24"
          />
          <AmericanFootballTextField
            label="Fecha fin"
            value={state.values.endDate}
            onChange={(value) => state.updateField('endDate', value)}
            placeholder="2026-09-13"
          />
          <AmericanFootballTextField
            label="Año"
            value={state.values.year}
            onChange={(value) => state.updateField('year', value)}
            placeholder="2026"
          />
          <AmericanFootballSelectField
            label="Estado"
            value={state.values.status}
            onChange={(value) => state.updateField('status', value)}
            options={TENNIS_TOURNAMENT_STATUS_OPTIONS}
          />
          <TennisImageField
            value={state.values.imageUrl}
            onChange={(value) => state.updateField('imageUrl', value)}
            entityId={state.values.id || 'new-tournament'}
            onUploadError={(msg) => state.toast.error('Error al subir', msg)}
          />
        </AmericanFootballFieldGrid>
      )}
    </AmericanFootballFormShell>
  );
}
