'use client';

import Link from 'next/link';
import { useApi } from '@/lib/use-api';
import type { ApiResource, DataStatus, Health } from '@/lib/types';
import { Card, CoverageBadge, ResourceDot, SectionTitle, coverageLevel } from '@/components/ui/Ui';
import { DataSection } from '@/components/states/States';
import { formatDateTime } from '@/lib/format';
import { sportPath } from '@/lib/sports';

export function HomeView() {
  const status = useApi<ApiResource<DataStatus>>('/v1/data-status');
  const health = useApi<ApiResource<Health>>('/v1/health');

  const data = status.data?.data;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold text-slate-50">
          Deportix <span className="text-blue-400">API</span>
        </h1>
        <p className="mt-2 text-slate-400">
          Una API pública de solo lectura para datos deportivos, respaldada por Firestore. Este
          portal consume únicamente la API pública — explora la cobertura en vivo de los deportes y
          ligas cargados actualmente.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Link href="/liga-mx" className="rounded-md bg-blue-500/20 px-3 py-1.5 text-blue-200 hover:bg-blue-500/30">
            Liga MX
          </Link>
          <Link href="/american-football" className="rounded-md bg-slate-800 px-3 py-1.5 text-slate-200 hover:bg-slate-700">
            NFL
          </Link>
          <Link href="/explorer" className="rounded-md bg-slate-800 px-3 py-1.5 text-slate-200 hover:bg-slate-700">
            Explorador de API
          </Link>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {health.data ? (
            health.data.data.dataSourceConfigured ? (
              <>Estado de la API: <span className="text-emerald-400">en línea</span> · fuente de datos conectada</>
            ) : (
              <>Estado de la API: en línea · <span className="text-amber-400">fuente de datos no configurada</span></>
            )
          ) : (
            <>Estado de la API: comprobando…</>
          )}
          {data && <> · Última actualización {formatDateTime(status.data?.meta.updatedAt)}</>}
        </p>
      </section>

      <section>
        <SectionTitle>Deportes</SectionTitle>
        <DataSection
          loading={status.loading}
          error={status.error}
          isEmpty={!data || data.sports.length === 0}
          onRetry={status.reload}
          loadingLabel="Cargando cobertura…"
          emptyTitle="No hay deportes disponibles"
          emptyHint="No hay deportes cargados actualmente en la fuente de datos."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data?.sports.map((sport) => (
              <Link
                key={sport.id}
                href={sportPath(sport.slug ?? sport.id)}
                className="block"
              >
                <Card className="transition hover:border-blue-500/40">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-100">{sport.name ?? sport.slug}</h3>
                    <CoverageBadge level={coverageLevel(sport.coverage)} />
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{sport.leagueCount} ligas</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <ResourceDot on={sport.coverage.teams} label="Equipos" />
                    <ResourceDot on={sport.coverage.matches} label="Partidos" />
                    <ResourceDot on={sport.coverage.standings} label="Clasificación" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </DataSection>
      </section>
    </div>
  );
}
