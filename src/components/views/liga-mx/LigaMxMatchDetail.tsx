'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiClientError } from '@/lib/api';
import { useToast } from '@/components/notifications/ToastProvider';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { DataSection } from '@/components/states/States';
import { formatDateTimeShort } from '@/lib/format';
import { isLocalMatch, updateLocalMatch } from '@/lib/local-matches';
import { LIGA_MX_LEAGUE_ID } from '@/lib/liga-mx';
import {
  draftToPatch,
  matchToDraft,
  sanitizeScoreInput,
  type MatchRowDraft,
} from '@/lib/match-edits';
import {
  MATCH_STATUS_OPTIONS,
  formatMatchStatusOption,
} from '@/lib/match-form';
import { useLocalMatches } from '@/lib/use-local-matches';
import {
  useLeagueMatchesQuery,
  useLeagueSeasonsQuery,
  useLeagueTeamsQuery,
} from '@/lib/query/hooks/league';
import { usePatchMatchMutation } from '@/lib/query/liga-mx/mutations';
import { queryKeys } from '@/lib/query/keys';
import type { Match, Season, Team } from '@/lib/types';
import { truncateRecordId, ligaMxTeamDetailPath } from '@/lib/liga-mx-paths';
import Link from 'next/link';
import {
  DetailEditableField,
  DetailEditableSelect,
  DetailField,
  LigaMxDetailLayout,
} from './LigaMxDetailLayout';
import { AmericanFootballDetailEditActions } from '@/components/views/american-football/AmericanFootballDetailEditActions';
import { useAmericanFootballDetailEdit } from '@/components/views/american-football/useAmericanFootballDetailEdit';

interface SeasonOption {
  season: Season;
  year: number;
}

function teamLabel(team: Team | undefined): string {
  if (!team) return '—';
  return team.name ?? team.id;
}

