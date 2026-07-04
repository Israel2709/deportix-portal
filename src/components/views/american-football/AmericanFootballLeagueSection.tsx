'use client';

import { useEffect, useState } from 'react';
import {
  createAmericanFootballLeague,
  deleteAmericanFootballLeague,
  getAmericanFootballLeagues,
  updateAmericanFootballLeague,
} from '@/lib/american-football-api';
import type { AmericanFootballLeagueItem } from '@/lib/american-football-bff-types';
import {
  DEFAULT_AMERICAN_FOOTBALL_LEAGUE_SEASON,
  EMPTY_AMERICAN_FOOTBALL_LEAGUE_FORM,
  buildAmericanFootballLeagueBody,
  leagueToFormValues,
  validateAmericanFootballLeagueForm,
  type AmericanFootballLeagueSeasonFormValues,
} from '@/lib/american-football-forms/league-form';
import { AMERICAN_FOOTBALL_BUTTON_SECONDARY } from '@/lib/american-football-forms/shared';
import { ImageUrlInput } from '@/components/ui/ImageUrlInput';
import {
  AmericanFootballCheckboxField,
  AmericanFootballFieldGrid,
  AmericanFootballFormShell,
  AmericanFootballRowActions,
  AmericanFootballTextField,
} from './AmericanFootballFormShell';
import { submitLabelForMode, useAmericanFootballSectionState } from './useAmericanFootballSectionState';

