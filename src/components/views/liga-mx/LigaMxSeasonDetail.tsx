'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { LIGA_MX_LEAGUE_ID } from '@/lib/liga-mx';
import { truncateRecordId } from '@/lib/liga-mx-paths';
import type { ApiCollection, Season } from '@/lib/types';
import { DataSection } from '@/components/states/States';
import { DetailField, LigaMxDetailLayout } from './LigaMxDetailLayout';

export function LigaMxSeasonDetail({ seasonId }: { seasonId: string }) {
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const envelope = await apiGet<ApiCollection<Season>>(
          `/v1/leagues/${encodeURIComponent(LIGA_MX_LEAGUE_ID)}/seasons`,
        );
        if (cancelled) return;
        setSeason(envelope.data.find((item) => item.id === seasonId) ?? null);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la temporada');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [seasonId]);

  return (
    <LigaMxDetailLayout
      title={season?.year ? `Temporada ${season.year}` : 'Temporada'}
      subtitle={truncateRecordId(seasonId)}
    >
      <DataSection
        loading={loading}
        error={error}
        isEmpty={!loading && !error && !season}
        emptyTitle="Temporada no encontrada"
        emptyHint="Verifica que la temporada exista en Liga MX."
      >
        {season && (
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Año" value={season.year ?? '—'} />
            <DetailField label="ID" value={<span className="font-mono text-xs">{season.id}</span>} />
            <DetailField label="Actual" value={season.current ? 'Sí' : 'No'} />
            <DetailField label="Inicio" value={season.startDate ?? '—'} />
            <DetailField label="Fin" value={season.endDate ?? '—'} />
            <DetailField label="External ID" value={season.externalId ?? '—'} />
          </dl>
        )}
      </DataSection>
    </LigaMxDetailLayout>
  );
}
