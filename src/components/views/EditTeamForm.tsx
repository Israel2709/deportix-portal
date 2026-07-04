'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { useToast } from '@/components/notifications/ToastProvider';
import { ImageUrlInput } from '@/components/ui/ImageUrlInput';
import { useApi } from '@/lib/use-api';
import { ApiClientError } from '@/lib/api';
import type { ApiResource, Team } from '@/lib/types';
import { applyTeamPatch } from '@/lib/team-edits';
import { patchTeamApi } from '@/lib/team-api';
import { useTeamOverrides } from '@/lib/use-team-overrides';
import { AMERICAN_FOOTBALL_SPORT_LABEL } from '@/lib/sports';
import {
  TEAM_FORM_FIELD_LABELS,
  formValuesToPatch,
  teamFormFieldsForSport,
  teamToFormValues,
  validateTeamForm,
  type TeamFormField,
  type TeamFormValues,
} from '@/lib/team-form';
import { Card, SectionTitle } from '@/components/ui/Ui';
import { ErrorState, LoadingState } from '@/components/states/States';

const inputClassName =
  'mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100';
const labelClassName = 'block text-sm font-medium text-slate-200';

const IMAGE_FIELDS = new Set<TeamFormField>(['logo', 'altLogo']);

function FieldInput({
  field,
  values,
  onChange,
}: {
  field: TeamFormField;
  values: TeamFormValues;
  onChange: (field: TeamFormField, value: string) => void;
}) {
  const id = `team-${field}`;
  const isCapacity = field === 'venueCapacity';

  return (
    <div>
      <label className={labelClassName} htmlFor={id}>
        {TEAM_FORM_FIELD_LABELS[field]}
        {field === 'name' && ' *'}
      </label>
      <input
        id={id}
        type={isCapacity ? 'number' : 'text'}
        min={isCapacity ? '0' : undefined}
        step={isCapacity ? '1' : undefined}
        required={field === 'name'}
        value={values[field]}
        onChange={(event) => onChange(field, event.target.value)}
        className={inputClassName}
      />
    </div>
  );
}

