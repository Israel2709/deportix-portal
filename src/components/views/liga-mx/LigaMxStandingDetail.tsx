'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { LIGA_MX_LEAGUE_ID } from '@/lib/liga-mx';
import { ligaMxTeamDetailPath, truncateRecordId } from '@/lib/liga-mx-paths';
import type { ApiCollection, Standing } from '@/lib/types';
import { DataSection } from '@/components/states/States';
import { DetailField, LigaMxDetailLayout } from './LigaMxDetailLayout';

export function LigaMxStandingDetail({
  teamId,
  season,
}: {
  teamId: string;
  season: string;
}) {
  const [standing, setStanding] = useState<Standing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!season) {
      setLoading(false);
      setError('Falta el parámetro de temporada.');
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const envelope = await apiGet<ApiCollection<Standing>>(
          `/v1/leagues/${encodeURIComponent(LIGA_MX_LEAGUE_ID)}/standings?season=${encodeURIComponent(season)}`,
        );
        if (cancelled) return;
        setStanding(envelope.data.find((item) => item.teamId === teamId) ?? null);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la clasificación');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [teamId, season]);

  return (
    <LigaMxDetailLayout
      title={standing?.teamName ?? 'Clasificación'}
      subtitle={season ? `Temporada ${season}` : undefined}
    >
      <DataSection
        loading={loading}
        error={error}
        isEmpty={!loading && !error && !standing}
        emptyTitle="Registro no encontrado"
        emptyHint="Verifica que el equipo tenga fila de clasificación en esa temporada."
      >
        {standing && (
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailField
              label="Equipo"
              value={
                standing.teamId ? (
                  <Link href={ligaMxTeamDetailPath(standing.teamId)} className="text-blue-400 hover:underline">
                    {standing.teamName ?? standing.teamId}
                  </Link>
                ) : (
                  standing.teamName ?? '—'
                )
              }
            />
            <DetailField label="ID equipo" value={standing.teamId ? truncateRecordId(standing.teamId) : '—'} />
            <DetailField label="PJ" value={standing.played ?? '—'} />
            <DetailField label="Ganados" value={standing.wins ?? '—'} />
            <DetailField label="Empates" value={standing.draws ?? standing.ties ?? '—'} />
            <DetailField label="Perdidos" value={standing.losses ?? '—'} />
            <DetailField label="Puntos" value={standing.points ?? '—'} />
            <DetailField label="Temporada" value={season} />
          </dl>
        )}
      </DataSection>
    </LigaMxDetailLayout>
  );
}