export function AmericanFootballLeagueSection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const state = useAmericanFootballSectionState(EMPTY_AMERICAN_FOOTBALL_LEAGUE_FORM, { onDataChanged });
  const [rows, setRows] = useState<AmericanFootballLeagueItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingList(true);
      try {
        const envelope = await getAmericanFootballLeagues();
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

  function updateSeason(index: number, patch: Partial<AmericanFootballLeagueSeasonFormValues>) {
    state.setValues((current) => ({
      ...current,
      seasons: current.seasons.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  }

  async function handleSubmit() {
    if (state.mode === 'query') {
      state.reloadList();
      state.toast.info('Consulta actualizada');
      return;
    }

    const validation = validateAmericanFootballLeagueForm(
      state.values,
      state.mode === 'edit' ? 'edit' : state.mode === 'delete' ? 'delete' : 'create',
    );
    if (validation) {
      state.toast.error('Validación', validation);
      return;
    }

    if (state.mode === 'delete' && !state.confirmDelete) {
      state.setConfirmDelete(`¿Eliminar la liga con ID ${state.values.externalId}?`);
      return;
    }

    state.setSubmitting(true);
    try {
      if (state.mode === 'create') {
        const res = await createAmericanFootballLeague(buildAmericanFootballLeagueBody(state.values));
        state.handleSuccess('Liga creada', res.results);
        state.setValues(EMPTY_AMERICAN_FOOTBALL_LEAGUE_FORM);
      } else if (state.mode === 'edit') {
        const res = await updateAmericanFootballLeague(state.values.externalId, buildAmericanFootballLeagueBody(state.values));
        state.handleSuccess('Liga actualizada', res.results);
      } else if (state.mode === 'delete') {
        await deleteAmericanFootballLeague(state.values.externalId);
        state.handleSuccess('Liga eliminada');
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
      title="Ligas"
      description="Crea una liga con temporadas anidadas y cobertura api-sports."
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
      listTitle={loadingList ? 'Cargando…' : `${rows.length} liga(s)`}
      listContent={
        rows.length === 0 ? (
          <p className="text-sm text-slate-500">Sin ligas.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={String(row.league.id)}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 px-3 py-2 text-sm"
              >
                <span className="text-slate-200">
                  {row.league.name} (id {row.league.id}) · {row.seasons.length} temp.
                </span>
                <AmericanFootballRowActions
                  onEdit={() => {
                    state.setMode('edit');
                    state.setValues(leagueToFormValues(row));
                  }}
                  onDelete={() => {
                    state.setMode('delete');
                    state.setValues({ ...leagueToFormValues(row), externalId: String(row.league.id) });
                  }}
                />
              </li>
            ))}
          </ul>
        )
      }
    >
      {(state.mode === 'edit' || state.mode === 'delete') && (
        <AmericanFootballTextField
          label="ID externo (api-sports)"
          value={state.values.externalId}
          onChange={(v) => state.updateField('externalId', v)}
        />
      )}
      {state.mode !== 'delete' && state.mode !== 'query' && (
        <>
          <AmericanFootballFieldGrid>
            <AmericanFootballTextField label="ID liga" value={state.values.leagueId} onChange={(v) => state.updateField('leagueId', v)} />
            <AmericanFootballTextField label="Nombre" value={state.values.leagueName} onChange={(v) => state.updateField('leagueName', v)} />
            <AmericanFootballTextField label="Tipo" value={state.values.leagueType} onChange={(v) => state.updateField('leagueType', v)} />
            <ImageUrlInput
              label="Logo de liga"
              value={state.values.leagueLogo}
              onChange={(v) => state.updateField('leagueLogo', v)}
              purpose="league_logo"
              entityId={state.values.leagueId}
              onUploadError={(msg) => state.toast.error('Error al subir', msg)}
            />
            <ImageUrlInput
              label="Logo alternativo (alt_logo)"
              value={state.values.leagueAltLogo ?? ''}
              onChange={(v) => state.updateField('leagueAltLogo', v)}
              purpose="alt_logo"
              entityId={state.values.leagueId}
              onUploadError={(msg) => state.toast.error('Error al subir', msg)}
            />
          </AmericanFootballFieldGrid>
          <p className="text-sm font-medium text-slate-200">País</p>
          <AmericanFootballFieldGrid>
            <AmericanFootballTextField label="Nombre" value={state.values.countryName} onChange={(v) => state.updateField('countryName', v)} />
            <AmericanFootballTextField label="Código" value={state.values.countryCode} onChange={(v) => state.updateField('countryCode', v)} />
            <ImageUrlInput
              label="Bandera del país"
              value={state.values.countryFlag}
              onChange={(v) => state.updateField('countryFlag', v)}
              purpose="flag"
              entityId={state.values.countryName}
              onUploadError={(msg) => state.toast.error('Error al subir', msg)}
            />
          </AmericanFootballFieldGrid>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-200">Temporadas</p>
              <button
                type="button"
                className={AMERICAN_FOOTBALL_BUTTON_SECONDARY}
                onClick={() =>
                  state.setValues((c) => ({
                    ...c,
                    seasons: [...c.seasons, { ...DEFAULT_AMERICAN_FOOTBALL_LEAGUE_SEASON }],
                  }))
                }
              >
                Agregar temporada
              </button>
            </div>
            {state.values.seasons.map((season, index) => (
              <div key={index} className="rounded-md border border-slate-800 p-4 space-y-3">
                <p className="text-xs text-slate-400">Temporada {index + 1}</p>
                <AmericanFootballFieldGrid>
                  <AmericanFootballTextField label="Año" value={season.year} onChange={(v) => updateSeason(index, { year: v })} />
                  <AmericanFootballTextField label="Inicio" value={season.start} onChange={(v) => updateSeason(index, { start: v })} type="date" />
                  <AmericanFootballTextField label="Fin" value={season.end} onChange={(v) => updateSeason(index, { end: v })} type="date" />
                </AmericanFootballFieldGrid>
                <AmericanFootballCheckboxField
                  label="Temporada actual"
                  checked={season.current}
                  onChange={(checked) => updateSeason(index, { current: checked })}
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <AmericanFootballCheckboxField label="Eventos de partidos" checked={season.coverageGamesEvents} onChange={(c) => updateSeason(index, { coverageGamesEvents: c })} />
                  <AmericanFootballCheckboxField label="Estadísticas equipos" checked={season.coverageGamesTeamStats} onChange={(c) => updateSeason(index, { coverageGamesTeamStats: c })} />
                  <AmericanFootballCheckboxField label="Estadísticas jugadores (partido)" checked={season.coverageGamesPlayerStats} onChange={(c) => updateSeason(index, { coverageGamesPlayerStats: c })} />
                  <AmericanFootballCheckboxField label="Estadísticas jugadores (temporada)" checked={season.coverageSeasonPlayerStats} onChange={(c) => updateSeason(index, { coverageSeasonPlayerStats: c })} />
                  <AmericanFootballCheckboxField label="Jugadores" checked={season.coveragePlayers} onChange={(c) => updateSeason(index, { coveragePlayers: c })} />
                  <AmericanFootballCheckboxField label="Lesiones" checked={season.coverageInjuries} onChange={(c) => updateSeason(index, { coverageInjuries: c })} />
                  <AmericanFootballCheckboxField label="Clasificación" checked={season.coverageStandings} onChange={(c) => updateSeason(index, { coverageStandings: c })} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </AmericanFootballFormShell>
  );
}
