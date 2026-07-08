'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  createAmericanFootballGame,
  deleteAmericanFootballGame,
  getAmericanFootballGames,
  getAmericanFootballLeagues,
  getAmericanFootballSeasons,
  getAmericanFootballTeams,
  updateAmericanFootballGame,
} from '@/lib/american-football-api';
import type { AmericanFootballGameItem, AmericanFootballLeagueItem, AmericanFootballTeamItem } from '@/lib/american-football-bff-types';
import { getCatalogGameStages } from '@/lib/catalog-api';
import type { CatalogGameStage } from '@/lib/catalog-types';
import {
  EMPTY_AMERICAN_FOOTBALL_GAME_FORM,
  applyTeamToGameSide,
  buildAmericanFootballGameBody,
  gameToFormValues,
  validateAmericanFootballGameForm,
} from '@/lib/american-football-forms/game-form';
import { truncateCanonicalId } from '@/lib/american-football-forms/shared';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import {
  AmericanFootballCheckboxField,
  AmericanFootballFieldGrid,
  AmericanFootballFormShell,
  AmericanFootballRowActions,
  AmericanFootballSelectField,
  AmericanFootballTextField,
} from './AmericanFootballFormShell';
import { submitLabelForMode, useAmericanFootballSectionState } from './useAmericanFootballSectionState';

const NO_LEAGUES_HINT = 'sin ligas cargadas, crea una liga para poder agregar partidos';
const NO_SEASONS_HINT = 'sin temporadas cargadas, agrega una temporada en el paso Temporadas';
const SELECT_LEAGUE_FIRST_HINT = 'selecciona una liga primero';
const NO_TEAMS_HINT = 'sin equipos cargados, agrega equipos en el paso Equipos';

function leagueFieldsFromItem(item: AmericanFootballLeagueItem, season: string) {
  return {
    queryLeague: item.league.id,
    leagueId: item.league.id,
    leagueName: item.league.name,
    leagueLogo: item.league.logo ?? '',
    leagueSeason: season,
    leagueCountryName: item.country.name,
    leagueCountryCode: item.country.code ?? '',
    leagueCountryFlag: item.country.flag ?? '',
  };
}

