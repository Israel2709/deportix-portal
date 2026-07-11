'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Match, Team } from '@/lib/types';
import {
  draftToPatch,
  isDraftDirty,
  matchToDraft,
  sanitizeScoreInput,
  type MatchEditPatch,
  type MatchRowDraft,
} from '@/lib/match-edits';
import { formatMatchStatusOption, MATCH_STATUS_OPTIONS } from '@/lib/match-form';
import { formatDateTimeShort } from '@/lib/format';
import { isLocalMatch } from '@/lib/local-matches';
import { nextSortDirection, sortRows, type SortDirection } from '@/lib/table-sort';
import { SortableColumnHeader } from '@/components/ui/SortableColumnHeader';
import { TableRecordCount } from '@/components/ui/TableRecordCount';

const inputClassName =
  'w-full rounded border border-blue-500/50 bg-slate-950 px-2 py-1 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500';
const selectClassName =
  'w-full rounded border border-blue-500/50 bg-slate-950 pl-2 py-1 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500';
const scoreInputClassName =
  'w-10 min-w-10 rounded border border-blue-500/50 bg-slate-950 px-1 py-1 text-center text-sm tabular-nums text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500';

type EditableField =
  | 'date'
  | 'status'
  | 'homeTeamId'
  | 'scores'
  | 'awayTeamId'
  | 'round'
  | 'venue';

type MatchSortField =
  | 'date'
  | 'status'
  | 'home'
  | 'score'
  | 'away'
  | 'round'
  | 'venue'
  | 'updatedAt';

interface ActiveCell {
  matchId: string;
  field: EditableField;
}

function teamName(teams: Team[], teamId: string | null | undefined, fallback?: string | null): string {
  if (!teamId) return fallback ?? '—';
  return teams.find((team) => team.id === teamId)?.name ?? fallback ?? teamId;
}

function matchesSearchQuery(
  query: string,
  match: Match,
  draft: MatchRowDraft,
  teams: Team[],
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  const parts = [
    match.id,
    match.round,
    match.venue,
    match.status,
    formatDateTimeShort(match.date),
    draft.date,
    draft.round,
    draft.venue,
    draft.status,
    draft.homeScore,
    draft.awayScore,
    teamName(teams, draft.homeTeamId, match.home.name),
    teamName(teams, draft.awayTeamId, match.away.name),
    match.home.name,
    match.away.name,
    isLocalMatch(match) ? 'local' : null,
  ];

  return parts
    .filter((part) => part != null && String(part).trim() !== '')
    .some((part) => String(part).toLowerCase().includes(needle));
}

function scoreSortValue(draft: MatchRowDraft, match: Match): number | null {
  const homeRaw = draft.homeScore.trim() || (match.home.score != null ? String(match.home.score) : '');
  const awayRaw = draft.awayScore.trim() || (match.away.score != null ? String(match.away.score) : '');
  if (homeRaw === '' && awayRaw === '') return null;

  const home = homeRaw === '' ? 0 : Number(homeRaw);
  const away = awayRaw === '' ? 0 : Number(awayRaw);
  return home * 1000 + away;
}

function matchSortValue(
  match: Match,
  draft: MatchRowDraft,
  field: MatchSortField,
  teams: Team[],
) {
  switch (field) {
    case 'date':
      return draft.date || match.date;
    case 'status':
      return draft.status || match.status;
    case 'home':
      return teamName(teams, draft.homeTeamId, match.home.name);
    case 'away':
      return teamName(teams, draft.awayTeamId, match.away.name);
    case 'round':
      return draft.round || match.round;
    case 'venue':
      return draft.venue || match.venue;
    case 'updatedAt':
      return match.updatedAt;
    case 'score':
      return scoreSortValue(draft, match);
  }
}

function scoreDisplay(home: string, away: string, persistedHome: number | null, persistedAway: number | null): string {
  const homeLabel = home.trim() || (persistedHome != null ? String(persistedHome) : '–');
  const awayLabel = away.trim() || (persistedAway != null ? String(persistedAway) : '–');
  return `${homeLabel} : ${awayLabel}`;
}

