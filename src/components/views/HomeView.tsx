'use client';

import Link from 'next/link';
import { useApi } from '@/lib/use-api';
import type { ApiResource, DataStatus, Health } from '@/lib/types';
import { Card, CoverageBadge, ResourceDot, SectionTitle, coverageLevel } from '@/components/ui/Ui';
import { DataSection } from '@/components/states/States';
import { formatDateTime } from '@/lib/format';

function leagueHref(externalId: string | null, id: string): string {
  return externalId === '262' ? '/liga-mx' : `/leagues/${encodeURIComponent(id)}`;
}

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
        <p className="mt-2 max-w-2xl text-slate-400">
          A public, read-only sports-data API powered by Firestore. This portal consumes only the
          public API — explore live coverage for the sports and leagues currently loaded.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Link href="/liga-mx" className="rounded-md bg-blue-500/20 px-3 py-1.5 text-blue-200 hover:bg-blue-500/30">
            Liga MX
          </Link>
          <Link href="/nfl" className="rounded-md bg-slate-800 px-3 py-1.5 text-slate-200 hover:bg-slate-700">
            NFL
          </Link>
          <Link href="/explorer" className="rounded-md bg-slate-800 px-3 py-1.5 text-slate-200 hover:bg-slate-700">
            API Explorer
          </Link>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {health.data ? (
            health.data.data.dataSourceConfigured ? (
              <>API status: <span className="text-emerald-400">online</span> · data source connected</>
            ) : (
              <>API status: online · <span className="text-amber-400">data source not configured</span></>
            )
          ) : (
            <>API status: checking…</>
          )}
          {data && <> · Last updated {formatDateTime(status.data?.meta.updatedAt)}</>}
        </p>
      </section>

      <section>
        <SectionTitle>Sports</SectionTitle>
        <DataSection
          loading={status.loading}
          error={status.error}
          isEmpty={!data || data.sports.length === 0}
          onRetry={status.reload}
          loadingLabel="Loading coverage…"
          emptyTitle="No sports available"
          emptyHint="No sports are currently loaded in the data source."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data?.sports.map((sport) => (
              <Card key={sport.id}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-100">{sport.name ?? sport.slug}</h3>
                  <CoverageBadge level={coverageLevel(sport.coverage)} />
                </div>
                <p className="mt-1 text-sm text-slate-400">{sport.leagueCount} leagues</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <ResourceDot on={sport.coverage.teams} label="Teams" />
                  <ResourceDot on={sport.coverage.matches} label="Matches" />
                  <ResourceDot on={sport.coverage.standings} label="Standings" />
                </div>
              </Card>
            ))}
          </div>
        </DataSection>
      </section>

      <section>
        <SectionTitle>Featured leagues</SectionTitle>
        <DataSection
          loading={status.loading}
          error={status.error}
          isEmpty={!data || data.leagues.length === 0}
          onRetry={status.reload}
          emptyTitle="No featured leagues"
          emptyHint="Coverage will appear here as leagues are loaded."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {data?.leagues.map((league) => (
              <Link key={league.id} href={leagueHref(league.externalId, league.id)} className="block">
                <Card className="transition hover:border-blue-500/40">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-100">{league.name ?? league.id}</h3>
                      <p className="text-xs text-slate-400">
                        {league.sport ?? 'sport?'} · {league.availableSeasons.length} seasons
                      </p>
                    </div>
                    <CoverageBadge level={coverageLevel(league.coverage)} />
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
