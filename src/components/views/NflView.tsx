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
        <p className="mt-2 max-w-2xl text-slate-400">
          A progressive-coverage view. NFL data is loaded manually and incrementally; this screen
          reflects whatever the API currently exposes and updates automatically — no code changes
          needed for each load.
        </p>
        {status.data && (
          <p className="mt-2 text-xs text-slate-500">
            Last updated {formatDateTime(status.data.meta.updatedAt)}
          </p>
        )}
      </section>

      <section>
        <SectionTitle>Coverage</SectionTitle>
        <DataSection
          loading={status.loading}
          error={status.error}
          isEmpty={!nfl}
          onRetry={status.reload}
          emptyTitle="NFL is not registered"
          emptyHint="The NFL sport is not present in the data source."
        >
          {nfl && (
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-4">
                  <ResourceDot on={nfl.coverage.teams} label="Teams" />
                  <ResourceDot on={nfl.coverage.matches} label="Games" />
                  <ResourceDot on={nfl.coverage.standings} label="Standings" />
                  <ResourceDot on={nfl.coverage.statistics} label="Statistics" />
                </div>
                <span className="text-sm text-slate-400">{nfl.leagueCount} leagues</span>
              </div>
            </Card>
          )}
        </DataSection>
      </section>

      <section>
        <SectionTitle>Teams & competitions</SectionTitle>
        <DataSection
          loading={leagues.loading}
          error={leagues.error}
          isEmpty={(leagues.data?.data.length ?? 0) === 0}
          onRetry={leagues.reload}
          emptyTitle="No NFL data loaded yet"
          emptyHint="When NFL teams, games and standings are loaded into the platform, they will appear here automatically."
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
