'use client';

import { useEffect, useState } from 'react';
import {
  createNflGame,
  deleteNflGame,
  getNflGames,
  getNflTeams,
  updateNflGame,
} from '@/lib/nfl-api';
import type { NflGameItem, NflTeamItem } from '@/lib/nfl-bff-types';
import {
  EMPTY_NFL_GAME_FORM,
  applyTeamToGameSide,
  buildNflGameBody,
  gameToFormValues,
  validateNflGameForm,
} from '@/lib/nfl-forms/game-form';
import {
  NflCheckboxField,
  NflFieldGrid,
  NflFormShell,
  NflRowActions,
  NflTextField,
} from './NflFormShell';
import { submitLabelForMode, useNflSectionState } from './useNflSectionState';

function ScoreGrid({
  prefix,
  label,
  values,
  onChange,
}: {
  prefix: 'home' | 'away';
  label: string;
  values: Record<string, string>;
  onChange: (field: string, value: string) => void;
}) {
  const fields = ['Q1', 'Q2', 'Q3', 'Q4', 'Ot', 'Total'] as const;
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-200">{label}</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {fields.map((f) => {
          const key = `${prefix}${f}`;
          return (
            <NflTextField
              key={key}
              label={f}
              value={values[key] ?? ''}
              onChange={(v) => onChange(key, v)}
            />
          );
        })}
      </div>
    </div>
  );
}

