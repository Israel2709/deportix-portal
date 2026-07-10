'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiClientError, apiGet } from '@/lib/api';
import { useToast } from '@/components/notifications/ToastProvider';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { DataSection } from '@/components/states/States';
import { formatDateTimeShort } from '@/lib/format';
import { isLocalMatch, readLocalMatches, updateLocalMatch } from '@/lib/local-matches';
import { LIGA_MX_LEAGUE_ID } from '@/lib/liga-mx';
import { patchMatch } from '@/lib/match-api';
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
import { leagueMatchesPagePath } from '@/lib/use-all-matches';
import { applyTeamOverrides, readTeamOverrides } from '@/lib/team-edits';
import type { ApiCollection, Match, Season, Team } from '@/lib/types';
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
  const [match, setMatch] = useState<Match | null>(null);
  const [draft, setDraft] = useState<MatchRowDraft | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [seasons, setSeasons] = useState<SeasonOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    if (!seasonId || !year) {
      setLoading(false);
      setError('Faltan parámetros de temporada para cargar el partido.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const leagueId = encodeURIComponent(LIGA_MX_LEAGUE_ID);
      const [teamsEnvelope, seasonsEnvelope] = await Promise.all([
        apiGet<ApiCollection<Team>>(`/v1/leagues/${leagueId}/teams?pageSize=100`),
        apiGet<ApiCollection<Season>>(`/v1/leagues/${leagueId}/seasons`),
      ]);

      const loadedTeams = applyTeamOverrides(teamsEnvelope.data, readTeamOverrides()).sort((left, right) =>
        (left.name ?? '').localeCompare(right.name ?? ''),
      );
      const loadedSeasons = seasonsEnvelope.data
        .filter((season) => season.year != null)
        .map((season) => ({ season, year: season.year! }))
        .sort((left, right) => right.year - left.year);

      const matches: Match[] = [];
      let page = 1;
      let total = Number.POSITIVE_INFINITY;
      while (matches.length < total) {
        const response = await apiGet<ApiCollection<Match>>(
          leagueMatchesPagePath(LIGA_MX_LEAGUE_ID, Number(year), page),
        );
        matches.push(...response.data);
        total = response.meta.pagination?.total ?? matches.length;
        if (response.data.length === 0 || response.data.length < 100) break;
        page += 1;
      }
      const localMatches = readLocalMatches(LIGA_MX_LEAGUE_ID, seasonId);
      const loadedMatch = [...matches, ...localMatches].find((item) => item.id === matchId) ?? null;

      setTeams(loadedTeams);
      setSeasons(loadedSeasons);
      setMatch(loadedMatch);
      if (loadedMatch) {
        setDraft(matchToDraft(loadedMatch));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el partido');
    } finally {
      setLoading(false);
    }
  }, [matchId, seasonId, year]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  const teamOptions = useMemo(
    () => teams.map((team) => ({ value: team.id, label: team.name ?? team.id })),
    [teams],
  );

  const seasonOptions = useMemo(
    () =>
      seasons.map(({ season, year: seasonYear }) => ({
        value: season.id,
        label: `Temporada ${seasonYear}`,
      })),
    [seasons],
  );

  const homeTeam = teams.find((team) => team.id === (draft?.homeTeamId ?? match?.home.teamId));
  const awayTeam = teams.find((team) => team.id === (draft?.awayTeamId ?? match?.away.teamId));
  const seasonYear =
    seasons.find((item) => item.season.id === (draft?.seasonId ?? match?.seasonId))?.year ??
    (year ? Number(year) : null);

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
    if (!match || !draft || !seasonId) return;
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
      } else {
        await patchMatch(LIGA_MX_LEAGUE_ID, match.id, patchOrError);
      }
      toast.success('Partido actualizado');
      edit.finishEdit();
      setReloadKey((key) => key + 1);
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
              value={seasonYear ?? '—'}
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
