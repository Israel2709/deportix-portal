'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/lib/use-api';
import type { ApiResource, DataStatus } from '@/lib/types';
import { useTennisTournamentsQuery } from '@/lib/query/tennis/hooks';
import { tennisTabPath, type TennisTab } from '@/lib/tennis-paths';
import { TENNIS_SPORT_LABEL, TENNIS_SPORT_SLUG } from '@/lib/sports';
import { Card, CoverageBadge, ResourceDot, SectionTitle, coverageLevel } from '@/components/ui/Ui';
import { DataSection } from '@/components/states/States';
import { formatDateTime } from '@/lib/format';
import { TennisContenidoTab } from './tennis/TennisContenidoTab';
import { TennisDataLoader } from './tennis/TennisDataLoader';
import { TennisLoaderLink } from './tennis/TennisLoaderLink';

function tabButtonClass(active: boolean, accent?: 'blue'): string {
  if (active) {
    return accent === 'blue' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-100';
  }
  return 'text-slate-400 hover:text-slate-200';
}

export function TennisView({ initialTab = 'contenido' }: { initialTab?: TennisTab }) {
  const router = useRouter();
  const [tab, setTab] = useState<TennisTab>(initialTab);
  const status = useApi<ApiResource<DataStatus>>('/v1/data-status');
  const tournaments = useTennisTournamentsQuery();
  const tennis = status.data?.data.sports.find((s) => s.slug === TENNIS_SPORT_SLUG);
  const prevTab = useRef(tab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const selectTab = useCallback(
    (next: TennisTab) => {
      setTab(next);
      router.replace(tennisTabPath(next), { scroll: false });
    },
    [router],
  );

  const refreshCoverage = useCallback(() => {
    status.reload();
    tournaments.reload();
  }, [status, tournaments]);

  useEffect(() => {
    if (prevTab.current === 'loader' && tab !== 'loader') {
      refreshCoverage();
    }
    prevTab.current = tab;
  }, [tab, refreshCoverage]);

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-50">{TENNIS_SPORT_LABEL}</h1>
          {tennis && tab === 'coverage' && <CoverageBadge level={coverageLevel(tennis.coverage)} />}
        </div>
        <p className="mt-2 text-slate-400">
          Backoffice para torneos, Main Draw, resultados y publicación vía BFF{' '}
          <code className="text-xs text-slate-500">/tennis/*</code>.
        </p>
        {status.data && tab === 'coverage' && (
          <p className="mt-2 text-xs text-slate-500">
            Última actualización {formatDateTime(status.data.meta.updatedAt)}
          </p>
        )}
      </section>

      <div className="flex gap-2 overflow-x-auto border-b border-slate-800 pb-1">
        <button
          type="button"
          onClick={() => selectTab('contenido')}
          className={`shrink-0 rounded-t-md px-4 py-2 text-sm font-medium transition ${tabButtonClass(tab === 'contenido')}`}
        >
          Contenido
        </button>
        <button
          type="button"
          onClick={() => selectTab('coverage')}
          className={`shrink-0 rounded-t-md px-4 py-2 text-sm font-medium transition ${tabButtonClass(tab === 'coverage')}`}
        >
          Cobertura
        </button>
        <button
          type="button"
          onClick={() => selectTab('loader')}
          className={`shrink-0 rounded-t-md px-4 py-2 text-sm font-medium transition ${tabButtonClass(tab === 'loader', 'blue')}`}
        >
          Carga de datos
        </button>
      </div>

      {tab === 'contenido' ? (
        <TennisContenidoTab />
      ) : tab === 'coverage' ? (
        <>
          <section>
            <SectionTitle>Cobertura</SectionTitle>
            <DataSection
              loading={status.loading}
              error={status.error}
              isEmpty={!tennis}
              onRetry={status.reload}
              emptyTitle={`${TENNIS_SPORT_LABEL} no está registrado`}
              emptyHint={`El deporte ${TENNIS_SPORT_LABEL} no está presente en la fuente de datos.`}
            >
              {tennis && (
                <Card>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-4">
                      <ResourceDot on={tennis.coverage.teams} label="Jugadores" />
                      <ResourceDot on={tennis.coverage.matches} label="Partidos" />
                      <ResourceDot on={tennis.coverage.standings} label="Torneos" />
                    </div>
                    <span className="text-sm text-slate-400">{tennis.leagueCount} ediciones</span>
                  </div>
                </Card>
              )}
            </DataSection>
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <SectionTitle>Torneos cargados</SectionTitle>
              <button
                type="button"
                onClick={() => selectTab('loader')}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
              >
                Cargar datos
              </button>
            </div>
            <DataSection
              loading={tournaments.loading}
              error={tournaments.error}
              isEmpty={tournaments.data.length === 0}
              onRetry={tournaments.reload}
              emptyTitle={`Aún no hay datos de ${TENNIS_SPORT_LABEL} cargados`}
              emptyHint="Usa la pestaña Carga de datos para registrar jugadores, torneos y el bracket."
              emptyAction={<TennisLoaderLink />}
            >
              <ul className="space-y-2">
                {tournaments.data.map((item) => (
                  <li key={item.id}>
                    <Card>
                      <p className="font-medium text-slate-100">
                        {item.name} {item.year}
                        {item.published ? '' : ' (borrador)'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.category} · {item.gender === 'male' ? 'Masculino' : 'Femenino'} ·{' '}
                        {item.status}
                      </p>
                    </Card>
                  </li>
                ))}
              </ul>
            </DataSection>
          </section>
        </>
      ) : (
        <TennisDataLoader onDataChanged={refreshCoverage} />
      )}
    </div>
  );
}
