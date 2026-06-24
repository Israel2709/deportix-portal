'use client';

import { useApi } from '@/lib/use-api';
import type {
  ApiCollection,
  ApiResource,
  League,
  Match,
  Season,
  Standing,
  Team,
} from '@/lib/types';
import { Card, DataTable, SectionTitle, type Column } from '@/components/ui/Ui';
import { DataSection, ErrorState, LoadingState } from '@/components/states/States';
import { formatDateTime } from '@/lib/format';

const LIVE = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT']);

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-slate-500">—</span>;
  const live = LIVE.has(status);
  const finished = status === 'FT' || status === 'AET' || status === 'PEN';
  const cls = live
    ? 'bg-red-500/20 text-red-300'
    : finished
      ? 'bg-slate-600/30 text-slate-300'
      : 'bg-blue-500/20 text-blue-300';
  return <span className={`rounded px-1.5 py-0.5 text-xs ${cls}`}>{status}</span>;
}

export function LeagueDetail({
  league: leagueId,
  title,
  intro,
}: {
  league: string;
  title?: string;
  intro?: string;
}) {
  const id = encodeURIComponent(leagueId);
  const leagueRes = useApi<ApiResource<League>>(`/v1/leagues/${id}`);
  const seasonsRes = useApi<ApiCollection<Season>>(`/v1/leagues/${id}/seasons`);
  const teamsRes = useApi<ApiCollection<Team>>(`/v1/leagues/${id}/teams?pageSize=100`);
  const standingsRes = useApi<ApiCollection<Standing>>(`/v1/leagues/${id}/standings`);
  const matchesRes = useApi<ApiCollection<Match>>(`/v1/leagues/${id}/matches?pageSize=25`);

  const league = leagueRes.data?.data;

  const standingColumns: Column<Standing>[] = [
    { key: 'team', header: 'Team', render: (r) => r.teamName ?? r.teamId ?? '—' },
    { key: 'pj', header: 'PJ', render: (r) => r.played ?? '—', className: 'text-right' },
    { key: 'w', header: 'W', render: (r) => r.wins ?? '—', className: 'text-right' },
    {
      key: 'dt',
      header: 'D/T',
      render: (r) => r.draws ?? r.ties ?? '—',
      className: 'text-right',
    },
    { key: 'l', header: 'L', render: (r) => r.losses ?? '—', className: 'text-right' },
    {
      key: 'pts',
      header: 'Pts',
      render: (r) => r.points ?? '—',
      className: 'text-right font-semibold',
    },
  ];

  const matchColumns: Column<Match>[] = [
    { key: 'date', header: 'Date', render: (m) => formatDateTime(m.date) },
    { key: 'status', header: 'Status', render: (m) => <StatusBadge status={m.status} /> },
    { key: 'home', header: 'Home', render: (m) => m.home.name ?? m.home.teamId ?? '—' },
    {
      key: 'score',
      header: 'Score',
      render: (m) =>
        m.home.score != null || m.away.score != null
          ? `${m.home.score ?? '-'} : ${m.away.score ?? '-'}`
          : 'vs',
      className: 'text-center',
    },
    { key: 'away', header: 'Away', render: (m) => m.away.name ?? m.away.teamId ?? '—' },
    { key: 'round', header: 'Round', render: (m) => m.round ?? '—' },
  ];

  if (leagueRes.loading) return <LoadingState label="Loading league…" />;
  if (leagueRes.error) return <ErrorState message={leagueRes.error} onRetry={leagueRes.reload} />;

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-center gap-4">
        {league?.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={league.logo} alt="" className="h-14 w-14 rounded bg-white/5 object-contain p-1" />
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-50">{title ?? league?.name ?? leagueId}</h1>
          <p className="text-sm text-slate-400">
            {[league?.sport, league?.country, league?.type].filter(Boolean).join(' · ') || '—'}
          </p>
          {intro && <p className="mt-1 max-w-2xl text-sm text-slate-400">{intro}</p>}
          <p className="mt-1 text-xs text-slate-500">
            Last updated {formatDateTime(league?.updatedAt)}
          </p>
        </div>
      </section>

      <section>
        <SectionTitle>Seasons</SectionTitle>
        <DataSection
          loading={seasonsRes.loading}
          error={seasonsRes.error}
          isEmpty={(seasonsRes.data?.data.length ?? 0) === 0}
          onRetry={seasonsRes.reload}
          emptyTitle="No seasons registered"
          emptyHint="This league has no seasons in the data source yet."
        >
          <div className="flex flex-wrap gap-2">
            {seasonsRes.data?.data.map((s) => (
              <span
                key={s.id}
                className={`rounded-md border px-2.5 py-1 text-sm ${
                  s.current
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                    : 'border-slate-700 bg-slate-900/40 text-slate-300'
                }`}
              >
                {s.year ?? s.externalId ?? s.id}
                {s.current && ' · current'}
              </span>
            ))}
          </div>
        </DataSection>
      </section>

      <section>
        <SectionTitle>Standings</SectionTitle>
        <DataSection
          loading={standingsRes.loading}
          error={standingsRes.error}
          isEmpty={(standingsRes.data?.data.length ?? 0) === 0}
          onRetry={standingsRes.reload}
          emptyTitle="No standings available"
          emptyHint="Standings for the current season have not been loaded yet."
        >
          <DataTable
            columns={standingColumns}
            rows={standingsRes.data?.data ?? []}
            rowKey={(r, i) => r.teamId ?? String(i)}
            caption="League standings"
          />
        </DataSection>
      </section>

      <section>
        <SectionTitle>Matches</SectionTitle>
        <DataSection
          loading={matchesRes.loading}
          error={matchesRes.error}
          isEmpty={(matchesRes.data?.data.length ?? 0) === 0}
          onRetry={matchesRes.reload}
          emptyTitle="No matches available"
          emptyHint="No matches for the current season have been loaded yet."
        >
          <DataTable
            columns={matchColumns}
            rows={matchesRes.data?.data ?? []}
            rowKey={(m) => m.id}
            caption="League matches"
          />
        </DataSection>
      </section>

      <section>
        <SectionTitle>Teams</SectionTitle>
        <DataSection
          loading={teamsRes.loading}
          error={teamsRes.error}
          isEmpty={(teamsRes.data?.data.length ?? 0) === 0}
          onRetry={teamsRes.reload}
          emptyTitle="No teams available"
          emptyHint="Team rosters for this league have not been loaded yet."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teamsRes.data?.data.map((team) => (
              <Card key={team.id} className="flex items-center gap-3 p-3">
                {team.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={team.logo} alt="" className="h-8 w-8 object-contain" />
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-100">{team.name ?? team.id}</p>
                  {team.venue?.name && (
                    <p className="truncate text-xs text-slate-400">{team.venue.name}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </DataSection>
      </section>
    </div>
  );
}
