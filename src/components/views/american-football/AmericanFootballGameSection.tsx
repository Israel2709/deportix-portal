'use client';

import { useEffect, useState } from 'react';
import {
  createAmericanFootballGame,
  deleteAmericanFootballGame,
  getAmericanFootballGames,
  getAmericanFootballTeams,
  updateAmericanFootballGame,
} from '@/lib/american-football-api';
import type { AmericanFootballGameItem, AmericanFootballTeamItem } from '@/lib/american-football-bff-types';
import {
  EMPTY_AMERICAN_FOOTBALL_GAME_FORM,
  applyTeamToGameSide,
  buildAmericanFootballGameBody,
  gameToFormValues,
  validateAmericanFootballGameForm,
} from '@/lib/american-football-forms/game-form';
import { ImageUrlInput } from '@/components/ui/ImageUrlInput';
import { truncateCanonicalId } from '@/lib/american-football-forms/shared';
import {
  AmericanFootballCheckboxField,
  AmericanFootballFieldGrid,
  AmericanFootballFormShell,
  AmericanFootballRowActions,
  AmericanFootballTextField,
} from './AmericanFootballFormShell';
import { submitLabelForMode, useAmericanFootballSectionState } from './useAmericanFootballSectionState';

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
            <AmericanFootballTextField
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

