'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Match } from '@/lib/types';
import {
  draftToPatch,
  isDraftDirty,
  matchToDraft,
  sanitizeScoreInput,
  type MatchEditPatch,
  type MatchRowDraft,
} from '@/lib/match-edits';
import { formatMatchStatusOption, MATCH_STATUS_OPTIONS } from '@/lib/match-form';
import { formatDateTime, formatDateTimeShort } from '@/lib/format';
import { isLocalMatch } from '@/lib/local-matches';

const inputClassName =
  'w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100';
const selectClassName =
  'w-full rounded border border-slate-700 bg-slate-950 pl-2 py-1 text-sm text-slate-100';
const scoreInputClassName =
  'w-10 min-w-10 rounded border border-slate-700 bg-slate-950 px-1 py-1 text-center text-sm tabular-nums text-slate-100';

export function EditableMatchesTable({
  matches,
  resetKey,
  onSave,
  onDelete,
}: {
  matches: Match[];
  resetKey: string;
  onSave: (edits: Record<string, MatchEditPatch>) => string | null | Promise<string | null>;
  onDelete: (matchId: string) => string | null | Promise<string | null>;
}) {
  const [drafts, setDrafts] = useState<Record<string, MatchRowDraft>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  async function handleSave() {
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

    setSaving(true);
    try {
      const saveError = await onSave(edits);
      if (saveError) {
        setError(saveError);
        return;
      }

      setDrafts({});
      setError(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(match: Match) {
    const label = `${match.home.name ?? 'Local'} vs ${match.away.name ?? 'Visitante'}`;
    if (!window.confirm(`¿Eliminar el partido ${label}? Esta acción no se puede deshacer.`)) {
      return;
    }

    setDeletingId(match.id);
    setError(null);
    try {
      const deleteError = await onDelete(match.id);
      if (deleteError) {
        setError(deleteError);
        return;
      }

      setDrafts((current) => {
        const next = { ...current };
        delete next[match.id];
        return next;
      });
    } finally {
      setDeletingId(null);
    }
  }

  const isBusy = saving || deletingId !== null;

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
            disabled={saving}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
          <button
            type="button"
            onClick={handleDiscard}
            disabled={isBusy}
            className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-900 disabled:opacity-60"
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
              <th scope="col" className="px-3 py-2 text-right font-medium">
                Local
              </th>
              <th scope="col" className="whitespace-nowrap px-2 py-2 text-center font-medium">
                Marcador
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Visitante
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Jornada
              </th>
              <th scope="col" className="w-0 whitespace-nowrap px-3 py-2 font-medium">
                Modificado
              </th>
              <th scope="col" className="w-0 whitespace-nowrap px-3 py-2 text-center font-medium">
                <span className="sr-only">Eliminar</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => {
              const draft = getDraft(match);
              const dirty = drafts[match.id] && isDraftDirty(match, draft);

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
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      aria-label={`Estado de ${match.home.name ?? 'local'} vs ${match.away.name ?? 'visitante'}`}
                      value={draft.status}
                      onChange={(event) => updateDraft(match.id, match, { status: event.target.value })}
                      className={selectClassName}
                      disabled={isBusy}
                    >
                      {MATCH_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {formatMatchStatusOption(status)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-right">{match.home.name ?? match.home.teamId ?? '—'}</td>
                  <td className="whitespace-nowrap px-2 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="off"
                        aria-label={`Goles de ${match.home.name ?? 'local'}`}
                        value={draft.homeScore}
                        onChange={(event) =>
                          updateDraft(match.id, match, {
                            homeScore: sanitizeScoreInput(event.target.value),
                          })
                        }
                        className={scoreInputClassName}
                        placeholder="–"
                        disabled={isBusy}
                      />
                      <span className="text-slate-500">:</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="off"
                        aria-label={`Goles de ${match.away.name ?? 'visitante'}`}
                        value={draft.awayScore}
                        onChange={(event) =>
                          updateDraft(match.id, match, {
                            awayScore: sanitizeScoreInput(event.target.value),
                          })
                        }
                        className={scoreInputClassName}
                        placeholder="–"
                        disabled={isBusy}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2">{match.away.name ?? match.away.teamId ?? '—'}</td>
                  <td className="px-3 py-2">{match.round ?? '—'}</td>
                  <td className="w-0 whitespace-nowrap px-3 py-2 text-slate-400">
                    {formatDateTimeShort(match.updatedAt)}
                  </td>
                  <td className="w-0 whitespace-nowrap px-3 py-2 text-center">
                    <button
                      type="button"
                      aria-label={`Eliminar partido ${match.home.name ?? 'local'} vs ${match.away.name ?? 'visitante'}`}
                      onClick={() => void handleDelete(match)}
                      disabled={isBusy}
                      className="rounded border border-red-500/40 px-2 py-1 text-xs font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                    >
                      {deletingId === match.id ? '…' : 'Eliminar'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