export function EditTeamView({ leagueId, teamId }: { leagueId: string; teamId: string }) {
  const router = useRouter();
  const toast = useToast();
  const encodedTeamId = encodeURIComponent(teamId);
  const teamRes = useApi<ApiResource<Team>>(`/v1/teams/${encodedTeamId}`);
  const { overrides: teamOverrides } = useTeamOverrides();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const baseTeam = teamRes.data?.data;
  const sport = baseTeam?.sport ?? null;

  const mergedTeam = useMemo(() => {
    if (!baseTeam) return null;
    return applyTeamPatch(baseTeam, teamOverrides[baseTeam.id]);
  }, [baseTeam, teamOverrides]);

  const initialValues = useMemo(() => {
    if (!mergedTeam) return null;
    return teamToFormValues(mergedTeam);
  }, [mergedTeam]);

  const [values, setValues] = useState<TeamFormValues | null>(null);
  const effectiveValues = values ?? initialValues;

  const fields = teamFormFieldsForSport(sport);
  const generalFields = fields.filter(
    (field) =>
      !field.startsWith('venue') &&
      field !== 'city' &&
      field !== 'conference' &&
      field !== 'division' &&
      !IMAGE_FIELDS.has(field),
  );
  const imageFields = fields.filter((field) => IMAGE_FIELDS.has(field));
  const americanFootballFields = fields.filter((field) =>
    ['city', 'conference', 'division'].includes(field),
  );
  const venueFields = fields.filter((field) => field.startsWith('venue'));

  const backHref = `/leagues/${encodeURIComponent(leagueId)}`;

  function updateField(field: TeamFormField, value: string) {
    setValues((current) => ({
      ...(current ?? initialValues ?? teamToFormValues(baseTeam!)),
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!baseTeam || !effectiveValues) {
      setError('No se pudo cargar el equipo.');
      return;
    }

    const validationError = validateTeamForm(effectiveValues, sport);
    if (validationError) {
      setError(validationError);
      return;
    }

    const patch = formValuesToPatch(effectiveValues, sport);
    setSubmitting(true);
    try {
      await patchTeamApi(baseTeam.id, patch);
      toast.success('Equipo actualizado', 'Los cambios se guardaron en la API.');
      router.push(backHref);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : 'No se pudo guardar el equipo.';
      setError(message);
      toast.error('Error al guardar', message);
    } finally {
      setSubmitting(false);
    }
  }

  if (teamRes.loading) return <LoadingState label="Cargando equipo…" />;
  if (teamRes.error) return <ErrorState message={teamRes.error} onRetry={teamRes.reload} />;
  if (!baseTeam || !effectiveValues) {
    return <ErrorState message="Equipo no encontrado." onRetry={() => router.push(backHref)} />;
  }

  const previewTeam = applyTeamPatch(baseTeam, formValuesToPatch(effectiveValues, sport));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section>
        <Link href={backHref} className="text-sm text-blue-400 hover:underline">
          ← Volver a la liga
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-50">Editar equipo</h1>
        <p className="mt-2 text-sm text-slate-400">
          Modifica los datos del equipo y guarda en la API. Los logos pueden ser URL externa o
          archivo subido a Firebase Storage.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {previewTeam.name ?? teamId}
          {sport ? ` · ${sport}` : ''}
        </p>
      </section>

      <Card className="flex items-center gap-3">
        {(previewTeam.altLogo ?? previewTeam.logo) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewTeam.altLogo ?? previewTeam.logo ?? ''}
            alt=""
            className="h-12 w-12 object-contain"
          />
        )}
        <div>
          <p className="font-medium text-slate-100">
            {previewTeam.altName ?? previewTeam.name ?? teamId}
          </p>
          {previewTeam.altName && previewTeam.name && (
            <p className="text-xs text-slate-500">{previewTeam.name}</p>
          )}
        </div>
      </Card>

      <Card>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
          <div>
            <SectionTitle>Datos generales</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              {generalFields.map((field) => (
                <FieldInput
                  key={field}
                  field={field}
                  values={effectiveValues}
                  onChange={updateField}
                />
              ))}
            </div>
          </div>

          {imageFields.length > 0 && (
            <div>
              <SectionTitle>Imágenes</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                {imageFields.includes('logo') && (
                  <ImageUrlInput
                    label={TEAM_FORM_FIELD_LABELS.logo}
                    value={effectiveValues.logo}
                    onChange={(v) => updateField('logo', v)}
                    purpose="logo"
                    entityId={baseTeam.id}
                    onUploadError={(msg) => toast.error('Error al subir', msg)}
                  />
                )}
                {imageFields.includes('altLogo') && (
                  <ImageUrlInput
                    label={TEAM_FORM_FIELD_LABELS.altLogo}
                    value={effectiveValues.altLogo}
                    onChange={(v) => updateField('altLogo', v)}
                    purpose="alt_logo"
                    entityId={baseTeam.id}
                    onUploadError={(msg) => toast.error('Error al subir', msg)}
                  />
                )}
              </div>
            </div>
          )}

          {americanFootballFields.length > 0 && (
            <div>
              <SectionTitle>{AMERICAN_FOOTBALL_SPORT_LABEL}</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                {americanFootballFields.map((field) => (
                  <FieldInput
                    key={field}
                    field={field}
                    values={effectiveValues}
                    onChange={updateField}
                  />
                ))}
              </div>
            </div>
          )}

          {venueFields.length > 0 && (
            <div>
              <SectionTitle>Estadio</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                {venueFields.map((field) => (
                  <FieldInput
                    key={field}
                    field={field}
                    values={effectiveValues}
                    onChange={updateField}
                  />
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-300">{error}</p>}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {submitting ? 'Guardando…' : 'Guardar cambios'}
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
