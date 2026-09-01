'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  createTennisMatch,
  deleteTennisMatch,
  getTennisPlayers,
  getTennisTournamentMatches,
  getTennisTournamentRounds,
  getTennisTournaments,
  updateTennisMatch,
} from '@/lib/tennis-api';
import type {
  TennisMatchItem,
  TennisPlayerItem,
  TennisRoundItem,
  TennisTournamentItem,
} from '@/lib/tennis-bff-types';
import {
  EMPTY_TENNIS_MATCH_FORM,
  TENNIS_MATCH_STATUS_OPTIONS,
  TENNIS_WINNER_TO_POSITION_OPTIONS,
  buildTennisMatchBody,
  buildTennisMatchUpdateBody,
  formatTennisMatchLabel,
  matchRefOptions,
  matchToFormValues,
  validateTennisMatchForm,
} from '@/lib/tennis-forms/match-form';
import { TENNIS_ENTRY_TYPE_OPTIONS } from '@/lib/tennis-forms/entry-form';
import { truncateCanonicalId } from '@/lib/tennis-forms/shared';
import { tennisTournamentToSelectOption } from '@/lib/tennis-display';
import {
  AmericanFootballFieldGrid,
  AmericanFootballFormShell,
  AmericanFootballRowActions,
  AmericanFootballSelectField,
  AmericanFootballTextField,
} from '@/components/views/american-football/AmericanFootballFormShell';
import { submitLabelForMode, useTennisSectionState } from './useTennisSectionState';

