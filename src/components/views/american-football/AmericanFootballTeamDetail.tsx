'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getAmericanFootballLeagues,
  getAmericanFootballTeams,
  updateAmericanFootballTeam,
} from '@/lib/american-football-api';
import type { AmericanFootballTeamItem } from '@/lib/american-football-bff-types';
import {
  buildAmericanFootballTeamBody,
  teamToFormValues,
  validateAmericanFootballTeamForm,
  type AmericanFootballTeamFormValues,
} from '@/lib/american-football-forms/team-form';
import { truncateCanonicalId } from '@/lib/american-football-forms/shared';
import { americanFootballLeaguePath } from '@/lib/american-football-paths';
import { ApiClientError } from '@/lib/api';
import { useToast } from '@/components/notifications/ToastProvider';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { DataSection } from '@/components/states/States';
import Link from 'next/link';
import {
  AmericanFootballDetailLayout,
  DetailEditableField,
  DetailField,
} from './AmericanFootballDetailLayout';
import {
  AmericanFootballDetailEditActions,
} from './AmericanFootballDetailEditActions';
import { useAmericanFootballDetailEdit } from './useAmericanFootballDetailEdit';

export function AmericanFootballTeamDetail({
  teamId,
  leagueId,
  season,
}: {
  teamId: string;
  leagueId?: string;
  season?: string;
}) {
  const toast = useToast();
  const edit = useAmericanFootballDetailEdit();
  const [team, setTeam] = useState<AmericanFootballTeamItem | null>(null);
  const [leagueName, setLeagueName] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<AmericanFootballTeamFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    if (!leagueId || !season) {
      setLoading(false);
      setError('Faltan parámetros de liga y temporada para cargar el equipo.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [teamsEnvelope, leaguesEnvelope] = await Promise.all([
        getAmericanFootballTeams({ league: leagueId, season }),
        getAmericanFootballLeagues({ id: leagueId }),
      ]);
      const loadedTeam = teamsEnvelope.response.find((item) => item.id === teamId) ?? null;
      setTeam(loadedTeam);
      setLeagueName(leaguesEnvelope.response[0]?.league.name ?? null);
      if (loadedTeam) {
        setFormValues({
          ...teamToFormValues(loadedTeam),
          queryLeague: leagueId,
          querySeason: season,
        });
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el equipo');
    } finally {
      setLoading(false);
    }
  }, [teamId, leagueId, season]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  function updateField<K extends keyof AmericanFootballTeamFormValues>(
    field: K,
    value: AmericanFootballTeamFormValues[K],
  ) {
    setFormValues((current) => (current ? { ...current, [field]: value } : current));
  }

  function handleStartEdit() {
    if (team && leagueId && season) {
      setFormValues({
        ...teamToFormValues(team),
        queryLeague: leagueId,
        querySeason: season,
      });
      edit.startEdit();
    }
  }

  async function handleConfirmSave() {
    if (!formValues) return;
    const validation = validateAmericanFootballTeamForm(formValues, 'edit');
    if (validation) {
      toast.error('Validación', validation);
      edit.closeConfirm();
      return;
    }

    edit.setSubmitting(true);
    try {
      await updateAmericanFootballTeam(formValues.teamId, buildAmericanFootballTeamBody(formValues));
      toast.success('Equipo actualizado');
      edit.finishEdit();
      setReloadKey((key) => key + 1);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'No se pudo guardar el equipo.';
      toast.error('Error en la solicitud', message);
      edit.closeConfirm();
    } finally {
      edit.setSubmitting(false);
    }
  }

  return (
    <AmericanFootballDetailLayout
      title={team?.name ?? 'Equipo'}
      subtitle={leagueName && season ? `${leagueName} · ${season}` : truncateCanonicalId(teamId)}
      actions={
        team && formValues ? (
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
        isEmpty={!loading && !error && !team}
        emptyTitle="Equipo no encontrado"
        emptyHint="Verifica que el equipo exista en la liga y temporada indicadas."
      >
        {team && formValues && (
          <div className="space-y-4">
            {team.logo && !edit.editing && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={team.logo} alt="" className="h-16 w-16 rounded object-contain" />
            )}
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailEditableField
                label="Nombre"
                value={team.name}
                editing={edit.editing}
                editValue={formValues.name}
                onChange={(value) => updateField('name', value)}
              />
              <DetailField label="ID" value={<span className="font-mono text-xs">{team.id}</span>} />
              <DetailEditableField
                label="Logo"
                value={team.logo ?? '—'}
                editing={edit.editing}
                editValue={formValues.logo}
                onChange={(value) => updateField('logo', value)}
              />
              <DetailEditableField
                label="Logo alternativo"
                value={team.altLogo ?? '—'}
                editing={edit.editing}
                editValue={formValues.altLogo}
                onChange={(value) => updateField('altLogo', value)}
              />
              {leagueId && (
                <DetailField
                  label="Liga"
                  value={
                    leagueName ? (
                      <Link
                        href={americanFootballLeaguePath({ id: leagueId, externalId: null })}
                        className="text-blue-400 hover:underline"
                      >
                        {leagueName}
                      </Link>
                    ) : (
                      leagueId
                    )
                  }
                />
              )}
              {season && <DetailField label="Temporada" value={season} />}
            </dl>
          </div>
        )}
      </DataSection>

      <ConfirmModal
        open={edit.confirmOpen}
        title="Guardar cambios"
        message={`¿Confirmas la actualización del equipo ${team?.name ?? ''}?`}
        confirmLabel="Guardar cambios"
        onConfirm={() => void handleConfirmSave()}
        onCancel={edit.closeConfirm}
        submitting={edit.submitting}
      />
    </AmericanFootballDetailLayout>
  );
}
