'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Match } from '@/lib/types';
import {
  draftToPatch,
  hasMatchOverride,
  isDraftDirty,
  matchToDraft,
  type MatchEditPatch,
  type MatchRowDraft,
} from '@/lib/match-edits';
import { formatMatchStatusOption, MATCH_STATUS_OPTIONS } from '@/lib/match-form';
import { formatDateTime } from '@/lib/format';
import { isLocalMatch } from '@/lib/local-matches';

const inputClassName =
  'w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100';
const scoreInputClassName = `${inputClassName} w-12 text-center`;

export function EditableMatchesTable({
  matches,
  overrides,
  resetKey,
  onSave,
}: {
  matches: Match[];
  overrides: Record<string, MatchEditPatch>;
  resetKey: string;
  onSave: (edits: Record<string, MatchEditPatch>) => string | null;
}) {
  const [drafts, setDrafts] = useState<Record<string, MatchRowDraft>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDrafts({});
    setError(null);
  }, [resetKey]);

  const dirtyMatchIds = useMemo(
    () => matches.filter((match) => drafts[match.id] && isDraftDirty(match, drafts[match.id]!)).map((m) => m.id),
    [matches, drafts],
  );

  const hasDirtyDrafts = dirtyMatchIds.length > 0;

  function getDraft(match: Match): MatchRowDraft {
    return drafts[match.id] ?? matchToDraft(match);
  }

  function updateDraft(matchId: string, match: Match, partial: Partial<MatchRowDraft>) {
    setError(null);
    setDrafts((current) => ({
      ...current,
      [matchId]: { ...(current[matchId] ?? matchToDraft(match)), ...partial },
    }));
  }

  function handleDiscard() {
    setDrafts({});
    setError(null);
  }

  function handleSave() {
    const edits: Record<string, MatchEditPatch> = {};

    for (const matchId of dirtyMatchIds) {
      const draft = drafts[matchId]!;
      const patchOrError = draftToPatch(draft);
      if (typeof patchOrError === 'string') {
        setError(patchOrError);
        return;
      }
      edits[matchId] = patchOrError;
    }

    const saveError = onSave(edits);
    if (saveError) {
      setError(saveError);
      return;
    }

    setDrafts({});
    setError(null);
  }

  if (matches.length === 0) return null;

  return (
    <div className="space-y-3">
      {hasDirtyDrafts && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
          <p className="text-sm text-amber-100">
            {dirtyMatchIds.length === 1
              ? 'Hay 1 partido con cambios sin guardar.'
              : `Hay ${dirtyMatchIds.length} partidos con cambios sin guardar.`}
          </p>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            Guardar cambios
          </button>
          <button
            type="button"
            onClick={handleDiscard}
            className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-900"
          >
            Descartar
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-300">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">Partidos de la liga</caption>
          <thead>
            <tr className="bg-slate-900/70 text-left text-slate-300">
              <th scope="col" className="px-3 py-2 font-medium">
                Fecha
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Estado
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Local
              </th>
              <th scope="col" className="px-3 py-2 text-center font-medium">
                Marcador
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Visitante
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Jornada
              </th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => {
              const draft = getDraft(match);
              const dirty = drafts[match.id] && isDraftDirty(match, draft);
              const edited = dirty || hasMatchOverride(overrides, match.id);

              return (
                <tr
                  key={match.id}
                  className={`border-t border-slate-800/80 text-slate-200 ${dirty ? 'bg-amber-500/5' : ''}`}
                >
                  <td className="px-3 py-2">
                    <span>
                      {formatDateTime(match.date)}
                      {isLocalMatch(match) && (
                        <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-xs text-amber-200">
                          local
                        </span>
                      )}
                      {edited && !isLocalMatch(match) && (
                        <span className="ml-2 rounded bg-blue-500/15 px-1.5 py-0.5 text-xs text-blue-200">
                          editado
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      aria-label={`Estado de ${match.home.name ?? 'local'} vs ${match.away.name ?? 'visitante'}`}
                      value={draft.status}
                      onChange={(event) => updateDraft(match.id, match, { status: event.target.value })}
                      className={inputClassName}
                    >
                      {MATCH_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {formatMatchStatusOption(status)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">{match.home.name ?? match.home.teamId ?? '—'}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        aria-label={`Goles de ${match.home.name ?? 'local'}`}
                        value={draft.homeScore}
                        onChange={(event) =>
                          updateDraft(match.id, match, { homeScore: event.target.value })
                        }
                        className={scoreInputClassName}
                        placeholder="-"
                      />
                      <span className="text-slate-500">:</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        aria-label={`Goles de ${match.away.name ?? 'visitante'}`}
                        value={draft.awayScore}
                        onChange={(event) =>
                          updateDraft(match.id, match, { awayScore: event.target.value })
                        }
                        className={scoreInputClassName}
                        placeholder="-"
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2">{match.away.name ?? match.away.teamId ?? '—'}</td>
                  <td className="px-3 py-2">{match.round ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
