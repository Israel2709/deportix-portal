'use client';

import { useEffect, useState } from 'react';
import {
  createTennisPlayer,
  deleteTennisPlayer,
  getTennisPlayers,
  updateTennisPlayer,
} from '@/lib/tennis-api';
import type { TennisPlayerItem } from '@/lib/tennis-bff-types';
import {
  EMPTY_TENNIS_PLAYER_FORM,
  buildTennisPlayerBody,
  playerToFormValues,
  validateTennisPlayerForm,
} from '@/lib/tennis-forms/player-form';
import { truncateCanonicalId } from '@/lib/tennis-forms/shared';
import {
  AmericanFootballFieldGrid,
  AmericanFootballFormShell,
  AmericanFootballRowActions,
  AmericanFootballSelectField,
  AmericanFootballTextField,
} from '@/components/views/american-football/AmericanFootballFormShell';
import { submitLabelForMode, useTennisSectionState } from './useTennisSectionState';

export function TennisPlayerSection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const state = useTennisSectionState(EMPTY_TENNIS_PLAYER_FORM, { onDataChanged });
  const [rows, setRows] = useState<TennisPlayerItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingList(true);
      try {
        const envelope = await getTennisPlayers();
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

    const validation = validateTennisPlayerForm(
      state.values,
      state.mode === 'edit' ? 'edit' : state.mode === 'delete' ? 'delete' : 'create',
    );
    if (validation) {
      state.toast.error('Validación', validation);
      return;
    }

    if (state.mode === 'delete' && !state.confirmDelete) {
      state.setConfirmDelete(`¿Eliminar al jugador ${truncateCanonicalId(state.values.id)}?`);
      return;
    }

    state.setSubmitting(true);
    try {
      if (state.mode === 'create') {
        const res = await createTennisPlayer(buildTennisPlayerBody(state.values));
        const created = res.response[0];
        state.handleSuccess('Jugador creado', res.results);
        if (created?.id) state.toast.info('ID asignado', created.id);
        state.setValues(EMPTY_TENNIS_PLAYER_FORM);
      } else if (state.mode === 'edit') {
        const res = await updateTennisPlayer(state.values.id, buildTennisPlayerBody(state.values));
        state.handleSuccess('Jugador actualizado', res.results);
      } else if (state.mode === 'delete') {
        await deleteTennisPlayer(state.values.id);
        state.handleSuccess('Jugador eliminado');
        state.setConfirmDelete(null);
        state.setValues(EMPTY_TENNIS_PLAYER_FORM);
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
      title="Jugadores"
      description="Catálogo permanente de jugadores. Seed y entry_type se asignan por torneo (paso Entradas)."
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
      listTitle={loadingList ? 'Cargando…' : `${rows.length} jugador(es)`}
      listContent={
        rows.length === 0 ? (
          <p className="text-sm text-slate-500">Sin jugadores.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 px-3 py-2 text-sm"
              >
                <span className="text-slate-200">
                  {row.displayName} ({row.fullName}) · {row.country.code}
                  {row.published ? '' : ' · borrador'}{' '}
                  <span className="font-mono text-xs text-slate-500" title={row.id}>
                    {truncateCanonicalId(row.id)}
                  </span>
                </span>
                <AmericanFootballRowActions
                  onEdit={() => {
                    state.setMode('edit');
                    state.setValues(playerToFormValues(row));
                  }}
                  onDelete={() => {
                    state.setMode('delete');
                    state.setValues(playerToFormValues(row));
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
            label="Nombre completo"
            value={state.values.fullName}
            onChange={(value) => state.updateField('fullName', value)}
            placeholder="Carlos Alcaraz"
          />
          <AmericanFootballTextField
            label="Nombre visible"
            value={state.values.displayName}
            onChange={(value) => state.updateField('displayName', value)}
            placeholder="Alcaraz"
          />
          <AmericanFootballTextField
            label="Código país (ISO)"
            value={state.values.countryCode}
            onChange={(value) => state.updateField('countryCode', value)}
            placeholder="ES"
          />
          <AmericanFootballTextField
            label="URL foto"
            value={state.values.photoUrl}
            onChange={(value) => state.updateField('photoUrl', value)}
            placeholder="https://…"
          />
          <AmericanFootballSelectField
            label="Publicado"
            value={state.values.published}
            onChange={(value) => state.updateField('published', value)}
            options={[
              { value: 'false', label: 'Borrador' },
              { value: 'true', label: 'Publicado' },
            ]}
          />
        </AmericanFootballFieldGrid>
      )}
    </AmericanFootballFormShell>
  );
}
