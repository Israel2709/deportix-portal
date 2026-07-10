'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getAmericanFootballLeagues,
  getAmericanFootballStandings,
  updateAmericanFootballStanding,
} from '@/lib/american-football-api';
import type { AmericanFootballStandingItem } from '@/lib/american-football-bff-types';
import {
  buildAmericanFootballStandingBody,
  standingToFormValues,
  validateAmericanFootballStandingForm,
  type AmericanFootballStandingFormValues,
} from '@/lib/american-football-forms/standing-form';
import { truncateCanonicalId } from '@/lib/american-football-forms/shared';
import {
  americanFootballLeaguePath,
  americanFootballTeamDetailPath,
} from '@/lib/american-football-paths';
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
import { AmericanFootballDetailEditActions } from './AmericanFootballDetailEditActions';
import { useAmericanFootballDetailEdit } from './useAmericanFootballDetailEdit';

export function AmericanFootballStandingDetail({
  standingId,
  leagueId,
  season,
}: {
  standingId: string;
  leagueId: string;
  season: string;
}) {
  const toast = useToast();
  const edit = useAmericanFootballDetailEdit();
  const [standing, setStanding] = useState<AmericanFootballStandingItem | null>(null);
  const [leagueName, setLeagueName] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<AmericanFootballStandingFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    if (!leagueId || !season) {
      setLoading(false);
      setError('Faltan parámetros de liga y temporada para cargar la clasificación.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [standingsEnvelope, leaguesEnvelope] = await Promise.all([
        getAmericanFootballStandings({ league: leagueId, season }),
        getAmericanFootballLeagues({ id: leagueId }),
      ]);
      const loadedStanding = standingsEnvelope.response.find((item) => item.id === standingId) ?? null;
      setStanding(loadedStanding);
      setLeagueName(leaguesEnvelope.response[0]?.league.name ?? null);
      if (loadedStanding) {
        setFormValues({
          ...standingToFormValues(loadedStanding),
          queryLeague: leagueId,
          querySeason: season,
        });
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la clasificación');
    } finally {
      setLoading(false);
    }
  }, [standingId, leagueId, season]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  function updateField<K extends keyof AmericanFootballStandingFormValues>(
    field: K,
    value: AmericanFootballStandingFormValues[K],
  ) {
    setFormValues((current) => (current ? { ...current, [field]: value } : current));
  }

  function handleStartEdit() {
    if (standing && leagueId && season) {
      setFormValues({
        ...standingToFormValues(standing),
        queryLeague: leagueId,
        querySeason: season,
      });
      edit.startEdit();
    }
  }

  async function handleConfirmSave() {
    if (!formValues) return;
    const validation = validateAmericanFootballStandingForm(formValues, 'edit');
    if (validation) {
      toast.error('Validación', validation);
      edit.closeConfirm();
      return;
    }

    edit.setSubmitting(true);
    try {
      await updateAmericanFootballStanding(formValues.standingId, buildAmericanFootballStandingBody(formValues));
      toast.success('Clasificación actualizada');
      edit.finishEdit();
      setReloadKey((key) => key + 1);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'No se pudo guardar la clasificación.';
      toast.error('Error en la solicitud', message);
      edit.closeConfirm();
    } finally {
      edit.setSubmitting(false);
    }
  }

  return (
    <AmericanFootballDetailLayout
      title={standing ? `#${standing.position ?? '—'} ${standing.team.name}` : 'Clasificación'}
      subtitle={leagueName && season ? `${leagueName} · ${season}` : truncateCanonicalId(standingId)}
      actions={
        standing && formValues ? (
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
        isEmpty={!loading && !error && !standing}
        emptyTitle="Registro no encontrado"
        emptyHint="Verifica que la fila exista en la liga y temporada indicadas."
      >
        {standing && formValues && (
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailEditableField
              label="Posición"
              value={standing.position ?? '—'}
              editing={edit.editing}
              editValue={formValues.position}
              onChange={(value) => updateField('position', value)}
            />
            <DetailField label="ID" value={<span className="font-mono text-xs">{standing.id}</span>} />
            <DetailEditableField
              label="Conferencia"
              value={standing.conference ?? '—'}
              editing={edit.editing}
              editValue={formValues.conference}
              onChange={(value) => updateField('conference', value)}
            />
            <DetailEditableField
              label="División"
              value={standing.division ?? '—'}
              editing={edit.editing}
              editValue={formValues.division}
              onChange={(value) => updateField('division', value)}
            />
            <DetailEditableField
              label="Ganados"
              value={standing.won ?? '—'}
              editing={edit.editing}
              editValue={formValues.won}
              onChange={(value) => updateField('won', value)}
            />
            <DetailEditableField
              label="Perdidos"
              value={standing.lost ?? '—'}
              editing={edit.editing}
              editValue={formValues.lost}
              onChange={(value) => updateField('lost', value)}
            />
            <DetailEditableField
              label="Empates"
              value={standing.ties ?? '—'}
              editing={edit.editing}
              editValue={formValues.ties}
              onChange={(value) => updateField('ties', value)}
            />
            <DetailEditableField
              label="Racha"
              value={standing.streak ?? '—'}
              editing={edit.editing}
              editValue={formValues.streak}
              onChange={(value) => updateField('streak', value)}
            />
            <DetailEditableField
              label="Puntos a favor"
              value={standing.points?.for ?? '—'}
              editing={edit.editing}
              editValue={formValues.pointsFor}
              onChange={(value) => updateField('pointsFor', value)}
            />
            <DetailEditableField
              label="Puntos en contra"
              value={standing.points?.against ?? '—'}
              editing={edit.editing}
              editValue={formValues.pointsAgainst}
              onChange={(value) => updateField('pointsAgainst', value)}
            />
            <DetailEditableField
              label="Diferencia de puntos"
              value={standing.points?.difference ?? '—'}
              editing={edit.editing}
              editValue={formValues.pointsDifference}
              onChange={(value) => updateField('pointsDifference', value)}
            />
            <DetailEditableField
              label="Récord local"
              value={standing.records?.home ?? '—'}
              editing={edit.editing}
              editValue={formValues.recordHome}
              onChange={(value) => updateField('recordHome', value)}
            />
            <DetailEditableField
              label="Récord visitante"
              value={standing.records?.road ?? '—'}
              editing={edit.editing}
              editValue={formValues.recordRoad}
              onChange={(value) => updateField('recordRoad', value)}
            />
            <DetailEditableField
              label="Récord conferencia"
              value={standing.records?.conference ?? '—'}
              editing={edit.editing}
              editValue={formValues.recordConference}
              onChange={(value) => updateField('recordConference', value)}
            />
            <DetailEditableField
              label="Récord división"
              value={standing.records?.division ?? '—'}
              editing={edit.editing}
              editValue={formValues.recordDivision}
              onChange={(value) => updateField('recordDivision', value)}
            />
            <DetailEditableField
              label="Equipo (nombre)"
              value={
                edit.editing ? (
                  standing.team.name
                ) : (
                  <Link
                    href={americanFootballTeamDetailPath(standing.team.id, { league: leagueId, season })}
                    className="text-blue-400 hover:underline"
                  >
                    {standing.team.name}
                  </Link>
                )
              }
              editing={edit.editing}
              editValue={formValues.teamName}
              onChange={(value) => updateField('teamName', value)}
            />
            <DetailEditableField
              label="Equipo (ID)"
              value={standing.team.id}
              editing={edit.editing}
              editValue={formValues.teamId}
              onChange={(value) => updateField('teamId', value)}
            />
            <DetailEditableField
              label="Equipo (logo)"
              value={standing.team.logo ?? '—'}
              editing={edit.editing}
              editValue={formValues.teamLogo}
              onChange={(value) => updateField('teamLogo', value)}
            />
            <DetailEditableField
              label="Liga (nombre)"
              value={standing.league.name}
              editing={edit.editing}
              editValue={formValues.leagueName}
              onChange={(value) => updateField('leagueName', value)}
            />
            <DetailEditableField
              label="Liga (ID)"
              value={standing.league.id}
              editing={edit.editing}
              editValue={formValues.leagueId}
              onChange={(value) => updateField('leagueId', value)}
            />
            <DetailEditableField
              label="Temporada (liga)"
              value={standing.league.season ?? season}
              editing={edit.editing}
              editValue={formValues.leagueSeason}
              onChange={(value) => updateField('leagueSeason', value)}
            />
            {!edit.editing && leagueName && (
              <DetailField
                label="Liga (enlace)"
                value={
                  <Link
                    href={americanFootballLeaguePath({ id: leagueId, externalId: null })}
                    className="text-blue-400 hover:underline"
                  >
                    {leagueName}
                  </Link>
                }
              />
            )}
          </dl>
        )}
      </DataSection>

      <ConfirmModal
        open={edit.confirmOpen}
        title="Guardar cambios"
        message={`¿Confirmas la actualización de la fila de clasificación de ${standing?.team.name ?? ''}?`}
        confirmLabel="Guardar cambios"
        onConfirm={() => void handleConfirmSave()}
        onCancel={edit.closeConfirm}
        submitting={edit.submitting}
      />
    </AmericanFootballDetailLayout>
  );
}