export function NflGameSection({ step }: { step: number }) {
  const state = useNflSectionState(EMPTY_NFL_GAME_FORM);
  const [rows, setRows] = useState<NflGameItem[]>([]);
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
        const envelope = state.values.queryGameId.trim()
          ? await getNflGames({ id: state.values.queryGameId.trim() })
          : await getNflGames({
              league: state.values.queryLeague,
              season: state.values.querySeason,
              timezone: state.values.queryTimezone.trim() || undefined,
              team: state.values.queryTeam.trim() || undefined,
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
  }, [state.listKey, state.mode, state.values.queryGameId, state.values.queryLeague, state.values.querySeason, state.values.queryTeam, state.values.queryTimezone]);

  async function handleSubmit() {
    const validation = validateNflGameForm(state.values, state.mode);
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
      state.setConfirmDelete(`¿Eliminar el partido ${state.values.gameId}?`);
      return;
    }

    state.setSubmitting(true);
    try {
      const body = buildNflGameBody(state.values);
      if (state.mode === 'create') {
        const res = await createNflGame(body);
        state.handleSuccess('Partido creado', res.results);
      } else if (state.mode === 'edit') {
        const res = await updateNflGame(state.values.gameId, body, state.values.replaceOnPatch);
        state.handleSuccess('Partido actualizado', res.results);
      } else if (state.mode === 'delete') {
        await deleteNflGame(state.values.gameId);
        state.handleSuccess('Partido eliminado');
        state.setConfirmDelete(null);
      }
    } catch (err) {
      state.handleError(err, 'No se pudo completar la operación.');
      state.setConfirmDelete(null);
    } finally {
      state.setSubmitting(false);
    }
  }

  function applyTeam(side: 'home' | 'away', teamId: string) {
    const team = teams.find((t) => String(t.id) === teamId);
    if (team) state.setValues(applyTeamToGameSide(state.values, side, team));
  }

  return (
    <NflFormShell
      step={step}
      title="Partidos"
      description="Carga partidos con shape GameItem. Carga equipos antes para datos completos."
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
      listTitle={loadingList ? 'Cargando…' : `${rows.length} partido(s)`}
      listContent={
        rows.length === 0 ? (
          <p className="text-sm text-slate-500">Sin partidos.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={String(row.game.id)}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 px-3 py-2 text-sm"
              >
                <span className="text-slate-200">
                  #{row.game.id} · {row.teams.home.name} vs {row.teams.away.name}
                  {row.game.week ? ` · Sem ${row.game.week}` : ''}
                </span>
                <NflRowActions
                  onEdit={() => {
                    state.setMode('edit');
                    state.setValues(gameToFormValues(row));
                  }}
                  onDelete={() => {
                    state.setMode('delete');
                    state.setValues({ ...state.values, gameId: String(row.game.id) });
                  }}
                />
              </li>
            ))}
          </ul>
        )
      }
    >
      {state.mode === 'query' && (
        <NflFieldGrid>
          <NflTextField label="Liga" value={state.values.queryLeague} onChange={(v) => state.updateField('queryLeague', v)} />
          <NflTextField label="Temporada" value={state.values.querySeason} onChange={(v) => state.updateField('querySeason', v)} />
          <NflTextField label="Timezone" value={state.values.queryTimezone} onChange={(v) => state.updateField('queryTimezone', v)} />
          <NflTextField label="Equipo (filtro)" value={state.values.queryTeam} onChange={(v) => state.updateField('queryTeam', v)} />
          <NflTextField label="ID partido" value={state.values.queryGameId} onChange={(v) => state.updateField('queryGameId', v)} hint="Opcional: consulta directa por id" />
        </NflFieldGrid>
      )}

      {state.mode === 'delete' && (
        <NflTextField label="ID partido" value={state.values.gameId} onChange={(v) => state.updateField('gameId', v)} />
      )}

      {(state.mode === 'create' || state.mode === 'edit') && (
        <div className="space-y-4">
          <NflFieldGrid>
            <NflTextField label="ID partido" value={state.values.gameId} onChange={(v) => state.updateField('gameId', v)} />
            <NflTextField label="Etapa" value={state.values.stage} onChange={(v) => state.updateField('stage', v)} />
            <NflTextField label="Semana" value={state.values.week} onChange={(v) => state.updateField('week', v)} />
            <NflTextField label="Fecha" value={state.values.dateDate} onChange={(v) => state.updateField('dateDate', v)} type="date" />
            <NflTextField label="Hora" value={state.values.dateTime} onChange={(v) => state.updateField('dateTime', v)} />
            <NflTextField label="Timezone" value={state.values.dateTimezone} onChange={(v) => state.updateField('dateTimezone', v)} />
          </NflFieldGrid>
          <NflFieldGrid>
            <NflTextField label="Estadio" value={state.values.venueName} onChange={(v) => state.updateField('venueName', v)} />
            <NflTextField label="Ciudad" value={state.values.venueCity} onChange={(v) => state.updateField('venueCity', v)} />
            <NflTextField label="Estado (short)" value={state.values.statusShort} onChange={(v) => state.updateField('statusShort', v)} />
            <NflTextField label="Estado (long)" value={state.values.statusLong} onChange={(v) => state.updateField('statusLong', v)} />
          </NflFieldGrid>
          {state.mode === 'edit' && (
            <NflCheckboxField
              label="Reemplazo total (?replace=true)"
              checked={state.values.replaceOnPatch}
              onChange={(c) => state.updateField('replaceOnPatch', c)}
            />
          )}
          <p className="text-sm font-medium text-slate-200">Equipos</p>
          {teams.length > 0 && (
            <NflFieldGrid>
              <label className="block text-sm text-slate-200">
                Local (desde lista)
                <select
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  value=""
                  onChange={(e) => applyTeam('home', e.target.value)}
                >
                  <option value="">Seleccionar…</option>
                  {teams.map((t) => (
                    <option key={String(t.id)} value={String(t.id)}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-200">
                Visitante (desde lista)
                <select
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  value=""
                  onChange={(e) => applyTeam('away', e.target.value)}
                >
                  <option value="">Seleccionar…</option>
                  {teams.map((t) => (
                    <option key={String(t.id)} value={String(t.id)}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            </NflFieldGrid>
          )}
          <NflFieldGrid>
            <NflTextField label="Local ID" value={state.values.homeId} onChange={(v) => state.updateField('homeId', v)} />
            <NflTextField label="Local nombre" value={state.values.homeName} onChange={(v) => state.updateField('homeName', v)} />
            <NflTextField label="Visitante ID" value={state.values.awayId} onChange={(v) => state.updateField('awayId', v)} />
            <NflTextField label="Visitante nombre" value={state.values.awayName} onChange={(v) => state.updateField('awayName', v)} />
          </NflFieldGrid>
          <ScoreGrid
            prefix="home"
            label="Marcador local"
            values={state.values as unknown as Record<string, string>}
            onChange={(field, value) => state.updateField(field as keyof typeof state.values, value)}
          />
          <ScoreGrid
            prefix="away"
            label="Marcador visitante"
            values={state.values as unknown as Record<string, string>}
            onChange={(field, value) => state.updateField(field as keyof typeof state.values, value)}
          />
        </div>
      )}
    </NflFormShell>
  );
}
