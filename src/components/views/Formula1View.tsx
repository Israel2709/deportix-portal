'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/lib/use-api';
import type { ApiResource, DataStatus } from '@/lib/types';
import { useFormula1SeasonsQuery } from '@/lib/query/formula-1/hooks';
import { formula1TabPath, type Formula1Tab } from '@/lib/formula-1-paths';
import { FORMULA_1_SPORT_LABEL } from '@/lib/sports';
import { Card, CoverageBadge, ResourceDot, SectionTitle, coverageLevel } from '@/components/ui/Ui';
import { DataSection } from '@/components/states/States';
import { formatDateTime } from '@/lib/format';
import { Formula1ContenidoTab } from './formula-1/Formula1ContenidoTab';
import { Formula1DataLoader } from './formula-1/Formula1DataLoader';
import { Formula1LoaderLink } from './formula-1/Formula1LoaderLink';
import { Formula1Browse } from './formula-1/Formula1Browse';

function tabButtonClass(active: boolean, accent?: 'blue'): string {
  if (active) {
    return accent === 'blue' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-100';
  }
  return 'text-slate-400 hover:text-slate-200';
}

export function Formula1View({ initialTab = 'contenido' }: { initialTab?: Formula1Tab }) {
  const router = useRouter();
  const [tab, setTab] = useState<Formula1Tab>(initialTab);
  const status = useApi<ApiResource<DataStatus>>('/v1/data-status');
  const seasons = useFormula1SeasonsQuery();
  const f1 = status.data?.data.sports.find((s) => s.slug === 'f1');
  const prevTab = useRef(tab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const selectTab = useCallback(
    (next: Formula1Tab) => {
      setTab(next);
      router.replace(formula1TabPath(next), { scroll: false });
    },
    [router],
  );

  const refreshCoverage = useCallback(() => {
    status.reload();
    seasons.reload();
  }, [status, seasons]);

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
          <h1 className="text-2xl font-bold text-slate-50">{FORMULA_1_SPORT_LABEL}</h1>
          {f1 && tab === 'coverage' && <CoverageBadge level={coverageLevel(f1.coverage)} />}
        </div>
        <p className="mt-2 text-slate-400">
          Explora calendario y clasificaciones, revisa la cobertura o registra datos vía BFF{' '}
          <code className="text-xs text-slate-500">/formula-1/*</code>.
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
          onClick={() => selectTab('browse')}
          className={`shrink-0 rounded-t-md px-4 py-2 text-sm font-medium transition ${tabButtonClass(tab === 'browse')}`}
        >
          Explorar
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
        <Formula1ContenidoTab />
      ) : tab === 'coverage' ? (
        <>
          <section>
            <SectionTitle>Cobertura</SectionTitle>
            <DataSection
              loading={status.loading}
              error={status.error}
              isEmpty={!f1}
              onRetry={status.reload}
              emptyTitle={`${FORMULA_1_SPORT_LABEL} no está registrado`}
              emptyHint={`El deporte ${FORMULA_1_SPORT_LABEL} no está presente en la fuente de datos.`}
            >
              {f1 && (
                <Card>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-4">
                      <ResourceDot on={f1.coverage.teams} label="Equipos" />
                      <ResourceDot on={f1.coverage.matches} label="Carreras" />
                      <ResourceDot on={f1.coverage.standings} label="Clasificación" />
                      <ResourceDot on={f1.coverage.statistics} label="Estadísticas" />
                    </div>
                    <span className="text-sm text-slate-400">{f1.leagueCount} ligas</span>
                  </div>
                </Card>
              )}
            </DataSection>
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <SectionTitle>Temporadas</SectionTitle>
              <button
                type="button"
                onClick={() => selectTab('loader')}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
              >
                Cargar datos
              </button>
            </div>
            <DataSection
              loading={seasons.loading}
              error={seasons.error}
              isEmpty={seasons.data.length === 0}
              onRetry={seasons.reload}
              emptyTitle={`Aún no hay datos de ${FORMULA_1_SPORT_LABEL} cargados`}
              emptyHint="Usa la pestaña Carga de datos para registrar competiciones, carreras y rankings."
              emptyAction={<Formula1LoaderLink />}
            >
              <ul className="space-y-2">
                {seasons.data.map((year) => (
                  <li key={year}>
                    <Card>
                      <p className="font-medium text-slate-100">Temporada {year}</p>
                    </Card>
                  </li>
                ))}
              </ul>
            </DataSection>
          </section>
        </>
      ) : tab === 'browse' ? (
        <Suspense fallback={null}>
          <Formula1Browse />
        </Suspense>
      ) : (
        <Formula1DataLoader onDataChanged={refreshCoverage} />
      )}
    </div>
  );
}