export function AmericanFootballGameSection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const state = useAmericanFootballSectionState(EMPTY_AMERICAN_FOOTBALL_GAME_FORM, { onDataChanged });
  const [leagues, setLeagues] = useState<AmericanFootballLeagueItem[]>([]);
  const [seasons, setSeasons] = useState<number[]>([]);
  const [stages, setStages] = useState<CatalogGameStage[]>([]);
  const [teams, setTeams] = useState<AmericanFootballTeamItem[]>([]);
  const [loadingLeagues, setLoadingLeagues] = useState(false);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [loadingStages, setLoadingStages] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [rows, setRows] = useState<AmericanFootballGameItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const leagueOptions = useMemo(
    () => leagues.map((item) => ({ value: item.league.id, label: item.league.name })),
    [leagues],
  );

  const seasonOptions = useMemo(
    () => seasons.map((year) => ({ value: String(year), label: String(year) })),
    [seasons],
  );

  const stageOptions = useMemo(
    () => stages.map((item) => ({ value: item.value, label: item.label })),
    [stages],
  );

  const teamOptions = useMemo(
    () => teams.map((team) => ({ value: team.id, label: team.name })),
    [teams],
  );

  const homeTeamOptions = useMemo(
    () => teamOptions.filter((option) => option.value !== state.values.awayId),
    [teamOptions, state.values.awayId],
  );

  const awayTeamOptions = useMemo(
    () => teamOptions.filter((option) => option.value !== state.values.homeId),
    [teamOptions, state.values.homeId],
  );

  const selectedLeague = useMemo(
    () => leagues.find((item) => item.league.id === state.values.queryLeague),
    [leagues, state.values.queryLeague],
  );

  const selectedLeagueLabel = selectedLeague?.league.name ?? '—';

  useEffect(() => {
    let cancelled = false;
    async function loadStages() {
      setLoadingStages(true);
      try {
        const loaded = await getCatalogGameStages();
        if (cancelled) return;
        setStages(loaded);
        if (loaded.length > 0) {
          state.setValues((current) => {
            const stillValid = loaded.some((item) => item.value === current.stage);
            if (stillValid) return current;
            const first = loaded[0];
            return first ? { ...current, stage: first.value } : current;
          });
        }
      } catch {
        if (!cancelled) setStages([]);
      } finally {
        if (!cancelled) setLoadingStages(false);
      }
    }
    void loadStages();
    return () => {
      cancelled = true;
    };
  }, [state.setValues]);

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
            const match = loaded.find((item) => item.league.id === current.queryLeague);
            if (match) {
              return {
                ...current,
                ...leagueFieldsFromItem(match, current.querySeason),
              };
            }
            const first = loaded[0];
            return first
              ? {
                  ...current,
                  ...leagueFieldsFromItem(first, current.querySeason),
                }
              : current;
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
      state.setValues((current) =>
        current.querySeason || current.homeId || current.awayId
          ? { ...current, querySeason: '', homeId: '', homeName: '', homeLogo: '', awayId: '', awayName: '', awayLogo: '' }
          : current,
      );
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
            return current.querySeason || current.homeId || current.awayId
              ? {
                  ...current,
                  querySeason: '',
                  leagueSeason: '',
                  homeId: '',
                  homeName: '',
                  homeLogo: '',
                  awayId: '',
                  awayName: '',
                  awayLogo: '',
                }
              : current;
          }
          const stillValid = loaded.some((year) => String(year) === current.querySeason);
          const season = stillValid ? current.querySeason : String(loaded[0]);
          const league = leagues.find((item) => item.league.id === current.queryLeague);
          return {
            ...current,
            querySeason: season,
            leagueSeason: season,
            ...(league ? leagueFieldsFromItem(league, season) : {}),
            ...(stillValid
              ? {}
              : { homeId: '', homeName: '', homeLogo: '', awayId: '', awayName: '', awayLogo: '' }),
          };
        });
      } catch {
        if (!cancelled) {
          setSeasons([]);
          state.setValues((current) => ({ ...current, querySeason: '', leagueSeason: '' }));
        }
      } finally {
        if (!cancelled) setLoadingSeasons(false);
      }
    }
    void loadSeasons();
    return () => {
      cancelled = true;
    };
  }, [state.listKey, state.values.queryLeague, state.setValues, leagues]);

  useEffect(() => {
    if (!state.values.queryLeague.trim() || !state.values.querySeason.trim()) {
      setTeams([]);
      return;
    }

    let cancelled = false;
    async function loadTeams() {
      setLoadingTeams(true);
      try {
        const envelope = await getAmericanFootballTeams({
          league: state.values.queryLeague,
          season: state.values.querySeason,
        });
        if (!cancelled) setTeams(envelope.response);
      } catch {
        if (!cancelled) setTeams([]);
      } finally {
        if (!cancelled) setLoadingTeams(false);
      }
    }
    void loadTeams();
    return () => {
      cancelled = true;
    };
  }, [state.listKey, state.values.queryLeague, state.values.querySeason]);

  useEffect(() => {
    if (state.mode !== 'query' && state.mode !== 'create' && state.mode !== 'edit') return;
    if (!state.values.queryLeague.trim() || !state.values.querySeason.trim()) {
      if (!state.values.queryGameId.trim()) {
        setRows([]);
        return;
      }
    }

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
  }, [
    state.listKey,
    state.mode,
    state.values.queryGameId,
    state.values.queryLeague,
    state.values.querySeason,
    state.values.queryTeam,
    state.values.queryTimezone,
  ]);

  function handleLeagueChange(leagueId: string) {
    const league = leagues.find((item) => item.league.id === leagueId);
    if (!league) {
      state.updateField('queryLeague', leagueId);
      return;
    }
    state.setValues({
      ...state.values,
      ...leagueFieldsFromItem(league, ''),
      querySeason: '',
      homeId: '',
      homeName: '',
      homeLogo: '',
      awayId: '',
      awayName: '',
      awayLogo: '',
    });
  }

  function handleSeasonChange(season: string) {
    const league = leagues.find((item) => item.league.id === state.values.queryLeague);
    state.setValues({
      ...state.values,
      querySeason: season,
      leagueSeason: season,
      ...(league ? leagueFieldsFromItem(league, season) : {}),
      homeId: '',
      homeName: '',
      homeLogo: '',
      awayId: '',
      awayName: '',
      awayLogo: '',
    });
  }

  function applyTeam(side: 'home' | 'away', teamId: string) {
    const team = teams.find((item) => item.id === teamId);
    if (team) state.setValues(applyTeamToGameSide(state.values, side, team));
  }

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
        state.setValues({
          ...state.values,
          week: '',
          dateDate: '',
          dateTime: '',
          venueName: '',
          venueCity: '',
          homeId: '',
          homeName: '',
          homeLogo: '',
          awayId: '',
          awayName: '',
          awayLogo: '',
        });
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

  const noLeagues = !loadingLeagues && leagues.length === 0;
  const hasLeague = Boolean(state.values.queryLeague.trim());
  const noSeasons = hasLeague && !loadingSeasons && seasons.length === 0;
  const hasSeason = Boolean(state.values.querySeason.trim());
  const noTeams = hasLeague && hasSeason && !loadingTeams && teams.length === 0;

  const seasonHint = !hasLeague ? SELECT_LEAGUE_FIRST_HINT : noSeasons ? NO_SEASONS_HINT : undefined;
  const seasonDisabled = loadingSeasons || !hasLeague || noSeasons;

  const teamsDisabled = loadingTeams || !hasLeague || !hasSeason || noTeams;
  const teamsHint = !hasLeague
    ? SELECT_LEAGUE_FIRST_HINT
    : !hasSeason
      ? 'selecciona una temporada primero'
      : noTeams
        ? NO_TEAMS_HINT
        : undefined;

  return (
    <AmericanFootballFormShell
      step={step}
      title="Partidos"
      description="Elige liga, temporada y equipos. El ID del partido lo genera la API al crear."
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
          : `${rows.length} partido(s) — ${selectedLeagueLabel}${state.values.querySeason ? ` · ${state.values.querySeason}` : ''}`
      }
      listContent={
        !hasLeague ? (
          <p className="text-sm text-slate-500">Selecciona una liga para ver partidos.</p>
        ) : !hasSeason ? (
          <p className="text-sm text-slate-500">Selecciona una temporada para ver partidos.</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">Sin partidos para esta liga y temporada.</p>
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
      {(state.mode === 'query' || state.mode === 'create' || state.mode === 'edit') && (
        <AmericanFootballFieldGrid>
          <AmericanFootballSelectField
            label="Liga"
            value={state.values.queryLeague}
            onChange={handleLeagueChange}
            options={leagueOptions}
            placeholder={loadingLeagues ? 'Cargando ligas…' : 'Selecciona una liga'}
            disabled={loadingLeagues || noLeagues}
            hint={noLeagues ? NO_LEAGUES_HINT : undefined}
          />
          <AmericanFootballSelectField
            label="Temporada"
            value={state.values.querySeason}
            onChange={handleSeasonChange}
            options={seasonOptions}
            placeholder={loadingSeasons ? 'Cargando temporadas…' : hasLeague ? 'Selecciona una temporada' : '—'}
            disabled={seasonDisabled}
            hint={seasonHint}
          />
        </AmericanFootballFieldGrid>
      )}

      {state.mode === 'query' && (
        <AmericanFootballFieldGrid>
          <AmericanFootballTextField
            label="Timezone"
            value={state.values.queryTimezone}
            onChange={(value) => state.updateField('queryTimezone', value)}
          />
          <AmericanFootballTextField
            label="Equipo (filtro, UUID)"
            value={state.values.queryTeam}
            onChange={(value) => state.updateField('queryTeam', value)}
          />
          <AmericanFootballTextField
            label="ID partido (UUID)"
            value={state.values.queryGameId}
            onChange={(value) => state.updateField('queryGameId', value)}
            hint="Opcional: consulta directa por id"
          />
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

          <AmericanFootballFieldGrid>
            <AmericanFootballSelectField
              label="Etapa"
              value={state.values.stage}
              onChange={(value) => state.updateField('stage', value)}
              options={stageOptions}
              placeholder={loadingStages ? 'Cargando etapas…' : 'Selecciona una etapa'}
              disabled={loadingStages || stageOptions.length === 0}
            />
            <AmericanFootballTextField label="Semana" value={state.values.week} onChange={(value) => state.updateField('week', value)} />
            <AmericanFootballTextField label="Fecha" value={state.values.dateDate} onChange={(value) => state.updateField('dateDate', value)} type="date" />
            <AmericanFootballTextField label="Hora" value={state.values.dateTime} onChange={(value) => state.updateField('dateTime', value)} />
            <AmericanFootballTextField label="Timezone" value={state.values.dateTimezone} onChange={(value) => state.updateField('dateTimezone', value)} />
          </AmericanFootballFieldGrid>

          <AmericanFootballFieldGrid>
            <AmericanFootballTextField label="Estadio" value={state.values.venueName} onChange={(value) => state.updateField('venueName', value)} />
            <AmericanFootballTextField label="Ciudad" value={state.values.venueCity} onChange={(value) => state.updateField('venueCity', value)} />
            <AmericanFootballTextField label="Estado (short)" value={state.values.statusShort} onChange={(value) => state.updateField('statusShort', value)} />
            <AmericanFootballTextField label="Estado (long)" value={state.values.statusLong} onChange={(value) => state.updateField('statusLong', value)} />
          </AmericanFootballFieldGrid>

          <AmericanFootballFieldGrid>
            <SearchableSelect
              label="Local"
              value={state.values.homeId}
              onChange={(teamId) => applyTeam('home', teamId)}
              options={homeTeamOptions}
              placeholder={teamsDisabled ? '—' : 'Buscar equipo local…'}
              disabled={teamsDisabled}
              hint={teamsHint}
              emptyMessage="Ningún equipo coincide"
            />
            <SearchableSelect
              label="Visitante"
              value={state.values.awayId}
              onChange={(teamId) => applyTeam('away', teamId)}
              options={awayTeamOptions}
              placeholder={teamsDisabled ? '—' : 'Buscar equipo visitante…'}
              disabled={teamsDisabled}
              hint={teamsHint}
              emptyMessage="Ningún equipo coincide"
            />
          </AmericanFootballFieldGrid>

          {state.mode === 'edit' && (
            <AmericanFootballCheckboxField
              label="Reemplazo total (?replace=true)"
              checked={state.values.replaceOnPatch}
              onChange={(checked) => state.updateField('replaceOnPatch', checked)}
            />
          )}
        </div>
      )}
    </AmericanFootballFormShell>
  );
}
