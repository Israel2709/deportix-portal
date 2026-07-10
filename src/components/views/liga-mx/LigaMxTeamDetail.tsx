'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApi } from '@/lib/use-api';
import { ApiClientError } from '@/lib/api';
import { useToast } from '@/components/notifications/ToastProvider';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ImageUrlInput } from '@/components/ui/ImageUrlInput';
import { DataSection } from '@/components/states/States';
import { patchTeamApi } from '@/lib/team-api';
import { applyTeamPatch } from '@/lib/team-edits';
import { useTeamOverrides } from '@/lib/use-team-overrides';
import {
  TEAM_FORM_FIELD_LABELS,
  formValuesToPatch,
  teamToFormValues,
  validateTeamForm,
  type TeamFormField,
  type TeamFormValues,
} from '@/lib/team-form';
import type { ApiResource, Team } from '@/lib/types';
import { truncateRecordId } from '@/lib/liga-mx-paths';
import {
  DetailEditableField,
  DetailField,
  LigaMxDetailLayout,
} from './LigaMxDetailLayout';
import { AmericanFootballDetailEditActions } from '@/components/views/american-football/AmericanFootballDetailEditActions';
import { useAmericanFootballDetailEdit } from '@/components/views/american-football/useAmericanFootballDetailEdit';

const SOCCER_EDIT_FIELDS: TeamFormField[] = [
  'name',
  'code',
  'country',
  'altName',
  'venueName',
  'venueCity',
  'venueCapacity',
];

function displayTeamField(team: Team, field: TeamFormField): string {
  switch (field) {
    case 'venueName':
      return team.venue?.name ?? '—';
    case 'venueCity':
      return team.venue?.city ?? '—';
    case 'venueCapacity':
      return team.venue?.capacity != null ? String(team.venue.capacity) : '—';
    default:
      return (team[field as keyof Team] as string | null) ?? '—';
  }
}

export function LigaMxTeamDetail({ teamId }: { teamId: string }) {
  const toast = useToast();
  const edit = useAmericanFootballDetailEdit();
  const teamRes = useApi<ApiResource<Team>>(`/v1/teams/${encodeURIComponent(teamId)}`);
  const { overrides: teamOverrides } = useTeamOverrides();
  const [formValues, setFormValues] = useState<TeamFormValues | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const baseTeam = teamRes.data?.data;
  const mergedTeam = useMemo(() => {
    if (!baseTeam) return null;
    return applyTeamPatch(baseTeam, teamOverrides[baseTeam.id]);
  }, [baseTeam, teamOverrides]);

  useEffect(() => {
    if (mergedTeam) {
      setFormValues(teamToFormValues(mergedTeam));
    }
  }, [mergedTeam, reloadKey]);

  const updateField = useCallback((field: TeamFormField, value: string) => {
    setFormValues((current) => (current ? { ...current, [field]: value } : current));
  }, []);

  function handleStartEdit() {
    if (mergedTeam) {
      setFormValues(teamToFormValues(mergedTeam));
      edit.startEdit();
    }
  }

  async function handleConfirmSave() {
    if (!baseTeam || !formValues) return;
    const validation = validateTeamForm(formValues, 'soccer');
    if (validation) {
      toast.error('Validación', validation);
      edit.closeConfirm();
      return;
    }

    edit.setSubmitting(true);
    try {
      await patchTeamApi(baseTeam.id, formValuesToPatch(formValues, 'soccer'));
      toast.success('Equipo actualizado');
      edit.finishEdit();
      setReloadKey((key) => key + 1);
      teamRes.reload();
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'No se pudo guardar el equipo.';
      toast.error('Error en la solicitud', message);
      edit.closeConfirm();
    } finally {
      edit.setSubmitting(false);
    }
  }

  return (
    <LigaMxDetailLayout
      title={mergedTeam?.name ?? 'Equipo'}
      subtitle={truncateRecordId(teamId)}
      actions={
        mergedTeam && formValues ? (
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
        loading={teamRes.loading}
        error={teamRes.error}
        isEmpty={!teamRes.loading && !teamRes.error && !mergedTeam}
        onRetry={teamRes.reload}
        emptyTitle="Equipo no encontrado"
        emptyHint="Verifica que el equipo exista en la API."
      >
        {mergedTeam && formValues && (
          <div className="space-y-4">
            {(mergedTeam.logo || mergedTeam.altLogo) && !edit.editing && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mergedTeam.altLogo ?? mergedTeam.logo ?? ''}
                alt=""
                className="h-16 w-16 rounded object-contain"
              />
            )}
            <dl className="grid gap-4 sm:grid-cols-2">
              {SOCCER_EDIT_FIELDS.map((field) => (
                <DetailEditableField
                  key={field}
                  label={TEAM_FORM_FIELD_LABELS[field]}
                  value={displayTeamField(mergedTeam, field)}
                  editing={edit.editing}
                  editValue={formValues[field]}
                  onChange={(value) => updateField(field, value)}
                  type={field === 'venueCapacity' ? 'number' : 'text'}
                />
              ))}
              <DetailField label="ID" value={<span className="font-mono text-xs">{mergedTeam.id}</span>} />
              {edit.editing ? (
                <>
                  <ImageUrlInput
                    label={TEAM_FORM_FIELD_LABELS.logo}
                    value={formValues.logo}
                    onChange={(value) => updateField('logo', value)}
                    purpose="logo"
                    entityId={mergedTeam.id}
                    onUploadError={(msg) => toast.error('Error al subir', msg)}
                  />
                  <ImageUrlInput
                    label={TEAM_FORM_FIELD_LABELS.altLogo}
                    value={formValues.altLogo}
                    onChange={(value) => updateField('altLogo', value)}
                    purpose="alt_logo"
                    entityId={mergedTeam.id}
                    onUploadError={(msg) => toast.error('Error al subir', msg)}
                  />
                </>
              ) : (
                <>
                  <DetailField label="Logo" value={mergedTeam.logo ?? '—'} />
                  <DetailField label="Logo alternativo" value={mergedTeam.altLogo ?? '—'} />
                </>
              )}
            </dl>
          </div>
        )}
      </DataSection>

      <ConfirmModal
        open={edit.confirmOpen}
        title="Guardar cambios"
        message={`¿Confirmas la actualización del equipo ${mergedTeam?.name ?? ''}?`}
        confirmLabel="Guardar cambios"
        onConfirm={() => void handleConfirmSave()}
        onCancel={edit.closeConfirm}
        submitting={edit.submitting}
      />
    </LigaMxDetailLayout>
  );
}
