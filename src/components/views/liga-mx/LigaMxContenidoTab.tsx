'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Ui';
import { formatDateTimeShort } from '@/lib/format';
import {
  ligaMxMatchDetailPath,
  ligaMxSeasonDetailPath,
  ligaMxStandingDetailPath,
  ligaMxTabPath,
  ligaMxTeamDetailPath,
  ligaMxTournamentDetailPath,
  truncateRecordId,
} from '@/lib/liga-mx-paths';
import { useLigaMxContenido } from '@/lib/use-liga-mx-contenido';
import { DataSection } from '@/components/states/States';
import { AmericanFootballAccordion } from '@/components/views/american-football/AmericanFootballAccordion';

function matchesQuery(query: string, parts: Array<string | number | null | undefined>): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return parts
    .filter((part) => part != null && String(part).trim() !== '')
    .some((part) => String(part).toLowerCase().includes(needle));
}

function RecordCard({
  href,
  title,
  subtitle,
  meta,
  logo,
}: {
  href: string;
  title: string;
  subtitle?: string;
  meta?: string;
  logo?: string | null;
}) {
  return (
    <Link href={href} className="block h-full">
      <Card className="flex h-full gap-3 transition hover:border-blue-500/40">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="h-10 w-10 shrink-0 rounded object-contain" />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-800 text-xs text-slate-500">
            —
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate-100">{title}</p>
          {subtitle && <p className="truncate text-xs text-slate-400">{subtitle}</p>}
          {meta && <p className="mt-1 truncate font-mono text-[11px] text-slate-500">{meta}</p>}
        </div>
      </Card>
    </Link>
  );
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

function EmptyFilterMessage({ query }: { query: string }) {
  return <p className="text-sm text-slate-500">Ningún registro coincide con “{query}”.</p>;
}

export function LigaMxContenidoTab({ refreshKey = 0 }: { refreshKey?: number }) {
  const data = useLigaMxContenido(refreshKey);
  const [filters, setFilters] = useState({
    liga: '',
    temporadas: '',
    torneos: '',
    equipos: '',
    partidos: '',
    clasificacion: '',
  });

  const setFilter = (key: keyof typeof filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const filteredSeasons = useMemo(
    () =>
      data.seasons.filter((item) =>
        matchesQuery(filters.temporadas, [
          item.year,
          item.season.current ? 'actual' : null,
          item.season.id,
        ]),
      ),
    [data.seasons, filters.temporadas],
  );

  const filteredTournaments = useMemo(
    () =>
      data.tournaments.filter((item) =>
        matchesQuery(filters.torneos, [item.name, item.year, item.matchCount]),
      ),
    [data.tournaments, filters.torneos],
  );

  const filteredTeams = useMemo(
    () =>
      data.teams.filter((item) =>
        matchesQuery(filters.equipos, [
          item.team.name,
          item.team.country,
          item.team.id,
          item.hasOverride ? 'cambios locales' : null,
        ]),
      ),
    [data.teams, filters.equipos],
  );

  const filteredMatches = useMemo(
    () =>
      data.matches.filter((item) =>
        matchesQuery(filters.partidos, [
          item.match.home.name,
          item.match.away.name,
          item.match.round,
          formatDateTimeShort(item.match.date),
          item.match.id,
          item.isLocal ? 'local' : null,
        ]),
      ),
    [data.matches, filters.partidos],
  );

  const filteredStandings = useMemo(
    () =>
      data.standings.filter((item) =>
        matchesQuery(filters.clasificacion, [
          item.standing.teamName,
          item.year,
          item.standing.points,
          item.standing.teamId,
        ]),
      ),
    [data.standings, filters.clasificacion],
  );

  const showLeague =
    data.league &&
    matchesQuery(filters.liga, [
      data.league.name,
      data.league.country,
      data.league.sport,
      data.league.id,
    ]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Contenido cargado de Liga MX agrupado por tipo. Haz clic en un registro para ver su detalle y editarlo.
      </p>

      <DataSection
        loading={data.loading}
        error={data.error}
        isEmpty={
          !data.loading &&
          !data.error &&
          !data.league &&
          data.seasons.length === 0 &&
          data.teams.length === 0 &&
          data.matches.length === 0 &&
          data.standings.length === 0
        }
        onRetry={data.reload}
        emptyTitle="Aún no hay contenido cargado"
        emptyHint="Los datos aparecen cuando la API tiene temporadas, equipos, partidos y clasificación."
      >
        <div className="space-y-3">
          <AmericanFootballAccordion
            title="Liga"
            count={showLeague ? 1 : 0}
            defaultOpen
            filter={filters.liga}
            onFilterChange={(value) => setFilter('liga', value)}
            filterPlaceholder="Buscar liga por nombre, país o id…"
          >
            {!data.league ? (
              <p className="text-sm text-slate-500">Sin datos de liga.</p>
            ) : !showLeague ? (
              <EmptyFilterMessage query={filters.liga} />
            ) : (
              <CardGrid>
                <RecordCard
                  href={ligaMxTabPath('calendario')}
                  title={data.league.name ?? 'Liga MX'}
                  subtitle={[data.league.country, data.league.sport].filter(Boolean).join(' · ')}
                  meta={truncateRecordId(data.league.id)}
                  logo={data.league.logo}
                />
              </CardGrid>
            )}
          </AmericanFootballAccordion>

          <AmericanFootballAccordion
            title="Temporadas"
            count={filteredSeasons.length}
            filter={filters.temporadas}
            onFilterChange={(value) => setFilter('temporadas', value)}
            filterPlaceholder="Buscar por año, estado o id…"
          >
            {data.seasons.length === 0 ? (
              <p className="text-sm text-slate-500">Sin temporadas registradas.</p>
            ) : filteredSeasons.length === 0 ? (
              <EmptyFilterMessage query={filters.temporadas} />
            ) : (
              <CardGrid>
                {filteredSeasons.map((item) => (
                  <RecordCard
                    key={item.season.id}
                    href={ligaMxSeasonDetailPath(item.season.id)}
                    title={`Temporada ${item.year}`}
                    subtitle={item.season.current ? 'Actual' : undefined}
                    meta={truncateRecordId(item.season.id)}
                  />
                ))}
              </CardGrid>
            )}
          </AmericanFootballAccordion>

          <AmericanFootballAccordion
            title="Torneos"
            count={filteredTournaments.length}
            filter={filters.torneos}
            onFilterChange={(value) => setFilter('torneos', value)}
            filterPlaceholder="Buscar por torneo, año o cantidad de partidos…"
          >
            {data.tournaments.length === 0 ? (
              <p className="text-sm text-slate-500">Sin torneos detectados.</p>
            ) : filteredTournaments.length === 0 ? (
              <EmptyFilterMessage query={filters.torneos} />
            ) : (
              <CardGrid>
                {filteredTournaments.map((item) => (
                  <RecordCard
                    key={`${item.year}-${item.name}`}
                    href={ligaMxTournamentDetailPath(item.year, item.name)}
                    title={item.name}
                    subtitle={`${item.year} · ${item.matchCount} partido(s)`}
                  />
                ))}
              </CardGrid>
            )}
          </AmericanFootballAccordion>

          <AmericanFootballAccordion
            title="Equipos"
            count={filteredTeams.length}
            filter={filters.equipos}
            onFilterChange={(value) => setFilter('equipos', value)}
            filterPlaceholder="Buscar por nombre, país o id…"
          >
            {data.teams.length === 0 ? (
              <p className="text-sm text-slate-500">Sin equipos registrados.</p>
            ) : filteredTeams.length === 0 ? (
              <EmptyFilterMessage query={filters.equipos} />
            ) : (
              <CardGrid>
                {filteredTeams.map((item) => (
                  <RecordCard
                    key={item.team.id}
                    href={ligaMxTeamDetailPath(item.team.id)}
                    title={item.team.name ?? item.team.id}
                    subtitle={item.hasOverride ? 'Con cambios locales' : item.team.country ?? undefined}
                    meta={truncateRecordId(item.team.id)}
                    logo={item.team.logo}
                  />
                ))}
              </CardGrid>
            )}
          </AmericanFootballAccordion>

          <AmericanFootballAccordion
            title="Partidos"
            count={filteredMatches.length}
            filter={filters.partidos}
            onFilterChange={(value) => setFilter('partidos', value)}
            filterPlaceholder="Buscar por equipos, jornada, fecha o id…"
          >
            {data.matches.length === 0 ? (
              <p className="text-sm text-slate-500">Sin partidos registrados.</p>
            ) : filteredMatches.length === 0 ? (
              <EmptyFilterMessage query={filters.partidos} />
            ) : (
              <CardGrid>
                {filteredMatches.map((item) => (
                  <RecordCard
                    key={`${item.seasonId}-${item.match.id}`}
                    href={ligaMxMatchDetailPath(item.match.id, {
                      seasonId: item.seasonId,
                      year: item.year,
                    })}
                    title={`${item.match.home.name ?? '—'} vs ${item.match.away.name ?? '—'}`}
                    subtitle={[item.match.round, formatDateTimeShort(item.match.date), item.isLocal ? 'Local' : null]
                      .filter(Boolean)
                      .join(' · ')}
                    meta={truncateRecordId(item.match.id)}
                  />
                ))}
              </CardGrid>
            )}
          </AmericanFootballAccordion>

          <AmericanFootballAccordion
            title="Clasificación"
            count={filteredStandings.length}
            filter={filters.clasificacion}
            onFilterChange={(value) => setFilter('clasificacion', value)}
            filterPlaceholder="Buscar por equipo, temporada, puntos o id…"
          >
            {data.standings.length === 0 ? (
              <p className="text-sm text-slate-500">Sin filas de clasificación.</p>
            ) : filteredStandings.length === 0 ? (
              <EmptyFilterMessage query={filters.clasificacion} />
            ) : (
              <CardGrid>
                {filteredStandings.map((item, index) => (
                  <RecordCard
                    key={`${item.year}-${item.standing.teamId ?? index}`}
                    href={ligaMxStandingDetailPath(item.standing.teamId ?? String(index), {
                      season: item.year,
                    })}
                    title={item.standing.teamName ?? 'Equipo'}
                    subtitle={`${item.year} · ${item.standing.points ?? 0} pts`}
                    meta={item.standing.teamId ? truncateRecordId(item.standing.teamId) : undefined}
                  />
                ))}
              </CardGrid>
            )}
          </AmericanFootballAccordion>
        </div>
      </DataSection>
    </div>
  );
}
