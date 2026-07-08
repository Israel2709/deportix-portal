'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  createAmericanFootballTeam,
  deleteAmericanFootballTeam,
  getAmericanFootballLeagues,
  getAmericanFootballSeasons,
  getAmericanFootballTeams,
  updateAmericanFootballTeam,
} from '@/lib/american-football-api';
import type { AmericanFootballLeagueItem, AmericanFootballTeamItem } from '@/lib/american-football-bff-types';
import {
  EMPTY_AMERICAN_FOOTBALL_TEAM_FORM,
  buildAmericanFootballTeamBody,
  teamToFormValues,
  validateAmericanFootballTeamForm,
} from '@/lib/american-football-forms/team-form';
import { truncateCanonicalId } from '@/lib/american-football-forms/shared';
import { ImageUrlInput } from '@/components/ui/ImageUrlInput';
import {
  AmericanFootballFieldGrid,
  AmericanFootballFormShell,
  AmericanFootballRowActions,
  AmericanFootballSelectField,
  AmericanFootballTextField,
} from './AmericanFootballFormShell';
import { submitLabelForMode, useAmericanFootballSectionState } from './useAmericanFootballSectionState';

const NO_LEAGUES_HINT = 'sin ligas cargadas, crea una liga para poder agregar equipos';
const NO_SEASONS_HINT = 'sin temporadas cargadas, agrega una temporada en el paso Temporadas';
const SELECT_LEAGUE_FIRST_HINT = 'selecciona una liga primero';

export function AmericanFootballTeamSection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const state = useAmericanFootballSectionState(EMPTY_AMERICAN_FOOTBALL_TEAM_FORM, { onDataChanged });
  const [leagues, setLeagues] = useState<AmericanFootballLeagueItem[]>([]);
  const [seasons, setSeasons] = useState<number[]>([]);
  const [loadingLeagues, setLoadingLeagues] = useState(false);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [rows, setRows] = useState<AmericanFootballTeamItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const leagueOptions = useMemo(
    () => leagues.map((item) => ({ value: item.league.id, label: item.league.name })),
    [leagues],
  );

  const seasonOptions = useMemo(
    () => seasons.map((year) => ({ value: String(year), label: String(year) })),
    [seasons],
  );

  const selectedLeague = useMemo(
    () => leagues.find((item) => item.league.id === state.values.queryLeague),
    [leagues, state.values.queryLeague],
  );

  const selectedLeagueLabel = selectedLeague?.league.name ?? '—';

  useEffect(() => {
    let cancelled = false;
    async function loadLeagues() {
      setLoadingLeagues(true);
      try {
        const envelope = await getAmericanFootballLeagues();
        if (cancelled) return;
        const loaded = envelope.response;
        setLeagues(loaded);
        if (loaded.length > 0) {
          state.setValues((current) => {
            const stillValid = loaded.some((item) => item.league.id === current.queryLeague);
            if (stillValid) return current;
            const first = loaded[0];
            return first ? { ...current, queryLeague: first.league.id } : current;
          });
        } else {
          state.setValues((current) => ({ ...current, queryLeague: '', querySeason: '' }));
        }
      } catch {
        if (!cancelled) {
          setLeagues([]);
          state.setValues((current) => ({ ...current, queryLeague: '', querySeason: '' }));
        }
      } finally {
        if (!cancelled) setLoadingLeagues(false);
      }
    }
    void loadLeagues();
    return () => {
      cancelled = true;
    };
  }, [state.listKey, state.setValues]);

  useEffect(() => {
    if (!state.values.queryLeague.trim()) {
      setSeasons([]);
      state.setValues((current) => (current.querySeason ? { ...current, querySeason: '' } : current));
      return;
    }

    let cancelled = false;
    async function loadSeasons() {
      setLoadingSeasons(true);
      try {
        const envelope = await getAmericanFootballSeasons(state.values.queryLeague);
        if (cancelled) return;
        const loaded = envelope.response;
        setSeasons(loaded);
        state.setValues((current) => {
          if (loaded.length === 0) {
            return current.querySeason ? { ...current, querySeason: '' } : current;
          }
          const stillValid = loaded.some((year) => String(year) === current.querySeason);
          if (stillValid) return current;
          const first = loaded[0];
          return first !== undefined ? { ...current, querySeason: String(first) } : current;
        });
      } catch {
        if (!cancelled) {
          setSeasons([]);
          state.setValues((current) => (current.querySeason ? { ...current, querySeason: '' } : current));
        }
      } finally {
        if (!cancelled) setLoadingSeasons(false);
      }
    }
    void loadSeasons();
    return () => {
      cancelled = true;
    };
  }, [state.listKey, state.values.queryLeague, state.setValues]);

  useEffect(() => {
    if (state.mode !== 'query' && state.mode !== 'create' && state.mode !== 'edit') {
      return;
    }
    if (!state.values.queryLeague.trim() || !state.values.querySeason.trim()) {
      setRows([]);
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

  const noLeagues = !loadingLeagues && leagues.length === 0;
  const hasLeague = Boolean(state.values.queryLeague.trim());
  const noSeasons = hasLeague && !loadingSeasons && seasons.length === 0;

  const seasonHint = !hasLeague
    ? SELECT_LEAGUE_FIRST_HINT
    : noSeasons
      ? NO_SEASONS_HINT
      : undefined;

  const seasonDisabled = loadingSeasons || !hasLeague || noSeasons;

  return (
    <AmericanFootballFormShell
      step={step}
      title="Equipos"
      description="Elige liga y temporada, luego registra equipos. El ID lo genera la API al crear."
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
      listTitle={
        loadingList
          ? 'Cargando…'
          : `${rows.length} equipo(s) — ${selectedLeagueLabel}${state.values.querySeason ? ` · ${state.values.querySeason}` : ''}`
      }
      listContent={
        !hasLeague ? (
          <p className="text-sm text-slate-500">Selecciona una liga para ver equipos.</p>
        ) : !state.values.querySeason.trim() ? (
          <p className="text-sm text-slate-500">Selecciona una temporada para ver equipos.</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">Sin equipos para esta liga y temporada.</p>
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
                    state.setValues({ ...teamToFormValues(row), queryLeague: state.values.queryLeague, querySeason: state.values.querySeason });
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
        <AmericanFootballSelectField
          label="Liga"
          value={state.values.queryLeague}
          onChange={(v) => state.updateField('queryLeague', v)}
          options={leagueOptions}
          placeholder={loadingLeagues ? 'Cargando ligas…' : 'Selecciona una liga'}
          disabled={loadingLeagues || noLeagues}
          hint={noLeagues ? NO_LEAGUES_HINT : undefined}
        />
        <AmericanFootballSelectField
          label="Temporada"
          value={state.values.querySeason}
          onChange={(v) => state.updateField('querySeason', v)}
          options={seasonOptions}
          placeholder={
            loadingSeasons ? 'Cargando temporadas…' : hasLeague ? 'Selecciona una temporada' : '—'
          }
          disabled={seasonDisabled}
          hint={seasonHint}
        />
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
