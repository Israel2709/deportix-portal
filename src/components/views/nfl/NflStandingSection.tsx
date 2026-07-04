'use client';

import { useEffect, useState } from 'react';
import {
  createNflStanding,
  deleteNflStanding,
  getNflStandings,
  getNflTeams,
  updateNflStanding,
} from '@/lib/nfl-api';
import type { NflStandingItem, NflTeamItem } from '@/lib/nfl-bff-types';
import {
  EMPTY_NFL_STANDING_FORM,
  applyTeamToStanding,
  buildNflStandingBody,
  standingToFormValues,
  validateNflStandingForm,
} from '@/lib/nfl-forms/standing-form';
import { ImageUrlInput } from '@/components/ui/ImageUrlInput';
import { NflFieldGrid, NflFormShell, NflRowActions, NflTextField } from './NflFormShell';
import { submitLabelForMode, useNflSectionState } from './useNflSectionState';

export function NflStandingSection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const state = useNflSectionState(EMPTY_NFL_STANDING_FORM, { onDataChanged });
  const [rows, setRows] = useState<NflStandingItem[]>([]);
  const [teams, setTeams] = useState<NflTeamItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadTeams() {
      try {
        const envelope = await getNflTeams({
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
        const envelope = await getNflStandings({
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
    const validation = validateNflStandingForm(state.values, state.mode);
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
      state.setConfirmDelete(`¿Eliminar la fila de clasificación ${state.values.deleteId}?`);
      return;
    }

    state.setSubmitting(true);
    try {
      const body = buildNflStandingBody(state.values);
      if (state.mode === 'create') {
        const res = await createNflStanding(body);
        state.handleSuccess('Fila de clasificación creada', res.results);
      } else if (state.mode === 'edit') {
        const res = await updateNflStanding(state.values.standingId, body);
        state.handleSuccess('Clasificación actualizada', res.results);
      } else if (state.mode === 'delete') {
        await deleteNflStanding(state.values.deleteId);
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
    <NflFormShell
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
            {rows.map((row, index) => (
              <li
                key={`${row.team.id}-${index}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 px-3 py-2 text-sm"
              >
                <span className="text-slate-200">
                  #{row.position ?? '—'} {row.team.name} · {row.won}-{row.lost}
                  {row.ties ? `-${row.ties}` : ''}
                </span>
                <NflRowActions
                  onEdit={() => {
                    state.setMode('edit');
                    state.setValues({
                      ...standingToFormValues(row),
                      standingId: String(row.team.id),
                    });
                  }}
                  onDelete={() => {
                    state.setMode('delete');
                    state.setValues({ ...state.values, deleteId: String(row.team.id) });
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
        {state.mode === 'query' && (
          <NflTextField label="Conferencia (filtro)" value={state.values.queryConference} onChange={(v) => state.updateField('queryConference', v)} />
        )}
      </NflFieldGrid>

      {state.mode === 'edit' && (
        <NflTextField label="ID fila (PATCH)" value={state.values.standingId} onChange={(v) => state.updateField('standingId', v)} />
      )}
      {state.mode === 'delete' && (
        <NflTextField label="ID a eliminar" value={state.values.deleteId} onChange={(v) => state.updateField('deleteId', v)} />
      )}

      {(state.mode === 'create' || state.mode === 'edit') && (
        <div className="space-y-4">
          <NflFieldGrid>
            <NflTextField label="Conferencia" value={state.values.conference} onChange={(v) => state.updateField('conference', v)} />
            <NflTextField label="División" value={state.values.division} onChange={(v) => state.updateField('division', v)} />
            <NflTextField label="Posición" value={state.values.position} onChange={(v) => state.updateField('position', v)} />
          </NflFieldGrid>
          {teams.length > 0 && (
            <label className="block text-sm text-slate-200">
              Equipo
              <select
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={state.values.teamId}
                onChange={(e) => {
                  const team = teams.find((t) => String(t.id) === e.target.value);
                  if (team) state.setValues(applyTeamToStanding(state.values, team));
                }}
              >
                <option value="">Seleccionar…</option>
                {teams.map((t) => (
                  <option key={String(t.id)} value={String(t.id)}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <NflFieldGrid>
            <NflTextField label="Equipo ID" value={state.values.teamId} onChange={(v) => state.updateField('teamId', v)} />
            <NflTextField label="Equipo nombre" value={state.values.teamName} onChange={(v) => state.updateField('teamName', v)} />
            <ImageUrlInput
              label="Logo equipo"
              value={state.values.teamLogo}
              onChange={(v) => state.updateField('teamLogo', v)}
              purpose="team_logo"
              entityId={state.values.teamId}
              onUploadError={(msg) => state.toast.error('Error al subir', msg)}
            />
            <ImageUrlInput
              label="Logo liga"
              value={state.values.leagueLogo}
              onChange={(v) => state.updateField('leagueLogo', v)}
              purpose="league_logo"
              entityId={state.values.leagueId}
              onUploadError={(msg) => state.toast.error('Error al subir', msg)}
            />
            <ImageUrlInput
              label="Bandera país"
              value={state.values.leagueCountryFlag}
              onChange={(v) => state.updateField('leagueCountryFlag', v)}
              purpose="flag"
              entityId={state.values.leagueCountryName}
              onUploadError={(msg) => state.toast.error('Error al subir', msg)}
            />
            <NflTextField label="Victorias" value={state.values.won} onChange={(v) => state.updateField('won', v)} />
            <NflTextField label="Derrotas" value={state.values.lost} onChange={(v) => state.updateField('lost', v)} />
            <NflTextField label="Empates" value={state.values.ties} onChange={(v) => state.updateField('ties', v)} />
            <NflTextField label="PF" value={state.values.pointsFor} onChange={(v) => state.updateField('pointsFor', v)} />
            <NflTextField label="PA" value={state.values.pointsAgainst} onChange={(v) => state.updateField('pointsAgainst', v)} />
            <NflTextField label="Diferencia" value={state.values.pointsDifference} onChange={(v) => state.updateField('pointsDifference', v)} />
          </NflFieldGrid>
          <NflFieldGrid>
            <NflTextField label="Local" value={state.values.recordHome} onChange={(v) => state.updateField('recordHome', v)} />
            <NflTextField label="Visitante" value={state.values.recordRoad} onChange={(v) => state.updateField('recordRoad', v)} />
            <NflTextField label="Conferencia" value={state.values.recordConference} onChange={(v) => state.updateField('recordConference', v)} />
            <NflTextField label="División" value={state.values.recordDivision} onChange={(v) => state.updateField('recordDivision', v)} />
            <NflTextField label="Racha" value={state.values.streak} onChange={(v) => state.updateField('streak', v)} />
          </NflFieldGrid>
        </div>
      )}
    </NflFormShell>
  );
}