export function EditableMatchesTable({
  matches,
  teams = [],
  resetKey,
  onSave,
  onDelete,
}: {
  matches: Match[];
  teams?: Team[];
  resetKey: string;
  onSave: (edits: Record<string, MatchEditPatch>) => string | null | Promise<string | null>;
  onDelete: (matchId: string) => string | null | Promise<string | null>;
}) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [drafts, setDrafts] = useState<Record<string, MatchRowDraft>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<MatchSortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection | null>(null);

  useEffect(() => {
    setDrafts({});
    setSearchQuery('');
    setActiveCell(null);
    setError(null);
    setSortKey(null);
    setSortDirection(null);
  }, [resetKey]);

  useEffect(() => {
    if (!activeCell) return;

    function handlePointerDown(event: MouseEvent) {
      if (tableRef.current?.contains(event.target as Node)) return;
      setActiveCell(null);
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [activeCell]);

  const dirtyMatchIds = useMemo(
    () =>
      matches
        .filter((match) => drafts[match.id] && isDraftDirty(match, drafts[match.id]!))
        .map((match) => match.id),
    [matches, drafts],
  );

  const filteredMatches = useMemo(
    () =>
      matches.filter((match) => matchesSearchQuery(searchQuery, match, getDraft(match), teams)),
    [matches, searchQuery, drafts, teams],
  );

  const displayedMatches = useMemo(() => {
    if (!sortKey || !sortDirection) return filteredMatches;

    return sortRows(
      filteredMatches,
      (match) => matchSortValue(match, getDraft(match), sortKey, teams),
      sortDirection,
    );
  }, [filteredMatches, sortDirection, sortKey, drafts, teams]);

  const hasDirtyDrafts = dirtyMatchIds.length > 0;
  const isBusy = saving || deletingId !== null;

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

  function activateCell(matchId: string, field: EditableField) {
    if (isBusy) return;
    setActiveCell({ matchId, field });
  }

  function handleSort(columnKey: MatchSortField) {
    const next = nextSortDirection(sortKey, sortDirection, columnKey);
    setSortKey(next.key as MatchSortField | null);
    setSortDirection(next.direction);
  }

  function handleDiscard() {
    setDrafts({});
    setActiveCell(null);
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
      setActiveCell(null);
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
      if (activeCell?.matchId === match.id) setActiveCell(null);
    } finally {
      setDeletingId(null);
    }
  }

  const teamOptions = teams.map((team) => ({
    value: team.id,
    label: team.name ?? team.id,
  }));

  if (matches.length === 0) return null;

  return (
    <div className="space-y-3" ref={tableRef}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Buscar por equipos, jornada, sede, estado, fecha o id…"
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
        />
        <TableRecordCount
          shown={displayedMatches.length}
          total={matches.length}
          singular="partido"
          plural="partidos"
          className="shrink-0"
        />
      </div>

      {hasDirtyDrafts && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
          <p className="text-sm text-amber-100">
            {dirtyMatchIds.length === 1
              ? 'Hay 1 partido con cambios sin guardar.'
              : `Hay ${dirtyMatchIds.length} partidos con cambios sin guardar.`}
          </p>
          <button
            type="button"
            onClick={() => void handleSave()}
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
                <SortableColumnHeader
                  label="Fecha (UTC)"
                  direction={sortKey === 'date' ? sortDirection : null}
                  onClick={() => handleSort('date')}
                />
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                <SortableColumnHeader
                  label="Estado"
                  direction={sortKey === 'status' ? sortDirection : null}
                  onClick={() => handleSort('status')}
                />
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                <SortableColumnHeader
                  label="Local"
                  direction={sortKey === 'home' ? sortDirection : null}
                  onClick={() => handleSort('home')}
                  className="w-full justify-end"
                />
              </th>
              <th scope="col" className="whitespace-nowrap px-2 py-2 text-center font-medium">
                <SortableColumnHeader
                  label="Marcador"
                  direction={sortKey === 'score' ? sortDirection : null}
                  onClick={() => handleSort('score')}
                  className="w-full justify-center"
                />
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                <SortableColumnHeader
                  label="Visitante"
                  direction={sortKey === 'away' ? sortDirection : null}
                  onClick={() => handleSort('away')}
                />
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                <SortableColumnHeader
                  label="Jornada"
                  direction={sortKey === 'round' ? sortDirection : null}
                  onClick={() => handleSort('round')}
                />
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                <SortableColumnHeader
                  label="Sede"
                  direction={sortKey === 'venue' ? sortDirection : null}
                  onClick={() => handleSort('venue')}
                />
              </th>
              <th scope="col" className="w-0 whitespace-nowrap px-3 py-2 font-medium">
                <SortableColumnHeader
                  label="Modificado"
                  direction={sortKey === 'updatedAt' ? sortDirection : null}
                  onClick={() => handleSort('updatedAt')}
                />
              </th>
              <th scope="col" className="w-0 whitespace-nowrap px-3 py-2 text-center font-medium">
                <span className="sr-only">Eliminar</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedMatches.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-sm text-slate-500">
                  Ningún partido coincide con la búsqueda.
                </td>
              </tr>
            ) : (
              displayedMatches.map((match) => {
                const draft = getDraft(match);
                const dirty = drafts[match.id] && isDraftDirty(match, draft);
                const labelBase = `${match.home.name ?? 'local'} vs ${match.away.name ?? 'visitante'}`;

                return (
                  <tr
                    key={match.id}
                    className={`border-t border-slate-800/80 text-slate-200 ${dirty ? 'bg-amber-500/5' : ''}`}
                  >
                    <EditableCell
                      isActive={activeCell?.matchId === match.id && activeCell.field === 'date'}
                      onActivate={() => activateCell(match.id, 'date')}
                      display={
                        <span>
                          {formatDateTimeShort(match.date)}
                          {isLocalMatch(match) && (
                            <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-xs text-amber-200">
                              local
                            </span>
                          )}
                        </span>
                      }
                    >
                      <input
                        type="datetime-local"
                        aria-label={`Fecha UTC de ${labelBase}`}
                        value={draft.date}
                        onChange={(event) => updateDraft(match.id, match, { date: event.target.value })}
                        className={inputClassName}
                        disabled={isBusy}
                        autoFocus
                      />
                    </EditableCell>

                    <EditableCell
                      isActive={activeCell?.matchId === match.id && activeCell.field === 'status'}
                      onActivate={() => activateCell(match.id, 'status')}
                      display={match.status ?? '—'}
                    >
                      <select
                        aria-label={`Estado de ${labelBase}`}
                        value={draft.status}
                        onChange={(event) => updateDraft(match.id, match, { status: event.target.value })}
                        className={selectClassName}
                        disabled={isBusy}
                        autoFocus
                      >
                        {MATCH_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {formatMatchStatusOption(status)}
                          </option>
                        ))}
                      </select>
                    </EditableCell>

                    <EditableCell
                      isActive={activeCell?.matchId === match.id && activeCell.field === 'homeTeamId'}
                      onActivate={() => activateCell(match.id, 'homeTeamId')}
                      className="text-right"
                      display={teamName(teams, draft.homeTeamId, match.home.name)}
                    >
                      <select
                        aria-label={`Local de ${labelBase}`}
                        value={draft.homeTeamId}
                        onChange={(event) => updateDraft(match.id, match, { homeTeamId: event.target.value })}
                        className={selectClassName}
                        disabled={isBusy || teamOptions.length === 0}
                        autoFocus
                      >
                        <option value="">Seleccionar…</option>
                        {teamOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </EditableCell>

                    <EditableCell
                      isActive={activeCell?.matchId === match.id && activeCell.field === 'scores'}
                      onActivate={() => activateCell(match.id, 'scores')}
                      className="whitespace-nowrap px-2 py-2 text-center"
                      display={scoreDisplay(draft.homeScore, draft.awayScore, match.home.score, match.away.score)}
                    >
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
                          autoFocus
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
                    </EditableCell>

                    <EditableCell
                      isActive={activeCell?.matchId === match.id && activeCell.field === 'awayTeamId'}
                      onActivate={() => activateCell(match.id, 'awayTeamId')}
                      display={teamName(teams, draft.awayTeamId, match.away.name)}
                    >
                      <select
                        aria-label={`Visitante de ${labelBase}`}
                        value={draft.awayTeamId}
                        onChange={(event) => updateDraft(match.id, match, { awayTeamId: event.target.value })}
                        className={selectClassName}
                        disabled={isBusy || teamOptions.length === 0}
                        autoFocus
                      >
                        <option value="">Seleccionar…</option>
                        {teamOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </EditableCell>

                    <EditableCell
                      isActive={activeCell?.matchId === match.id && activeCell.field === 'round'}
                      onActivate={() => activateCell(match.id, 'round')}
                      display={match.round ?? '—'}
                    >
                      <input
                        type="text"
                        aria-label={`Jornada de ${labelBase}`}
                        value={draft.round}
                        onChange={(event) => updateDraft(match.id, match, { round: event.target.value })}
                        className={inputClassName}
                        disabled={isBusy}
                        autoFocus
                      />
                    </EditableCell>

                    <EditableCell
                      isActive={activeCell?.matchId === match.id && activeCell.field === 'venue'}
                      onActivate={() => activateCell(match.id, 'venue')}
                      display={match.venue ?? '—'}
                    >
                      <input
                        type="text"
                        aria-label={`Sede de ${labelBase}`}
                        value={draft.venue}
                        onChange={(event) => updateDraft(match.id, match, { venue: event.target.value })}
                        className={inputClassName}
                        disabled={isBusy}
                        autoFocus
                      />
                    </EditableCell>

                    <td className="w-0 whitespace-nowrap px-3 py-2 text-slate-400">
                      {formatDateTimeShort(match.updatedAt)}
                    </td>

                    <td className="w-0 whitespace-nowrap px-3 py-2 text-center">
                      <button
                        type="button"
                        aria-label={`Eliminar partido ${labelBase}`}
                        onClick={() => void handleDelete(match)}
                        disabled={isBusy}
                        className="rounded border border-red-500/40 px-2 py-1 text-xs font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                      >
                        {deletingId === match.id ? '…' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">Haz clic en una celda para editarla. Los cambios se guardan con el botón superior.</p>
    </div>
  );
}

function EditableCell({
  isActive,
  onActivate,
  display,
  children,
  className = '',
}: {
  isActive: boolean;
  onActivate: () => void;
  display: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  if (isActive) {
    return <td className={`px-3 py-2 ${className}`}>{children}</td>;
  }

  return (
    <td
      className={`cursor-pointer px-3 py-2 hover:bg-slate-800/60 ${className}`}
      onClick={onActivate}
      title="Clic para editar"
    >
      {display}
    </td>
  );
}
