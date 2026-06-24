'use client';

import { useApi } from '@/lib/use-api';
import type { ApiCollection, ApiResource, DataStatus, League } from '@/lib/types';
import { Card, CoverageBadge, ResourceDot, SectionTitle, coverageLevel } from '@/components/ui/Ui';
import { DataSection } from '@/components/states/States';
import { formatDateTime } from '@/lib/format';

export function NflView() {
  const status = useApi<ApiResource<DataStatus>>('/v1/data-status');
  const leagues = useApi<ApiCollection<League>>('/v1/leagues?sport=nfl');
  const nfl = status.data?.data.sports.find((s) => s.slug === 'nfl');

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-50">NFL</h1>
          {nfl && <CoverageBadge level={coverageLevel(nfl.coverage)} />}
        </div>
        <p className="mt-2 text-slate-400">
          Vista de cobertura progresiva. Los datos de la NFL se cargan manualmente e
          incrementalmente; esta pantalla refleja lo que la API expone actualmente y se actualiza
          automáticamente — no se requieren cambios de código en cada carga.
        </p>
        {status.data && (
          <p className="mt-2 text-xs text-slate-500">
            Última actualización {formatDateTime(status.data.meta.updatedAt)}
          </p>
        )}
      </section>

      <section>
        <SectionTitle>Cobertura</SectionTitle>
        <DataSection
          loading={status.loading}
          error={status.error}
          isEmpty={!nfl}
          onRetry={status.reload}
          emptyTitle="La NFL no está registrada"
          emptyHint="El deporte NFL no está presente en la fuente de datos."
        >
          {nfl && (
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-4">
                  <ResourceDot on={nfl.coverage.teams} label="Equipos" />
                  <ResourceDot on={nfl.coverage.matches} label="Partidos" />
                  <ResourceDot on={nfl.coverage.standings} label="Clasificación" />
                  <ResourceDot on={nfl.coverage.statistics} label="Estadísticas" />
                </div>
                <span className="text-sm text-slate-400">{nfl.leagueCount} ligas</span>
              </div>
            </Card>
          )}
        </DataSection>
      </section>

      <section>
        <SectionTitle>Equipos y competiciones</SectionTitle>
        <DataSection
          loading={leagues.loading}
          error={leagues.error}
          isEmpty={(leagues.data?.data.length ?? 0) === 0}
          onRetry={leagues.reload}
          emptyTitle="Aún no hay datos de la NFL cargados"
          emptyHint="Cuando se carguen equipos, partidos y clasificación de la NFL en la plataforma, aparecerán aquí automáticamente."
        >
          <ul className="space-y-2">
            {leagues.data?.data.map((league) => (
              <li key={league.id}>
                <Card>
                  <p className="font-medium text-slate-100">{league.name ?? league.id}</p>
                  <p className="text-xs text-slate-400">{league.country ?? '—'}</p>
                </Card>
              </li>
            ))}
          </ul>
        </DataSection>
      </section>
    </div>
  );
}