export function AmericanFootballGameSection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const state = useAmericanFootballSectionState(EMPTY_AMERICAN_FOOTBALL_GAME_FORM, { onDataChanged });
  const [rows, setRows] = useState<AmericanFootballGameItem[]>([]);
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
        const envelope = state.values.queryGameId.trim()
          ? await getAmericanFootballGames({ id: state.values.queryGameId.trim() })
          : await getAmericanFootballGames({
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
    const validation = validateAmericanFootballGameForm(state.values, state.mode);
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
      state.setConfirmDelete(`¿Eliminar el partido ${truncateCanonicalId(state.values.gameId)}?`);
      return;
    }

    state.setSubmitting(true);
    try {
      const body = buildAmericanFootballGameBody(state.values);
      if (state.mode === 'create') {
        const res = await createAmericanFootballGame(body);
        const created = res.response[0];
        state.handleSuccess('Partido creado', res.results);
        if (created?.game.id) {
          state.toast.info('ID asignado', created.game.id);
        }
      } else if (state.mode === 'edit') {
        const res = await updateAmericanFootballGame(state.values.gameId, body, state.values.replaceOnPatch);
        state.handleSuccess('Partido actualizado', res.results);
      } else if (state.mode === 'delete') {
        await deleteAmericanFootballGame(state.values.gameId);
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
    const team = teams.find((t) => t.id === teamId);
    if (team) state.setValues(applyTeamToGameSide(state.values, side, team));
  }

  return (
    <AmericanFootballFormShell
      step={step}
      title="Partidos"
      description="Carga partidos referenciando equipos y liga por UUID. El ID del partido lo genera la API."
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
                key={row.game.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 px-3 py-2 text-sm"
              >
                <span className="text-slate-200">
                  <span className="font-mono text-xs text-slate-500" title={row.game.id}>
                    {truncateCanonicalId(row.game.id)}
                  </span>{' '}
                  · {row.teams.home.name} vs {row.teams.away.name}
                  {row.game.week ? ` · Sem ${row.game.week}` : ''}
                </span>
                <AmericanFootballRowActions
                  onEdit={() => {
                    state.setMode('edit');
                    state.setValues(gameToFormValues(row));
                  }}
                  onDelete={() => {
                    state.setMode('delete');
                    state.setValues({ ...state.values, gameId: row.game.id });
                  }}
                />
              </li>
            ))}
          </ul>
        )
      }
    >
      {state.mode === 'query' && (
        <AmericanFootballFieldGrid>
          <AmericanFootballTextField label="Liga (UUID)" value={state.values.queryLeague} onChange={(v) => state.updateField('queryLeague', v)} />
          <AmericanFootballTextField label="Temporada" value={state.values.querySeason} onChange={(v) => state.updateField('querySeason', v)} />
          <AmericanFootballTextField label="Timezone" value={state.values.queryTimezone} onChange={(v) => state.updateField('queryTimezone', v)} />
          <AmericanFootballTextField label="Equipo (filtro, UUID)" value={state.values.queryTeam} onChange={(v) => state.updateField('queryTeam', v)} />
          <AmericanFootballTextField label="ID partido (UUID)" value={state.values.queryGameId} onChange={(v) => state.updateField('queryGameId', v)} hint="Opcional: consulta directa por id" />
        </AmericanFootballFieldGrid>
      )}

      {state.mode === 'delete' && state.values.gameId && (
        <p className="text-xs font-mono text-slate-400">Eliminar: {state.values.gameId}</p>
      )}

      {(state.mode === 'create' || state.mode === 'edit') && (
        <div className="space-y-4">
          {state.mode === 'edit' && (
            <p className="text-xs font-mono text-slate-400">Editando partido: {state.values.gameId}</p>
          )}
          {(state.mode === 'create') && (
            <AmericanFootballFieldGrid>
              <AmericanFootballTextField
                label="Liga (UUID, query)"
                value={state.values.queryLeague}
                onChange={(v) => {
                  state.updateField('queryLeague', v);
                  state.updateField('leagueId', v);
                }}
                hint="UUID de la liga — mismo valor se usa en liga embebida"
              />
              <AmericanFootballTextField label="Temporada (liga embebida)" value={state.values.leagueSeason} onChange={(v) => state.updateField('leagueSeason', v)} />
            </AmericanFootballFieldGrid>
          )}
          <AmericanFootballFieldGrid>
            <AmericanFootballTextField label="Etapa" value={state.values.stage} onChange={(v) => state.updateField('stage', v)} />
            <AmericanFootballTextField label="Semana" value={state.values.week} onChange={(v) => state.updateField('week', v)} />
            <AmericanFootballTextField label="Fecha" value={state.values.dateDate} onChange={(v) => state.updateField('dateDate', v)} type="date" />
            <AmericanFootballTextField label="Hora" value={state.values.dateTime} onChange={(v) => state.updateField('dateTime', v)} />
            <AmericanFootballTextField label="Timezone" value={state.values.dateTimezone} onChange={(v) => state.updateField('dateTimezone', v)} />
          </AmericanFootballFieldGrid>
          <AmericanFootballFieldGrid>
            <AmericanFootballTextField label="Estadio" value={state.values.venueName} onChange={(v) => state.updateField('venueName', v)} />
            <AmericanFootballTextField label="Ciudad" value={state.values.venueCity} onChange={(v) => state.updateField('venueCity', v)} />
            <AmericanFootballTextField label="Estado (short)" value={state.values.statusShort} onChange={(v) => state.updateField('statusShort', v)} />
            <AmericanFootballTextField label="Estado (long)" value={state.values.statusLong} onChange={(v) => state.updateField('statusLong', v)} />
          </AmericanFootballFieldGrid>
          {state.mode === 'edit' && (
            <AmericanFootballCheckboxField
              label="Reemplazo total (?replace=true)"
              checked={state.values.replaceOnPatch}
              onChange={(c) => state.updateField('replaceOnPatch', c)}
            />
          )}
          <p className="text-sm font-medium text-slate-200">Equipos</p>
          {teams.length > 0 ? (
            <AmericanFootballFieldGrid>
              <label className="block text-sm text-slate-200">
                Local
                <select
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 pl-3 py-2 text-sm"
                  value={state.values.homeId}
                  onChange={(e) => applyTeam('home', e.target.value)}
                >
                  <option value="">Seleccionar…</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-200">
                Visitante
                <select
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 pl-3 py-2 text-sm"
                  value={state.values.awayId}
                  onChange={(e) => applyTeam('away', e.target.value)}
                >
                  <option value="">Seleccionar…</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            </AmericanFootballFieldGrid>
          ) : (
            <p className="text-sm text-amber-400">Carga equipos en el paso anterior e indica liga/temporada en query.</p>
          )}
          {(state.values.homeId || state.values.awayId) && (
            <p className="text-xs font-mono text-slate-500">
              {state.values.homeId && `Local: ${truncateCanonicalId(state.values.homeId)}`}
              {state.values.homeId && state.values.awayId && ' · '}
              {state.values.awayId && `Visitante: ${truncateCanonicalId(state.values.awayId)}`}
            </p>
          )}
          <AmericanFootballFieldGrid>
            <AmericanFootballTextField label="Liga nombre" value={state.values.leagueName} onChange={(v) => state.updateField('leagueName', v)} />
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
          </AmericanFootballFieldGrid>
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
    </AmericanFootballFormShell>
  );
}
