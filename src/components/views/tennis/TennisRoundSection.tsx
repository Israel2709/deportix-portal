'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  createTennisTournamentRound,
  deleteTennisRound,
  getTennisTournamentRounds,
  getTennisTournaments,
  updateTennisRound,
} from '@/lib/tennis-api';
import type { TennisRoundItem, TennisTournamentItem } from '@/lib/tennis-bff-types';
import {
  EMPTY_TENNIS_ROUND_FORM,
  TENNIS_ROUND_STATUS_OPTIONS,
  buildTennisRoundBody,
  roundToFormValues,
  validateTennisRoundForm,
} from '@/lib/tennis-forms/round-form';
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

export function TennisRoundSection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const state = useTennisSectionState(EMPTY_TENNIS_ROUND_FORM, { onDataChanged });
  const [rows, setRows] = useState<TennisRoundItem[]>([]);
  const [tournaments, setTournaments] = useState<TennisTournamentItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const tournamentOptions = useMemo(
    () => [
      { value: '', label: 'Selecciona un torneo' },
      ...tournaments.map((t) => tennisTournamentToSelectOption(t)),
    ],
    [tournaments],
  );

  useEffect(() => {
    let cancelled = false;
    async function loadTournaments() {
      try {
        const envelope = await getTennisTournaments();
        if (!cancelled) setTournaments(envelope.response);
      } catch {
        if (!cancelled) setTournaments([]);
      }
    }
    void loadTournaments();
    return () => {
      cancelled = true;
    };
  }, [state.listKey]);

  useEffect(() => {
    const tournamentId = state.values.queryTournamentId.trim();
    if (!tournamentId) {
      setRows([]);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoadingList(true);
      try {
        const envelope = await getTennisTournamentRounds(tournamentId);
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
  }, [state.listKey, state.values.queryTournamentId]);

  async function handleSubmit() {
    const validation = validateTennisRoundForm(state.values, state.mode);
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
      state.setConfirmDelete(`¿Eliminar la ronda ${truncateCanonicalId(state.values.id)}?`);
      return;
    }

    state.setSubmitting(true);
    try {
      const body = buildTennisRoundBody(state.values);
      if (state.mode === 'create') {
        const tournamentId = state.values.tournamentId.trim();
        const res = await createTennisTournamentRound(tournamentId, body);
        state.handleSuccess('Ronda creada', res.results);
        state.setValues({ ...EMPTY_TENNIS_ROUND_FORM, queryTournamentId: tournamentId, tournamentId });
      } else if (state.mode === 'edit') {
        const res = await updateTennisRound(state.values.id, body);
        state.handleSuccess('Ronda actualizada', res.results);
      } else if (state.mode === 'delete') {
        await deleteTennisRound(state.values.id);
        state.handleSuccess('Ronda eliminada');
        state.setConfirmDelete(null);
        state.setValues({ ...EMPTY_TENNIS_ROUND_FORM, queryTournamentId: state.values.queryTournamentId });
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
      title="Rondas"
      description="Main Draw por torneo. round_number secuencial y único dentro del torneo."
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
      listTitle={loadingList ? 'Cargando…' : `${rows.length} ronda(s)`}
      listContent={
        rows.length === 0 ? (
          <p className="text-sm text-slate-500">Selecciona un torneo para ver rondas.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 px-3 py-2 text-sm"
              >
                <span className="text-slate-200">
                  #{row.roundNumber} {row.name} · {row.status}{' '}
                  <span className="font-mono text-xs text-slate-500" title={row.id}>
                    {truncateCanonicalId(row.id)}
                  </span>
                </span>
                <AmericanFootballRowActions
                  onEdit={() => {
                    state.setMode('edit');
                    state.setValues(roundToFormValues(row, state.values.queryTournamentId));
                  }}
                  onDelete={() => {
                    state.setMode('delete');
                    state.setValues(roundToFormValues(row, state.values.queryTournamentId));
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
            if (state.mode === 'create') {
              state.updateField('tournamentId', value);
              state.updateField('queryTournamentId', value);
            } else {
              state.updateField('queryTournamentId', value);
            }
          }}
          options={tournamentOptions}
          hint={tournaments.length === 0 ? 'Crea un torneo primero (paso 2)' : undefined}
        />
      </AmericanFootballFieldGrid>

      {(state.mode === 'edit' || state.mode === 'delete') && state.values.id && (
        <p className="text-xs font-mono text-slate-400">
          {state.mode === 'delete' ? 'Eliminar' : 'Editar'}: {state.values.id}
        </p>
      )}

      {state.mode !== 'delete' && state.mode !== 'query' && (
        <AmericanFootballFieldGrid>
          <AmericanFootballTextField
            label="Número de ronda"
            value={state.values.roundNumber}
            onChange={(value) => state.updateField('roundNumber', value)}
            placeholder="1"
          />
          <AmericanFootballTextField
            label="Nombre"
            value={state.values.name}
            onChange={(value) => state.updateField('name', value)}
            placeholder="Octavos de final"
          />
          <AmericanFootballSelectField
            label="Estado"
            value={state.values.status}
            onChange={(value) => state.updateField('status', value)}
            options={TENNIS_ROUND_STATUS_OPTIONS}
          />
          <AmericanFootballTextField
            label="Fecha inicio"
            value={state.values.startDate}
            onChange={(value) => state.updateField('startDate', value)}
            placeholder="2026-08-24"
          />
          <AmericanFootballTextField
            label="Fecha fin"
            value={state.values.endDate}
            onChange={(value) => state.updateField('endDate', value)}
            placeholder="2026-08-26"
          />
        </AmericanFootballFieldGrid>
      )}
    </AmericanFootballFormShell>
  );
}
