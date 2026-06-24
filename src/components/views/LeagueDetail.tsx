'use client';

import { useMemo, useState } from 'react';
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
import { sortMatchesByDateAsc } from '@/lib/match-sort';
import { LeagueSeasonSidebar } from '@/components/layout/LeagueSeasonSidebar';
import { LigaMxSeasonSection } from '@/components/views/LigaMxSeasonSection';
import { LIGA_MX_LEAGUE_ID } from '@/lib/liga-mx';
import { pickDefaultSeason } from '@/lib/seasons';

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
  const isLigaMx = leagueId === LIGA_MX_LEAGUE_ID;
  const leagueRes = useApi<ApiResource<League>>(`/v1/leagues/${id}`);
  const seasonsRes = useApi<ApiCollection<Season>>(`/v1/leagues/${id}/seasons`);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);

  const seasons = seasonsRes.data?.data ?? [];
  const effectiveSelectedSeasonId = useMemo(() => {
    if (selectedSeasonId && seasons.some((season) => season.id === selectedSeasonId)) {
      return selectedSeasonId;
    }
    return pickDefaultSeason(seasons)?.id ?? null;
  }, [seasons, selectedSeasonId]);

  const selectedSeason = useMemo(
    () => seasons.find((season) => season.id === effectiveSelectedSeasonId) ?? null,
    [seasons, effectiveSelectedSeasonId],
  );
  const selectedYear = selectedSeason?.year ?? null;

  const standingsPath =
    selectedYear !== null ? `/v1/leagues/${id}/standings?season=${selectedYear}` : null;
  const matchesPath =
    selectedYear !== null ? `/v1/leagues/${id}/matches?season=${selectedYear}&pageSize=25` : null;

  const teamsRes = useApi<ApiCollection<Team>>(`/v1/leagues/${id}/teams?pageSize=100`);
  const standingsRes = useApi<ApiCollection<Standing>>(standingsPath);
  const matchesRes = useApi<ApiCollection<Match>>(matchesPath);

  const league = leagueRes.data?.data;

  const standingColumns: Column<Standing>[] = [
    { key: 'team', header: 'Equipo', render: (r) => r.teamName ?? r.teamId ?? '—' },
    { key: 'pj', header: 'PJ', render: (r) => r.played ?? '—', className: 'text-right' },
    { key: 'w', header: 'G', render: (r) => r.wins ?? '—', className: 'text-right' },
    {
      key: 'dt',
      header: 'E',
      render: (r) => r.draws ?? r.ties ?? '—',
      className: 'text-right',
    },
    { key: 'l', header: 'P', render: (r) => r.losses ?? '—', className: 'text-right' },
    {
      key: 'pts',
      header: 'Pts',
      render: (r) => r.points ?? '—',
      className: 'text-right font-semibold',
    },
  ];

  const matchColumns: Column<Match>[] = [
    { key: 'date', header: 'Fecha', render: (m) => formatDateTime(m.date) },
    { key: 'status', header: 'Estado', render: (m) => <StatusBadge status={m.status} /> },
    { key: 'home', header: 'Local', render: (m) => m.home.name ?? m.home.teamId ?? '—' },
    {
      key: 'score',
      header: 'Marcador',
      render: (m) =>
        m.home.score != null || m.away.score != null
          ? `${m.home.score ?? '-'} : ${m.away.score ?? '-'}`
          : 'vs',
      className: 'text-center',
    },
    { key: 'away', header: 'Visitante', render: (m) => m.away.name ?? m.away.teamId ?? '—' },
    { key: 'round', header: 'Jornada', render: (m) => m.round ?? '—' },
  ];

  const sortedMatches = useMemo(
    () => sortMatchesByDateAsc(matchesRes.data?.data ?? []),
    [matchesRes.data],
  );

  if (leagueRes.loading) return <LoadingState label="Cargando liga…" />;
  if (leagueRes.error) return <ErrorState message={leagueRes.error} onRetry={leagueRes.reload} />;

  const standingsSection = (
    <section>
      <SectionTitle>Clasificación</SectionTitle>
      <DataSection
        loading={standingsRes.loading}
        error={standingsRes.error}
        isEmpty={(standingsRes.data?.data.length ?? 0) === 0}
        onRetry={standingsRes.reload}
        emptyTitle="No hay clasificación disponible"
        emptyHint="La clasificación de la temporada seleccionada aún no se ha cargado."
      >
        <DataTable
          columns={standingColumns}
          rows={standingsRes.data?.data ?? []}
          rowKey={(r, i) => r.teamId ?? String(i)}
          caption="Clasificación de la liga"
        />
      </DataSection>
    </section>
  );

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
          {intro && <p className="mt-1 text-sm text-slate-400">{intro}</p>}
          <p className="mt-1 text-xs text-slate-500">
            Última actualización {formatDateTime(league?.updatedAt)}
          </p>
        </div>
      </section>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <LeagueSeasonSidebar
          seasons={seasons}
          loading={seasonsRes.loading}
          error={seasonsRes.error}
          selectedSeasonId={effectiveSelectedSeasonId}
          onSelect={setSelectedSeasonId}
          onRetry={seasonsRes.reload}
        />

        <div className="min-w-0 flex-1 space-y-8">
          {isLigaMx && selectedYear !== null ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)] lg:items-start">
              <LigaMxSeasonSection leagueId={leagueId} year={selectedYear} />
              {standingsSection}
            </div>
          ) : (
            standingsSection
          )}

          <section>
            <SectionTitle>Partidos</SectionTitle>
            <DataSection
              loading={matchesRes.loading}
              error={matchesRes.error}
              isEmpty={(matchesRes.data?.data.length ?? 0) === 0}
              onRetry={matchesRes.reload}
              emptyTitle="No hay partidos disponibles"
              emptyHint="Los partidos de la temporada seleccionada aún no se han cargado."
            >
              <DataTable
                columns={matchColumns}
                rows={sortedMatches}
                rowKey={(m) => m.id}
                caption="Partidos de la liga"
              />
            </DataSection>
          </section>

          <section>
            <SectionTitle>Equipos</SectionTitle>
            <DataSection
              loading={teamsRes.loading}
              error={teamsRes.error}
              isEmpty={(teamsRes.data?.data.length ?? 0) === 0}
              onRetry={teamsRes.reload}
              emptyTitle="No hay equipos disponibles"
              emptyHint="Las plantillas de equipos de esta liga aún no se han cargado."
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
      </div>
    </div>
  );
}
