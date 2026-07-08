'use client';

import { useEffect, useState } from 'react';
import {
  createAmericanFootballStanding,
  deleteAmericanFootballStanding,
  getAmericanFootballStandings,
  getAmericanFootballTeams,
  updateAmericanFootballStanding,
} from '@/lib/american-football-api';
import type { AmericanFootballStandingItem, AmericanFootballTeamItem } from '@/lib/american-football-bff-types';
import {
  EMPTY_AMERICAN_FOOTBALL_STANDING_FORM,
  applyTeamToStanding,
  buildAmericanFootballStandingBody,
  standingToFormValues,
  validateAmericanFootballStandingForm,
} from '@/lib/american-football-forms/standing-form';
import { truncateCanonicalId } from '@/lib/american-football-forms/shared';
import { ImageUrlInput } from '@/components/ui/ImageUrlInput';
import { AmericanFootballFieldGrid, AmericanFootballFormShell, AmericanFootballRowActions, AmericanFootballTextField } from './AmericanFootballFormShell';
import { submitLabelForMode, useAmericanFootballSectionState } from './useAmericanFootballSectionState';

export function AmericanFootballStandingSection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const state = useAmericanFootballSectionState(EMPTY_AMERICAN_FOOTBALL_STANDING_FORM, { onDataChanged });
  const [rows, setRows] = useState<AmericanFootballStandingItem[]>([]);
  const [teams, setTeams] = useState<AmericanFootballTeamItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadTeams() {
      try {
        const envelope = await getAmericanFootballTeams({
          league: state.values.queryLeague,
          season: state.values.querySeason,
        });
        if (!cancelled) setTeams(envelope.response);
      } catch {
        if (!cancelled) setTeams([]);
      }
    }
    void loadTeams();
    return () => {
      cancelled = true;
    };
  }, [state.values.queryLeague, state.values.querySeason, state.listKey]);

  useEffect(() => {
    if (state.mode !== 'query' && state.mode !== 'create' && state.mode !== 'edit') return;
    let cancelled = false;
    async function load() {
      setLoadingList(true);
      try {
        const envelope = await getAmericanFootballStandings({
          league: state.values.queryLeague,
          season: state.values.querySeason,
          conference: state.values.queryConference.trim() || undefined,
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
  }, [state.listKey, state.mode, state.values.queryConference, state.values.queryLeague, state.values.querySeason]);

  async function handleSubmit() {
    const validation = validateAmericanFootballStandingForm(state.values, state.mode);
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
      state.setConfirmDelete(`¿Eliminar la fila ${truncateCanonicalId(state.values.deleteId)}?`);
      return;
    }

    state.setSubmitting(true);
    try {
      const body = buildAmericanFootballStandingBody(state.values);
      if (state.mode === 'create') {
        const res = await createAmericanFootballStanding(body);
        const created = res.response[0];
        state.handleSuccess('Fila de clasificación creada', res.results);
        if (created?.id) {
          state.toast.info('ID asignado', created.id);
        }
      } else if (state.mode === 'edit') {
        const res = await updateAmericanFootballStanding(state.values.standingId, body);
        state.handleSuccess('Clasificación actualizada', res.results);
      } else if (state.mode === 'delete') {
        await deleteAmericanFootballStanding(state.values.deleteId);
        state.handleSuccess('Fila eliminada');
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
      title="Clasificación"
      description="Una fila por equipo. El equipo debe existir en la liga antes de POST."
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
      listTitle={loadingList ? 'Cargando…' : `${rows.length} fila(s)`}
      listContent={
        rows.length === 0 ? (
          <p className="text-sm text-slate-500">Sin clasificación.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 px-3 py-2 text-sm"
              >
                <span className="text-slate-200">
                  #{row.position ?? '—'} {row.team.name} · {row.won}-{row.lost}
                  {row.ties ? `-${row.ties}` : ''}{' '}
                  <span className="font-mono text-xs text-slate-500" title={row.id}>
                    {truncateCanonicalId(row.id)}
                  </span>
                </span>
                <AmericanFootballRowActions
                  onEdit={() => {
                    state.setMode('edit');
                    state.setValues(standingToFormValues(row));
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
        <AmericanFootballTextField label="Liga (query)" value={state.values.queryLeague} onChange={(v) => state.updateField('queryLeague', v)} />
        <AmericanFootballTextField label="Temporada (query)" value={state.values.querySeason} onChange={(v) => state.updateField('querySeason', v)} />
        {state.mode === 'query' && (
          <AmericanFootballTextField label="Conferencia (filtro)" value={state.values.queryConference} onChange={(v) => state.updateField('queryConference', v)} />
        )}
      </AmericanFootballFieldGrid>

      {state.mode === 'edit' && state.values.standingId && (
        <p className="text-xs font-mono text-slate-400">Editando: {state.values.standingId}</p>
      )}
      {state.mode === 'delete' && state.values.deleteId && (
        <p className="text-xs font-mono text-slate-400">Eliminar: {state.values.deleteId}</p>
      )}

      {(state.mode === 'create' || state.mode === 'edit') && (
        <div className="space-y-4">
          {(state.mode === 'create') && (
            <AmericanFootballFieldGrid>
              <AmericanFootballTextField
                label="Liga (UUID, query)"
                value={state.values.queryLeague}
                onChange={(v) => {
                  state.updateField('queryLeague', v);
                  state.updateField('leagueId', v);
                }}
              />
              <AmericanFootballTextField label="Temporada" value={state.values.leagueSeason} onChange={(v) => state.updateField('leagueSeason', v)} />
            </AmericanFootballFieldGrid>
          )}
          <AmericanFootballFieldGrid>
            <AmericanFootballTextField label="Conferencia" value={state.values.conference} onChange={(v) => state.updateField('conference', v)} />
            <AmericanFootballTextField label="División" value={state.values.division} onChange={(v) => state.updateField('division', v)} />
            <AmericanFootballTextField label="Posición" value={state.values.position} onChange={(v) => state.updateField('position', v)} />
          </AmericanFootballFieldGrid>
          {teams.length > 0 && (
            <label className="block text-sm text-slate-200">
              Equipo
              <select
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 pl-3 py-2 text-sm"
                value={state.values.teamId}
                onChange={(e) => {
                  const team = teams.find((t) => t.id === e.target.value);
                  if (team) state.setValues(applyTeamToStanding(state.values, team));
                }}
              >
                <option value="">Seleccionar…</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {state.values.teamId && (
            <p className="text-xs font-mono text-slate-500">Equipo: {truncateCanonicalId(state.values.teamId)}</p>
          )}
          <AmericanFootballFieldGrid>
            <AmericanFootballTextField label="Victorias" value={state.values.won} onChange={(v) => state.updateField('won', v)} />
            <AmericanFootballTextField label="Derrotas" value={state.values.lost} onChange={(v) => state.updateField('lost', v)} />
            <AmericanFootballTextField label="Empates" value={state.values.ties} onChange={(v) => state.updateField('ties', v)} />
            <AmericanFootballTextField label="PF" value={state.values.pointsFor} onChange={(v) => state.updateField('pointsFor', v)} />
            <AmericanFootballTextField label="PA" value={state.values.pointsAgainst} onChange={(v) => state.updateField('pointsAgainst', v)} />
            <AmericanFootballTextField label="Diferencia" value={state.values.pointsDifference} onChange={(v) => state.updateField('pointsDifference', v)} />
          </AmericanFootballFieldGrid>
          <AmericanFootballFieldGrid>
            <AmericanFootballTextField label="Local" value={state.values.recordHome} onChange={(v) => state.updateField('recordHome', v)} />
            <AmericanFootballTextField label="Visitante" value={state.values.recordRoad} onChange={(v) => state.updateField('recordRoad', v)} />
            <AmericanFootballTextField label="Conferencia" value={state.values.recordConference} onChange={(v) => state.updateField('recordConference', v)} />
            <AmericanFootballTextField label="División" value={state.values.recordDivision} onChange={(v) => state.updateField('recordDivision', v)} />
            <AmericanFootballTextField label="Racha" value={state.values.streak} onChange={(v) => state.updateField('streak', v)} />
          </AmericanFootballFieldGrid>
        </div>
      )}
    </AmericanFootballFormShell>
  );
}