export function TennisMatchSection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const state = useTennisSectionState(EMPTY_TENNIS_MATCH_FORM, { onDataChanged });
  const [rows, setRows] = useState<TennisMatchItem[]>([]);
  const [tournaments, setTournaments] = useState<TennisTournamentItem[]>([]);
  const [rounds, setRounds] = useState<TennisRoundItem[]>([]);
  const [players, setPlayers] = useState<TennisPlayerItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const activeTournamentId =
    state.mode === 'create' ? state.values.tournamentId.trim() : state.values.queryTournamentId.trim();

  const tournamentOptions = useMemo(
    () => [
      { value: '', label: 'Selecciona un torneo' },
      ...tournaments.map((t) => tennisTournamentToSelectOption(t)),
    ],
    [tournaments],
  );

  const roundOptions = useMemo(
    () => [
      { value: '', label: 'Selecciona una ronda' },
      ...rounds.map((r) => ({ value: r.id, label: `#${r.roundNumber} ${r.name}` })),
    ],
    [rounds],
  );

  const playerOptions = useMemo(
    () => [
      { value: '', label: 'TBD / sin asignar' },
      ...players.map((p) => ({ value: p.id, label: `${p.displayName} (${p.country.code})` })),
    ],
    [players],
  );

  const bracketMatchOptions = useMemo(
    () => matchRefOptions(rows, state.values.id || undefined),
    [rows, state.values.id],
  );

  useEffect(() => {
    let cancelled = false;
    async function loadRefs() {
      try {
        const [tRes, pRes] = await Promise.all([getTennisTournaments(), getTennisPlayers()]);
        if (!cancelled) {
          setTournaments(tRes.response);
          setPlayers(pRes.response);
        }
      } catch {
        if (!cancelled) {
          setTournaments([]);
          setPlayers([]);
        }
      }
    }
    void loadRefs();
    return () => {
      cancelled = true;
    };
  }, [state.listKey]);

  useEffect(() => {
    if (!activeTournamentId) {
      setRounds([]);
      return;
    }
    let cancelled = false;
    async function loadRounds() {
      try {
        const envelope = await getTennisTournamentRounds(activeTournamentId);
        if (!cancelled) setRounds(envelope.response);
      } catch {
        if (!cancelled) setRounds([]);
      }
    }
    void loadRounds();
    return () => {
      cancelled = true;
    };
  }, [state.listKey, activeTournamentId]);

  useEffect(() => {
    if (!activeTournamentId) {
      setRows([]);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoadingList(true);
      try {
        const envelope = await getTennisTournamentMatches(activeTournamentId);
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
  }, [state.listKey, activeTournamentId]);

  async function handleSubmit() {
    const validation = validateTennisMatchForm(state.values, state.mode);
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
      state.setConfirmDelete(`¿Eliminar el partido ${truncateCanonicalId(state.values.id)}?`);
      return;
    }

    state.setSubmitting(true);
    try {
      if (state.mode === 'create') {
        const res = await createTennisMatch(buildTennisMatchBody(state.values));
        state.handleSuccess('Partido creado', res.results);
        const tid = state.values.tournamentId.trim();
        state.setValues({ ...EMPTY_TENNIS_MATCH_FORM, tournamentId: tid, queryTournamentId: tid });
      } else if (state.mode === 'edit') {
        const res = await updateTennisMatch(state.values.id, buildTennisMatchUpdateBody(state.values));
        state.handleSuccess('Partido actualizado', res.results);
      } else if (state.mode === 'delete') {
        await deleteTennisMatch(state.values.id);
        state.handleSuccess('Partido eliminado');
        state.setConfirmDelete(null);
        state.setValues({
          ...EMPTY_TENNIS_MATCH_FORM,
          queryTournamentId: state.values.queryTournamentId,
          tournamentId: state.values.tournamentId,
        });
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
      title="Partidos (bracket)"
      description="Main Draw completo con partidos futuros TBD. Conecta ganadores mediante selectores de bracket."
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
          <p className="text-sm text-slate-500">Selecciona un torneo para ver partidos.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 px-3 py-2 text-sm"
              >
                <span className="text-slate-200">
                  {formatTennisMatchLabel(row)} · {row.status}
                  {row.competitorChanged ? ' · cambio' : ''}
                  {row.published ? '' : ' · borrador'}{' '}
                  <span className="font-mono text-xs text-slate-500" title={row.id}>
                    {truncateCanonicalId(row.id)}
                  </span>
                </span>
                <AmericanFootballRowActions
                  onEdit={() => {
                    state.setMode('edit');
                    state.setValues(matchToFormValues(row, activeTournamentId));
                  }}
                  onDelete={() => {
                    state.setMode('delete');
                    state.setValues(matchToFormValues(row, activeTournamentId));
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
          label="Torneo"
          value={state.mode === 'create' ? state.values.tournamentId : state.values.queryTournamentId}
          onChange={(value) => {
            state.updateField('tournamentId', value);
            state.updateField('queryTournamentId', value);
          }}
          options={tournamentOptions}
        />
      </AmericanFootballFieldGrid>

      {(state.mode === 'edit' || state.mode === 'delete') && state.values.id && (
        <p className="text-xs font-mono text-slate-400">
          {state.mode === 'delete' ? 'Eliminar' : 'Editar'}: {state.values.id}
        </p>
      )}

      {state.mode !== 'delete' && state.mode !== 'query' && (
        <>
          <AmericanFootballFieldGrid>
            <AmericanFootballSelectField
              label="Ronda"
              value={state.values.roundId}
              onChange={(value) => state.updateField('roundId', value)}
              options={roundOptions}
              hint={rounds.length === 0 ? 'Crea rondas primero (paso 3)' : undefined}
            />
            <AmericanFootballTextField
              label="Posición en bracket"
              value={state.values.bracketPosition}
              onChange={(value) => state.updateField('bracketPosition', value)}
              placeholder="1"
            />
            <AmericanFootballSelectField
              label="Competidor 1"
              value={state.values.competitor1Id}
              onChange={(value) => state.updateField('competitor1Id', value)}
              options={playerOptions}
            />
            <AmericanFootballSelectField
              label="Competidor 2"
              value={state.values.competitor2Id}
              onChange={(value) => state.updateField('competitor2Id', value)}
              options={playerOptions}
            />
            <AmericanFootballTextField
              label="Fecha y hora programada"
              value={state.values.scheduledAt}
              onChange={(value) => state.updateField('scheduledAt', value)}
              placeholder="2026-08-24T14:00"
            />
            <AmericanFootballTextField
              label="Zona horaria"
              value={state.values.timezone}
              onChange={(value) => state.updateField('timezone', value)}
              placeholder="utc"
            />
            <AmericanFootballTextField
              label="Cancha"
              value={state.values.court}
              onChange={(value) => state.updateField('court', value)}
              placeholder="Arthur Ashe"
            />
            <AmericanFootballSelectField
              label="Estado"
              value={state.values.status}
              onChange={(value) => state.updateField('status', value)}
              options={TENNIS_MATCH_STATUS_OPTIONS}
            />
          </AmericanFootballFieldGrid>

          <p className="text-sm font-medium text-slate-300">Relaciones del bracket</p>
          <AmericanFootballFieldGrid>
            <AmericanFootballSelectField
              label="Origen competidor 1 (partido anterior)"
              value={state.values.competitor1SourceMatchId}
              onChange={(value) => state.updateField('competitor1SourceMatchId', value)}
              options={bracketMatchOptions}
              hint="Ganador de este partido ocupa competitor_1"
            />
            <AmericanFootballSelectField
              label="Origen competidor 2 (partido anterior)"
              value={state.values.competitor2SourceMatchId}
              onChange={(value) => state.updateField('competitor2SourceMatchId', value)}
              options={bracketMatchOptions}
            />
            <AmericanFootballSelectField
              label="Siguiente partido (ganador avanza a)"
              value={state.values.winnerToMatchId}
              onChange={(value) => state.updateField('winnerToMatchId', value)}
              options={bracketMatchOptions}
              hint="Null en la Final"
            />
            <AmericanFootballSelectField
              label="Posición en siguiente partido"
              value={state.values.winnerToPosition}
              onChange={(value) => state.updateField('winnerToPosition', value)}
              options={TENNIS_WINNER_TO_POSITION_OPTIONS}
            />
            <AmericanFootballSelectField
              label="Tipo entrada competidor 1"
              value={state.values.competitor1EntryType}
              onChange={(value) => state.updateField('competitor1EntryType', value)}
              options={TENNIS_ENTRY_TYPE_OPTIONS}
              hint="Usar BYE cuando no proviene de partido anterior"
            />
            <AmericanFootballSelectField
              label="Tipo entrada competidor 2"
              value={state.values.competitor2EntryType}
              onChange={(value) => state.updateField('competitor2EntryType', value)}
              options={TENNIS_ENTRY_TYPE_OPTIONS}
            />
          </AmericanFootballFieldGrid>
        </>
      )}
    </AmericanFootballFormShell>
  );
}
