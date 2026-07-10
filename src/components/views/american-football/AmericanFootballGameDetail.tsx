'use client';

import { useCallback, useEffect, useState } from 'react';
import { getAmericanFootballGames, updateAmericanFootballGame } from '@/lib/american-football-api';
import type { AmericanFootballGameItem } from '@/lib/american-football-bff-types';
import {
  buildAmericanFootballGameBody,
  gameToFormValues,
  validateAmericanFootballGameForm,
  type AmericanFootballGameFormValues,
} from '@/lib/american-football-forms/game-form';
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

export function AmericanFootballGameDetail({ gameId }: { gameId: string }) {
  const toast = useToast();
  const edit = useAmericanFootballDetailEdit();
  const [game, setGame] = useState<AmericanFootballGameItem | null>(null);
  const [formValues, setFormValues] = useState<AmericanFootballGameFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const envelope = await getAmericanFootballGames({ id: gameId });
      const loadedGame = envelope.response[0] ?? null;
      setGame(loadedGame);
      if (loadedGame) {
        setFormValues(gameToFormValues(loadedGame));
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el partido');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  function updateField<K extends keyof AmericanFootballGameFormValues>(
    field: K,
    value: AmericanFootballGameFormValues[K],
  ) {
    setFormValues((current) => (current ? { ...current, [field]: value } : current));
  }

  function handleStartEdit() {
    if (game) {
      setFormValues(gameToFormValues(game));
      edit.startEdit();
    }
  }

  async function handleConfirmSave() {
    if (!formValues) return;
    const validation = validateAmericanFootballGameForm(formValues, 'edit');
    if (validation) {
      toast.error('Validación', validation);
      edit.closeConfirm();
      return;
    }

    edit.setSubmitting(true);
    try {
      await updateAmericanFootballGame(formValues.gameId, buildAmericanFootballGameBody(formValues), false);
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

  const season = game?.league.season;

  return (
    <AmericanFootballDetailLayout
      title={game ? `${game.teams.home.name} vs ${game.teams.away.name}` : 'Partido'}
      subtitle={game ? truncateCanonicalId(game.game.id) : undefined}
      actions={
        game && formValues ? (
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
        isEmpty={!loading && !error && !game}
        emptyTitle="Partido no encontrado"
        emptyHint="Verifica que el partido exista en el BFF."
      >
        {game && formValues && (
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailField label="ID" value={<span className="font-mono text-xs">{game.game.id}</span>} />
            <DetailEditableField
              label="Etapa"
              value={game.game.stage ?? '—'}
              editing={edit.editing}
              editValue={formValues.stage}
              onChange={(value) => updateField('stage', value)}
            />
            <DetailEditableField
              label="Semana"
              value={game.game.week ?? '—'}
              editing={edit.editing}
              editValue={formValues.week}
              onChange={(value) => updateField('week', value)}
            />
            <DetailEditableField
              label="Fecha"
              value={game.game.date?.date ?? '—'}
              editing={edit.editing}
              editValue={formValues.dateDate}
              onChange={(value) => updateField('dateDate', value)}
            />
            <DetailEditableField
              label="Hora"
              value={game.game.date?.time ?? '—'}
              editing={edit.editing}
              editValue={formValues.dateTime}
              onChange={(value) => updateField('dateTime', value)}
            />
            <DetailEditableField
              label="Zona horaria"
              value={game.game.date?.timezone ?? '—'}
              editing={edit.editing}
              editValue={formValues.dateTimezone}
              onChange={(value) => updateField('dateTimezone', value)}
            />
            <DetailEditableField
              label="Timestamp"
              value={game.game.date?.timestamp ?? '—'}
              editing={edit.editing}
              editValue={formValues.dateTimestamp}
              onChange={(value) => updateField('dateTimestamp', value)}
            />
            <DetailEditableField
              label="Estado (corto)"
              value={game.game.status?.short ?? '—'}
              editing={edit.editing}
              editValue={formValues.statusShort}
              onChange={(value) => updateField('statusShort', value)}
            />
            <DetailEditableField
              label="Estado (largo)"
              value={game.game.status?.long ?? '—'}
              editing={edit.editing}
              editValue={formValues.statusLong}
              onChange={(value) => updateField('statusLong', value)}
            />
            <DetailEditableField
              label="Sede"
              value={game.game.venue?.name ?? '—'}
              editing={edit.editing}
              editValue={formValues.venueName}
              onChange={(value) => updateField('venueName', value)}
            />
            <DetailEditableField
              label="Ciudad"
              value={game.game.venue?.city ?? '—'}
              editing={edit.editing}
              editValue={formValues.venueCity}
              onChange={(value) => updateField('venueCity', value)}
            />
            <DetailEditableField
              label="Liga (nombre)"
              value={game.league.name}
              editing={edit.editing}
              editValue={formValues.leagueName}
              onChange={(value) => updateField('leagueName', value)}
            />
            <DetailEditableField
              label="Liga (ID)"
              value={game.league.id}
              editing={edit.editing}
              editValue={formValues.leagueId}
              onChange={(value) => updateField('leagueId', value)}
            />
            <DetailEditableField
              label="Temporada"
              value={season ?? '—'}
              editing={edit.editing}
              editValue={formValues.leagueSeason}
              onChange={(value) => updateField('leagueSeason', value)}
            />
            <DetailEditableField
              label="Logo de liga"
              value={game.league.logo ?? '—'}
              editing={edit.editing}
              editValue={formValues.leagueLogo}
              onChange={(value) => updateField('leagueLogo', value)}
            />
            <DetailEditableField
              label="País (liga)"
              value={game.league.country?.name ?? '—'}
              editing={edit.editing}
              editValue={formValues.leagueCountryName}
              onChange={(value) => updateField('leagueCountryName', value)}
            />
            <DetailEditableField
              label="Local (nombre)"
              value={
                edit.editing ? (
                  game.teams.home.name
                ) : (
                  <Link
                    href={americanFootballTeamDetailPath(game.teams.home.id, {
                      league: game.league.id,
                      season: season ?? '',
                    })}
                    className="text-blue-400 hover:underline"
                  >
                    {game.teams.home.name}
                  </Link>
                )
              }
              editing={edit.editing}
              editValue={formValues.homeName}
              onChange={(value) => updateField('homeName', value)}
            />
            <DetailEditableField
              label="Local (ID)"
              value={game.teams.home.id}
              editing={edit.editing}
              editValue={formValues.homeId}
              onChange={(value) => updateField('homeId', value)}
            />
            <DetailEditableField
              label="Local (logo)"
              value={game.teams.home.logo ?? '—'}
              editing={edit.editing}
              editValue={formValues.homeLogo}
              onChange={(value) => updateField('homeLogo', value)}
            />
            <DetailEditableField
              label="Visitante (nombre)"
              value={
                edit.editing ? (
                  game.teams.away.name
                ) : (
                  <Link
                    href={americanFootballTeamDetailPath(game.teams.away.id, {
                      league: game.league.id,
                      season: season ?? '',
                    })}
                    className="text-blue-400 hover:underline"
                  >
                    {game.teams.away.name}
                  </Link>
                )
              }
              editing={edit.editing}
              editValue={formValues.awayName}
              onChange={(value) => updateField('awayName', value)}
            />
            <DetailEditableField
              label="Visitante (ID)"
              value={game.teams.away.id}
              editing={edit.editing}
              editValue={formValues.awayId}
              onChange={(value) => updateField('awayId', value)}
            />
            <DetailEditableField
              label="Visitante (logo)"
              value={game.teams.away.logo ?? '—'}
              editing={edit.editing}
              editValue={formValues.awayLogo}
              onChange={(value) => updateField('awayLogo', value)}
            />
            {!edit.editing && (
              <DetailField
                label="Liga (enlace)"
                value={
                  <Link
                    href={americanFootballLeaguePath({ id: game.league.id, externalId: null })}
                    className="text-blue-400 hover:underline"
                  >
                    {game.league.name}
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
        message={`¿Confirmas la actualización del partido ${game?.teams.home.name ?? ''} vs ${game?.teams.away.name ?? ''}?`}
        confirmLabel="Guardar cambios"
        onConfirm={() => void handleConfirmSave()}
        onCancel={edit.closeConfirm}
        submitting={edit.submitting}
      />
    </AmericanFootballDetailLayout>
  );
}
