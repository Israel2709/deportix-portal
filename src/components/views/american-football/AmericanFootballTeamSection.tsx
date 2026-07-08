'use client';

import { useEffect, useState } from 'react';
import {
  createAmericanFootballTeam,
  deleteAmericanFootballTeam,
  getAmericanFootballTeams,
  updateAmericanFootballTeam,
} from '@/lib/american-football-api';
import type { AmericanFootballTeamItem } from '@/lib/american-football-bff-types';
import {
  EMPTY_AMERICAN_FOOTBALL_TEAM_FORM,
  buildAmericanFootballTeamBody,
  teamToFormValues,
  validateAmericanFootballTeamForm,
} from '@/lib/american-football-forms/team-form';
import { truncateCanonicalId } from '@/lib/american-football-forms/shared';
import { ImageUrlInput } from '@/components/ui/ImageUrlInput';
import { AmericanFootballFieldGrid, AmericanFootballFormShell, AmericanFootballRowActions, AmericanFootballTextField } from './AmericanFootballFormShell';
import { submitLabelForMode, useAmericanFootballSectionState } from './useAmericanFootballSectionState';

export function AmericanFootballTeamSection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const state = useAmericanFootballSectionState(EMPTY_AMERICAN_FOOTBALL_TEAM_FORM, { onDataChanged });
  const [rows, setRows] = useState<AmericanFootballTeamItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    if (state.mode !== 'query' && state.mode !== 'create' && state.mode !== 'edit') {
      return;
    }
    let cancelled = false;
    async function load() {
      setLoadingList(true);
      try {
        const envelope = await getAmericanFootballTeams({
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
    const validation = validateAmericanFootballTeamForm(state.values, state.mode);
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
      state.setConfirmDelete(`¿Eliminar el equipo ${truncateCanonicalId(state.values.deleteId)}?`);
      return;
    }

    state.setSubmitting(true);
    try {
      const body = buildAmericanFootballTeamBody(state.values);
      if (state.mode === 'create') {
        const res = await createAmericanFootballTeam(state.values.queryLeague, body);
        const created = res.response[0];
        state.handleSuccess('Equipo creado', res.results);
        if (created?.id) {
          state.toast.info('ID asignado', created.id);
        }
        state.setValues({ ...state.values, name: '', logo: '', altLogo: '' });
      } else if (state.mode === 'edit') {
        const res = await updateAmericanFootballTeam(state.values.teamId, body);
        state.handleSuccess('Equipo actualizado', res.results);
      } else if (state.mode === 'delete') {
        await deleteAmericanFootballTeam(state.values.deleteId);
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
    <AmericanFootballFormShell
      step={step}
      title="Equipos"
      description="El ID lo genera la API al crear. Usa el UUID de la liga en query (copia desde la lista de ligas)."
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
                    state.setValues({ ...state.values, deleteId: row.id });
                  }}
                />
              </li>
            ))}
          </ul>
        )
      }
    >
      <AmericanFootballFieldGrid>
        <AmericanFootballTextField
          label="Liga (query, UUID)"
          value={state.values.queryLeague}
          onChange={(v) => state.updateField('queryLeague', v)}
          hint="UUID de la liga — cópialo del paso Ligas"
        />
        <AmericanFootballTextField label="Temporada (query)" value={state.values.querySeason} onChange={(v) => state.updateField('querySeason', v)} />
      </AmericanFootballFieldGrid>
      {state.mode === 'edit' && (
        <p className="text-xs font-mono text-slate-400">Editando: {state.values.teamId}</p>
      )}
      {state.mode === 'delete' && state.values.deleteId && (
        <p className="text-xs font-mono text-slate-400">Eliminar: {state.values.deleteId}</p>
      )}
      {(state.mode === 'create' || state.mode === 'edit') && (
        <AmericanFootballFieldGrid>
          <AmericanFootballTextField label="Nombre" value={state.values.name} onChange={(v) => state.updateField('name', v)} />
          <ImageUrlInput
            label="Logo"
            value={state.values.logo}
            onChange={(v) => state.updateField('logo', v)}
            purpose="team_logo"
            entityId={state.values.teamId || 'new-team'}
            onUploadError={(msg) => state.toast.error('Error al subir', msg)}
          />
          <ImageUrlInput
            label="Logo alternativo (alt_logo)"
            value={state.values.altLogo}
            onChange={(v) => state.updateField('altLogo', v)}
            purpose="alt_logo"
            entityId={state.values.teamId || 'new-team'}
            onUploadError={(msg) => state.toast.error('Error al subir', msg)}
          />
        </AmericanFootballFieldGrid>
      )}
    </AmericanFootballFormShell>
  );
}
