'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getAmericanFootballLeagues,
  getAmericanFootballSeasons,
  updateAmericanFootballLeague,
} from '@/lib/american-football-api';
import type { AmericanFootballLeagueItem } from '@/lib/american-football-bff-types';
import {
  buildAmericanFootballLeagueBody,
  leagueToFormValues,
  validateAmericanFootballLeagueForm,
} from '@/lib/american-football-forms/league-form';
import { americanFootballLeaguePath } from '@/lib/american-football-paths';
import { ApiClientError } from '@/lib/api';
import { useToast } from '@/components/notifications/ToastProvider';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { DataSection } from '@/components/states/States';
import Link from 'next/link';
import {
  AmericanFootballDetailLayout,
  DetailEditableCheckbox,
  DetailEditableField,
  DetailField,
} from './AmericanFootballDetailLayout';
import { AmericanFootballDetailEditActions } from './AmericanFootballDetailEditActions';
import { useAmericanFootballDetailEdit } from './useAmericanFootballDetailEdit';

interface SeasonEditValues {
  current: boolean;
  start: string;
  end: string;
}

export function AmericanFootballSeasonDetail({
  leagueId,
  year,
}: {
  leagueId: string;
  year: string;
}) {
  const toast = useToast();
  const edit = useAmericanFootballDetailEdit();
  const [league, setLeague] = useState<AmericanFootballLeagueItem | null>(null);
  const [seasonYears, setSeasonYears] = useState<number[]>([]);
  const [formValues, setFormValues] = useState<SeasonEditValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [leaguesEnvelope, seasonsEnvelope] = await Promise.all([
        getAmericanFootballLeagues({ id: leagueId }),
        getAmericanFootballSeasons(leagueId),
      ]);
      const loadedLeague = leaguesEnvelope.response[0] ?? null;
      setLeague(loadedLeague);
      setSeasonYears(seasonsEnvelope.response);
      const seasonMeta = loadedLeague?.seasons.find((item) => String(item.year) === year);
      if (seasonMeta) {
        setFormValues({
          current: seasonMeta.current,
          start: seasonMeta.start ?? '',
          end: seasonMeta.end ?? '',
        });
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la temporada');
    } finally {
      setLoading(false);
    }
  }, [leagueId, year]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  const seasonMeta = league?.seasons.find((item) => String(item.year) === year);

  function handleStartEdit() {
    if (seasonMeta) {
      setFormValues({
        current: seasonMeta.current,
        start: seasonMeta.start ?? '',
        end: seasonMeta.end ?? '',
      });
      edit.startEdit();
    }
  }

  async function handleConfirmSave() {
    if (!league || !formValues) return;

    const leagueValues = leagueToFormValues(league);
    const validation = validateAmericanFootballLeagueForm(leagueValues, 'edit');
    if (validation) {
      toast.error('Validación', validation);
      edit.closeConfirm();
      return;
    }

    const updatedSeasons = league.seasons.map((season) =>
      String(season.year) === year
        ? {
            ...season,
            current: formValues.current,
            start: formValues.start.trim() || null,
            end: formValues.end.trim() || null,
          }
        : season,
    );

    edit.setSubmitting(true);
    try {
      await updateAmericanFootballLeague(
        league.league.id,
        buildAmericanFootballLeagueBody(leagueValues, updatedSeasons),
      );
      toast.success('Temporada actualizada');
      edit.finishEdit();
      setReloadKey((key) => key + 1);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'No se pudo guardar la temporada.';
      toast.error('Error en la solicitud', message);
      edit.closeConfirm();
    } finally {
      edit.setSubmitting(false);
    }
  }

  return (
    <AmericanFootballDetailLayout
      title={`Temporada ${year}`}
      subtitle={league?.league.name ?? leagueId}
      actions={
        seasonMeta && formValues ? (
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
        isEmpty={!loading && !error && !seasonYears.includes(Number(year))}
        emptyTitle="Temporada no encontrada"
        emptyHint="Verifica que la temporada exista para esta liga."
      >
        {seasonMeta && formValues && (
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Año" value={year} />
            <DetailField
              label="Liga"
              value={
                league ? (
                  <Link
                    href={americanFootballLeaguePath({ id: league.league.id, externalId: null })}
                    className="text-blue-400 hover:underline"
                  >
                    {league.league.name}
                  </Link>
                ) : (
                  leagueId
                )
              }
            />
            <DetailEditableCheckbox
              label="Actual"
              value={seasonMeta.current ? 'Sí' : 'No'}
              editing={edit.editing}
              checked={formValues.current}
              onChange={(checked) => setFormValues((current) => (current ? { ...current, current: checked } : current))}
            />
            <DetailEditableField
              label="Inicio"
              value={seasonMeta.start ?? '—'}
              editing={edit.editing}
              editValue={formValues.start}
              onChange={(value) => setFormValues((current) => (current ? { ...current, start: value } : current))}
            />
            <DetailEditableField
              label="Fin"
              value={seasonMeta.end ?? '—'}
              editing={edit.editing}
              editValue={formValues.end}
              onChange={(value) => setFormValues((current) => (current ? { ...current, end: value } : current))}
            />
            <DetailField label="Temporadas en liga" value={seasonYears.join(', ') || '—'} />
          </dl>
        )}
      </DataSection>

      <ConfirmModal
        open={edit.confirmOpen}
        title="Guardar cambios"
        message={`¿Confirmas la actualización de la temporada ${year}?`}
        confirmLabel="Guardar cambios"
        onConfirm={() => void handleConfirmSave()}
        onCancel={edit.closeConfirm}
        submitting={edit.submitting}
      />
    </AmericanFootballDetailLayout>
  );
}
