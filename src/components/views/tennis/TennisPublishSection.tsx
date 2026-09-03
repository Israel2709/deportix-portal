'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getTennisTournamentMatches,
  getTennisTournamentRounds,
  getTennisTournaments,
  publishTennisMatch,
  publishTennisTournament,
} from '@/lib/tennis-api';
import type { TennisMatchItem, TennisRoundItem, TennisTournamentItem } from '@/lib/tennis-bff-types';
import { truncateCanonicalId } from '@/lib/tennis-forms/shared';
import { formatTennisMatchLabel } from '@/lib/tennis-forms/match-form';
import { tennisTournamentToSelectOption } from '@/lib/tennis-display';
import { Card } from '@/components/ui/Ui';
import {
  AmericanFootballFieldGrid,
  AmericanFootballSelectField,
} from '@/components/views/american-football/AmericanFootballFormShell';
import { useToast } from '@/components/notifications/ToastProvider';
import { useQueryClient } from '@tanstack/react-query';

export function TennisPublishSection({
  step,
  onDataChanged,
}: {
  step: number;
  onDataChanged?: () => void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [tournaments, setTournaments] = useState<TennisTournamentItem[]>([]);
  const [rounds, setRounds] = useState<TennisRoundItem[]>([]);
  const [matches, setMatches] = useState<TennisMatchItem[]>([]);
  const [tournamentId, setTournamentId] = useState('');
  const [matchId, setMatchId] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedTournament = useMemo(
    () => tournaments.find((t) => t.id === tournamentId) ?? null,
    [tournaments, tournamentId],
  );

  const tournamentOptions = useMemo(
    () => [
      { value: '', label: 'Selecciona un torneo' },
      ...tournaments.map((t) => tennisTournamentToSelectOption(t, { publishedStyle: 'dot' })),
    ],
    [tournaments],
  );

  const matchOptions = useMemo(
    () => [
      { value: '', label: 'Selecciona un partido (opcional)' },
      ...matches.map((m) => ({
        value: m.id,
        label: `${formatTennisMatchLabel(m)}${m.published ? '' : ' · borrador'}`,
      })),
    ],
    [matches],
  );

  async function reloadTournamentData(tid: string) {
    if (!tid) {
      setRounds([]);
      setMatches([]);
      return;
    }
    setLoading(true);
    try {
      const [rRes, mRes] = await Promise.all([
        getTennisTournamentRounds(tid),
        getTennisTournamentMatches(tid),
      ]);
      setRounds(rRes.response);
      setMatches(mRes.response);
    } catch {
      setRounds([]);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const envelope = await getTennisTournaments();
        if (!cancelled) setTournaments(envelope.response);
      } catch {
        if (!cancelled) setTournaments([]);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void reloadTournamentData(tournamentId);
  }, [tournamentId]);

  async function handlePublishTournament() {
    if (!tournamentId.trim()) {
      toast.error('Validación', 'Selecciona un torneo para publicar.');
      return;
    }
    setPublishing(true);
    try {
      const res = await publishTennisTournament(tournamentId);
      toast.success('Torneo publicado', `results: ${res.results}`);
      void queryClient.invalidateQueries({ queryKey: ['tennis'] });
      onDataChanged?.();
      const tRes = await getTennisTournaments();
      setTournaments(tRes.response);
      await reloadTournamentData(tournamentId);
    } catch (err) {
      toast.error('Error', err instanceof Error ? err.message : 'No se pudo publicar el torneo.');
    } finally {
      setPublishing(false);
    }
  }

  async function handlePublishMatch() {
    if (!matchId.trim()) {
      toast.error('Validación', 'Selecciona un partido para publicar.');
      return;
    }
    setPublishing(true);
    try {
      const res = await publishTennisMatch(matchId);
      toast.success('Partido publicado', `results: ${res.results}`);
      void queryClient.invalidateQueries({ queryKey: ['tennis'] });
      onDataChanged?.();
      await reloadTournamentData(tournamentId);
    } catch (err) {
      toast.error('Error', err instanceof Error ? err.message : 'No se pudo publicar el partido.');
    } finally {
      setPublishing(false);
    }
  }

  const draftRounds = rounds.filter((r) => !r.published).length;
  const draftMatches = matches.filter((m) => !m.published).length;

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-blue-400">Paso {step}</p>
        <h3 className="mt-1 text-lg font-semibold text-slate-100">Publicación</h3>
        <p className="mt-1 text-sm text-slate-400">
          App QD solo consume información publicada. Publicar el torneo ejecuta validaciones de
          integridad del Main Draw (rondas, entradas y partidos).
        </p>
      </div>

      <AmericanFootballFieldGrid>
        <AmericanFootballSelectField
          label="Torneo"
          value={tournamentId}
          onChange={setTournamentId}
          options={tournamentOptions}
        />
      </AmericanFootballFieldGrid>

      {selectedTournament && (
        <div className="rounded-md border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-300">
          <p>
            <strong className="text-slate-100">{selectedTournament.name}</strong> {selectedTournament.year}
          </p>
          <p className="mt-1 font-mono text-xs text-slate-500">{selectedTournament.id}</p>
          <p className="mt-2">
            Estado: {selectedTournament.published ? 'Publicado' : 'Borrador'} · {rounds.length} ronda(s)
            {draftRounds > 0 ? ` (${draftRounds} borrador)` : ''} · {matches.length} partido(s)
            {draftMatches > 0 ? ` (${draftMatches} borrador)` : ''}
          </p>
          {!loading && (rounds.length === 0 || matches.length === 0) && (
            <p className="mt-2 text-amber-400">
              No se puede publicar todavía: el Main Draw está incompleto. Crea rondas, entradas y
              partidos (pasos 3–5) para este torneo y vuelve a intentar.
            </p>
          )}
          {loading && <p className="mt-2 text-xs text-slate-500">Cargando detalle…</p>}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={publishing || !tournamentId || rounds.length === 0 || matches.length === 0}
          onClick={() => void handlePublishTournament()}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {publishing ? 'Publicando…' : 'Publicar torneo y Main Draw'}
        </button>
      </div>

      <hr className="border-slate-800" />

      <p className="text-sm text-slate-400">Publicar un partido individual (actualizaciones puntuales):</p>
      <AmericanFootballFieldGrid>
        <AmericanFootballSelectField
          label="Partido"
          value={matchId}
          onChange={setMatchId}
          options={matchOptions}
          hint={!tournamentId ? 'Selecciona un torneo primero' : undefined}
        />
      </AmericanFootballFieldGrid>
      <button
        type="button"
        disabled={publishing || !matchId}
        onClick={() => void handlePublishMatch()}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
      >
        Publicar partido {matchId ? truncateCanonicalId(matchId) : ''}
      </button>
    </Card>
  );
}
