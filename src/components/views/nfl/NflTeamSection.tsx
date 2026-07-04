'use client';

import { useEffect, useState } from 'react';
import {
  createNflTeam,
  deleteNflTeam,
  getNflTeams,
  updateNflTeam,
} from '@/lib/nfl-api';
import type { NflTeamItem } from '@/lib/nfl-bff-types';
import {
  EMPTY_NFL_TEAM_FORM,
  buildNflTeamBody,
  teamToFormValues,
  validateNflTeamForm,
} from '@/lib/nfl-forms/team-form';
import { ImageUrlInput } from '@/components/ui/ImageUrlInput';
import { NflFieldGrid, NflFormShell, NflRowActions, NflTextField } from './NflFormShell';
import { submitLabelForMode, useNflSectionState } from './useNflSectionState';

export function NflTeamSection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const state = useNflSectionState(EMPTY_NFL_TEAM_FORM, { onDataChanged });
  const [rows, setRows] = useState<NflTeamItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    if (state.mode !== 'query' && state.mode !== 'create' && state.mode !== 'edit') {
      return;
    }
    let cancelled = false;
    async function load() {
      setLoadingList(true);
      try {
        const envelope = await getNflTeams({
          league: state.values.queryLeague,
          season: state.values.querySeason,
        });
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
  }, [state.listKey, state.mode, state.values.queryLeague, state.values.querySeason]);

  async function handleSubmit() {
    const validation = validateNflTeamForm(state.values, state.mode);
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
      state.setConfirmDelete(`¿Eliminar el equipo ${state.values.deleteId}?`);
      return;
    }

    state.setSubmitting(true);
    try {
      const body = buildNflTeamBody(state.values);
      if (state.mode === 'create') {
        const res = await createNflTeam(state.values.queryLeague, body);
        state.handleSuccess('Equipo creado', res.results);
        state.setValues({ ...state.values, id: '', name: '', logo: '' });
      } else if (state.mode === 'edit') {
        const res = await updateNflTeam(state.values.teamId, body);
        state.handleSuccess('Equipo actualizado', res.results);
      } else if (state.mode === 'delete') {
        await deleteNflTeam(state.values.deleteId);
        state.handleSuccess('Equipo eliminado');
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
    <NflFormShell
      step={step}
      title="Equipos"
      description="Shape BFF: id, name, logo. Requiere liga en query al crear."
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
          <p className="text-sm text-slate-500">Sin equipos para league/season indicados.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={String(row.id)}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 px-3 py-2 text-sm"
              >
                <span className="text-slate-200">
                  {row.name} (id {row.id})
                </span>
                <NflRowActions
                  onEdit={() => {
                    state.setMode('edit');
                    state.setValues(teamToFormValues(row));
                  }}
                  onDelete={() => {
                    state.setMode('delete');
                    state.setValues({ ...state.values, deleteId: String(row.id) });
                  }}
                />
              </li>
            ))}
          </ul>
        )
      }
    >
      <NflFieldGrid>
        <NflTextField label="Liga (query)" value={state.values.queryLeague} onChange={(v) => state.updateField('queryLeague', v)} />
        <NflTextField label="Temporada (query)" value={state.values.querySeason} onChange={(v) => state.updateField('querySeason', v)} />
      </NflFieldGrid>
      {state.mode === 'edit' && (
        <NflTextField label="ID equipo (PATCH)" value={state.values.teamId} onChange={(v) => state.updateField('teamId', v)} />
      )}
      {state.mode === 'delete' && (
        <NflTextField label="ID a eliminar" value={state.values.deleteId} onChange={(v) => state.updateField('deleteId', v)} />
      )}
      {(state.mode === 'create' || state.mode === 'edit') && (
        <NflFieldGrid>
          <NflTextField label="ID api-sports" value={state.values.id} onChange={(v) => state.updateField('id', v)} />
          <NflTextField label="Nombre" value={state.values.name} onChange={(v) => state.updateField('name', v)} />
          <ImageUrlInput
            label="Logo"
            value={state.values.logo}
            onChange={(v) => state.updateField('logo', v)}
            purpose="team_logo"
            entityId={state.values.id}
            onUploadError={(msg) => state.toast.error('Error al subir', msg)}
          />
          <ImageUrlInput
            label="Logo alternativo (alt_logo)"
            value={state.values.altLogo}
            onChange={(v) => state.updateField('altLogo', v)}
            purpose="alt_logo"
            entityId={state.values.id}
            onUploadError={(msg) => state.toast.error('Error al subir', msg)}
          />
        </NflFieldGrid>
      )}
    </NflFormShell>
  );
}