export function LigaMxMatchDetail({
  matchId,
  seasonId,
  year,
}: {
  matchId: string;
  seasonId?: string;
  year?: string;
}) {
  const toast = useToast();
  const edit = useAmericanFootballDetailEdit();
  const queryClient = useQueryClient();
  const seasonYear = year ? Number(year) : null;
  const teamsRes = useLeagueTeamsQuery(LIGA_MX_LEAGUE_ID);
  const seasonsRes = useLeagueSeasonsQuery(LIGA_MX_LEAGUE_ID);
  const matchesRes = useLeagueMatchesQuery(
    seasonId && seasonYear !== null ? LIGA_MX_LEAGUE_ID : null,
    seasonYear,
    seasonId ?? null,
  );
  const { reload: reloadLocalMatches } = useLocalMatches(
    seasonId ? LIGA_MX_LEAGUE_ID : null,
    seasonId ?? null,
  );
  const patchMatchMutation = usePatchMatchMutation(LIGA_MX_LEAGUE_ID, seasonYear ?? 0);

  const [draft, setDraft] = useState<MatchRowDraft | null>(null);

  const teams = useMemo(
    () => [...teamsRes.data].sort((left, right) => (left.name ?? '').localeCompare(right.name ?? '')),
    [teamsRes.data],
  );

  const seasons = useMemo<SeasonOption[]>(
    () =>
      seasonsRes.data
        .filter((season) => season.year != null)
        .map((season) => ({ season, year: season.year! }))
        .sort((left, right) => right.year - left.year),
    [seasonsRes.data],
  );

  const match = useMemo(
    () => matchesRes.data.find((item) => item.id === matchId) ?? null,
    [matchesRes.data, matchId],
  );

  useEffect(() => {
    if (match) {
      setDraft(matchToDraft(match));
    }
  }, [match]);

  const loading = teamsRes.loading || seasonsRes.loading || matchesRes.loading;
  const error =
    !seasonId || !year
      ? 'Faltan parámetros de temporada para cargar el partido.'
      : teamsRes.error ?? seasonsRes.error ?? matchesRes.error;

  const teamOptions = useMemo(
    () => teams.map((team) => ({ value: team.id, label: team.name ?? team.id })),
    [teams],
  );

  const seasonOptions = useMemo(
    () =>
      seasons.map(({ season, year: itemYear }) => ({
        value: season.id,
        label: `Temporada ${itemYear}`,
      })),
    [seasons],
  );

  const homeTeam = teams.find((team) => team.id === (draft?.homeTeamId ?? match?.home.teamId));
  const awayTeam = teams.find((team) => team.id === (draft?.awayTeamId ?? match?.away.teamId));
  const displaySeasonYear =
    seasons.find((item) => item.season.id === (draft?.seasonId ?? match?.seasonId))?.year ??
    seasonYear;

  function handleStartEdit() {
    if (match) {
      setDraft(matchToDraft(match));
      edit.startEdit();
    }
  }

  function updateDraft<K extends keyof MatchRowDraft>(field: K, value: MatchRowDraft[K]) {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  async function handleConfirmSave() {
    if (!match || !draft || !seasonId || seasonYear === null) return;
    const patchOrError = draftToPatch(draft);
    if (typeof patchOrError === 'string') {
      toast.error('Validación', patchOrError);
      edit.closeConfirm();
      return;
    }

    edit.setSubmitting(true);
    try {
      if (isLocalMatch(match)) {
        updateLocalMatch(LIGA_MX_LEAGUE_ID, seasonId, match.id, patchOrError, teams);
        reloadLocalMatches();
        void queryClient.invalidateQueries({
          queryKey: queryKeys.matches(LIGA_MX_LEAGUE_ID, seasonYear),
        });
      } else {
        const updatedMatch = await patchMatchMutation.mutateAsync({
          matchId: match.id,
          patch: patchOrError,
        });
        setDraft(matchToDraft(updatedMatch));
      }
      toast.success('Partido actualizado');
      edit.finishEdit();
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'No se pudo guardar el partido.';
      toast.error('Error en la solicitud', message);
      edit.closeConfirm();
    } finally {
      edit.setSubmitting(false);
    }
  }

  const statusOptions = MATCH_STATUS_OPTIONS.map((status) => ({
    value: status,
    label: formatMatchStatusOption(status),
  }));

  return (
    <LigaMxDetailLayout
      title={match ? `${match.home.name ?? '—'} vs ${match.away.name ?? '—'}` : 'Partido'}
      subtitle={match ? truncateRecordId(match.id) : undefined}
      actions={
        match && draft ? (
          <AmericanFootballDetailEditActions
            editing={edit.editing}
            submitting={edit.submitting}
            onEdit={handleStartEdit}
            onCancel={edit.cancelEdit}
            onSave={edit.requestSave}
          />
        ) : undefined
      }
    >
      <DataSection
        loading={loading}
        error={error}
        isEmpty={!loading && !error && !match}
        emptyTitle="Partido no encontrado"
        emptyHint="Verifica que el partido exista en la temporada indicada."
        onRetry={() => {
          teamsRes.reload();
          seasonsRes.reload();
          matchesRes.reload();
        }}
      >
        {match && draft && (
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailField label="ID" value={<span className="font-mono text-xs">{match.id}</span>} />
            <DetailEditableField
              label="Fecha y hora (UTC)"
              value={formatDateTimeShort(match.date)}
              editing={edit.editing}
              editValue={draft.date}
              onChange={(value) => updateDraft('date', value)}
              type="datetime-local"
            />
            <DetailEditableSelect
              label="Temporada"
              value={displaySeasonYear ?? '—'}
              editing={edit.editing}
              editValue={draft.seasonId}
              onChange={(value) => updateDraft('seasonId', value)}
              options={seasonOptions}
            />
            <DetailEditableField
              label="Jornada"
              value={match.round ?? '—'}
              editing={edit.editing}
              editValue={draft.round}
              onChange={(value) => updateDraft('round', value)}
            />
            <DetailEditableField
              label="Sede"
              value={match.venue ?? '—'}
              editing={edit.editing}
              editValue={draft.venue}
              onChange={(value) => updateDraft('venue', value)}
            />
            <DetailEditableSelect
              label="Estado"
              value={match.status ?? '—'}
              editing={edit.editing}
              editValue={draft.status}
              onChange={(value) => updateDraft('status', value)}
              options={statusOptions}
            />
            <DetailEditableSelect
              label="Local"
              value={
                edit.editing ? (
                  teamLabel(homeTeam)
                ) : match.home.teamId ? (
                  <Link href={ligaMxTeamDetailPath(match.home.teamId)} className="text-blue-400 hover:underline">
                    {match.home.name ?? match.home.teamId}
                  </Link>
                ) : (
                  match.home.name ?? '—'
                )
              }
              editing={edit.editing}
              editValue={draft.homeTeamId}
              onChange={(value) => updateDraft('homeTeamId', value)}
              options={teamOptions}
            />
            <DetailEditableSelect
              label="Visitante"
              value={
                edit.editing ? (
                  teamLabel(awayTeam)
                ) : match.away.teamId ? (
                  <Link href={ligaMxTeamDetailPath(match.away.teamId)} className="text-blue-400 hover:underline">
                    {match.away.name ?? match.away.teamId}
                  </Link>
                ) : (
                  match.away.name ?? '—'
                )
              }
              editing={edit.editing}
              editValue={draft.awayTeamId}
              onChange={(value) => updateDraft('awayTeamId', value)}
              options={teamOptions}
            />
            <DetailEditableField
              label="Marcador local"
              value={match.home.score ?? '—'}
              editing={edit.editing}
              editValue={draft.homeScore}
              onChange={(value) => updateDraft('homeScore', sanitizeScoreInput(value))}
            />
            <DetailEditableField
              label="Marcador visitante"
              value={match.away.score ?? '—'}
              editing={edit.editing}
              editValue={draft.awayScore}
              onChange={(value) => updateDraft('awayScore', sanitizeScoreInput(value))}
            />
          </dl>
        )}
      </DataSection>

      <ConfirmModal
        open={edit.confirmOpen}
        title="Guardar cambios"
        message={`¿Confirmas la actualización del partido ${match?.home.name ?? ''} vs ${match?.away.name ?? ''}?`}
        confirmLabel="Guardar cambios"
        onConfirm={() => void handleConfirmSave()}
        onCancel={edit.closeConfirm}
        submitting={edit.submitting}
      />
    </LigaMxDetailLayout>
  );
}
