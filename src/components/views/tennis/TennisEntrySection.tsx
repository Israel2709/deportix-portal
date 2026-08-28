'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  createTennisTournamentEntry,
  deleteTennisEntry,
  getTennisPlayers,
  getTennisTournamentEntries,
  getTennisTournaments,
  updateTennisEntry,
} from '@/lib/tennis-api';
import type { TennisEntryItem, TennisPlayerItem, TennisTournamentItem } from '@/lib/tennis-bff-types';
import {
  EMPTY_TENNIS_ENTRY_FORM,
  TENNIS_ENTRY_TYPE_OPTIONS,
  buildTennisEntryBody,
  entryToFormValues,
  validateTennisEntryForm,
} from '@/lib/tennis-forms/entry-form';
import { truncateCanonicalId } from '@/lib/tennis-forms/shared';
import {
  AmericanFootballFieldGrid,
  AmericanFootballFormShell,
  AmericanFootballRowActions,
  AmericanFootballSelectField,
  AmericanFootballTextField,
} from '@/components/views/american-football/AmericanFootballFormShell';
import { submitLabelForMode, useTennisSectionState } from './useTennisSectionState';

export function TennisEntrySection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const state = useTennisSectionState(EMPTY_TENNIS_ENTRY_FORM, { onDataChanged });
  const [rows, setRows] = useState<TennisEntryItem[]>([]);
  const [tournaments, setTournaments] = useState<TennisTournamentItem[]>([]);
  const [players, setPlayers] = useState<TennisPlayerItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const tournamentOptions = useMemo(
    () => [
      { value: '', label: 'Selecciona un torneo' },
      ...tournaments.map((t) => ({
        value: t.id,
        label: `${t.name} ${t.year}${t.published ? '' : ' (borrador)'}`,
      })),
    ],
    [tournaments],
  );

  const playerOptions = useMemo(
    () => [
      { value: '', label: 'Selecciona un jugador' },
      ...players.map((p) => ({ value: p.id, label: `${p.displayName} (${p.country.code})` })),
    ],
    [players],
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
    const tournamentId = state.values.queryTournamentId.trim();
    if (!tournamentId) {
      setRows([]);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoadingList(true);
      try {
        const envelope = await getTennisTournamentEntries(tournamentId);
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
    const validation = validateTennisEntryForm(state.values, state.mode);
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
      state.setConfirmDelete(`¿Eliminar la entrada ${truncateCanonicalId(state.values.id)}?`);
      return;
    }

    state.setSubmitting(true);
    try {
      const body = buildTennisEntryBody(state.values);
      if (state.mode === 'create') {
        const tournamentId = state.values.tournamentId.trim();
        const res = await createTennisTournamentEntry(tournamentId, body);
        state.handleSuccess('Entrada creada', res.results);
        state.setValues({ ...EMPTY_TENNIS_ENTRY_FORM, queryTournamentId: tournamentId, tournamentId });
      } else if (state.mode === 'edit') {
        const res = await updateTennisEntry(state.values.id, body);
        state.handleSuccess('Entrada actualizada', res.results);
      } else if (state.mode === 'delete') {
        await deleteTennisEntry(state.values.id);
        state.handleSuccess('Entrada eliminada');
        state.setConfirmDelete(null);
        state.setValues({ ...EMPTY_TENNIS_ENTRY_FORM, queryTournamentId: state.values.queryTournamentId });
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
      title="Entradas al Main Draw"
      description="Asigna jugadores al torneo con seed, ranking y tipo de entrada (incl. BYE)."
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
      listTitle={loadingList ? 'Cargando…' : `${rows.length} entrada(s)`}
      listContent={
        rows.length === 0 ? (
          <p className="text-sm text-slate-500">Selecciona un torneo para ver entradas.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 px-3 py-2 text-sm"
              >
                <span className="text-slate-200">
                  {row.player.displayName}
                  {row.seed != null ? ` · seed ${row.seed}` : ''}
                  {row.entryType ? ` · ${row.entryType}` : ''}{' '}
                  <span className="font-mono text-xs text-slate-500" title={row.id}>
                    {truncateCanonicalId(row.id)}
                  </span>
                </span>
                <AmericanFootballRowActions
                  onEdit={() => {
                    state.setMode('edit');
                    state.setValues(entryToFormValues(row, state.values.queryTournamentId));
                  }}
                  onDelete={() => {
                    state.setMode('delete');
                    state.setValues(entryToFormValues(row, state.values.queryTournamentId));
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
        />
      </AmericanFootballFieldGrid>

      {(state.mode === 'edit' || state.mode === 'delete') && state.values.id && (
        <p className="text-xs font-mono text-slate-400">
          {state.mode === 'delete' ? 'Eliminar' : 'Editar'}: {state.values.id}
        </p>
      )}

      {state.mode !== 'delete' && state.mode !== 'query' && (
        <AmericanFootballFieldGrid>
          <AmericanFootballSelectField
            label="Jugador"
            value={state.values.playerId}
            onChange={(value) => state.updateField('playerId', value)}
            options={playerOptions}
            hint={players.length === 0 ? 'Crea jugadores primero (paso 1)' : undefined}
          />
          <AmericanFootballTextField
            label="Seed"
            value={state.values.seed}
            onChange={(value) => state.updateField('seed', value)}
            placeholder="1"
          />
          <AmericanFootballTextField
            label="Ranking"
            value={state.values.ranking}
            onChange={(value) => state.updateField('ranking', value)}
            placeholder="3"
          />
          <AmericanFootballSelectField
            label="Tipo de entrada"
            value={state.values.entryType}
            onChange={(value) => state.updateField('entryType', value)}
            options={TENNIS_ENTRY_TYPE_OPTIONS}
          />
        </AmericanFootballFieldGrid>
      )}
    </AmericanFootballFormShell>
  );
}
