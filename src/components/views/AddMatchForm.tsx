'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { useApi } from '@/lib/use-api';
import type { ApiCollection, ApiResource, League, Season, Team } from '@/lib/types';
import { leaguePath } from '@/lib/leagues';
import {
  EMPTY_MATCH_FORM,
  MATCH_STATUS_LABELS,
  MATCH_STATUS_OPTIONS,
  buildMatchCreateBodyFromForm,
  formatMatchStatusOption,
  validateMatchForm,
  type MatchFormValues,
} from '@/lib/match-form';
import { createMatchApi } from '@/lib/match-api';
import { stashCreatedMatch } from '@/lib/pending-created-match';
import { ApiClientError } from '@/lib/api';
import { venueNameForTeam } from '@/lib/venues';
import { pickDefaultSeason } from '@/lib/seasons';
import { Card, SectionTitle } from '@/components/ui/Ui';
import { ErrorState, LoadingState } from '@/components/states/States';

const inputClassName =
  'mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100';

const selectClassName =
  'mt-1 w-full rounded-md border border-slate-700 bg-slate-950 pl-3 py-2 text-sm text-slate-100';
const labelClassName = 'block text-sm font-medium text-slate-200';

export function AddMatchView({
  leagueId,
  seasonYear,
}: {
  leagueId: string;
  seasonYear: number | null;
}) {
  const router = useRouter();
  const id = encodeURIComponent(leagueId);
  const leagueRes = useApi<ApiResource<League>>(`/v1/leagues/${id}`);
  const seasonsRes = useApi<ApiCollection<Season>>(`/v1/leagues/${id}/seasons`);
  const teamsRes = useApi<ApiCollection<Team>>(`/v1/leagues/${id}/teams?pageSize=100`);
  const [values, setValues] = useState<MatchFormValues>(EMPTY_MATCH_FORM);
  const [venueEditedByUser, setVenueEditedByUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const league = leagueRes.data?.data;
  const seasons = seasonsRes.data?.data ?? [];
  const teams = teamsRes.data?.data ?? [];
  const currentSeason = useMemo(() => pickDefaultSeason(seasons), [seasons]);

  const selectedSeason = useMemo(() => {
    if (seasonYear !== null) {
      return seasons.find((season) => season.year === seasonYear) ?? null;
    }
    return currentSeason;
  }, [seasons, seasonYear, currentSeason]);

  const backHref = league
    ? leaguePath({ id: league.id, externalId: league.externalId })
    : `/leagues/${id}`;

  function updateField<K extends keyof MatchFormValues>(field: K, value: MatchFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handleHomeTeamChange(teamId: string) {
    const nextHomeVenue = venueNameForTeam(teams, teamId) ?? '';
    setValues((current) => ({
      ...current,
      homeTeamId: teamId,
      venue: venueEditedByUser ? current.venue : nextHomeVenue,
    }));
  }

  function handleVenueChange(value: string) {
    setVenueEditedByUser(true);
    updateField('venue', value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!league || !selectedSeason) {
      setError('No se pudo resolver la liga o la temporada seleccionada.');
      return;
    }

    const validationError = validateMatchForm(values);
    if (validationError) {
      setError(validationError);
      return;
    }

    const bodyOrError = buildMatchCreateBodyFromForm(values, teams, {
      seasonId: selectedSeason.id,
    });
    if (typeof bodyOrError === 'string') {
      setError(bodyOrError);
      return;
    }

    setSubmitting(true);
    try {
      const created = await createMatchApi(leagueId, bodyOrError, selectedSeason.year);
      stashCreatedMatch(created, selectedSeason.id);
      router.push(backHref);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo crear el partido.');
    } finally {
      setSubmitting(false);
    }
  }

  if (leagueRes.loading || seasonsRes.loading || teamsRes.loading) {
    return <LoadingState label="Cargando formulario…" />;
  }

  if (leagueRes.error) {
    return <ErrorState message={leagueRes.error} onRetry={leagueRes.reload} />;
  }

  if (!selectedSeason) {
    return (
      <ErrorState
        message="No hay una temporada disponible para agregar partidos."
        onRetry={() => router.push(backHref)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section>
        <Link href={backHref} className="text-sm text-blue-400 hover:underline">
          ← Volver a la liga
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-50">Agregar partido</h1>
        <p className="mt-2 text-sm text-slate-400">
          Crea un partido en la temporada seleccionada. Se guardará en la base de datos y
          aparecerá en el calendario junto con el resto de partidos de la API.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {league?.name ?? leagueId} · Temporada {selectedSeason.year ?? selectedSeason.externalId ?? selectedSeason.id}
        </p>
      </section>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClassName} htmlFor="match-date">
                Fecha y hora *
              </label>
              <input
                id="match-date"
                type="datetime-local"
                required
                value={values.date}
                onChange={(event) => updateField('date', event.target.value)}
                className={inputClassName}
                disabled={submitting}
              />
            </div>

            <div>
              <label className={labelClassName} htmlFor="match-status">
                Estado *
              </label>
              <select
                id="match-status"
                required
                value={values.status}
                onChange={(event) =>
                  updateField('status', event.target.value as MatchFormValues['status'])
                }
                className={selectClassName}
                disabled={submitting}
              >
                {MATCH_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {formatMatchStatusOption(status)}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                {values.status}: {MATCH_STATUS_LABELS[values.status]}
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className={labelClassName} htmlFor="match-round">
                Jornada
              </label>
              <input
                id="match-round"
                type="text"
                value={values.round}
                placeholder="Apertura - 1"
                onChange={(event) => updateField('round', event.target.value)}
                className={inputClassName}
                disabled={submitting}
              />
            </div>
          </div>

          <div>
            <SectionTitle>Local</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
              <div>
                <label className={labelClassName} htmlFor="home-team">
                  Equipo *
                </label>
                <select
                  id="home-team"
                  required
                  value={values.homeTeamId}
                  onChange={(event) => handleHomeTeamChange(event.target.value)}
                  className={selectClassName}
                  disabled={submitting}
                >
                  <option value="">Selecciona un equipo</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name ?? team.id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClassName} htmlFor="home-score">
                  Goles
                </label>
                <input
                  id="home-score"
                  type="number"
                  min="0"
                  step="1"
                  value={values.homeScore}
                  onChange={(event) => updateField('homeScore', event.target.value)}
                  className={inputClassName}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          <div>
            <SectionTitle>Visitante</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
              <div>
                <label className={labelClassName} htmlFor="away-team">
                  Equipo *
                </label>
                <select
                  id="away-team"
                  required
                  value={values.awayTeamId}
                  onChange={(event) => updateField('awayTeamId', event.target.value)}
                  className={selectClassName}
                  disabled={submitting}
                >
                  <option value="">Selecciona un equipo</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name ?? team.id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClassName} htmlFor="away-score">
                  Goles
                </label>
                <input
                  id="away-score"
                  type="number"
                  min="0"
                  step="1"
                  value={values.awayScore}
                  onChange={(event) => updateField('awayScore', event.target.value)}
                  className={inputClassName}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          <div>
            <label className={labelClassName} htmlFor="match-venue">
              Sede
            </label>
            <input
              id="match-venue"
              type="text"
              value={values.venue}
              placeholder={values.homeTeamId ? 'Sede del equipo local' : 'Selecciona primero el local'}
              onChange={(event) => handleVenueChange(event.target.value)}
              className={inputClassName}
              disabled={submitting}
            />
            <p className="mt-1 text-xs text-slate-500">
              Se completa con el estadio del local. Puedes editarla si el partido no se juega ahí.
            </p>
          </div>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {submitting ? 'Guardando…' : 'Guardar partido'}
            </button>
            <Link
              href={backHref}
              className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
