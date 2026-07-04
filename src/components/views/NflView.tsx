'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/lib/use-api';
import type { ApiCollection, ApiResource, DataStatus, League } from '@/lib/types';
import { Card, CoverageBadge, ResourceDot, SectionTitle, coverageLevel } from '@/components/ui/Ui';
import { DataSection } from '@/components/states/States';
import { formatDateTime } from '@/lib/format';
import { nflLeaguePath, nflTabPath, type NflTab } from '@/lib/nfl-paths';
import { NflDataLoader } from './nfl/NflDataLoader';
import { NflLeaguesBrowse } from './nfl/NflLeaguesBrowse';
import { NflLoaderLink } from './nfl/NflLoaderLink';

function tabButtonClass(active: boolean, accent?: 'blue'): string {
  if (active) {
    return accent === 'blue'
      ? 'bg-blue-600 text-white'
      : 'bg-slate-800 text-slate-100';
  }
  return 'text-slate-400 hover:text-slate-200';
}

export function NflView({ initialTab = 'coverage' }: { initialTab?: NflTab }) {
  const router = useRouter();
  const [tab, setTab] = useState<NflTab>(initialTab);
  const status = useApi<ApiResource<DataStatus>>('/v1/data-status');
  const leagues = useApi<ApiCollection<League>>('/v1/leagues?sport=nfl');
  const nfl = status.data?.data.sports.find((s) => s.slug === 'nfl');
  const prevTab = useRef(tab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const selectTab = useCallback(
    (next: NflTab) => {
      setTab(next);
      router.replace(nflTabPath(next), { scroll: false });
    },
    [router],
  );

  const refreshCoverage = useCallback(() => {
    status.reload();
    leagues.reload();
  }, [status, leagues]);

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
          <h1 className="text-2xl font-bold text-slate-50">NFL</h1>
          {nfl && tab === 'coverage' && <CoverageBadge level={coverageLevel(nfl.coverage)} />}
        </div>
        <p className="mt-2 text-slate-400">
          Explora ligas y partidos cargados, revisa la cobertura o registra datos vía BFF{' '}
          <code className="text-xs text-slate-500">/nfl/*</code>.
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

      {tab === 'coverage' ? (
        <>
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
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <SectionTitle>Equipos y competiciones</SectionTitle>
              <button
                type="button"
                onClick={() => selectTab('loader')}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
              >
                Cargar datos
              </button>
            </div>
            <DataSection
              loading={leagues.loading}
              error={leagues.error}
              isEmpty={(leagues.data?.data.length ?? 0) === 0}
              onRetry={leagues.reload}
              emptyTitle="Aún no hay datos de la NFL cargados"
              emptyHint="Usa la pestaña Carga de datos para registrar ligas, equipos, partidos y clasificación."
              emptyAction={<NflLoaderLink />}
            >
              <ul className="space-y-2">
                {leagues.data?.data.map((league) => (
                  <li key={league.id}>
                    <Link href={nflLeaguePath(league)} className="block">
                      <Card className="transition hover:border-blue-500/40">
                        <p className="font-medium text-slate-100">{league.name ?? league.id}</p>
                        <p className="text-xs text-slate-400">{league.country ?? '—'}</p>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            </DataSection>
          </section>
        </>
      ) : tab === 'browse' ? (
        <NflLeaguesBrowse />
      ) : (
        <NflDataLoader onDataChanged={refreshCoverage} />
      )}
    </div>
  );
}
