'use client';

import { useEffect, useMemo, useState } from 'react';
import { getTennisTournamentMatches, getTennisTournaments, recordTennisMatchResult } from '@/lib/tennis-api';
import type { TennisMatchItem, TennisTournamentItem } from '@/lib/tennis-bff-types';
import {
  EMPTY_TENNIS_RESULT_FORM,
  TENNIS_RESULT_TYPE_OPTIONS,
  buildTennisResultBody,
  competitorOptions,
  matchResultOptions,
  resultMatchToFormValues,
  validateTennisResultForm,
} from '@/lib/tennis-forms/result-form';
import { formatTennisMatchLabel } from '@/lib/tennis-forms/match-form';
import { tennisTournamentToSelectOption } from '@/lib/tennis-display';
import {
  AmericanFootballFieldGrid,
  AmericanFootballFormShell,
  AmericanFootballSelectField,
  AmericanFootballTextField,
} from '@/components/views/american-football/AmericanFootballFormShell';
import { submitLabelForMode, useTennisSectionState } from './useTennisSectionState';

export function TennisResultSection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const state = useTennisSectionState(EMPTY_TENNIS_RESULT_FORM, { onDataChanged });
  const [matches, setMatches] = useState<TennisMatchItem[]>([]);
  const [tournaments, setTournaments] = useState<TennisTournamentItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const selectedMatch = useMemo(
    () => matches.find((m) => m.id === state.values.matchId) ?? null,
    [matches, state.values.matchId],
  );

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
      setMatches([]);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoadingList(true);
      try {
        const envelope = await getTennisTournamentMatches(tournamentId);
        if (!cancelled) setMatches(envelope.response);
      } catch {
        if (!cancelled) setMatches([]);
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
    const validation = validateTennisResultForm(state.values, state.mode);
    if (validation) {
      state.toast.error('Validación', validation);
      return;
    }

    if (state.mode === 'query') {
      state.reloadList();
      state.toast.info('Consulta actualizada');
      return;
    }

    if (state.mode !== 'create' && state.mode !== 'edit') return;

    state.setSubmitting(true);
    try {
      const res = await recordTennisMatchResult(
        state.values.matchId,
        buildTennisResultBody(state.values),
      );
      state.handleSuccess('Resultado registrado y bracket actualizado', res.results);
      state.setValues({ ...EMPTY_TENNIS_RESULT_FORM, queryTournamentId: state.values.queryTournamentId });
    } catch (err) {
      state.handleError(err, 'No se pudo registrar el resultado.');
    } finally {
      state.setSubmitting(false);
    }
  }

  return (
    <AmericanFootballFormShell
      step={step}
      title="Resultados"
      description="Captura marcador por sets y casos especiales. El ganador avanza automáticamente en el bracket."
      mode={state.mode === 'delete' ? 'create' : state.mode}
      onModeChange={(mode) => {
        if (mode === 'delete') return;
        state.setMode(mode);
      }}
      onSubmit={() => void handleSubmit()}
      submitting={state.submitting}
      submitLabel={state.mode === 'query' ? submitLabelForMode('query') : 'Registrar resultado'}
      listTitle={loadingList ? 'Cargando…' : `${matches.length} partido(s)`}
      listContent={
        matches.length === 0 ? (
          <p className="text-sm text-slate-500">Selecciona un torneo para ver partidos.</p>
        ) : (
          <ul className="space-y-2">
            {matches.map((row) => (
              <li
                key={row.id}
                className="rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-200"
              >
                {formatTennisMatchLabel(row)} · {row.status}
                {row.result?.finalScoreDisplay ? ` · ${row.result.finalScoreDisplay}` : ''}
              </li>
            ))}
          </ul>
        )
      }
    >
      <AmericanFootballFieldGrid>
        <AmericanFootballSelectField
          label="Torneo"
          value={state.values.queryTournamentId}
          onChange={(value) => state.updateField('queryTournamentId', value)}
          options={tournamentOptions}
        />
        <AmericanFootballSelectField
          label="Partido"
          value={state.values.matchId}
          onChange={(value) => {
            const match = matches.find((m) => m.id === value);
            if (match) {
              state.setValues(resultMatchToFormValues(match, state.values.queryTournamentId));
            } else {
              state.updateField('matchId', value);
            }
          }}
          options={matchResultOptions(matches)}
        />
      </AmericanFootballFieldGrid>

      {state.mode !== 'query' && (
        <>
          <AmericanFootballFieldGrid>
            <AmericanFootballSelectField
              label="Ganador"
              value={state.values.winnerId}
              onChange={(value) => state.updateField('winnerId', value)}
              options={competitorOptions(selectedMatch)}
            />
            <AmericanFootballSelectField
              label="Perdedor"
              value={state.values.loserId}
              onChange={(value) => state.updateField('loserId', value)}
              options={competitorOptions(selectedMatch)}
            />
            <AmericanFootballSelectField
              label="Tipo de resultado"
              value={state.values.resultType}
              onChange={(value) => state.updateField('resultType', value)}
              options={TENNIS_RESULT_TYPE_OPTIONS}
            />
            <AmericanFootballTextField
              label="Sets competidor 1"
              value={state.values.setsPlayer1}
              onChange={(value) => state.updateField('setsPlayer1', value)}
              placeholder="3"
            />
            <AmericanFootballTextField
              label="Sets competidor 2"
              value={state.values.setsPlayer2}
              onChange={(value) => state.updateField('setsPlayer2', value)}
              placeholder="1"
            />
            <AmericanFootballTextField
              label="Marcador display"
              value={state.values.finalScoreDisplay}
              onChange={(value) => state.updateField('finalScoreDisplay', value)}
              placeholder="6-4, 6-3"
            />
          </AmericanFootballFieldGrid>

          <p className="text-sm font-medium text-slate-300">Marcador por set</p>
          <AmericanFootballFieldGrid>
            {[1, 2, 3, 4, 5].map((setNum) => (
              <div key={setNum} className="col-span-2 grid grid-cols-2 gap-3 sm:col-span-2">
                <AmericanFootballTextField
                  label={`Set ${setNum} · J1`}
                  value={state.values[`set${setNum}Competitor1` as keyof typeof state.values] as string}
                  onChange={(value) =>
                    state.updateField(
                      `set${setNum}Competitor1` as keyof typeof state.values,
                      value as never,
                    )
                  }
                  placeholder="6"
                />
                <AmericanFootballTextField
                  label={`Set ${setNum} · J2`}
                  value={state.values[`set${setNum}Competitor2` as keyof typeof state.values] as string}
                  onChange={(value) =>
                    state.updateField(
                      `set${setNum}Competitor2` as keyof typeof state.values,
                      value as never,
                    )
                  }
                  placeholder="4"
                />
              </div>
            ))}
          </AmericanFootballFieldGrid>

          <AmericanFootballFieldGrid>
            <AmericanFootballTextField
              label="Inicio real"
              value={state.values.startedAt}
              onChange={(value) => state.updateField('startedAt', value)}
              placeholder="2026-08-24T14:00"
            />
            <AmericanFootballTextField
              label="Fin real"
              value={state.values.endedAt}
              onChange={(value) => state.updateField('endedAt', value)}
              placeholder="2026-08-24T16:30"
            />
          </AmericanFootballFieldGrid>
        </>
      )}
    </AmericanFootballFormShell>
  );
}
