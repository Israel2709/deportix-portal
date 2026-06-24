'use client';

import { useApi } from '@/lib/use-api';
import type { ApiCollection, Sport } from '@/lib/types';
import { ErrorState, LoadingState } from '@/components/states/States';
import { SoccerLeaguesSection } from '@/components/views/SoccerLeaguesSection';

export function SportView({ slug }: { slug: string }) {
  const sports = useApi<ApiCollection<Sport>>('/v1/sports');
  const sport = sports.data?.data.find((s) => s.slug === slug || s.id === slug);

  if (sports.loading) return <LoadingState label="Cargando deporte…" />;
  if (sports.error) return <ErrorState message={sports.error} onRetry={sports.reload} />;
  if (!sport) {
    return <ErrorState message="Deporte no encontrado." onRetry={sports.reload} />;
  }

  const title = sport.name ?? sport.slug ?? slug;
  const isSoccer = slug === 'soccer' || sport.slug === 'soccer';

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold text-slate-50">{title}</h1>
      </section>
      {isSoccer && <SoccerLeaguesSection />}
    </div>
  );
}
